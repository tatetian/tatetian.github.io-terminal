/*
 * A read-only file system, which supports only one command--- `ls`.
 **/

var INode = function(name) {
    this.name = name;
    this.parent = null;
};

INode.prototype.toPath = function() {
    var path = '';
    if (this.parent) path += this.parent.toPath();
    path += this.name;
    if (this.isDirectory()) path += '/';
    return path;
};

INode.prototype.addChild = function(child) {
    if (!this.children) this.children = [];
    child.parent = this;
    this.children.push(child);
};

INode.prototype.isDirectory = function() {
    return !!this.children;
};

INode.loadFromJson = function(json){
    var inode = new INode(json.name);

    var children = json.nodes;
    if (!children) return inode;

    var numNodes = json.nodes.length;
    for (var ni = 0; ni < numNodes; ni++) {
        var childNode = INode.loadFromJson(json.nodes[ni]);
        inode.addChild(childNode);
    }
    return inode;
};

// TODO: read the JSON from a separate file; can browserify support readFileSync?
var nodesJson = {
    "name": "~",
    "nodes": [
        {
            "name": "posts",
            "nodes": [
                {"name": "2015-01-05-why"},
                {"name": "2015-07-05-ssh"}
            ]
        },
        {
            "name": "projects",
            "nodes": [
                {"name": "pseudocode.js"},
                {"name": "PaperClub"}
            ]
        },
        {"name": "index.html"},
        {"name": "about.html"}
    ]
};

// var rootNode = INode.loadFromJson(JSON.parse(
                    // require("fs").readFileSync(__dirname + '/fs.json', 'utf8')));
var rootNode = INode.loadFromJson(nodesJson);
var cwdNode = rootNode;

function getINodeByPath(path) {
    path = path.trim();
    if (!path || path === '') return null;

    // only accept relative paths or absolute paths begin with '~'
    var pathParts = path.split('/');
    // absolute path doesn't make sense for our purpose
    if (pathParts[0] === '')
        return null;

    // if not start with '~', then the path is relative to cwd
    var resNode = pathParts[0] !== '~' ? cwdNode : rootNode;
    for (var pi = (pathParts[0] !== '~' ? 0 : 1);
            pi < pathParts.length; pi++) {
        var partName = pathParts[pi];

        if (partName === '' || partName === '.') {
            if (!resNode.isDirectory()) return null;
            else continue;
        }

        if (partName === '..') {
            resNode = resNode.parent;
            if (resNode === null) return null;
            else continue;
        }

        var children = resNode.children;
        if (!children) return null;
        var numChildren = children.length;
        for (var ci = 0; ci < numChildren; ci++) {
            var node = children[ci];
            // found a node that matches
            if (partName === node.name) {
                resNode = node;
                break;
            }
        }

        // no matched node found
        if (ci === numChildren) return null;
    }
    return resNode;
}

var fs = {};

fs.ls = function(dir) {
    if (!dir || dir.trim() === '') dir = '.';

    var inode = getINodeByPath(dir);
    if (!inode) return {err: 'No such file or directory'};

    var list = [];
    if (!inode.isDirectory())
        list.push(inode.name);
    else {
        var nodes = inode.children;
        var numNodes = nodes.length;
        for (var ni = 0; ni < numNodes; ni++)
            list.push(nodes[ni].name);
    }
    return {res: list};
};

var cwdNode = rootNode;
fs.cwd = function(dir) {
    if (dir) {
        var inode = getINodeByPath(dir);
        if (!inode) return {err: 'No such file or directory'};
        if (!inode.isDirectory()) return {err: 'Not a directory'};

        cwdNode = inode;
    }
    return {res: cwdNode.toPath()};
};

module.exports = fs;
