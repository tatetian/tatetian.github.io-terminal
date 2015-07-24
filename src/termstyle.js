// terminal string styling
var chalk = require('chalk');
// chalk is disabled by default in browsers as color is supposed to be not
// supported. Thus, we have to manually enable color by creating an new
// instance of chalk.
var TermStyle = new chalk.constructor({enabled: true});

module.exports = TermStyle;
