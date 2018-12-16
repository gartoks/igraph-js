function Radar() {
    //var direction   = 270;    //direction of needle and corridor
    var direction   = new Animatable();
    direction.setCurrent([270]);
    direction.setDestination([270]);
    var initialized = false;
    var active      = false;
    var inside      = []; // nodes inside the corridor
    var rotation    = 0;

    var button = document.querySelector("#radarView");
    var c      = null; // compass

    this.setNode = function (n, graph) {
        node      = n;
        neighbors = getNeighbors(graph);
    };

    this.getDirection = function () {
        return direction.getCurrent()[0];
    };

    this.setDirection = function (dir) {
        var old = ((this.getDirection() % 360) + 360) % 360;  //workaround für negative zahlen...
        if(Math.abs(old-dir) >= 180){
            if(old>dir)
                rotation++;
            else
                rotation--;
        }
        direction.setDestination([360 * rotation + dir]);
    };

    this.addAngle = function(theta) {
      direction.setDestination([(direction.getDestination()[0] + theta)]);
    }

    var initialize = function () {
        c  = new Compass();
        n  = new Needle();
        co = new Corridor();
        initialized = true;
    };

    this.draw = function (gc, viewport, graph) {
        if (active) {
            if (!initialized) {
                initialize();
                this.getCompass().prevMouse = [gc.canvas.width  - 75, gc.canvas.height - 85]; // dirty hack
            }
            c.draw (gc);
            n.draw (gc, this.getDirection());
            co.draw(gc, this.getDirection());
            project(gc, viewport, graph);
        }
    };

    var project = function (gc, viewport, graph) {
        center = {x: window.innerWidth/2, y: window.innerHeight/2};
        var pos  = center,
            wpos = viewport.viewToWorldCoords(center.x, center.y);

        graph.getNodes().forEach(function (n) {
            var npos = n.getSavedPosition(),
                  vc = viewport.worldToViewCoords(npos.x, npos.y);
            if ((vc.x < 0 || vc.y < 0 || vc.x > gc.canvas.width || vc.y > gc.canvas.height)
                && co.isin(wpos, n, ((direction.getCurrent()[0] % 360) + 360) % 360)) {
                var normal = { x: vc.x - pos.x, y: vc.y - pos.y},
                        ux = -1,
                        uy = -1;
                if (vc.y > gc.canvas.height) {
                    var ux = (gc.canvas.height - pos.y)/normal.y*normal.x+pos.x,
                        uy = gc.canvas.height;
                }
                if (vc.y < 0) {
                    var ux = (-pos.y)/normal.y*normal.x+pos.x,
                        uy = 0;
                }
                if (ux >= 0 && ux <= gc.canvas.width) {
                  if (inside.indexOf(n.id) < 0) {
                    //node entered corridor
                    n.savePosition();
                    inside.push(n.id);
                  }
                  var p = viewport.viewToWorldCoords(ux, uy);
                  return n.setPosition(p.x, p.y);
                }
                if (vc.x > gc.canvas.width) {
                    var uy = (gc.canvas.width - pos.x)/normal.x*normal.y+pos.y,
                        ux = gc.canvas.width;
                }
                if (vc.x < 0) {
                    var uy = (-pos.x)/normal.x*normal.y+pos.y,
                        ux = 0;
                }
                if (inside.indexOf(n.id) < 0) {
                  n.savePosition();
                  inside.push(n.id);
                }
                var p = viewport.viewToWorldCoords(ux, uy);
                n.setPosition(p.x, p.y);
            }
            else {
              var i = inside.indexOf(n.id);
              if (i > 0) {
                //node left corridor
                n.restorePosition();
                inside.splice(i, 1);
              }
            }
        })
    };

    this.isActive = function () {
        return active;
    };

    this.setActive = function (a, graph) {
        active = a;
        if (active) {
            button.innerHTML = "Radar View Off";
        } else {
            inside.forEach(function(i){
              graph.getNodeById(i).restorePosition();
            });
            inside = [];
            button.innerHTML = "Radar View On";
        }
    };

    this.toggle = function (graph) {
        this.setActive(!this.isActive(), graph);
    };

    this.getCompass = function () {
        return c;
    };
    this.getCorridor = function () {
        return co;
    };
    this.getNeedle = function () {
        return n;
    };

    this.update = function (time) {
      return direction.update(time);
    };
}

var Compass = function () {
    var coords = {
        x: 0,
        y: 0,
        r: 0
    };

    this.prevMouse = [0, 0];


    this.draw = function (gc) { //TODO: Farben anpassen
        coords.x = gc.canvas.width  - 75;
        coords.y = gc.canvas.height - 75;
        coords.r = 50;

        gc.save();
        gc.strokeStyle = 'black';
        gc.fillStyle   = 'blue';
        gc.globalAlpha = 0.15;
        gc.beginPath();
        gc.arc(coords.x, coords.y, coords.r, 0, 2 * Math.PI);
        gc.closePath();
        gc.fill();
        gc.stroke();
        gc.restore();
    };

    // is click on compass?
    this.inSide = function (x, y) {
        return (x - coords.x)*(x - coords.x) + (y - coords.y)*(y - coords.y) < coords.r*coords.r;
    };

    this.clickAngle = function (x, y, radar) {
      var a = x - this.x(),
          b = y - this.y(),
          c = Math.sqrt((a - b) * (a - b)),
      angle = Math.atan(b / a) * 180 / Math.PI;
      if (a < 0 && b < 0) {
        angle = 180 + angle;
      }
      if (a < 0 && b > 0) {
        angle = 180 + angle;
      }
      if (a > 0 && b < 0) {
        angle = 360 + angle;
      }
      radar.setDirection(angle);
    };

    this.clickAngle2 = function(x, y, radar) {
      input = {prevMouseX : this.prevMouse[0],
               prevMouseY : this.prevMouse[1],
               mouseX     : x,
               mouseY     : y };
      this.prevMouse = [input.mouseX, input.mouseY];
      this.drag(input, radar);
    }

    this.x = function () {
        return coords.x;
    };
    this.y = function () {
        return coords.y;
    }

    this.drag = function(input, radar) {
      var ux = input.prevMouseX - coords.x;
      var uy = input.prevMouseY - coords.y;
      var ul = Math.sqrt(ux * ux + uy * uy);
      if (ul == 0) return;

      var vx = input.mouseX - coords.x
      var vy = input.mouseY - coords.y;
      var vl = Math.sqrt(vx * vx + vy * vy);
      if (vl == 0) return;

      var sign  = (ux * vy - uy * vx) < 0 ? -1 : 1;
      var cos   = (ux * vx + uy * vy) / (ul * vl);
      var angle = Math.acos(cos < 1 ? cos : 1);

      radar.addAngle(sign * angle * 57);
    }

};

var Needle = function () {
    var shapePath = [];

    var generate = function (gc, direction, radius, aperture_angle) {   // 0 degree = needle to the right, rotation clockwise
        var pos = {
            x: gc.canvas.width - 75,
            y: gc.canvas.height - 75
        };

        shapePath.push({x: pos.x, y: pos.y});
        shapePath.push({
            x: pos.x + Math.cos((direction - aperture_angle/2) * Math.PI / 180) * radius,
            y: pos.y + Math.sin((direction - aperture_angle/2) * Math.PI / 180) * radius
        });
        shapePath.push({
            x: pos.x + Math.cos((direction + aperture_angle/2) * Math.PI / 180) * radius,
            y: pos.y + Math.sin((direction + aperture_angle/2) * Math.PI / 180) * radius
        });
        shapePath.push({x: pos.x, y: pos.y});
    };

    var prepare = function (gc, direction) {
        var radius = 60;
        var aperture_angle = Constants.APERTURE_ANGLE;
        generate(gc, direction, radius, aperture_angle);
        gc.beginPath();
        gc.moveTo(shapePath[0].x, shapePath[0].y);
        gc.arc(shapePath[0].x, shapePath[0].y, radius, (direction-aperture_angle/2)*Math.PI/180, (direction+aperture_angle/2)*Math.PI/180);
        gc.closePath();
    };

    this.draw = function (gc, direction) {
        gc.save();
        prepare(gc, direction);
        gc.globalAlpha = 0.8;
        gc.fillStyle   = 'black';
        gc.fill();
        gc.stroke();
        gc.globalAlpha = 1;
        gc.restore();
        shapePath = [];
    };
};

var Corridor = function () {
    var aperture_angle = Constants.APERTURE_ANGLE;
    var shapePath      = [];

    var generate = function (gc, direction) { // 0 degree = needle to the right, rotation clockwise
        var angle_left  = (direction - aperture_angle / 2) * Math.PI / 180,
            angle_right = (direction + aperture_angle / 2) * Math.PI / 180,
            radius      = Math.sqrt(gc.canvas.height * gc.canvas.height + gc.canvas.width * gc.canvas.width);

        shapePath.push({
            x: gc.canvas.width  / 2 + Math.cos(angle_left) * radius,
            y: gc.canvas.height / 2 + Math.sin(angle_left) * radius
        });
        shapePath.push({x: gc.canvas.width / 2, y: gc.canvas.height / 2});
        shapePath.push({
            x: gc.canvas.width  / 2 + Math.cos(angle_right) * radius,
            y: gc.canvas.height / 2 + Math.sin(angle_right) * radius
        });
    };

    var prepare = function (gc, direction) {
        generate(gc, direction);
        gc.beginPath();
        gc.moveTo(shapePath[0].x, shapePath[0].y);
        for (var i = 1; i < shapePath.length; i++) {
            gc.lineTo(shapePath[i].x, shapePath[i].y);
        }
        gc.closePath();
    };

    this.draw = function (gc, direction) {
        gc.save();
        prepare(gc, direction);
        gc.strokeStyle = 'black';
        gc.fillStyle   = 'yellow';
        gc.globalAlpha = 0.2;
        gc.stroke();
        gc.fill();
        gc.globalAlpha = 1;
        gc.restore();
        shapePath = [];
    };

    this.isin = function (center, neighbor, direction) {
        //var p = node.getPosition(),
         nbor = neighbor.getPosition(),
            a = nbor.x - center.x,
            b = nbor.y - center.y,
            c = Math.sqrt((a - b) * (a - b)),
        angle = Math.atan(b / a) * 180 / Math.PI;
        if (a < 0 && b < 0) {
            angle += 180;
        } else if (a < 0 && b > 0) {
            angle += 180;
        } else if (a > 0 && b < 0) {
            angle += 360;
        }
        var o = (direction - aperture_angle / 2);
        var u = (direction + aperture_angle / 2);
        if (direction >= aperture_angle / 2 && direction <= 360 - aperture_angle / 2) {
            return (angle >= o && angle <= u);
        }else if(direction >= 360 - aperture_angle / 2){
            if(angle < aperture_angle / 2)
                angle += 360;
            return (angle >= o && angle <= u);
        }else{
            if(angle >= aperture_angle)
                angle -= 360;
            return (angle >= o && angle <= u);
        }
    }
};
