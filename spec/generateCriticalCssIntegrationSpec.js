const path = require('path');

describe('Generate critical css', function () {
  it('should generate critical css by provided url', function (done) {
    const http = require('http');
    const app = require('connect')();
    const criticalCssGenerator = require('../generate-critical-css');
    const serveStatic = require('serve-static');
    var server;
    app.use(serveStatic(path.join(__dirname, 'fixtures')));
    server = http.createServer(app);
    server.listen(3004);

    criticalCssGenerator.generateFromUrl('http://localhost:3004', function (err, criticalCss) {
      expect(criticalCss).toEqual('#styleme{color:#000}#styleme2{color:#fff}');
      server.close();
      done();
    });
  });
});
