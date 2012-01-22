var macro = require('../../src/macro');
var rdfstore = require('../src/rdfstore');
var github = require('../src/github');
var googleplus = require('../src/googleplus');
//var fbgraph = require('../src/facebookgraph');

//var ACCESS_TOKEN = "AAACEdEose0cBANAPzw0JAfdB3sm48kV288QXQHBJtXPTiHDPIvIPLKq5lIZAUwznli59edlkroCukpcHhZBmsnyznDuoTfA3VjFju5ssp8EFNuHyAg";
//var URI = "https://graph.facebook.com/search?q=coffee&type=place&center=37.76,-122.427&distance=1000&access_token="+ACCESS_TOKEN;

var PROJECT_URI = "https://api.github.com/repos/rails/rails";
var GOOGLE_PEOPLE_SEARCH = "https://www.googleapis.com/plus/v1/people?query=antoniogarrote&key=AIzaSyCY2KsCFd5u1m5PJbv3K9SijjEgTbANvTY";
var GOOGLE_PERSON = "https://www.googleapis.com/plus/v1/people/102497386507936526460?key=AIzaSyCY2KsCFd5u1m5PJbv3K9SijjEgTbANvTY";

/*
exports.urlExpDef = function(test) {
    
    console.log("REGISTERING");
    console.log(github);
    macro.registerAPI(github);

    rdfstore.create(function(store) {
	nt = store.getNetworkTransport();
	var macroNetworkTransport = {
	    load: function(uri,graph, callback) {
		nt.load(uri, graph, function(success, results){
		    console.log("=== NT LOAD");
		    if(success) {
			var mime = results["headers"]["Content-Type"] || results["headers"]["content-type"];
			var data = results['data'];

			if(mime.indexOf('application/json') != -1) {
			    console.log("TRANSFORMING");
			    console.log(uri);
			    var transformed = macro.resolve(uri, JSON.parse(data));
			    console.log(transformed);
			    if(transformed != null) {
				results['data'] = JSON.stringify(transformed);
				callback(success, results);
			    } else {
				callback(success, results)
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

	store.load('remote', PROJECT_URI, function(success, results) {
	    console.log("LOADED:");
	    console.log(success);
	    console.log(results);
	    store.execute("SELECT * { ?s ?p ?o }", function(success, results) {
		console.log(results);
	    });
	    test.done();
	});
    });

};

exports.googlePlus = function(test) {
    
    console.log("REGISTERING");
    console.log(googleplus);
    macro.registerAPI(googleplus);

    rdfstore.create(function(store) {
	nt = store.getNetworkTransport();
	var macroNetworkTransport = {
	    load: function(uri,graph, callback) {
		nt.load(uri, graph, function(success, results){
		    console.log("=== NT LOAD");
		    if(success) {
			var mime = results["headers"]["Content-Type"] || results["headers"]["content-type"];
			var data = results['data'];

			if(mime.indexOf('application/json') != -1) {
			    console.log("TRANSFORMING");
			    console.log(uri);
			    var transformed = macro.resolve(uri, JSON.parse(data));
			    console.log("\n\n\nTRANSFORMED:\n\n\n");
			    console.log(transformed);
			    if(transformed != null) {
				results['data'] = JSON.stringify(transformed);
				callback(success, results);
			    } else {
				callback(success, results)
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

	store.load('remote', GOOGLE_PEOPLE_SEARCH, function(success, results) {
	    store.execute("SELECT * { ?s ?p ?o }", function(success, results) {
		for(var i=0; i<results.length; i++) {
		    var comps = ['s','p','o'];
		    for(var j=0; j<comps.length; j++) {
			if(results[i][comps[j]].token === 'uri') {

			    test.ok(results[i][comps[j]].value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' ||
				    results[i][comps[j]].value.indexOf("https://") === 0)
			}
		    }
		}
	    });
	    test.done();
	});
    });

};
*/

exports.googlePlus = function(test) {
    
    console.log("REGISTERING");
    console.log(googleplus);
    macro.registerAPI(googleplus);

    rdfstore.create(function(store) {
	nt = store.getNetworkTransport();
	var macroNetworkTransport = {
	    load: function(uri,graph, callback) {
		nt.load(uri, graph, function(success, results){
		    console.log("=== NT LOAD");
		    if(success) {
			var mime = results["headers"]["Content-Type"] || results["headers"]["content-type"];
			var data = results['data'];

			if(mime.indexOf('application/json') != -1) {
			    console.log("TRANSFORMING");
			    console.log(uri);
			    var transformed = macro.resolve(uri, JSON.parse(data));
			    console.log("\n\n\nTRANSFORMED:\n\n\n");
			    console.log(transformed);
			    if(transformed != null) {
				results['data'] = JSON.stringify(transformed);
				callback(success, results);
			    } else {
				callback(success, results)
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

	store.load('remote', GOOGLE_PERSON, function(success, results) {
	    store.execute("SELECT * { ?s ?p ?o }", function(success, results) {
		console.log(results);
	    });
	    test.done();
	});
    });

};