const request = require('request');
const cheerio = require('cheerio');
const URL = require('url');
const async = require('async');
const mktemp = require('mktemp');
const fs = require('fs');
const critical = require('critical');

function extractCssUrls(html, protocol, callback) {
  var $ = cheerio.load(html);
  var cssUrls = $('link[rel=stylesheet]')
  .toArray()
  .map((linkTag) => sanitizeProtocol(protocol, linkTag.attribs.href) );

  callback(null, cssUrls);
}


function sanitizeProtocol(expectedProtocol, url) {
  return url.replace(/((https?:)?\/\/)/, `${expectedProtocol}//`);
}

function getCssContent(html, protocol, callback) {
  extractCssUrls(html, protocol, function(err, cssUrls) {
    async.reduce(cssUrls, '', function(memo, cssUrl, callback){
      request(cssUrl, function (error, response, body) {
          callback(null, memo + body);
      });

    }, function(err, result){
        callback(null, result);
    });
  });
}


var url = process.argv[2];

request(url, function (error, response, body) {
  var protocol = URL.parse(url).protocol
  getCssContent(body, protocol, function(err, cssContent) {
    var cssFilePath = mktemp.createFileSync('XXXXX.css');
    fs.writeFileSync(cssFilePath, cssContent);

    critical.generate({
      base: '.',
      html: body,
      // Inline the generated critical-path CSS
      // - true generates HTML
      // - false generates CSS
      inline: false,
      css: cssFilePath,

      // Your CSS Files (optional)
      //css: ['dist/styles/main.css'],

      // Viewport width
      width: 1300,

      // Viewport height
      height: 900,

      // Minify critical-path CSS when inlining
      minify: true,
    }, function(err, criticalCss) {
      console.log(err, criticalCss);
      fs.unlinkSync(cssFilePath);
    });
  });
});
