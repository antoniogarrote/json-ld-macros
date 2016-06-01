(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global, factory) {
	if (typeof define === 'function' && define.amd) {
		define('uri-templates', [], factory);
	} else if (typeof module !== 'undefined' && module.exports){
		module.exports = factory();
	} else {
		global.UriTemplate = factory();
	}
})(this, function () {
	var uriTemplateGlobalModifiers = {
		"+": true,
		"#": true,
		".": true,
		"/": true,
		";": true,
		"?": true,
		"&": true
	};
	var uriTemplateSuffices = {
		"*": true
	};
	var urlEscapedChars = /[:/&?#]/;

	function notReallyPercentEncode(string) {
		return encodeURI(string).replace(/%25[0-9][0-9]/g, function (doubleEncoded) {
			return "%" + doubleEncoded.substring(3);
		});
	}

	function isPercentEncoded(string) {
		string = string.replace(/%../g, '');
		return encodeURIComponent(string) === string;
	}

	function uriTemplateSubstitution(spec) {
		var modifier = "";
		if (uriTemplateGlobalModifiers[spec.charAt(0)]) {
			modifier = spec.charAt(0);
			spec = spec.substring(1);
		}
		var separator = "";
		var prefix = "";
		var shouldEscape = true;
		var showVariables = false;
		var trimEmptyString = false;
		if (modifier == '+') {
			shouldEscape = false;
		} else if (modifier == ".") {
			prefix = ".";
			separator = ".";
		} else if (modifier == "/") {
			prefix = "/";
			separator = "/";
		} else if (modifier == '#') {
			prefix = "#";
			shouldEscape = false;
		} else if (modifier == ';') {
			prefix = ";";
			separator = ";",
			showVariables = true;
			trimEmptyString = true;
		} else if (modifier == '?') {
			prefix = "?";
			separator = "&",
			showVariables = true;
		} else if (modifier == '&') {
			prefix = "&";
			separator = "&",
			showVariables = true;
		}

		var varNames = [];
		var varList = spec.split(",");
		var varSpecs = [];
		var varSpecMap = {};
		for (var i = 0; i < varList.length; i++) {
			var varName = varList[i];
			var truncate = null;
			if (varName.indexOf(":") != -1) {
				var parts = varName.split(":");
				varName = parts[0];
				truncate = parseInt(parts[1]);
			}
			var suffices = {};
			while (uriTemplateSuffices[varName.charAt(varName.length - 1)]) {
				suffices[varName.charAt(varName.length - 1)] = true;
				varName = varName.substring(0, varName.length - 1);
			}
			var varSpec = {
				truncate: truncate,
				name: varName,
				suffices: suffices
			};
			varSpecs.push(varSpec);
			varSpecMap[varName] = varSpec;
			varNames.push(varName);
		}
		var subFunction = function (valueFunction) {
			var result = "";
			var startIndex = 0;
			for (var i = 0; i < varSpecs.length; i++) {
				var varSpec = varSpecs[i];
				var value = valueFunction(varSpec.name);
				if (value == null || (Array.isArray(value) && value.length == 0) || (typeof value == 'object' && Object.keys(value).length == 0)) {
					startIndex++;
					continue;
				}
				if (i == startIndex) {
					result += prefix;
				} else {
					result += (separator || ",");
				}
				if (Array.isArray(value)) {
					if (showVariables) {
						result += varSpec.name + "=";
					}
					for (var j = 0; j < value.length; j++) {
						if (j > 0) {
							result += varSpec.suffices['*'] ? (separator || ",") : ",";
							if (varSpec.suffices['*'] && showVariables) {
								result += varSpec.name + "=";
							}
						}
						result += shouldEscape ? encodeURIComponent(value[j]).replace(/!/g, "%21") : notReallyPercentEncode(value[j]);
					}
				} else if (typeof value == "object") {
					if (showVariables && !varSpec.suffices['*']) {
						result += varSpec.name + "=";
					}
					var first = true;
					for (var key in value) {
						if (!first) {
							result += varSpec.suffices['*'] ? (separator || ",") : ",";
						}
						first = false;
						result += shouldEscape ? encodeURIComponent(key).replace(/!/g, "%21") : notReallyPercentEncode(key);
						result += varSpec.suffices['*'] ? '=' : ",";
						result += shouldEscape ? encodeURIComponent(value[key]).replace(/!/g, "%21") : notReallyPercentEncode(value[key]);
					}
				} else {
					if (showVariables) {
						result += varSpec.name;
						if (!trimEmptyString || value != "") {
							result += "=";
						}
					}
					if (varSpec.truncate != null) {
						value = value.substring(0, varSpec.truncate);
					}
					result += shouldEscape ? encodeURIComponent(value).replace(/!/g, "%21"): notReallyPercentEncode(value);
				}
			}
			return result;
		};
		var guessFunction = function (stringValue, resultObj, strict) {
			if (prefix) {
				stringValue = stringValue.substring(prefix.length);
			}
			if (varSpecs.length == 1 && varSpecs[0].suffices['*']) {
				var varSpec = varSpecs[0];
				var varName = varSpec.name;
				var arrayValue = varSpec.suffices['*'] ? stringValue.split(separator || ",") : [stringValue];
				var hasEquals = (shouldEscape && stringValue.indexOf('=') != -1);	// There's otherwise no way to distinguish between "{value*}" for arrays and objects
				for (var i = 1; i < arrayValue.length; i++) {
					var stringValue = arrayValue[i];
					if (hasEquals && stringValue.indexOf('=') == -1) {
						// Bit of a hack - if we're expecting "=" for key/value pairs, and values can't contain "=", then assume a value has been accidentally split
						arrayValue[i - 1] += (separator || ",") + stringValue;
						arrayValue.splice(i, 1);
						i--;
					}
				}
				for (var i = 0; i < arrayValue.length; i++) {
					var stringValue = arrayValue[i];
					if (shouldEscape && stringValue.indexOf('=') != -1) {
						hasEquals = true;
					}
					var innerArrayValue = stringValue.split(",");
					if (innerArrayValue.length == 1) {
						arrayValue[i] = innerArrayValue[0];
					} else {
						arrayValue[i] = innerArrayValue;
					}
				}

				if (showVariables || hasEquals) {
					var objectValue = resultObj[varName] || {};
					for (var j = 0; j < arrayValue.length; j++) {
						var innerValue = stringValue;
						if (showVariables && !innerValue) {
							// The empty string isn't a valid variable, so if our value is zero-length we have nothing
							continue;
						}
						if (typeof arrayValue[j] == "string") {
							var stringValue = arrayValue[j];
							var innerVarName = stringValue.split("=", 1)[0];
							var stringValue = stringValue.substring(innerVarName.length + 1);
							if (shouldEscape) {
								if (strict && !isPercentEncoded(stringValue)) {
									return;
								}
								stringValue = decodeURIComponent(stringValue);
							}
							innerValue = stringValue;
						} else {
							var stringValue = arrayValue[j][0];
							var innerVarName = stringValue.split("=", 1)[0];
							var stringValue = stringValue.substring(innerVarName.length + 1);
							if (shouldEscape) {
								if (strict && !isPercentEncoded(stringValue)) {
									return;
								}
								stringValue = decodeURIComponent(stringValue);
							}
							arrayValue[j][0] = stringValue;
							innerValue = arrayValue[j];
						}
						if (shouldEscape) {
							if (strict && !isPercentEncoded(innerVarName)) {
								return;
							}
							innerVarName = decodeURIComponent(innerVarName);
						}

						if (objectValue[innerVarName] !== undefined) {
							if (Array.isArray(objectValue[innerVarName])) {
								objectValue[innerVarName].push(innerValue);
							} else {
								objectValue[innerVarName] = [objectValue[innerVarName], innerValue];
							}
						} else {
							objectValue[innerVarName] = innerValue;
						}
					}
					if (Object.keys(objectValue).length == 1 && objectValue[varName] !== undefined) {
						resultObj[varName] = objectValue[varName];
					} else {
						resultObj[varName] = objectValue;
					}
				} else {
					if (shouldEscape) {
						for (var j = 0; j < arrayValue.length; j++) {
							var innerArrayValue = arrayValue[j];
							if (Array.isArray(innerArrayValue)) {
								for (var k = 0; k < innerArrayValue.length; k++) {
									if (strict && !isPercentEncoded(innerArrayValue[k])) {
										return;
									}
									innerArrayValue[k] = decodeURIComponent(innerArrayValue[k]);
								}
							} else {
								if (strict && !isPercentEncoded(innerArrayValue)) {
									return;
								}
								arrayValue[j] = decodeURIComponent(innerArrayValue);
							}
						}
					}

					if (resultObj[varName] !== undefined) {
						if (Array.isArray(resultObj[varName])) {
							resultObj[varName] = resultObj[varName].concat(arrayValue);
						} else {
							resultObj[varName] = [resultObj[varName]].concat(arrayValue);
						}
					} else {
						if (arrayValue.length == 1 && !varSpec.suffices['*']) {
							resultObj[varName] = arrayValue[0];
						} else {
							resultObj[varName] = arrayValue;
						}
					}
				}
			} else {
				var arrayValue = (varSpecs.length == 1) ? [stringValue] : stringValue.split(separator || ",");
				var specIndexMap = {};
				for (var i = 0; i < arrayValue.length; i++) {
					// Try from beginning
					var firstStarred = 0;
					for (; firstStarred < varSpecs.length - 1 && firstStarred < i; firstStarred++) {
						if (varSpecs[firstStarred].suffices['*']) {
							break;
						}
					}
					if (firstStarred == i) {
						// The first [i] of them have no "*" suffix
						specIndexMap[i] = i;
						continue;
					} else {
						// Try from the end
						for (var lastStarred = varSpecs.length - 1; lastStarred > 0 && (varSpecs.length - lastStarred) < (arrayValue.length - i); lastStarred--) {
							if (varSpecs[lastStarred].suffices['*']) {
								break;
							}
						}
						if ((varSpecs.length - lastStarred) == (arrayValue.length - i)) {
							// The last [length - i] of them have no "*" suffix
							specIndexMap[i] = lastStarred;
							continue;
						}
					}
					// Just give up and use the first one
					specIndexMap[i] = firstStarred;
				}
				for (var i = 0; i < arrayValue.length; i++) {
					var stringValue = arrayValue[i];
					if (!stringValue && showVariables) {
						// The empty string isn't a valid variable, so if our value is zero-length we have nothing
						continue;
					}
					var innerArrayValue = stringValue.split(",");
					var hasEquals = false;

					if (showVariables) {
						var stringValue = innerArrayValue[0]; // using innerArrayValue
						var varName = stringValue.split("=", 1)[0];
						var stringValue = stringValue.substring(varName.length + 1);
						innerArrayValue[0] = stringValue;
						var varSpec = varSpecMap[varName] || varSpecs[0];
					} else {
						var varSpec = varSpecs[specIndexMap[i]];
						var varName = varSpec.name;
					}

					for (var j = 0; j < innerArrayValue.length; j++) {
						if (shouldEscape) {
							if (strict && !isPercentEncoded(innerArrayValue[j])) {
								return;
							}
							innerArrayValue[j] = decodeURIComponent(innerArrayValue[j]);
						}
					}

					if ((showVariables || varSpec.suffices['*'])&& resultObj[varName] !== undefined) {
						if (Array.isArray(resultObj[varName])) {
							resultObj[varName] = resultObj[varName].concat(innerArrayValue);
						} else {
							resultObj[varName] = [resultObj[varName]].concat(innerArrayValue);
						}
					} else {
						if (innerArrayValue.length == 1 && !varSpec.suffices['*']) {
							resultObj[varName] = innerArrayValue[0];
						} else {
							resultObj[varName] = innerArrayValue;
						}
					}
				}
			}
			return 1;
		};
		return {
			varNames: varNames,
			prefix: prefix,
			substitution: subFunction,
			unSubstitution: guessFunction
		};
	}

	function UriTemplate(template) {
		if (!(this instanceof UriTemplate)) {
			return new UriTemplate(template);
		}
		var parts = template.split("{");
		var textParts = [parts.shift()];
		var prefixes = [];
		var substitutions = [];
		var unSubstitutions = [];
		var varNames = [];
		while (parts.length > 0) {
			var part = parts.shift();
			var spec = part.split("}")[0];
			var remainder = part.substring(spec.length + 1);
			var funcs = uriTemplateSubstitution(spec);
			substitutions.push(funcs.substitution);
			unSubstitutions.push(funcs.unSubstitution);
			prefixes.push(funcs.prefix);
			textParts.push(remainder);
			varNames = varNames.concat(funcs.varNames);
		}
		this.fill = function (valueFunction) {
			if (valueFunction && typeof valueFunction !== 'function') {
				var value = valueFunction;
				valueFunction = function (varName) {
					return value[varName];
				};
			}

			var result = textParts[0];
			for (var i = 0; i < substitutions.length; i++) {
				var substitution = substitutions[i];
				result += substitution(valueFunction);
				result += textParts[i + 1];
			}
			return result;
		};
		this.fromUri = function (substituted, options) {
			options = options || {};
			var result = {};
			for (var i = 0; i < textParts.length; i++) {
				var part = textParts[i];
				if (substituted.substring(0, part.length) !== part) {
					return /*undefined*/;
				}
				substituted = substituted.substring(part.length);
				if (i >= textParts.length - 1) {
					// We've run out of input - is there any template left?
					if (substituted == "") {
						break;
					} else {
						return /*undefined*/;
					}
				}

				var prefix = prefixes[i];
				if (prefix && substituted.substring(0, prefix.length) !== prefix) {
					// All values are optional - if we have a prefix and it doesn't match, move along
					continue;
				}

				// Find the next part to un-substitute
				var nextPart = textParts[i + 1];
				var offset = i;
				while (true) {
					if (offset == textParts.length - 2) {
						var endPart = substituted.substring(substituted.length - nextPart.length);
						if (endPart !== nextPart) {
							return /*undefined*/;
						}
						var stringValue = substituted.substring(0, substituted.length - nextPart.length);
						substituted = endPart;
					} else if (nextPart) {
						var nextPartPos = substituted.indexOf(nextPart);
						var stringValue = substituted.substring(0, nextPartPos);
						substituted = substituted.substring(nextPartPos);
					} else if (prefixes[offset + 1]) {
						var nextPartPos = substituted.indexOf(prefixes[offset + 1]);
						if (nextPartPos === -1) nextPartPos = substituted.length;
						var stringValue = substituted.substring(0, nextPartPos);
						substituted = substituted.substring(nextPartPos);
					} else if (textParts.length > offset + 2) {
						// If the separator between this variable and the next is blank (with no prefix), continue onwards
						offset++;
						nextPart = textParts[offset + 1];
						continue;
					} else {
						var stringValue = substituted;
						substituted = "";
					}
					break;
				}
				if (!unSubstitutions[i](stringValue, result, options.strict)) {
					return /*undefined*/;
				}
			}
			return result;
		}
		this.varNames = varNames;
		this.template = template;
	}
	UriTemplate.prototype = {
		toString: function () {
			return this.template;
		},
		fillFromObject: function (obj) {
			return this.fill(obj);
		},
		test: function (uri, options) {
			return !!this.fromUri(uri, options)
		}
	};

	return UriTemplate;
});

},{}],2:[function(require,module,exports){
var uriTemplates = require('uri-templates');


var JSONLDMacro = {};

JSONLDMacro.VERSION = "0.0.6";

JSONLDMacro.NS = "http://jsonld-macros.org/vocab#";

var jldmcontext = {
    "jldm": JSONLDMacro.NS
};

var jldm = function(path) {
    return "jldm:"+path;
};

// Default behaviour
JSONLDMacro.behaviour = "loose";

// Map of registered functions
JSONLDMacro.registeredFunctions = {};

// Registered functions namespaces
JSONLDMacro.registeredFunctionsNS = {};

JSONLDMacro.evalApplyFn = function(fnText, argument, input, context) {
    var f;
    eval("f = "+fnText);

    return f(argument, input, context);
};

/**
 * @doc
 * Transforms a document obtained from a URL using
 * the registered API transformations
 */
JSONLDMacro.resolve = function(url, document) {
    url = url.split("?")[0];

    var urlExp, transformation;
    for(var i=0; i<this.apiPaths.length; i++) {
	urlExp = this.apiPaths[i][0];
	transformation = this.apiPaths[i][1];
	if(urlExp.test(url)) {
	    return this.applyTransformation(transformation,document);
	}
    }

    return null;
};

/**
 * @doc
 * Transforms a JSON document with the provided transformation
 * specification, compiling the specification before.
 */
JSONLDMacro.transform = function(specification, document) {
    var transformation = this.buildTransformation(specification);
    return this.applyTransformation(transformation, document);
};

JSONLDMacro.reservedPrefix = "__transformation__";

/**
 * @doc
 * Applies a transformation stored defined as JSON document
 */
JSONLDMacro.applyTransformation = function(transformation, document) {
    var counter = 0;
    var prefix = JSONLDMacro.reservedPrefix+(new Date()).getTime()+"__";
    var mapping = {};
    var transformationMapping = {};
    var node, nodeInfo, nodeParent, pathSelector, transformationFn, selectedNodes, nodeCounter, transformationFns, transformations;
    var removeTransformation, nsTransformation, onlyTransformation, explodeTransformation, compactTransformation;

    for(var i=0; i<transformation.length; i++) {
	pathSelector = transformation[i][0];
	transformationFns = transformation[i][1];


	selectedNodes = pathSelector(document);
	for(var j=0; j<selectedNodes.length; j++) {
	    nodeCounter = selectedNodes[j].node[prefix];
	    if(nodeCounter == null)  {
		selectedNodes[j].node[prefix] = counter;
		mapping[counter] = selectedNodes[j];
		transformationMapping[counter] = [];
		nodeCounter = counter;
		counter++;
	    }
	    transformationMapping[nodeCounter].push(transformationFns);
	}
    }

    for(var c in mapping) {
	nodeInfo = mapping[c];
        node = nodeInfo.node;
        nodeParent = nodeInfo.parent;
	transformations = transformationMapping[c];

	for(i=0; i<transformations.length; i++) {
	    transformation = transformations[i];
            explodeTransformation = transformation["@explode"];
            compactTransformation = transformation["@compact"];
	    removeTransformation = transformation['@remove'];
	    onlyTransformation = transformation['@only'];
	    nsTransformation = transformation['@ns'];

            if(explodeTransformation != null) {
                var transformed = explodeTransformation(node);
                transformed[prefix] = node[prefix];
                var found = false;
                for(var p in nodeParent) {
                    if(nodeParent[p] == node) {
                        nodeParent[p] = transformed;
                        found = true;
                    }
                }
                if(found) {
                    node = transformed;
                    nodeInfo.node = node;
                } else {
                    throw("Cannot find exploded node in parent node");
                }
            }

	    for(var name in transformation) {
		if(name !== '@remove' &&
		   name !== '@only' &&
		   name !== '@ns') {
		    transformationFn = transformation[name];
		    transformationFn(node);
		}
	    }
	    if(removeTransformation != null)
		removeTransformation(node);

	    if(onlyTransformation != null)
		onlyTransformation(node);

	    if(nsTransformation != null)
		nsTransformation(node);

            if(compactTransformation != null) {
                var compacted = compactTransformation(node);
                var found = false;
                for(var p in nodeParent) {
                    if(nodeParent[p] == node) {
                        nodeParent[p] = compacted;
                        found = true;
                    }
                }
                if(found) {
                    node = compacted;
                    nodeInfo.node = node;
                } else {
                    throw("Cannot find compacted node in parent node");
                }
            }

	}
	delete node[prefix];
	if(JSONLDMacro.behaviour === "loose") {
	    for(var p in node) {
		if(node[p] == null)
		    delete node[p];
	    }
	}
    }

    return document;
};

/**
 * @doc
 *  Returns a function that will retrieve a value from
 *  a json object according to the path expression passed as a
 *  parameter
 */
JSONLDMacro.pathParser = function(pathExpression) {
    var parts = pathExpression.split(".");
    if(pathExpression[pathExpression.length-1] === '.')
	parts.pop();

    if(parts[0] !== '$' && parts[0] !== '$[*]') {
	throw "Error parsing path. Path must start with the root object '$'";
    } else {
	parts[0] = '$';
    }

    return function(obj, f) {
	var nextSelection, val, selectArray;
	if (obj.constructor === Array) {
            var selection = [];
            for(var i=0; i<obj.length; i++) {
                selection.push({parent:null, node:obj[i]});
            }
        } else {
            var selection = [{parent:null, node:obj}];
        }
	var currentCounter = 0;
        var i,p = 0;

	while(currentCounter<parts.length) {
	    var currentPart = parts[currentCounter];

	    switch(currentPart) {
	    case '$':
		if(currentCounter === 0) {
		    nextSelection = selection;
		} else {
		    throw "Wrong path. Root object in the middle of the path expression";
		}
		break;
	    case '*':
		nextSelection = [];
		for(i=0; i<selection.length; i++) {
                    var node = selection[i].node;
		    for(p in node) {
			nextSelection.push({parent:node, node: node[p]});
		    }
		}
		break;
	    case '':
		nextSelection = [];
		for(i=0; i<selection.length; i++) {
		    nextSelection = nextSelection.concat(JSONLDMacro._childrenRecursive(selection[i].parent, selection[i].node));
		}
		break;
	    default:
		nextSelection = [];
		if(currentPart.indexOf("[*]") === currentPart.length-3) {
		    currentPart = currentPart.split("[*]")[0];
		    selectArray = true;
		} else {
		    selectArray = false;
		}
		for(i=0; i<selection.length; i++) {
                    var node = selection[i].node;
		    var val = node[currentPart];
		    if(val !== undefined) {
			if(selectArray && val.constructor === Array) {
                            var nextSelectionArray = [];
                            for(i=0; i<val.length; i++) {
                                nextSelectionArray.push({parent:node.node, node:val[i]});
                            }
			    nextSelection = nextSelection.concat(nextSelectionArray);
			} else {
			    nextSelection.push({parent:node, node:val});
			}
			if(currentCounter === parts.length-1 && f!=null) {
			    if(selectArray && val.constructor === Array) {
				for(var j=0; j<val.length; j++) {
				    f(val[j], selection[i].node);
				}
			    } else {
				f(val, selection[i].node);
			    }
			}
		    }
		}

		if(currentCounter === parts.length-1 && f!=null)
		    return nextSelection;

	    }
	    currentCounter++;
	    selection = nextSelection;
	}

	if(f != null) {
	    for(i=0; i<selection.length; i++) {
		f(selection[i].node, null);
	    }
	}

	return selection;
    };
};

/**
 * @doc
 * Recursively collect all the children objects of a
 * node passed as the function argument.
 */
JSONLDMacro._childrenRecursive = function(parent, obj) {
    var children = [];
    var pending = [{parent:parent, node:obj}];
    var next;

    while(pending.length != 0) {
	next = pending.pop();
	children.push(next);
	for(var p in next.node) {
	    if(typeof(next.node[p]) === 'object' && next.node[p].constructor === Object) {
		pending.push({parent:next.node, node:next.node[p]});
	    } else if(typeof(next.node[p]) === 'object' && next.node[p].constructor === Array) {
                var children = [];
                for(var i=0; i<next.node[p].length; i++) {
                    children.push({parent:next.node, node:next.node[p][i]});
                }
		pending = pending.concat(children);
	    }
	}
    }

    return children;
};


/**
 * @doc
 * Build a transformation from a JSON object containing
 * transformation functions descriptions in the values
 * and paths in the properties
 */
JSONLDMacro.buildTransformation = function(specification) {
    var pathParser, transformation, transformationSpecification, nodeTransformation, pathSelector, transformationFn;

    transformation = [];
    for(var path in specification) {
	pathSelector = this.pathParser(path);

	transformationSpecification = specification[path];
	nodeTransformation = {};
	for(var name in transformationSpecification) {
	    transformationFn = this.buildTransformationFunction(name ,
								transformationSpecification[name]);
	    nodeTransformation[name] = transformationFn;
	}
	transformation.push([pathSelector, nodeTransformation]);
    }

    return transformation;
};

/**
 * @doc
 * Builds a function that encodes the declarative logic
 * of a transformation rule
 */
JSONLDMacro.buildTransformationFunction = function(name, body) {
    switch(name) {

    case '@context':
	return this._buildContextTransformation(body);

    case '@id':
	return this._buildIDGenTransformation(body);

    case '@type':
	return this._buildTypeGenTransformation(body);

    case '@add':
	return this._buildAddTransformation(body);

    case '@remove':
	return this._buildRemoveTransformation(body);

    case '@only':
	return this._buildOnlyTransformation(body);

    case '@ns':
	return this._buildGenNsTransformation(body);

    case '@transform':
	return this._buildTransformTransformation(body);

    case '@explode':
        return this._buildExplodeTransformation(body);

    case '@compact':
        return this._buildCompactTransformation(body);

    default:
	throw("Unknown transformation: "+name);
    }
};

JSONLDMacro._buildExplodeTransformation = function(specification) {
    if(typeof(specification) === "string") {
        var property = specification;
        return function(value) {
            var node = {};
            node[property] = value;
            return node;
        };
    } else {
        throw "@explode rule accepts only a string as the body of the specification";
    }
};

JSONLDMacro._buildCompactTransformation = function(specification) {
    if(typeof(specification) === "string") {
        var property = specification;
        return function(value) {
            return value[property];
        };
    } else {
        throw "@compact rule accepts only a string as the body of the specification";
    }
};

/**
 * @doc
 * Builds a transformation for a property in a JSON object
 */
JSONLDMacro._buildTransformTransformation = function(specifications) {
    var specification;
    for(var p in specifications) {
	specification = specifications[p];
	if(typeof(specification) === 'string') {
	    specifications[p] = (function(p,v) { return function(obj) { obj[p] = v; return obj; }; })(p,specification);
	} else {

	    var operations = specification;
	    if(typeof(operations) === 'object' && operations.constructor === Object)
		operations = [operations];

	    specifications[p] =  (function(p, operations){
		return function(obj) {
		    var id;
		    try {
			for(var i=0; i<operations.length; i++) {
			    if(id!=null && id.constructor === Array) {
				for(var j=0; j<id.length; j++) {
				    id[j] = JSONLDMacro.applyOperation(operations[i], id[j], obj);
				}
			    } else {
				id = JSONLDMacro.applyOperation(operations[i], id, obj);
			    }
			}
		    } catch (e) {
			if(JSONLDMacro.behaviour === 'loose') {
			    if(typeof(console) != undefined)
				console.log("Error applying function at property "+p+" -> "+e);
			    id = null;
			} else {
			    throw(e);
			}
		    }

		    obj[p] = id;
		    return obj;
		};
	    })(p, operations);

	}
    }


    return function(obj) {
	var tmp = obj;
	for(var p in specifications) {
	    tmp = specifications[p](tmp);
	}

	return tmp;
    };
};

/**
 * @doc
 * Builds a transformation that add namespaces to a JSON object
 */
JSONLDMacro._buildGenNsTransformation = function(keys) {
    var defaultNs = keys['ns:default'] || "";
    var omit = keys['ns:omit'] || [];
    delete keys['ns:omit'];
    var toOmit = {};
    for(var i=0; i<omit.length; i++) {
	toOmit[omit[i]] = true;
    }

    var ns = keys['ns:append'];
    delete keys['ns:append'];
    var mapping = {};
    var props;
    for(var prefix in ns) {
	props = ns[prefix];
	if(typeof(props) === 'string')
	    props = [props];
	for(var i=0; i<props.length; i++) {
	    mapping[props[i]] = prefix;
	}
    }

    var replacements = keys['ns:replace'];
    delete keys['ns:replace'];
    var replacementsMapping = {};
    var dst;
    for(var prop in replacements) {
	dst = replacements[prop];

	replacementsMapping[prop] = dst;
    }


    return function(obj) {
	var newp;
	for(var p in obj) {
	    if(toOmit[p] === true)
		continue;
	    if(p.indexOf(JSONLDMacro.reservedPrefix)===0)
		continue;
	    if(p.indexOf('@') === 0)
		continue;

	    if(mapping[p] != null) {
		newp = mapping[p]+":"+p;
		if(obj[newp] == null) {
		    obj[newp] = obj[p];
		} else {
		    if(obj[newp].constructor === Array) {
			obj[newp].push(ojb[p]);
		    } else {
			obj[newp] = [obj[ewp]];
			obj[newp].push(ojb[p]);
		    }
		}
		delete obj[p];
	    } else if(replacementsMapping[p] != null) {
		newp = replacementsMapping[p];
		if(obj[newp] == null) {
		    obj[newp] = obj[p];
		} else {
		    if(obj[newp].constructor === Array) {
			obj[newp].push(obj[p]);
		    } else {
			obj[newp] = [obj[newp]];
			obj[newp].push(obj[p]);
		    }
		}
		delete obj[p];
	    } else {
		newp = defaultNs+":"+p;
		if(newp != p) {
		    if(obj[newp] == null) {
			obj[newp] = obj[p];
		    } else {
			if(obj[newp].constructor === Array) {
			    obj[newp].push(obj[p]);
			} else {
			    obj[newp] = [obj[newp]];
			    obj[newp].push(obj[p]);
			}
		    }
		    delete obj[p];
		}
	    }

	}
	return obj;
    };
};

/**
 * @doc
 * Builds a transformation that removes properties from the provided JSON object
 */
JSONLDMacro._buildRemoveTransformation = function(body) {
    if(typeof(body) === 'string') {
	body = [body];
    }

    return function(obj) {
	for(var i=0; i<body.length; i++) {
	    delete obj[body[i]];
	}

	return obj;
    };
};

/**
 * @doc
 * Builds a transformation that adds properties from the provided JSON object
 */
JSONLDMacro._buildAddTransformation = function(body) {
    return function(obj) {
	for(var p in body) {
	    obj[p] = body[p];
	}
	return obj;
    };
};

/**
 * @doc
 * Builds a transformation that removes properties from the provided JSON object
 */
JSONLDMacro._buildOnlyTransformation = function(body) {
    var prop = {};

    if(typeof(body) === 'string') {
	prop[body] = true;
    } else {
	for(var i=0; i<body.length; i++) {
	    prop[body[i]] = true;
	}
    }

    return function(obj) {
	var toDelete = [];

	for(var p in obj) {
	    if(p[0] !== '@') {
		if(prop[p] == null) {
		    delete obj[p];
		}
	    }
	}

	return obj;
    };
};

/**
 * @doc
 * Builds a transformation function that generates the RDF node type
 */
JSONLDMacro._buildTypeGenTransformation = function(body) {
    if(typeof(body) === 'string') {
	return function(obj) { obj['@type'] = body; return obj; };
    }
    var operations = body;
    if(typeof(operations) === 'object' && operations.constructor === Object)
	operations = [operations];

    var foundOperation = false;
    for(var i=0; i<operations.length; i++) {
	if(typeof(operations[i]) === 'object') {
	    foundOperation = true;
	    break;
	}
    }

    if(foundOperation === true) {
	return function(obj) {
	    var type;
	    for(var i=0; i<operations.length; i++) {
		type = JSONLDMacro.applyOperation(operations[i], type, obj);
	    }

	    obj['@type'] = type;
	    return obj;
	};
    } else {
	return function(obj){ obj['@type'] = operations; return obj; };
    }
};


/**
 * @doc
 * Builds a transformation function that generates the RDF node ID
 */
JSONLDMacro._buildIDGenTransformation = function(body) {
    if(typeof(body) === 'string') {
	return function(obj) { obj['@id'] = body; return obj; };
    }
    var operations = body;
    if(typeof(operations) === 'object' && operations.constructor === Object)
	operations = [operations];

    return function(obj) {
	try {
	    var id;
	    for(var i=0; i<operations.length; i++) {
		id = JSONLDMacro.applyOperation(operations[i], id, obj);
	    }

	    obj['@id'] = id;
	} catch (e) {
	    if(JSONLDMacro.behaviour === 'strict') {
		throw e;
	    } else {
		if(typeof(console) !== 'undefined')
		    console.log("Error applyting transformation for @id rule: "+e);
	    }
	}
	return obj;
    };
};

/**
 * @doc
 * Transforms the context of an JSON object merging it with the context
 * passed as an argument
 */
JSONLDMacro._buildContextTransformation = function(body) {
    return function(obj) {
	var found;
	var cloned = JSON.parse(JSON.stringify(body));
	var oldContext = obj['@context'] || {};

	if(typeof(oldContext) === 'string') {
            // ** old context is a string

	    if(typeof(cloned) === 'string') {
		// string - string
		obj['@context'] = [oldContext, cloned];
	    } else if(typeof(cloned) === 'object' && cloned.constructor === Array) {
		// string - array
		found = false;
		for(var i=0; i<cloned.length; i++) {
		    if(cloned[i] === oldContext) {
			found = true;
			break;
		    }
		}
		if(!found) {
		    cloned.push(oldContext);
		    obj['@context'] = cloned;
		}
	    } else {
		// string - object
		obj['@context'] = [cloned, oldContext];
	    }
	} else if(typeof(oldContext) === 'object' && oldContext.constructor === Array) {
            // ** old context is an array
	    if(typeof(cloned) === 'string') {
		// array - string
		obj['@context'] = [cloned, oldContext];
	    } else if(typeof(cloned) === 'object' && cloned.constructor === Array) {
		// array - array
		var obja = null;
		var objb = null;
		var union = [];
		for(var i=0; i<cloned.length; i++) {
		    if(typeof(cloned[i]) === 'object') {
			obja = cloned[i];
		    }  else {
			union.push(cloned[i]);
		    }
		}
		for(var i=0; i<oldContext.length; i++) {
		    if(typeof(oldContext[i]) === 'object') {
			obja = oldContext[i];
		    }  else {
			union.push(oldContext[i]);
		    }
		}
		if(obja == null && objb != null) {
		    union.push(objb);
		} else if(obja != null && objb == null) {
		    union.push(obja);
		} else if(obja != null && objb != null){
		    for (var p in obja) {
			objb[p] = obja[p];
		    }
		    union.push(objb);
		}
		obj['@context'] = union;
	    } else {
		// array - object
		var newContext = [];
		var objContext = null;
		for(var i=0; i<oldContext.length; i++) {
		    if(typeof(oldContext[i]) === 'string') {
			newContext.push(oldContext[i]);
		    } else {
			objContext = oldContext[i];
			for(var p in cloned) {
			    objContext[p] = cloned[p];
			}
			newContext.push(objContext);
		    }
		}
		if(objContext == null)
		    newContext.push(cloned);
		obj['@context'] = newContext;
	    }
	} else {
	    // ** old context is an object

	    if(typeof(cloned) === 'string') {
		// object - string
		obj['@context'] = [cloned, oldContext];
	    } else if(typeof(cloned) === 'object' && cloned.constructor === Array) {
		// object - array
		var newContext = [];
		var objContext = null;
		for(var i=0; i<cloned.length; i++) {
		    if(typeof(cloned[i]) === 'string') {
			newContext.push(cloned[i]);
		    } else {
			objContext = oldContext;
			for(var p in cloned[i]) {
			    objContext[p] = cloned[i][p];
			}
			newContext.push(objContext);
		    }
		}
		if(objContext == null)
		    newContext.push(oldContext);
		obj['@context'] = newContext;
	    } else {
		// object -object
		var objContext = oldContext;
		for(var p in cloned) {
		    objContext[p] = cloned[p];
		}
		obj['@context'] = objContext;
	    }
	}

	return obj;
    };

}; // end of _buildContextTransformation


JSONLDMacro.applyOperation = function(operation, input, context) {
    if(operation['f:valueof']!=null) {
	return context[operation['f:valueof']];
    } else if(operation['f:defaultvalue'] != null) {
	return operation['f:defaultvalue'];
    } else if(operation['f:select']!=null) {
	return input[operation['f:select']];
    } else if(operation['f:prefix']!=null) {
	return operation['f:prefix'] + input;
    } else if(operation['f:urlencode']!=null) {
	return escape(input);
    } else if(operation['f:basetemplateurl'] != null) {
        return input.split("{")[0];
    } else if(operation['f:apply']!=null) {
	var src = operation['f:apply'];
	return (new Function( "with(this) { return " + operation['f:apply'] + "}")).call(input);
    } else {
	var prefix = null;

	for(var k in operation)
	    prefix = k;

	if(prefix!=null) {
	    if(prefix.indexOf(":") != -1) {
		try{
		    var parts = prefix.split(":");
		    var ns = JSONLDMacro.registeredFunctionsNS[parts[0]];
		    var functionName = ns+parts[1];

		    var functionText = JSONLDMacro.registeredFunctions[functionName];

		    return JSONLDMacro.evalApplyFn(functionText, operation[k], input, context);
		} catch(e) {
		    throw "Error applying function "+prefix;
		}
	    } else {
		throw "Uknown operation to apply: "+JSON.stringify(operation);
	    }
	} else {
	    throw "Uknown operation to apply: "+JSON.stringify(operation);
	}
    }
};


JSONLDMacro.registerFunctions = function(functionMapping) {
    var namespaces = {};

    for(var k  in functionMapping) {
	if(namespaces[k] == null) {
	    if(k.indexOf(":") != null) {
		var parts = k.split(":");
		var ns = parts[0];
		var suffix = parts[1];
		var mapped = functionMapping[ns];

		if(mapped != null) {
		    namespaces[ns] = mapped;
		    var functionName = mapped+suffix;
		    JSONLDMacro.registeredFunctionsNS[ns] = mapped;
		    JSONLDMacro.registeredFunctions[functionName] = functionMapping[k];
		} else {
		    throw "Namespace "+ns+" for function "+k+" not found";
		}
	    }
	}
    }

};

// Testing URLs we don't accept matches including slashes
// with the exception of {*} bindings.
var testUrl = function(template, value) {
    var res = template.fromUri(value);
    if(res == null) {
        return false;
    } else {
        for(var p in res) {
            if(p !== "" && res[p].indexOf("/") !== -1) {
                return false;
            }
        }
        return true;
    }
};

JSONLDMacro.parseUrlPath = function(urlPath) {
    var template = uriTemplates(urlPath);
    if(template != null) {
        template._test = template.test;
        template.test = function(url) {
            return testUrl(template,url);
        };
        return template;
    } else {
        return null;
    }
};

JSONLDMacro.apiPaths = [];
JSONLDMacro.apiRegister = [];

/**
 * @doc
 * Registers an API in the library
 */
JSONLDMacro.registerAPI = function(apiDefinition) {
    if(apiDefinition["@declare"] != null) {
	this.registerFunctions(apiDefinition["@declare"]);
	delete apiDefinition["@declare"];
    }

    var url, transformation, templates;
    for(var p in apiDefinition) {
	transformation = this.buildTransformation(apiDefinition[p]);
	if(p.indexOf("\\n")!=-1) {
            templates = [];
	    p = p.split("\\n");
	    for(var i=0; i<p.length; i++) {
                var template = p[i].replace(/\s/g,"");
		url = this.parseUrlPath(template);
                templates.push(template);
		this.apiPaths.push([url, transformation]);
	    }
            this.apiRegister.push({templates: templates, specification: apiDefinition[p]});
	} else {
	    url = this.parseUrlPath(p);
	    this.apiPaths.push([url, transformation]);
            this.apiRegister.push({templates: [p], specification:apiDefinition[p]});
	}
    }
};

/**
 * @doc
 * Clears all the registered APIs
 */
JSONLDMacro.clearAPIs = function() {
    this.apiPaths = [];
    this.apiRegister = [];
};


/**
 * @doc
 * Wraps the network transport fo a RDFStore-js instance
 * to automatically transform incoming HTTP JSON data
 * using the defined APIs
 */
JSONLDMacro.wrapRDFStoreJSNetworkTransport = function(store) {
    nt = store.getNetworkTransport();
    var macroNetworkTransport = {
	load: function(uri,graph, callback) {
	    nt.load(uri, graph, function(success, results){
		if(success) {
		    var mime = results["headers"]["Content-Type"] || results["headers"]["content-type"];
		    var data = results['data'];

		    if(mime.indexOf('application/json') != -1) {
			var transformed = macro.resolve(uri, JSON.parse(data));
			if(transformed != null) {
			    results['data'] = JSON.stringify(transformed);
			    callback(success, results);
			} else {
			    callback(success, results);
			}
		    } else {
			callback(success, results);
		    }
		} else {
		    callback(success, results);
		}
	    });
	},

	loadFromFile: function(parser, graph, uri, callback) {
	    nt.loadFromFile(parser, graph, uri, callback);
	}
    };

    store.setNetworkTransport(macroNetworkTransport);
};


var _transformationToJSONLD = function(name, transformation) {
    var jsonld = {"@type":jldm("Transformation")};
    jsonld[jldm("ruleName")] = name;
    jsonld[jldm("ruleBody")] = JSON.stringify(transformation);
    return jsonld;
};

/**
 * @doc
 * Serialises all the defined API macros into JSONLD.
 */
JSONLDMacro.toJSONLD = function() {
    var jsonld = [];
    for(var i=0; i<this.apiRegister.length; i++) {
        var api = this.apiRegister[i];
        var node = {"@type":jldm("JsonLDMacro"), "@context": jldmcontext};
        node[jldm("uriTemplate")] = api.templates;
        node[jldm("specification")] = [];
        for(var pathSelector in api.specification) {
            var transformation = api.specification[pathSelector];
            var transformations = [];
            for(var name in transformation) {
                transformations.push(_transformationToJSONLD(name, transformation[name]));
            }
            var specificationNode = {"@type":jldm("Specification")};
            specificationNode[jldm("transformation")] = transformations;
            specificationNode[jldm("pathSelector")] = pathSelector;
            node[jldm("specification")].push(specificationNode);
        }
        jsonld.push(node);
    }

    return jsonld;
};

var _fromJSONLDResults = function(results) {
    var macros = {};
    var specifications = {};

    for(var i=0; i<results.length; i++) {
        var result = results[i];
        var macroId = result["macro"].value;
        var macro = macros[macroId] || {};
        macros[macroId] = macro;

        var specificationId = result["specification"].value;
        var specification = specifications[specificationId] || {};
        specifications[specificationId] = specification;

        var templates = macro[specificationId] || {};
        macro[specificationId] = templates;
        if(result["uriTemplate"]) {
            templates[result["uriTemplate"].value] = true;
        } else {
            templates["{*}"] = true;
        }

        var transformation = specification[result["pathSelector"].value] || {};
        specification[result["pathSelector"].value] = transformation;

        transformation[result["ruleName"].value] = JSON.parse(result["ruleBody"].value);
    }
    var acc = {};

    for(var macroId in macros) {
        var macro = macros[macroId];
        for(var specificationId in macro) {
            var templates = macro[specificationId];
            var templatesAcc = [];
            for(var template in templates) {
                templatesAcc.push(template);
            }
            var specification = acc[templatesAcc.join("\\n")] || {};
            acc[templatesAcc.join("\\n")] = specification;
            for (var path in specifications[specificationId]) {
                specification[path] = specifications[specificationId][path];
            }
        }
    }

    return acc;
};

/**
 * @doc
 * Deserialises a API macro encoded as JSONLD. It requires an
 * instance of RDFStore.js to peform the deserialisation logic.
 */
/*
 ?macro a jldm:JsonLDMacro . \n\
 OPTIONAL { ?macro jldm:uriTemplate ?uriTemplate } .\n\
 ?macro jldm:specification ?specification .\n\
 ?specification jldm:transformation ?transformation .\n\
 ?specification jldm:pathSelector ?pathSelector .\n\
 ?transformation jldm:ruleName ?ruleName .\n\
 ?transformation jldm:ruleBody ?ruleBody .\n\
*/
JSONLDMacro.fromJSONLD = function(rdfstore, jsonld, cb) {
    var query = "PREFIX jldm: <"+JSONLDMacro.NS+">\n\
SELECT * { \n\
 ?macro a jldm:JsonLDMacro . \n\
 OPTIONAL { ?macro jldm:uriTemplate ?uriTemplate } .\n\
 ?macro jldm:specification ?specification .\n\
 ?specification jldm:transformation ?transformation .\n\
 ?specification jldm:pathSelector ?pathSelector .\n\
 ?transformation jldm:ruleName ?ruleName .\n\
 ?transformation jldm:ruleBody ?ruleBody .\n\
}";
    rdfstore.create(function(err, store){
        if(err) { cb(err); } else {
            store.load("application/ld+json", jsonld, function(err,_){
                if(err){ cb(err); } else {
                    store.execute(query, function(err, results){
                        if(err){ cb(err); } else {
                            console.log("*** GOT RESULTS")
                            //cb(null,results);
                            cb(null, _fromJSONLDResults(results));
                        }
                    });
                }
            });
        }
    });
};

if(typeof(window) !== 'undefined') {
    window.JSONLDMacro = JSONLDMacro;
}
module.exports.JSONLDMacro = JSONLDMacro;

},{"uri-templates":1}]},{},[2]);
