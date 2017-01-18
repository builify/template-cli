const fs = require('fs');
const path = require('path');
const zip = new require('node-zip')();

const packageFileName = 'arkio.builify.js';

function createPackage (manifestObject, buildDir, fileName = 'manifest.json') {
  zip.file(fileName, JSON.stringify(manifestObject, null, 2));

  const data = zip.generate({
    base64: true,
    compression: 'DEFLATE'
  });
  const filePath = path.join(buildDir, packageFileName);
  const fileText = `var __BUILIFY_TEMPLATE = "${data}"`;

  fs.writeFileSync(filePath, fileText, 'binary');
}

module.exports = createPackage;
