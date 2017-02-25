const fs = require('fs-jetpack');

module.exports = function getFile (filePath, returnAs = 'utf8') {
  if (fs.exists(filePath) === 'file') {
    try {
      const file = fs.read(filePath, returnAs);
      return file;
    } catch (e) {
      throw e;
    }
  } else {
    throw Error(`File with path "${filePath}" not found.`);
  }
};
