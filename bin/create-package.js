const fs = require('fs-jetpack');
const path = require('path');
const { formatBytes } = require('./utilities');

const zip = new require('node-zip')();

function createPackage (manifestObject, buildDir, packageFileName, fileName = 'manifest.json') {
  if (!manifestObject || !buildDir || !packageFileName) {
    throw Error('Could not create package');
  }

  const jsonString = JSON.stringify(manifestObject, null, 2);

  zip.file(fileName, jsonString);

  const data = zip.generate({
    base64: true,
    compression: 'DEFLATE'
  });
  const filePath = path.join(buildDir, packageFileName);
  const fileText = `var __BUILIFY_TEMPLATE = "${data}"`;

  fs.write(filePath, fileText);

  const info = fs.inspect(filePath);

  console.log(`Created ${packageFileName} with size of ${formatBytes(info.size)}`);
}

module.exports = createPackage;
