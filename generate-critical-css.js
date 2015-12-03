const mktemp = require('mktemp');
const fs = require('fs');
const critical = require('critical');
const del = require('del');
const phantom = require('phantom');


function getPageAndCssContent(url, callback) {
  phantom.create(function (ph) {
    ph.createPage(function (page) {
      page.set('settings.webSecurityEnabled', false);

      page.open(url, function (status) {
        page.evaluate(
          function () {

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
          },
          function (cssContent) {
            page.get('content', function (content) {
              callback(null, {
                cssContent: cssContent,
                pageContent: content
              });
              ph.exit();
            });
          });
      });
    });
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
      }, function (err, criticalCss) {
        del.sync('tmp-*');
        return callback(err, criticalCss);
      });
    });
  }
}