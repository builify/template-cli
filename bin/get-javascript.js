const fs = require('fs-jetpack');
const { concat: _concat } = require('lodash');

function getJavascriptFile (fileSource) {
  if (fs.exists(fileSource) === 'file') {
    try {
      const javascript = fs.read(fileSource, 'utf8');
      return javascript;
    } catch (e) {
      throw e;
    }
  } else {
    throw Error('No javascript file found.');
  }
}

function getFileAsset (file) {
  return [{
    type: 'asset',
    target: 'javascript',
    value: file
  }];
}

function getJavascript (fileSource) {
  if (!fileSource) {
    throw Error('No source defined');
  }

  const file = getJavascriptFile(fileSource);
  const asset = getFileAsset(file);
  const data = _concat(asset);

  return data;
}

module.exports = getJavascript;
