
var crypto = require("crypto");

Array.prototype.diff = function(a) {
    return this.filter(function(i) {return !(a.indexOf(i) > -1);});
};

function md5(str) {
    return crypto.createHash("md5").update(str).digest("hex");
}

exports.md5 = md5;

function slug(str) {
    return str
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
}

exports.slug = slug;

function merge(obj1, obj2) {
    var merged = {};
    for (var attr in obj1) { merged[attr] = obj1[attr]; }
    for (var attr in obj2) { merged[attr] = obj2[attr]; }
    return merged;
}

exports.merge = merge;
