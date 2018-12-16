var iG = new iGraph();

function iGraph() {
    // Create canvas element
    var canvas = document.createElement("canvas");
    var gc = canvas.getContext("2d");
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    document.querySelector("#igraph").appendChild(canvas);

    var buttons = document.querySelectorAll('button');

    var input = new Input();
    var graph;

    var viewport = new AnimatedViewport(canvas);
    var dragViewPort = [];
    var selectedNode = null;

    var edgeLens    = new EdgeLens();
    var fisheyeLens = new FishEyeLens();
    var bnnLens     = new BringNeighborsNearLens();
    var radar       = new Radar();
    var radarDrag   = false;

    var requestID = 0;

    var requestUpdate = function () {
        if (requestID == 0) {
            requestID = window.requestAnimationFrame(update);
        }
    };

    var update = function (time) {
        var needUpdate = false;
        needUpdate = viewport.update(time)    || needUpdate;
        needUpdate = graph.update(time)       || needUpdate;
        needUpdate = edgeLens.update(time)    || needUpdate;
        needUpdate = fisheyeLens.update(time) || needUpdate;
        needUpdate = radar.update(time)       || needUpdate;
        needUpdate = bnnLens.update(time)     || needUpdate;

        draw();

        // Request next animation frame if needed
        if (needUpdate) {
            requestID = window.requestAnimationFrame(update);
        }
        else {
            requestID = 0;
        }
    };

    var draw = function () {
        // Clear canvas
        gc.clearRect(0, 0, canvas.width, canvas.height);

        Grid.draw(gc, viewport);

        // apply fisheye lens
        if (fisheyeLens.isActive()) {
          fisheyeLens.transform(gc, viewport, graph);
        }

        // apply bnn lens
        if (bnnLens.isActive()) {
          bnnLens.transform(gc, viewport, graph);
        }

        // Draw all edges
        graph.drawEdges(gc, viewport);

        // Draw edge lens
        if (edgeLens.isActive()) {
            edgeLens.draw(gc, viewport, graph);
        }

        // Draw all nodes
        graph.drawNodes(gc, viewport);

        // Draw fisheye lens and restore node-data
        if (fisheyeLens.isActive()) {
          fisheyeLens.draw(gc, viewport, graph);
        }

        // Draw neighbor lens and restore node-data
        if (bnnLens.isActive()) {
          bnnLens.draw(gc, viewport, graph);
        }

        radar.draw(gc, viewport, graph);

    };

    var reset = function () {
        graph.computeBounds();
        var b = graph.getBounds();
        viewport.fitToView([b.x, b.y, b.w, b.h], false, true);
        requestUpdate();
        if(edgeLens.isActive())
            edgeLens.toggle();
        if(fisheyeLens.isActive())
            fisheyeLens.toggle(graph);
        if(bnnLens.isActive())
            bnnLens.toggle(graph);
        if(radar.isActive())
            radar.toggle(graph);
    };

    var zoom = function (zoom, xfactor, yfactor) {
        xfactor = (typeof xfactor === 'undefined') ? 0.5 : xfactor;
        yfactor = (typeof yfactor === 'undefined') ? 0.5 : yfactor;

        var cur = viewport.getCurrent();

        var newWidth  = cur[2] * zoom;
        var newHeight = cur[3] * zoom;
        var newX = cur[0] + (cur[2] - newWidth)  * xfactor;
        var newY = cur[1] + (cur[3] - newHeight) * yfactor;

        viewport.setDestination([newX, newY, newWidth, newHeight]);
        requestUpdate();
    };

    var move = function (dx, dy) {
        var cur = viewport.getCurrent();

        var newX = cur[0] + dx * cur[2];
        var newY = cur[1] + dy * cur[3];

        viewport.setDestination([newX, newY, cur[2], cur[3]]);
        requestUpdate();
    };

    canvas.onmousemove = function (evt) {
        input.update(evt);
        evt.preventDefault();

        if (input.isDragging("WORLD")) {
            // Drag viewport
            dragViewPort[0] -= input.mouseDX * viewport.viewToWorldRatio();
            dragViewPort[1] -= input.mouseDY * viewport.viewToWorldRatio();
            viewport.setDestination(dragViewPort.slice());
            requestUpdate();
        }
        else if (input.isDragging("NODE")) {
            var p = viewport.viewToWorldCoords(input.mouseX, input.mouseY);
            selectedNode.setPosition (p.x, p.y);
            selectedNode.savePosition(p.x, p.y);
            requestUpdate();
        }
        else if (input.isDragging("COMPASS")) {
          var comp = radar.getCompass();
          comp.drag(input, radar);
          requestUpdate();
        }

        if (edgeLens.isActive()) {
            edgeLens.setPosition(input.mouseX, input.mouseY);
            requestUpdate();
        }
        if (fisheyeLens.isActive()) {
          fisheyeLens.setPosition(input.mouseX, input.mouseY);
          requestUpdate();
        }
        if (bnnLens.isActive()) {
          bnnLens.setPosition(input.mouseX, input.mouseY);
          requestUpdate();
        }
    };

    canvas.onmousedown = function (evt) {
        input.update(evt);
        evt.preventDefault();

        if (evt.button == 0) {
            if (selectedNode != null)
                selectedNode.isSelected = false;

            selectedNode = graph.pick(input.mouseX, input.mouseY, viewport);

            var comp = radar.getCompass();
            if (radar.isActive() && comp.inSide(input.mouseX, input.mouseY)) { // click to compass
              input.startDragging("COMPASS");
              comp.clickAngle2(input.mouseX, input.mouseY, radar);
            }
            else if (selectedNode != null) {
              selectedNode.isSelected = true;
              input.startDragging("NODE");
            }

            requestUpdate();
        }
        else if (evt.button == 2) {
            var cur = viewport.getCurrent();
            dragViewPort = cur.slice();
            input.startDragging("WORLD");
        }
    };

    canvas.onmouseup = function (evt) {
        input.update(evt);
        evt.preventDefault();
        if (input.isDragging("COMPASS")) {
          radar.getCompass().prevMouse = [input.mouseX, input.mouseY]; // DIIIRTY HACKS
        }
        input.stopDragging();
    };


    canvas.onclick = function (evt) {
        input.update(evt);
        evt.preventDefault();
    };

    canvas.ondblclick = function (evt) {
        input.update(evt);
        evt.preventDefault();

        if (evt.button == 0) {
            if (radar.getCompass().inSide(input.mouseX, input.mouseY))
              return; // dblclick on compass hat keine funktion?

            // Center viewport at mouse coordinates
            var p = viewport.viewToWorldCoords(input.mouseX, input.mouseY);
            var cur = viewport.getCurrent();

            var newX = p.x - cur[2] * 0.5;
            var newY = p.y - cur[3] * 0.5;

            viewport.setDestination([newX, newY, cur[2], cur[3]]);
            requestUpdate();
        }
    };

    canvas.onwheel = function (evt) {
        input.update(evt);
        evt.preventDefault();

        var delta = evt.deltaY;

        var xFactor, yFactor;

        // Zoom on mouse cursor
        xFactor = input.mouseX / canvas.width;
        yFactor = input.mouseY / canvas.height;

        zoom(((delta < 0) ? Constants.ZOOM_WHEEL_FACTOR : 1 / Constants.ZOOM_WHEEL_FACTOR), xFactor, yFactor)
    };

    canvas.oncontextmenu = function (evt) {
        evt.preventDefault();
    };

    window.onkeypress = function (evt) {
        switch (evt.charCode) {
            case Constants.KEY_ZOOM_IN:
                zoom(Constants.ZOOM_KEY_FACTOR);
                break;
            case Constants.KEY_ZOOM_OUT:
                zoom(1 / Constants.ZOOM_KEY_FACTOR);
                break;
            case Constants.KEY_UP:
                move(0, -Constants.MOVE_KEY_FACTOR);
                break;
            case Constants.KEY_DOWN:
                move(0, Constants.MOVE_KEY_FACTOR);
                break;
            case Constants.KEY_RIGHT:
                move(Constants.MOVE_KEY_FACTOR, 0);
                break;
            case Constants.KEY_LEFT:
                move(-Constants.MOVE_KEY_FACTOR, 0);
                break;
            case Constants.KEY_E:
                edgeLens.toggle();
                requestUpdate();
                break;
            case Constants.KEY_R:
                radar.toggle(graph);
                requestUpdate();
                break;
            case Constants.KEY_F:
                fisheyeLens.toggle(graph);
                requestUpdate();
                break;
            case Constants.KEY_B:
                bnnLens.toggle(graph);
                requestUpdate();
                break;
        }
    };

    window.onresize = function () {
        var wasEnlarged = (canvas.width < window.innerWidth || canvas.height < window.innerHeight);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        viewport.fitToView(viewport.getDestination().slice(), false, wasEnlarged);
        requestUpdate();
    };

    buttons[0].onclick = function (e) {
        var x = new XMLHttpRequest();
        x.open("GET", "graph.json");

        x.onload = function () {
            var json = JSON.parse(this.responseText);
            graph = new JSONGraph(json);
            reset();
        };

        x.onerror = function (e) {
            console.log(e);
        };

        x.send();
    };

    buttons[1].onclick = function (e) {
        graph = new RandomGraph(40, 50);
        reset();
    };

    buttons[2].onclick = function (e) {
        reset();
    };

    buttons[3].onclick = function (e) {
        zoom(1 / Constants.ZOOM_WHEEL_FACTOR);
    };

    buttons[4].onclick = function (e) {
        zoom(Constants.ZOOM_WHEEL_FACTOR);
    };

    buttons[5].onclick = function (e) {
        edgeLens.toggle();
        requestUpdate();
    };

    buttons[6].onclick = function (e) {
        radar.toggle(graph);
        requestUpdate();
    };

    buttons[7].onclick = function (e) {
      fisheyeLens.toggle(graph);
      requestUpdate();
    };

    buttons[8].onclick = function (e) {
      bnnLens.toggle(graph);
      requestUpdate();
    };

    graph = new RandomGraph(Constants.NUMBER_NODES, Constants.NUMBER_EDGES);
    reset();
}
