/*
 * A very simple shell that can only handle a few built-in commands:
 *  `ls [file]`    -- list directory content
 *  `cd [dir]`     -- change current working directory
 *  `open [file]`  -- open a file
 *  `help`         -- show this list
 * */
var fs = require('./fs.js');

function Shell() {
}

Shell.prototype.run = function(cmd) {
    var args = cmd.trim().split(' ');
    var cmdName = args[0];
    args = args.slice(1);
    switch(cmdName) {
    case 'ls': return this._ls(args);
    case 'cd': return this._cd(args);
    case 'open': return this._open(args);
    case 'help': return this._help(args);
    }
    return '-bash: ' + cmdName + ': command not found\n';
};

function map(array, fn) {
    var res = [];
    var ln = array.length;
    for (var i = 0 ; i < ln; i++)
        res.push(fn(array[i], i, array));
    return res;
}

Shell.prototype._ls = function(args) {
    var ret = fs.ls(args[0]);
    if (ret.err)
        return 'ls: ' + args[0] + ': ' + ret.err + '\r\n';

    return ret.res.join('\r\n') + '\r\n';
};

Shell.prototype._cd = function(args) {
    var ret = fs.cwd(args[0]);
    if (ret.err)
        return 'cd: ' + args[0] + ': ' + ret.err + '\r\n';
    return '';
};

Shell.prototype._open = function(args) {
};

Shell.prototype._help = function(args) {
    var helpInfo =
        'Available commands are listed below:\r\n' +
        '    `ls [file]`    -- list directory content\r\n' +
        '    `cd [dir]`     -- change current working directory\r\n' +
        '    `open [file]`  -- open a file\r\n' +
        '    `help`         -- show this list\r\n';
   return helpInfo;
};

module.exports = Shell;
