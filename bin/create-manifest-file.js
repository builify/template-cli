const fs = require('fs');
const path = require('path');

function createManifestFile (manifestObject, buildDir, fileName = 'manifest.json') {
  const filePath = path.join(buildDir, fileName);
  const fileBuffer = new Buffer(
    JSON.stringify(manifestObject, null, 2)
  );

  fs.open(filePath, 'w', (err, fd) => {
    if (err) {
      throw `Error opening file: ${err}`;
    }

    fs.write(fd, fileBuffer, 0, fileBuffer.length, null, (err) => {
      if (err) {
        throw Error(`Error opening file: ${err}`);
      }

      fs.close(fd, () => {
        console.log('Manifest file successfully generated.');
      })
    });
  });
}

module.exports = createManifestFile;
