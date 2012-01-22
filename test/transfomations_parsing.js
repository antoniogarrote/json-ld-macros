var macro = require('../src/macro');

var dup = function(data) {
    return JSON.parse(JSON.stringify(data));
};

exports.testContextTranformation = function(test) {
    var stringContext = {'@context': 'http://example.org/json-ld-contexts/event'};
    var arrayContext = {'@context': ['http://example.org/json-ld-contexts/event']};
    var objContext = {'@context': {'a':'b'}};

    // string context
    var fn = macro.buildTransformationFunction("@context", "http://example.org/json-ld-contexts/person");

    var result, context;

    result = fn(dup(stringContext));
    context = result['@context'].sort();
    test.ok(context.length === 2);
    test.ok(context[0] = 'http://example.org/json-ld-contexts/event');
    test.ok(context[1] = 'http://example.org/json-ld-contexts/person');

    result = fn(dup(arrayContext));
    context = result['@context'].sort();
    test.ok(context.length === 2);
    test.ok(context[0] = 'http://example.org/json-ld-contexts/event');
    test.ok(context[1] = 'http://example.org/json-ld-contexts/person');

    result = fn(dup(objContext));
    context = result['@context'];
    test.ok(context.length === 2);
    var stringIdx, objIdx;
    if(typeof(context[0]) === 'string') {
	stringIdx = 0;
	objIdx = 1;
    } else {
	stringIdx = 1;
	objIdx = 0;
    }
    test.ok(context[stringIdx] === "http://example.org/json-ld-contexts/person");
    test.ok(context[objIdx]['a'] === 'b');

    // array context without object
    fn = macro.buildTransformationFunction("@context",["http://example.org/json-ld-contexts/person1", 
						       "http://example.org/json-ld-contexts/person2"])    
    result = fn(dup(stringContext));
    context = result['@context'].sort();
    test.ok(context[0] === 'http://example.org/json-ld-contexts/event');
    test.ok(context[1] === 'http://example.org/json-ld-contexts/person1');
    test.ok(context[2] === 'http://example.org/json-ld-contexts/person2');
    test.ok(context.length === 3);

    result = fn(dup(arrayContext));
    context = result['@context'].sort();
    test.ok(context[0] === 'http://example.org/json-ld-contexts/event');
    test.ok(context[1] === 'http://example.org/json-ld-contexts/person1');
    test.ok(context[2] === 'http://example.org/json-ld-contexts/person2');
    test.ok(context.length === 3);

    result = fn(dup(objContext));
    context = result['@context']
    test.ok(context.length === 3);
    var strings = [];
    for(var i=0; i<context.length; i++) {
	if(typeof(context[i]) === 'string') {
	    strings.push(context[i])
	} else {
	    test.ok(context[i]['a'] === 'b');
	}
	    
    }
    test.ok(strings.length === 2);
    strings = strings.sort();
    test.ok(strings[0] === 'http://example.org/json-ld-contexts/person1');
    test.ok(strings[1] === 'http://example.org/json-ld-contexts/person2');


    // array context with object
    fn = macro.buildTransformationFunction("@context",["http://example.org/json-ld-contexts/person1", 
						       {'c':'d'},
						       "http://example.org/json-ld-contexts/person2"])    
    result = fn(dup(stringContext));
    result = result['@context']
    context = [];
    for(var i=0; i<result.length; i++) {
	if(typeof(result[i]) === 'string') {
	    context.push(result[i]);
	} else {
	    test.ok(result[i]['c'] === 'd');
	}
    }
    context = context.sort();
    test.ok(context[0] === 'http://example.org/json-ld-contexts/event');
    test.ok(context[1] === 'http://example.org/json-ld-contexts/person1');
    test.ok(context[2] === 'http://example.org/json-ld-contexts/person2');
    test.ok(context.length === 3);

    result = fn(dup(arrayContext));
    result = result['@context']
    context = [];
    for(var i=0; i<result.length; i++) {
	if(typeof(result[i]) === 'string') {
	    context.push(result[i]);
	} else {
	    test.ok(result[i]['c'] === 'd');
	}
    }
    context = context.sort();
    test.ok(context[0] === 'http://example.org/json-ld-contexts/event');
    test.ok(context[1] === 'http://example.org/json-ld-contexts/person1');
    test.ok(context[2] === 'http://example.org/json-ld-contexts/person2');
    test.ok(context.length === 3);
 
    result = fn(dup(objContext));
    result = result['@context']
    context = [];
    for(var i=0; i<result.length; i++) {
	if(typeof(result[i]) === 'string') {
	    context.push(result[i]);
	} else {
	    test.ok(result[i]['c'] === 'd');
	    test.ok(result[i]['a'] === 'b');
	}
    }
    context = context.sort();
    test.ok(context[0] === 'http://example.org/json-ld-contexts/person1');
    test.ok(context[1] === 'http://example.org/json-ld-contexts/person2');
    test.ok(context.length === 2);

    // object
    fn = macro.buildTransformationFunction("@context",{'c': 'd'})    
    result = fn(dup(stringContext));
    result = result['@context'];

    context = [];
    for(var i=0; i<result.length; i++) {
	if(typeof(result[i]) === 'string') {
	    context.push(result[i]);
	} else {
	    test.ok(result[i]['c'] === 'd');
	}
    }
    context = context.sort();
    test.ok(context[0] = 'http://example.org/json-ld-contexts/event');
    test.ok(context.length === 1);
    
    result = fn(dup(arrayContext));
    result = result['@context'];
    context = [];
    for(var i=0; i<result.length; i++) {
	if(typeof(result[i]) === 'string') {
	    context.push(result[i]);
	} else {
	    test.ok(result[i]['c'] === 'd');
	}
    }
    context = context.sort();
    test.ok(context.length === 1);
    test.ok(context[0] === 'http://example.org/json-ld-contexts/event');

    test.done();
};

exports.testIDGenTransformation = function(test) {
    
    // tring URI
    var fn = macro.buildTransformationFunction('@id', 'http://test.com/test')
    var data = {};
  
    var result = fn(data);
    test.ok(result['@id'] === 'http://test.com/test');

    // f:valueof
    fn = macro.buildTransformationFunction('@id', {'f:valueof': 'url'});
    data = {'url':'http://test.com/test'}
    result = fn(data);
    test.ok(result['@id'] === 'http://test.com/test');

    // f:prefix
    fn = macro.buildTransformationFunction('@id', [{'f:valueof': 'id'},
						   {'f:prefix': 'http://test.com/'}]);
    data = {'id':'24234234'}
    result = fn(data);
    test.ok(result['@id'] === 'http://test.com/24234234');

    // f:urlencode
    fn = macro.buildTransformationFunction('@id', [{'f:valueof': 'name'},
						   {'f:urlencode': true},
						   {'f:prefix': 'http://test.com/'}]);
    data = {'name': 'Helena Martín'};
    result = fn(data);
    test.ok(result['@id'] === 'http://test.com/Helena%20Mart%EDn');

    // f:apply
    fn = macro.buildTransformationFunction('@id', [{'f:valueof': 'name'},
						   {'f:apply': 'escape(this)'},
						   {'f:prefix': 'http://test.com/'}]);
    data = {'name': 'Helena Martín'};
    result = fn(data);
    test.ok(result['@id'] === 'http://test.com/Helena%20Mart%EDn');


    test.done();
};

exports.testTypeGenTransformation = function(test) {
    
    // string URI
    var fn = macro.buildTransformationFunction('@type', 'http://test.com/Test')
    var data = {};
  
    var result = fn(data);
    test.ok(result['@type'] === 'http://test.com/Test');

    // aray of string URIs
    fn = macro.buildTransformationFunction('@type', ['http://test.com/Test1', 'http://test.com/Test2']);
    result = fn(data);
    result['@type'] = result['@type'].sort();
    test.ok(result['@type'][0] === 'http://test.com/Test1');
    test.ok(result['@type'][1] === 'http://test.com/Test2');

    // @valueof
    fn = macro.buildTransformationFunction('@type', {'f:valueof': 'url'});
    data = {'url':'http://test.com/test'}
    result = fn(data);
    test.ok(result['@type'] === 'http://test.com/test');


    test.done();
};

exports.testRemoveTransformation = function(test) {
    
    var fn = macro.buildTransformationFunction('@remove', 'toremove');
    var data = {'toremove': true, 'data': true};
    result = fn(data);
    test.ok(result['toremove'] === undefined);
    test.ok(result['data'] === true);

    fn = macro.buildTransformationFunction('@remove', ['toremove1','toremove2']);
    data = {'toremove1': true, 'toremove2':true, 'data': true};
    result = fn(data);
    test.ok(result['toremove1'] === undefined);
    test.ok(result['toremove2'] === undefined);
    test.ok(result['data'] === true);
    test.done();


}