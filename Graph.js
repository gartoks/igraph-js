function Graph() {

    var nodes  = [],
        edges  = [],
        bounds = {};

    this.setData = function (n, e) {
        nodes = n;
        edges = e;
        this.assignColorsAndSizes();
        this.computeBounds();
    };

    this.update = function (time) {
        // Update
        var needUpdate = false;
        for (var i = nodes.length - 1; i >= 0; i--) {
            needUpdate = nodes[i].update(time) || needUpdate;
        }
        return needUpdate;
    };

    this.drawNodes = function (gc, viewport) {
        // Draw all nodes
        nodes.forEach(function (n) {
            n.draw(gc, viewport);
        });
    };

    this.drawEdges = function (gc, viewport) {
        // Draw edges
        edges.forEach(function (e) {
            e.draw(gc, viewport);
        });
    };

    this.drawSelectedEdges = function (gc, viewport, x, y, radius) {

        var sel = [];
        var p   = viewport.viewToWorldCoords(x, y);
        var wx  = p.x, wy = p.y, wr = radius * viewport.viewToWorldRatio();
        var dx, dy, dsq;
        var nr;

        for (var i = edges.length - 1; i >= 0; i--) {
            // Test src node
            p  = edges[i].src.getPosition();
            nr = edges[i].src.radius * viewport.viewToWorldRatio();
            dx = p.x - wx;
            dy = p.y - wy;
            dsq = dx * dx + dy * dy;
            if (dsq <= (wr + nr) * (wr + nr)) {
                sel.push(edges[i]);
                continue;
            }

            // Test dst node
            p = edges[i].dst.getPosition();
            nr = edges[i].dst.radius * viewport.viewToWorldRatio();
            dx = p.x - wx;
            dy = p.y - wy;
            dsq = dx * dx + dy * dy;
            if (dsq <= (wr + nr) * (wr + nr)) {
                sel.push(edges[i]);
            }
        }

        // Draw selected edges
        sel.forEach(function (e) {
            e.draw(gc, viewport);
        });
    };

    this.pick = function (x, y, viewport) {
        for (var i = nodes.length - 1; i >= 0; i--) {
            if (nodes[i].pick(x, y, viewport)) return nodes[i];
        }
        return null;
    };

    this.assignColorsAndSizes = function () {
        var maxDeg = 0;
        nodes.forEach(function (n) {
            n.deg = 0;
            edges.forEach(function (e) {
                if (e.src == n || e.dst == n) {
                    n.deg++;
                }
            });

            if (n.deg > maxDeg) maxDeg = n.deg;
        });

        nodes.forEach(function (n) {
            var t = n.deg / maxDeg;
            var colIndex = Math.round(t * (Constants.NODE_COLORS.length - 1));
            n.color = Constants.NODE_COLORS[colIndex];

            var minArea = Constants.MIN_DIAMETER * Constants.MIN_DIAMETER * Math.PI / 4;
            var maxArea = Constants.MAX_DIAMETER * Constants.MAX_DIAMETER * Math.PI / 4;
            var area = minArea * (1 - t) + maxArea * t;

            n.radius = Math.sqrt(area / Math.PI);
        });

        // Sort for small nodes front and large nodes back rendering
        nodes.sort(function (a, b) {
            return b.radius - a.radius;
        });
    };

    this.computeBounds = function () {
        var p = nodes[0].getPosition();
        bounds.x = p.x;
        bounds.y = p.y;
        bounds.w = p.x;
        bounds.h = p.y;
        nodes.forEach(function (n) {
            var p = n.getPosition();
            var minx = p.x;
            var miny = p.y;
            var maxx = p.x;
            var maxy = p.y;
            if (minx < bounds.x) bounds.x = minx;
            if (miny < bounds.y) bounds.y = miny;
            if (maxx > bounds.w) bounds.w = maxx;
            if (maxy > bounds.h) bounds.h = maxy;
        });

        bounds.w = bounds.w - bounds.x; // Convert minx and maxx to width
        bounds.h = bounds.h - bounds.y; // Convert miny and maxy to height
        if (bounds.w == 0) bounds.w = 1;
        if (bounds.h == 0) bounds.h = 1;
    };

    this.getEdges = function () {
        return edges;
    };

    this.getNodes = function () {
        return nodes;
    };

    this.getBounds = function () {
        return bounds;
    };

    this.getNodeById = function (id) {
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].id === id) return nodes[i];
      }
    };
}

RandomGraph.prototype = new Graph();
function RandomGraph(numNodes, numEdges) {

    // Create nodes
    var nodes = [];
    for (var i = 0; i < numNodes; i++) {
        nodes.push(new Node(i, Math.random() * 100, Math.random() * 100));
    }

    // Create edges
    var edges = [];
    for (i = 0; i < numEdges; i++) {
        var srcIdx = Math.round(Math.random() * (numNodes - 1));
        var dstIdx = srcIdx;
        while (dstIdx === srcIdx)
            dstIdx = Math.round(Math.random() * (numNodes - 1));

        edges.push(new Edge(nodes[srcIdx], nodes[dstIdx]));
    }

    this.setData(nodes, edges);

    // arrange graph nicely using the force-direct algorithm
    forceDirectArrange(this);
}

JSONGraph.prototype = new Graph();
function JSONGraph(json) {

    // Create nodes
    var nodes = [];
    json.nodes.forEach(function (n) {
        nodes.push(new Node(n.id, n.x, n.y, n.radius));
    });

    // Create edges
    var edges = [];
    json.edges.forEach(function (e) {
        edges.push(new Edge(nodes[e.src], nodes[e.dst]));
    });

    this.setData(nodes, edges);
}


/**
 *
 * @param id
 * @param x
 * @param y
 * @constructor
 */
function Node(id, x, y) {
    this.id = id;
    this.deg = 0;
    this.isSelected = false;

    var pos    = new Animatable(),
        oldpos = {x: x, y: y}; // saved position for restoration when using lenses
    pos.setCurrent([x, y]);
    pos.setDestination([x, y]);

    this.radius = 1;
    this.color = '#000000';

    this.setPosition = function (x, y) {
        pos.setDestination([x, y]);
        return this;
    };

    this.getPosition = function () {
        var cur = pos.getCurrent();
        return {x: cur[0], y: cur[1]};
    };

    // save current or given position for later restoration
    this.savePosition = function(x, y) {
      if (typeof x === 'undefined' || typeof y === 'undefined')
        oldpos = this.getPosition();
      else
        oldpos = {x: x, y: y};
      return this;
    }

    this.restorePosition = function() {
      pos.setDestination([oldpos.x, oldpos.y]);
      return this;
    };

    this.getSavedPosition = function() {
      return oldpos;
    };

    this.setColor = function(c) {
      this.color = c;
      return this;
    };

    this.getColor = function(){return this.color};

    this.update = function (time) {
        return pos.update(time);
    };
}

Node.prototype.draw = function (gc, viewport) {
    gc.beginPath();

    var p = this.getPosition();
    p = viewport.worldToViewCoords(p.x, p.y);

    gc.arc(p.x, p.y, this.radius, 0, 2 * Math.PI);
    gc.fillStyle = this.color;
    gc.strokeStyle = (this.isSelected) ? Constants.HIGHLIGHT_LINE_COLOR : Constants.REGULAR_LINE_COLOR;
    gc.lineWidth = Constants.NODE_OUTLINE_WIDTH;

    gc.fill();
    gc.stroke();
};

Node.prototype.pick = function (x, y, viewport) {
    var p = this.getPosition();
    p = viewport.worldToViewCoords(p.x, p.y);
    var dx = p.x - x;
    var dy = p.y - y;
    var dSq = (dx * dx + dy * dy);
    var radSq = this.radius * this.radius;
    return dSq <= radSq;
};


/**
 *
 * @param src
 * @param dst
 * @constructor
 */
function Edge(src, dst) {
    this.src = src;
    this.dst = dst;
}

Edge.prototype.draw = function (gc, viewport) {
    gc.beginPath();
    var p;

    p = this.src.getPosition();
    p = viewport.worldToViewCoords(p.x, p.y);
    gc.moveTo(p.x, p.y);

    p = this.dst.getPosition();
    p = viewport.worldToViewCoords(p.x, p.y);
    gc.lineTo(p.x, p.y);

    gc.strokeStyle = (this.src.isSelected || this.dst.isSelected) ? Constants.HIGHLIGHT_LINE_COLOR : Constants.REGULAR_LINE_COLOR;
    gc.lineWidth = Constants.EDGE_LINE_WIDTH;

    gc.stroke();
};
