var EE = require('events').EventEmitter;
var util = require('util');

/* Key event adapter for term.js
    Send keydown and keypress events captured by term.js to readline in a
    proper format.
*/
var TermKeyboard = function(term) {
    EE.call(this);

    this._buf = [];
    this._paused = true;

    var self = this;
    // keydown is keyboard event for non-printable keys
    term.on('keydown', function(ev) {
        var key = {
            ctrlKey: ev.ctrlKey,
            altKey: ev.altKey,
            shiftKey: ev.shiftKey,
            metaKey: ev.metaKey
        };

        var name;
        switch(ev.keyCode) {
        case 8: name = 'backspace'; break;
        case 9: name = 'tab'; break;
        case 13: name = 'enter'; break;
        case 37: name = 'left'; break;
        case 38: name = 'up'; break;
        case 39: name = 'right'; break;
        case 40: name = 'down'; break;
        }
        if (!name) return;
        key.name = name;

        self.press(null, key);
    });
    // keypress is keyboard event for printable keys
    term.on('keypress', function(key, ev) {
        if (!key || ev.ctrlKey || ev.altKey || ev.metaKey) return;
        self.press(key, null);
    });
};
util.inherits(TermKeyboard, EE);

TermKeyboard.prototype.press = function(s, k) {
    if (this._paused)
        this._buf.push({s:s, k:k});
    else
        this.emit('keypress', s, k);
};

TermKeyboard.prototype.pause = function() {
    this._paused = true;
};

TermKeyboard.prototype.resume = function() {
    this._paused = false;
    for (var bi in this._buf) {
        var sk = this._buf[bi];
        this.emit('keypress', sk.s, sk.k);
    }
    this._buf = [];
};

module.exports = TermKeyboard;
