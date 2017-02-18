const fs = require('fs-jetpack');
const css = require('css');
const {
  map: _map,
  head: _head,
  isNull: _isNull,
  concat: _concat
} = require('lodash');

function getStylesheetFile (fileSource) {
  if (fs.exists(fileSource) === 'file') {
    try {
      const stylesheet = fs.read(fileSource, 'utf8');
      return stylesheet;
    } catch (e) {
      throw e;
    }
  } else {
    throw 'No stylesheet file found.';
  }
}

function getValueOfPropertySelector (stylesheet, _selector, _property) {
  let result = null;

  _map(stylesheet.rules, (rule, i) => {
    const { type, selectors, declarations } = rule;
    const firstSelector = _head(selectors);

    if (type === 'rule') {
      if (firstSelector === _selector) {
        _map(declarations, (declaration) => {
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

function parseStylesheet (input) {
  if (!input) {
    throw 'No stylesheet to parse.';
  }

  const parsedStylesheet = css.parse(input, {}).stylesheet;

  return parsedStylesheet;
}

function getColors (stylesheet, manifestObject) {
  if (!stylesheet || !manifestObject) {
    throw 'No stylesheet/manifest.';
  }

  if (!manifestObject.design || !manifestObject.design.colors) {
    return manifestObject;
  }

  let result = [];

  _map(manifestObject.design.colors, (color, selector) => {
    const val = getValueOfPropertySelector(stylesheet, selector, 'color');

    if (!_isNull(val)) {
      result.push({
        'type': 'color',
        'target': selector,
        'value': val
      })

      console.log(`CSS: Set selector "${selector}" color value to "${val}".`)
    }
  });

  return result;
}

function getTypography (stylesheet) {
  const baseFontSize = getValueOfPropertySelector(stylesheet, 'html', 'font-size');
  const baselineSize = getValueOfPropertySelector(stylesheet, 'body', 'line-height');
  let result = [];

  if (baseFontSize) {
    result.push({
      'type': 'typography',
      'target': 'basefont',
      'value': parseInt(baseFontSize)
    });

    console.log(`CSS: Set font-size value to "${parseInt(baseFontSize)}".`);
  }

  if (baselineSize) {
    result.push({
      'type': 'typography',
      'target': 'baseline',
      'value': parseFloat(baselineSize)
    });

    console.log(`CSS: Set baseline value to "${parseFloat(baselineSize)}".`);
  }

  return result;
}

function getFileAsset (file) {
  return [{
    'type': 'asset',
    'target': 'stylesheet',
    'value': file
  }];
}

function getStyles (fileSource, manifestObject) {
  if (!fileSource) {
    throw 'No source defined';
  }

  const file = getStylesheetFile(fileSource);
  const stylesheet = parseStylesheet(file);
  const typographyRules = getTypography(stylesheet);
  const colorRules = getColors(stylesheet, manifestObject);
  const asset = getFileAsset(file);
  const data = _concat(typographyRules, colorRules, asset);

  return data;
}

module.exports = getStyles;
