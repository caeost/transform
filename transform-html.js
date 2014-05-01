var cheerio = require("cheerio"),
    fs = require("fs"),
    _ = require("/usr/local/lib/node_modules/underscore");

var walk = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

var writePath = function(path, contents) {
  fs.writeFile(path, contents, function(err) {
    if(err) throw err;
  });
};

module.exports = function(dir, func) {
  walk(dir, function(err, list) {
    if(err) throw err;
    list = _.filter(list, function(name) {
      return /\.html$/.test(name);
    });
    _.each(list, function(fileName) {
      fs.readFile(fileName, "utf8", function(err, data) {
        if(err) throw err;
        var $ = cheerio.load(data, {recognizeSelfClosing: true});
        var write = _.partial(writePath, fileName);
        func.call(cheerio, $, write);
      });
    });
  });
 };
