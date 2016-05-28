const mktemp = require('mktemp');
const fs = require('fs');
const critical = require('critical');
const del = require('del');
const phantom = require('phantom');
var pageInstance;
var phantomInstance;
var css;

function getPageAndCssContent(url, callback) {


  phantom.create()
    .then(function(ph) {
      phantomInstance = ph;
      return ph.createPage();
    })
    .then(function(page) {
      pageInstance = page;
      return page.setting('webSecurityEnabled', false);
    })
    .then(function() {
      return pageInstance.open(url);
    })
    .then(function(status) {
      return pageInstance.evaluate(function () {
        var sheets = [].slice.apply(document.styleSheets);
        var result;

        result = sheets.reduce(function (memo, sheet) {
          var rules;
          if (!sheet.cssRules) {
            return memo;
          }

          rules = [].slice.apply(sheet.cssRules);
          return memo + rules.reduce(function (previousRuleText, rule) {
              return previousRuleText + rule.cssText;
            }, '');
        }, '');

        return result;
        return JSON.stringify(result);
      })
    })
    .then(function(cssContent) {
      css = cssContent;
      return pageInstance.property('content');
    })
    .then(function(content) {
      callback(null, {
        cssContent: css,
        pageContent: content
      });
      phantomInstance.exit();
    });
}


module.exports = {
  generateFromUrl: function (url, callback) {
    getPageAndCssContent(url, function (err, content) {

      var cssFilePath = mktemp.createFileSync('tmp-XXXXX.css');
      fs.writeFileSync(cssFilePath, content.cssContent);

      critical.generate({
        base: '.',
        html: content.pageContent,
        inline: false,
        css: cssFilePath,
        width: 1300,
        height: 900,
        minify: true,
      }, function (err,  criticalCss) {
        del.sync('tmp-*');
        return callback(err, criticalCss);
      });
    });
  }
}
