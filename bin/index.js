#! /usr/bin/env node
const path = require('path');
const globals = require('./globals');
const generatedData = require('./generated-data');
const parseOptions = require('./parse-options');
const GetStyling = require('./get-styling');
const ParseHTML = require('./parse-html');

// Directory where command has been executed.
const currentDir = globals.currentDir;

// Get CLI options.
const options = globals.cli.parse();

if (parseOptions(options)) {
  const optionsSource = path.normalize(options.src);
  const optionsStylesheet = options.stylesheet;
  const optionsOutput = options.output;
  const optionsPictures = options.pictures || false;

  // Template paths.
  const templateRoot = path.parse(path.join(currentDir, optionsSource)).dir;
  const assetsRoot = path.join(templateRoot, 'assets', 'template');
  const buildDir = path.join(currentDir, path.normalize(optionsOutput));

  // Where magic happens.
  const stylesheet = new GetStyling(path.join(assetsRoot, optionsStylesheet));
  const html = new ParseHTML(
    path.join(currentDir, optionsSource),
    stylesheet.getStylings(generatedData(globals.manifest)),
    buildDir,
    optionsPictures
  );
}
