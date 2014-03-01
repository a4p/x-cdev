'use strict';

// Namespace a4p
var a4p;
if (!a4p) a4p = {};

/**
 * Bezier curve interpolator.
 */
a4p.BezierInterpolator = (function () {
    function BezierInterpolator(scale) {
        var p0, q0, q1, p1;
        var samplePoint0;
        var samplePoint1;
        var sample10X, sample10Y, sampleDist10;

        this.listeners = [];
        /**
         * Ratio q0-p1/p0-p1 (a sort of tension)
         * @type {Number}
         */
        this.sampleScale = scale || 0.33;
        /**
         * Interpolation result of points entered via add() method
         * @type {Array}
         */
        this.controlPoints = [];
        /**
         * Number of bezier curves in controlPoints array ((controlPoints.length - 1)/3)
         * Each bezier curve needs 2 sample points (segment) and 2 control points (tangents and tension).
         * The second sample point of a bezier curve is also the first sample point for next bezier curve.
         * @type {Number}
         */
        this.nbCurve = 0;

        this.begin = function() {
            this.controlPoints = [];
            this.nbCurve = 0;
            p0 = null;
            q0 = null;
            q1 = null;
            p1 = null;
            samplePoint0 = null;
            samplePoint1 = null;
            for (var i=0; i < this.listeners.length; i++) {
                this.listeners[i].begin();
            }
        };

        this.add = function(x, y, timeStamp) {
            if (samplePoint0 == null) {
                samplePoint0 = {x:x, y:y};
                return;
            }
            if (samplePoint1 == null) {
                if ((x == samplePoint0.x) && (y == samplePoint0.y)) return;

                samplePoint1 = {x:x, y:y};

                sample10X = samplePoint1.x - samplePoint0.x;
                sample10Y = samplePoint1.y - samplePoint0.y;
                sampleDist10 = Math.sqrt(sample10X*sample10X + sample10Y*sample10Y);

                p0 = {x:samplePoint0.x, y:samplePoint0.y};
                q0 = {
                    x:samplePoint0.x + this.sampleScale * sample10X,
                    y:samplePoint0.y + this.sampleScale * sample10Y
                };
                this.controlPoints.push(p0);
                this.controlPoints.push(q0);
                return;
            }
            if ((x == samplePoint1.x) && (y == samplePoint1.y)) return;

            var tangentX = x - samplePoint0.x;
            var tangentY = y - samplePoint0.y;
            var tangentDist = Math.sqrt(tangentX*tangentX + tangentY*tangentY);
            q1 = {
                x:samplePoint1.x - this.sampleScale * tangentX * sampleDist10 / tangentDist,
                y:samplePoint1.y - this.sampleScale * tangentY * sampleDist10 / tangentDist
            };
            p1 = {x:samplePoint1.x, y:samplePoint1.y};
            this.controlPoints.push(q1);
            this.controlPoints.push(p1);
            for (var i=0; i < this.listeners.length; i++) {
                this.listeners[i].add(p0, q0, q1, p1);
            }

            sample10X = x - samplePoint1.x;
            sample10Y = y - samplePoint1.y;
            sampleDist10 = Math.sqrt(sample10X*sample10X + sample10Y*sample10Y);

            p0 = p1;
            q0 = {
                x:samplePoint1.x + this.sampleScale * tangentX * sampleDist10 / tangentDist,
                y:samplePoint1.y + this.sampleScale * tangentY * sampleDist10 / tangentDist
            };
            this.controlPoints.push(q0);
            samplePoint0 = samplePoint1;
            samplePoint1 = {x:x, y:y};
            this.nbCurve++;
        };

        this.end = function() {
            if (this.controlPoints.length > 1) {
                q1 = {
                    x:samplePoint1.x - this.sampleScale * sample10X,
                    y:samplePoint1.y - this.sampleScale * sample10Y
                };
                p1 = {x:samplePoint1.x, y:samplePoint1.y};
                this.controlPoints.push(q1);
                this.controlPoints.push(p1);
                for (var i=0; i < this.listeners.length; i++) {
                    this.listeners[i].add(p0, q0, q1, p1);
                }
                this.nbCurve++;
            }
            for (var i=0; i < this.listeners.length; i++) {
                this.listeners[i].end();
            }
        };
    }

    BezierInterpolator.prototype.size = function() {
        return this.nbCurve;
    };

    /**
     * Adding a listener to draw or use the bezier curves interpolated by BezierInterpolator.
     * Each listener must implement begin() function : called at start of each sample.
     * Each listener must implement add(p0, q0, q1, p1) function : called for each significant position.
     * Each listener must implement end() function : called at end of each sample.
     *
     * @param {object} listener Drawer
     */
    BezierInterpolator.prototype.addListener = function(listener) {
        this.listeners.push(listener);
    };

    return BezierInterpolator;
})();
