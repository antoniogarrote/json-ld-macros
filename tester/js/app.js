(function(){

    var usersJson = '{\n\
 "login": "octocat",\n\
 "id": 1,\n\
 "avatar_url": "https://github.com/images/error/octocat_happy.gif",\n\
 "gravatar_id": "",\n\
 "url": "https://api.github.com/users/octocat",\n\
 "html_url": "https://github.com/octocat",\n\
 "followers_url": "https://api.github.com/users/octocat/followers",\n\
 "following_url": "https://api.github.com/users/octocat/following{/other_user}",\n\
 "gists_url": "https://api.github.com/users/octocat/gists{/gist_id}",\n\
 "starred_url": "https://api.github.com/users/octocat/starred{/owner}{/repo}",\n\
 "subscriptions_url": "https://api.github.com/users/octocat/subscriptions",\n\
 "organizations_url": "https://api.github.com/users/octocat/orgs",\n\
 "repos_url": "https://api.github.com/users/octocat/repos",\n\
 "events_url": "https://api.github.com/users/octocat/events{/privacy}",\n\
 "received_events_url": "https://api.github.com/users/octocat/received_events",\n\
 "type": "User",\n\
 "site_admin": false,\n\
 "name": "monalisa octocat",\n\
 "company": "GitHub",\n\
 "blog": "https://github.com/blog",\n\
 "location": "San Francisco",\n\
 "email": "octocat@github.com",\n\
 "hireable": false,\n\
 "bio": "There once was...",\n\
 "public_repos": 2,\n\
 "public_gists": 1,\n\
 "followers": 20,\n\
 "following": 0,\n\
 "created_at": "2008-01-14T04:33:35Z",\n\
 "updated_at": "2008-01-14T04:33:35Z"\n\
}';

    var defaultMacro = '{\n "@context": {\n    "@vocab": "http://json-ld-macros.org/examples/gh"\n  },\n "@id": [{"f:valueof":"url"}]\n}';

    var model = function() {
        var that = this;
        this.json = ko.observable(usersJson);
        this.jsonld = ko.observable("");
        this.currentSelector = ko.observable("$");
        this.currentMacro = ko.observable(defaultMacro);
        this.selectors = ko.observableArray([]);
        this.triples = ko.observable("");
        this.mode = ko.observable("edit");

        this.selectMode = function(_,event) {
            var selected = event.target.id.split("select-")[1];
            if(selected == "json") {
                setTimeout(function(){
                    $("#json-input")[0].editor.refresh();
                },100);
            }
            if(selected == "jsonld") {
                that.generateJSONLD();
                setTimeout(function(){
                  $("#jsonld-output")[0].editor.refresh();
                },100);
            }

            if(selected == "triples") {
                that.generateTriples();
                setTimeout(function(){
                  $("#n3-output")[0].editor.refresh();
                }, 100);
            }
            that.mode(selected);
        };

        this.generateJSONLD = function() {
            var rules = {};
            for(var i=0; i<that.selectors().length; i++) {
                var selector = that.selectors()[i];
                rules[selector.selector] = JSON.parse(selector.macro);
            }
            that.jsonld(JSON.stringify(rules));
            JSONLDMacro.clearAPIs();
            JSONLDMacro.registerAPI({
                "/test": rules
            });
            var res = JSONLDMacro.resolve("/test", JSON.parse(that.json()));
            that.jsonld(JSON.stringify(res, null, 2));
        };

        var rdfText = function(node) {
            if(node.token == "uri") {
                return "<"+node.value+">";
            } else if(node.token == "blank") {
                return node.value;
            } else {
                if(node.token.lang) {
                    return "\""+node.value+"\"@"+node.lang;
                } else if(node.token.type) {
                    return "\""+node.value+"\"^^<"+node.type+">";
                } else {
                    return "\""+node.value+"\"";
                }
            }
        };

        this.generateTriples = function() {
            generateJSONLD();
            rdfstore.create(function(err, store) {
                store.load("application/ld+json", JSON.parse(that.jsonld()), function(err, loaded){
                    if(err != null) {
                        that.triples("// Invalid JSON-LD: "+err.toString());
                    } else {
                        store.execute("SELECT * { ?s ?p ?o }", function(err, results){
                            if(err != null) {
                                that.triples("// Error generating triples: "+err.toString());
                            } else {
                                var acc = "";
                                for(var i=0; i<results.length; i++) {
                                    acc = acc + rdfText(results[i]["s"]) + "  ";
                                    acc = acc + rdfText(results[i]["p"]) + "  ";
                                    acc = acc + rdfText(results[i]["o"]) + ".\n";
                                }

                                that.triples(acc);
                            }
                        });
                    }
                });
            });
        };

        this.addSelector = function() {
            if(that.currentSelector() == "") {
                return;
            }
            var data = {selector: that.currentSelector(), macro: that.currentMacro()};
            var found = null;
            for(var i=0; i<that.selectors().length; i++) {
                if(that.selectors()[i].selector == data.selector)
                    found = that.selectors()[i];
            }
            if(found == null) {
                that.selectors.push(data);
            } else {
                found.selector = data.selector;
                found.macro = data.macro;
            }

            currentMacro("");
            currentSelector("");
        };

        this.displaySelector = function(selector) {
            that.currentSelector(selector.selector);
            that.currentMacro(selector.macro);
        };
    };

    window.app = function() {


        // Knockout codemirror binding handler
        ko.bindingHandlers.codemirror = {
            init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                var mode = "application/json";
                if(element.id == "jsonld-input") {
                    mode = "application/ld+json";
                }
                if(element.id == "n3-output") {
                    mode = "text/turtle";
                }
                var options = {mode: mode,
                               matchBrackets:true,
                               autoCloseBrackets:true,
                               lineNumbers: true,
                               smartIndent: true,
                               electricChars: true,
                               lineWrapping:true};
                options.value = ko.unwrap(valueAccessor());
                var editor = CodeMirror(element, options);
                editor.on('change', function(cm) {
                    var value = valueAccessor();
                    value(cm.getValue());
                });

                element.editor = editor;
            },
            update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                var observedValue = ko.unwrap(valueAccessor());
                if (element.editor) {
                    var before = element.editor.getCursor();
                    element.editor.setValue(observedValue);
                    element.editor.refresh();
                    element.editor.setCursor(before);
                }
            }
        };

        ko.applyBindings(model());
    };

})();
