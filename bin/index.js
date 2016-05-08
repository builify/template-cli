#!/usr/bin/env node
const commandLineArgs = require('command-line-args');
const jsdom = require('jsdom');
const _ = require('lodash');
const webshot = require('webshot');
const css = require('css');
const path = require('path');
const fs = require('fs');
const defaultManifest = require('./default-manifest.json');

// Manifest object.
var manifestObject = JSON.parse(JSON.stringify(defaultManifest));

// Directory where command has been executed.
const currentDir = process.cwd();

// Command line arguments.
const cli = commandLineArgs([
  { name: 'src', alias: 's', type: String },      // Main template HTML file.
  { name: 'stylesheet', type: String },           // Stylesheet name for parsing.
  { name: 'output', alias: 'o', type: String },   // Output folder.
  { name: 'pictures', alias: 'p', type: Boolean } // Generate pictures of elements.
]);

// Get CLI options.
const options = cli.parse();
const optionsSource = path.normalize(options.src || null);
const optionsStylesheet = options.stylesheet || null;
const optionsOutput = options.output || null;
const optionsPictures = options.pictures || false;

// Template paths.
const templateRoot = path.parse(path.join(currentDir, optionsSource)).dir;
const assetsRoot = path.join(templateRoot, 'assets');
const buildDir = path.join(currentDir, path.normalize(optionsOutput));

// Template HTML file.
const templateHTMLFile = fs.readFileSync(
  path.join(currentDir, optionsSource),
  { encoding: 'utf8' }
);

// Template stylesheet file.
const templateStylesheetFile = fs.readFileSync(
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
      throw `Error opening file: ${err}`;
    }

    fs.write(fd, fileBuffer, 0, fileBuffer.length, null, function (err) {
      if (err) {
        throw `Error opening file: ${err}`;
      }

      fs.close(fd, function() {
        console.log('Manifest file generated.');
      })
    });
  });
}

// Create image of element.
function takePictureOfElement (fileName, query) {
  const pagePath = 'http://localhost:3000/';

  if (!fileName || !query) {
      return;
  }

  webshot(pagePath, fileName, {
    siteType: 'url',
    windowSize: {
        width: 1200,
        height: 750
    },
    captureSelector: query,
    renderDelay: 3000
  }, function(err) {
    if (err) return console.log(err);
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

function getColors () {
  _.map(manifestObject.design.colors, (color, selector) => {
    const val = getValueOfPropertyOfSelector(selector, 'color');

    if (!_.isNull(val)) {
      manifestObject.design.colors[selector] = val;
    }
  });
}

function getTypography () {
  const baseFontSize = getValueOfPropertyOfSelector('html', 'font-size');
  const baselineSize = getValueOfPropertyOfSelector('body', 'line-height');

  if (baseFontSize) {
    manifestObject.design.typography.size.basefont = parseInt(baseFontSize);
  }

  if (baselineSize) {
    manifestObject.design.typography.size.baseline = parseFloat(baselineSize);
  }
}

// Run main things.
getColors();
getTypography();

// Create virtual DOM page.
const doc = jsdom.env({
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
      const asset = $(this);
      const assetType = asset.attr('data-asset');

      switch (assetType) {
        case 'css':
        case 'js': {
          let assetSource = asset.attr('src') || asset.attr('href');
          const { dir, base } = path.parse(assetSource);

          if (dir === 'assets') {
            assetSource = path.join(dir, 'template', base).split(path.sep).join('/');
          }

          manifestObject = _.assign({}, manifestObject, {
            external: {
              core: [
                ...manifestObject.external.core,
                { type: assetType, src: assetSource }
              ]
            }
          });

          break;
        }

        default:
          break;
      }
    });

    // Add blocks to manifest file.
    blocks.each(function (i) {
      const block = $(this);
      const blockType = block.attr('data-type');
      const blockTitle = block.attr('data-title');

      if (!blockType || !blockTitle) {
        return;
      }

      let blockCategory = _.findIndex(manifestObject.blocks, ['type', blockType]);
      const blockSource = _.trimEnd(_.trimStart(
        block
          .clone()
          .removeAttr('data-type') // Remove junk attributes.
          .removeAttr('data-title')
          .removeAttr('data-picture')
          .wrap('<div/>')
          .parent()
          .html()
      ));
      var features = {
        videoBackground: false,
        imageBackground: false,
        colorBackground: false,
        countdown: false
      };

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

      if (blockCategory === -1) {
        manifestObject = _.assign({}, manifestObject, {
          blocks: [
            ...manifestObject.blocks,
            { type: blockType, items: [] }
          ]
        });

        blockCategory = _.findIndex(manifestObject.blocks, ['type', blockType]);
      }

      manifestObject.blocks[blockCategory] = _.assign({}, manifestObject.blocks[blockCategory], {
        items: [
          ...manifestObject.blocks[blockCategory].items,
          _.assign({}, { features }, {
            title: blockTitle,
            thumbnail: `assets/template/${blockType}-${_.kebabCase(blockTitle)}.png`,
            source: blockSource
          })
        ]
      });
    });

    // Take pictures.
    if (optionsPictures === true) {
      const pictureElements = $('[data-picture]');
      const blocksLength = pictureElements.size();

      pictureElements.each(function (i) {
        const elem = $(this);
        const dataType = elem.attr('data-type');
        const dataTitle = elem.attr('data-title');
        const dataPicture = elem.attr('data-picture');

        if (!dataTitle || !dataTitle) {
          return console.log(`WARNING: data-picture="${dataPicture}" missing parameters!`);
        }

        const query = `[data-picture="${dataPicture}"]`;
        const fileName = `dist/${dataType}-${_.kebabCase(dataTitle)}.png`;

        switch (+dataPicture) {
            case 23:
            case 28:
              takePictureOfElement(fileName, query);
              break;

            default:
              break;
        }
      });
    }

    createManifestFile();
  }
});
