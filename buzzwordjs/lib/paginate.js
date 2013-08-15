var Mongo = require("./mongo")

exports.paginate = function(currentPage, numberOfPages, callback) {
    var page = parseInt(currentPage),
        range = numberOfPages,
        skip = page * range;

    if (page < 0) {
        page = 0;
    }

    Mongo.db.collection("entries", function(err, collection) {
        if (err !== null) {
            var now = Math.round(new Date().getTime() / 1000);
            collection.find({
                timestamp: { "$lt": now }, /* Support for forward publishing */
                hidden: { "$exists": true, "$in": [false, null] } /* Only include not hidden files */
            }).count(function(err, count) {
                var pages = Math.ceil(count / range),
                    html = [];

                html.push('<ul class="paginate">');

                if (page > 0) {
                    html.push("<li>");
                    html.push('<a href="/page/'+(page)+'" title="Previous page">');
                }
                else {
                    html.push("<li class='deactive'>");
                }

                html.push("Previous");

                if (page > 0) {
                    html.push('</a>');
                }
                html.push("</li>");

                for (var i = 0; i < pages; i++) {
                    var p = (i+1)
                    if (i === page) {
                        html.push('<li class="current-page">');
                    }
                    else {
                        html.push("<li>");
                    }
                    html.push('<a href="/page/'+p+'" title="Page '+p+'">');
                    html.push(p);
                    html.push("</a>");
                    html.push("</li>");
                }

                if (page >= pages-1) {
                    html.push("<li class='deactive'>");
                }
                else {
                    html.push("<li>");
                    html.push('<a href="/page/'+(page+2)+'" title="Next page">');
                }

                html.push("Next");

                if (page < pages-1) {
                    html.push('</a>');
                }
                html.push("</li>");

                html.push("</ul>");
                callback(html.join(""));
            });
        }
        else {
            callback("");
        }
    });
};