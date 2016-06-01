var macro = require('../src/macro').JSONLDMacro;
var rdfstore = require('rdfstore');

exports.urlExpDef = function(test) {
    var path = macro.parseUrlPath("https://api.github.com/users/{username}");

    test.ok(path.test("https://api.github.com/users/1"));
    test.ok(path.test("https://api.github.com/us/ers/1") === false);
    test.ok(path.test("https://api.github.com/us#ers/1") === false);
    test.ok(path.test("https://api.github.com/users/1/other") === false);

    path = macro.parseUrlPath("https://api.github.com/users/{username}/other/{contact}#me");

    test.ok(path.test("https://api.github.com/users/octocat/other/thing#me"));
    test.ok(path.test("https://api.github.com/users/octocat/and/other/thing#me") === false);

    test.done();
};

exports.defineAPI = function(test) {
    macro.clearAPIs();
    macro.registerAPI({
	"https://api.github.com/users/{username}":

	{'$': {'@ns': {'ns:default': 'gh'},
	       '@context': {'gh':'http://socialrdf.org/github/'},
	       '@type': 'http://socialrdf.org/github/User'}},


	"https://api.github.com/users/{username}/commits/{sha1}":

	{'$': {'@ns': {'ns:default': 'gh'},
	       '@context': {'gh':'http://socialrdf.org/github/'},
	       '@type': 'http://socialrdf.org/github/Commit'}}
    });
    var res1 = macro.resolve('https://api.github.com/users/1?this=will&be=ignored', {'name': 'octocat'});
    var res2 = macro.resolve('https://api.github.com/users/1/commits/234a232bc2', {'name': 'test commit'});
    rdfstore.create(function(err, store) {
	store.load('application/json', res1, function(err, loaded) {
	    store.load('application/json', res2, function(err, loaded) {
		store.execute("select * { ?s a ?o }", function(success, result){
		    test.ok(result.length === 2);
		    var types = [];
		    for(var i=0; i<result.length; i++) {
			types.push(result[i].o.value);
		    }

		    types.sort();
		    test.ok(types[0] === 'http://socialrdf.org/github/Commit');
		    test.ok(types[1] === 'http://socialrdf.org/github/User');
		    test.done();
		});
	    });
	});
    });

};


exports.defineAPI2 = function(test) {
    macro.clearAPIs();
    macro.registerAPI({
	"https://api.github.com/users/{username}\\n\
         https://api.github.com/users/{username}/friends/{contact}":

	{'$': {'@ns': {'ns:default': 'gh'},
	       '@context': {'gh':'http://socialrdf.org/github/'},
	       '@type': 'http://socialrdf.org/github/User'}}
    });

    var res1 = macro.resolve('https://api.github.com/users/1', {'name': 'octocat'});
    var res2 = macro.resolve('https://api.github.com/users/1/friends/343', {'name': 'test commit'});
    var res3 = macro.resolve('https://api.github.com/users/1/commits/234a232bc2', {'name': 'test commit'});


    test.ok(res1 != null);
    test.ok(res2 != null);
    test.ok(res3 == null);

    test.done();
};

exports.defineAPI3 = function(test) {
    macro.clearAPIs();
    macro.registerAPI({
	'@declare':
        {
	    'test': 'http://socialrdf.org/functions/',
	    'test:f': 'function(argument, input, obj){ return "the "+argument+" "+input }'
	},

	"https://api.github.com/users/{username}\\n\
         https://api.github.com/users/{username}/friends/{contact}":
	{
	 '$': {'@ns': {'ns:default': 'gh'},
	       '@context': {'gh':'http://socialrdf.org/github/'},
	       '@type': 'http://socialrdf.org/github/User',
	       '@transform': {
		   'name': [{'f:valueof':'name'},
			    { 'test:f': 'user name:'}]
	       }}
	}
    });

    var res1 = macro.resolve('https://api.github.com/users/1', {'name': 'octocat'});


    test.ok(res1 != null);
    test.ok(res1['gh:name'] === 'the user name: octocat');

    test.done();
};


exports.defineAPI4 = function(test) {
    macro.clearAPIs();
    macro.registerAPI({

	"https://api.github.com/users/{username}":
	{
	    '$': {'@ns': {'ns:default': 'gh'},
	          '@context': {'gh':'http://socialrdf.org/github/'},
	          '@type': 'http://socialrdf.org/github/User'},
            "$.starred_url": {
                '@explode': "@id",
                "@transform": {
                    "@id": [ {'f:valueof':'@id'},
                             {'f:basetemplateurl': true} ]
                }
            }
	}
    });

    var res1 = macro.resolve('https://api.github.com/users/1', {'starred_url': 'https://api.github.com/users/octocat/starred{/owner}{/repo}'});

    test.ok(res1 != null);
    test.ok(res1['gh:starred_url']["@id"] === 'https://api.github.com/users/octocat/starred');

    test.done();
};

exports.defineAPI5 = function(test) {
    macro.clearAPIs();
    macro.registerAPI({

	"https://api.github.com/users/{username}":
	{
	    '$': {'@ns': {'ns:default': 'gh'},
	          '@context': {'gh':'http://socialrdf.org/github/'},
	          '@type': 'http://socialrdf.org/github/User'},
            '$.starred_url': {
                '@compact': "$ref",
                "@remove": "rel",
                "@transform": {
                    '$ref': [{'f:valueof':'$ref'},
                             {'f:basetemplateurl': true}]
                }
            }
	}
    });

    var res1 = macro.resolve('https://api.github.com/users/1',
                             {
                                 'starred_url': {
                                     '$ref': 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
                                     'rel': "a relationship"
                                 }
                             });

    test.ok(res1 != null);
    test.ok(res1['gh:starred_url'] === 'https://api.github.com/users/octocat/starred');

    test.done();
};

exports.defineAPI6 = function(test) {
    macro.clearAPIs();
    macro.registerAPI({

	"https://api.github.com/users/{username}":
	{
	    '$': {'@ns': {'ns:default': 'gh'},
	          '@context': {'gh':'http://socialrdf.org/github/'},
	          '@type': 'http://socialrdf.org/github/User'},

            "$.starred_url.$ref": {
                '@explode': "@id",
                "@transform": {
                    "@id": [ {'f:valueof':'@id'},
                             {'f:basetemplateurl': true} ]
                },
                "@add": {
                    "http://test.com/prop1": "prop 1"
                }
            },
            '$.starred_url': {
                '@compact': "$ref"
            }
	}
    });

    var res1 = macro.resolve('https://api.github.com/users/1',
                             {
                                 'starred_url': {
                                     '$ref': 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
                                     'rel': "a relationship"
                                 }
                             });

    test.ok(res1 != null);
    test.ok(res1['gh:starred_url']['@id'] === 'https://api.github.com/users/octocat/starred');
    test.ok(res1['gh:starred_url']['http://test.com/prop1'] === 'prop 1');

    test.done();
}
