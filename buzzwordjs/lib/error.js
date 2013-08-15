
var fs = require("fs"),
    ejs = require("ejs");

function fourofour(request, response) {
    fs.readFile(process.env.PWD + "/views/404.html", 'utf-8', function(err, res) {
       var content = ejs.render(res, { })

        response.render("views/template.html", {
            content: content,
            title: "",
            image: null,
            pagination: null
        });
    });

}

exports.fourofour = fourofour;