const _ = require('lodash');
const webshot = require('webshot');
const Jimp = require('jimp');
const globals = require('./globals');

let dir = null;

function takeDaShot (stack) {
  if (stack.length > 0) {
    const len = stack.length - 1;
    const item = stack[len];

    console.log(`PICTURE: query: "${item.query}"; fileName: "${item.fileName}; id: "${item.id}`);

    webshot(globals.webshotConfiguration.host, item.fileName, {
      siteType: 'url',
      windowSize: globals.webshotConfiguration.windowSize,
      captureSelector: item.query,
      renderDelay: globals.webshotConfiguration.renderDelay,
      shotSize: {
        width: 'window',
        height: 'window'
      }
    }, function (error) {
      if (error) {
        throw error;
      }

      Jimp.read(item.fileName).then(function (image) {
        image
          .scale(0.5)
          .write(item.fileName);

        console.log(`PICTURE: Succesfully took picture of "${item.id}".`);

        stack.pop();

        takeDaShot(stack);
      }).catch(function (err) {
          console.error(err);
      });
    });
  } else {
    console.log('PICTURES DONE');
  }
}

function captureElementVisualRepresentation (elementsToCapture, buildDir) {
  if (!elementsToCapture || !_.isArray(elementsToCapture)) {
    return;
  }

  if (_.isNull(dir)) {
    dir = buildDir;
  }

  takeDaShot(elementsToCapture);
}

module.exports = captureElementVisualRepresentation;
