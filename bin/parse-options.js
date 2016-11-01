const _isEmpty = require('lodash/isempty');

function parseOptions (options) {
  if (_isEmpty(options)) {
    console.log('No options passed.');
    return false;
  }

  if (options.help) {
    console.log('Read README.md');
    return false;
  }

  if (!options.src) {
    throw Error('No source defined.');
  }

  if (!options.stylesheet) {
    throw Error('No stylesheet filename defined.');
  }

  if (!options.output) {
    throw Error('No outbuild directory defined.');
  }

  return true;
}

module.exports = parseOptions;
