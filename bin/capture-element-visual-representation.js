const webshot = require('webshot');
const globals = require('./globals');

function captureElementVisualRepresentation (fileName, query) {
  if (!fileName || !query) {
    return;
  }

  webshot(globals.webshotConfiguration.host, fileName, {
    siteType: 'url',
    windowSize: globals.webshotConfiguration.windowSize,
    captureSelector: query,
    renderDelay: globals.webshotConfiguration.renderDelay
  }, (err) => {
    if (err) {
      return console.log(err);
    }
  });
}

module.exports = captureElementVisualRepresentation;
