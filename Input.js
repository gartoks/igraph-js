function Input() {
    // Pointer coordinates
    this.mouseX = 0;
    this.mouseY = 0;
    this.prevMouseX = 0;
    this.prevMouseY = 0;
    this.mouseDX = 0;
    this.mouseDY = 0;

    // Dragging
    this.dragMode = "";

    this.update = function (evt) {
        var b = evt.target.getBoundingClientRect();

        this.prevMouseX = this.mouseX;
        this.prevMouseY = this.mouseY;

        this.mouseX = evt.clientX - b.left;
        this.mouseY = evt.clientY - b.top;

        this.mouseDX = this.mouseX - this.prevMouseX;
        this.mouseDY = this.mouseY - this.prevMouseY;
    };

    this.startDragging = function (mode) {
        this.dragMode = mode;
    };

    this.isDragging = function (mode) {
        return this.dragMode == mode;
    };

    this.stopDragging = function () {
        this.dragMode = "";
    }
}