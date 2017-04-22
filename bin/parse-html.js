const path = require('path');
const jsdom = require('jsdom');
const _ = require('lodash');
const fs = require('fs-jetpack');
const globals = require('./globals');
const utilities = require('./utilities');
const getFile = require('./get-file');

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

function createBlockComponent (blockInfo, blockSource = '') {
  const { source: fileName } = blockInfo;

  const componentHTML = `
<!DOCTYPE html>
<head>
  <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>Arkio Template by Trip-Trax 2017</title>

    <link href="https://fonts.googleapis.com/css?family=Montserrat:400,700|Crimson+Text:400,700" rel="stylesheet" data-asset="stylesheet">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" data-asset="stylesheet">
    <link rel="stylesheet" href="../../assets/template/template.css">

    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js" data-asset="javascript"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/snap.svg/0.4.1/snap.svg-min.js" data-asset="javascript"></script>
    <script src="../../assets/template/template.js"></script>

</head>
<body>
${blockSource}
</body>
`;

  fs.write(path.join(globals.currentDir, 'build', 'components', fileName), componentHTML);
}

function parseBlocks ($, blocks) {
  const result = [];

  blocks.each(function () {
    const block = $(this);
    const info = {
      type: null,
      title: null,
      source: null
    };

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
            info.title = tagInfo;
          } else if (tag === '@category') {
            info.type = tagInfo;
          } else if (tag === '@source') {
            info.source = tagInfo;
          }
        });
    });

    // Remove comments
    block.contents().each(function removeComments () {
      if (this.nodeType === 8) {
        $(this).remove();
      }
    });

    if (!info.type || !info.title) {
      return;
    }

    const blockID = Math.random().toString(36).substr(2, 33);
    const blockSource = getBlockSource(block);
    const features = getBlockFeatures(block);

    createBlockComponent(info, blockSource);

    result.push({
      type: 'block',
      target: info.type,
      value: _.assign({}, { features }, {
        id: blockID,
        title: info.title,
        thumbnail: `assets/template/thumbnails/${blockID.toString()}.jpeg`,
        source: blockSource,
        query: `.${block.attr('class').split(' ').join('.')}`,

        // Development related
        dev: {
          source: info.source
        }
      })
    });
  });

  return result;
}

function parseHTML (fileSource, buildDir, callback) {
  if (!fileSource) {
    throw Error('No source defined');
  }

  const file = getFile(fileSource);

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
