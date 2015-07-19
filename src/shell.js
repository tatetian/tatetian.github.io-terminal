function Shell() {
}

Shell.prototype.run = function(cmd) {
    return cmd + '\n';
};

module.exports = Shell;
