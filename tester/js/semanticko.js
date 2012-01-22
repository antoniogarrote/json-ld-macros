// Knockout JavaScript library v1.2.1
// (c) Steven Sanderson - http://knockoutjs.com/
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

(function(window,undefined){
var ko = window["ko"] = {};
// Google Closure Compiler helpers (used only to make the minified file smaller)
ko.exportSymbol = function(publicPath, object) {
	var tokens = publicPath.split(".");
	var target = window;
	for (var i = 0; i < tokens.length - 1; i++)
		target = target[tokens[i]];
	target[tokens[tokens.length - 1]] = object;
};
ko.exportProperty = function(owner, publicName, object) {
  owner[publicName] = object;
};
ko.utils = new (function () {
    var stringTrimRegex = /^(\s|\u00A0)+|(\s|\u00A0)+$/g;
    var isIe6 = /MSIE 6/i.test(navigator.userAgent);
    var isIe7 = /MSIE 7/i.test(navigator.userAgent);
    
    // Represent the known event types in a compact way, then at runtime transform it into a hash with event name as key (for fast lookup)
    var knownEvents = {}, knownEventTypesByEventName = {};
    var keyEventTypeName = /Firefox\/2/i.test(navigator.userAgent) ? 'KeyboardEvent' : 'UIEvents';
    knownEvents[keyEventTypeName] = ['keyup', 'keydown', 'keypress'];
    knownEvents['MouseEvents'] = ['click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave'];
    for (var eventType in knownEvents) {
        var knownEventsForType = knownEvents[eventType];
        if (knownEventsForType.length) {
            for (var i = 0, j = knownEventsForType.length; i < j; i++)
                knownEventTypesByEventName[knownEventsForType[i]] = eventType;
        }
    }

    function isClickOnCheckableElement(element, eventType) {
        if ((element.tagName != "INPUT") || !element.type) return false;
        if (eventType.toLowerCase() != "click") return false;
        var inputType = element.type.toLowerCase();
        return (inputType == "checkbox") || (inputType == "radio");
    }
    
    return {
        fieldsIncludedWithJsonPost: ['authenticity_token', /^__RequestVerificationToken(_.*)?$/],
        
        arrayForEach: function (array, action) {
            for (var i = 0, j = array.length; i < j; i++)
                action(array[i]);
        },

        arrayIndexOf: function (array, item) {
            if (typeof array.indexOf == "function")
                return array.indexOf(item);
            for (var i = 0, j = array.length; i < j; i++)
                if (array[i] === item)
                    return i;
            return -1;
        },

        arrayFirst: function (array, predicate, predicateOwner) {
            for (var i = 0, j = array.length; i < j; i++)
                if (predicate.call(predicateOwner, array[i]))
                    return array[i];
            return null;
        },

        arrayRemoveItem: function (array, itemToRemove) {
            var index = ko.utils.arrayIndexOf(array, itemToRemove);
            if (index >= 0)
                array.splice(index, 1);
        },

        arrayGetDistinctValues: function (array) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++) {
                if (ko.utils.arrayIndexOf(result, array[i]) < 0)
                    result.push(array[i]);
            }
            return result;
        },

        arrayMap: function (array, mapping) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++)
                result.push(mapping(array[i]));
            return result;
        },

        arrayFilter: function (array, predicate) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++)
                if (predicate(array[i]))
                    result.push(array[i]);
            return result;
        },
        
        arrayPushAll: function (array, valuesToPush) {
            for (var i = 0, j = valuesToPush.length; i < j; i++)
                array.push(valuesToPush[i]);	
        },

        emptyDomNode: function (domNode) {
            while (domNode.firstChild) {
                ko.removeNode(domNode.firstChild);
            }
        },

        setDomNodeChildren: function (domNode, childNodes) {
            ko.utils.emptyDomNode(domNode);
            if (childNodes) {
                ko.utils.arrayForEach(childNodes, function (childNode) {
                    domNode.appendChild(childNode);
                });
            }
        },

        replaceDomNodes: function (nodeToReplaceOrNodeArray, newNodesArray) {
            var nodesToReplaceArray = nodeToReplaceOrNodeArray.nodeType ? [nodeToReplaceOrNodeArray] : nodeToReplaceOrNodeArray;
            if (nodesToReplaceArray.length > 0) {
                var insertionPoint = nodesToReplaceArray[0];
                var parent = insertionPoint.parentNode;
                for (var i = 0, j = newNodesArray.length; i < j; i++)
                    parent.insertBefore(newNodesArray[i], insertionPoint);
                for (var i = 0, j = nodesToReplaceArray.length; i < j; i++) {
                    ko.removeNode(nodesToReplaceArray[i]);
                }
            }
        },

        setOptionNodeSelectionState: function (optionNode, isSelected) {
            // IE6 sometimes throws "unknown error" if you try to write to .selected directly, whereas Firefox struggles with setAttribute. Pick one based on browser.
            if (navigator.userAgent.indexOf("MSIE 6") >= 0)
                optionNode.setAttribute("selected", isSelected);
            else
                optionNode.selected = isSelected;
        },

        getElementsHavingAttribute: function (rootNode, attributeName) {
            if ((!rootNode) || (rootNode.nodeType != 1)) return [];
            var results = [];
            if (rootNode.getAttribute(attributeName) !== null)
                results.push(rootNode);
            var descendants = rootNode.getElementsByTagName("*");
            for (var i = 0, j = descendants.length; i < j; i++)
                if (descendants[i].getAttribute(attributeName) !== null)
                    results.push(descendants[i]);
            return results;
        },

        stringTrim: function (string) {
            return (string || "").replace(stringTrimRegex, "");
        },

        stringTokenize: function (string, delimiter) {
            var result = [];
            var tokens = (string || "").split(delimiter);
            for (var i = 0, j = tokens.length; i < j; i++) {
                var trimmed = ko.utils.stringTrim(tokens[i]);
                if (trimmed !== "")
                    result.push(trimmed);
            }
            return result;
        },
        
        stringStartsWith: function (string, startsWith) {        	
            string = string || "";
            if (startsWith.length > string.length)
                return false;
            return string.substring(0, startsWith.length) === startsWith;
        },

        evalWithinScope: function (expression, scope, node) {
            // Always do the evaling within a "new Function" to block access to parent scope
            if (scope === undefined)
                return (new Function("return " + expression))();

            scope['skonode'] = node;
                
            // Ensure "expression" is flattened into a source code string *before* it runs, otherwise
            // the variable name "expression" itself will clash with a subproperty called "expression"
            // The model must available in the chain scope for arbritrary JS code to execute, but it 
            // also must be reference by <> and [] URIs anc CURIES
            return (new Function("__SKO__sc", "with(__SKO__sc){ var innerNode=skonode; return (" + expression + ") }"))(scope);
        },

        domNodeIsContainedBy: function (node, containedByNode) {
            if (containedByNode.compareDocumentPosition)
                return (containedByNode.compareDocumentPosition(node) & 16) == 16;
            while (node != null) {
                if (node == containedByNode)
                    return true;
                node = node.parentNode;
            }
            return false;
        },

        domNodeIsAttachedToDocument: function (node) {
            return ko.utils.domNodeIsContainedBy(node, document);
        },

        registerEventHandler: function (element, eventType, handler) {
            if (typeof jQuery != "undefined") {
                if (isClickOnCheckableElement(element, eventType)) {
                    // For click events on checkboxes, jQuery interferes with the event handling in an awkward way:
                    // it toggles the element checked state *after* the click event handlers run, whereas native
                    // click events toggle the checked state *before* the event handler. 
                    // Fix this by intecepting the handler and applying the correct checkedness before it runs.            	
                    var originalHandler = handler;
                    handler = function(event, eventData) {
                        var jQuerySuppliedCheckedState = this.checked;
                        if (eventData)
                            this.checked = eventData.checkedStateBeforeEvent !== true;
                        originalHandler.call(this, event);
                        this.checked = jQuerySuppliedCheckedState; // Restore the state jQuery applied
                    };                	
                }
                jQuery(element)['bind'](eventType, handler);
            } else if (typeof element.addEventListener == "function")
                element.addEventListener(eventType, handler, false);
            else if (typeof element.attachEvent != "undefined")
                element.attachEvent("on" + eventType, function (event) {
                    handler.call(element, event);
                });
            else
                throw new Error("Browser doesn't support addEventListener or attachEvent");
        },

        triggerEvent: function (element, eventType) {
            if (!(element && element.nodeType))
                throw new Error("element must be a DOM node when calling triggerEvent");

            if (typeof jQuery != "undefined") {
                var eventData = [];
                if (isClickOnCheckableElement(element, eventType)) {
                    // Work around the jQuery "click events on checkboxes" issue described above by storing the original checked state before triggering the handler
                    eventData.push({ checkedStateBeforeEvent: element.checked });
                }
                jQuery(element)['trigger'](eventType, eventData);
            } else if (typeof document.createEvent == "function") {
                if (typeof element.dispatchEvent == "function") {
                    var eventCategory = knownEventTypesByEventName[eventType] || "HTMLEvents";
                    var event = document.createEvent(eventCategory);
                    event.initEvent(eventType, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, element);
                    element.dispatchEvent(event);
                }
                else
                    throw new Error("The supplied element doesn't support dispatchEvent");
            } else if (typeof element.fireEvent != "undefined") {
                // Unlike other browsers, IE doesn't change the checked state of checkboxes/radiobuttons when you trigger their "click" event
                // so to make it consistent, we'll do it manually here
                if (eventType == "click") {
                    if ((element.tagName == "INPUT") && ((element.type.toLowerCase() == "checkbox") || (element.type.toLowerCase() == "radio")))
                        element.checked = element.checked !== true;
                }
                element.fireEvent("on" + eventType);
            }
            else
                throw new Error("Browser doesn't support triggering events");
        },

        unwrapObservable: function (value) {
            return ko.isObservable(value) ? value() : value;
        },

        domNodeHasCssClass: function (node, className) {
            var currentClassNames = (node.className || "").split(/\s+/);
            return ko.utils.arrayIndexOf(currentClassNames, className) >= 0;
        },

        toggleDomNodeCssClass: function (node, className, shouldHaveClass) {
            var hasClass = ko.utils.domNodeHasCssClass(node, className);
            if (shouldHaveClass && !hasClass) {
                node.className = (node.className || "") + " " + className;
            } else if (hasClass && !shouldHaveClass) {
                var currentClassNames = (node.className || "").split(/\s+/);
                var newClassName = "";
                for (var i = 0; i < currentClassNames.length; i++)
                    if (currentClassNames[i] != className)
                        newClassName += currentClassNames[i] + " ";
                node.className = ko.utils.stringTrim(newClassName);
            }
        },

        range: function (min, max) {
            min = ko.utils.unwrapObservable(min);
            max = ko.utils.unwrapObservable(max);
            var result = [];
            for (var i = min; i <= max; i++)
                result.push(i);
            return result;
        },
        
        makeArray: function(arrayLikeObject) {
            var result = [];
            for (var i = 0, j = arrayLikeObject.length; i < j; i++) {
                result.push(arrayLikeObject[i]);
            };
            return result;
        },
        
        isIe6 : isIe6,
        isIe7 : isIe7,
        
        getFormFields: function(form, fieldName) {
            var fields = ko.utils.makeArray(form.getElementsByTagName("INPUT")).concat(ko.utils.makeArray(form.getElementsByTagName("TEXTAREA")));
            var isMatchingField = (typeof fieldName == 'string') 
                ? function(field) { return field.name === fieldName }
                : function(field) { return fieldName.test(field.name) }; // Treat fieldName as regex or object containing predicate
            var matches = [];
            for (var i = fields.length - 1; i >= 0; i--) {
                if (isMatchingField(fields[i]))
                    matches.push(fields[i]);
            };
            return matches;
        },
        
        parseJson: function (jsonString) {
            if (typeof jsonString == "string") {
                jsonString = ko.utils.stringTrim(jsonString);
                if (jsonString) {
                    if (window.JSON && window.JSON.parse) // Use native parsing where available
                        return window.JSON.parse(jsonString);
                    return (new Function("return " + jsonString))(); // Fallback on less safe parsing for older browsers
                }
            }	
            return null;
        },

        stringifyJson: function (data) {
            if ((typeof JSON == "undefined") || (typeof JSON.stringify == "undefined"))
                throw new Error("Cannot find JSON.stringify(). Some browsers (e.g., IE < 8) don't support it natively, but you can overcome this by adding a script reference to json2.js, downloadable from http://www.json.org/json2.js");
            return JSON.stringify(ko.utils.unwrapObservable(data));
        },

        postJson: function (urlOrForm, data, options) {
            options = options || {};
            var params = options['params'] || {};
            var includeFields = options['includeFields'] || this.fieldsIncludedWithJsonPost;
            var url = urlOrForm;
            
            // If we were given a form, use its 'action' URL and pick out any requested field values 	
            if((typeof urlOrForm == 'object') && (urlOrForm.tagName == "FORM")) {
                var originalForm = urlOrForm;
                url = originalForm.action;
                for (var i = includeFields.length - 1; i >= 0; i--) {
                    var fields = ko.utils.getFormFields(originalForm, includeFields[i]);
                    for (var j = fields.length - 1; j >= 0; j--)        				
                        params[fields[j].name] = fields[j].value;
                }
            }        	
            
            data = ko.utils.unwrapObservable(data);
            var form = document.createElement("FORM");
            form.style.display = "none";
            form.action = url;
            form.method = "post";
            for (var key in data) {
                var input = document.createElement("INPUT");
                input.name = key;
                input.value = ko.utils.stringifyJson(ko.utils.unwrapObservable(data[key]));
                form.appendChild(input);
            }
            for (var key in params) {
                var input = document.createElement("INPUT");
                input.name = key;
                input.value = params[key];
                form.appendChild(input);
            }            
            document.body.appendChild(form);
            options['submitter'] ? options['submitter'](form) : form.submit();
            setTimeout(function () { form.parentNode.removeChild(form); }, 0);
        }
    }
})();

ko.exportSymbol('ko.utils', ko.utils);
ko.exportSymbol('ko.utils.arrayForEach', ko.utils.arrayForEach);
ko.exportSymbol('ko.utils.arrayFirst', ko.utils.arrayFirst);
ko.exportSymbol('ko.utils.arrayFilter', ko.utils.arrayFilter);
ko.exportSymbol('ko.utils.arrayGetDistinctValues', ko.utils.arrayGetDistinctValues);
ko.exportSymbol('ko.utils.arrayIndexOf', ko.utils.arrayIndexOf);
ko.exportSymbol('ko.utils.arrayMap', ko.utils.arrayMap);
ko.exportSymbol('ko.utils.arrayPushAll', ko.utils.arrayPushAll);
ko.exportSymbol('ko.utils.arrayRemoveItem', ko.utils.arrayRemoveItem);
ko.exportSymbol('ko.utils.fieldsIncludedWithJsonPost', ko.utils.fieldsIncludedWithJsonPost);
ko.exportSymbol('ko.utils.getElementsHavingAttribute', ko.utils.getElementsHavingAttribute);
ko.exportSymbol('ko.utils.getFormFields', ko.utils.getFormFields);
ko.exportSymbol('ko.utils.postJson', ko.utils.postJson);
ko.exportSymbol('ko.utils.parseJson', ko.utils.parseJson);
ko.exportSymbol('ko.utils.registerEventHandler', ko.utils.registerEventHandler);
ko.exportSymbol('ko.utils.stringifyJson', ko.utils.stringifyJson);
ko.exportSymbol('ko.utils.range', ko.utils.range);
ko.exportSymbol('ko.utils.toggleDomNodeCssClass', ko.utils.toggleDomNodeCssClass);
ko.exportSymbol('ko.utils.triggerEvent', ko.utils.triggerEvent);
ko.exportSymbol('ko.utils.unwrapObservable', ko.utils.unwrapObservable);

if (!Function.prototype['bind']) {
    // Function.prototype.bind is a standard part of ECMAScript 5th Edition (December 2009, http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-262.pdf)
    // In case the browser doesn't implement it natively, provide a JavaScript implementation. This implementation is based on the one in prototype.js
    Function.prototype['bind'] = function (object) {
        var originalFunction = this, args = Array.prototype.slice.call(arguments), object = args.shift();
        return function () {
            return originalFunction.apply(object, args.concat(Array.prototype.slice.call(arguments)));
        }; 
    };
}

ko.utils.domData = new (function () {
    var uniqueId = 0;
    var dataStoreKeyExpandoPropertyName = "__ko__" + (new Date).getTime();
    var dataStore = {};
    return {
        get: function (node, key) {
            var allDataForNode = ko.utils.domData.getAll(node, false);
            return allDataForNode === undefined ? undefined : allDataForNode[key];
        },
        set: function (node, key, value) {
            if (value === undefined) {
                // Make sure we don't actually create a new domData key if we are actually deleting a value
                if (ko.utils.domData.getAll(node, false) === undefined)
                    return;
            }
            var allDataForNode = ko.utils.domData.getAll(node, true);
            allDataForNode[key] = value;
        },
        getAll: function (node, createIfNotFound) {
            var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
            if (!dataStoreKey) {
                if (!createIfNotFound)
                    return undefined;
                dataStoreKey = node[dataStoreKeyExpandoPropertyName] = "ko" + uniqueId++;
                dataStore[dataStoreKey] = {};
            }
            return dataStore[dataStoreKey];
        },
        clear: function (node) {
            var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
            if (dataStoreKey) {
                delete dataStore[dataStoreKey];
                node[dataStoreKeyExpandoPropertyName] = null;
            }
        }
    }
})();
ko.utils.domNodeDisposal = new (function () {
    var domDataKey = "__ko_domNodeDisposal__" + (new Date).getTime();
    
    function getDisposeCallbacksCollection(node, createIfNotFound) {
        var allDisposeCallbacks = ko.utils.domData.get(node, domDataKey);
        if ((allDisposeCallbacks === undefined) && createIfNotFound) {
            allDisposeCallbacks = [];
            ko.utils.domData.set(node, domDataKey, allDisposeCallbacks);
        }
        return allDisposeCallbacks;
    }
    function destroyCallbacksCollection(node) {
        ko.utils.domData.set(node, domDataKey, undefined);
    }
    
    function cleanSingleNode(node) {
        // @modified
        // clean RDF observers
        sko.cleanNode(node)

        // Run all the dispose callbacks
        var callbacks = getDisposeCallbacksCollection(node, false);
        if (callbacks) {
            callbacks = callbacks.slice(0); // Clone, as the array may be modified during iteration (typically, callbacks will remove themselves)
            for (var i = 0; i < callbacks.length; i++)
                callbacks[i](node);
        }	
        
        // Also erase the DOM data
        ko.utils.domData.clear(node);		
        
        // Special support for jQuery here because it's so commonly used.
        // Many jQuery plugins (including jquery.tmpl) store data using jQuery's equivalent of domData
        // so notify it to tear down any resources associated with the node & descendants here.
        if ((typeof jQuery == "function") && (typeof jQuery['cleanData'] == "function"))
            jQuery['cleanData']([node]);			
    }
    
    return {
        addDisposeCallback : function(node, callback) {
            if (typeof callback != "function")
                throw new Error("Callback must be a function");
            getDisposeCallbacksCollection(node, true).push(callback);
        },
        
        removeDisposeCallback : function(node, callback) {
            var callbacksCollection = getDisposeCallbacksCollection(node, false);
            if (callbacksCollection) {
                ko.utils.arrayRemoveItem(callbacksCollection, callback);
                if (callbacksCollection.length == 0)
                    destroyCallbacksCollection(node);
            }
        },
        
        cleanNode : function(node) {
            if ((node.nodeType != 1) && (node.nodeType != 9))
                return;
            cleanSingleNode(node);
            
            // Clone the descendants list in case it changes during iteration
            var descendants = [];
            ko.utils.arrayPushAll(descendants, node.getElementsByTagName("*"));
            for (var i = 0, j = descendants.length; i < j; i++)
                cleanSingleNode(descendants[i]);
        },
        
        removeNode : function(node) {
            ko.cleanNode(node);
            if (node.parentNode)
                node.parentNode.removeChild(node);
        }
    }
})();
ko.cleanNode = ko.utils.domNodeDisposal.cleanNode; // Shorthand name for convenience
ko.removeNode = ko.utils.domNodeDisposal.removeNode; // Shorthand name for convenience
ko.exportSymbol('ko.cleanNode', ko.cleanNode); 
ko.exportSymbol('ko.removeNode', ko.removeNode);
ko.exportSymbol('ko.utils.domNodeDisposal', ko.utils.domNodeDisposal);
ko.exportSymbol('ko.utils.domNodeDisposal.addDisposeCallback', ko.utils.domNodeDisposal.addDisposeCallback);
ko.exportSymbol('ko.utils.domNodeDisposal.removeDisposeCallback', ko.utils.domNodeDisposal.removeDisposeCallback);
(function () {
    function simpleHtmlParse(html) {
        // Based on jQuery's "clean" function, but only accounting for table-related elements.
        // If you have referenced jQuery, this won't be used anyway - KO will use jQuery's "clean" function directly
        
        // Trim whitespace, otherwise indexOf won't work as expected
        var tags = ko.utils.stringTrim(html).toLowerCase(), div = document.createElement("div");

        // Finds the first match from the left column, and returns the corresponding "wrap" data from the right column
        var wrap = tags.match(/^<(thead|tbody|tfoot)/)              && [1, "<table>", "</table>"] ||
                   !tags.indexOf("<tr")                             && [2, "<table><tbody>", "</tbody></table>"] ||
                   (!tags.indexOf("<td") || !tags.indexOf("<th"))   && [3, "<table><tbody><tr>", "</tr></tbody></table>"] ||
                   /* anything else */                                 [0, "", ""];

        // Go to html and back, then peel off extra wrappers
        div.innerHTML = wrap[1] + html + wrap[2];

        // Move to the right depth
        while (wrap[0]--)
            div = div.lastChild;

        return ko.utils.makeArray(div.childNodes);
    }
    
    ko.utils.parseHtmlFragment = function(html) {
        return typeof jQuery != 'undefined' ? jQuery['clean']([html]) // As below, benefit from jQuery's optimisations where possible
                                            : simpleHtmlParse(html);  // ... otherwise, this simple logic will do in most common cases.
    };
    
    ko.utils.setHtml = function(node, html) {
        ko.utils.emptyDomNode(node);
        
        if ((html !== null) && (html !== undefined)) {
            if (typeof html != 'string')
                html = html.toString();
            
            // jQuery contains a lot of sophisticated code to parse arbitrary HTML fragments,
            // for example <tr> elements which are not normally allowed to exist on their own.
            // If you've referenced jQuery we'll use that rather than duplicating its code.
            if (typeof jQuery != 'undefined') {
                jQuery(node)['html'](html);
            } else {
                // ... otherwise, use KO's own parsing logic.
                var parsedNodes = ko.utils.parseHtmlFragment(html);
                for (var i = 0; i < parsedNodes.length; i++)
                    node.appendChild(parsedNodes[i]);
            }            
        }    	
    };
})();
ko.memoization = (function () {
    var memos = {};

    function randomMax8HexChars() {
        return (((1 + Math.random()) * 0x100000000) | 0).toString(16).substring(1);
    }
    function generateRandomId() {
        return randomMax8HexChars() + randomMax8HexChars();
    }
    function findMemoNodes(rootNode, appendToArray) {
        if (!rootNode)
            return;
        if (rootNode.nodeType == 8) {
            var memoId = ko.memoization.parseMemoText(rootNode.nodeValue);
            if (memoId != null)
                appendToArray.push({ domNode: rootNode, memoId: memoId });
        } else if (rootNode.nodeType == 1) {
            for (var i = 0, childNodes = rootNode.childNodes, j = childNodes.length; i < j; i++)
                findMemoNodes(childNodes[i], appendToArray);
        }
    }

    return {
        memoize: function (callback) {
            if (typeof callback != "function")
                throw new Error("You can only pass a function to ko.memoization.memoize()");
            var memoId = generateRandomId();
            memos[memoId] = callback;
            return "<!--[ko_memo:" + memoId + "]-->";
        },

        unmemoize: function (memoId, callbackParams) {
            var callback = memos[memoId];
            if (callback === undefined)
                throw new Error("Couldn't find any memo with ID " + memoId + ". Perhaps it's already been unmemoized.");
            try {
                callback.apply(null, callbackParams || []);
                return true;
            }
            finally { delete memos[memoId]; }
        },

        unmemoizeDomNodeAndDescendants: function (domNode, extraCallbackParamsArray) {
            var memos = [];
            findMemoNodes(domNode, memos);
            for (var i = 0, j = memos.length; i < j; i++) {
                var node = memos[i].domNode;
                var combinedParams = [node];
                if (extraCallbackParamsArray)
                    ko.utils.arrayPushAll(combinedParams, extraCallbackParamsArray);

                var viewModel = extraCallbackParamsArray[0];
                sko.traceResources(domNode, viewModel, function(){
                    sko.traceRelations(domNode, viewModel, function(){
                        ko.memoization.unmemoize(memos[i].memoId, combinedParams);
                        node.nodeValue = ""; // Neuter this node so we don't try to unmemoize it again
                        if (node.parentNode)
                            node.parentNode.removeChild(node); // If possible, erase it totally (not always possible - someone else might just hold a reference to it then call unmemoizeDomNodeAndDescendants again)
                    });
                });
            }
        },

        parseMemoText: function (memoText) {
            var match = memoText.match(/^\[ko_memo\:(.*?)\]$/);
            return match ? match[1] : null;
        }
    };
})();

ko.exportSymbol('ko.memoization', ko.memoization);
ko.exportSymbol('ko.memoization.memoize', ko.memoization.memoize);
ko.exportSymbol('ko.memoization.unmemoize', ko.memoization.unmemoize);
ko.exportSymbol('ko.memoization.parseMemoText', ko.memoization.parseMemoText);
ko.exportSymbol('ko.memoization.unmemoizeDomNodeAndDescendants', ko.memoization.unmemoizeDomNodeAndDescendants);

ko.subscription = function (callback, disposeCallback) {
    this.callback = callback;
    this.dispose = function () {
        this.isDisposed = true;
        disposeCallback();
    }['bind'](this);
    
    ko.exportProperty(this, 'dispose', this.dispose);
};

ko.subscribable = function () {
    var _subscriptions = [];

    this.subscribe = function (callback, callbackTarget) {
        var boundCallback = callbackTarget ? callback.bind(callbackTarget) : callback;

        var subscription = new ko.subscription(boundCallback, function () {
            ko.utils.arrayRemoveItem(_subscriptions, subscription);
        });
        _subscriptions.push(subscription);
        return subscription;
    };

    this.notifySubscribers = function (valueToNotify) {
        ko.utils.arrayForEach(_subscriptions.slice(0), function (subscription) {
            // In case a subscription was disposed during the arrayForEach cycle, check
            // for isDisposed on each subscription before invoking its callback
            if (subscription && (subscription.isDisposed !== true))
                subscription.callback(valueToNotify);
        });
    };

    this.getSubscriptionsCount = function () {
        return _subscriptions.length;
    };
    
    ko.exportProperty(this, 'subscribe', this.subscribe);
    ko.exportProperty(this, 'notifySubscribers', this.notifySubscribers);
    ko.exportProperty(this, 'getSubscriptionsCount', this.getSubscriptionsCount);
}

ko.isSubscribable = function (instance) {
    return typeof instance.subscribe == "function" && typeof instance.notifySubscribers == "function";
};

ko.exportSymbol('ko.subscribable', ko.subscribable);
ko.exportSymbol('ko.isSubscribable', ko.isSubscribable);

ko.dependencyDetection = (function () {
    var _detectedDependencies = [];

    return {
        begin: function () {
            _detectedDependencies.push([]);
        },

        end: function () {
            return _detectedDependencies.pop();
        },

        registerDependency: function (subscribable) {
            if (!ko.isSubscribable(subscribable))
                throw "Only subscribable things can act as dependencies";
            if (_detectedDependencies.length > 0) {
                _detectedDependencies[_detectedDependencies.length - 1].push(subscribable);
            }
        }
    };
})();var primitiveTypes = { 'undefined':true, 'boolean':true, 'number':true, 'string':true };

function valuesArePrimitiveAndEqual(a, b) {
    var oldValueIsPrimitive = (a === null) || (typeof(a) in primitiveTypes);
    return oldValueIsPrimitive ? (a === b) : false;
}

ko.observable = function (initialValue) {
    var _latestValue = initialValue;

    function observable() {
        if (arguments.length > 0) {
            // Write            
            
            // Ignore writes if the value hasn't changed
            if ((!observable['equalityComparer']) || !observable['equalityComparer'](_latestValue, arguments[0])) {
                _latestValue = arguments[0];
                observable.notifySubscribers(_latestValue);        		
            }
            return this; // Permits chained assignments
        }
        else {
            // Read
            ko.dependencyDetection.registerDependency(observable); // The caller only needs to be notified of changes if they did a "read" operation
            return _latestValue;
        }
    }
    observable.__ko_proto__ = ko.observable;
    observable.valueHasMutated = function () { observable.notifySubscribers(_latestValue); }
    observable['equalityComparer'] = valuesArePrimitiveAndEqual;
    
    ko.subscribable.call(observable);
    
    ko.exportProperty(observable, "valueHasMutated", observable.valueHasMutated);
    
    return observable;
}
ko.isObservable = function (instance) {
    if ((instance === null) || (instance === undefined) || (instance.__ko_proto__ === undefined)) return false;
    if (instance.__ko_proto__ === ko.observable) return true;
    return ko.isObservable(instance.__ko_proto__); // Walk the prototype chain
}
ko.isWriteableObservable = function (instance) {
    // Observable
    if ((typeof instance == "function") && instance.__ko_proto__ === ko.observable)
        return true;
    // Writeable dependent observable
    if ((typeof instance == "function") && (instance.__ko_proto__ === ko.dependentObservable) && (instance.hasWriteFunction))
        return true;
    // Anything else
    return false;
}


ko.exportSymbol('ko.observable', ko.observable);
ko.exportSymbol('ko.isObservable', ko.isObservable);
ko.exportSymbol('ko.isWriteableObservable', ko.isWriteableObservable);
ko.observableArray = function (initialValues) {
    if (arguments.length == 0) {
        // Zero-parameter constructor initializes to empty array
        initialValues = [];
    }
    if ((initialValues !== null) && (initialValues !== undefined) && !('length' in initialValues))
        throw new Error("The argument passed when initializing an observable array must be an array, or null, or undefined.");
    var result = new ko.observable(initialValues);

    ko.utils.arrayForEach(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function (methodName) {
        result[methodName] = function () {
            var underlyingArray = result();
            var methodCallResult = underlyingArray[methodName].apply(underlyingArray, arguments);
            result.valueHasMutated();
            return methodCallResult;
        };
    });

    ko.utils.arrayForEach(["slice"], function (methodName) {
        result[methodName] = function () {
            var underlyingArray = result();
            return underlyingArray[methodName].apply(underlyingArray, arguments);
        };
    });

    result.remove = function (valueOrPredicate) {
        var underlyingArray = result();
        var remainingValues = [];
        var removedValues = [];
        var predicate = typeof valueOrPredicate == "function" ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
        for (var i = 0, j = underlyingArray.length; i < j; i++) {
            var value = underlyingArray[i];
            if (!predicate(value))
                remainingValues.push(value);
            else
                removedValues.push(value);
        }
        result(remainingValues);
        return removedValues;
    };

    result.removeAll = function (arrayOfValues) {
        // If you passed zero args, we remove everything
        if (arrayOfValues === undefined) {
            var allValues = result();
            result([]);
            return allValues;
        }
        
        // If you passed an arg, we interpret it as an array of entries to remove
        if (!arrayOfValues)
            return [];
        return result.remove(function (value) {
            return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0;
        });
    };
    
    result.destroy = function (valueOrPredicate) {
        var underlyingArray = result();
        var predicate = typeof valueOrPredicate == "function" ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
        for (var i = underlyingArray.length - 1; i >= 0; i--) {
            var value = underlyingArray[i];
            if (predicate(value))
                underlyingArray[i]["_destroy"] = true;
        }
        result.valueHasMutated();
    };
    
    result.destroyAll = function (arrayOfValues) {
        // If you passed zero args, we destroy everything
        if (arrayOfValues === undefined)
            return result.destroy(function() { return true });
                
        // If you passed an arg, we interpret it as an array of entries to destroy
        if (!arrayOfValues)
            return [];
        return result.destroy(function (value) {
            return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0;
        });		    	
    };

    result.indexOf = function (item) {
        var underlyingArray = result();
        return ko.utils.arrayIndexOf(underlyingArray, item);
    };
    
    result.replace = function(oldItem, newItem) {
        var index = result.indexOf(oldItem);
        if (index >= 0) {
            result()[index] = newItem;
            result.valueHasMutated();
        }	
    };
    
    ko.exportProperty(result, "remove", result.remove);
    ko.exportProperty(result, "removeAll", result.removeAll);
    ko.exportProperty(result, "destroy", result.destroy);
    ko.exportProperty(result, "destroyAll", result.destroyAll);
    ko.exportProperty(result, "indexOf", result.indexOf);
    
    return result;
}

ko.exportSymbol('ko.observableArray', ko.observableArray);
ko.dependentObservable = function (evaluatorFunctionOrOptions, evaluatorFunctionTarget, options) {
    var _latestValue, _hasBeenEvaluated = false;
    
    if (evaluatorFunctionOrOptions && typeof evaluatorFunctionOrOptions == "object") {
        // Single-parameter syntax - everything is on this "options" param
        options = evaluatorFunctionOrOptions;
    } else {
        // Multi-parameter syntax - construct the options according to the params passed
        options = options || {};
        options["read"] = evaluatorFunctionOrOptions || options["read"];
        options["owner"] = evaluatorFunctionTarget || options["owner"];
    }
    // By here, "options" is always non-null
    
    if (typeof options["read"] != "function")
        throw "Pass a function that returns the value of the dependentObservable";
        
    // Build "disposeWhenNodeIsRemoved" and "disposeWhenNodeIsRemovedCallback" option values
    // (Note: "disposeWhenNodeIsRemoved" option both proactively disposes as soon as the node is removed using ko.removeNode(),
    // plus adds a "disposeWhen" callback that, on each evaluation, disposes if the node was removed by some other means.)
    var disposeWhenNodeIsRemoved = (typeof options["disposeWhenNodeIsRemoved"] == "object") ? options["disposeWhenNodeIsRemoved"] : null;
    var disposeWhenNodeIsRemovedCallback = null;
    if (disposeWhenNodeIsRemoved) {
        disposeWhenNodeIsRemovedCallback = function() { dependentObservable.dispose() };
        ko.utils.domNodeDisposal.addDisposeCallback(disposeWhenNodeIsRemoved, disposeWhenNodeIsRemovedCallback);
        var existingDisposeWhenFunction = options["disposeWhen"];
        options["disposeWhen"] = function () {
            return (!ko.utils.domNodeIsAttachedToDocument(disposeWhenNodeIsRemoved)) 
                || ((typeof existingDisposeWhenFunction == "function") && existingDisposeWhenFunction());
        }    	
    }
    
    var _subscriptionsToDependencies = [];
    function disposeAllSubscriptionsToDependencies() {
        ko.utils.arrayForEach(_subscriptionsToDependencies, function (subscription) {
            subscription.dispose();
        });
        _subscriptionsToDependencies = [];
    }

    function replaceSubscriptionsToDependencies(newDependencies) {
        disposeAllSubscriptionsToDependencies();
        ko.utils.arrayForEach(newDependencies, function (dependency) {
            _subscriptionsToDependencies.push(dependency.subscribe(evaluate));
        });
    };
    
    function evaluate() {
        // Don't dispose on first evaluation, because the "disposeWhen" callback might
        // e.g., dispose when the associated DOM element isn't in the doc, and it's not
        // going to be in the doc until *after* the first evaluation
        if ((_hasBeenEvaluated) && typeof options["disposeWhen"] == "function") {
            if (options["disposeWhen"]()) {
                dependentObservable.dispose();
                return;
            }
        }

        try {
            ko.dependencyDetection.begin();
            _latestValue = options["owner"] ? options["read"].call(options["owner"]) : options["read"]();
        } finally {
            var distinctDependencies = ko.utils.arrayGetDistinctValues(ko.dependencyDetection.end());
            replaceSubscriptionsToDependencies(distinctDependencies);
        }

        dependentObservable.notifySubscribers(_latestValue);
        _hasBeenEvaluated = true;
    }

    function dependentObservable() {
        if (arguments.length > 0) {
            if (typeof options["write"] === "function") {
                // Writing a value
                var valueToWrite = arguments[0];
                options["owner"] ? options["write"].call(options["owner"], valueToWrite) : options["write"](valueToWrite);
            } else {
                throw "Cannot write a value to a dependentObservable unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters.";
            }
        } else {
            // Reading the value
            if (!_hasBeenEvaluated)
                evaluate();
            ko.dependencyDetection.registerDependency(dependentObservable);
            return _latestValue;
        }
    }
    dependentObservable.__ko_proto__ = ko.dependentObservable;
    dependentObservable.getDependenciesCount = function () { return _subscriptionsToDependencies.length; }
    dependentObservable.hasWriteFunction = typeof options["write"] === "function";
    dependentObservable.dispose = function () {
        if (disposeWhenNodeIsRemoved)
            ko.utils.domNodeDisposal.removeDisposeCallback(disposeWhenNodeIsRemoved, disposeWhenNodeIsRemovedCallback);
        disposeAllSubscriptionsToDependencies();
    };
    
    ko.subscribable.call(dependentObservable);
    if (options['deferEvaluation'] !== true)
        evaluate();
    
    ko.exportProperty(dependentObservable, 'dispose', dependentObservable.dispose);
    ko.exportProperty(dependentObservable, 'getDependenciesCount', dependentObservable.getDependenciesCount);
    
    return dependentObservable;
};
ko.dependentObservable.__ko_proto__ = ko.observable;

ko.exportSymbol('ko.dependentObservable', ko.dependentObservable);

(function() {    
    var maxNestedObservableDepth = 10; // Escape the (unlikely) pathalogical case where an observable's current value is itself (or similar reference cycle)
    
    ko.toJS = function(rootObject) {
        if (arguments.length == 0)
            throw new Error("When calling ko.toJS, pass the object you want to convert.");
        
        // We just unwrap everything at every level in the object graph
        return mapJsObjectGraph(rootObject, function(valueToMap) {
            // Loop because an observable's value might in turn be another observable wrapper
            for (var i = 0; ko.isObservable(valueToMap) && (i < maxNestedObservableDepth); i++)
                valueToMap = valueToMap();
            return valueToMap;
        });
    };

    ko.toJSON = function(rootObject) {
        var plainJavaScriptObject = ko.toJS(rootObject);
        return ko.utils.stringifyJson(plainJavaScriptObject);
    };
    
    function mapJsObjectGraph(rootObject, mapInputCallback, visitedObjects) {
        visitedObjects = visitedObjects || new objectLookup();
        
        rootObject = mapInputCallback(rootObject);
        var canHaveProperties = (typeof rootObject == "object") && (rootObject !== null) && (rootObject !== undefined);
        if (!canHaveProperties)
            return rootObject;
            
        var outputProperties = rootObject instanceof Array ? [] : {};
        visitedObjects.save(rootObject, outputProperties);            
        
        visitPropertiesOrArrayEntries(rootObject, function(indexer) {
            var propertyValue = mapInputCallback(rootObject[indexer]);
            
            switch (typeof propertyValue) {
                case "boolean":
                case "number":
                case "string":
                case "function":
                    outputProperties[indexer] = propertyValue;
                    break;
                case "object":
                case "undefined":				
                    var previouslyMappedValue = visitedObjects.get(propertyValue);
                    outputProperties[indexer] = (previouslyMappedValue !== undefined)
                        ? previouslyMappedValue
                        : mapJsObjectGraph(propertyValue, mapInputCallback, visitedObjects);
                    break;							
            }
        });
        
        return outputProperties;
    }
    
    function visitPropertiesOrArrayEntries(rootObject, visitorCallback) {
        if (rootObject instanceof Array) {
            for (var i = 0; i < rootObject.length; i++)
                visitorCallback(i);
        } else {
            for (var propertyName in rootObject)
                visitorCallback(propertyName);
        }
    };    
    
    function objectLookup() {
        var keys = [];
        var values = [];
        this.save = function(key, value) {
            var existingIndex = ko.utils.arrayIndexOf(keys, key);
            if (existingIndex >= 0)
                values[existingIndex] = value;
            else {
                keys.push(key);
                values.push(value);	
            }				
        };
        this.get = function(key) {
            var existingIndex = ko.utils.arrayIndexOf(keys, key);
            return (existingIndex >= 0) ? values[existingIndex] : undefined;
        };
    };
})();

ko.exportSymbol('ko.toJS', ko.toJS);
ko.exportSymbol('ko.toJSON', ko.toJSON);(function () {
    // Normally, SELECT elements and their OPTIONs can only take value of type 'string' (because the values
    // are stored on DOM attributes). ko.selectExtensions provides a way for SELECTs/OPTIONs to have values
    // that are arbitrary objects. This is very convenient when implementing things like cascading dropdowns.
    ko.selectExtensions = {
        readValue : function(element) {
            if (element.tagName == 'OPTION') {
                if (element['__ko__hasDomDataOptionValue__'] === true)
                    return ko.utils.domData.get(element, ko.bindingHandlers.options.optionValueDomDataKey);
                return element.getAttribute("value");
            } else if (element.tagName == 'SELECT')
                return element.selectedIndex >= 0 ? ko.selectExtensions.readValue(element.options[element.selectedIndex]) : undefined;
            else
                return element.value;
        },
        
        writeValue: function(element, value) {
            if (element.tagName == 'OPTION') {
                switch(typeof value) {
                    case "string":
                    case "number":
                        ko.utils.domData.set(element, ko.bindingHandlers.options.optionValueDomDataKey, undefined);
                        if ('__ko__hasDomDataOptionValue__' in element) { // IE <= 8 throws errors if you delete non-existent properties from a DOM node
                            delete element['__ko__hasDomDataOptionValue__'];
                        }
                        element.value = value;                                   
                        break;
                    default:
                        // Store arbitrary object using DomData
                        ko.utils.domData.set(element, ko.bindingHandlers.options.optionValueDomDataKey, value);
                        element['__ko__hasDomDataOptionValue__'] = true;
                        element.value = "";
                        break;
                }			
            } else if (element.tagName == 'SELECT') {
                for (var i = element.options.length - 1; i >= 0; i--) {
                    if (ko.selectExtensions.readValue(element.options[i]) == value) {
                        element.selectedIndex = i;
                        break;
                    }
                }
            } else {
                if ((value === null) || (value === undefined))
                    value = "";
                element.value = value;
            }
        }
    };        
})();

ko.exportSymbol('ko.selectExtensions', ko.selectExtensions);
ko.exportSymbol('ko.selectExtensions.readValue', ko.selectExtensions.readValue);
ko.exportSymbol('ko.selectExtensions.writeValue', ko.selectExtensions.writeValue);

ko.jsonExpressionRewriting = (function () {
    var restoreCapturedTokensRegex = /\[ko_token_(\d+)\]/g;
    var javaScriptAssignmentTarget = /^[\_$a-z][\_$a-z0-9]*(\[.*?\])*(\.[\_$a-z][\_$a-z0-9]*(\[.*?\])*)*$/i;
    var javaScriptReservedWords = ["true", "false"];

    function restoreTokens(string, tokens) {
        return string.replace(restoreCapturedTokensRegex, function (match, tokenIndex) {
            return tokens[tokenIndex];
        });
    }

    function isWriteableValue(expression) {
        if (ko.utils.arrayIndexOf(javaScriptReservedWords, ko.utils.stringTrim(expression).toLowerCase()) >= 0)
            return false;
        if(expression[0]=="<" && expression[expression.length-1]==">")
            return true;
        return expression.match(javaScriptAssignmentTarget) !== null;
    }

    return {
        parseJson: function (jsonString) {
            jsonString = ko.utils.stringTrim(jsonString);
            if (jsonString.length < 3)
                return {};

            //@modified
            // added counter of nested curly braces

            // We're going to split on commas, so first extract any blocks that may contain commas other than those at the top level
            var tokens = [];
            var tokenStart = null, tokenEndChar, tokenCounter;
            for (var position = jsonString.charAt(0) == "{" ? 1 : 0; position < jsonString.length; position++) {
                var c = jsonString.charAt(position);
                if (tokenStart === null) {
                    switch (c) {
                        case '"':
                        case "'":
                        case "/":
                            tokenStart = position;
                            tokenEndChar = c;
                            break;
                        case "<":
                            tokenStart = position;
                            tokenEndChar = ">";
                            break;
                        case "{":
                            tokenStart = position;
                            tokenCounter = 1;
                            tokenEndChar = "}";
                            break;
                        case "[":
                            tokenStart = position;
                            tokenEndChar = "]";
                            break;
                    }
                } else if(tokenEndChar == "}" && c == "{") {
                    tokenCounter++;
                } else if(tokenEndChar == "}" && c == "}" && tokenCounter>1) {
                    tokenCounter--;
                } else if (c == tokenEndChar) {
                    var token = jsonString.substring(tokenStart, position + 1);
                    tokens.push(token);
                    var replacement = "[ko_token_" + (tokens.length - 1) + "]";
                    jsonString = jsonString.substring(0, tokenStart) + replacement + jsonString.substring(position + 1);
                    position -= (token.length - replacement.length);
                    tokenStart = null;
                }
            }

            // Now we can safely split on commas to get the key/value pairs
            var result = {};
            var keyValuePairs = jsonString.split(",");
            for (var i = 0, j = keyValuePairs.length; i < j; i++) {
                var pair = keyValuePairs[i];
                var colonPos = pair.indexOf(":");
                if ((colonPos > 0) && (colonPos < pair.length - 1)) {
                    var key = ko.utils.stringTrim(pair.substring(0, colonPos));
                    var value = ko.utils.stringTrim(pair.substring(colonPos + 1));
                    if (key.charAt(0) == "{")
                        key = key.substring(1);
                    if (value.charAt(value.length - 1) == "}")
                        value = value.substring(0, value.length - 1);
                    key = ko.utils.stringTrim(restoreTokens(key, tokens));
                    value = ko.utils.stringTrim(restoreTokens(value, tokens));
                    result[key] = value;
                }
            }
            return result;
        },

        insertPropertyAccessorsIntoJson: function (jsonString) {
            var parsed = ko.jsonExpressionRewriting.parseJson(jsonString);
            var propertyAccessorTokens = [];
            for (var key in parsed) {
                var value = parsed[key];
                if (isWriteableValue(value)) {
                    if (propertyAccessorTokens.length > 0)
                        propertyAccessorTokens.push(", ");
                    propertyAccessorTokens.push(key + " : function(__ko_value) { " + value + " = __ko_value; }");
                }
            }

            if (propertyAccessorTokens.length > 0) {
                var allPropertyAccessors = propertyAccessorTokens.join("");
                jsonString = jsonString + ", '_ko_property_writers' : { " + allPropertyAccessors + " } ";
            }

            return jsonString;
        },

        insertPropertyReaderWritersIntoJson: function (jsonString) {
            var parsed = ko.jsonExpressionRewriting.parseJson(jsonString);
            var propertyAccessorTokens = [];
            var readers = "";
            var isFirst = true;
            for (var key in parsed) {
                var value = parsed[key];
                if (isWriteableValue(value)) {
                    if (propertyAccessorTokens.length > 0)
                        propertyAccessorTokens.push(", ");
                    if(value[0]==="<" && value[value.length-1]===">" && key !== 'about' && key !== 'rel') {
                        propertyAccessorTokens.push(key + " : function(__ko_value) { sko.current = function() { return sko.currentResource(innerNode); }; sko.current().tryProperty('" + value + "') = __ko_value; }");
                    } else if(value.match(/^\[[^,;"\]\}\{\[\.:]+:[^,;"\}\]\{\[\.:]+\]$/) != null && key !== 'about' && key !== 'rel') {
                        propertyAccessorTokens.push(key + " : function(__ko_value) { sko.current = function() { return sko.currentResource(innerNode); }; sko.current().tryProperty('" + value + "') = __ko_value; }");
                    } else if(value[0]==="<" && value[value.length-1]===">" && (key === 'about' || key === 'rel')) {
                        // nothing here
                    } else if(value[0]==="[" && value[value.length-1]==="]" && (key === 'about' || key === 'rel')) {
                        // nothing here
                    } else {
                        if(/tryProperty\([^)]+\)$/.test(value) || /prop\([^)]+\)$/.test(value)) {
                            propertyAccessorTokens.push(key + " : function(__ko_value) { sko.current = function() { return sko.currentResource(innerNode); }; " + value + "(__ko_value); }");
                        } else {
                            propertyAccessorTokens.push(key + " : function(__ko_value) { sko.current = function() { return sko.currentResource(innerNode); }; " + value + " = __ko_value; }");
                        }
                    }
                }
                if(!isFirst)  {
                    readers = readers+", ";
                } else {
                    isFirst = false;
                }
                if(value[0]==='<' && value[value.length-1]==='>' && key !== 'about' && key !== 'rel') {
                    readers = readers+key+": (function(){ sko.current = function() { return sko.currentResource(innerNode); }; return sko.current().tryProperty('"+value+"') })()";
                } else if(value.match(/^\[[^,;"\]\}\{\[\.:]+:[^,;"\}\]\{\[\.:]+\]$/) != null && key !== 'about' && key !== 'rel') {
                    readers = readers+key+": (function(){ sko.current = function() { return sko.currentResource(innerNode); }; return sko.current().tryProperty('"+value+"') })()";
                } else if(value[0]==="<" && value[value.length-1]===">" && (key === 'about' || key === 'rel')) {
                    readers = readers+key+": '"+value.slice(1,value.length-1)+"'";
                } else if(value.match(/^\[[^,;"\]\}\{\[\.:]+:[^,;"\}\]\{\[\.:]+\]$/) != null && (key === 'about' || key === 'rel')) {
                    readers = readers+key+": sko.rdf.prefixes.resolve('"+value.slice(1,value.length-1)+"')";
                } else {
                    readers = readers+key+": (function(){ sko.current = function() { return sko.currentResource(innerNode); }; return "+value+" })()";
                }
            }

            jsonString = readers;

            if (propertyAccessorTokens.length > 0) {
                var allPropertyAccessors = propertyAccessorTokens.join("");
                jsonString = jsonString + ", '_ko_property_writers' : { " + allPropertyAccessors + " } ";
            }

            return jsonString;
        }

    };
})();

ko.exportSymbol('ko.jsonExpressionRewriting', ko.jsonExpressionRewriting);
ko.exportSymbol('ko.jsonExpressionRewriting.parseJson', ko.jsonExpressionRewriting.parseJson);
ko.exportSymbol('ko.jsonExpressionRewriting.insertPropertyAccessorsIntoJson', ko.jsonExpressionRewriting.insertPropertyAccessorsIntoJson);
ko.exportSymbol('ko.jsonExpressionRewriting.insertPropertyReaderWritersIntoJson', ko.jsonExpressionRewriting.insertPropertyReaderWritersIntoJson);

(function () {
    var defaultBindingAttributeName = "data-bind";
    ko.bindingHandlers = {};

    function parseBindingAttribute(attributeText, viewModel, node) {
        try {
            var json = " { " + ko.jsonExpressionRewriting.insertPropertyReaderWritersIntoJson(attributeText) + " } ";
            return ko.utils.evalWithinScope(json, viewModel === null ? window : viewModel, node);
        } catch (ex) {
            throw new Error("Unable to parse binding attribute.\nMessage: " + ex + ";\nAttribute value: " + attributeText);
        }
    }

    function invokeBindingHandler(handler, element, dataValue, allBindings, viewModel) {
        handler(element, dataValue, allBindings, viewModel);
    }

    ko.applyBindingsToNode = function (node, bindings, viewModel, bindingAttributeName) {
        var isFirstEvaluation = true;
        bindingAttributeName = bindingAttributeName || defaultBindingAttributeName;

        // Each time the dependentObservable is evaluated (after data changes),
        // the binding attribute is reparsed so that it can pick out the correct
        // model properties in the context of the changed data.
        // DOM event callbacks need to be able to access this changed data,
        // so we need a single parsedBindings variable (shared by all callbacks
        // associated with this node's bindings) that all the closures can access.
        var parsedBindings;
        function makeValueAccessor(bindingKey) {
            return function () { return parsedBindings[bindingKey] }
        }
        function parsedBindingsAccessor() {
            return parsedBindings;
        }
        
        new ko.dependentObservable(
            function () {


                var evaluatedBindings, bindingsToBeEvaluated;
                if(typeof(bindings) == 'function') {
                    viewModel['skonode'] = node;
                    bindingsToBeEvaluated = bindings;
                    with(viewModel){ evaluatedBindings =  bindingsToBeEvaluated() };
                } else {
                    evaluatedBindings = bindings;
                }

                parsedBindings = evaluatedBindings || parseBindingAttribute(node.getAttribute(bindingAttributeName), viewModel, node);


                // First run all the inits, so bindings can register for notification on changes
                if (isFirstEvaluation) {
                    for (var bindingKey in parsedBindings) {
                        if (ko.bindingHandlers[bindingKey] && typeof ko.bindingHandlers[bindingKey]["init"] == "function")
                            invokeBindingHandler(ko.bindingHandlers[bindingKey]["init"], node, makeValueAccessor(bindingKey), parsedBindingsAccessor, viewModel);	
                    }                	
                }
                
                // ... then run all the updates, which might trigger changes even on the first evaluation
                for (var bindingKey in parsedBindings) {
                    if (ko.bindingHandlers[bindingKey] && typeof ko.bindingHandlers[bindingKey]["update"] == "function")
                        invokeBindingHandler(ko.bindingHandlers[bindingKey]["update"], node, makeValueAccessor(bindingKey), parsedBindingsAccessor, viewModel);
                }
            },
            null,
            { 'disposeWhenNodeIsRemoved' : node }
        );
        isFirstEvaluation = false;
    };

    ko.applyBindings = function (viewModel, rootNode) {
        if (rootNode && (rootNode.nodeType == undefined))
            throw new Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node (note: this is a breaking change since KO version 1.05)");
        rootNode = rootNode || window.document.body; // Make "rootNode" parameter optional
                
        var elemsWithBindingAttribute = ko.utils.getElementsHavingAttribute(rootNode, defaultBindingAttributeName);
        ko.utils.arrayForEach(elemsWithBindingAttribute, function (element) {
            ko.applyBindingsToNode(element, null, viewModel);
        });
    };
    
    ko.exportSymbol('ko.bindingHandlers', ko.bindingHandlers);
    ko.exportSymbol('ko.applyBindings', ko.applyBindings);
    ko.exportSymbol('ko.applyBindingsToNode', ko.applyBindingsToNode);
})();
// For certain common events (currently just 'click'), allow a simplified data-binding syntax
// e.g. click:handler instead of the usual full-length event:{click:handler}
var eventHandlersWithShortcuts = ['click'];
ko.utils.arrayForEach(eventHandlersWithShortcuts, function(eventName) {
    ko.bindingHandlers[eventName] = {
        'init': function(element, valueAccessor, allBindingsAccessor, viewModel) {
            var newValueAccessor = function () {
                var result = {};
                result[eventName] = valueAccessor();
                return result;
            };
            return ko.bindingHandlers['event']['init'].call(this, element, newValueAccessor, allBindingsAccessor, viewModel);
        }
    }	
});


ko.bindingHandlers['event'] = {
    'init' : function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var eventsToHandle = valueAccessor() || {};
        for(var eventNameOutsideClosure in eventsToHandle) {
            (function() {
                var eventName = eventNameOutsideClosure; // Separate variable to be captured by event handler closure
                if (typeof eventName == "string") {
                    ko.utils.registerEventHandler(element, eventName, function (event) {
                        var handlerReturnValue;
                        var handlerFunction = valueAccessor()[eventName];
                        if (!handlerFunction)
                            return;
                        var allBindings = allBindingsAccessor();
                        
                        try { 
                            handlerReturnValue = handlerFunction.apply(viewModel, arguments);                     	
                        } finally {
                            if (handlerReturnValue !== true) { // Normally we want to prevent default action. Developer can override this be explicitly returning true.
                                if (event.preventDefault)
                                    event.preventDefault();
                                else
                                    event.returnValue = false;
                            }
                        }
                        
                        var bubble = allBindings[eventName + 'Bubble'] !== false;
                        if (!bubble) {
                            event.cancelBubble = true;
                            if (event.stopPropagation)
                                event.stopPropagation();
                        }
                    });
                }
            })();
        }
    }
};

ko.bindingHandlers['submit'] = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel) {
        if (typeof valueAccessor() != "function")
            throw new Error("The value for a submit binding must be a function to invoke on submit");
        ko.utils.registerEventHandler(element, "submit", function (event) {
            var handlerReturnValue;
            var value = valueAccessor();
            try { handlerReturnValue = value.call(viewModel, element); }
            finally {
                if (handlerReturnValue !== true) { // Normally we want to prevent default action. Developer can override this be explicitly returning true.
                    if (event.preventDefault)
                        event.preventDefault();
                    else
                        event.returnValue = false;
                }
            }
        });
    }
};

ko.bindingHandlers['visible'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var isCurrentlyVisible = !(element.style.display == "none");
        if (value && !isCurrentlyVisible)
            element.style.display = "";
        else if ((!value) && isCurrentlyVisible)
            element.style.display = "none";
    }
}

ko.bindingHandlers['enable'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (value && element.disabled)
            element.removeAttribute("disabled");
        else if ((!value) && (!element.disabled))
            element.disabled = true;
    }
};

ko.bindingHandlers['disable'] = { 
    'update': function (element, valueAccessor) { 
        ko.bindingHandlers['enable']['update'](element, function() { return !ko.utils.unwrapObservable(valueAccessor()) }); 		
    } 	
};

ko.bindingHandlers['value'] = {
    'init': function (element, valueAccessor, allBindingsAccessor) { 
        // Always catch "change" event; possibly other events too if asked
        var eventsToCatch = ["change"];
        var requestedEventsToCatch = allBindingsAccessor()["valueUpdate"];
        if (requestedEventsToCatch) {
            if (typeof requestedEventsToCatch == "string") // Allow both individual event names, and arrays of event names
                requestedEventsToCatch = [requestedEventsToCatch];
            ko.utils.arrayPushAll(eventsToCatch, requestedEventsToCatch);
            eventsToCatch = ko.utils.arrayGetDistinctValues(eventsToCatch);
        }
        
        ko.utils.arrayForEach(eventsToCatch, function(eventName) {
            // The syntax "after<eventname>" means "run the handler asynchronously after the event"
            // This is useful, for example, to catch "keydown" events after the browser has updated the control
            // (otherwise, ko.selectExtensions.readValue(this) will receive the control's value *before* the key event)
            var handleEventAsynchronously = false;
            if (ko.utils.stringStartsWith(eventName, "after")) {
                handleEventAsynchronously = true;
                eventName = eventName.substring("after".length);
            }
            var runEventHandler = handleEventAsynchronously ? function(handler) { setTimeout(handler, 0) }
                                                            : function(handler) { handler() };
            
            ko.utils.registerEventHandler(element, eventName, function () {
                runEventHandler(function() {
                    var modelValue = valueAccessor();
                    var elementValue = ko.selectExtensions.readValue(element);
                    if (ko.isWriteableObservable(modelValue))
                        modelValue(elementValue);
                    else {
                        var allBindings = allBindingsAccessor();
                        if (allBindings['_ko_property_writers'] && allBindings['_ko_property_writers']['value'])
                            allBindings['_ko_property_writers']['value'](elementValue); 
                    }
                });
            });	    	
        });
    },
    'update': function (element, valueAccessor) {
        var newValue = ko.utils.unwrapObservable(valueAccessor());
        var elementValue = ko.selectExtensions.readValue(element);
        var valueHasChanged = (newValue != elementValue);
        
        // JavaScript's 0 == "" behavious is unfortunate here as it prevents writing 0 to an empty text box (loose equality suggests the values are the same). 
        // We don't want to do a strict equality comparison as that is more confusing for developers in certain cases, so we specifically special case 0 != "" here.
        if ((newValue === 0) && (elementValue !== 0) && (elementValue !== "0"))
            valueHasChanged = true;
        
        if (valueHasChanged) {
            var applyValueAction = function () { ko.selectExtensions.writeValue(element, newValue); };
            applyValueAction();

            // Workaround for IE6 bug: It won't reliably apply values to SELECT nodes during the same execution thread
            // right after you've changed the set of OPTION nodes on it. So for that node type, we'll schedule a second thread
            // to apply the value as well.
            var alsoApplyAsynchronously = element.tagName == "SELECT";
            if (alsoApplyAsynchronously)
                setTimeout(applyValueAction, 0);
        }
        
        // For SELECT nodes, you're not allowed to have a model value that disagrees with the UI selection, so if there is a
        // difference, treat it as a change that should be written back to the model
        if (element.tagName == "SELECT") {
            elementValue = ko.selectExtensions.readValue(element);
            if(elementValue !== newValue)
                ko.utils.triggerEvent(element, "change");
        }
    }
};

ko.bindingHandlers['options'] = {
    'update': function (element, valueAccessor, allBindingsAccessor) {
        if (element.tagName != "SELECT")
            throw new Error("options binding applies only to SELECT elements");

        var previousSelectedValues = ko.utils.arrayMap(ko.utils.arrayFilter(element.childNodes, function (node) {
            return node.tagName && node.tagName == "OPTION" && node.selected;
        }), function (node) {
            return ko.selectExtensions.readValue(node) || node.innerText || node.textContent;
        });
        var previousScrollTop = element.scrollTop;

        var value = ko.utils.unwrapObservable(valueAccessor());
        var selectedValue = element.value;
        ko.utils.emptyDomNode(element);

        if (value) {
            var allBindings = allBindingsAccessor();
            if (typeof value.length != "number")
                value = [value];
            if (allBindings['optionsCaption']) {
                var option = document.createElement("OPTION");
                option.innerHTML = allBindings['optionsCaption'];
                ko.selectExtensions.writeValue(option, undefined);
                element.appendChild(option);
            }
            for (var i = 0, j = value.length; i < j; i++) {
                var option = document.createElement("OPTION");
                
                // Apply a value to the option element
                var optionValue = typeof allBindings['optionsValue'] == "string" ? value[i][allBindings['optionsValue']] : value[i];
                optionValue = ko.utils.unwrapObservable(optionValue);
                ko.selectExtensions.writeValue(option, optionValue);
                
                // Apply some text to the option element
                var optionsTextValue = allBindings['optionsText'];
                if (typeof optionsTextValue == "function")
                    optionText = optionsTextValue(value[i]); // Given a function; run it against the data value
                else if (typeof optionsTextValue == "string")
                    optionText = value[i][optionsTextValue]; // Given a string; treat it as a property name on the data value
                else
                    optionText = optionValue;				 // Given no optionsText arg; use the data value itself
                if ((optionText === null) || (optionText === undefined))
                    optionText = "";                                    
                optionText = ko.utils.unwrapObservable(optionText).toString();
                typeof option.innerText == "string" ? option.innerText = optionText
                                                    : option.textContent = optionText;

                element.appendChild(option);
            }

            // IE6 doesn't like us to assign selection to OPTION nodes before they're added to the document.
            // That's why we first added them without selection. Now it's time to set the selection.
            var newOptions = element.getElementsByTagName("OPTION");
            var countSelectionsRetained = 0;
            for (var i = 0, j = newOptions.length; i < j; i++) {
                if (ko.utils.arrayIndexOf(previousSelectedValues, ko.selectExtensions.readValue(newOptions[i])) >= 0) {
                    ko.utils.setOptionNodeSelectionState(newOptions[i], true);
                    countSelectionsRetained++;
                }
            }
            
            if (previousScrollTop)
                element.scrollTop = previousScrollTop;
        }
    }
};
ko.bindingHandlers['options'].optionValueDomDataKey = '__ko.bindingHandlers.options.optionValueDomData__';

ko.bindingHandlers['selectedOptions'] = {
    getSelectedValuesFromSelectNode: function (selectNode) {
        var result = [];
        var nodes = selectNode.childNodes;
        for (var i = 0, j = nodes.length; i < j; i++) {
            var node = nodes[i];
            if ((node.tagName == "OPTION") && node.selected)
                result.push(ko.selectExtensions.readValue(node));
        }
        return result;
    },
    'init': function (element, valueAccessor, allBindingsAccessor) {
        ko.utils.registerEventHandler(element, "change", function () { 
            var value = valueAccessor();
            if (ko.isWriteableObservable(value))
                value(ko.bindingHandlers['selectedOptions'].getSelectedValuesFromSelectNode(this));
            else {
                var allBindings = allBindingsAccessor();
                if (allBindings['_ko_property_writers'] && allBindings['_ko_property_writers']['value'])
                    allBindings['_ko_property_writers']['value'](ko.bindingHandlers['selectedOptions'].getSelectedValuesFromSelectNode(this));
            }
        });    	
    },
    'update': function (element, valueAccessor) {
        if (element.tagName != "SELECT")
            throw new Error("values binding applies only to SELECT elements");

        var newValue = ko.utils.unwrapObservable(valueAccessor());
        if (newValue && typeof newValue.length == "number") {
            var nodes = element.childNodes;
            for (var i = 0, j = nodes.length; i < j; i++) {
                var node = nodes[i];
                if (node.tagName == "OPTION")
                    ko.utils.setOptionNodeSelectionState(node, ko.utils.arrayIndexOf(newValue, ko.selectExtensions.readValue(node)) >= 0);
            }
        }
    }
};

ko.bindingHandlers['text'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if ((value === null) || (value === undefined))
            value = "";
        typeof element.innerText == "string" ? element.innerText = value
                                             : element.textContent = value;
    }
};

ko.bindingHandlers['html'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        ko.utils.setHtml(element, value);
    }
};

ko.bindingHandlers['css'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor() || {});
        for (var className in value) {
            if (typeof className == "string") {
                var shouldHaveClass = ko.utils.unwrapObservable(value[className]);
                ko.utils.toggleDomNodeCssClass(element, className, shouldHaveClass);
            }
        }
    }
};

ko.bindingHandlers['style'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor() || {});
        for (var styleName in value) {
            if (typeof styleName == "string") {
                var styleValue = ko.utils.unwrapObservable(value[styleName]);
                element.style[styleName] = styleValue || ""; // Empty string removes the value, whereas null/undefined have no effect
            }
        }
    }
};

ko.bindingHandlers['uniqueName'] = {
    'init': function (element, valueAccessor) {
        if (valueAccessor()) {
            element.name = "ko_unique_" + (++ko.bindingHandlers['uniqueName'].currentIndex);

            // Workaround IE 6 issue - http://www.matts411.com/post/setting_the_name_attribute_in_ie_dom/
            if (ko.utils.isIe6)
                element.mergeAttributes(document.createElement("<input name='" + element.name + "'/>"), false);
        }
    }
};
ko.bindingHandlers['uniqueName'].currentIndex = 0;

ko.bindingHandlers['checked'] = {
    'init': function (element, valueAccessor, allBindingsAccessor) {
        var updateHandler = function() {            
            var valueToWrite;
            if (element.type == "checkbox") {
                valueToWrite = element.checked;
            } else if ((element.type == "radio") && (element.checked)) {
                valueToWrite = element.value;
            } else {
                return; // "checked" binding only responds to checkboxes and selected radio buttons
            }
            
            var modelValue = valueAccessor();                 
            if ((element.type == "checkbox") && (ko.utils.unwrapObservable(modelValue) instanceof Array)) {
                // For checkboxes bound to an array, we add/remove the checkbox value to that array
                // This works for both observable and non-observable arrays
                var existingEntryIndex = ko.utils.arrayIndexOf(ko.utils.unwrapObservable(modelValue), element.value);
                if (element.checked && (existingEntryIndex < 0))
                    modelValue.push(element.value);
                else if ((!element.checked) && (existingEntryIndex >= 0))
                    modelValue.splice(existingEntryIndex, 1);
            } else if (ko.isWriteableObservable(modelValue)) {            	
                if (modelValue() !== valueToWrite) { // Suppress repeated events when there's nothing new to notify (some browsers raise them)
                    modelValue(valueToWrite);
                }
            } else {
                var allBindings = allBindingsAccessor();
                if (allBindings['_ko_property_writers'] && allBindings['_ko_property_writers']['checked']) {
                    allBindings['_ko_property_writers']['checked'](valueToWrite);
                }
            }
        };
        ko.utils.registerEventHandler(element, "click", updateHandler);

        // IE 6 won't allow radio buttons to be selected unless they have a name
        if ((element.type == "radio") && !element.name)
            ko.bindingHandlers['uniqueName']['init'](element, function() { return true });
    },
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        
        if (element.type == "checkbox") {        	
            if (value instanceof Array) {
                // When bound to an array, the checkbox being checked represents its value being present in that array
                element.checked = ko.utils.arrayIndexOf(value, element.value) >= 0;
            } else {
                // When bound to anything other value (not an array), the checkbox being checked represents the value being trueish
                element.checked = value;	
            }            
            
            // Workaround for IE 6 bug - it fails to apply checked state to dynamically-created checkboxes if you merely say "element.checked = true"
            if (value && ko.utils.isIe6) 
                element.mergeAttributes(document.createElement("<input type='checkbox' checked='checked' />"), false);
        } else if (element.type == "radio") {
            element.checked = (element.value == value);
            
            // Workaround for IE 6/7 bug - it fails to apply checked state to dynamically-created radio buttons if you merely say "element.checked = true"
            if ((element.value == value) && (ko.utils.isIe6 || ko.utils.isIe7))
                element.mergeAttributes(document.createElement("<input type='radio' checked='checked' />"), false);
        }
    }
};

ko.bindingHandlers['attr'] = {
    update: function(element, valueAccessor, allBindingsAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor()) || {};
        for (var attrName in value) {
            if (typeof attrName == "string") {
                var attrValue = ko.utils.unwrapObservable(value[attrName]);
                
                // To cover cases like "attr: { checked:someProp }", we want to remove the attribute entirely 
                // when someProp is a "no value"-like value (strictly null, false, or undefined)
                // (because the absence of the "checked" attr is how to mark an element as not checked, etc.)                
                if ((attrValue === false) || (attrValue === null) || (attrValue === undefined))
                    element.removeAttribute(attrName);
                else 
                    element.setAttribute(attrName, attrValue.toString());
            }
        }
    }
};
ko.templateEngine = function () {
    this['renderTemplate'] = function (templateName, data, options) {
        throw "Override renderTemplate in your ko.templateEngine subclass";
    },
    this['isTemplateRewritten'] = function (templateName) {
        throw "Override isTemplateRewritten in your ko.templateEngine subclass";
    },
    this['rewriteTemplate'] = function (templateName, rewriterCallback) {
        throw "Override rewriteTemplate in your ko.templateEngine subclass";
    },
    this['createJavaScriptEvaluatorBlock'] = function (script) {
        throw "Override createJavaScriptEvaluatorBlock in your ko.templateEngine subclass";
    }
};

ko.exportSymbol('ko.templateEngine', ko.templateEngine);

ko.templateRewriting = (function () {
    var memoizeBindingAttributeSyntaxRegex = /(<[a-z]+\d*(\s+(?!data-bind=)[a-z0-9\-]+(=(\"[^\"]*\"|\'[^\']*\'))?)*\s+)data-bind=(["'])([\s\S]*?)\5/gi;

    return {
        ensureTemplateIsRewritten: function (template, templateEngine) {
            if (!templateEngine['isTemplateRewritten'](template))
                templateEngine['rewriteTemplate'](template, function (htmlString) {
                    return ko.templateRewriting.memoizeBindingAttributeSyntax(htmlString, templateEngine);
                });
        },

        memoizeBindingAttributeSyntax: function (htmlString, templateEngine) {
            return htmlString.replace(memoizeBindingAttributeSyntaxRegex, function () {
                var tagToRetain = arguments[1];
                var dataBindAttributeValue = arguments[6];

                // @modified
                // modified the rewritting function used
                //dataBindAttributeValue = ko.jsonExpressionRewriting.insertPropertyAccessorsIntoJson(dataBindAttributeValue);
                dataBindAttributeValue = ko.jsonExpressionRewriting.insertPropertyReaderWritersIntoJson(dataBindAttributeValue);

                // For no obvious reason, Opera fails to evaluate dataBindAttributeValue unless it's wrapped in an additional anonymous function,
                // even though Opera's built-in debugger can evaluate it anyway. No other browser requires this extra indirection.
                var applyBindingsToNextSiblingScript = "ko.templateRewriting.applyMemoizedBindingsToNextSibling(function() { \
                    return (function() { var innerNode=skonode; return { " + dataBindAttributeValue + " } })() \
                })";
                return templateEngine['createJavaScriptEvaluatorBlock'](applyBindingsToNextSiblingScript) + tagToRetain;
            });
        },

        applyMemoizedBindingsToNextSibling: function (bindings) {
            return ko.memoization.memoize(function (domNode, viewModel) {
                if (domNode.nextSibling) {
                    // @modified
                    sko.traceResources(domNode.nextSibling, viewModel, function(){
                        sko.traceRelations(domNode.nextSibling, viewModel, function(){
                            ko.applyBindingsToNode(domNode.nextSibling, bindings, viewModel);
                        });
                    });
                }
            });
        }
    }
})();

ko.exportSymbol('ko.templateRewriting', ko.templateRewriting);
ko.exportSymbol('ko.templateRewriting.applyMemoizedBindingsToNextSibling', ko.templateRewriting.applyMemoizedBindingsToNextSibling); // Exported only because it has to be referenced by string lookup from within rewritten template

(function () {
    var _templateEngine;
    ko.setTemplateEngine = function (templateEngine) {
        if ((templateEngine != undefined) && !(templateEngine instanceof ko.templateEngine))
            throw "templateEngine must inherit from ko.templateEngine";
        _templateEngine = templateEngine;
    }

    function getFirstNodeFromPossibleArray(nodeOrNodeArray) {
        return nodeOrNodeArray.nodeType ? nodeOrNodeArray
                                        : nodeOrNodeArray.length > 0 ? nodeOrNodeArray[0]
                                        : null;
    }

    function executeTemplate(targetNodeOrNodeArray, renderMode, template, data, options) {
        var dataForTemplate = ko.utils.unwrapObservable(data);

        options = options || {};
        var templateEngineToUse = (options['templateEngine'] || _templateEngine);
        ko.templateRewriting.ensureTemplateIsRewritten(template, templateEngineToUse);
        var renderedNodesArray = templateEngineToUse['renderTemplate'](template, dataForTemplate, options);

        // Loosely check result is an array of DOM nodes
        if ((typeof renderedNodesArray.length != "number") || (renderedNodesArray.length > 0 && typeof renderedNodesArray[0].nodeType != "number"))
            throw "Template engine must return an array of DOM nodes";

        // @modified
        // Change the positoin of switch and if(render
        // so the rendered node is added to the DOM before being unmemoized
        switch (renderMode) {
            case "replaceChildren": ko.utils.setDomNodeChildren(targetNodeOrNodeArray, renderedNodesArray); break;
            case "replaceNode": ko.utils.replaceDomNodes(targetNodeOrNodeArray, renderedNodesArray); break;
            case "ignoreTargetNode": break;
            default: throw new Error("Unknown renderMode: " + renderMode);
        }

        if (renderedNodesArray)
            ko.utils.arrayForEach(renderedNodesArray, function (renderedNode) {
                ko.memoization.unmemoizeDomNodeAndDescendants(renderedNode, [data]);
            });

        if (options['afterRender'])
            options['afterRender'](renderedNodesArray, data);

        return renderedNodesArray;
    }

    ko.renderTemplate = function (template, data, options, targetNodeOrNodeArray, renderMode) {
        options = options || {};
        if ((options['templateEngine'] || _templateEngine) == undefined)
            throw "Set a template engine before calling renderTemplate";
        renderMode = renderMode || "replaceChildren";

        if (targetNodeOrNodeArray) {
            var firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray);
            
            var whenToDispose = function () { return (!firstTargetNode) || !ko.utils.domNodeIsAttachedToDocument(firstTargetNode); }; // Passive disposal (on next evaluation)
            var activelyDisposeWhenNodeIsRemoved = (firstTargetNode && renderMode == "replaceNode") ? firstTargetNode.parentNode : firstTargetNode;
            
            return new ko.dependentObservable( // So the DOM is automatically updated when any dependency changes                
                function () {
                    // Support selecting template as a function of the data being rendered
                    var templateName = typeof(template) == 'function' ? template(data) : template; 

                    var renderedNodesArray = executeTemplate(targetNodeOrNodeArray, renderMode, templateName, data, options);
                    if (renderMode == "replaceNode") {
                        targetNodeOrNodeArray = renderedNodesArray;
                        firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray);
                    }
                },
                null,
                { 'disposeWhen': whenToDispose, 'disposeWhenNodeIsRemoved': activelyDisposeWhenNodeIsRemoved }
            );
        } else {
            // We don't yet have a DOM node to evaluate, so use a memo and render the template later when there is a DOM node
            return ko.memoization.memoize(function (domNode) {
                ko.renderTemplate(template, data, options, domNode, "replaceNode");
            });
        }
    };

    ko.renderTemplateForEach = function (template, arrayOrObservableArray, options, targetNode) {
        return new ko.dependentObservable(function () {
            var unwrappedArray = ko.utils.unwrapObservable(arrayOrObservableArray) || [];
            if (typeof unwrappedArray.length == "undefined") // Coerce single value into array
                unwrappedArray = [unwrappedArray];

            // Filter out any entries marked as destroyed
            var filteredArray = ko.utils.arrayFilter(unwrappedArray, function(item) { 
                return options['includeDestroyed'] || !item['_destroy'];
            });

            ko.utils.setDomNodeChildrenFromArrayMapping(targetNode, filteredArray, function (arrayValue) {
                // Support selecting template as a function of the data being rendered
                var templateName = typeof(template) == 'function' ? template(arrayValue) : template;
                
                return executeTemplate(null, "ignoreTargetNode", templateName, arrayValue, options);
            }, options);
        }, null, { 'disposeWhenNodeIsRemoved': targetNode });
    };

    var templateSubscriptionDomDataKey = '__ko__templateSubscriptionDomDataKey__';
    function disposeOldSubscriptionAndStoreNewOne(element, newSubscription) {
        var oldSubscription = ko.utils.domData.get(element, templateSubscriptionDomDataKey);
        if (oldSubscription && (typeof(oldSubscription.dispose) == 'function'))
            oldSubscription.dispose();
        ko.utils.domData.set(element, templateSubscriptionDomDataKey, newSubscription);
    }
    
    ko.bindingHandlers['template'] = {
        'update': function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var bindingValue = ko.utils.unwrapObservable(valueAccessor());
            var templateName = typeof bindingValue == "string" ? bindingValue : bindingValue.name;
            
            var templateSubscription;
            if (typeof bindingValue['foreach'] != "undefined") {
                // Render once for each data point
                templateSubscription = ko.renderTemplateForEach(templateName, bindingValue['foreach'] || [], { 'templateOptions': bindingValue['templateOptions'], 'afterAdd': bindingValue['afterAdd'], 'beforeRemove': bindingValue['beforeRemove'], 'includeDestroyed': bindingValue['includeDestroyed'], 'afterRender': bindingValue['afterRender'] }, element);
            }
            else {
                // Render once for this single data point (or use the viewModel if no data was provided)
                var templateData = bindingValue['data'];
                templateSubscription = ko.renderTemplate(templateName, typeof templateData == "undefined" ? viewModel : templateData, { 'templateOptions': bindingValue['templateOptions'], 'afterRender': bindingValue['afterRender'] }, element);
            }
            
            // It only makes sense to have a single template subscription per element (otherwise which one should have its output displayed?)
            disposeOldSubscriptionAndStoreNewOne(element, templateSubscription);
        }
    };
})();

ko.exportSymbol('ko.setTemplateEngine', ko.setTemplateEngine);
ko.exportSymbol('ko.renderTemplate', ko.renderTemplate);

(function () {
    // Simple calculation based on Levenshtein distance.
    function calculateEditDistanceMatrix(oldArray, newArray, maxAllowedDistance) {
        var distances = [];
        for (var i = 0; i <= newArray.length; i++)
            distances[i] = [];

        // Top row - transform old array into empty array via deletions
        for (var i = 0, j = Math.min(oldArray.length, maxAllowedDistance); i <= j; i++)
            distances[0][i] = i;

        // Left row - transform empty array into new array via additions
        for (var i = 1, j = Math.min(newArray.length, maxAllowedDistance); i <= j; i++) {
            distances[i][0] = i;
        }

        // Fill out the body of the array
        var oldIndex, oldIndexMax = oldArray.length, newIndex, newIndexMax = newArray.length;
        var distanceViaAddition, distanceViaDeletion;
        for (oldIndex = 1; oldIndex <= oldIndexMax; oldIndex++) {
            var newIndexMinForRow = Math.max(1, oldIndex - maxAllowedDistance);
            var newIndexMaxForRow = Math.min(newIndexMax, oldIndex + maxAllowedDistance);
            for (newIndex = newIndexMinForRow; newIndex <= newIndexMaxForRow; newIndex++) {
                if (oldArray[oldIndex - 1] === newArray[newIndex - 1])
                    distances[newIndex][oldIndex] = distances[newIndex - 1][oldIndex - 1];
                else {
                    var northDistance = distances[newIndex - 1][oldIndex] === undefined ? Number.MAX_VALUE : distances[newIndex - 1][oldIndex] + 1;
                    var westDistance = distances[newIndex][oldIndex - 1] === undefined ? Number.MAX_VALUE : distances[newIndex][oldIndex - 1] + 1;
                    distances[newIndex][oldIndex] = Math.min(northDistance, westDistance);
                }
            }
        }

        return distances;
    }

    function findEditScriptFromEditDistanceMatrix(editDistanceMatrix, oldArray, newArray) {
        var oldIndex = oldArray.length;
        var newIndex = newArray.length;
        var editScript = [];
        var maxDistance = editDistanceMatrix[newIndex][oldIndex];
        if (maxDistance === undefined)
            return null; // maxAllowedDistance must be too small
        while ((oldIndex > 0) || (newIndex > 0)) {
            var me = editDistanceMatrix[newIndex][oldIndex];
            var distanceViaAdd = (newIndex > 0) ? editDistanceMatrix[newIndex - 1][oldIndex] : maxDistance + 1;
            var distanceViaDelete = (oldIndex > 0) ? editDistanceMatrix[newIndex][oldIndex - 1] : maxDistance + 1;
            var distanceViaRetain = (newIndex > 0) && (oldIndex > 0) ? editDistanceMatrix[newIndex - 1][oldIndex - 1] : maxDistance + 1;
            if ((distanceViaAdd === undefined) || (distanceViaAdd < me - 1)) distanceViaAdd = maxDistance + 1;
            if ((distanceViaDelete === undefined) || (distanceViaDelete < me - 1)) distanceViaDelete = maxDistance + 1;
            if (distanceViaRetain < me - 1) distanceViaRetain = maxDistance + 1;

            if ((distanceViaAdd <= distanceViaDelete) && (distanceViaAdd < distanceViaRetain)) {
                editScript.push({ status: "added", value: newArray[newIndex - 1] });
                newIndex--;
            } else if ((distanceViaDelete < distanceViaAdd) && (distanceViaDelete < distanceViaRetain)) {
                editScript.push({ status: "deleted", value: oldArray[oldIndex - 1] });
                oldIndex--;
            } else {
                editScript.push({ status: "retained", value: oldArray[oldIndex - 1] });
                newIndex--;
                oldIndex--;
            }
        }
        return editScript.reverse();
    }

    ko.utils.compareArrays = function (oldArray, newArray, maxEditsToConsider) {
        if (maxEditsToConsider === undefined) {
            return ko.utils.compareArrays(oldArray, newArray, 1)                 // First consider likely case where there is at most one edit (very fast)
                || ko.utils.compareArrays(oldArray, newArray, 10)                // If that fails, account for a fair number of changes while still being fast
                || ko.utils.compareArrays(oldArray, newArray, Number.MAX_VALUE); // Ultimately give the right answer, even though it may take a long time
        } else {
            oldArray = oldArray || [];
            newArray = newArray || [];
            var editDistanceMatrix = calculateEditDistanceMatrix(oldArray, newArray, maxEditsToConsider);
            return findEditScriptFromEditDistanceMatrix(editDistanceMatrix, oldArray, newArray);
        }
    };    
})();

ko.exportSymbol('ko.utils.compareArrays', ko.utils.compareArrays);

(function () {
    // Objective:
    // * Given an input array, a container DOM node, and a function from array elements to arrays of DOM nodes,
    //   map the array elements to arrays of DOM nodes, concatenate together all these arrays, and use them to populate the container DOM node
    // * Next time we're given the same combination of things (with the array possibly having mutated), update the container DOM node
    //   so that its children is again the concatenation of the mappings of the array elements, but don't re-map any array elements that we
    //   previously mapped - retain those nodes, and just insert/delete other ones

    function mapNodeAndRefreshWhenChanged(containerNode, mapping, valueToMap) {
        // Map this array value inside a dependentObservable so we re-map when any dependency changes
        var mappedNodes = [];
        var dependentObservable = ko.dependentObservable(function() {
            var newMappedNodes = mapping(valueToMap) || [];
            
            // On subsequent evaluations, just replace the previously-inserted DOM nodes
            if (mappedNodes.length > 0)
                ko.utils.replaceDomNodes(mappedNodes, newMappedNodes);
            
            // Replace the contents of the mappedNodes array, thereby updating the record
            // of which nodes would be deleted if valueToMap was itself later removed
            mappedNodes.splice(0, mappedNodes.length);
            ko.utils.arrayPushAll(mappedNodes, newMappedNodes);
        }, null, { 'disposeWhenNodeIsRemoved': containerNode, 'disposeWhen': function() { return (mappedNodes.length == 0) || !ko.utils.domNodeIsAttachedToDocument(mappedNodes[0]) } });
        return { mappedNodes : mappedNodes, dependentObservable : dependentObservable };
    }

    ko.utils.setDomNodeChildrenFromArrayMapping = function (domNode, array, mapping, options) {
        // Compare the provided array against the previous one
        array = array || [];
        options = options || {};
        var isFirstExecution = ko.utils.domData.get(domNode, "setDomNodeChildrenFromArrayMapping_lastMappingResult") === undefined;
        var lastMappingResult = ko.utils.domData.get(domNode, "setDomNodeChildrenFromArrayMapping_lastMappingResult") || [];
        var lastArray = ko.utils.arrayMap(lastMappingResult, function (x) { return x.arrayEntry; });
        var editScript = ko.utils.compareArrays(lastArray, array);

        // Build the new mapping result
        var newMappingResult = [];
        var lastMappingResultIndex = 0;
        var nodesToDelete = [];
        var nodesAdded = [];
        var insertAfterNode = null;
        for (var i = 0, j = editScript.length; i < j; i++) {
            switch (editScript[i].status) {
                case "retained":
                    // Just keep the information - don't touch the nodes
                    var dataToRetain = lastMappingResult[lastMappingResultIndex];
                    newMappingResult.push(dataToRetain);
                    if (dataToRetain.domNodes.length > 0)
                        insertAfterNode = dataToRetain.domNodes[dataToRetain.domNodes.length - 1];
                    lastMappingResultIndex++;
                    break;

                case "deleted":
                    // Stop tracking changes to the mapping for these nodes
                    lastMappingResult[lastMappingResultIndex].dependentObservable.dispose();
                
                    // Queue these nodes for later removal
                    ko.utils.arrayForEach(lastMappingResult[lastMappingResultIndex].domNodes, function (node) {
                        nodesToDelete.push({
                          element: node,
                          index: i,
                          value: editScript[i].value
                        });
                        insertAfterNode = node;
                    });
                    lastMappingResultIndex++;
                    break;

                case "added": 
                    var mapData = mapNodeAndRefreshWhenChanged(domNode, mapping, editScript[i].value);
                    var mappedNodes = mapData.mappedNodes;
                    
                    // On the first evaluation, insert the nodes at the current insertion point
                    newMappingResult.push({ arrayEntry: editScript[i].value, domNodes: mappedNodes, dependentObservable: mapData.dependentObservable });
                    for (var nodeIndex = 0, nodeIndexMax = mappedNodes.length; nodeIndex < nodeIndexMax; nodeIndex++) {
                        var node = mappedNodes[nodeIndex];
                        nodesAdded.push({
                          element: node,
                          index: i,
                          value: editScript[i].value
                        });
                        if (insertAfterNode == null) {
                            // Insert at beginning
                            if (domNode.firstChild)
                                domNode.insertBefore(node, domNode.firstChild);
                            else
                                domNode.appendChild(node);
                        } else {
                            // Insert after insertion point
                            if (insertAfterNode.nextSibling)
                                domNode.insertBefore(node, insertAfterNode.nextSibling);
                            else
                                domNode.appendChild(node);
                        }
                        insertAfterNode = node;
                    }    		
                    break;
            }
        }
        
        ko.utils.arrayForEach(nodesToDelete, function (node) { ko.cleanNode(node.element) });

        var invokedBeforeRemoveCallback = false;
        if (!isFirstExecution) {
            if (options['afterAdd']) {
                for (var i = 0; i < nodesAdded.length; i++)
                    options['afterAdd'](nodesAdded[i].element, nodesAdded[i].index, nodesAdded[i].value);
            }
            if (options['beforeRemove']) {
                for (var i = 0; i < nodesToDelete.length; i++)
                    options['beforeRemove'](nodesToDelete[i].element, nodesToDelete[i].index, nodesToDelete[i].value);
                invokedBeforeRemoveCallback = true;
            }
        }
        if (!invokedBeforeRemoveCallback)
            ko.utils.arrayForEach(nodesToDelete, function (node) {
                if (node.element.parentNode)
                    node.element.parentNode.removeChild(node.element);
            });

        // Store a copy of the array items we just considered so we can difference it next time
        ko.utils.domData.set(domNode, "setDomNodeChildrenFromArrayMapping_lastMappingResult", newMappingResult);
    }
})();

ko.exportSymbol('ko.utils.setDomNodeChildrenFromArrayMapping', ko.utils.setDomNodeChildrenFromArrayMapping);

ko.jqueryTmplTemplateEngine = function () {
    // Detect which version of jquery-tmpl you're using. Unfortunately jquery-tmpl 
    // doesn't expose a version number, so we have to infer it.
    this.jQueryTmplVersion = (function() {        
        if ((typeof(jQuery) == "undefined") || !jQuery['tmpl'])
            return 0;
        // Since it exposes no official version number, we use our own numbering system. To be updated as jquery-tmpl evolves.
        if (jQuery['tmpl']['tag']) {
            if (jQuery['tmpl']['tag']['tmpl'] && jQuery['tmpl']['tag']['tmpl']['open']) {
                if (jQuery['tmpl']['tag']['tmpl']['open'].toString().indexOf('__') >= 0) {
                    return 3; // Since 1.0.0pre, custom tags should append markup to an array called "__"
                }
            }
            return 2; // Prior to 1.0.0pre, custom tags should append markup to an array called "_"
        }
        return 1; // Very old version doesn't have an extensible tag system
    })();

    this['getTemplateNode'] = function (template) {
        var templateNode = document.getElementById(template);
        if (templateNode == null)
            throw new Error("Cannot find template with ID=" + template);
        return templateNode;
    }

    // These two only needed for jquery-tmpl v1
    var aposMarker = "__ko_apos__";
    var aposRegex = new RegExp(aposMarker, "g");
    
    this['renderTemplate'] = function (templateId, data, options) {
        options = options || {};
        if (this.jQueryTmplVersion == 0)
            throw new Error("jquery.tmpl not detected.\nTo use KO's default template engine, reference jQuery and jquery.tmpl. See Knockout installation documentation for more details.");
        
        if (this.jQueryTmplVersion == 1) {    	
            // jquery.tmpl v1 doesn't like it if the template returns just text content or nothing - it only likes you to return DOM nodes.
            // To make things more flexible, we can wrap the whole template in a <script> node so that jquery.tmpl just processes it as
            // text and doesn't try to parse the output. Then, since jquery.tmpl has jQuery as a dependency anyway, we can use jQuery to
            // parse that text into a document fragment using jQuery.clean().        
            var templateTextInWrapper = "<script type=\"text/html\">" + this['getTemplateNode'](templateId).text + "</script>";
            var renderedMarkupInWrapper = jQuery['tmpl'](templateTextInWrapper, data);
            var renderedMarkup = renderedMarkupInWrapper[0].text.replace(aposRegex, "'");;
            return jQuery['clean']([renderedMarkup], document);
        }
        
        // It's easier with jquery.tmpl v2 and later - it handles any DOM structure
        if (!(templateId in jQuery['template'])) {
            // Precache a precompiled version of this template (don't want to reparse on every render)
            var templateText = this['getTemplateNode'](templateId).text;
            jQuery['template'](templateId, templateText);
        }        
        data = [data]; // Prewrap the data in an array to stop jquery.tmpl from trying to unwrap any arrays
        
        var resultNodes = jQuery['tmpl'](templateId, data, options['templateOptions']);
        resultNodes['appendTo'](document.createElement("div")); // Using "appendTo" forces jQuery/jQuery.tmpl to perform necessary cleanup work
        jQuery['fragments'] = {}; // Clear jQuery's fragment cache to avoid a memory leak after a large number of template renders
        return resultNodes; 
    },

    this['isTemplateRewritten'] = function (templateId) {
        // It must already be rewritten if we've already got a cached version of it
        // (this optimisation helps on IE < 9, because it greatly reduces the number of getElementById calls)
        if (templateId in jQuery['template'])
            return true;
        
        return this['getTemplateNode'](templateId).isRewritten === true;
    },

    this['rewriteTemplate'] = function (template, rewriterCallback) {
        var templateNode = this['getTemplateNode'](template);
        var rewritten = rewriterCallback(templateNode.text);     
        
        if (this.jQueryTmplVersion == 1) {
            // jquery.tmpl v1 falls over if you use single-quotes, so replace these with a temporary marker for template rendering, 
            // and then replace back after the template was rendered. This is slightly complicated by the fact that we must not interfere
            // with any code blocks - only replace apos characters outside code blocks.
            rewritten = ko.utils.stringTrim(rewritten);
            rewritten = rewritten.replace(/([\s\S]*?)(\${[\s\S]*?}|{{[\=a-z][\s\S]*?}}|$)/g, function(match) {
                // Called for each non-code-block followed by a code block (or end of template)
                var nonCodeSnippet = arguments[1];
                var codeSnippet = arguments[2];
                return nonCodeSnippet.replace(/\'/g, aposMarker) + codeSnippet;
            });         	
        }
        
        templateNode.text = rewritten;
        templateNode.isRewritten = true;
    },

    this['createJavaScriptEvaluatorBlock'] = function (script) {
        var splitTemplate = function(dataBindCode)  {
            var regexp1 = /<\$[^>]*>/g;

            if(dataBindCode.split(regexp1).length > 1) {
		var acum = ""
		var rem = null;

		dataBindCode.replace(regexp1,function( all, slash, type, fnargs, target, parens, args ){ 
		    if(rem === null) {
			rem = type;
		    }
	     
		    var parts = rem.split(all);
		    
	     
		    acum = acum +  parts[0] +  all.replace(/</,"<'+").replace(/>/,"+'>");
		    parts.shift();
		    if(parts.length === 1) {
			    acum = acum + parts[0];
		    } else {
			rem = parts.join(all);
		    }
		});

		return acum;
	    } else {
                return dataBindCode;
            }
        };

        var transformedTemplate =  splitTemplate(script);

        // nothing to escape -> regular execution
        if (this.jQueryTmplVersion == 1)
            return "{{= " + transformedTemplate + "}}"
            
        // From v2, jquery-tmpl does some parameter parsing that fails on nontrivial expressions.
        // Prevent it from messing with the code by wrapping it in a further function.
        return "{{ko_code ((function() { return " + transformedTemplate + " })()) }}"
    },

    this.addTemplate = function (templateName, templateMarkup) {
        document.write("<script type='text/html' id='" + templateName + "'>" + templateMarkup + "</script>");
    }
    ko.exportProperty(this, 'addTemplate', this.addTemplate);
    
    if (this.jQueryTmplVersion > 1) {
        jQuery['tmpl']['tag']['ko_code'] = {
            open: (this.jQueryTmplVersion < 3 ? "_" : "__") + ".push($1 || '');"
        };
    }    
};

ko.jqueryTmplTemplateEngine.prototype = new ko.templateEngine();

// Use this one by default
ko.setTemplateEngine(new ko.jqueryTmplTemplateEngine());

ko.exportSymbol('ko.jqueryTmplTemplateEngine', ko.jqueryTmplTemplateEngine);
Utils = {};
Utils.stackCounterLimit = 1000;
Utils.stackCounter = 0;

Utils.recur = function(c){
    if(Utils.stackCounter === Utils.stackCounterLimit) {
        Utils.stackCounter = 0;
        setTimeout(c, 0);
    } else {
        Utils.stackCounter++;
        c();
    } 
};

Utils.repeat = function(c,max,floop,fend,env) {
    if(arguments.length===4) { env = {}; }
    if(c<max) {
        env._i = c;
        floop(function(floop,env){
            // avoid stack overflow
            // deadly hack
            Utils.recur(function(){ Utils.repeat(c+1, max, floop, fend, env); });
        },env);
    } else {
        fend(env);
    }
};

SemanticKnockOut = {};
window['sko'] = SemanticKnockOut;
sko.activeDebug = false;

sko.log = function(msg) {
    if(sko.activeDebug) {
        console.log(msg);
    }
};


/**
 * Manipulate prototypes for RDFS classes
 */
sko.Class = {};
sko.Class.Clone = function() {};
sko.Class.registry = {};
sko.Class.define = function(classExpression, object) {
    sko.Class.registry[sko.NTUri(classExpression.replace(/\s*/g,""))] = object;
};

sko.Class.instance = function() {
    var classUri = sko.NTUri(arguments[0]);
    var base = arguments[1] || {};

    var classPrototype = sko.Class.registry[classUri];
    sko.Class.Clone.prototype = classPrototype;
    var clone = new sko.Class.Clone();

    base.extended = null;

    for(var p in clone) {
        if(base[p] == null) {
            base[p] = clone[p];
        }
    }
    if(base.extended) {
        base.extended();
    }

    return base;    
};

sko.Class.check = function(resource) {
    //var newClasses = {};
    var isFirstRun = arguments[1] || false;

    for(var p in sko.Class.registry) {
        sko.log("*** IS INSTANCE OF? "+p);
        if(sko.Class.isInstance(resource, p)) {
            sko.log("Y!");
            if(isFirstRun || resource.classes[p] == null) {
                sko.Class.instance(p,resource)
            }
            resource.classes[p] = true;
        } else {
            sko.log("N!");
            if(resource.classes[p] != null) {
                delete resource.classes[p];
                for(var m in sko.Class.registry[p]) {
                    // @todo 
                    // check if it is an observer and 
                    // then set the value to null
                    delete resource[m];
                }
            }
        }
    }

    //resource.classes = newClasses;
};

sko.Class.isInstance = function(resource, klass) {
    if(klass.indexOf("ObjectIntersectionOf(") === 0) {
        var parts = klass.slice(0,klass.length-1).split("ObjectIntersectionOf(")[1].split(",");
        for(var i=0; i<parts.length; i++) {
            sko.log("INTERSECTION CHECKING "+parts[i]);
            if(!sko.Class.isInstance(resource, parts[i])) {
                return false;
            }
        }
        return true;
    } else if(klass.indexOf("ObjectUnionOf(") === 0) {
        var parts = klass.slice(0,klass.length-1).split("ObjectUnionOf(")[1].split(",");
        for(var i=0; i<parts.length; i++) {
            if(sko.Class.isInstance(resource, parts[i])) {
                return true;
            }
        }
        return false;
    } else if(klass.indexOf("ObjectSomeValuesFrom(") === 0) {
        var propertyUri = klass.slice(0,klass.length-1).split("ObjectSomeValuesFrom(")[1];
        sko.log("CHECKIN CLASS URI: "+sko.NTUri(propertyUri));
        for(var p in resource.valuesMap) {
            sko.log(" - "+p+" ---> "+resource.valuesMap[sko.NTUri(propertyUri)]);
        }
        return resource.valuesMap[sko.NTUri(propertyUri)] != null
    } else {
        sko.log("CHECKIN CLASS URI: "+sko.NTUri(klass));
        sko.log(resource);
        for(var p in resource.classes) {
            sko.log(" - "+p+" ---> "+resource.classes[p]);
        }

        return resource.classes[sko.NTUri(klass)] === true;
    }
};

/**
 * Starts the library. Call this before anything else.
 */
sko.ready = function()  {

    // reset state
    sko.aboutResourceMap = {};
    sko.aboutResourceSubscriptionMap = {};
    sko.Class.registry = {};
    sko.aboutCounter = 0;
    sko.generatorId = 0;
    sko.generatorsMap = {};

    var cb = null;
    if(arguments.length === 2) {
        sko.store = arguments[0];
        cb = arguments[1];

        sko.rdf = sko.store.rdf;

        cb(true);
    } else {
        cb = arguments[0];
        rdfstore.create(function(store) {
            sko.store = store;
	    // @modified1
	    sko.store.registerDefaultProfileNamespaces();
            sko.rdf = sko.store.rdf;

            cb(true);
        });
    }
};

sko.registerPrefix = function(prefix, uri) {
    sko.store.registerDefaultNamespace(prefix, uri);
};

// blank IDs counter
sko._blankCounter = 0;
sko.nextBlankLabel = function(){
    var blankLabel = "_:sko_"+sko._blankCounter;
    sko._blankCounter++;
    return blankLabel;
}

// Collection of observable resources
sko.aboutResourceMap = {};
sko.aboutResourceSubscriptionMap = {};

sko.aboutCounter = 0;

sko.about = function(aboutValue, viewModel, cb) {
    var currentValue = sko.about[aboutValue];
    if(currentValue != null) {
        // returning an observable that was already registered for this node
        cb(aboutValue);
    } else {
        // the about value hasn't been registered yet

        // identifier
        var nextId = ''+sko.aboutCounter;
        sko.aboutCounter++;

        // this is a blank node
        if(aboutValue == null) {
            aboutValue = sko.nextBlankLabel();
        }

        if(typeof(aboutValue) === 'string') {
            // the value is aconstant URI

            var uri = aboutValue;

            // register the new observer and resource
            sko.store.node(sko.plainUri(uri), function(success, resource) {
                if(success) {
                    sko.log("FOUND RESOURCE: "+uri);
                    sko.log(resource);
                    sko.log(" FOR "+sko.plainUri(uri));
                    // id -> Resource
                    sko.log(" ------------> "+nextId+" : "+uri);
                    sko.aboutResourceMap[nextId] = new sko.Resource(nextId, uri,resource);
                    // id -> observer
                    sko.about[nextId] = ko.observable(uri);
                    
                    // we observe changes in the about resource
                    var subscription = sko.about[nextId].subscribe(function(nextUri) {
                        sko.log("*** OBSERVING NODE ABOT ID:"+nextId+" new value -> "+nextUri);

                        if(nextUri == null) {
                            sko.log(" ** NEXT URI IS NULL, GEN BLANK LABEL");
                            nextUri = sko.nextBlankLabel();
                        }

                        sko.store.node(sko.plainUri(nextUri), function(success, nextResource) {
                            if(success) {
                                var newUri = nextResource.toArray()[0].subject.valueOf();
                                sko.log(" ------------> "+nextId+" : "+newUri+" 2");
                                sko.aboutResourceMap[nextId].about(newUri);
                            } else {
                                // reset resource?
                                sko.log("*** NO RESOURCE FOR URI:"+nextUri);
                                sko.log(" ------------> "+nextId+" : "+nextUri+" 3");
                                sko.aboutResourceMap[nextId].about(nextUri);
                            }
                        });
                    });
                    sko.aboutResourceSubscriptionMap[nextId] = subscription;
                } else {
                    // what here?
                }

                cb(nextId);
            });
        } else {
            // The value is a function (maybe an observer)

            sko.about[nextId] = ko.dependentObservable({
                read: function(){
                    var uri = aboutValue();
                    sko.log("*** OBSERVABLE READING DEPENDING NODE ABOT ID:"+nextId+" new value -> "+uri);

                    if(uri == null) {
                        sko.log(" ** URI IS BLANK -> GEN BLANK LABEL");
                        uri = sko.nextBlankLabel();
                    }

                    return uri;
                },
                write: function(value) {
                    sko.log("*** OBSERVABLE WRITING DEPENDING NODE ABOT ID:"+nextId+" new value -> "+value);
                    if(value == null) {
                        sko.log(" ** URI IS BLANK -> GEN BLANK LABEL");
                        value = sko.nextBlankLabel();
                    }

                    aboutValue(value);
                },
                owner: viewModel 
            });

            // register the new observer and resource
            sko.store.node(sko.plainUri(sko.about[nextId]()), function(success, resource) {
                if(success) {
                    // id -> Resource
                    sko.log(" ------------> "+nextId+" : "+resource+" 4");
                    sko.aboutResourceMap[nextId] = new sko.Resource(nextId, sko.about[nextId](), resource);
                    
                    // we observe changes in the about resource
                    var subscription = sko.about[nextId].subscribe(function(nextUri) {
                        sko.log("*** OBSERVING NODE ABOT ID:"+nextId+" new value -> "+nextUri);
                        if(nextUri != null) {
                            sko.store.node(sko.plainUri(nextUri), function(success, nextResource) {
                                if(success) {
                                    if(nextResource.toArray().length>0) {
                                        var newUri = nextResource.toArray()[0].subject.toNT();
                                        sko.log(" ------------> "+nextId+" : "+newUri+" 5");
                                        sko.aboutResourceMap[nextId].about(newUri);
                                    } else {
                                        // reset resource?
                                        sko.log("*** NO RESOURCE FOR URI:"+nextUri);
                                        sko.log(" ------------> "+nextId+" : "+nextUri+" 6");
                                        sko.aboutResourceMap[nextId].about(nextUri);
                                    }
                                } else {
                                    sko.log("Error updating 3 resource for URI:"+nextUri+" in SKO about node observer");
                                    sko.log("*** NO RESOURCE FOR URI:"+nextUri + " NEXT ID:"+nextId);
                                    sko.log(" ------------> "+nextId+" : "+nextUri+" 7");
                                    sko.aboutResourceMap[nextId].about(nextUri);
                                }
                            });
                        } else {
                            sko.log("*** NO RESOURCE FOR URI:"+nextUri);
                            sko.log(" ------------> "+nextId+" : NEW BLANK  8");
                            sko.aboutResourceMap[nextId].about(sko.nextBlankLabel());
                        }
                    });
                    sko.aboutResourceSubscriptionMap[nextId] = subscription;
                } else {
                    // what here?
                }
                cb(nextId);
            });
        }
    }
};

sko.jsonld = {
        coerce: function(obj, property, type) {
            if(obj['@context'] == null) {
                obj['@context'] = {};
            }
            if(obj['@context']['@coerce'] == null) {
                obj['@context']['@coerce'] = {};
                obj['@context']['@coerce'][type] = property;
            } else if(typeof(obj['@context']['@coerce'][type]) === 'string' &&
                      obj['@context']['@coerce'][type] != property) {
                var oldValue = obj['@context']['@coerce'][type];
                obj['@context']['@coerce'][type] = [oldValue, property];
            } else if(typeof(obj['@context']['@coerce'][type]) === 'object') {
                for(var i=0; i<obj['@context']['@coerce'][type].length; i++) {
                    if(obj['@context']['@coerce'][type][i] === property)  {
                        return obj;
                    }
                }

                obj['@context']['@coerce'][type].push(property);
            } else {
                obj['@context']['@coerce'][type] = property;
            }

            return obj;
        },

        graphToJSONLD: function(graph, rdf) {
            if(rdf==null) {
                rdf = sko.rdf;
            }
            var nodes = {};
            
            graph.forEach(function(triple) {
                var subject = triple.subject.valueOf();
                var node = nodes[subject];
                if(node == null) {
                    node = {"@subject" : subject, "@context": {}};
                    nodes[subject] = node;
                }

                var predicate = triple.predicate.valueOf();
                if(predicate === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                    predicate = "@type";
                }

                var property  = null;
                var isCURIE = false;
                property = rdf.prefixes.shrink(predicate);

                if(property != predicate) {
                    isCURIE = true;
                }
                if(property.indexOf("#") != -1) {
                    property = property.split("#")[1];
                } else {
                    property = property.split("/");
                    property = property[property.length-1];
                }

                var object = triple.object.valueOf();

                if(node[property] != null) {
                    if(!isCURIE) {
                        if(node["@context"][property] != null || property[0] === '@') {
                            if(typeof(node[property]) === "object") {
                                node[property].push(object);
                            } else {
                                var object = [ node[property], object];
                                node[property] = object;
                            }
                        } else {
                            property = triple.predicate.valueOf();
                            if(node[property] == null) {
                                node[property] = object;
                            } else {
                                if(typeof(node[property]) === "object") {
                                    node[property].push(object);
                                } else {
                                    var object = [ node[property], object ];
                                    node[property] = object;
                                }
                            }

                            if(typeof(object) === 'string' &&
                               (object.indexOf("http://") == 0 || object.indexOf("https://") == 0)) {
                                sko.jsonld.coerce(node, property, "@iri")
                            }
                        }
                    } else {
                        var prefix = property.split(":")[0];
                        if(typeof(node[property]) === "object") {
                            node[property].push(object);
                        } else {
                            var object = [ node[property], object];
                            node[property] = object;
                        }
                    }
                } else {
                    node[property] = object;
                    if(property[0] != '@') {
                        if(isCURIE == true) {
                            // saving prefix
                            var prefix = property.split(":")[0];
                            node["@context"][prefix] = rdf.prefixes[prefix];
                        } else {
                            // saving whole URI in context
                            node["@context"][property] = triple.predicate.valueOf();
                        }

                        if(typeof(object) === 'string' &&
                           (object.indexOf("http://") == 0 || object.indexOf("https://") == 0)) {
                            sko.jsonld.coerce(node, property, "@iri")
                        }
                        
                    }
                }
            });

            var results = [];
            for(var p in nodes) {
                results.push(nodes[p]);
            }

            return results;
        }
};

sko.rel = function(relValue, node, viewModel, cb) {
    var nextId = ''+sko.aboutCounter;

    var relValueUri = null;
    sko.aboutCounter++;

    if(typeof(relValue) === 'string') {
        var uri = sko.NTUri(relValue);
        relValueUri = uri;
        
        sko.about[nextId] = ko.dependentObservable({
            read: function(){
                sko.log("*** OBSERVABLE READING RELATED  DEPENDING NODE ABOT ID:"+nextId);
                var resource  = sko.currentResource(jQuery(node).parent().toArray()[0]);
                sko.log(resource);                
                if(resource != null) {
                    sko.log(" ** about:"+resource.about());
                    sko.log("*** Found parent resource: "+resource.about());

                    if(resource[uri]) {
                        var relResourceUri = resource[uri]();
                        if(relResourceUri != null && !sko.isSKOBlankNode(resource[uri]())) {
                            relResourceUri = sko.NTUri(relResourceUri);
                            if(sko.aboutResourceMap[nextId] == null || sko.aboutResourceMap[nextId].about() != relResourceUri) {
                                sko.log("*** found related resource: "+relResourceUri);
                                // register the new observer and resource
                                sko.store.node(sko.plainUri(relResourceUri), function(success, resource) {
                                    sko.log("CREATED NODE FOR ID "+nextId+" AND URI: "+sko.plainUri(relResourceUri));
                                    sko.log(resource);
                                    sko.log(" ------------> "+nextId+" : "+relResourceUri+" 8b");
                                    sko.aboutResourceMap[nextId] = new sko.Resource(nextId, relResourceUri, resource);
                                });
                            } else {
                                sko.log("*** Related resource hasn't changed");
                            }
                            
                            return relResourceUri;
                        } else {
                            if(relResourceUri == null) {
                                sko.log("*** related resource is null");

                                sko.log(" ** NEXT URI IS NULL, GEN BLANK LABEL");
                                var nextUri = sko.nextBlankLabel();
                                
                                sko.log(" ** setting parent node related resource to "+nextUri);
                                resource[uri](nextUri);
                            } else {
                                if(sko.aboutResourceMap[nextId]) {
                                    // @todo here
                                    sko.log("*** setting new value for related resource "+nextUri);
                                    sko.log(" ------------> "+nextId+" : "+nextUri+" 9");
                                    sko.aboutResourceMap[nextId].about(nextUri);
                                } else {
                                    // what here?
                                    sko.log("!! Should I create the new blank node?");
                                }
                            }
                            return nextUri;
                        }
                    } else {
                        sko.log("!!! parent resource doest not link to the related resource");                    
                    }
                } else {
                    sko.log("!!! impossible to find parent resource");
                }},

            // we setup the related object of the parent resource
            // this will trigger the observer that will update this model proxy
            write: function(uri) {

                if(uri == null) {
                    sko.log(" ** NEXT URI IS NULL, GEN BLANK LABEL");
                    uri = sko.nextBlankLabel();
                }

                uri = sko.NTUri(uri);

                sko.log("*** OBSERVABLE WRITING RELATED DEPENDING NODE ABOT ID:"+nextId+" URI -> "+uri);
                var resource  = sko.currentResource(jQuery(node).parent().toArray()[0]);

                if(resource != null) {
                    sko.log("*** Found parent resource: "+resource.about());
                    if(resource[relValueUri]) {
                        sko.log("*** Setting new related resource in parent resource found: "+uri);                    
                        resource[relValueUri](uri);
                    } else {
                        sko.log("!!! parent resource doest not link to the related resource");                    
                    }
                } else {
                    sko.log("!!! impossible to find parent resource");
                }                
            },

            owner: viewModel
        });

        var subscription = sko.about[nextId].subscribe(function(nextUri) {
            sko.log("*** OBSERVING RELATED NODE ABOT ID:"+nextId+" new value -> "+nextUri);
            if(nextUri == null) {
                sko.log(" ** NEXT URI IS NULL, GEN BLANK LABEL");
                nextUri = sko.nextBlankLabel();
            }

            nextUri = sko.NTUri(nextUri);

            if(sko.about[nextId]() != null) {
                if(sko.plainUri(nextUri) !== sko.plainUri(sko.about[nextId]())) {
                    sko.store.node(sko.plainUri(nextUri), function(success, nextResource) {
                        if(success) {
                            var newUri = nextResource.toArray()[0].subject.valueOf();
                            sko.log(" ------------> "+nextId+" : "+uri+" 10");
                            sko.aboutResourceMap[nextId].about(uri);
                        } else {
                            sko.log("Error updating 1 resource for URI:"+nextUri+" in SKO about related node observer");
                        }
                    });
                }
            } else {
                // @todo
                sko.log("!! this resource is now null, should be removed from list of resources?");
            }
        });
        sko.aboutResourceSubscriptionMap[nextId] = subscription;
    } else {
        sko.about[nextId] = ko.dependentObservable({
            read: function(){
                var uri = relValue();
                uri = sko.NTUri(uri);

                sko.log("*** OBSERVABLE READING RELATED DEPENDING NODE ABOT ID:"+nextId+" URI -> "+uri);

                if(uri == null) {
                    sko.log(" ** NEXT URI IS NULL, GEN BLANK LABEL");
                    uri = sko.nextBlankLabel();
                }
                
                var resource  = sko.currentResource(jQuery(node).parent().toArray()[0]);
                if(resource != null) {
                    sko.log("*** Found parent resource: "+resource.about());
                    if(resource[uri]) {
                        var relResourceUri = resource[uri]();
                        
                        sko.log("*** found related resource: "+relResourceUri);
                        // register the new observer and resource
                        sko.store.node(sko.plainUri(relResourceUri), function(success, resource) {
                            sko.log(" ------------> "+nextId+" : "+relResourceUri+" 11");
                            sko.aboutResourceMap[nextId] = new sko.Resource(nextId, relResourceUri, resource);
                        });

                        return relResourceUri;
                    } else {
                        sko.log("!!! parent resource doest not link to the related resource");                    
                    }
                } else {
                    sko.log("!!! impossible to find parent resource");
                }
            },

            // we setup the related object of the parent resource
            // this will trigger the observer that will update this model proxy
            write: function(uri) {
                uri = sko.NTUri(uri);
                var resource  = sko.currentResource(jQuery(node).parent().toArray()[0]);

                sko.log("*** OBSERVABLE WRITING RELATED DEPENDING NODE ABOT ID:"+nextId+" URI -> "+uri);

                if(uri == null) {
                    sko.log(" ** NEXT URI IS NULL, GEN BLANK LABEL");
                    uri = sko.nextBlankLabel();
                }

                if(resource != null) {
                    sko.log("*** Found parent resource: "+resource.about());
                    if(resource[relValue()]) {
                        sko.log("*** Setting new related resource in parent resource found: "+uri);                    
                        resource[relValue()](uri);
                        relValue(uri);
                    } else {
                        sko.log("!!! parent resource doest not link to the related resource");                    
                    }
                } else {
                    sko.log("!!! impossible to find parent resource");
                }                
            },

            owner: viewModel
        });

        var subscription = sko.about[nextId].subscribe(function(nextUri) {
            nextUri = sko.NTUri(nextUri);
            sko.log("*** OBSERVING RELATED NODE (F) ABOT ID:"+nextId+" new value -> "+nextUri);

            if(nextUri == null) {
                sko.log(" ** NEXT URI IS NULL, GEN BLANK LABEL");
                nextUri = sko.nextBlankLabel();
            }

            if(sko.plainUri(nextUri) != sko.plainUri(sko.about[nextId]())) {
                sko.store.node(sko.plainUri(nextUri), function(success, nextResource) {
                    if(success) {
                        var newUri = nextResource.toArray()[0].subject.valueOf();
                        sko.log(" ------------> "+nextId+" : "+newUri+" 12");
                        sko.aboutResourceMap[nextId].about(newUri);
                    } else {
                        sko.log("Error updating  2 resource for URI:"+nextUri+" in SKO about related node observer");
                    }
                });
            } else {
                sko.log("*** Related about resource hasn't changed");
            }
        });
        sko.aboutResourceSubscriptionMap[nextId] = subscription;
    }

    cb(nextId);
};

sko.plainUri = function(uri) {
    if(uri[0] === "<" && uri[uri.length-1] == ">") {
        return uri.slice(1,uri.length-1);
    } else if(uri.match(/\[[^,;"\]\}\{\[\.:]+:[^,;"\}\]\{\[\.:]+\]/) != null) {
        uri = uri.slice(1, uri.length-1);
        resolved = sko.rdf.prefixes.resolve(uri);
        if(resolved == null) {
            throw("The CURIE "+uri+" cannot be resolved");
        } else {
            return resolved;
        }
    } else {
        return uri;
    }
};

sko.effectiveValue = function(term) {
    if(term == null) {
        return null;
    } else {
        if(term.interfaceName && term.interfaceName === 'Literal') {
            if(term.datatype == "http://www.w3.org/2001/XMLSchema#integer" ||
               term.datatype == "http://www.w3.org/2001/XMLSchema#decimal" ||
               term.datatype == "http://www.w3.org/2001/XMLSchema#double" ||
               term.datatype == "http://www.w3.org/2001/XMLSchema#nonPositiveInteger" ||
               term.datatype == "http://www.w3.org/2001/XMLSchema#negativeInteger" ||
               term.datatype == "http://www.w3.org/2001/XMLSchema#long" ||
               term.datatype == "http://www.w3.org/2001/XMLSchema#int" ||
               term.datatype == "http://www.w3.org/2001/XMLSchema#short" ||
               term.datatype == "http://www.w3.org/2001/XMLSchema#byte" ||
               term.datatype == "http://www.w3.org/2001/XMLSchema#nonNegativeInteger" ||
               term.datatype == "http://www.w3.org/2001/XMLSchema#unsignedLong" ||
               term.datatype == "http://www.w3.org/2001/XMLSchema#unsignedInt" ||
               term.datatype == "http://www.w3.org/2001/XMLSchema#unsignedShort" ||
               term.datatype == "http://www.w3.org/2001/XMLSchema#unsignedByte" ||
               term.datatype == "http://www.w3.org/2001/XMLSchema#positiveInteger" ) {
                return parseFloat(term.valueOf());
            } else if(term.type === "http://www.w3.org/2001/XMLSchema#boolean"){
                return (term.valueOf() === 'true' || term.valueOf() === true || term.valueOf() === 'True');
            } else if(term.type === "http://www.w3.org/2001/XMLSchema#string"){
                return term.valueOf();
            } else if(term.type === "http://www.w3.org/2001/XMLSchema#dateTime"){
                return new Date(term.valueOf());
            } else if(term.type == null) {
                return term.valueOf();
            }
        } else {
            return term.valueOf();
        }
    }
};

sko.defaultLanguage = ko.observable(null);

sko.Resource = function(resourceId, subject, node) {
    this.resourceId = resourceId;
    this.valuesMap = {};
    this.subscriptions = [];
    this.literalLangs = {};

    // classes this object is instance of
    this.classes = {};

    var that = this
    
    // default language for literals
    this.defaultLanguage = ko.dependentObservable(function(){
        return sko.defaultLanguage();
    });

    subject = sko.NTUri(subject);

    

    node.forEach(function(triple){
        sko.log(triple);
        if(triple.predicate.toNT() === "<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>") {
            sko.log(" found resource class "+triple.object.toNT());
            that.classes[triple.object.toNT()] = true;
        };

        if(triple.object.interfaceName === 'NamedNode') {
            that.valuesMap[triple.predicate.toNT()] = triple.object.toNT();
            that[triple.predicate.toNT()] = ko.observable(triple.object.toNT());
        } else if(triple.object.interfaceName === 'Literal') {
            if(that.defaultLanguage() != null) {
                if(that.valuesMap[triple.predicate.toNT()] == null || triple.object.language == that.defaultLanguage()) {
                    var effectiveValue = sko.effectiveValue(triple.object.valueOf());
                    that.valuesMap[triple.predicate.toNT()] = effectiveValue;
                    that[triple.predicate.toNT()] = ko.observable(effectiveValue);
                    that[sko.plainUri(triple.predicate.toNT())] = that[triple.predicate.toNT()];
                    that.literalLangs[triple.predicate.toNT()] = triple.object.language;
                }
            } else {
                if(that.valuesMap[triple.predicate.toNT()] == null || triple.object.language == null) {
                    var effectiveValue = sko.effectiveValue(triple.object.valueOf());
                    that.valuesMap[triple.predicate.toNT()] = effectiveValue;
                    that[triple.predicate.toNT()] = ko.observable(effectiveValue);
                    that[sko.plainUri(triple.predicate.toNT())] = that[triple.predicate.toNT()];
                    that.literalLangs[triple.predicate.toNT()] = triple.object.language;
                }
            }
        } else {
            that.valuesMap[triple.predicate.toNT()] = triple.object.valueOf();
            that[triple.predicate.toNT()] = ko.observable(triple.object.valueOf());
            that[sko.plainUri(triple.predicate.toNT())] = that[triple.predicate.toNT()];
        }
    });
    this.about = ko.observable(subject);
    this['@'] = this.about;
    this.storeObserverFn = sko.Resource.storeObserver(this);

    // setup classes
    sko.Class.check(this, true);

    // observe changes in the subject of this resource
    var that = this;
    var subscription = this.about.subscribe(function(newUri){
        sko.log("SKO Resource new resource:"+newUri);

        sko.log("*** STOP OBSERVING NODE STORE");
        sko.store.stopObservingNode(that.storeObserverFn);

        if(newUri != null && newUri.indexOf("_:sko")!=0) {
            sko.log("*** START OBSERVING NODE STORE FOR "+that.about());
            sko.store.startObservingNode(sko.plainUri(newUri), that.storeObserverFn);
        } else {
            sko.log("*** nullifying resources");

            // set properties to null
            for(var p in that.valuesMap) {
                that.valuesMap[p] = null;                
            }
            for(var p in that.valuesMap) {
                that[p](null);
            }
        }
    });

    this.subscriptions.push(subscription);

    
    // observe notifications from KO and the RDF store
    sko.Resource.koObserver(this);
    sko.store.startObservingNode(sko.plainUri(this.about()), that.storeObserverFn);
};


sko.NTUri = function(uri) {
    if(uri[0]==="[" && uri[uri.length-1]==="]") {
        uri = uri.slice(1, uri.length-1);
        resolved = sko.rdf.prefixes.resolve(uri);
        if(uri == null) {
            throw("The CURIE "+uri+" cannot be resolved");
        } else {
            uri = "<"+resolved+">";
        }
    }

    return uri;
};

/**
 * helper method for bound accessors
 */
sko.Resource.prototype.tryProperty = function(property)  {

    property = sko.NTUri(property);

    if(this[property]!=null) {
        return this[property];
    } else {

        this.valuesMap[property] = null;
        this[property] = ko.observable(null);
        var that = this;
        var observerFn = function(newValue){
            that.notifyPropertyChange(property,newValue);
        };
        var subscription = this[property].subscribe(observerFn)
        this.subscriptions.push(subscription);
        return this[property];
    }
};

sko.Resource.prototype.prop = function(property)  {
    return this.tryProperty(property) ;
};

sko.Resource.prototype.getProp = function(property)  {
    return this.tryProperty(property)() ;
};

sko.Resource.prototype.setProp = function(property, newValue)  {
    return this.tryProperty(property)(newValue) ;
};

/**
 * Transforms this resource into JSON-LD using the information
 * in the store
 */
sko.Resource.prototype.toJSON = function(cb) {
    var jsonld = null;
    sko.store.node(sko.plainUri(this.about()),
                   function(res, node) {
                       if(res) {
                           jsonld = sko.jsonld.graphToJSONLD(node);
                           if(cb)
                               cb(true, jsonld);
                       } else {
                           cb(res,node);
                       }
                   });
    return jsonld;
};

/**
 * Must update the value in the RDFstore
 */
sko.Resource.prototype.notifyPropertyChange = function(property, newValue) {
    sko.log("*** received KO notification for property "+property+" -> "+newValue);
    if(this.valuesMap[property] == null) {
        // property is not defined -> create
        // if it is a blank ID don't do anything
        this.valuesMap[property] = newValue;
        var isBlank = this.about().indexOf("_:sko") === 0
        if(!isBlank) {
            if(newValue != null) {
                if(newValue.indexOf("http") === 0) {
                    sko.store.execute('INSERT DATA { '+this.about()+' '+property+' <'+newValue+'> }', function(){});
                } else if(newValue.indexOf("<") === 0) {
                    sko.store.execute('INSERT DATA { '+this.about()+' '+property+' '+newValue+' }', function(){});
                } else {
                    sko.store.execute('INSERT DATA { '+this.about()+' '+property+' "'+newValue+'" }', function(){});  
                }
            }
        }
    } else {
        if(this.valuesMap[property] !== newValue && !sko.isSKOBlankNode(newValue)) {
            // property is already present and the value has changed -> update
            var oldValue = '"'+this.valuesMap[property]+'"';
            newValue = '"'+newValue+'"';

            if(this.literalLangs[property] != null) {
                oldValue = oldValue+"@"+this.literalLangs[property];
                newValue = newValue+"@"+this.literalLangs[property];                
            }

            //@todo something must be done with datatypes and literals
            var query = "DELETE { "+this.about()+" "+property+" "+oldValue+" }";
            query = query + " INSERT { "+this.about()+" "+property+" "+newValue+" }";
            query = query + " WHERE { "+this.about()+" "+property+" "+oldValue+" }"; 

            query = query.replace(/"</g,"<").replace(/>"/g,">");

            this.valuesMap[property] = newValue;
            sko.log("*** updating STORE: \n  "+query);
            sko.store.execute(query);
        }
    }
};

sko.isSKOBlankNode = function(term) {
    return term.indexOf("_:sko") === 0;
}

sko.Resource.prototype.disconnect = function() {
    sko.log(" ** DISCONNECTING");
    sko.store.stopObservingNode(this.storeObserverFn);
    sko.log(" ** disconnected STORE");
    for(var i=0; i<this.subscriptions.length; i++) {
        sko.log(" ** disconnecting subscription");
        this.subscriptions[i].dispose();
    }

    sko.log(" ** disconnecting resource map");
    sko.aboutResourceSubscriptionMap[this.resourceId].dispose();
    sko.log(" ** deleting");
    delete sko.aboutResourceMap[this.resourceId];
    delete sko.about[this.resourceId];
};

sko.cleanNode = function(node) {
    sko.log("*** CLEANING!");
    sko.log(node);
    var thisId = jQuery(node).attr("aboutId");
    var ids = [];
    if(thisId != null) {
        ids.push(thisId);
    }
    ids = ids.concat(sko.childrenResourceIds(node));
    for(var i=0; i<ids.length; i++) {
        if(sko.aboutResourceMap[ids[i]] != null) {
            sko.log("*** DISCONNECTING "+ids[i]);
            sko.log(sko.aboutResourceMap[ids[i]]);
            sko.aboutResourceMap[ids[i]].disconnect();
        }
    }
}

sko.Resource.koObserver = function(skoResource) {
    var that = this;
    var makeResourceObserver = function(resource,property) {
        sko.log("*** subcribing to property "+property);
        var subscription = resource[property].subscribe(function(value){
            resource.notifyPropertyChange(property,value);
        });
        resource.subscriptions.push(subscription);
    };

    for(var p in skoResource.valuesMap) {
        makeResourceObserver(skoResource,p);
    }
};

sko.Resource.storeObserver = function(skoResource) {
    return function(node)  {
        sko.log("*** received notification change from STORE in resource "+skoResource.about());
        if(skoResource.about().indexOf("_:sko")===0) {
            return;
        }
        var newValues = {};
        var newValuesLangs = {};

        sko.log("*** triples in STORE resource -> "+node.toArray().length);

        node.forEach(function(triple){
            if(triple.object.interfaceName === 'NamedNode') {
                sko.log(" "+triple.predicate.toNT()+" -> "+triple.object.toNT());
                newValues[triple.predicate.toNT()] = triple.object.toNT();
            } else {
                if(skoResource.defaultLanguage() != null) {
                    if(newValues[triple.predicate.toNT()] == null || triple.object.language == skoResource.defaultLanguage()) {
                        sko.log(" "+triple.predicate.toNT()+" -> "+triple.object.valueOf());
                        newValues[triple.predicate.toNT()] = triple.object.valueOf();
                        newValuesLangs[triple.predicate.toNT()] = triple.object.language;
                    }
                } else {
                    if(newValues[triple.predicate.toNT()] == null || triple.object.language == null) {
                        sko.log(" "+triple.predicate.toNT()+" -> "+triple.object.valueOf());
                        newValues[triple.predicate.toNT()] = triple.object.valueOf();
                        newValuesLangs[triple.predicate.toNT()] = triple.object.language;
                    }
                }
            }
        });

        var newValueMap = {};
        var toNullify = [];
        var toUpdate = [];
        var toCreate = [];

        // what has changed?, what need to be removed?
        for(var p in skoResource.valuesMap) {
            if(newValues[p] != null) {
                newValueMap[p] = newValues[p];
                if(skoResource.valuesMap[p] !== newValues[p]) {
                    toUpdate.push(p);
                    if(newValuesLangs[p] != null || skoResource.literalLangs[p] != null) {
                        skoResource.literalLangs[p] = newValuesLangs[p];
                    }
                }
            } else {
                toNullify.push(p);
                delete skoResource.literalLangs[p];
            }
        }

        // what is new?
        for(var p in newValues) {
            if(skoResource.valuesMap[p] == null) {
                toCreate.push(p);
                newValueMap[p] = newValues[p];
                skoResource.literalLangs[p] = newValuesLangs[p];
            }
        }

        // updateValues
        skoResource.valuesMap = newValueMap;

        for(var i=0; i<toNullify.length; i++) {
            sko.log("*** setting value to null "+toNullify[i]+" -> NULL");
            skoResource[toNullify[i]](null);
        }

        for(var i=0; i<toUpdate.length; i++) {
            sko.log("*** updating value "+toUpdate[i]+" -> "+skoResource.valuesMap[toUpdate[i]]);
            skoResource[toUpdate[i]](skoResource.valuesMap[toUpdate[i]]);
        }

        for(var i=0; i<toCreate.length; i++) {
            sko.log("*** new value "+toCreate[i]+" -> "+skoResource.valuesMap[toCreate[i]]);
            skoResource[toCreate[i]] =  ko.observable(skoResource.valuesMap[toCreate[i]]);
            skoResource[sko.plainUri(toCreate[i])] = skoResource[toCreate[i]];
        }
        
        // setup classes
        sko.Class.check(skoResource);

        sko.log("*** END MODIFICATION");
    };    
};

// custom bindings

//ko.bindingHandlers.about = {
//    init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
//        // This will be called when the binding is first applied to an element
//        // Set up any initial state, event handlers, etc. here
// 
//        var value = valueAccessor();
//        $(element).attr("about", value);
//    },
//    
//    update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
//        // This will be called once when the binding is first applied to an element,
//        // and again whenever the associated observable changes value.
//        // Update the DOM element based on the supplied values here.
// 
//        var value = valueAccessor();
//        $(element).attr("about", value);
//    }
//};


// trace resources
sko.traceResources = function(rootNode, model, cb) {
    sko.log("** TRACING:");
    sko.log(rootNode);
    var nodes = [];
    if(jQuery(rootNode).attr("about") || jQuery(rootNode).attr("data-bind")) {
        nodes.push(rootNode);
    }
    var childNodes = jQuery(rootNode).find("*[about], *[data-bind]").toArray();
    nodes = nodes.concat(childNodes);
    var registerFn = function(k,env){
        node = nodes[env._i];
        var about = jQuery(node).attr("about");
        var aboutId = jQuery(node).attr("aboutId");
        if(aboutId == null) {
            var databind;

            if(about == null) {
                dataBind = jQuery(node).attr("data-bind");
                if(dataBind != null) {
                    if(dataBind.indexOf("about:") != -1) {
                        var re = new RegExp("\s*([^ ]+)\s*,?");
                        about = re.exec(dataBind.split("about:")[1])[0];
                        if(about[about.length-1] === ',') {
                            about = about.slice(0,about.length-1);
                        }
                    }
                }
            }

            if(about != null && about != '') {
                if(typeof(about) === 'string' && about[0] !== '<' && about[about.length-1] !== '>' && about[0] !== '[' && about[about.length-1] !== ']') {
                    about = model[about];
                }
                
                sko.about(about, model, function(aboutId) {
                    jQuery(node).attr('aboutId',aboutId);
                    k(registerFn,env);
                });
            } else {
                k(registerFn, env);
            }
        } else {
            k(registerFn, env);
        }
    };

    Utils.repeat(0,nodes.length, registerFn, function(env) {
        cb();
    });
};

/**
 * This function must be called *after* traceResources has been
 * invoked.
 */
sko.currentResource = function(node) {
    sko.log("in current resource");
    sko.log(node);
    if(node == null) {
        sko.log("!!! top of DOM tree, About node not found");
        return null;
    }
    var aboutId = jQuery(node).attr('aboutId');
    sko.log("about id:"+aboutId);

    if(aboutId) {
        var uri = sko.about[aboutId]();
        sko.log("uri:"+uri);
        if(uri != null) {
            return sko.aboutResourceMap[aboutId];
        } else {
            sko.log("!!! current resource is null: "+aboutId);
        }
    } else {
        sko.log("recurring");
        return sko.currentResource(jQuery(node).parent().toArray()[0]);
    }
};

sko.currentResourceNode = function(node) {
    sko.log("in current resource node");
    sko.log(node);
    if(node == null) {
        sko.log("!!! top of DOM tree, About node not found");
        return null;
    }
    var aboutId = jQuery(node).attr('aboutId');
    sko.log("about id:"+aboutId);

    if(aboutId) {
        var uri = sko.about[aboutId]();
        sko.log("uri:"+uri);
        if(uri != null) {
            return node;
        } else {
            sko.log("!!! current resource is null: "+aboutId);
            return null;
        }
    } else {
        sko.log("recurring");
        return sko.currentResourceNode(jQuery(node).parent().toArray()[0]);
    }
};

sko.childrenResourceIds = function(node) {
    return jQuery(node).find("*[aboutId]").map(function(){ return jQuery(this).attr("aboutId") });
};

sko.traceRelations = function(rootNode, model, cb) {
    sko.log("*** TRACING RELATIONS:");
    rootNode = (sko.currentResourceNode(rootNode) || rootNode);
    sko.log("*** FOUND ROOT NODE TO LOOK FOR RELATIONS:");
    sko.log(rootNode);

    var nodes = [];
    if(jQuery(rootNode).attr("rel") || jQuery(rootNode).attr("data-bind")) {
        nodes.push(rootNode);
    }
    var childNodes = jQuery(rootNode).find("*[rel], *[data-bind]").toArray();
    nodes = nodes.concat(childNodes);
    sko.log(" ** NODES TO LOOK FOR RELATED RESOURCES");
    sko.log(nodes);

    var registerFn = function(k,env){
        node = nodes[env._i];
        var rel = jQuery(node).attr("rel");
        var databind;

        if(rel == null) {
            dataBind = jQuery(node).attr("data-bind");
            if(dataBind != null) {
                if(dataBind.indexOf("rel:") != -1) {
                    var re = new RegExp("\s*([^ ]+)\s*,?");
                    rel = re.exec(dataBind.split("rel:")[1])[0];
                    if(rel[rel.length-1] === ',') {
                        rel = rel.slice(0,rel.length-1);
                    }
                }
            }
        }

        if(rel != null && rel != '') {
            if(typeof(rel) === 'string' && rel[0] !== '<' && rel[rel.length-1] !== '>' && rel[0] !== '[' && rel[rel.length-1] !== ']') {
                rel = model[rel];
            }
            
            var nextId = jQuery(node).attr("aboutId");
            if(nextId == null) {
                sko.log("*** CREATING RELATED NODE");
                sko.rel(rel, node, model, function(aboutId) {
                    jQuery(node).attr('aboutId',aboutId);
                    k(registerFn,env);
                });
            } else {
                sko.log("*** NODE IS ALREADY TRACED");
                k(registerFn,env);
            }
        } else {
            k(registerFn, env);
        }

        
    };

    Utils.repeat(0,nodes.length, registerFn, function(env) {
        cb();
    });
};



sko.generatorId = 0;
sko.generatorsMap = {};

sko.where = function(query) {
    query = "select ?subject where "+query;
    var nextId = ''+sko.generatorId;
    sko.generatorId++;

    sko.generatorsMap[nextId] = ko.observable([]);

    sko.log("*** WHERE QUERY: " +query);
    sko.store.startObservingQuery(query, function(bindingsList){
        var acum = [];
        sko.log(" ** RESULTS!!!");

        for(var i=0; i<bindingsList.length; i++) {
            sko.log(" ** ADDING VALUE "+ bindingsList[i].subject.value);
            acum.push("<"+bindingsList[i].subject.value+">");
        }

        sko.log("** SETTING VALUE");
        sko.log(acum)
        sko.generatorsMap[nextId](acum)
    });

    return sko.generatorsMap[nextId];
}

/**
 * Applies bindings and RDF nodes to the DOM tree
 */
sko.applyBindings = function(node, viewModel, cb) {
    if(typeof(node) === 'string') {
        node = jQuery(node)[0];
    }
    
    sko.traceResources(node, viewModel, function(){
        sko.traceRelations(node, viewModel, function(){
            ko.applyBindings(viewModel, node);
            if(cb != null) {
                cb();
            }
        });
    });
};

/**
 * Retrieves the resource object active for a node
 */
sko.resource = function(jqueryPath) {
    var nodes = jQuery(jqueryPath).toArray();
    if(nodes.length === 1) {
        return sko.currentResource(nodes[0]);
    } else {
        var acum = [];
        for(var i=0; i<nodes.length; i++) {
            acum.push(sko.currentResource(nodes[i]));
        }
        return acum;
    }
}

// place holder for the parser
sko.owl = {};
})(window);
