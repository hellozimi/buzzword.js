var express = require("express"),
    app = express(),
    buzzword = require("../buzzwordjs");

var mongouri = process.env.MONGOLAB_URI || "mongodb://localhost:27017/buzzwordjs";

app.configure(function() {
    app.use(express.logger());
    app.use(express.cookieParser());
    app.use(express.bodyParser());

    app.set('views', __dirname + '/');
    app.engine('html', require('ejs').renderFile);
    app.use(express.static(__dirname + '/public'));
});

buzzword.init(express, app, {
    dropbox: {
        key: "3r8s00h1oo0l413",
        secret: "6m3rip4izu8t7dp"
    },
    mongodbURI: mongouri
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Started listening on port "+ port);
});
