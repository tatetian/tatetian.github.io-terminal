var EE = require('events').EventEmitter;
var util = require('util');
var RealTerminal = require('../lib/xterm.js/src/xterm.js');
var TermFitter = require('../lib/xterm.js/addons/fit/fit.js');
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

    var term = this._term = this.output = new RealTerminal(options);
    var kb = this.keyboard = new TermKeyboard(term);
    term.open(parentEl);
    term.fit();
    // readline expects its ouput has an attribute `columns`
    term.columns = term.cols;

    window.addEventListener("resize", (function() {
        var geometry = term.proposeGeometry(),
            cols = geometry.cols,
            rows = geometry.rows;
        term.resize(cols, rows);
    }));
};
util.inherits(Terminal, EE);

// readline.js expect a columns() interface
Terminal.prototype.__defineGetter__('columns', function() {
    return this._term.cols;
});

/*
Terminal.prototype.resize = function(cols, rows) {
    this._term.resize(cols, rows);
    // keep `columns` update to date
    this._term.columns = this._term.cols;
    // readline.js needs to know when output resizes
    this.emit('resize');
};
*/

Terminal.prototype.write = function(data) {
    this._term.write(data);
};

Terminal.prototype.writeWithinTag = function(text, tag) {
    this._term.writeWithinTag(text, tag);
};

module.exports = Terminal;
