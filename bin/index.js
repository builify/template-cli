#!/usr/bin/env node
var commandLineArgs = require('command-line-args');
var jsdom = require('jsdom');
var _ = require('lodash');
var css = require('css');
var path = require('path');
var fs = require('fs');
var defaultManifest = require('./default-manifest.json');

// Manifest object.
var manifestObject = JSON.parse(JSON.stringify(defaultManifest));

// Directory where command has been executed.
var currentDir = process.cwd();

// Command line arguments.
var cli = commandLineArgs([
  { name: 'src', alias: 's', type: String },   // Main template HTML file.
  { name: 'stylesheet', type: String },        // Stylesheet name for parsing.
  { name: 'output', alias: 'o', type: String } // Output folder.
]);

// Get CLI options.
var options = cli.parse();
var optionsSource = path.normalize(options.src);
var optionsStylesheet = options.stylesheet;
var optionsOutput = options.output;

// Template paths.
var templateRoot = path.parse(path.join(currentDir, optionsSource)).dir;
var assetsRoot = path.join(templateRoot, 'assets');
var buildDir = path.join(currentDir, path.normalize(optionsOutput));

// Template HTML file.
var templateHTMLFile = fs.readFileSync(
  path.join(currentDir, optionsSource),
  { encoding: 'utf8' }
);

// Template stylesheet file.
var templateStylesheetFile = fs.readFileSync(
  path.join(assetsRoot, optionsStylesheet),
  { encoding: 'utf8' }
);

// Parsed stylesheet.
var obj = css.parse(templateStylesheetFile, {});

// Create manifest file from the object.
function createManifestFile () {
  const filePath = path.join(buildDir, 'manifest.json');
  const fileBuffer = new Buffer(
    JSON.stringify(manifestObject, null, 2)
  );

  fs.open(filePath, 'w', function (err, fd) {
    if (err) {
      throw 'error opening file: ' + err;
    }

    fs.write(fd, fileBuffer, 0, fileBuffer.length, null, function (err) {
      if (err) {
        throw 'error opening file: ' + err;
      }

      fs.close(fd, function() {
        console.log('file written');
      })
    });
  });
}

// Get stylesheet value of property.
function getValueOfPropertyOfSelector (_selector, _property) {
  let result = null;

  _.map(obj.stylesheet.rules, (rule, i) => {
    const { type, selectors, declarations } = rule;
    const firstSelector = _.head(selectors);

    if (type === 'rule') {
      if (firstSelector === _selector) {
        _.map(declarations, (declaration) => {
          const { type, property, value } = declaration;

          if (type === 'declaration') {
            if (property === _property) {
              result = value;
              return false;
            }
          }
        });
      }
    }
  });

  return result;
}

_.map(manifestObject.design.colors, (color, selector) => {
  const val = getValueOfPropertyOfSelector(selector, 'color');

  if (val !== null) {
    manifestObject.design.colors[selector] = val;
  }
});

const baseFontSize = getValueOfPropertyOfSelector('html', 'font-size');
const baselineSize = getValueOfPropertyOfSelector('body', 'line-height');

if (baseFontSize && baselineSize) {
  manifestObject.design.typography.size.basefont = parseInt(baseFontSize);
  manifestObject.design.typography.size.baseline = parseFloat(baselineSize);
}

// Create virtual DOM page.
var doc = jsdom.env({
  html: templateHTMLFile,
  scripts: [
    'http://code.jquery.com/jquery.js'
  ],
  done: function (err, window) {
    var $ = window.$;
    var blocks = $('body').children();
    var assets = $('[data-asset]');

    // Add assets to manifest file.
    assets.each(function () {
      var asset = $(this);
      var assetType = asset.attr('data-asset');

      if (assetType === 'css') {
        manifestObject.external.core.push(
          { type: 'css', src: asset.attr('href') }
        );
      } else if (assetType === 'js') {
        manifestObject.external.core.push(
          { type: 'js', src: asset.attr('src') }
        );
      }
    });

    // Add blocks to manifest file.
    blocks.each(function (i) {
      var block = $(this);
      var blockType = block.attr('data-type');
      var blockTitle = block.attr('data-title');
      var features = {
        videoBackground: false,
        imageBackground: false,
        colorBackground: false,
        countdown: false
      };

      if (!blockType || !blockTitle) {
          return;
      }

      var blockSource = _.trimEnd(_.trimStart(
        block
          .clone()
          .removeAttr('data-type')
          .removeAttr('data-title')
          .removeAttr('data-picture')
          .wrap('<div/>')
          .parent()
          .html()
      ));

      if (block.find('.countdown').length) {
        features.countdown = true;
      }

      if (block.find('.block-background-cover-color').length) {
        features.colorBackground = true;
      }

      if (block.find('.block-video-holder').length) {
        features.videoBackground = true;
      }

      if (_.startsWith(block.attr('style'), 'background-image')) {
        features.imageBackground = true;
      }

      var isTypeInBlocks = _.findIndex(manifestObject.blocks, ['type', blockType]);

      if (isTypeInBlocks == -1) {
        manifestObject.blocks.push(
          { type: blockType, items: [] }
        );
      }

      isTypeInBlocks = _.findIndex(manifestObject.blocks, ['type', blockType]);

      manifestObject.blocks[isTypeInBlocks].items.push(_.assign({}, { features }, {
        title: blockTitle,
        thumbnail: `assets/template/${blockType}-${_.kebabCase(blockTitle)}.png`,
        source: blockSource
      }));
    });

    createManifestFile();
  }
});
