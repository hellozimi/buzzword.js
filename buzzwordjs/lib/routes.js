
var posts = require("./posts.js"),
    install = require("./install");

function bind(buzzword) {
    var app = buzzword.app;
    
    // Root
    app.get("/", posts.root);

    // Login & setup
    app.get("/install", install.root);
    app.post("/login", install.login);
    app.get("/authorized", install.authorized);

    // Posts
    app.get("/page/:page", posts.page);
    app.get("/post/:post", posts.post);

    // Feed
    app.get("/feed", posts.feed);
    return;
    // Error
    app.get("*", error.fourofour);
}

exports.bind = bind;

function addRoute(buzzword, route, handler) {
    buzzword.app.get(route, handler);
}

exports.addRoute = addRoute;