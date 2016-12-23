const jsdom = require('jsdom');
const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const globals = require('./globals');
const createPackage = require('./create-package');
const captureElementVisualRepresentation = require('./capture-element-visual-representation');

class ParseHTML {
  constructor (htmlPath, manifestObject, buildDir, takePictures = false) {
    this._htmlFile = null;
    this._doc = null;

    this._manifest = manifestObject;
    this._buildDir = buildDir;
    this._takePictures = takePictures;

    this.getHTMLFile(htmlPath);
  }

  getHTMLFile (htmlPath) {
    this._htmlFile = fs.readFileSync(
      htmlPath, { encoding: 'utf8' }
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
    const $ = window.$;
    const blocks = $('body').children();
    var assets = $('[data-asset]');

    // Add assets to manifest file.
    this.parseHTMLAssets($, assets);

    // Add blocks to manifest file.
    this.parseHTMLBlocks($, blocks);

    // Take pictures.
    this._takePictures && this.takePictures($);

    this.saveManifestFile();
  }

  parseHTMLAssets ($, assets) {
    let manifestObject = this._manifest;

    if (!assets) {
      return;
    }

    assets.each(function () {
      const asset = $(this);
      const assetType = asset.attr('data-asset');

      switch (assetType) {
        case 'css':
        case 'stylesheet':
        case 'js':
        case 'javascript': {
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

          console.log(`ASSETS: Adding "${assetSource}" (${assetType})`);

          break;
        }

        default:
          break;
      }
    });

    this._manifest = manifestObject;
  }

  parseHTMLBlocks ($, blocks) {
    let manifestObject = this._manifest;

    blocks.each(function (i) {
      const block = $(this);
      let blockType = null;
      let blockTitle = null;

      block.contents()
        .filter(function () {
          return this.nodeType == 8;
        })
        .each(function () {
          const text = this.nodeValue;
          const lines = text.split('\n');

          _.map(lines, (line) => {
            if (line.length === 0) {
              return;
            }

            const tagRegex = /@{1}[^\s]+/g;
            const search = tagRegex.exec(line);
            let tag = null;
            let tagInfo = null;

            if (search !== null) {
              tag = search[0];
              tagInfo = line.substring(tag.length + '- '.length + 3);
            }

            if (!tag || !tagInfo) {
              return;
            }

            if (tag === '@title') {
              blockTitle = tagInfo;
            } else if (tag === '@category') {
              blockType = tagInfo;
            }
          });
      });


      if (!blockType || !blockTitle) {
        return;
      }

      // Get block category.
      let blockCategory = _.findIndex(manifestObject.blocks, ['type', blockType]);

      if (blockCategory === -1) {
        manifestObject = _.assign({}, manifestObject, {
          blocks: [
            ...manifestObject.blocks,
            { type: blockType, items: [] }
          ]
        });

        blockCategory = _.findIndex(manifestObject.blocks, ['type', blockType]);
      }

      // Get block source.
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

      // Get block features.
      let features = {
        videoBackground: false,
        imageBackground: false,
        colorBackground: false,
        countdown: false
      };

      if (block.find('.countdown').length) {
        features.countdown = true;
      }

      if (block.find('.background-cover-color').length) {
        features.colorBackground = true;
      }

      if (block.find('.background-image-holder').length) {
        features.imageBackground = true;
      }

      if (block.find('.block-video-holder').length) {
        features.videoBackground = true;
      }

      if (_.startsWith(block.attr('style'), 'background-image')) {
        features.imageBackground = true;
      }

      // Assign block to category in manifest file.
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

      console.log(`HTML: Adding "${blockTitle}" (${blockType})`);
    });

    this._manifest = manifestObject;
  }

  saveManifestFile () {
    createPackage(this._manifest, this._buildDir);
  }

  takePictures ($) {
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
}

module.exports = ParseHTML;
