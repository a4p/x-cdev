'use strict';

// Namespace a4p
var a4p;
if (!a4p) a4p = {};

/**
 * Sampler of finger successive coords to extract only a subset of significant positions.
 * Then it is possible to interpolate this subset with a bezier curve for example.
 */
a4p.PointSampler = (function () {
    /**
     * Sampler of finger successive coords to extract only a subset of significant positions.
     * Then it is possible to interpolate this subset with a bezier curve interpolator for example.
     * @param {int} maxIdleTime Maximum delay (in ms) for no move (defaults to 10 ms)
     * @param {int} minDistance Minimum distance (in pixel) between p1 and p2 (defaults to nearly 3 pixels)
     * @constructor
     */
    function PointSampler(maxIdleTime, minDistance) {
        var addSampleTimeout = null;
        var sourcePoint0;
        var sourcePoint1;
        var ptTimeout;
        var lg0;
        var lg1;

        this.listeners = [];
        /**
         * Maximum delay in ms for no move
         * @type {Number}
         */
        this.maxIdleTime = maxIdleTime || 10;
        /**
         * Minimal distance*distance between p1 and p2
         * @type {Number}
         */
        this.minSqrDistance = minDistance*minDistance || 10;
        /**
         * Stats about which criteria validated a sample point
         * @type {Object}
         */
        this.stats = {timeout:0, angle:0, lg:0};
        /**
         * Sample : sampling result of points entered via addSample() method
         * @type {Array}
         */
        this.points = [];

        this.beginSample = function() {
            sourcePoint0 = null;
            sourcePoint1 = null;
            ptTimeout = null;
            lg0 = 0;
            lg1 = 0;
            if (addSampleTimeout != null) clearTimeout(addSampleTimeout);
            addSampleTimeout = null;
            this.stats = {timeout:0, angle:0, lg:0};
            for (var i=0; i < this.listeners.length; i++) {
                this.listeners[i].begin();
            }
        };

        this.addSample = function(x, y, timeStamp) {// next
            var self = this;
            // Wait for 2 first points
            if (sourcePoint0 == null) {
                if (addSampleTimeout != null) clearTimeout(addSampleTimeout);
                addSampleTimeout = null;
                ptTimeout = null;

                this.points.push({x:x, y:y});
                for (var i=0; i < this.listeners.length; i++) {
                    this.listeners[i].add(x, y, timeStamp);
                }
                sourcePoint0 = {x:x, y:y};
                return;
            }
            if (sourcePoint1 == null) {
                // Ignore successive identical points
                lg0 = (x - sourcePoint0.x)*(x - sourcePoint0.x)
                        + (y - sourcePoint0.y)*(y - sourcePoint0.y);
                if (lg0 > this.minSqrDistance) {
                    if (addSampleTimeout != null) clearTimeout(addSampleTimeout);
                    addSampleTimeout = null;
                    ptTimeout = null;

                    this.stats.lg++;
                    this.points.push({x:x, y:y});
                    for (var i=0; i < this.listeners.length; i++) {
                        this.listeners[i].add(x, y, timeStamp);
                    }
                    sourcePoint1 = {x:x, y:y};
                } else {
                    ptTimeout = {x:x, y:y, timeStamp:timeStamp};
                    if (addSampleTimeout == null) {
                        addSampleTimeout = setTimeout(function () {
                            self.stats.timeout++;
                            self.points.push({x:ptTimeout.x, y:ptTimeout.y});
                            for (var i=0; i < self.listeners.length; i++) {
                                self.listeners[i].add(ptTimeout.x, ptTimeout.y, ptTimeout.timeStamp);
                            }
                            sourcePoint1 = {x:ptTimeout.x, y:ptTimeout.y};
                            ptTimeout = null;
                            addSampleTimeout = null;
                        }, this.maxIdleTime);
                    }
                }
                return;
            }

            // Ignore successive identical points
            lg1 = (x - sourcePoint1.x) * (x - sourcePoint1.x)
                + (y - sourcePoint1.y) * (y - sourcePoint1.y);
            var lg2 = (x - sourcePoint0.x) * (x - sourcePoint0.x)
                + (y - sourcePoint0.y) * (y - sourcePoint0.y);
            if (lg1 > this.minSqrDistance) {
                //Math.sqrt(lg0) + Math.sqrt(lg1) == Math.sqrt(lg2)
                if ((lg1 + lg0) > 1.5*lg2) {
                    // Turn angle > 90°
                    if (addSampleTimeout != null) clearTimeout(addSampleTimeout);
                    addSampleTimeout = null;
                    ptTimeout = null;

                    this.stats.lg++;
                    this.points.push({x:x, y:y});
                    for (var i=0; i < this.listeners.length; i++) {
                        this.listeners[i].add(x, y, timeStamp);
                    }
                    sourcePoint0 = sourcePoint1;
                    sourcePoint1 = {x:x, y:y};
                    lg0 = lg1;
                } else {
                    if ((lg1 + lg0 - lg2) > 36) {
                        // More than 6 pixels diff in turn change
                        if (addSampleTimeout != null) clearTimeout(addSampleTimeout);
                        addSampleTimeout = null;
                        ptTimeout = null;

                        this.stats.angle++;
                        this.points.push({x:x, y:y});
                        for (var i=0; i < this.listeners.length; i++) {
                            this.listeners[i].add(x, y, timeStamp);
                        }
                        sourcePoint0 = sourcePoint1;
                        sourcePoint1 = {x:x, y:y};
                        lg0 = lg1;
                    } else {
                        ptTimeout = {x:x, y:y, timeStamp:timeStamp};
                        if (addSampleTimeout == null) {
                            addSampleTimeout = setTimeout(function () {
                                self.stats.timeout++;
                                self.points.push({x:ptTimeout.x, y:ptTimeout.y});
                                for (var i=0; i < self.listeners.length; i++) {
                                    self.listeners[i].add(ptTimeout.x, ptTimeout.y, ptTimeout.timeStamp);
                                }
                                sourcePoint0 = sourcePoint1;
                                sourcePoint1 = {x:ptTimeout.x, y:ptTimeout.y};
                                ptTimeout = null;
                                addSampleTimeout = null;
                                lg0 = lg1;
                            }, this.maxIdleTime);
                        }
                    }
                }
            } else {
                ptTimeout = {x:x, y:y, timeStamp:timeStamp};
                if (addSampleTimeout == null) {
                    addSampleTimeout = setTimeout(function () {
                        self.stats.timeout++;
                        self.points.push({x:ptTimeout.x, y:ptTimeout.y});
                        for (var i=0; i < self.listeners.length; i++) {
                            self.listeners[i].add(ptTimeout.x, ptTimeout.y, ptTimeout.timeStamp);
                        }
                        sourcePoint0 = sourcePoint1;
                        sourcePoint1 = {x:ptTimeout.x, y:ptTimeout.y};
                        ptTimeout = null;
                        addSampleTimeout = null;
                        lg0 = lg1;
                    }, this.maxIdleTime);
                }
            }
        };

        this.endSample = function() {
            if (addSampleTimeout != null) clearTimeout(addSampleTimeout);
            addSampleTimeout = null;
            if (ptTimeout != null) {
                this.points.push({x:ptTimeout.x, y:ptTimeout.y});
                for (var i=0; i < this.listeners.length; i++) {
                    this.listeners[i].add(ptTimeout.x, ptTimeout.y, ptTimeout.timeStamp);
                }
            }
            sourcePoint0 = null;
            sourcePoint1 = null;
            ptTimeout = null;
            lg0 = 0;
            lg1 = 0;
            for (var i=0; i < this.listeners.length; i++) {
                this.listeners[i].end();
            }
        };

    }

    /**
     * Adding a listener to interpolate the subset of significant positions extracted by PointSampler.
     * Each listener must implement begin() function : called at start of each sample.
     * Each listener must implement add(x, y, timeStamp) function : called for each significant position.
     * Each listener must implement end() function : called at end of each sample.
     *
     * @param object listener Interpolator
     */
    PointSampler.prototype.addListener = function(listener) {
        this.listeners.push(listener);
    };

    return PointSampler;
})();
