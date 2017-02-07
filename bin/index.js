#! /usr/bin/env node
const path = require('path');
const program = require('commander');
const _isFunction = require('lodash/isfunction');
const globals = require('./globals');
const generatedData = require('./generated-data');
const parseOptions = require('./parse-options');
const GetStyling = require('./get-styling');
const ParseHTML = require('./parse-html');
const createPackage = require('./create-package');

// Directory where command has been executed.
const currentDir = globals.currentDir;

// Command line arguments.
program
  .version('0.0.1')
  .option('-n, --name <n>', 'Template name')
  .option('-s, --src <n>', 'Main template HTML file.')
  .option('-b, --stylesheet <n>', 'Stylesheet name for parsing.')
  .option('-o, --output <n>', 'Output folder.', 'builder')
  .option('-p, --pictures', 'Generate pictures of elements.')
  .parse(process.argv);

if (parseOptions(program)) {
  const optionsSource = path.normalize(program.src);
  const optionsStylesheet = path.normalize(program.stylesheet);
  const optionsOutput = program.output;
  const optionsPictures = program.pictures || false;
  const optionsName = program.name || '';

  // Template paths.
  const buildDir = path.join(currentDir, path.normalize(optionsOutput));

  // Where magic happens.
  const stylesheet = new GetStyling(optionsStylesheet);
  const html = new ParseHTML(
    path.join(currentDir, optionsSource),
    stylesheet.getStylings(generatedData(globals.manifest)),
    buildDir,
    optionsName,
    optionsPictures,
    function (manifest) {
      createPackage(manifest, buildDir);
    }
  );
}
