var Mongo = require("./mongo"),
    marked = require("marked"),
    install = require("./install"),
    fs = require("fs"),
    ejs = require("ejs"),
    RSS = require('rss'),
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

function feed(request, response) {
    var feed = new RSS({
        title: 'Hiddencode',
        description: '',
        feed_url: 'http://www.hiddencode.me/feed',
        site_url: 'http://hiddencode.me/',
        image_url: 'http://hiddencode.me/icon.png',
        author: 'Simon Andersson',
        managingEditor: 'Simon Andersson',
        webMaster: 'Simon Andersson',
        copyright: '2013 Simon Andersson',
        language: 'en',
        pubDate: 'May 20, 2012 04:00:00 GMT',
        ttl: '1'
    });

    postsForPage(-1, function(items) {
        for (var i = 0, len = items.length; i < len; i++) {
            var item = items[i];
            feed.item({
                title:  item.title,
                description: marked.parse(item.body.substr(0, 255)+"..."),
                url: 'http://hiddencode.me/post/'+item.slug, // link to the item
                author: 'Simon Andersson', // optional - defaults to feed author property
                date: (item.timestamp*1000) // any format that js Date can parse.
            });
        }

        response.end(feed.xml());
    });
}

exports.feed = feed;

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
    Mongo.db.collection("entries", function(err, collection) {
        if (!err) {
            var now = Math.round(new Date().getTime() / 1000);
            collection.find({
                timestamp: { "$lt": now }, /* Support for forward publishing */
                hidden: { "$exists": true, "$in": [false, null] } /* Only include not hidden files */
            }).sort({timestamp:-1}).skip(page*perPage).limit(perPage).toArray(function(err, items) {
                callback(items);
            });

        }
        else {
            callback(null);
        }
    });
}

function renderItemsInTemplate(items, page, title, image, request, response) {

    function generate(items, i, contents, cb) {
        if (items === null || items.length === 0) {
            cb('<div class="post post-regular"><div class="post-content"><center><h1>Sorry</h1><p>No content!</p></center></div></div>');
            return;
        }
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