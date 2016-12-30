const manifestData = require('./data/manifest.json');

const globals = {};

// Directory where command has been executed.
globals.currentDir = process.cwd();

// Manifest's JSON as object.
globals.manifest = JSON.parse(JSON.stringify(manifestData));

// Webshot configuration.
globals.webshotConfiguration = {
  host: 'http://localhost:3000/',
  windowSize: {
    width: 1920,
    height: 1080
  },
  renderDelay: 1000
};

module.exports = globals;
