# JSON-LD Macros

JSON-LD Macros is a library to define declarative transformations of JSON objects obtained from a remote web service into JSON-LD objects. The ultimate goal of the library is to make it easier the process of consuming JSON APIs from RDF/JSON-LD applications. Similar ideas for transforming JSON documents into RDF have been explored in projects like [jsonGRDDL](http://buzzword.org.uk/2008/jsonGRDDL/spec.20100903).

A demo is available [here](http://antoniogarrote.github.com/json-ld-macros/) .

## A Minimal example

    // requires the library
    var macros = require('jsonld_macros');
     
    macros.registerAPI({
   
      // URI template for a remote service (Github Users' API)
      "https://api.github.com/users/*": 

      {"$": // selects the root node / list of root nodes of the JSON document

        { // a JSON-LD context that will be added to all the slected nodes
          "@context": {"data":"http://socialrdf.org/github/datafeed"}, 
          // removes the meta property and associated value from the selected nodes
          "@remove":"meta"}, 

        "$.data": // selects the root node/data objects

         {// by default, all properties in the selected nodes will have the 'gh' prefix
          "@ns": {"ns:default": "gh"}, 
          // a JSON-LD context declaration that will be added to all the selecte nodes
          "@context": {"gh":"http://socialrdf.org/github/"}, 
          // a JSON-LD type declaration that will be added to all the selecte nodes
          "@type": "http://socialrdf.org/github/User"}}
    });
     
    // We retrieve the data using whatever transport layer is
    // available: AJAX, TCP sockets...
    var resourceURI = "https://api.github.com/users/1";
    retrieveRemoteData(resourceURI, function(data){
      
       // we can apply the transformation to the retrieved data
       // passing the URI used to retrieve the data
       // as a selector for the transformation
       var jsonld = macros.resolve(resourceURI, data);
    });

## Definition of transformations

JSON-LD Macros fundamental concept is the description of JSON documents transformations encoded as JSON objects.
Transformation objects can be used to describe a service API associating a transformation to a list of URIs templates.
Transformations in turn are composed of pairs key-values where the key declares a 'selector' of nodes in the JSON object to transform. The value consist in a collection of transformation rules from a fixes set of possible rules: "@context", "@id", "@type", "@remove", "@only", "@ns" and "@transform".
When the transformation is applied to a JSON object retrieved from a URI matching one of the declared templates, each of the node selectors defined for that transformation is evaluated in the retrieved object. The output of this evaluation is a collection of nodes per node selector. For every collection of nodes, the transformation rules are applied inplace. After applying all the transformations, the resulting DOM document is returned as the final output.
Transformation bodies can consist, in some cases, in an array of objects containing functions that can be applied to the selected node to obtain the value that will be used by the transformation.

The following grammar describes the structure of an API transformation definition:

- API ::= {@declare:functionDeclarations}? , {URIPatterns: Transformation}*
- URIPatterns ::= URIPattern[,URIPattern]*
- Transformation ::= {NodeSelector: TransformationRules}
- TransformationRules ::= {TransformationRuleName: TransformationRuleBody}*
- TransformationRuleName ::= @context | @id | @type | @remove | @only | @ns | @transform
- TransformationRuleBody ::= FunctionsArray | JSON String | JSON Object

The following sections describe how to declare URI patterns, node selectors and transformations.

### URI Patterns

URI patterns are regular URIs where variable parts of the path, like identifiers,  can be replaced by the '*'. Several URI patterns can be assigned to the same transformation when describing an API separating each pattern by ",". Blank spaces between patterns are ignored. When a path is evaluated trying to match a provided URI request parameters are ignored.

### Node Selectors

Node selectors syntax is taken from [JSON Path](http://goessner.net/articles/JsonPath/) but the semantics are slightly modified to match the behaviour os selector libraries like jQuery.
Paths are chains of names identifying JSON objects propertes separated by '.' characters. Some characters can be used for special purposes:

- '$': Selects the root of the document. It can be a single JSON object if the document includes a single object or a collection of objects if the root object in the document is an array.
- '*': Selects all the objects linked to any property of the selected nodes.
- '..': Recursive evaluation of the rest of the path expression.
- 'propertyName[ * ]': if 'propertyName' returns an array of objects, 'propertyName[*]' aggregates all the objects in the selected arrays.


Evaluation of the selector is accomplished from left to right. For every component in the path, it is evaluated in the current set of selected nodes. After evaluation, the selected nodes set is replaced by the output of the evaluation. The set of selected nodes start with the empty set.


### Transformation Rules

Transformation rules are JSON objects where the keys of the object identified certain standard transformations that can be performed in the input object and the values describe particular details of the transformation rule. A fixed set of transformation rules is available: "@context", "@id", "@type", "@remove", "@only", "@ns" and "@transform".

Rules are applied in the following order:

- @context, @id, @type, @transform
- @remove
- @only
- @ns

Rules are applied inplace in the target object without cloning or reserving any additional memory.
Some transformation rules like "@id", "@type" and "@transform" accept as the rule body an array of functions that will applied to the target object to obtain the final value generated by the rule.
Additional functions can be declared in the API definition.

This is a description of the different transformations

### @context

Defines a context JSON-LD object that is inserted in the target object. The body of the rule is the JSON object defining the JSON-LD context that will be inserted

### @id 

Defines how the @id JSON-LD attribute will be generated in the transformed object. Possible rule values can be:

- JSON string: a fixed string that will be inserted as the value of the @id property in all the nodes
- An array of functions that will be applied to each selected node to obtain the value of the @id JSON-LD object.

### @type

Defines how the @type JSON-LD attribute will be generated in the transformed object. Possible rule values can be:

- JSON string: a fixed string that will be inserted as the value of the @type property in all the nodes
- JSON array: an array of fixed strings that will be inserted as the value of the @type property in all the nodes
- An array of functions that will be applied to each selected node to obtain the value of the @id JSON-LD object.

### @transform

Defines a generic transformation for a property of the selected nodes that will be applied to the initial value of the property to obtain the final value for that property in the transformed object.
The body of the rule must be a JSON object with a single key with the name of the property to transform and a value containing the array of function to apply to the initial value.

### @remove

This rule can be used to delete properties of the selected nodes. Possible values are a single string with the name of the property to remove or an array of properties that will be removed.

### @only

Collects a set of properties from the selected nodes and delete the remaining properties. Possible values for the this rule body are a single property to select or an array witht the properties that must be collected.

### @ns

This rule transforms the names of the properties in the selected nodes. The rule body consist of an object containgin functions that will be applied to the object property names to obtain the final properties. This rule is applied after all other rules have been applied. When referring to property names in other rules, the name of the property before applying this rule must be used.
Possible functions that can be used in the rule body are:

- 'ns:default': the value of this function is a default prefix that will be preppended to all the properties in the current node to transform them into CURIEs
- 'ns:append': accepts an object with prefixes as keys and a property name or array of property names as value. When applied, this function preppends the prefix to all the selected property names.
- 'ns:replace': Similar to 'ns:append', but instead of a prefix, it accepts as key fo the rule body object a string that will replace enterily the selected property names
- 'ns:omit': accepts a single string property name or an array of properties name that will be not affected by any other funcition in the rule body.

## Functions

Functions are expressed as a single object or an array of JSON objects where each object contains the declaration of a function application that will be issued to the selected node.
Function applications contain the name of the function as the key of the object and a parameter as the value.
When an array of functions is declared, each function application will be applied consequtively, receiving as parameters the argument defined in the function application, the output of the previous function application in the array and the selected node where the tansformation is being applied. The first function in the chain will receive null as the input value.
New functions can be defined in the API declaration using a prefixed name for the functions and invoked in the body of rules.

A collection of functions are already available for transformations:

- 'f:valueof': selects the value of function argument in the context object and returns it.
- 'f:defaultvalue': sets a default value if the current value in the function application chain is null
- 'f:select': selects the value of the function argument in the input object and returns it.
- 'f:prefix': adds a prefix passed as the function argument and add it to the input object before returning it.
- 'f:urlencode': Performs URL encoding into the input object. The function argument is ignored.
- 'f:apply': Accepts a string of JavaScript code as the function argument, evaluates it and applies the resulting function to the input object. Evaluation is scoped with the input object using code like: (new Function('with(this) { return '+functionArgumentTexT+';}')).call(inputObject)

## Null properties and function application exception

One main problem when applying transformations with null properties. Some object in the input data may have optional values, or the application of a function may return an unexpected null value. The library can react to this events in two different ways depending of the value of the 'behaviour' property. If the 'behaviour' property is set to the value 'loose', exceptions in the application of function chains will be catched and a null value will be returned as the result of the function chain application. Additionally, after transforming a node, properties with null values will be removed, including the '@id' property.

If the value of the 'behaviour' property is set to 'strict', exceptions will not be catched and final values of the transformations will be returned including null values.


## Function declarations

Additional functions can be declared in the definition of a API using the '@declare' property. Function declarations accepts as the value of the '@declare' property a JSON object containing  pairs of CURIEs and function literals. for every prefix used in the curies, an additional property must map the prefix to the URI prefix.

The following code shows an example of how a function can be declared in an API definition:


    {
      '@declare': 
      {
        // 'test' is a prefix
        'test': 'http://socialrdf.org/functions/',
        // declaration of the 'test:f' function
        'test:f': 'function(argument, input, obj){ return "the "+argument+" "+input }'
      },
     
      "https://api.github.com/users/*,\
       https://api.github.com/users/*/friends/*": 
      {
         '$': {'@ns': {'ns:default': 'gh'},
               '@context': {'gh':'http://socialrdf.org/github/'},
               '@type': 'http://socialrdf.org/github/User',
               '@transform': {
         	      'name': [{'f:valueof':'name'},
                               // we can apply the declared function
            	               {'test:f': 'user name:'}]
                      }
              }
       }
    }

Function will receive three arguments, the function argument declared in the rule body, the input object from the previous function application and the context object.


## RDFStore-JS integration

One goal in the development of the library was to make it easier to consume non RDF APIs from web applications using [RDFStore-JS](https://github.com/antoniogarrote/rdfstore-js) in the data layer. Once a API has been registered in the library, an instance of RDFStore-JS can be wrapped using the *wrapRDFStoreJSNetworkTransport* function.The wrapped store instance will use then the library to transform JSON objects loaded by the store using the *load* or a SPARQL "LOAD" query, matching one the registered API service URIs templates.


## Author an license

This library is released under the LGPL V3 license. Copyright, Antonio Garrote 2012.
If you have any problem you can find me at antoniogarrote@gmail.com
