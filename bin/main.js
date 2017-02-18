const fs = require('fs-jetpack');
const path = require('path');
const Log = require('./log');
const globals = require('./globals');
const generatedData = require('./generated-data');
const getStyling = require('./get-styling');
const getJavascript = require('./get-javascript');
const parseHTML = require('./parse-html');
const createPackage = require('./create-package');
const {
  map: _map,
  isArray: _isArray,
  assign: _assign,
  findIndex: _findIndex
} = require('lodash');

function getCurrentDirectory () {
  return globals.currentDir;;
}

function getConfigurationFile () {
  const currentDir = getCurrentDirectory();
  const fileName = globals.configurationFilename;
  const filePath = path.join(currentDir, fileName);

  if (fs.exists(filePath) === 'file') {
    try {
      const configuration = fs.read(filePath, 'json');
      return configuration;
    } catch (e) {
      throw e;
    }
  } else {
    throw 'No template configuration file found.';
  }
}

function parseConfiguration (configuration) {
  const { name, files, output, createThumbnails } = configuration;

  if (!name || !files || !output) {
    throw 'Wrong configuration.';
  }

  return configuration;
}

function formatManifest (manifestObject, ...arguments) {
  for (let argument of arguments) {
    if (_isArray(argument)) {
      _map(argument, (arg) => {
        const { type, target, value } = arg;

        if (type === 'asset') {
          if (target === 'javascript') {
            manifestObject.core.javascript = value.toString();
          } else if (target === 'stylesheet') {
            manifestObject.core.stylesheet = value.toString();
          }
        } else if (type === 'external-asset') {
          manifestObject = _assign({}, manifestObject, {
            external: {
              core: [
                ...manifestObject.external.core,
                { type: target, src: value }
              ]
            }
          });

          Log(Log.ASSET, `Adding "${value}" (${target})`);
        } else if (type === 'typography') {
          manifestObject.design.typography.size[target] = value;

          Log(Log.CSS, `Set ${target} value to "${value}".`);
        } else if (type === 'color') {
          manifestObject.design.colors[target] = value;

          Log(Log.CSS, `Set ${target} value to "${value}".`);
        } else if (type === 'block') {
          let blockCategory = _findIndex(manifestObject.blocks, ['type', target]);

          if (blockCategory === -1) {
            manifestObject = _assign({}, manifestObject, {
              blocks: [
                ...manifestObject.blocks,
                { type: target, items: [] }
              ]
            });

            blockCategory = _findIndex(manifestObject.blocks, ['type', target]);
          }

          manifestObject.blocks[blockCategory] = _assign({}, manifestObject.blocks[blockCategory], {
            items: [
              ...manifestObject.blocks[blockCategory].items,
              value
            ]
          });

          Log(Log.HTML, `Adding "${value.title}" (${target})`);
        } else if (type === 'config') {
          manifestObject[target] = value;
        }
      });
    }
  }

  return manifestObject;
}

function getTemplateName (templateName) {
  return [{
    type: 'config',
    target: 'name',
    value: templateName
  }];
}

function getTemplateversion (templateVersion) {
  let result = [];

  if (!templateVersion) {
    const currentDir = getCurrentDirectory();
    const filePath = path.join(currentDir, 'package.json');

    // Try to get package file.
    if (fs.exists(filePath) === 'file') {
      try {
        const pckg = fs.read(filePath, 'json');

        result.push({
          type: 'config',
          target: 'version',
          value: pckg.version
        });
      } catch (e) {
        throw e;
      }
    }
  } else {
    result.push({
      type: 'config',
      target: 'version',
      value: templateVersion
    });
  }

  return result;
}

function createManifest (configuration) {
  const { name, version, files, output, createThumbnails } = configuration;
  const {
    html: htmlFilePath,
    stylesheet: stylesheetFilePath,
    javascript: javascriptFilePath
  } = files;
  const { dir: outputDir, name: outputFilename } = output;
  const currentDir = getCurrentDirectory();
  const buildDir = path.join(currentDir, path.normalize(outputDir));
  const bareManifestObject = generatedData(globals.manifest);

  const styles = getStyling(stylesheetFilePath, bareManifestObject);
  const javascript = getJavascript(javascriptFilePath);
  const misc = [
    ...getTemplateName(name),
    ...getTemplateversion(version)
  ];

  parseHTML(htmlFilePath, buildDir, function (HTML) {
    const manifest = formatManifest(bareManifestObject, styles, javascript, HTML, misc);
    createPackage(manifest, buildDir, outputFilename);
  });
}

function main () {
  const userConfiguration = getConfigurationFile();
  const configuration = parseConfiguration(userConfiguration);

  createManifest(configuration);
}

module.exports = main;
