var Grid = {
    draw: function (gc, viewport) {
        gc.lineWidth = 1;
        var cur = viewport.getCurrent();

        var extent = Math.max(cur[2], cur[3]); // Determine maximum extent
        var magnitude = Math.log(extent) / Math.log(10); // Get the magnitude of maximum extent = 10 ^ magnitude
        var advance = Math.pow(10, Math.floor(magnitude) - 1); // Determine how much to add each step if we want 10 grid lines = 10 ^ (magnitude - 1)

        var X = Math.floor(cur[0] / advance) * advance; // Find an even x to start with the grid
        var Y = Math.floor(cur[1] / advance) * advance; // Find an even y to start with the grid

        var c = (advance * 10) / extent; // Fade the grid line color..

        var co = 1 - c * 0.25; // ..between 1 and 0.75
        co = Math.floor(255 * co);
        gc.strokeStyle = 'rgb(' + co + ', ' + co + ', ' + co + ')';

        // Convert to screen coordinates
        var p = viewport.worldToViewCoords(X, Y);
        var inc = advance / viewport.viewToWorldRatio();

        // Draw the grid lines
        gc.beginPath();
        while (p.x < gc.canvas.width) {
            gc.moveTo(p.x, 0);
            gc.lineTo(p.x, gc.canvas.height);
            p.x += inc;
        }
        while (p.y < gc.canvas.height) {
            gc.moveTo(0, p.y);
            gc.lineTo(gc.canvas.width, p.y);
            p.y += inc;
        }
        gc.stroke();

        // Draw a second coarser grid on top
        advance *= 10;

        X = Math.floor(cur[0] / advance) * advance; // Find even x for starting the coarser grid
        Y = Math.floor(cur[1] / advance) * advance; // Find even y

        co = 0.5 + (1 - c) * 0.25; // Fade color of coarser grid between 0.5 and 0.75
        co = Math.floor(255 * co);
        gc.strokeStyle = 'rgb(' + co + ', ' + co + ', ' + co + ')';

        // Convert to screen coordinates
        p = viewport.worldToViewCoords(X, Y);
        inc = advance / viewport.viewToWorldRatio();

        // Draw the grid lines of the coarser grid
        gc.beginPath();
        while (p.x < gc.canvas.width) {
            gc.moveTo(p.x, 0);
            gc.lineTo(p.x, gc.canvas.height);
            p.x += inc;
        }
        while (p.y < gc.canvas.height) {
            gc.moveTo(0, p.y);
            gc.lineTo(gc.canvas.width, p.y);
            p.y += inc;
        }
        gc.stroke();
    }
};
