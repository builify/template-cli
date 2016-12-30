const _ = require('lodash');
const webshot = require('webshot');
const Jimp = require('jimp');
const globals = require('./globals');
const createPackage = require('./create-package');

let dir = null;

function takeDaShot (stack, buildDir) {
  if (stack.length > 0) {
    const len = stack.length - 1;
    const item = stack[len];

    console.log(item);

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

        console.log(`PICTURE: Took picture of "${item.id}".`);

        stack.pop();

        console.log(dir);
        takeDaShot(stack);
      }).catch(function (err) {
          console.error(err);
      });
    });
  } else {
    console.log ('PICTURES DONE');
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
