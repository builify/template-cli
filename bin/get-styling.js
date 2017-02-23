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
    throw Error('No stylesheet file found.');
  }
}

function getValueOfPropertySelector (stylesheet, _selector, _property) {
  let result = null;

  _map(stylesheet.rules, (rule) => {
    const { type, selectors, declarations } = rule;
    const firstSelector = _head(selectors);

    if (type === 'rule') {
      if (firstSelector === _selector) {
        _map(declarations, (declaration) => {
          const { type: decType, property, value } = declaration;

          if (decType === 'declaration') {
            if (property === _property) {
              result = value;
              return false;
            }
          }

          return false;
        });
      }
     }
  });

  return result;
}

function parseStylesheet (input) {
  if (!input) {
    throw Error('No stylesheet to parse.');
  }

  const parsedStylesheet = css.parse(input, {}).stylesheet;

  return parsedStylesheet;
}

function getColors (stylesheet, manifestObject) {
  if (!stylesheet || !manifestObject) {
    throw Error('No stylesheet/manifest.');
  }

  if (!manifestObject.design || !manifestObject.design.colors) {
    return manifestObject;
  }

  const result = [];

  _map(manifestObject.design.colors, (color, selector) => {
    const val = getValueOfPropertySelector(stylesheet, selector, 'color');

    if (!_isNull(val)) {
      result.push({
        type: 'color',
        target: selector,
        value: val
      });
    }
  });

  return result;
}

function getTypography (stylesheet) {
  const baseFontSize = getValueOfPropertySelector(stylesheet, 'html', 'font-size');
  const baselineSize = getValueOfPropertySelector(stylesheet, 'body', 'line-height');
  const result = [];

  if (baseFontSize) {
    result.push({
      type: 'typography',
      target: 'basefont',
      value: parseInt(baseFontSize, 10)
    });
  }

  if (baselineSize) {
    result.push({
      type: 'typography',
      target: 'baseline',
      value: parseFloat(baselineSize)
    });
  }

  return result;
}

function getFileAsset (file) {
  return [{
    type: 'asset',
    target: 'stylesheet',
    value: file
  }];
}

function getStyles (fileSource, manifestObject) {
  if (!fileSource) {
    throw Error('No source defined');
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
