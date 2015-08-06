/*
 * A very simple shell that can only handle a few built-in commands:
 *  `ls [file]`    -- list directory content
 *  `cd [dir]`     -- change current working directory
 *  `open [file]`  -- open a file
 *  `help`         -- show this list
 * */
var EE = require('events').EventEmitter;
var util = require('util');
var fs = require('./fs.js');
var readline = require('./nodejs/readline.js');
var termstyle = require('./termstyle.js');
var extend = require('extend');

function Shell(term, options) {
    EE.call(this);

    this._term = term;
    this._options = options || {};
    this._options.welcomeMsg = this._options.welcomeMsg || '';
    this._options.promptTemplate = this._options.promptTemplate || 'shell:%s> ';

    var self = this;

    // handle URLs in terminal
    this._options.urlMeta = extend({}, {
                               href: '#',
                               onclick: 'return __ShellUrlOnClick(event);'
                           }, this._options.urlMeta);
    global.__ShellUrlOnClick = function(e) {
        // prevent the default behaviour of browser when clicking <a> tag
        e.preventDefault();
        var atag = (e.target) ? e.target : e.srcElement;
        var url = atag.dataset.url;
        if (url) {
            self.emit('loadurl', url);
        }
        else {
            var path = atag.dataset.path;
            self.run('cd ' + path + ' && ls');
        }
        return false;
    };

    var completer = function(line) {
        return self._complete(line);
    };
    var rl = this._rl = readline.createInterface(term.keyboard,
                                                 term.output,
                                                 completer,
                                                 true);

    rl.on('line', function(cmd) {
        self._realRun(cmd);
    });
}
util.inherits(Shell, EE);

Shell.prototype.init = function(cmd) {
    this._welcome();
    this._prompt();
};

Shell.prototype.run = function(cmdLine) {
    this._writeLn(cmdLine);
    this._realRun(cmdLine);
};

Shell.prototype._realRun = function(cmdLine) {
    // parse command like `cd posts && ls`
    // we assume `&&` can not be part of a file path or arguments
    var subCmds = cmdLine.split('&&');
    for (var ci = 0; ci < subCmds.length; ci++) {
        this._realRunOne(subCmds[ci]);
    }
    this._prompt();
};

Shell.prototype._realRunOne = function(cmd) {
    var args = this._cmdTokenize(cmd);
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
};

/**
 * Give hints to incomplete command
 *
 * Desirable behavior by examples:
 * 1)
 *  $ l<tab>
 *  ==>
 *  $ ls <cursor>                 // insert an extra whitespace automatically
 *
 * 2)
 *  $ ls post<tab>
 *  ==>
 *  $ ls posts/<cursor>
 *
 * 3)
 *  $ ls i<tab>
 *  ==>
 *  $ ls index.html<cursor>       // as we don't have multi-argument command
 *                                // there is no point in automatically inserting
 *                                // an extra whitespace at the end
 *
 * 4)
 *  $ non-existing-command<tab>
 *  ==>
 *  $ non-existing-command<cursor>
 *
 *
 * 5)
 *  $ ls ma<tab>
 *  match1  match2  match3
 *  $ ls ma<tab>
 *
 * The return values of this function are as readline module of Node.js expects.
 **/
Shell.prototype._complete = function(cmdLine) {
    var subCmds = cmdLine.split('&&');
    var lastCmd = subCmds[subCmds.length - 1];
    var tokens = this._cmdTokenize(lastCmd);

    // A trailing whitespace means shows current directory
    // e.g. ls <tab>
    if (tokens.length > 0 && cmdLine.endsWith(' ') && !cmdLine.endsWith('\\ ')) {
        var cwdNode = fs.cwd().res;
        var allSubFiles = cwdNode.children.map(function(inode) {
            return inode.displayName();
        });
        return [allSubFiles, ''];
    }

    // Are we autocompleting a command or a file path?
    // The first token should be command name, the rest are file paths.
    var isCmd = tokens.length <= 1;

    var res;
    if (isCmd) {
        var incompleteCmd = tokens[0] || '';
        var allCmds = ['cd', 'help', 'ls', 'open', 'welcome'];
        var possibleCmds = allCmds.filter(function(cmd) {
            // prefix match
            return cmd.indexOf(incompleteCmd) === 0;
        });
        // insert an whitespace at the end
        if (possibleCmds.length === 1)
            possibleCmds[0] = possibleCmds[0] + ' ';

        res = [possibleCmds, incompleteCmd];
    }
    else {
        var incompletePath = tokens[tokens.length - 1];
        var possiblePaths = fs.getINodesByPrefix(incompletePath);

        // no matches
        if (!possiblePaths || possiblePaths.length === 0)
            return [null, null];

        // for a single match, we have to escape its whitespace
        if (possiblePaths.length === 1) {
            possiblePaths[0] = possiblePaths[0].replace(/ /g, '\\ ');
        }

        var pathTail = '';
        if (possiblePaths.length > 0) {
            var lastSeperatorPos = incompletePath.lastIndexOf('/');
            if (lastSeperatorPos < 0)
                pathTail = incompletePath;
            else {
                pathTail = incompletePath.slice(lastSeperatorPos + 1);
            }
        }
        pathTail = pathTail.replace(/ /g, '\\ ');
        res = [possiblePaths, pathTail];
    }
    console.log(res[0] + ':' + res[1]);
    return res;
};

// Handle escaped whitespace properly
//  e.g. `  ls  file\ name\ with\ space  ` --> ['ls', 'file name with space']
Shell.prototype._cmdTokenize = function(cmd) {
    var res = [];
    var begin = 0, end = 0, len = cmd.length;
    while (begin < len) {
        // skip util the first non-whitespace character
        while (begin < len && cmd[begin] === ' ') begin++;
        if (begin === len) break;

        // next util the first non-escaped whitespace
        end = begin + 1;
        while (end < len && (cmd[end] !== ' ' || cmd[end - 1] === '\\')) end++;

        var tokenWithEscapedWhiteSpace = cmd.substring(begin, end);
        var token = tokenWithEscapedWhiteSpace.replace(/\\ /g, ' ');
        console.debug(tokenWithEscapedWhiteSpace + '|' + token);
        res.push(token);

        // search the next token from
        begin = end;
    }
    return res;
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
        var inode = inodes[i];
        var urlMeta = extend({
            "data-url": inode.url(),
            "data-path": inode.toPath(true),    // relative to home `~`
        }, this._options.urlMeta);
        this._writeLn(inode.displayName(), urlMeta);
    }
};

Shell.prototype._cd = function(args) {
    var ret = fs.cd(args[0]);
    if (!ret.err) return;

    this._writeLn('cd: ' + args[0] + ': ' + ret.err);
};

Shell.prototype._open = function(args) {
    if (args.length === 0) {
        this._writeLn('Usage: open <path>');
        return;
    }

    var path = args[0];
    var inode = fs.getINodeByPath(path);
    if (!inode) {
        this._writeLn('open: ' + path + ': No such file or directory');
        return;
    }
    if (!inode.isAccessible()) {
        this._writeLn('open: ' + path +  ': Permission denied');
        return;
    }

    if (inode.isDirectory()) {
        this._cd([path]);
        this._ls([]);
    }
    else {
        this.emit('loadurl', inode.url());
    }
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
