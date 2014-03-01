'use strict';

// Namespace a4p
var a4p;
if (!a4p) a4p = {};

/**
 * Move drawer.
 */
a4p.MoveDrawer = (function () {
    function MoveDrawer(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.begin = function() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        };
        this.add = function(p0) {
            //ctx0.fillStyle = 'red';
            this.ctx.strokeStyle = 'red';
            this.ctx.lineWidth = "1";
            this.ctx.beginPath();
            this.ctx.arc(p0.x, p0.y, 2, 0, 2*Math.PI);
            this.ctx.stroke();

            //ctx0.fillStyle = 'red';
            this.ctx.strokeStyle = 'green';
            this.ctx.lineWidth = "1";
            this.ctx.beginPath();
            this.ctx.arc(p0.x + p0.dx, p0.y + p0.dy, 2, 0, 2*Math.PI);
            this.ctx.stroke();

            //ctx0.fillStyle = 'red';
            this.ctx.strokeStyle = 'green';
            this.ctx.lineWidth = "1";
            this.ctx.beginPath();
            this.ctx.moveTo(p0.x, p0.y);
            this.ctx.lineTo(p0.x + p0.dx, p0.y + p0.dy);
            this.ctx.stroke();
        };
        this.end = function() {
        };
    }
    return MoveDrawer;
})();
