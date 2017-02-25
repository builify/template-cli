const { concat: _concat } = require('lodash');
const getFile = require('./get-file');

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

  const file = getFile(fileSource);
  const asset = getFileAsset(file);
  const data = _concat(asset);

  return data;
}

module.exports = getJavascript;
