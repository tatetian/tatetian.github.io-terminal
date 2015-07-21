var Term = require('term.js');
var TermKeyboard = require('./src/term-keyboard.js');
var TermStyle = require('./src/term-style.js');
var Shell = require('./src/shell.js');
var readline = require('./lib/readline.js');
var fs = require('./src/fs.js');

var Terminal = function(parentEl, options) {
    var term = this._term = new Term(options);
    term.open(parentEl);
    var kb = new TermKeyboard(term);
    var cp = null;
    var rl = this._rl = readline.createInterface(kb, term, cp, true);

    if (options.welcome)
        term.write(options.welcome);
    this.prompt();

    this._shell = new Shell();

    var self = this;
    rl.on('line', function(cmd) {
        self.run(cmd);
    });
};

Terminal.prototype.prompt = function() {
    var cwd = fs.cwd().res;
    // remove the last '/'
    cwd = cwd.slice(0, cwd.length - 1);

    var prompt = 'tatetian:' + cwd + '$ ';
    var coloredPrompt = TermStyle.red(prompt);
    this._rl.setPrompt(coloredPrompt, prompt.length);
    this._rl.prompt();
};

Terminal.prototype.resize = function(width, height) {
    this._term.resize(width, height);
};

Terminal.prototype.run = function(cmd) {
    var output = this._shell.run(line);
    this._term.write(output);
    this.prompt();
};

module.exports = Terminal;
