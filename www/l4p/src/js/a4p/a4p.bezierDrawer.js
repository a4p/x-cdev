'use strict';

// Namespace a4p
var a4p;
if (!a4p) a4p = {};

/**
 * Bezier curve drawer.
 */
a4p.BezierDrawer = (function () {
    function BezierDrawer(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.begin = function() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        };
        this.add = function(p0, q0, q1, p1) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = "cyan";
            this.ctx.lineWidth = "6";
            this.ctx.moveTo(p0.x, p0.y);
            this.ctx.bezierCurveTo(q0.x, q0.y, q1.x, q1.y, p1.x, p1.y);
            this.ctx.stroke();

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
            this.ctx.arc(q0.x, q0.y, 2, 0, 2*Math.PI);
            this.ctx.stroke();

            //ctx0.fillStyle = 'red';
            this.ctx.strokeStyle = 'green';
            this.ctx.lineWidth = "1";
            this.ctx.beginPath();
            this.ctx.arc(q1.x, q1.y, 2, 0, 2*Math.PI);
            this.ctx.stroke();

            //ctx0.fillStyle = 'red';
            this.ctx.strokeStyle = 'red';
            this.ctx.lineWidth = "1";
            this.ctx.beginPath();
            this.ctx.arc(p1.x, p1.y, 2, 0, 2*Math.PI);
            this.ctx.stroke();

            //ctx0.fillStyle = 'red';
            this.ctx.strokeStyle = 'green';
            this.ctx.lineWidth = "1";
            this.ctx.beginPath();
            this.ctx.moveTo(p0.x, p0.y);
            this.ctx.lineTo(q0.x, q0.y);
            this.ctx.stroke();

            //ctx0.fillStyle = 'red';
            this.ctx.strokeStyle = 'green';
            this.ctx.lineWidth = "1";
            this.ctx.beginPath();
            this.ctx.moveTo(q1.x, q1.y);
            this.ctx.lineTo(p1.x, p1.y);
            this.ctx.stroke();

        };
        this.end = function() {
        };
    }
    return BezierDrawer;
})();
