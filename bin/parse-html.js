const jsdom = require('jsdom');
const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const globals = require('./globals');
const createManifestFile = require('./create-manifest-file');
const captureElementVisualRepresentation = require('./capture-element-visual-representation');

class ParseHTML {
  constructor (htmlPath, manifestObject, buildDir) {
    this._htmlFile = null;
    this._doc = null;

    this._manifest = manifestObject;
    this._buildDir = buildDir;

    this.getHTMLFile(htmlPath);
  }

  getHTMLFile (htmlPath) {
    this._htmlFile = fs.readFileSync(
      htmlPath,
      { encoding: 'utf8' }
    );

    this.initializeJSDom();
  }

  initializeJSDom () {
    this._doc = jsdom.env({
      html: this._htmlFile,
      scripts: [
        'http://code.jquery.com/jquery.js'
      ],
      done: (err, window) => {
        this.parseHTML(err, window);
      }
    });
  }

  parseHTML (err, window) {
    var $ = window.$;
    var blocks = $('body').children();
    var assets = $('[data-asset]');
    let manifestObject = this._manifest;

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
/*
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
              captureElementVisualRepresentation(fileName, query);
              break;

            default:
              break;
        }
      });
    }
*/
    createManifestFile(manifestObject, this._buildDir);
  }
}

module.exports = ParseHTML;
