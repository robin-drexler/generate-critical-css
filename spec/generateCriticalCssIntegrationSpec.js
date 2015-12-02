const proxyquire = require('proxyquire');

describe('Generate critical css', function () {
  it('should generate critical css by provided url', function (done) {
    const url = 'http://noassetmovement.jimdo.com';
    var request = require('request');

    const markup = getMarkupFixture();

    // css returned by first css file in document
    const css = `
      #styleme {color: #000}
      #idonotexist {color: green}
    `;

    // css returned by second css file in document
    const anotherCss = `
      #styleme2 {color: #fff}
      #idonotexist {color: black}
    `;


    // mock request and return css and markup content, depending on url requested
    // in order to avoid actual requests being made
    spyOn(request, 'get').andCallFake(function (url, callback) {
      if (url.endsWith('style.css')) {
        return callback(null, {}, css);
      }

      if (url.endsWith('style2.css')) {
        return callback(null, {}, anotherCss);
      }

      return callback(null, {}, markup);

    });

    const criticalCssGenerator = proxyquire('../generate-critical-css', {
      'request': request
    });

    criticalCss = criticalCssGenerator.generateFromUrl(url, function(err, criticalCss) {
      // only the applied css should be included, also should be minified
      expect(criticalCss).toEqual('#styleme{color:#000}#styleme2{color:#fff}');
      done();
    });

  });
});

function getMarkupFixture() {
  return `

<!DOCTYPE html>
<html lang="en-US">
<head>
  <link href="style.css" rel="stylesheet" />
  <link href="style2.css" rel="stylesheet" />

  <body>
    <div id="styleme">CONTENT</div>
    <div id="styleme2">CONTENT</div>
  </body>
</head>

</html>

  `;
}