'use strict';

// Namespace a4p
var a4p;
if (!a4p) a4p = {};

/**
 * Move interpolator.
 */
a4p.MoveInterpolator = (function () {
    function MoveInterpolator(scale) {
        var samplePoint0, samplePoint1, sample10X, sample10Y, sampleDist10, sampleAngle10;

        this.listeners = [];
        /**
         * Interpolation result of points entered via add() method
         * @type {Array}
         */
        this.moves = [];

        this.begin = function() {
            this.moves = [];
            samplePoint0 = null;
            samplePoint1 = null;
            for (var i=0; i < this.listeners.length; i++) {
                this.listeners[i].begin();
            }
        };

        this.add = function(x, y, timeStamp) {
            if (samplePoint0 == null) {
                samplePoint0 = {x:x, y:y, timeStamp:timeStamp};
                return;
            }
            if (samplePoint1 == null) {
                if ((x == samplePoint0.x) && (y == samplePoint0.y)) return;

                samplePoint1 = {x:x, y:y, timeStamp:timeStamp};
                sample10X = samplePoint1.x - samplePoint0.x;
                sample10Y = samplePoint1.y - samplePoint0.y;
                sampleDist10 = Math.sqrt(sample10X*sample10X + sample10Y*sample10Y);
                sampleAngle10 = Math.atan2(sample10Y, sample10X); // in ]-PI, +PI]

                var compass1 = orientation(sampleAngle10);
                this.moves.push({
                    x:samplePoint0.x,
                    y:samplePoint0.y,
                    dx:sample10X,
                    dy:sample10Y,
                    d:sampleDist10,
                    angle:sampleAngle10,
                    compass:compass1,
                    timeStamp:samplePoint0.timeStamp
                });
                for (var idx1 = 0; idx1 < this.listeners.length; idx1++) {
                    this.listeners[idx1].add({
                        x:samplePoint0.x,
                        y:samplePoint0.y,
                        dx:sample10X,
                        dy:sample10Y,
                        d:sampleDist10,
                        angle:sampleAngle10,
                        compass:compass1,
                        timeStamp:samplePoint0.timeStamp
                    });
                }
                return;
            }
            if ((x == samplePoint1.x) && (y == samplePoint1.y)) return;

            var oldDist = sampleDist10;

            var tangentX = x - samplePoint0.x;
            var tangentY = y - samplePoint0.y;
            var tangentDist = Math.sqrt(tangentX*tangentX + tangentY*tangentY);
            var tangentAngle = Math.atan2(tangentY, tangentX); // in ]-PI, +PI]

            sample10X = x - samplePoint1.x;
            sample10Y = y - samplePoint1.y;
            sampleDist10 = Math.sqrt(sample10X*sample10X + sample10Y*sample10Y);
            sampleAngle10 = Math.atan2(sample10Y, sample10X); // in ]-PI, +PI]

            var compass2 = orientation(tangentAngle);
            this.moves.push({
                x:samplePoint1.x,
                y:samplePoint1.y,
                dx:tangentX * (oldDist + sampleDist10) / 2 / tangentDist,
                dy:tangentY * (oldDist + sampleDist10) / 2 / tangentDist,
                d:(oldDist + sampleDist10) / 2,
                angle:tangentAngle,
                compass:compass2,
                timeStamp:samplePoint1.timeStamp
            });
            for (var idx2 = 0; idx2 < this.listeners.length; idx2++) {
                this.listeners[idx2].add({
                    x:samplePoint1.x,
                    y:samplePoint1.y,
                    dx:tangentX * (oldDist + sampleDist10) / 2 / tangentDist,
                    dy:tangentY * (oldDist + sampleDist10) / 2 / tangentDist,
                    d:(oldDist + sampleDist10) / 2,
                    angle:tangentAngle,
                    compass:compass2,
                    timeStamp:samplePoint1.timeStamp
                });
            }

            samplePoint0 = samplePoint1;
            samplePoint1 = {x:x, y:y, timeStamp:timeStamp};
        };

        this.end = function() {
            if (samplePoint1 != null) {
                var compass1 = orientation(sampleAngle10);
                this.moves.push({
                    x:samplePoint1.x,
                    y:samplePoint1.y,
                    dx:sample10X,
                    dy:sample10Y,
                    d:sampleDist10,
                    angle:sampleAngle10,
                    compass:compass1,
                    timeStamp:samplePoint1.timeStamp
                });
                for (var i = 0; i < this.listeners.length; i++) {
                    this.listeners[i].add({
                        x:samplePoint1.x,
                        y:samplePoint1.y,
                        dx:sample10X,
                        dy:sample10Y,
                        d:sampleDist10,
                        angle:sampleAngle10,
                        compass:compass1,
                        timeStamp:samplePoint1.timeStamp
                    });
                }
            }
            for (var idx1=0; idx1 < this.listeners.length; idx1++) {
                this.listeners[idx1].end();
            }
        };
    }

    MoveInterpolator.prototype.size = function() {
        return this.moves.length;
    };

    /**
     * Adding a listener to draw or use the movements interpolated by MoveInterpolator.
     * Each listener must implement begin() function : called at start of each sample.
     * Each listener must implement add(event) function : called for each significant position.
     * Each event has following attributes : x, y, dx, dy, d, angle, compass, timeStamp.
     * Each listener must implement end() function : called at end of each sample.
     *
     * @param {object} listener Drawer
     */
    MoveInterpolator.prototype.addListener = function(listener) {
        this.listeners.push(listener);
    };

    var step = Math.PI/8;

    function orientation(angle) { // angle in ]-PI, +PI]
        if (angle > (Math.PI - step)) {
            return 'W';
        } else if (angle > (Math.PI - 3*step)) {
            return 'SW';
        } else if (angle > (Math.PI - 5*step)) {
            return 'S';
        } else if (angle > (Math.PI - 7*step)) {
            return 'SE';
        } else if (angle > (Math.PI - 9*step)) {
            return 'E';
        } else if (angle > (Math.PI - 11*step)) {
            return 'NE';
        } else if (angle > (Math.PI - 13*step)) {
            return 'N';
        } else if (angle > (Math.PI - 15*step)) {
            return 'NW';
        } else {
            return 'W';
        }
    }
    return MoveInterpolator;
})();
