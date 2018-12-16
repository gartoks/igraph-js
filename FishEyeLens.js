function FishEyeLens() {
  const FILTER_RADIUS = Constants.FILTER_RADIUS;
  const DISTORTION    = Constants.DISTORTION;

  var button   = document.getElementById("fishEyeLens"),
      active   = false,
      position = new Animatable(),
      radius   = FILTER_RADIUS;
  position.setCurrent    ([0, 0]);
  position.setDestination([0, 0]);

  this.isActive      = function () {
    return active;
  };

  this.setActive     = function (a, graph) {
    active = a;
    if (active) {
      this.saveGraph(graph);
      button.innerHTML = "FishEye Lens Off";
    } else {
      graph.getNodes().forEach(function(n){
        n.restorePosition();
      });
      button.innerHTML = "FishEye Lens On";
    }
    return this;
  };

  this.toggle        = function (graph) {
    // sorry but we need a copy of the graph before the lens was turned on.
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

  this.getDistortion = function () {
    return DISTORTION;
  }

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
 * later fishlens.draw is called which only adds the cirle
 */
FishEyeLens.prototype.transform = function (gc, viewport, graph) {
  /*
  * apply transformation, from d3: https://raw.githubusercontent.com/d3/d3-plugins/master/fisheye/fisheye.js
  * which bases on http://dl.acm.org/citation.cfm?id=142763
  */
  var p = this.getPosition(),
     pw = viewport.viewToWorldCoords(p.x, p.y),
   dist = this.getDistortion(),
      r = this.getRadius(),
     rw = r * viewport.viewToWorldRatio(),
     k0 = Math.exp(dist),
     k0 = k0 / (k0 - 1) * rw,
     k1 = dist / rw;

  // function that applies the transformation on node
  var t = function(n){
    var d = n.getSavedPosition(),
       dx = d.x - pw.x,
       dy = d.y - pw.y,
       dd = Math.sqrt(dx * dx + dy * dy);
    if (!dd || dd >= rw) return npos = {x: d.x, y: d.y, z: 1};
    var k = k0 * (1 - Math.exp(-dd * k1)) / dd * .75 + .25;
    return {x: pw.x + dx * k, y: pw.y + dy * k, z: Math.min(k, 10)};
  };

  graph.getNodes().forEach(function(n){
    var tn = t(n);
    n.setPosition(tn.x, tn.y);
  }.bind(this));

}

FishEyeLens.prototype.draw = function (gc, viewport, graph) {
  var p = this.getPosition(),
      r = this.getRadius();

  gc.save();

  // Draw lens
  gc.beginPath();
  gc.arc(p.x, p.y, r, 0, 360);
  gc.stroke();

  gc.restore();
};
