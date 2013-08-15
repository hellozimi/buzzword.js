var dropbox = require("./dropbox").dropbox,
    util = require("./util"),
    fm = require("json-front-matter"),
    Mongo = require("./mongo"),
    moment = require("moment");

/* Binds buzzword to lib */
var _buzzword = null;
function bind(buzzword) {
    _buzzword = buzzword;
}
exports.bind = bind;

function root(request, response) {

    var error = undefined;
    if (request.query["e"] !== undefined) {
        error = "Invalid password";
    }

    response.render("views/install.html", {error: error});
}
exports.root = root;

function login(request, response) {
    var password = request.body.password;
    if (password !== _buzzword.options.password) {
        response.writeHead(302, {
            "Location": "/install?e"
        })
        response.end();
    }
    else {
        dropbox.requestToken(request, response);
    }
}
exports.login = login;

function authorized(request, response) {
    dropbox.handleAccessToken(request, response);
}
exports.authorized = authorized;

var running = false;
function refresh(request, response) {
    
    if (running) {
        return;
    }

    running = true;

    var hashes = [];
    dropbox.fetchEntries(request, response, function(items) {
        if (items !== null) {
            for (var i in items) {
                item = items[i];

                if (typeof item !== "object") {
                    continue;
                }

                var path = item.path;
                var revision = item.revision;
                var hash = util.md5(path+""+revision);
                hashes.push(hash);
            }
            
            var storedHashes = [];

            Mongo.db.collection("entries", function(err, collection) {
                collection.find({}, {"hash" : 1}).toArray(function(err, storedItems) {
                    for (var i in storedItems) {
                        var item = storedItems[i];
                        if (typeof item !== "object") {
                            continue;
                        }

                        storedHashes[i] = item.hash;
                    }

                    var newHashes = hashes.diff(storedHashes);
                    var hashesToRemove = storedHashes.diff(hashes);

                    Mongo.db.collection("entries", function(err, collection) {
                        if (hashesToRemove.length > 0) {

                            collection.remove({ "hash" : { "$in": hashesToRemove} }, function(err) {
                                if (newHashes.length > 0) {
                                    handleHashes(items, hashes, newHashes);
                                }
                            });
                            
                        }
                        else if (newHashes.length > 0) {
                            handleHashes(items, hashes, newHashes);
                        }
                        else {
                            running = false;
                        }
                    });
                });
            });
        }
        else {
            running = false;
            console.log("Couldn't find any user");
        }
    });
};
exports.refresh = refresh;

function handleHashes(items, hashes, newHashes) {
    var p = require("path");

    var itemsCompleted = 0;
    var itemsToComplete = newHashes.length;
    for (var i = 0; i < newHashes.length; i++) {
        var hash = newHashes[i];
        var index = hashes.indexOf(hash);
        if (index < 0) {
            itemsToComplete--;
            continue;
        }

        var item = items[index];

        var path = item.path;
        var revision = item.revision;
        var hash = util.md5(path+""+revision);

        dropbox.get(path, function(status, reply, metadata) {
            var file =  null;
            try {
                file = reply.toString();
            }
            catch(err) {
                console.log("error parsing: " + err);
                itemsToComplete--;
                return;
            }

            var contents = null;
            try {
                contents = fm.parse(file);
            }
            catch(err) {
                itemsToComplete--;
                return;
            }

            if (contents.attributes.title === null || contents.attributes.title.length === 0 ||
                contents.attributes.date === null || contents.attributes.date.length === 0) {
                itemsToComplete--;
                return;
            }

            var path = metadata.path;
            var ext = p.extname(path).substr(1);
            if (_buzzword.options.allowedExtentions.indexOf(ext) < 0) {
                itemsToComplete--;
                return;
            }

            var m = moment(contents.attributes.date + " +0200", "YYYY-MM-DD HH:mm ZZ");

            var entry = {};
            entry.title = contents.attributes.title;
            entry.body = contents.body;
            entry.date = m.format("MMM Do YYYY, HH:mm");
            entry.filename = metadata.path;
            entry.revision = metadata.revision;
            entry.slug = util.slug(entry.title);
            entry.hash = util.md5(entry.filename +""+entry.revision);
            entry.template = contents.attributes.template;
            entry.timestamp = m.unix();
            entry.image = contents.attributes.image;
            entry.hidden = !!contents.attributes.hidden;
            entry.comments = contents.attributes.comments;

            Mongo.db.collection("entries", function(err, collection) {
                collection.save(entry, function(err, item) {
                    itemsCompleted++;

                    if (itemsCompleted == itemsToComplete) {
                        running = false;
                    }
                });
            });
        });
    }
}