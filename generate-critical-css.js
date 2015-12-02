const request = require('request');
const cheerio = require('cheerio');
const URL = require('url');
const async = require('async');
const mktemp = require('mktemp');
const fs = require('fs');
const critical = require('critical');
const del = require('del');

function extractCssUrls(html, protocol, callback) {
  var $ = cheerio.load(html);
  var cssUrls = $('link[rel=stylesheet]')
    .toArray()
    .map((linkTag) => sanitizeProtocol(protocol, linkTag.attribs.href));

  callback(null, cssUrls);
}


function sanitizeProtocol(expectedProtocol, url) {
  return url.replace(/((https?:)?\/\/)/, `${expectedProtocol}//`);
}

function getCssContent(html, protocol, callback) {
  extractCssUrls(html, protocol, function (err, cssUrls) {
    async.reduce(cssUrls, '', function (memo, cssUrl, callback) {
      request.get(cssUrl, function (error, response, body) {
        callback(null, memo + body);
      });

    }, function (err, result) {
      callback(null, result);
    });
  });
}


module.exports = {
  generateFromUrl: function (url, callback) {
    request.get(url, function (error, response, body) {
      var protocol = URL.parse(url).protocol;
      getCssContent(body, protocol, function (err, cssContent) {
        var cssFilePath = mktemp.createFileSync('tmp-XXXXX.css');
        fs.writeFileSync(cssFilePath, cssContent);

        critical.generate({
          base: '.',
          html: body,
          inline: false,
          css: cssFilePath,
          width: 1300,
          height: 900,
          minify: true,
        }, function (err, criticalCss) {
          del.sync('tmp-*');
          return callback(err, criticalCss);
        });
      });
    });
  }
}