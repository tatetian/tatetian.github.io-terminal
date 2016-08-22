/*
 * A read-only file system, which supports only one command--- `ls`.
 **/

var INode = function(name) {
    this.name = name;
    this.parent = null;
};

INode.prototype.toPath = function(showPathRelativeToHome) {
    if (showPathRelativeToHome && this.isHome()) return '~/';

    var path = '';
    if (!this.isRoot() && this.parent)
        path += this.parent.toPath(showPathRelativeToHome);
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

INode.prototype.isHome = function() {
    return !!this._isHome;
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

INode.prototype.url = function() {
    return this._url ? this._url : '';
};

INode.loadFromJson = function(json){
    var inode = new INode(json.name);
    // root node has empty name
    if (json.name === "") {
        inode.parent = inode;
    }
    inode._denyAccess = !!json.denyAccess;
    inode._url = json.url;

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
        path = '/home/tatetian' + path.slice(1);
    }
    // convert a relative path to an absolute path
    if (path[0] !== '/') {
        path = cwdNode.toPath() + path;
    }

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
    "home": true,
    "nodes": [
        {
            "name": "README",
            "url": "/README"
        },
        {
            "name": "index",
            "url": "/"
        },
        {
            "name": "projects",
            "url": "/projects"
        },
        {
            "name": "posts",
            "nodes": [
                {
                    "name": "2016-01-25 File IO Inside Intel SGX Enclave",
                    "url": "/2016/01/25/file-io-inside-intel-sgx-enclave"
                },
                {
                    "name": "2015-06-15 SSH Essentials in Three Steps",
                    "url": "/2015/06/15/ssh-essentials-in-three-steps"
                },
                {
                    "name": "2015-01-30 A* Algorithm Saves Me 1 Dollar Per Day",
                    "url": "/2015/01/30/a-star-algorithm-saves-me-1-dollar-per-day"
                },
                {
                    "name": "2015-01-15 Why Should I (or Any Tech Telant) Start Blogging",
                    "url": "/2015/01/15/why-should-i-or-any-tech-telant-start-blogging"
                }
            ]
        }
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
var homeNode = getINodeByPath('/home/tatetian');
homeNode._isHome = true;
var cwdNode = homeNode;
// set /home/tatetian as home directory of the user, i.e. '~'

var fs = {};

fs.ls = function(dir) {
    if (!dir) dir = '.';

    var inode = getINodeByPath(dir);
    if (!inode) return {err: 'No such file or directory'};
    if (!inode.isAccessible()) return {err: 'Permission denied'};

    return {
        res: inode.isDirectory() ? inode.children : [inode]
    };
};

fs.cd = function(dir) {
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

fs.getINodeByPath = getINodeByPath;

fs.getINodesByPrefix = function(partialPath) {
    if (!partialPath || partialPath === '') return null;
    var pathParts = partialPath.split('/');

    var dirNode, skipFirst;
    switch(pathParts[0]) {
    case '~': dirNode = homeNode; skipFirst = true; break;
    case '': dirNode = rootNode; skipFirst = true; break;
    default: dirNode = cwdNode; skipFirst = false;
    }

    var resNodes = [];

    var numParts = pathParts.length;
    for (var pi = skipFirst ? 1 : 0; pi < numParts; pi++) {
        var partName = pathParts[pi];

        if (partName === '') {
            if (!dirNode.isDirectory()) // invalid path
                return null;

            // For commands like `ls posts/`, we want to return all files in
            // the directory. So we should go on iterating the child nodes
            // of `dirNode` if this is the last part.
            if (pi !== numParts - 1) continue;
        }

        if (partName === '.') {
            if (!dirNode.isDirectory()) // invalid path
                return null;
            continue;
        }

        if (partName === '..') {
            dirNode = dirNode.parent;
            continue;
        }

        var children = dirNode.children;
        if (!children) return null;
        var numChildren = children.length;
        for (var ci = 0; ci < numChildren; ci++) {
            var node = children[ci];
            // found the next node
            if (pi !== numParts - 1 && partName === node.name) {
                dirNode = node;
                break;
            }
            // found the last node which only partically match
            else if (pi === numParts - 1 && node.name.indexOf(partName) === 0) {
                resNodes.push(node.name + (node.isDirectory() ? '/' : ''));
            }
        }

        // the path is not valid
        if (pi !== numParts - 1 && ci === numChildren) return null;
    }
    console.dir(resNodes);
    return resNodes;
};

module.exports = fs;
