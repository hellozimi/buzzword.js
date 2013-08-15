var Mongo = require("./mongo"),
    marked = require("marked"),
    install = require("./install"),
    fs = require("fs"),
    ejs = require("ejs"),
    paginate = require("./paginate");

/* Binds buzzword to lib */
var _buzzword = null;
function bind(buzzword) {
    _buzzword = buzzword;
}
exports.bind = bind;

function root(request, response) {
    // Refesh
    install.refresh(request, response);

    // Load posts for page 0
    postsForPage(0, function(items) {
        renderItemsInTemplate(items, 0, null, null, request, response);
    });
}

exports.root = root;

function post(request, response) {

    install.refresh(request, response);
    var postSlug = request.params.post;

    Mongo.db.collection("entries", function(err, collection) {
        collection.findOne({ slug: postSlug }, function(err, item) {
            if (!item || item === null) {
                // Render 404
                next();
                return;
            }
            else {
                item.body = marked.parse(item.body);
                var comments = item.comments;
                HTMLPostContent(item, comments, true, function(content) {
                    var image = item.image;
                    response.render("views/template.html", {
                        content: content,
                        title: item.title,
                        image: image,
                        pagination: null
                    });
                    response.end();
                });
            }
        });
    });
}

exports.post = post;

function page(request, response, next) {
    function isInt(n) {
        return typeof n === 'number' && parseFloat(n) == parseInt(n, 10) && !isNaN(n);
    }

    var page = parseInt(request.params.page);

    if (!isInt(page) || isNaN(page)) {
        next();
        return;
    }
    install.refresh(request, response);
    page -= 1;
    postsForPage(page, function(items) {
        if ( items.length <= 0 || items === null ) {
            next();
            return;
        }
        renderItemsInTemplate(items, page, null, null, request, response);
    });
}

exports.page = page;

function postsForPage(page, callback) {
    if (page < 0) {
        page = 0;
    }
    var perPage = _buzzword.options.postsPerPage;

    if (page === -1) {
        perPage = 0;
        page = 20;
    }
    var now = Math.round(new Date().getTime() / 1000);
    Mongo.db.collection("entries", function(err, collection) {
        collection.find({
            timestamp: { "$lt": now }, /* Support for forward publishing */
            hidden: { "$exists": true, "$in": [false, null] } /* Only include not hidden files */
        }).sort({timestamp:-1}).skip(page*perPage).limit(perPage).toArray(function(err, items) {
            callback(items);
        });
    });
}

function renderItemsInTemplate(items, page, title, image, request, response) {

    function generate(items, i, contents, cb) {
        var post = items[i];
        if (typeof post !== 'object') {
            if (i > items.length) {
                cb(contents);
            }
            else {
                generate(items, i+1, contents, cb);
            }
            return;
        }
        post.body = marked.parse(post.body);
        var isSingle = items.length > 1;
        HTMLPostContent(post, false, false, function(content) {
            contents += content;
            if (i > items.length) {
                cb(contents);
            }
            else {
                generate(items, i+1, contents, cb);
            }
        });
    }

    generate(items, 0, "", function(contents) {
        paginate.paginate(page, _buzzword.options.postsPerPage, function(result) {
            response.render("views/template.html", {
                content: contents,
                title: title,
                image: image,
                pagination: result
            });
            response.end();
        });
    });
}

function HTMLPostContent(item, showComments, isSingle, cb) {
    fs.readFile(process.env.PWD + "/views/post.html", 'utf-8', function(err, res) {
        cb(ejs.render(res, { post: item, comments: showComments, isSingle: isSingle, pagination: null }));
    });
}