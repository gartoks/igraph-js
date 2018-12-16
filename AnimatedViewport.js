/**
 *
 * @type {Animatable}
 */
AnimatedViewport.prototype = new Animatable();

/**
 *
 * @param canvas
 * @constructor
 */
function AnimatedViewport(canvas) {
    this.canvas = canvas;
    this.setCurrent([0, 0, this.canvas.width, this.canvas.height]);
    this.setDestination([0, 0, this.canvas.width, this.canvas.height]);
}

AnimatedViewport.prototype.viewToWorldCoords = function (vx, vy) {
    var cur = this.getCurrent();
    return {x: cur[0] + cur[2] * (vx / this.canvas.width), y: cur[1] + cur[3] * (vy / this.canvas.height)};
};

AnimatedViewport.prototype.worldToViewCoords = function (wx, wy) {
    var cur = this.getCurrent();
    return {x: (wx - cur[0]) / cur[2] * this.canvas.width, y: (wy - cur[1]) / cur[3] * this.canvas.height};
};

AnimatedViewport.prototype.viewToWorldRatio = function () {
    var cur = this.getCurrent();
    return cur[2] / this.canvas.width;
};

AnimatedViewport.prototype.fitToView = function (worldBounds, inflate, scaleORcut) {
    var viewWidth = Math.max(this.canvas.width, 1);
    var viewHeight = Math.max(this.canvas.height, 1);
    var viewAspect = viewWidth / viewHeight;

    var worldAspect = worldBounds[2] / worldBounds[3];

    var r = worldBounds.slice();

    // true: whole content in worldBounds will be visible
    // false: only part of worldBounds will be visible
    if (scaleORcut) {
        if (viewAspect > worldAspect) {
            r[2] = r[3] * viewAspect; // Enlarge viewport to make view fit to screen; critical: if panel is very small viewport must be very large to fit view to screen
        }
        else {
            r[3] = r[2] / viewAspect; // Enlarge viewport to make view fit to screen; critical: if panel is very small viewport must be very large to fit view to screen
        }
    }
    else {
        if (viewAspect > worldAspect) {
            r[3] = r[2] / viewAspect; // Reduce viewport; view will be centered
        }
        else {
            r[2] = r[3] * viewAspect; // Reduce viewport; view will be centered
        }
    }

    if (inflate) {
        r[2] *= 1.2;
        r[3] *= 1.2;
    }

    r[0] += (worldBounds[2] - r[2]) / 2;
    r[1] += (worldBounds[3] - r[3]) / 2;

    this.setDestination(r);
};
