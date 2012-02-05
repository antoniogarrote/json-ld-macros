// Detects if we are in the browser or in node
if(typeof(module) === 'undefined') {
    window.module = {
	__export: function(obj) {
	    window['jsonld_macros'] = obj;
	}
    };
} else if(typeof(module) !== 'undefined' && module.exports == null) {
    window.module = {
	__export: function(obj) {
	    window['jsonld_macros'] = obj;
	}
    };
} else {
    module.__export = function(obj) {
	module.exports = obj;
    };
}

module.__export((function() {
    var JSONLDMacro = {};

    JSONLDMacro.VERSION = "0.0.2";

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
	var node, pathSelector, transformationFn, selectedNodes, nodeCounter, transformationFns, transformations;	
	var removeTransformation, nsTransformation, onlyTransformation;

	for(var i=0; i<transformation.length; i++) {
	    pathSelector = transformation[i][0];
	    transformationFns = transformation[i][1];


	    selectedNodes = pathSelector(document);

	    for(var j=0; j<selectedNodes.length; j++) {
		nodeCounter = selectedNodes[j][prefix];
		if(nodeCounter == null)  {
		    selectedNodes[j][prefix] = counter;
		    mapping[counter] = selectedNodes[j];
		    transformationMapping[counter] = [];
		    nodeCounter = counter;
		    counter++;
		}
		transformationMapping[nodeCounter].push(transformationFns);
	    }
	}

	for(var c in mapping) {
	    node = mapping[c];
	    transformations = transformationMapping[c];

	    for(i=0; i<transformations.length; i++) {
		transformation = transformations[i];
		removeTransformation = transformation['@remove'];
		onlyTransformation = transformation['@only'];
		nsTransformation = transformation['@ns'];


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
	    var selection = (obj.constructor === Array) ? obj : [obj];
	    var currentCounter = 0;

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
		    for(var i=0; i<selection.length; i++) {
			for(var p in selection[i]) {
			    nextSelection.push(selection[i][p]);
			}
		    }
		    break;
		case '':
		    nextSelection = [];
		    for(var i=0; i<selection.length; i++) {
			nextSelection = nextSelection.concat(JSONLDMacro._childrenRecursive(selection[i]));
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
		    for(var i=0; i<selection.length; i++) {
			val = selection[i][currentPart];
			if(val !== undefined) {
			    if(selectArray && val.constructor === Array) {
				nextSelection = nextSelection.concat(val);
			    } else {
				nextSelection.push(val);
			    }
			    if(currentCounter === parts.length-1 && f!=null) {
				if(selectArray && val.constructor === Array) {
				    for(var j=0; j<val.length; j++) {
					f(vaj[j], selection[i]);
				    }
				} else {
				    f(val, selection[i]);
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
		for(var i=0; i<selection.length; i++) {
		    f(selection[i], null);
		}
	    }

	    return selection;
	}
    };

    /** 
     * @doc
     * Recursively collect all the children objects of a
     * node passes as the function argument.
     */
    JSONLDMacro._childrenRecursive = function(obj) {
	var children = [];
	var pending = [obj];
	var next;
	
	while(pending.length != 0) {
	    next = pending.pop();
	    children.push(next);
	    for(var p in next) {
		if(typeof(next[p]) === 'object' && next[p].constructor === Object) {
		    pending.push(next[p]);
		} else if(typeof(next[p]) === 'object' && next[p].constructor === Array) {
		    pending = pending.concat(next[p]);
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

	case '@remove':
	    return this._buildRemoveTransformation(body);

	case '@only':
	    return this._buildOnlyTransformation(body);

	case '@ns':
	    return this._buildGenNsTransformation(body);

	case '@transform':
	    return this._buildTransformTransformation(body);

	default:
	    throw("Unknown transformation: "+name);
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
	}
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
	}
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

    JSONLDMacro.parseUrlPath = function(urlPath) {
	var componentExpression = "[^\/\#]+";
	urlPath = urlPath.replace(/\*/g,componentExpression);
	var re = new RegExp("^"+urlPath+"$");

	return re;
    };

    JSONLDMacro.apiPaths = [];

    /**
     * @doc
     * Registers an API in the library
     */
    JSONLDMacro.registerAPI = function(apiDefinition) {
	if(apiDefinition["@declare"] != null) {
	    this.registerFunctions(apiDefinition["@declare"]);
	    delete apiDefinition["@declare"];
	}

	var url, transformation;
	for(var p in apiDefinition) {
	    transformation = this.buildTransformation(apiDefinition[p]);
	    if(p.indexOf(",")!=-1) {
		p = p.split(",");
		for(var i=0; i<p.length; i++) {
		    url = this.parseUrlPath(p[i].replace(/\s/g,""));
		    this.apiPaths.push([url, transformation]);
		}
	    } else {
		url = this.parseUrlPath(p);
		this.apiPaths.push([url, transformation]);
	    }
	}
    };

    /**
     * @doc
     * Clears all the registered APIs
     */
    JSONLDMacro.clearAPIs = function() {
	this.apiPaths = [];
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


    return JSONLDMacro;
})());