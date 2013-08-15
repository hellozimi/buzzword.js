/*
 * Mongo DB Connection
 */

var mongo = require("mongodb"),
    ObjectId = require("mongodb").ObjectId;

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;


exports.db = null;

exports.connect = function(connection, cb) {

    var server = null;
    server = new Server(connection.host, connection.options);
    
    var MongoClient = mongo.MongoClient;
    MongoClient.connect(connection.host, function(err, db) {
        exports.db = db;
        cb();
    });
};
