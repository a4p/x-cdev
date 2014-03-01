'use strict';

// Namespace a4p
var a4p;
if (!a4p) a4p = {};

/**
 * Gesture drawer.
 */
a4p.GestureDrawer = (function () {
    function GestureDrawer(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.begin = function() {
            //this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        };
        this.add = function(event) {
            //ctx0.fillStyle = 'red';
            this.ctx.strokeStyle = 'blue';
            this.ctx.lineWidth = "1";
            this.ctx.beginPath();
            this.ctx.arc(event.x, event.y, 2, 0, 2*Math.PI);
            this.ctx.stroke();

            //ctx0.fillStyle = 'red';
            this.ctx.strokeStyle = 'blue';
            this.ctx.lineWidth = "1";
            this.ctx.beginPath();
            this.ctx.moveTo(event.x, event.y);
            if (event.line == 'W') {
                this.ctx.lineTo(event.x - event.dist, event.y);
            } else if (event.line == 'SW') {
                this.ctx.lineTo(event.x - event.dist/Math.sqrt(2), event.y + event.dist/Math.sqrt(2));
            } else if (event.line == 'S') {
                this.ctx.lineTo(event.x, event.y + event.dist);
            } else if (event.line == 'SE') {
                this.ctx.lineTo(event.x + event.dist/Math.sqrt(2), event.y + event.dist/Math.sqrt(2));
            } else if (event.line == 'E') {
                this.ctx.lineTo(event.x + event.dist, event.y);
            } else if (event.line == 'NE') {
                this.ctx.lineTo(event.x + event.dist/Math.sqrt(2), event.y - event.dist/Math.sqrt(2));
            } else if (event.line == 'N') {
                this.ctx.lineTo(event.x, event.y - event.dist);
            } else if (event.line == 'NW') {
                this.ctx.lineTo(event.x - event.dist/Math.sqrt(2), event.y - event.dist/Math.sqrt(2));
            }
            this.ctx.stroke();
        };
        this.end = function() {
        };
    }
    return GestureDrawer;
})();
