
var routes = require("./routes"),
    util = require("./util"),
    Mongo = require("./mongo"),
    posts = require("./posts"),
    dropbox = require("./dropbox"),
    install = require("./install");

var Buzzword = function(){}

Buzzword.prototype.init = function(express, app, options) {
    this.express = express;
    this.app = app;

    var defaults = {
        dropbox: {
            key: null,
            secret: null
        },
        password: "admin", // Admin password – change this
        postsPerPage: 5,
        allowedExtentions: ["md"],
        mongodbURI: "mongodb://localhost:27017/blog"
    }

    // Override default options
    this.options = util.merge(defaults, options);

    var that = this;
    Mongo.connect({
        host: that.options.mongodbURI,
        options: { safe: false }
    }, function(err) {
        if (err) {
            console.log("----------");
            console.log("Mongodb ERROR:");
            console.log(err);
            console.log("----------");
        }
        else {
            posts.bind(that);
            routes.bind(that);
            install.bind(that);
            dropbox.bind(that);
        }
    });
};

module.exports = new Buzzword();