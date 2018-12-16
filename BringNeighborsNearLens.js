function BringNeighborsNearLens() {
  const FILTER_RADIUS = Constants.FILTER_RADIUS;

  var button   = document.getElementById("bnnLens"),
      active   = false,
      position = new Animatable(),
      radius   = FILTER_RADIUS;
  position.setCurrent    ([0, 0]);
  position.setDestination([0, 0]);
  this.thenode = null;

  this.isActive      = function () {
    return active;
  };

  this.setActive     = function (a, graph) {
    active = a;
    if (active) {
      this.saveGraph(graph);
      button.innerHTML = "BringNeighborsNear Lens Off";
    } else {
      graph.getNodes().forEach(function(n){
        n.restorePosition();
      });
      button.innerHTML = "BringNeighborsNear Lens On";
    }
    return this;
  };

  this.toggle        = function (graph) {
    this.setActive(!this.isActive(), graph);
    return this;
  };

  this.setPosition   = function (x, y) {
    position.setDestination([x, y]);
    return this;
  };

  this.getPosition   = function () {
    var cur = position.getCurrent();
    return {x: cur[0], y: cur[1]};
  };

  this.getRadius     = function () {
    return radius;
  };

  this.saveGraph      = function (g) {
    g.getNodes().forEach(function(n){
      var cur = n.getPosition(),
          sav = n.getSavedPosition();
      // save position only if no other effect is active???
      if (cur.x == sav.x && cur.y == sav.y)
        n.savePosition();
    });
    return this;
  }

  this.update = function (time) {
    return position.update(time);
  };
}

/*
 * transform is called in the global-drawroutine before drawing edges,
 * later bnn.draw is called which only adds the cirle
 */
BringNeighborsNearLens.prototype.transform = function (gc, viewport, graph) {
  var nodeInLens = function(n) {
    var coords = n.getPosition();
    return (lenspw.x - coords.x)*(lenspw.x - coords.x) + (lenspw.y - coords.y)*(lenspw.y - coords.y) < rw*rw;
  }
  // find neighbors of node in graph
  var getNeighbors = function (node, graph) {
    if (node == null) return [];
    var neighbors = [];
    graph.getEdges().forEach(function (e) {
      if (e.src.id == node.id) {
        neighbors.push(e.dst);
      }
      if (e.dst.id == node.id) {
        neighbors.push(e.src);
      }
    });
    return neighbors;
  };

  var allNodes = graph.getNodes(),
      lensp    = this.getPosition(),
      lenspw   = viewport.viewToWorldCoords(lensp.x, lensp.y),
      r        = this.getRadius(),
      rw       = r * viewport.viewToWorldRatio();

  /* finde nodes in der linse
   * die schleifenstruktur ist nicht optimal, wenn man nur eine node beachten möchte,
   * aber wenn man die linse auf alle knoten in der linse erweitern will braucht man das sicherlich?
   * ich wollte zuerst direkt die bessere linse machen, aber das ist nicht so einfach
   * aber die schleifenstruktur habe ich mal dringelassen...
   */
  for (var i = 0; i < allNodes.length; i++) {
    var n = allNodes[i];
    if (nodeInLens(n)) {
      if (this.thenode === null) {
        this.thenode = n.id; //that node will now be used
      }
      if (n.id == this.thenode) {
        var neighbors = getNeighbors(graph.getNodeById(this.thenode), graph),
            np        = n.getPosition(),
            d         = Math.sqrt((lenspw.x - np.x)*(lenspw.x - np.x) + (lenspw.y - np.y)*(lenspw.y - np.y)), // abstand linse zu knoten
            t         = d/rw,
            far       = undefined, // enferntester nachbar
            near      = undefined; // naechster nachbar
        for (var j = 0; j < neighbors.length; j++) { // find far and near neighbors
          var nb   = neighbors[j],
              nbp  = nb.getSavedPosition(),
              dd   = Math.sqrt((np.x - nbp.x)*(np.x - nbp.x) + (np.y - nbp.y)*(np.y - nbp.y));
              if (typeof far  === 'undefined' || dd > far[0])
                far  = [dd, nb];
              if (typeof near === 'undefined' || dd < near[0])
                near = [dd, nb];
        }
        for (var j = 0; j < neighbors.length; j++) {
          var nb   = neighbors[j],
              nbp  = nb.getSavedPosition(),
              norm = [(nbp.x - np.x)/Math.sqrt((nbp.x - np.x)*(nbp.x - np.x)+(np.y - nbp.y)*(np.y - nbp.y)),
                      (nbp.y - np.y)/Math.sqrt((nbp.x - np.x)*(nbp.x - np.x)+(np.y - nbp.y)*(np.y - nbp.y))],
              nfr  = Math.sqrt((nbp.x - np.x)*(nbp.x - np.x)+(np.y - nbp.y)*(np.y - nbp.y)) / far[0],
              newx = t*nbp.x+(1-t)*(np.x + rw*nfr*norm[0]),
              newy = t*nbp.y+(1-t)*(np.y + rw*nfr*norm[1]),
              dd   = Math.sqrt((lenspw.x - newx)*(lenspw.x - newx) + (lenspw.y - newy)*(lenspw.y - newy));
          if (1 || dd > rw*0.7)
            nb.setPosition(newx, newy);
        }
      }
    }
    else if (this.thenode === n.id) { // node left lensarea
      this.thenode = null;
    }
  }
}

BringNeighborsNearLens.prototype.draw = function (gc, viewport, graph) {
  var p = this.getPosition(),
      r = this.getRadius();

  gc.save();

  // Draw lens
  gc.beginPath();
  gc.arc(p.x, p.y, r, 0, 360);
  gc.stroke();

  gc.restore();
};
