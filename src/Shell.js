/*
 * A very simple shell that can only handle a few built-in commands:
 *  `ls [file]`    -- list directory content
 *  `cd [dir]`     -- change current working directory
 *  `open [file]`  -- open a file
 *  `help`         -- show this list
 * */
var util = require('util');
var fs = require('./fs.js');
var readline = require('./nodejs/readline.js');
var termstyle = require('./termstyle.js');

function Shell(term, options) {
    this._term = term;
    this._options = options || {};
    this._options.welcomeMsg = this._options.welcomeMsg || '';
    this._options.promptTemplate = this._options.promptTemplate || 'shell:%s> ';
    this._options.urlMeta = this._options.urlMeta || null;

    var completer = null;
    var rl = this._rl = readline.createInterface(term.keyboard,
                                                 term.output,
                                                 completer,
                                                 true);

    var self = this;
    rl.on('line', function(cmd) {
        self._realRun(cmd);
    });

    // Initial output
    this._welcome();
    this._prompt();
}

Shell.prototype.run = function(cmd) {
    this._writeLn(cmd);
    this._realRun(cmd);
};

Shell.prototype._realRun = function(cmd) {
    var args = cmd.trim().split(' ');
    var cmdName = args[0];
    args = args.slice(1);
    switch(cmdName) {
    case 'cd': this._cd(args); break;
    case 'help': this._help(args); break;
    case 'ls':  this._ls(args); break;
    case 'open':  this._open(args); break;
    case 'welcome':  this._welcome(args); break;
    case '':  break;
    default:
        this._writeLn('-bash: ' + cmdName + ': command not found');
    }
    this._prompt();
};

Shell.prototype._writeLn = function(data, urlMeta) {
    var line = data + '\r\n';
    if (!urlMeta)
        this._term.write(line);
    else
        this._term.writeLink(line, urlMeta);
};

Shell.prototype._prompt = function() {
    var cwdNode = fs.cwd().res;
    var cwdPath = cwdNode.toPath();
    // remove the last '/'
    cwdPath = cwdPath.slice(0, cwdPath.length - 1);

    var prompt = util.format(this._options.promptTemplate, cwdPath);
    var coloredPrompt = termstyle.red(prompt);
    this._rl.setPrompt(coloredPrompt, prompt.length);
    this._rl.prompt();
};

Shell.prototype._ls = function(args) {
    var ret = fs.ls(args[0]);
    if (ret.err) {
        this._writeLn('ls: ' + args[0] + ': ' + ret.err);
        return;
    }

    var inodes = ret.res;
    for (var i = 0; i < inodes.length; i++) {
        this._writeLn(inodes[i].displayName(), {
            "href": "#"
        });
    }
};

Shell.prototype._cd = function(args) {
    var ret = fs.cd(args[0]);
    if (!ret.err) return;

    this._writeLn('cd: ' + args[0] + ': ' + ret.err);
};

Shell.prototype._open = function(args) {
};

Shell.prototype._welcome = function() {
    if (this._options.welcomeMsg)
        this._writeLn(this._options.welcomeMsg);
};

Shell.prototype._help = function(args) {
   var helpInfo =
        'Available commands are listed below:\r\n' +
        '    `cd [dir]`     -- change current working directory\r\n' +
        '    `help`         -- show this list\r\n' +
        '    `ls [file]`    -- list directory content\r\n' +
        '    `open [file]`  -- open a file\r\n' +
        '    `welcome`      -- show the welcome message';
   this._writeLn(helpInfo);
};

module.exports = Shell;
