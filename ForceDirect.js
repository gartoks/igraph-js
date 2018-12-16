function forceDirectArrange (graph) {

    var nodes = graph.getNodes();
    var edges = graph.getEdges();
    var tmpNodeData = [];
    for (var j = 0; j < nodes.length; j++) {
        tmpNodeData.splice(j, 0, {id: nodes[j].id, pos: {x: nodes[j].getPosition().x, y: nodes[j].getPosition().y}, force: {x: 0, y: 0}});
    }

    for (var i = 0; i < Constants.FORCE_DIRECT_MAX_ITERATIONS; i++) {

        // calculate repulsion forces
        for (var n0 = 0; n0 < nodes.length; n0++) {

            var node0Pos = tmpNodeData[n0].pos;

            // reset force on node
            tmpNodeData[n0].force.x = 0;
            tmpNodeData[n0].force.y = 0;

            for (var n1 = 0; n1 < nodes.length; n1++) {

                // no forces on identical nodes
                if (n0 != n1)
                {
                    var node1Pos = tmpNodeData[n1].pos;

                    var dx = node1Pos.x - node0Pos.x;
                    var dy = node1Pos.y - node0Pos.y;
                    var distanceSq = dx * dx + dy * dy;
                    var angle = nodeAngle(node0Pos, node1Pos);

                    // calc repulsion force based on Coulomb's Law
                    var force = Constants.FORCE_DIRECT_REPULSION_FACTOR * ((nodes[n0].deg * nodes[n1].deg) / distanceSq);

                    // add as an repulsion force
                    tmpNodeData[n0].force.x -= Math.cos(angle) * force;
                    tmpNodeData[n0].force.y -= Math.sin(angle) * force;
                }
            }
        }

        // calculate attracting forces
        edges.forEach(function (e) {
            var node0Idx = -1;
            var node1Idx = -1;

            // find indices of edge nodes
            for (i = 0; i < nodes.length; i++) {
                if (tmpNodeData[i].id === e.src.id)
                    node0Idx = i;
                if (tmpNodeData[i].id === e.dst.id)
                    node1Idx = i;
            }

            var node0Pos = tmpNodeData[node0Idx].pos;
            var node1Pos = tmpNodeData[node1Idx].pos;

            var dx = node1Pos.x - node0Pos.x;
            var dy = node1Pos.y - node0Pos.y;
            var distance = Math.sqrt(dx * dx + dy * dy);
            var angle = nodeAngle(node0Pos, node1Pos);

            // calc attraction force based on Hook's Law
            var force = Constants.FORCE_DIRECT_ATTRACTION_FACTOR * Math.max(1, distance - Constants.FORCE_DIRECT_SPRING_LENGTH);

            var forceX = Math.cos(angle) * force;
            var forceY = Math.sin(angle) * force;
            tmpNodeData[node0Idx].force.x += forceX;
            tmpNodeData[node0Idx].force.y += forceY;
            tmpNodeData[node1Idx].force.x -= forceX;
            tmpNodeData[node1Idx].force.y -= forceY;
        });

        // update new tmp position
        var totalDisplacement = 0;
        for (var k = 0; k < nodes.length; k++) {
            var nD = tmpNodeData[k];

            var newPosX = nD.pos.x + nD.force.x;
            var newPosY = nD.pos.y + nD.force.y;

            totalDisplacement += Math.sqrt((newPosX - nD.pos.x) * (newPosX - nD.pos.x) + (newPosY - nD.pos.y) * (newPosY - nD.pos.y));

            nD.pos.x = newPosX;
            nD.pos.y = newPosY;
        }

        // interrupt if a good layout is reached
        if (totalDisplacement < Constants.FORCE_DIRECT_MIN_TOTAL_DISPLACEMENT)
            break;
    }

    // set new node position
    for (i = 0; i < nodes.length; i++) {
        nodes[i].setPosition(tmpNodeData[i].pos.x, tmpNodeData[i].pos.y);
        nodes[i].savePosition(tmpNodeData[i].pos.x, tmpNodeData[i].pos.y);
    }
 }

function nodeAngle(pos0, pos1) {
    var dx = pos1.x - pos0.x;
    var dy = pos1.y - pos0.y;

    if (dx === 0)
        return dy > 0 ? (Math.PI * 0.5) : (Math.PI * 1.5);

    var phi = Math.atan2(dy, dx);
    if (phi < 0)
        phi = (phi + 2 * Math.PI) % (2 * Math.PI);  // map angle to [0, 2pi]

    return phi;

}