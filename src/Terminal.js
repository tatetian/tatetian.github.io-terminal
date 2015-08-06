var EE = require('events').EventEmitter;
var util = require('util');
var RealTerminal = require('term-with-url-support.js');
var TermKeyboard = require('./TermKeyboard.js');

/*
 * This is a wrapper on term.js
 *  parentEl - a DOM element where terminal element will be appended as a child
 *  handler - handle input command
 *  completer - do auto complete
 *  options - options for terminal
 * */
var Terminal = function(parentEl, options) {
    EE.call(this);

    var term = this.output = this._term = new RealTerminal(options);
    var kb = this.keyboard = new TermKeyboard(term);
    term.open(parentEl);
    // readline expects its ouput has an attribute `columns`
    term.columns = term.cols;
};
util.inherits(Terminal, EE);

// readline.js expect a columns() interface
Terminal.prototype.__defineGetter__('columns', function() {
    return this._term.cols;
});

Terminal.prototype.resize = function(cols, rows) {
    this._term.resize(cols, rows);
    // keep `columns` update to date
    this._term.columns = this._term.cols;
    // readline.js needs to know when output resizes
    this.emit('resize');
};

Terminal.prototype.write = function(data) {
    this._term.write(data);
};

Terminal.prototype.writeLink = function(data, urlMeta) {
    this._term.writeLink(data, urlMeta);
};

module.exports = Terminal;
