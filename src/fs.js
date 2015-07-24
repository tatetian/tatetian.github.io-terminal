/*
 * A read-only file system, which supports only one command--- `ls`.
 **/

var INode = function(name) {
    this.name = name;
    this.parent = null;
};

INode.prototype.toPath = function() {
    var path = '';
    if (!this.isRoot() && this.parent) path += this.parent.toPath();
    path += this.name;
    if (this.isDirectory()) path += '/';
    return path;
};

INode.prototype.addChild = function(child) {
    if (!this.children) this.children = [];
    child.parent = this;
    this.children.push(child);
};

INode.prototype.isRoot = function() {
    return this === this.parent;
};

INode.prototype.isDirectory = function() {
    return !!this.children;
};

INode.prototype.isAccessible = function() {
    return !this._denyAccess;
};

INode.prototype.displayName = function() {
    return this.name + (this.isDirectory() ? '/' : '');
};

INode.loadFromJson = function(json){
    var inode = new INode(json.name);
    // root node has empty name
    if (json.name === "") {
        inode.parent = inode;
    }
    inode._denyAccess = !!json.denyAccess;

    var children = json.nodes;
    if (!children) return inode;

    var numNodes = json.nodes.length;
    for (var ni = 0; ni < numNodes; ni++) {
        var childNode = INode.loadFromJson(json.nodes[ni]);
        inode.addChild(childNode);
    }
    return inode;
};

function getINodeByPath(path) {
    if (!path || path === '') return null;

    // convert a path relative to home to an absolute path
    if (path[0] === '~') {
        // FIXME: hard-code home directory
        path = '/home/tian' + path.slice(1);
    }
    // convert a relative path to an absolute path
    if (path[0] !== '/') {
        path = cwdNode.toPath() + path;
    }
    console.log('converted path = ' + path);

    var pathParts = path.split('/');

    var resNode = rootNode;
    for (var pi = 1; pi < pathParts.length; pi++) {
        var partName = pathParts[pi];

        if (partName === '' || partName === '.') {
            if (!resNode.isDirectory()) return null;
            else continue;
        }

        if (partName === '..') {
            resNode = resNode.parent;
            continue;
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

// TODO: read the JSON from a separate file; can browserify support readFileSync?
var homeJson = {
    "name": "tatetian",
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
var nodesJson = {
    "name": "", //root
    "nodes": [
        {
            "name": "home",
            "nodes": [
                homeJson
            ],
            "denyAccess": true
        }
    ],
    "denyAccess": true
};

// var rootNode = INode.loadFromJson(JSON.parse(
                    // require("fs").readFileSync(__dirname + '/fs.json', 'utf8')));
var rootNode = INode.loadFromJson(nodesJson);
var cwdNode = getINodeByPath('/home/tatetian');


var fs = {};

fs.ls = function(dir) {
    console.log('ls ' + dir);
    if (!dir) dir = '.';

    var inode = getINodeByPath(dir);
    if (!inode) return {err: 'No such file or directory'};
    if (!inode.isAccessible()) return {err: 'Permission denied'};

    return {
        res: inode.isDirectory() ? inode.children : [inode]
    };
};

fs.cd = function(dir) {
    console.log('cd ' + dir);
    if (!dir) dir = '~';

    var inode = getINodeByPath(dir);
    if (!inode) return {err: 'No such file or directory'};
    if (!inode.isDirectory()) return {err: 'Not a directory'};
    if (!inode.isAccessible()) return {err: 'Permission denied'};

    cwdNode = inode;
    return {res: cwdNode};
};

fs.cwd = function() {
    return {res: cwdNode};
};

module.exports = fs;
