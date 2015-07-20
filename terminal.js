var Term = require('term.js');
var TermKeyboard = require('./src/term-keyboard.js');
var TermStyle = require('./src/term-style.js');
var Shell = require('./src/shell.js');
var readline = require('./lib/readline.js');
var fs = require('./src/fs.js');

var Terminal = function(parentEl, options) {
    var term = new Term(options);
    term.open(parentEl);
    var kb = new TermKeyboard(term);
    var cp = null;
    var rl = this._rl = readline.createInterface(kb, term, cp, true);

    this.prompt();

    var self = this;
    var shell = new Shell();
    rl.on('line', function(line) {
        var output = shell.run(line);
        term.write(output);
        self.prompt();
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

module.exports = Terminal;
