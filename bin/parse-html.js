const fs = require('fs-jetpack');
const path = require('path');
const jsdom = require('jsdom');
const _ = require('lodash');
const utilities = require('./utilities');

function getHTMLFile (fileSource) {
  if (fs.exists(fileSource) === 'file') {
    try {
      const HTML = fs.read(fileSource, 'utf8');
      return HTML;
    } catch (e) {
      throw e;
    }
  } else {
    throw Error('No HTML file found.');
  }
}

function initializeJSDom (file, callback) {
 const doc = jsdom.env({
    html: file,
    scripts: [
      'http://code.jquery.com/jquery.js'
    ],
    done: (err, window) => {
      callback(err, window);
    }
  });

  return doc;
}

function getBlockSource (block) {
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

  return blockSource;
}

function getBlockFeatures (block) {
  let features = {
    videoBackground: false,
    imageBackground: false,
    colorBackground: false,
    countdown: false,
    formInput: false
  };

  if (block.find('.countdown').length) {
    features = _.assign({}, features, {
      countdown: true
    });
  }

  if (block.find('.background-cover-color').length) {
    features = _.assign({}, features, {
      colorBackground: true
    });
  }

  if (block.find('.background-image-holder').length ||
      _.startsWith(block.attr('style'), 'background-image')) {
    features = _.assign({}, features, {
      imageBackground: true
    });
  }

  if (block.find('.background-video-holder').length) {
    features = _.assign({}, features, {
      videoBackground: true
    });
  }

  if (_.startsWith(block.attr('style'), 'background-image')) {
    features = _.assign({}, features, {
      imageBackground: true
    });
  }

  if (block.find('form').length > 0) {
    features = _.assign({}, features, {
      formInput: true
    });
  }

  return features;
}

function parseHTMLAssets ($, assets) {
  const result = [];

  if (!$ || !assets) {
    return result;
  }

  assets.each(function parse () {
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

        result.push({
          type: 'external-asset',
          target: assetType,
          value: assetSource
        });

        break;
      }

      default:
        break;
    }
  });

  return result;
}

function parseBlocks ($, blocks) {
  const result = [];

  blocks.each(function () {
    const block = $(this);
    let blockType = null;
    let blockTitle = null;

    block.contents()
      .filter(function () {
        return this.nodeType === 8;
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

    // Remove comments
    block.contents().each(function () {
      if (this.nodeType === 8) {
        $(this).remove();
      }
    });

    if (!blockType || !blockTitle) {
      return;
    }

    const blockID = Math.random().toString(36).substr(2, 7);
    const blockHash = Math.abs(utilities.hashCode(`${blockType}-${blockTitle}`));
    const blockSource = getBlockSource(block);
    const features = getBlockFeatures(block);

    result.push({
      type: 'block',
      target: blockType,
      value: _.assign({}, { features }, {
        id: blockID,
        title: blockTitle,
        thumbnail: `assets/template/${blockHash.toString()}.jpeg`,
        source: blockSource
      })
    });
  });

  return result;
}

function parseHTML (fileSource, buildDir, callback) {
  if (!fileSource) {
    throw Error('No source defined');
  }

  const file = getHTMLFile(fileSource);

  initializeJSDom(file, (err, window) => {
    const $ = window.$;
    const assets = parseHTMLAssets($, $('[data-asset]'));
    const blocks = parseBlocks($, $('body').children(), buildDir);

    setTimeout(() => {
      const data = _.concat(assets, blocks);
      callback(data);
    }, 1000);
  });
}

module.exports = parseHTML;
