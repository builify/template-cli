const commandLineArgs = require('command-line-args');
const manifestData = require('./data/manifest.json');

const globals = {};

// Directory where command has been executed.
globals.currentDir = process.cwd();

// Command line arguments.
globals.cli = commandLineArgs([
  { name: 'src', alias: 's', type: String },         // Main template HTML file.
  { name: 'stylesheet', alias: 'c', type: String },  // Stylesheet name for parsing.
  { name: 'output', alias: 'o', type: String },      // Output folder.
  { name: 'pictures', alias: 'p', type: Boolean }    // Generate pictures of elements.
]);

// Manifest's JSON as object.
globals.manifest = JSON.parse(JSON.stringify(manifestData));

// Webshot configuration.
globals.webshotConfiguration = {
  host: 'http://localhost:3000/',
  windowSize: {
    width: 1200,
    height: 750
  },
  renderDelay: 3000
};

module.exports = globals;
