const _ = require('lodash');
const webshot = require('webshot');
const Jimp = require('jimp');
const globals = require('./globals');
const createPackage = require('./create-package');

function takeDaShot (stack, manifest, buildDir) {
  if (stack.length > 17) {
    const len = stack.length - 1;

    const item = stack[len];

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

        console.log(`PICTURE: Took picture of "${item.query}".`);

        stack.pop();
        takeDaShot(stack, manifest, buildDir);
      }).catch(function (err) {
          console.error(err);
      });
    });
  } else {
    console.log (manifest, buildDir);
    createPackage(manifest, buildDir);
  }
}

function captureElementVisualRepresentation (elementsToCapture) {
  if (!elementsToCapture || !_.isArray(elementsToCapture)) {
    return;
  }

  takeDaShot(elementsToCapture);
}

module.exports = captureElementVisualRepresentation;
