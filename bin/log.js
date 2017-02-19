const chalk = require('chalk');

function Log (type, message) {
  switch (type) {
    case Log.HTML:
      console.log(chalk.bgYellow(chalk.black(`HTML: ${message}`)));
      break;

    case Log.ASSET:
      console.log(chalk.bgBlue(chalk.white(`ASSET: ${message}`)));
      break;

    case Log.CSS:
      console.log(chalk.bgMagenta(chalk.white(`CSS: ${message}`)));
      break;

    case Log.INFO:
      console.log(chalk.bgCyan(chalk.white(`INFO: ${message}`)));
      break;

    default:
      break;
  }
}

Log.CSS = 'css';
Log.ASSET = 'asset';
Log.HTML = 'html';
Log.INFO = 'info';

module.exports = Log;
