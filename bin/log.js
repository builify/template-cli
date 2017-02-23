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

    case Log.PICTURE:
      console.log(chalk.bgWhite(chalk.black(`PICTURE: ${message}`)));
      break;

    default:
      break;
  }
}

Log.CSS = 'logger@css';
Log.ASSET = 'logger@asset';
Log.HTML = 'logger@html';
Log.INFO = 'logger@info';
Log.PICTURE = 'logger@picture';

module.exports = Log;
