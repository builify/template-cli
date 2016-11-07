const css = require('css');
const fs = require('fs');
const _map = require('lodash/map');
const _head = require('lodash/head');
const _isNull = require('lodash/isnull');

class GetStyling {
  constructor (stylesheetSource) {
    this._stylesheet = null;
    this._stylesheetFile = null;
    this._manifest = null;

    this.getStylesheetAndParse(stylesheetSource);
  }

  getStylesheetAndParse (stylesheetSource) {
    this._stylesheetFile = fs.readFileSync(
      stylesheetSource,
      { encoding: 'utf8' }
    );

    this.parseStylesheet();
  }

  parseStylesheet () {
    this._stylesheet = css.parse(this._stylesheetFile, {}).stylesheet;
  }

  getValueOfPropertySelector (_selector, _property) {
    let result = null;

    _map(this._stylesheet.rules, (rule, i) => {
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

   getColors () {
     if (!this._manifest.design.colors) {
       return manifestObject;
     }

    _map(this._manifest.design.colors, (color, selector) => {
      const val = this.getValueOfPropertySelector(selector, 'color');

      if (!_isNull(val)) {
        this._manifest.design.colors[selector] = val;

        console.log(`CSS: Set selector "${selector}" color value to "${val}".`)
      }
    });

    return this;
  }

  getTypography () {
    const baseFontSize = this.getValueOfPropertySelector('html', 'font-size');
    const baselineSize = this.getValueOfPropertySelector('body', 'line-height');

    if (baseFontSize) {
      this._manifest.design.typography.size.basefont = parseInt(baseFontSize);
      console.log(`CSS: Set font-size value to "${parseInt(baseFontSize)}".`);
    }

    if (baselineSize) {
      this._manifest.design.typography.size.baseline = parseFloat(baselineSize);
      console.log(`CSS: Set baseline value to "${parseFloat(baselineSize)}".`);
    }

    return this;
  }

  getStylings (manifestObject) {
    this._manifest = manifestObject;

    this
      .getColors()
      .getTypography();

    return this._manifest;
  }
}

module.exports = GetStyling;
