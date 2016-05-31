var macro = require('../src/macro').JSONLDMacro;

// Github V3 API examples

var commit = {
  "sha": "7638417db6d59f3c431d3e1f261cc637155684cd",
  "url": "https://api.github.com/repos/octocat/Hello-World/git/commits/7638417db6d59f3c431d3e1f261cc637155684cd",
  "author": {
    "date": "2010-04-10T14:10:01-07:00",
    "name": "Scott Chacon",
    "email": "schacon@gmail.com"
  },
  "committer": {
    "date": "2010-04-10T14:10:01-07:00",
    "name": "Scott Chacon",
    "email": "schacon@gmail.com"
  },
  "message": "added readme, because im a good github citizen\n",
  "tree": {
    "url": "https://api.github.com/repos/octocat/Hello-World/git/trees/691272480426f78a0138979dd3ce63b77f706feb",
    "sha": "691272480426f78a0138979dd3ce63b77f706feb"
  },
  "parents": [
    {
      "url": "https://api.github.com/repos/octocat/Hello-World/git/commits/1acc419d4d6a9ce985db7be48c6349a0475975b5",
      "sha": "1acc419d4d6a9ce985db7be48c6349a0475975b5"
    }
  ]
};

var references = [
  {
    "ref": "refs/heads/master",
    "url": "https://api.github.com/repos/octocat/Hello-World/git/refs/heads/master",
    "object": {
      "type": "commit",
      "sha": "aa218f56b14c9653891f9e74264a383fa43fefbd",
      "url": "https://api.github.com/repos/octocat/Hello-World/git/commits/aa218f56b14c9653891f9e74264a383fa43fefbd"
    }
  },
  {
    "ref": "refs/heads/gh-pages",
    "url": "https://api.github.com/repos/octocat/Hello-World/git/refs/heads/gh-pages",
    "object": {
      "type": "commit",
      "sha": "612077ae6dffb4d2fbd8ce0cccaa58893b07b5ac",
      "url": "https://api.github.com/repos/octocat/Hello-World/git/commits/612077ae6dffb4d2fbd8ce0cccaa58893b07b5ac"
    }
  },
  {
    "ref": "refs/tags/v0.0.1",
    "url": "https://api.github.com/repos/octocat/Hello-World/git/refs/tags/v0.0.1",
    "object": {
      "type": "tag",
      "sha": "940bd336248efae0f9ee5bc7b2d5c985887b16ac",
      "url": "https://api.github.com/repos/octocat/Hello-World/git/tags/940bd336248efae0f9ee5bc7b2d5c985887b16ac"
    }
  }
];

exports.testPath1 = function(test) {
    var parse = macro.pathParser("$.sha");
    var parsed = parse(commit);

    test.ok(parsed.length == 1);
    test.ok(parsed[0].node === "7638417db6d59f3c431d3e1f261cc637155684cd");
    test.ok(parsed[0].parent["sha"] === "7638417db6d59f3c431d3e1f261cc637155684cd");

    parse(commit, function(val, obj) {
	test.ok(val === obj['sha']);
	test.done();
    });
};

exports.testPath2 = function(test) {
    var parse = macro.pathParser("$.committer");
    var parsed = parse(commit);
    test.ok(parsed.length == 1);
    test.ok(parsed[0].node['name'] === "Scott Chacon");
    test.ok(parsed[0].parent["committer"]['name'] === "Scott Chacon");

    parse(commit, function(val, obj) {
	test.ok(val['name'] === obj['committer']['name']);
	test.done();
    });
};

exports.testPathLength2 = function(test) {
    var parse = macro.pathParser("$.author.email");

    var result = parse(commit);
    test.ok(result.length == 1);
    test.ok(result[0].node == "schacon@gmail.com");

    parse(commit, function(val, obj) {
	test.ok(val, obj['email']);
	test.done();
    });
};

exports.testPath3 = function(test) {
    var parse = macro.pathParser("$.object.url");

    var result = parse(references);
    test.ok(result.length === 3);
    for(var i=0; i<result.length; i++) {
	test.ok(result[i].node.indexOf("https://")===0);
    }
    test.done();
}

exports.testComplexPath1 = function(test) {
    var parse = macro.pathParser("$..url");
    var result = parse(commit);

    test.ok(result.length === 3);

    var counter = 0;
    parse(commit, function(val, obj) {
	test.ok(val === obj['url']);
	if(counter<2) {
	    counter++;
	} else {
	    test.done();
	}
    });
};

exports.testComplexPath2 = function(test) {
    var parse = macro.pathParser("$..");
    var result = parse(commit);

    test.ok(result.length === 5);
    test.done();
};

exports.testCollectObjects = function(test) {
    var parse = macro.pathParser("$.object");

    var result = parse(references);

    test.ok(result.length === 3);
    test.done();
}
