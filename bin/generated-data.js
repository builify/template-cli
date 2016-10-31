const os = require('os');
const _assign = require('lodash/assign');
const _isObject = require('lodash/isobject');

function generatedData (data) {
  if (!_isObject) {
    throw Error("Data is not object.");
  }

  return _assign({}, data, {
    "_generated": {
      "_time": +new Date(),
      "_platform": os.platform(),
      "_architecture": os.arch()
    }
  });
}

module.exports = generatedData;
