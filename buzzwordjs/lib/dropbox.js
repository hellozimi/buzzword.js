
/*
 * Dropbox handler
 */
var dbox = require("dbox"),
    Mongo = require("./mongo");

var _buzzword = null,
    client = null;

var dropbox = {
    client: null,
    requestToken: function(request, response) {
        /***
         * Request access token - redirects user to dropbox.com
         */
        client.requesttoken(function(status, req_token) {
            response.writeHead(200, {
                "Set-Cookie": [
                    "oat="+req_token.oauth_token,
                    "oats="+req_token.oauth_token_secret
                ]
            });

            var hostname = request.headers.host; // hostname = 'localhost:8080'

            response.write("<script>window.location='https://www.dropbox.com/1/oauth/authorize" +
                "?oauth_token=" + req_token.oauth_token +
                "&oauth_callback=http://" + hostname + "/authorized" + "';</script>");
            response.end();
        });
    },
    handleAccessToken: function(request, response) {
        /***
         * Handle and store the access token
         */

        var req_token = {oauth_token : request.cookies.oat, oauth_token_secret : request.cookies.oats};
        client.accesstoken(req_token, function(status, access_token) {
            if (status == 401) {
                response.write("Sorry, Dropbox reported an error: " + JSON.stringify(access_token));
                response.end();
                return;
            }
            else {
                client_access_token = access_token;
                Mongo.db.collection("user", function(err, collection) {
                    var entry = {};
                    entry.uid = access_token.uid;
                    entry.oauth_token = access_token.oauth_token;
                    entry.oauth_token_secret = access_token.oauth_token_secret;
                    collection.update({"uid": access_token.uid}, {$set: entry}, {upsert:true}, function(err, item) {
                        response.writeHead(302, {
                            'Location': '/'
                        });
                        response.end();
                    });
                });
            }
        });
    },
    login: function(callback) {
        if (this.client !== null) {
            callback(true);
        }
        else {

            Mongo.db.collection("user", function(err, collection) {
                if (!err) {
                    collection.findOne({ }, function(err, item) {
                        
                        if (item === null) {
                            callback(false);
                            return;
                        }

                        var auth = {};
                        auth.uid = item.uid;
                        auth.oauth_token = item.oauth_token;
                        auth.oauth_token_secret = item.oauth_token_secret;

                        this.client = client.client(auth);

                        callback(true);
                    });
                }
                else {
                    callback(false);
                }
            });
        }
    },
    fetchEntries: function(request, response, callback) {
        this.login(function(success) {
            if (success) {
                this.client.metadata("/", function(status, reply) {
                    if (reply) {
                        callback(reply.contents);
                    }
                    else {
                        callback(null);
                    }
                });
            }
            else {
                callback(null);
            }
        });
    },
    get: function(path, callback) {
        this.login(function(success) {
            if (success) {
                this.client.get(path, callback);
            }
            else {
                callback(null);
            }
        });
    }
};
exports.dropbox = dropbox;

/* Binds buzzword to lib */
function bind(buzzword) {
    _buzzword = buzzword;

    client = dbox.app({ "app_key": _buzzword.options.dropbox.key,
                    "app_secret": _buzzword.options.dropbox.secret });
}
exports.bind = bind;