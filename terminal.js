var Term = require('term.js');
var TermKeyboard = require('./src/term-keyboard.js');
var TermStyle = require('./src/term-style.js');
var Shell = require('./src/shell.js');
var readline = require('./lib/readline.js');

var Terminal = function(parentEl, options) {
    var term = new Term(options);
    term.open(parentEl);
    var kb = new TermKeyboard(term);
    var cp = null;
    var rl = this._rl = readline.createInterface(kb, term, cp, true);

    var pwd = '~';
    this.setDir(pwd);
    rl.prompt();
    var shell = new Shell(pwd);
    rl.on('line', function(line) {
        var output = shell.run(line);
        term.write(output);
        rl.prompt();
    });
};

Terminal.prototype.setDir = function(dir) {
    this._dir = dir;
    var prompt = 'tatetian:' + dir + '$ ';
    var coloredPrompt = TermStyle.red(prompt);
    this._rl.setPrompt(coloredPrompt, prompt.length);
};

module.exports = Terminal;
