/**
 *
 * @constructor
 */
function Animatable() {
    this.cur = [];
    this.dst = [];

    this.dist = [0, 0, 0, 0];
    this.force = [0, 0, 0, 0];
    this.velo = [0, 0, 0, 0];
    this.accel = [0, 0, 0, 0];

    this.epsilon = 0.000001; // Epsilon neighborhood to converge to destination

    this.springK = 128; // Spring constant
    this.dampK = 24; // Damping constant
    this.massK = 1; // Mass constant

    this.oldTime = -1; // Timestamp of the last update
    this.done = true; // Indicates when destination has been reached
}

Animatable.prototype.getCurrent = function () {
    return this.cur.slice();
};

Animatable.prototype.setCurrent = function (newCur) {
    this.cur = newCur.slice();
};

Animatable.prototype.getDestination = function () {
    return this.dst.slice();
};

Animatable.prototype.setDestination = function (newDst) {
    this.dst = newDst.slice();
    if (this.done) {
        this.oldTime = -1;
        this.done = false; // Reset animation
    }
};

Animatable.prototype.update = function (time) {
    return this.forceUpdate(time);
};

Animatable.prototype.forceUpdate = function (time) {
    if (!this.done) {
        var n = this.cur.length; // Length of array
        var i; // Loop variable
        var e = 0; // Energy

        if (this.oldTime == -1) this.oldTime = time;
        var dt = (time - this.oldTime) / 1000;
        this.oldTime = time;
        if (dt > 0.05) dt = 0.05;

        for (i = 0; i < n; i++) {
            // Compute displacement
            this.dist[i] = this.cur[i] - this.dst[i];

            // Compute force = spring force + damping force
            this.force[i] = -this.springK * this.dist[i] + -this.dampK * this.velo[i];

            // Compute acceleration
            this.accel[i] = this.force[i] / this.massK;

            // Update velocity
            this.velo[i] += dt * this.accel[i];

            // Update current position
            this.cur[i] += dt * this.velo[i];
        }

        // Compute energy (constant factors spring constant and mass ignored)
        for (i = 0; i < n; i++) {
            e += this.velo[i] * this.velo[i]; // Kinetic energy
            e += this.dist[i] * this.dist[i]; // Potential energy
        }

        if (e < this.epsilon) {
            this.done = true;
            this.cur = this.dst.slice(); // Switch exactly to the destination
        }
    }

    return !this.done;
};