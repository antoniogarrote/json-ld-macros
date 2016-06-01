var macro = require('../src/macro').JSONLDMacro;
var rdfstore = require('rdfstore');

exports.serializationTest = function(test) {
    macro.clearAPIs();
    macro.registerAPI({
	"https://api.github.com/users/{username}":

	{'$': {'@ns': {'ns:default': 'gh'},
	       '@context': {'gh':'http://socialrdf.org/github/'},
	       '@type': 'http://socialrdf.org/github/User'},

         '$.test': {"@remove": ["a","b","c"]}
        },


	"https://api.github.com/users/{username}/commits/{sha1}":

	{'$': {'@ns': {'ns:default': 'gh'},
	       '@context': {'gh':'http://socialrdf.org/github/'},
	       '@type': 'http://socialrdf.org/github/Commit'}}
    });

    var result = macro.toJSONLD();
    macro.fromJSONLD(rdfstore, result, function(err, results){
        test.ok(results["https://api.github.com/users/{username}/commits/{sha1}"] != null);
	test.ok(results["https://api.github.com/users/{username}/commits/{sha1}"]["$"] != null);
	test.ok(results["https://api.github.com/users/{username}"] != null);
	test.ok(results["https://api.github.com/users/{username}"]["$"] != null);
	test.ok(results["https://api.github.com/users/{username}"]["$.test"] != null);
        test.done();
    });
};
