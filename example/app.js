var express = require("express"),
    app = express(),
    buzzword = require("../buzzwordjs"), // Include buzzword
    routes = require("../buzzwordjs/lib/routes");

// Set up mongodb uri
var mongouri = process.env.MONGOLAB_URI || "mongodb://localhost:27017/buzzwordjs";

// App configuration
app.configure(function() {
    app.use(express.logger());
    app.use(express.cookieParser());
    app.use(express.bodyParser());

    app.set('views', __dirname + '/');
    app.engine('html', require('ejs').renderFile);
    app.use(express.static(__dirname + '/public'));
});

// initalize buzzword with options
buzzword.init(express, app, {
    dropbox: {
        key: "3r8s00h1oo0l413",
        secret: "6m3rip4izu8t7dp"
    },
    mongodbURI: mongouri
});

// Redirect /blog/feed to /feed
routes.addRoute(buzzword, "/blog/feed", function(request, response) {
    response.writeHead(302, {
        'Location': '/feed'
    });
    response.end();
});

// starts the server
var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Started listening on port "+ port);
});
