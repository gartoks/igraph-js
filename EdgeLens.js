function EdgeLens() {
    const FILTER_RADIUS = Constants.FILTER_RADIUS;

    var button = document.getElementById("edgeLens");

    var active = false;
    var position = new Animatable();
    position.setCurrent([0, 0]);
    position.setDestination([0, 0]);
    var radius = FILTER_RADIUS;

    this.isActive = function () {
        return active;
    };

    this.setActive = function (a) {
        active = a;
        if (active) {
            button.innerHTML = "Edge Lens Off";
        } else {
            button.innerHTML = "Edge Lens On";
        }
    };

    this.toggle = function () {
        this.setActive(!this.isActive());
    };

    this.setPosition = function (x, y) {
        position.setDestination([x, y]);
    };

    this.getPosition = function () {
        var cur = position.getCurrent();
        return {x: cur[0], y: cur[1]};
    };

    this.getRadius = function () {
        return radius;
    };

    this.update = function (time) {
        return position.update(time);
    };
}

EdgeLens.prototype.draw = function (gc, viewport, graph) {
    var p = this.getPosition();
    var r = this.getRadius();

    gc.save();

    // Clip at lens region
    gc.beginPath();
    gc.arc(p.x, p.y, r, 0, 360);
    gc.clip();

    // Clear lens
    gc.clearRect(p.x - r, p.y - r, 2 * r, 2 * r);
    // Redraw grid in lens
    Grid.draw(gc, viewport);
    // Draw edges inside lens
    graph.drawSelectedEdges(gc, viewport, p.x, p.y, r);
    // Restore original context state (no more clipping)
    gc.restore();

    // Draw lens
    gc.beginPath();
    gc.arc(p.x, p.y, r, 0, 360);
    gc.stroke();
};