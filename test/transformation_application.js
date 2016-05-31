var macro = require('../src/macro').JSONLDMacro;
var rdfstore = require('rdfstore');

var user = {
  "login": "octocat",
  "id": 1,
  "avatar_url": "https://github.com/images/error/octocat_happy.gif",
  "gravatar_id": "somehexcode",
  "url": "https://api.github.com/users/octocat",
  "name": "monalisa octocat",
  "company": "GitHub",
  "blog": "https://github.com/blog",
  "location": "San Francisco",
  "email": "octocat@github.com",
  "hireable": false,
  "bio": "There once was...",
  "public_repos": 2,
  "public_gists": 1,
  "followers": 20,
  "following": 0,
  "html_url": "https://github.com/octocat",
  "created_at": "2008-01-14T04:33:35Z",
  "type": "User"
};

var optionalUser = {
  "login": "octocat",
  "id": 1,
  "gravatar_id": "somehexcode",
  "url": "https://api.github.com/users/octocat",
  "name": "monalisa octocat",
  "company": "GitHub",
  "blog": null,
  "location": "San Francisco",
  "email": "octocat@github.com",
  "hireable": false,
  "bio": "There once was...",
  "public_repos": 2,
  "public_gists": 1,
  "followers": 20,
  "following": 0,
  "created_at": "2008-01-14T04:33:35Z",
  "type": "User"
};

var authenticatedUser = {
  "login": "octocat",
  "id": 1,
  "avatar_url": "https://github.com/images/error/octocat_happy.gif",
  "gravatar_id": "somehexcode",
  "url": "https://api.github.com/users/octocat",
  "name": "monalisa octocat",
  "company": "GitHub",
  "blog": "https://github.com/blog",
  "location": "San Francisco",
  "email": "octocat@github.com",
  "hireable": false,
  "bio": "There once was...",
  "public_repos": 2,
  "public_gists": 1,
  "followers": 20,
  "following": 0,
  "html_url": "https://github.com/octocat",
  "created_at": "2008-01-14T04:33:35Z",
  "type": "User",
  "total_private_repos": 100,
  "owned_private_repos": 100,
  "private_gists": 81,
  "disk_usage": 10000,
  "collaborators": 8,
  "plan": {
    "name": "Medium",
    "space": 400,
    "collaborators": 10,
    "private_repos": 20
  }
};

exports.transformation1 = function(test) {

    var transformationSpecification = {
	'$': {
	    '@id': {'f:valueof': 'url'},
	    '@type': [
		{'f:valueof':'type'},
		{'f:prefix':'https://api.github.com/types#'}],
	    '@transform': {
		'gravatar_id': {'f:prefix':'http://gravatar/something/'}
	    },
	    '@ns': {'ns:default': 'gh',
		    'ns:replace': {'login': 'foaf:nick',
				   'email': 'foaf:mbox',
				   'name': 'foaf:name',
				   'avatar_url': 'foaf:depiction',
				   'gravatar_id': 'foaf:depiction',
				   'blog': 'foaf:homepage',
				   'html_url': 'foaf:homepage'}},
	    '@remove': ['type', 'id', 'url'],
	    '@context': {'foaf':'http://xmlns.com/foaf/0.1/',
			 'gh': 'http://socialrdf.org/github/',
			 'xsd': 'http://www.w3.org/2001/XMLSchema#',
			 'foaf:depiction': { '@type': '@id' },
			 'foaf:homepage': {'@type': '@id'},
			 'gh:created_at': {'@type': 'xsd:date'}
			}
	     }
    };

    var transformation = macro.buildTransformation(transformationSpecification);
    var jsonld = macro.applyTransformation(transformation, JSON.parse(JSON.stringify(user)));

    rdfstore.create(function(err, store) {
	store.load('application/json', jsonld, function(err, loaded) {
	    store.execute("SELECT * { ?s ?p ?o }", function(success, results) {
		test.ok(results.length === 17);
		for(var i=0; i<results.length; i++) {
		    test.ok(results[i].s.value === 'https://api.github.com/users/octocat');
		}
		test.done();
	    });
	});
    });
};

exports.transformation2 = function(test) {
    var transformationSpecification = {
	'$': { '@ns':{ 'ns:default': 'gh' },
	       '@context': { 'gh': 'http://socialrdf.org/github/'} }
    };

    var jsonld = macro.transform(transformationSpecification, JSON.parse(JSON.stringify(user)));

    rdfstore.create(function(err, store) {
	store.load('application/json', jsonld, function(err, loaded) {
	    store.execute("SELECT * { ?s ?p ?o }", function(success, results) {
		test.ok(results.length === 19);
		for(var i=0; i<results.length; i++)
		    test.ok(results[i].s.token === 'blank');
		test.done();
	    });
	});
    });
};

exports.transformation3 = function(test) {
    var transformationSpecification = {

	'$': {'@ns': {'ns:default': 'gh'},
	      '@context': { 'gh': 'http://socialrdf.org/github/'},
	      '@type': 'http://socialrdf.org/github/User'},

	'$.plan': {'@ns': {'ns:default': 'gh'},
		   '@context': { 'gh': 'http://socialrdf.org/github/'},
		   '@type': 'http://socialrdf.org/github/Plan'}
    };

    var jsonld = macro.transform(transformationSpecification, JSON.parse(JSON.stringify(authenticatedUser)));

    rdfstore.create(function(err, store) {
	store.load('application/json', jsonld, function(err, loaded) {
	    store.execute("PREFIX gh: <http://socialrdf.org/github/>\
                           SELECT ?u ?p \
                           WHERE  { ?u a gh:User .\
                                    ?u gh:plan  ?p .\
				    ?p a gh:Plan }",
			  function(success, results) {
			      test.ok(results.length === 1);
			      test.ok(results[0].u.token === 'blank');
			      test.ok(results[0].p.token === 'blank');
			      test.done();
	    });
	});
    });
};

exports.transformation4 = function(test) {
    var transformationSpecification = {
	'$': { '@ns':{ 'ns:default': 'gh' },
	       '@context': { 'gh': 'http://socialrdf.org/github/'},
	       '@type': {'f:defaultvalue': 'http://test.com/vocabulary/Thing'} }
    };

    var jsonld = macro.transform(transformationSpecification, JSON.parse(JSON.stringify(user)));

    test.ok(jsonld['@type'] === 'http://test.com/vocabulary/Thing');
    test.done();
};


exports.transformation5 = function(test) {

    var transformationSpecification = {
	'$': {
	    '@id': {'f:valueof': 'url'},
	    '@type': [
		{'f:valueof':'type'},
		{'f:prefix':'https://api.github.com/types#'}],
	    '@transform': {
		'gravatar_id': [{'f:valueof': 'gravatar_id'},
				{'f:prefix':'http://gravatar/something/'},
			        {'f:apply': 'this will throw an exception'}]
	    },
	    '@ns': {'ns:default': 'gh',
		    'ns:replace': {'login': 'foaf:nick',
				   'email': 'foaf:mbox',
				   'name': 'foaf:name',
				   'avatar_url': 'foaf:depiction',
				   'gravatar_id': 'foaf:depiction',
				   'blog': 'foaf:homepage',
				   'html_url': 'foaf:homepage'}},
	    '@remove': ['type', 'id', 'url'],
	    '@context': {'foaf':'http://xmlns.com/foaf/0.1/',
			 'gh': 'http://socialrdf.org/github/',
			 'xsd': 'http://www.w3.org/2001/XMLSchema#',
			 'foaf:depiction': { '@type': '@id' },
			 'foaf:homepage': {'@type': '@id'},
			 'gh:created_at': {'@type': 'xsd:date'}
			}
	     }
    };

    var transformation = macro.buildTransformation(transformationSpecification);
    var jsonld = macro.applyTransformation(transformation, JSON.parse(JSON.stringify(optionalUser)));

    test.ok(jsonld['foaf:homepage'] === undefined);


    var foundException = false;
    try {
	macro.behaviour = "strict";
	jsonld = macro.applyTransformation(transformation, JSON.parse(JSON.stringify(optionalUser)));
    } catch (x) {
	foundException = true;
    }
    test.ok(foundException);
    macro.behaviour = "loose";
    test.done();
};

exports.transformation6 = function(test) {
    var transformationSpecification = {
	'$': { '@ns':{ 'ns:default': 'gh',
		       'ns:replace': {'login': 'foaf:a',
				      'email': 'foaf:a',
				      'name': 'foaf:a',
				      'avatar_url': 'foaf:a',
				      'gravatar_id': 'foaf:a',
				      'blog': 'foaf:a',
				      'html_url': 'foaf:a'}},
	       '@context': { 'gh': 'http://socialrdf.org/github/'},
	       '@type': {'f:defaultvalue': 'http://test.com/vocabulary/Thing'} }
    };

    var jsonld = macro.transform(transformationSpecification, JSON.parse(JSON.stringify(user)));

    test.ok(jsonld['foaf:a'].length === 7);
    test.done();
};

exports.transformation7 = function(test) {
    var transformationSpecification = {
	'$': { '@ns':{ 'ns:default': 'gh'},
	       '@context': { 'gh': 'http://socialrdf.org/github/'},
	       '@type': ["http://test.com/classes/A", "http://test.com/classes/B"] }
    };

    var jsonld = macro.transform(transformationSpecification, {'hello':'world'});

    rdfstore.create(function(_, store) {
	store.load('application/json', jsonld, function(err, loaded) {
	    store.execute("SELECT * { ?s a <http://test.com/classes/A> }", function(success, results) {
		test.ok(results.length === 1);
		store.execute("SELECT * { ?s a <http://test.com/classes/B> }", function(success, results) {
		    test.ok(results.length === 1);
		    test.done();
		});
	    });
	});
    });
};
