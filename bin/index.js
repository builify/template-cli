#! /usr/bin/env node
const path = require('path');
const globals = require('./globals');
const generatedData = require('./generated-data');
const GetStyling = require('./get-styling');
const ParseHTML = require('./parse-html');

// Manifest object.
var manifestObject = globals.manifest;

manifestObject = generatedData(manifestObject);

// Directory where command has been executed.
const currentDir = globals.currentDir;

// Get CLI options.
const options = globals.cli.parse();

const optionsSource = options.src ? path.normalize(options.src) : null;
const optionsStylesheet = options.stylesheet || null;
const optionsOutput = options.output || null;
const optionsPictures = options.pictures || false;

// Template paths.
const templateRoot = path.parse(path.join(currentDir, optionsSource)).dir;
const assetsRoot = path.join(templateRoot, 'assets', 'template');
const buildDir = path.join(currentDir, path.normalize(optionsOutput));

// Where magic happens.
const stylesheet = new GetStyling(path.join(assetsRoot, optionsStylesheet));
const html = new ParseHTML(path.join(currentDir, optionsSource), stylesheet.getStylings(manifestObject), buildDir);
