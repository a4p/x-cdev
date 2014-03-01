'use strict';

// Namespace a4p
var a4p;
if (!a4p) a4p = {};

/**
 * Gesture interpolator.
 */
a4p.GestureInterpolator = (function () {
    var step = Math.PI/8;

    function GestureInterpolator() {
        var samplePoint0, samplePoint1, sample10X, sample10Y, sampleDist10, sampleAngle10, move0;

        this.listeners = [];
        /**
         * Interpolation result of points entered via add() method
         * @type {Array}
         */
        this.moves = [];
        this.lastMove = null;

        this.begin = function() {
            this.moves = [];
            this.fromIdx = 0;
            samplePoint0 = null;
            samplePoint1 = null;
            move0 = null;
            for (var i=0; i < this.listeners.length; i++) {
                this.listeners[i].begin();
            }
        };

        this.add = function(x, y, timeStamp) {
            if (samplePoint0 == null) {
                samplePoint0 = {x:x, y:y, timeStamp:timeStamp};
                return;
            }
            var self = this;
            if (samplePoint1 == null) {
                if ((x == samplePoint0.x) && (y == samplePoint0.y)) return;

                samplePoint1 = {x:x, y:y, timeStamp:timeStamp};

                sample10X = samplePoint1.x - samplePoint0.x;
                sample10Y = samplePoint1.y - samplePoint0.y;
                sampleDist10 = Math.sqrt(sample10X*sample10X + sample10Y*sample10Y);
                sampleAngle10 = Math.atan2(sample10Y, sample10X); // in ]-PI, +PI]

                move0 = {
                    x:samplePoint0.x,
                    y:samplePoint0.y,
                    timeStamp:samplePoint0.timeStamp,
                    angle:sampleAngle10,
                    dist:sampleDist10,
                    line:orientation(sampleAngle10),
                    rotate:''
                };
                //console.log('GestureInterpolator : ' + move0.rotate + '(' + move0.line + ')');
                triggerMove(self, move0);
                return;
            }
            if ((x == samplePoint1.x) && (y == samplePoint1.y)) return;

            var oldDist = sampleDist10;
            var oldAngle = sampleAngle10;

            var tangentX = x - samplePoint0.x;
            var tangentY = y - samplePoint0.y;
            var tangentDist = Math.sqrt(tangentX*tangentX + tangentY*tangentY);
            var tangentAngle = Math.atan2(tangentY, tangentX); // in ]-PI, +PI]
            var line = orientation(tangentAngle);
            var rotate = '';

            sample10X = x - samplePoint1.x;
            sample10Y = y - samplePoint1.y;
            sampleDist10 = Math.sqrt(sample10X*sample10X + sample10Y*sample10Y);
            sampleAngle10 = Math.atan2(sample10Y, sample10X); // in ]-PI, +PI]

            var newMove = false;
            if (line != move0.line) {
                var angle = angleOf(tangentAngle, move0.angle);
                var angleNbStep = angleNbStepOf(tangentAngle, move0.angle);
                rotate = rotation(angle, angleNbStep);
                //if ((this.lastMove.rotate == '') || (rotate == '') || (rotate != this.lastMove.rotate)) {
                    newMove = true;
                //}
            }
            if (newMove) {
                if ((this.lastMove.rotate != '') && (rotate != this.lastMove.rotate)) {
                    // Push a line move after the end of previous rotation
                    move0 = {
                        x:move0.x,
                        y:move0.y,
                        timeStamp:move0.timeStamp,
                        angle:move0.angle,
                        dist:move0.dist,
                        line:move0.line,
                        rotate:''
                    };
                    triggerMove(self, move0);
                }
            }
            move0 = {
                x:samplePoint1.x,
                y:samplePoint1.y,
                timeStamp:samplePoint1.timeStamp,
                angle:tangentAngle,
                dist:(oldDist + sampleDist10) / 2,
                line:line,
                rotate:rotate
            };
            //console.log('GestureInterpolator : ' + move0.rotate + '(' + move0.line + ')');
            if (newMove) {
                triggerMove(self, move0);
            }

            samplePoint0 = samplePoint1;
            samplePoint1 = {x:x, y:y, timeStamp:timeStamp};
        };

        this.end = function() {
            if (samplePoint1 != null) {
                var line = orientation(sampleAngle10);
                var rotate = '';

                var newMove = false;
                if (line != move0.line) {
                    var angle = angleOf(sampleAngle10, move0.angle);
                    var angleNbStep = angleNbStepOf(sampleAngle10, move0.angle);
                    rotate = rotation(angle, angleNbStep);
                    //if ((this.lastMove.rotate == '') || (rotate == '') || (rotate != this.lastMove.rotate)) {
                        newMove = true;
                    //}
                }
                var self = this;
                if (newMove) {
                    if ((this.lastMove.rotate != '') && (rotate != this.lastMove.rotate)) {
                        // Push a line move after the end of previous rotation
                        move0 = {
                            x:move0.x,
                            y:move0.y,
                            timeStamp:move0.timeStamp,
                            angle:move0.angle,
                            dist:move0.dist,
                            line:move0.line,
                            rotate:''
                        };
                        triggerMove(self, move0);
                    }
                }
                move0 = {
                    x:samplePoint1.x,
                    y:samplePoint1.y,
                    timeStamp:samplePoint1.timeStamp,
                    angle:sampleAngle10,
                    dist:sampleDist10,
                    line:line,
                    rotate:rotate
                };
                //console.log('GestureInterpolator : ' + move0.rotate + '(' + move0.line + ')');
                if (newMove) {
                    triggerMove(self, move0);
                }
                // Force the last event to be a line move
                if (this.lastMove.rotate != '') {
                    // Push a line move after the last rotation
                    move0 = {
                        x:move0.x,
                        y:move0.y,
                        timeStamp:move0.timeStamp,
                        angle:move0.angle,
                        dist:move0.dist,
                        line:move0.line,
                        rotate:''
                    };
                    triggerMove(self, move0);
                }
            }
            for (var i=0; i < this.listeners.length; i++) {
                this.listeners[i].end();
            }
        };

        function triggerMove(self, move) {
            self.lastMove = {line:move.line, rotate:move.rotate};
            self.moves.push({
                x:move.x,
                y:move.y,
                timeStamp:move.timeStamp,
                angle:move.angle,
                dist:move.dist,
                line:move.line,
                rotate:move.rotate
            });
            for (var i=0; i < self.listeners.length; i++) {
                self.listeners[i].add(move);
            }
        }
    }

    /**
     * Adding a listener to draw or use the gestures interpolated by GestureInterpolator.
     * Each listener must implement begin() function : called at start of each sample.
     * Each listener must implement add(event) function : called for each significant position.
     * Each event has following attributes : x, y, timeStamp, angle, dist, line, compass.
     * Each listener must implement end() function : called at end of each sample.
     *
     * @param {object} listener Drawer
     */
    GestureInterpolator.prototype.addListener = function(listener) {
        this.listeners.push(listener);
    };

    GestureInterpolator.prototype.size = function() {
        return this.moves.length;
    };

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

    function angleOf(angle1, angle0) {// angle in ]-PI, +PI]
        var angle = angle1 - angle0;
        if (angle <= -Math.PI) angle = angle + 2*Math.PI;
        else if (angle > Math.PI) angle = angle - 2*Math.PI;
        return angle;
    }

    function angleNbStepOf(angle1, angle0) {// angle in ]-PI, +PI]
        var nbStep = Math.round(angle1 / (2*step)) - Math.round(angle0 / (2*step));// nbStep in ]-8, 8]
        if (nbStep <= -4) nbStep = nbStep + 8;
        else if (nbStep > 4) nbStep = nbStep - 8;
        return nbStep;
    }

    function rotation(angle, nbStep) {// angle in ]-PI, +PI], nbStep in ]-4, 4]
        if (Math.abs(nbStep) == 1) {
            if (angle < 0) {
                return 'left';
            } else {
                return 'right';
            }
        } else {
            // Too big or too small rotation
            return '';
        }
    }

    return GestureInterpolator;
})();
