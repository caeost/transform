var cheerio = require("cheerio"),
    fs = require("fs"),
    _ = require("/usr/local/lib/node_modules/underscore");

//from http://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search
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

var process = function(list, func, stringFunc, next) {
  var done = _.after(list.length, next);
  _.each(list, function(fileName) {
    fs.readFile(fileName, "utf8", function(err, data) {
      if(err) throw err;
      if(stringFunc) data = stringFunc(data);
      var $ = cheerio.load(data, {recognizeSelfClosing: true});
      var write = _.partial(writePath, fileName);
      func.call(cheerio, $, write, fileName);
      done();
    });
  });
};

module.exports = function(dir, func, stringFunc) {
  walk(dir, function(err, list) {
    if(err) throw err;
    list = _.filter(list, function(name) {
      return /\.html$/.test(name);
    });
    var fileProcess = _.partial(process, _, func, stringFunc)

    var processList = _.first(list, 250);
    var remaining = _.rest(list, 250);

    var loop = function() {
      processList = _.first(remaining, 250);
      remaining = _.rest(remaining, 250);
      if(processList.length) {
        fileProcess(processList, loop);
      }
    };
    fileProcess(processList, loop);
  });
};
