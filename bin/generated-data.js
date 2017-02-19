const os = require('os');
const {
  assign: _assign,
  isObject: _isObject
} = require('lodash');

function generatedData (data) {
  if (!_isObject) {
    throw Error('Data is not object.');
  }

  return _assign({}, data, {
    _generated: {
      _time: +new Date(),
      _platform: os.platform(),
      _architecture: os.arch()
    }
  });
}

module.exports = generatedData;
