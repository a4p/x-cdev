'use strict';

// Namespace a4p
var a4p;
if (!a4p) a4p = {};

/**
 * Management of scrolling
 */
a4p.Scroll = (function (navigator, window, document) {

    function scrollbarH(self) {
        if (!self.hScrollbar) {
            if (self.hScrollbarWrapper) {
                if (a4p.BrowserCapabilities.hasTransform) {
                    self.hScrollbarIndicator.style[a4p.BrowserCapabilities.transform] = '';
                }
                self.DOMelement.removeChild(self.hScrollbarWrapper);
                self.hScrollbarWrapper = null;
                self.hScrollbarIndicator = null;
            }
            return;
        }
        if (!self.hScrollbarWrapper) {
            // Create the scrollbar wrapper
            var bar = document.createElement('div');
            if (self.options.scrollbarClass) {
                bar.className = self.options.scrollbarClass + 'H';
            } else {
                bar.style.position = 'absolute';
                bar.style.zIndex = '100';
                bar.style.height = '7px';
                bar.style.bottom = '1px';
                bar.style.left = '2px';
                bar.style.right = (self.vScrollbar ? '7' : '2') + 'px';
                /*
                bar.style.cssText = 'position:absolute;z-index:100;'
                    + 'height:7px;bottom:1px;left:2px;right:' + (self.vScrollbar ? '7' : '2') + 'px';
                */
            }
            bar.style.overflow = 'hidden';
            bar.style.opacity = (self.options.hideScrollbar ? '0' : '1');
            bar.style.pointerEvents = 'none';
            bar.style[a4p.BrowserCapabilities.transitionProperty] = 'opacity';
            bar.style[a4p.BrowserCapabilities.transitionDuration] = (self.options.fadeScrollbar ? '350ms' : '0ms');
            /*
            bar.style.cssText += ';pointer-events:none;'
                + a4p.BrowserCapabilities.cssVendor + 'transition-property:opacity;'
                + a4p.BrowserCapabilities.cssVendor + 'transition-duration:'
                + (self.options.fadeScrollbar ? '350ms' : '0') + ';overflow:hidden;opacity:'
                + (self.options.hideScrollbar ? '0' : '1');
            */
            self.DOMelement.appendChild(bar);
            self.hScrollbarWrapper = bar;
            // Create the scrollbar indicator
            bar = document.createElement('div');
            if (!self.options.scrollbarClass) {
                bar.style.position = 'absolute';
                bar.style.zIndex = '100';
                bar.style.height = '100%';
                bar.style.backgroundColor = 'rgba(0,0,0,0.5)';
                bar.style.borderWidth = '1px';
                bar.style.borderStyle = 'solid';
                bar.style.borderColor = 'rgba(255,255,255,0.9)';
                bar.style[a4p.BrowserCapabilities.vendor + 'BackgroundClip'] = 'padding-box';
                bar.style.boxSizing = 'border-box';
                bar.style[a4p.BrowserCapabilities.vendor + 'BoxSizing'] = 'border-box';
                bar.style.borderRadius = '3px';
                bar.style[a4p.BrowserCapabilities.vendor + 'BorderRadius'] = '3px';
                /*
                bar.style.cssText =
                    'position:absolute;z-index:100;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);'
                        + a4p.BrowserCapabilities.cssVendor + 'background-clip:padding-box;'
                        + a4p.BrowserCapabilities.cssVendor + 'box-sizing:border-box;'
                        + 'height:100%;'
                        + a4p.BrowserCapabilities.cssVendor + 'border-radius:3px;border-radius:3px';
                */
            }
            bar.style.pointerEvents = 'none';
            bar.style[a4p.BrowserCapabilities.transitionProperty] = a4p.BrowserCapabilities.cssVendor + 'transform';
            bar.style[a4p.BrowserCapabilities.transitionTimingFunction] = 'cubic-bezier(0.33,0.66,0.66,1)';
            bar.style[a4p.BrowserCapabilities.transitionDuration] = '0ms';
            bar.style[a4p.BrowserCapabilities.transform] = 'translate(0,0)' + a4p.BrowserCapabilities.translateZ;
            /*
            bar.style.cssText += ';pointer-events:none;'
                + a4p.BrowserCapabilities.cssVendor + 'transition-property:'
                + a4p.BrowserCapabilities.cssVendor + 'transform;'
                + a4p.BrowserCapabilities.cssVendor + 'transition-timing-function:cubic-bezier(0.33,0.66,0.66,1);'
                + a4p.BrowserCapabilities.cssVendor + 'transition-duration:0;'
                + a4p.BrowserCapabilities.cssVendor + 'transform: translate(0,0)' + a4p.BrowserCapabilities.translateZ;
            */
            if (self.options.useTransition) {
                bar.style[a4p.BrowserCapabilities.transitionTimingFunction] = 'cubic-bezier(0.33,0.66,0.66,1)';
                /*
                bar.style.cssText += ';'
                    + a4p.BrowserCapabilities.cssVendor + 'transition-timing-function:cubic-bezier(0.33,0.66,0.66,1)';
                */
            }
            self.hScrollbarWrapper.appendChild(bar);
            self.hScrollbarIndicator = bar;
        }
        var margins = 2 + (self.vScrollbar ? 7 : 2);
        self.hScrollbarWrapper.style.width = (self.wrapperW - margins)+ 'px';
        self.hScrollbarIndicatorSize = Math.max(Math.round((self.wrapperW - margins) * self.wrapperW / self.scrollerW), 8);
        self.hScrollbarIndicator.style.width = self.hScrollbarIndicatorSize + 'px';
        self.hScrollbarMaxScroll = (self.wrapperW - margins) - self.hScrollbarIndicatorSize;
        self.hScrollbarProp = self.hScrollbarMaxScroll / self.maxScrollX;
        // Reset position
        scrollbarPosH(self, true);
    }
    function scrollbarV(self) {
        if (!self.vScrollbar) {
            if (self.vScrollbarWrapper) {
                if (a4p.BrowserCapabilities.hasTransform) self.vScrollbarIndicator.style[a4p.BrowserCapabilities.transform] = '';
                self.DOMelement.removeChild(self.vScrollbarWrapper);
                self.vScrollbarWrapper = null;
                self.vScrollbarIndicator = null;
            }
            return;
        }
        if (!self.vScrollbarWrapper) {
            // Create the scrollbar wrapper
            var bar = document.createElement('div');
            if (self.options.scrollbarClass) {
                bar.className = self.options.scrollbarClass + 'V';
            } else {
                bar.style.position = 'absolute';
                bar.style.zIndex = '100';
                bar.style.width = '7px';
                bar.style.right = '1px';
                bar.style.top = '2px';
                bar.style.bottom = (self.hScrollbar ? '7' : '2') + 'px';
                /*
                bar.style.cssText = 'position:absolute;z-index:100;'
                    + 'width:7px;bottom:' + (self.hScrollbar ? '7' : '2') + 'px;top:2px;right:1px';
                */
            }
            bar.style.overflow = 'hidden';
            bar.style.opacity = (self.options.hideScrollbar ? '0' : '1');
            bar.style.pointerEvents = 'none';
            bar.style[a4p.BrowserCapabilities.transitionProperty] = 'opacity';
            bar.style[a4p.BrowserCapabilities.transitionDuration] = (self.options.fadeScrollbar ? '350ms' : '0ms');
            /*
            bar.style.cssText += ';pointer-events:none;'
                + a4p.BrowserCapabilities.cssVendor + 'transition-property:opacity;'
                + a4p.BrowserCapabilities.cssVendor + 'transition-duration:'
                + (self.options.fadeScrollbar ? '350ms' : '0') + ';overflow:hidden;opacity:'
                + (self.options.hideScrollbar ? '0' : '1');
            */
            self.DOMelement.appendChild(bar);
            self.vScrollbarWrapper = bar;
            // Create the scrollbar indicator
            bar = document.createElement('div');
            if (!self.options.scrollbarClass) {
                bar.style.position = 'absolute';
                bar.style.zIndex = '100';
                bar.style.width = '100%';
                bar.style.backgroundColor = 'rgba(0,0,0,0.5)';
                bar.style.borderWidth = '1px';
                bar.style.borderStyle = 'solid';
                bar.style.borderColor = 'rgba(255,255,255,0.9)';
                bar.style[a4p.BrowserCapabilities.vendor + 'BackgroundClip'] = 'padding-box';
                bar.style.boxSizing = 'border-box';
                bar.style[a4p.BrowserCapabilities.vendor + 'BoxSizing'] = 'border-box';
                bar.style.borderRadius = '3px';
                bar.style[a4p.BrowserCapabilities.vendor + 'BorderRadius'] = '3px';
                /*
                bar.style.cssText =
                    'position:absolute;z-index:100;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);'
                        + a4p.BrowserCapabilities.cssVendor + 'background-clip:padding-box;'
                        + a4p.BrowserCapabilities.cssVendor + 'box-sizing:border-box;'
                        + 'width:100%;'
                        + a4p.BrowserCapabilities.cssVendor + 'border-radius:3px;border-radius:3px';
                */
            }
            bar.style.pointerEvents = 'none';
            bar.style[a4p.BrowserCapabilities.transitionProperty] = a4p.BrowserCapabilities.cssVendor + 'transform';
            bar.style[a4p.BrowserCapabilities.transitionTimingFunction] = 'cubic-bezier(0.33,0.66,0.66,1)';
            bar.style[a4p.BrowserCapabilities.transitionDuration] = '0ms';
            bar.style[a4p.BrowserCapabilities.transform] = 'translate(0,0)' + a4p.BrowserCapabilities.translateZ;
            /*
            bar.style.cssText += ';pointer-events:none;'
                + a4p.BrowserCapabilities.cssVendor + 'transition-property:'
                + a4p.BrowserCapabilities.cssVendor + 'transform;'
                + a4p.BrowserCapabilities.cssVendor + 'transition-timing-function:cubic-bezier(0.33,0.66,0.66,1);'
                + a4p.BrowserCapabilities.cssVendor + 'transition-duration:0;'
                + a4p.BrowserCapabilities.cssVendor + 'transform: translate(0,0)' + a4p.BrowserCapabilities.translateZ;
            */
            if (self.options.useTransition) {
                bar.style[a4p.BrowserCapabilities.transitionTimingFunction] = 'cubic-bezier(0.33,0.66,0.66,1)';
                /*
                bar.style.cssText += ';'
                    + a4p.BrowserCapabilities.cssVendor + 'transition-timing-function:cubic-bezier(0.33,0.66,0.66,1)';
                */
            }
            self.vScrollbarWrapper.appendChild(bar);
            self.vScrollbarIndicator = bar;
        }
        var margins = 2 + (self.hScrollbar ? 7 : 2);
        self.vScrollbarWrapper.style.height = (self.wrapperH - margins)+ 'px';
        self.vScrollbarIndicatorSize = Math.max(Math.round((self.wrapperH - margins) * self.wrapperH / self.scrollerH), 8);
        self.vScrollbarIndicator.style.height = self.vScrollbarIndicatorSize + 'px';
        self.vScrollbarMaxScroll = (self.wrapperH - margins) - self.vScrollbarIndicatorSize;
        self.vScrollbarProp = self.vScrollbarMaxScroll / self.maxScrollY;
        // Reset position
        scrollbarPosV(self, true);
    }

    function pos(self, x, y, reset) {
        if (self.zoomed) return;

        var deltaX = self.hScroll ? (x - self.x) : 0;
        var deltaY = self.vScroll ? (y - self.y) : 0;
        if (!reset && self.options.onBeforeScrollMove) {
            self.options.onBeforeScrollMove.call(self, deltaX, deltaY);
            x = self.x + deltaX;
            y = self.y + deltaY;
        }

        x = self.hScroll ? x : 0;
        y = self.vScroll ? y : 0;

        if (self.options.useTransform) {
            self.scroller.style[a4p.BrowserCapabilities.transform] =
                'translate(' + x + 'px,' + y + 'px) scale(' + self.scale + ')' + a4p.BrowserCapabilities.translateZ;
        } else {
            x = Math.round(x);
            y = Math.round(y);
            self.scroller.style.left = x + 'px';
            self.scroller.style.top = y + 'px';
        }

        self.x = x;
        self.y = y;
        //console.log('Scroll : pos() x=' + x + ' y=' + y);

        scrollbarPosH(self);
        scrollbarPosV(self);
    }

    function scrollbarPosH(self, hidden) {
        var pos = self.x,
            size;

        if (!self.hScrollbar) return;

        pos = self.hScrollbarProp * pos;

        if (pos < 0) {
            if (!self.options.fixedScrollbar) {
                size = self.hScrollbarIndicatorSize + Math.round(pos * 3);
                if (size < 8) size = 8;
                self.hScrollbarIndicator.style.width = size + 'px';
            }
            pos = 0;
        } else if (pos > self.hScrollbarMaxScroll) {
            if (!self.options.fixedScrollbar) {
                size = self.hScrollbarIndicatorSize - Math.round((pos - self.hScrollbarMaxScroll) * 3);
                if (size < 8) size = 8;
                self.hScrollbarIndicator.style.width = size + 'px';
                pos = self.hScrollbarMaxScroll + (self.hScrollbarIndicatorSize - size);
            } else {
                pos = self.hScrollbarMaxScroll;
            }
        }

        self.hScrollbarWrapper.style[a4p.BrowserCapabilities.transitionDelay] = '0';
        self.hScrollbarWrapper.style.opacity = (hidden && self.options.hideScrollbar) ? '0' : '1';
        self.hScrollbarIndicator.style[a4p.BrowserCapabilities.transform] =
            'translate(' + pos + 'px,0)' + a4p.BrowserCapabilities.translateZ;
    }
    function scrollbarPosV(self, hidden) {
        var pos = self.y, size;

        if (!self.vScrollbar) return;

        pos = self.vScrollbarProp * pos;

        if (pos < 0) {
            if (!self.options.fixedScrollbar) {
                size = self.vScrollbarIndicatorSize + Math.round(pos * 3);
                if (size < 8) size = 8;
                self.vScrollbarIndicator.style.height = size + 'px';
            }
            pos = 0;
        } else if (pos > self.vScrollbarMaxScroll) {
            if (!self.options.fixedScrollbar) {
                size = self.vScrollbarIndicatorSize - Math.round((pos - self.vScrollbarMaxScroll) * 3);
                if (size < 8) size = 8;
                self.vScrollbarIndicator.style.height = size + 'px';
                pos = self.vScrollbarMaxScroll + (self.vScrollbarIndicatorSize - size);
            } else {
                pos = self.vScrollbarMaxScroll;
            }
        }

        self.vScrollbarWrapper.style[a4p.BrowserCapabilities.transitionDelay] = '0';
        self.vScrollbarWrapper.style.opacity = (hidden && self.options.hideScrollbar) ? '0' : '1';
        self.vScrollbarIndicator.style[a4p.BrowserCapabilities.transform] =
            'translate(0,' + pos + 'px)' + a4p.BrowserCapabilities.translateZ;
    }

    function resetPos(self, time) {
        var resetX = self.x >= 0 ? 0 : self.x < self.maxScrollX ? self.maxScrollX : self.x,
            resetY = self.y >= -self.options.topOffset || self.maxScrollY > 0 ? -self.options.topOffset : self.y < self.maxScrollY ? self.maxScrollY : self.y;

        if (resetX == self.x && resetY == self.y) {
            if (self.moved) {
                self.moved = false;
                if (self.options.onAfterScrollEnd) {
                    self.options.onAfterScrollEnd.call(self);
                }
            }

            if (self.hScrollbar && self.options.hideScrollbar) {
                if (a4p.BrowserCapabilities.vendor == 'webkit') self.hScrollbarWrapper.style[a4p.BrowserCapabilities.transitionDelay] = '300ms';
                self.hScrollbarWrapper.style.opacity = '0';
            }
            if (self.vScrollbar && self.options.hideScrollbar) {
                if (a4p.BrowserCapabilities.vendor == 'webkit') self.vScrollbarWrapper.style[a4p.BrowserCapabilities.transitionDelay] = '300ms';
                self.vScrollbarWrapper.style.opacity = '0';
            }

            return;
        }

        // Do not call onBeforeMove() because it's a reset
        //console.log('Scroll : resetPos() scrollTo x=' + resetX + ' y=' + resetY);
        self.scrollTo(resetX, resetY, time || 0, false, true);
    }

    function transitionEnd(self, e) {
        if (e.target != self.scroller) return;
        if (self.bindTransitionEnd) {
            self.bindTransitionEnd.destroy();
            self.bindTransitionEnd = null;
        }
        startAni(self);
    }

    function startAni(self) {
        if (self.animating) return;

        if (!self.steps.length) {
            resetPos(self, 400);
            return;
        }

        var startTime = (new Date()).getTime();
        var step = self.steps.shift();
        //console.log('Scroll : startAni() steps.shift : deltaX=' + step.deltaX + ' deltaY=' + step.deltaY);

        if (step.deltaX == 0 && step.deltaY == 0) step.time = 0;

        self.animating = true;
        self.moved = true;

        if (self.options.useTransition) {
            transitionTime(self, step.time);
            //console.log('Scroll : startAni() x=' + (self.x + step.deltaX) + ' y=' + (self.y + step.deltaY));
            pos(self, self.x + step.deltaX, self.y + step.deltaY, step.reset);
            self.animating = false;
            if (step.time) {
                var handler = function (evt) {transitionEnd(self, evt);};
                self.scroller.addEventListener(a4p.BrowserCapabilities.TRNEND_EVENT, handler, false);
                self.bindTransitionEnd = {
                    destroy: function () {
                        self.scroller.removeEventListener(a4p.BrowserCapabilities.TRNEND_EVENT, handler, false);
                    }
                }
            }
            else resetPos(self, 0);
        } else {
            var animate = function () {
                var now = (new Date()).getTime();
                if ((now >= startTime + step.time) || ((step.deltaX < 5) && (step.deltaX > -5) && (step.deltaY < 5) && (step.deltaY > -5))) {
                    //console.log('Scroll : animate1() x=' + (self.x + step.deltaX) + ' y=' + (self.y + step.deltaY));
                    pos(self, self.x + step.deltaX, self.y + step.deltaY, step.reset);
                    self.animating = false;
                    // Execute next animation step
                    startAni(self);
                } else {
                    var ratio = (now - startTime) / step.time;
                    //var easeOut = Math.sqrt(1 - (1-ratio) * (1-ratio));
                    var easeOut = Math.sqrt(ratio);
                    var deltaX = Math.floor(step.deltaX * easeOut);
                    var deltaY = Math.floor(step.deltaY * easeOut);
                    step.deltaX -= deltaX;
                    step.deltaY -= deltaY;
                    /*
                    now = (now - startTime) / step.time - 1;
                    easeOut = Math.sqrt(1 - now * now);
                    newX = step.deltaX * easeOut + self.x;
                    newY = step.deltaY * easeOut + self.y;
                    */
                    //console.log('Scroll : animate2() x=' + (self.x + step.deltaX) + ' y=' + (self.y + step.deltaY));
                    pos(self, self.x + deltaX, self.y + deltaY, step.reset);
                    if (self.animating) {
                        self.aniTime = a4p.BrowserCapabilities.nextFrame(animate);
                    }
                }
            };
            animate();
        }
    }

    function stopAni(self) {
        if (self.options.useTransition) {
            if (self.bindTransitionEnd) {
                self.bindTransitionEnd.destroy();
                self.bindTransitionEnd = null;
            }
        } else {
            if (self.aniTime) {
                a4p.BrowserCapabilities.cancelFrame(self.aniTime);
                self.aniTime = null;
            }
        }
    }

    function stopMomentum(self) {
        if (self.options.momentum > 0) {
            var x, y;
            if (self.options.useTransform) {
                // Very lame general purpose alternative to CSSMatrix
                var matrix = getComputedStyle(self.scroller, null)[a4p.BrowserCapabilities.transform].replace(/[^0-9\-.,]/g, '').split(',');
                x = +(matrix[12] || matrix[4] || 0);
                y = +(matrix[13] || matrix[5] || 0);
            } else {
                x = +getComputedStyle(self.scroller, null).left.replace(/[^0-9-]/g, '') || 0;
                y = +getComputedStyle(self.scroller, null).top.replace(/[^0-9-]/g, '') || 0;
            }
            if (x != self.x || y != self.y) {
                var deltaX = x - self.x;
                var deltaY = y - self.y;
                stopAni(self);
                self.steps = [];
                //console.log('Scroll : stopMomentum() x=' + (self.x + deltaX) + ' y=' + (self.y + deltaY));
                pos(self, self.x + deltaX, self.y + deltaY);
                if (self.options.onAfterScrollEnd) {
                    self.options.onAfterScrollEnd.call(self);
                }
            }
        }
    }

    function transitionTime(self, time) {
        time += 'ms';
        self.scroller.style[a4p.BrowserCapabilities.transitionDuration] = time;
        if (self.hScrollbar) self.hScrollbarIndicator.style[a4p.BrowserCapabilities.transitionDuration] = time;
        if (self.vScrollbar) self.vScrollbarIndicator.style[a4p.BrowserCapabilities.transitionDuration] = time;
    }

    function offset(self, el) {
        var left = el.offsetLeft,
            top = el.offsetTop;

        while (el = el.offsetParent) {
            left += el.offsetLeft;
            top += el.offsetTop;
        }

        if (el != self.DOMelement) {
            left *= self.scale;
            top *= self.scale;
        }

        return {left: left, top: top};
    }

    function momentumPos(self, deltaX, deltaY, time, momentum) {
        var deceleration = 0.006;
        var speedX = Math.abs(deltaX) / time;// [0.5,1.5] for mouse, 0.5 for wheel
        var speedY = Math.abs(deltaY) / time;
        if (deltaX != 0) {
            var newDistX = momentum * speedX;
            //console.log("speedX=" + speedX + ", speedY=" + speedY + ", newDistX=" + newDistX);
            //var newDistX = Math.abs(deltaX * momentum);
            // Proportionally reduce speed if we are outside of the boundaries
            if (!self.options.virtualLoop) {
                var xMaxDistUpper = -self.x;
                var xMaxDistLower = self.x - self.maxScrollX;
                if ((deltaX > 0) && (newDistX > xMaxDistUpper)) {
                    if (self.options.bounce) {
                        newDistX = xMaxDistUpper + (newDistX - xMaxDistUpper)*(newDistX - xMaxDistUpper)/self.wrapperW;
                    } else {
                        newDistX = xMaxDistUpper;
                    }
                    //console.log("slowing newDistX=" + newDistX);
                } else if ((deltaX < 0) && (newDistX > xMaxDistLower)) {
                    if (self.options.bounce) {
                        newDistX = xMaxDistLower + (newDistX - xMaxDistLower)*(newDistX - xMaxDistLower)/self.wrapperW;
                    } else {
                        newDistX = xMaxDistLower;
                    }
                    //console.log("slowing newDistX=" + newDistX);
                }
            }
            deltaX = newDistX * (deltaX < 0 ? -1 : 1);
        }
        if (deltaY != 0) {
            //console.log('Scroll : momentumPos() 1 deltaY=' + deltaY + ' time=' + time + ' momentum=' + momentum + ' speedY=' + speedY);
            var newDistY = momentum * speedY;
            //console.log("speedX=" + speedX + ", speedY=" + speedY + ", newDistY=" + newDistY);
            //var newDistY = Math.abs(deltaY * momentum);
            // Proportionally reduce speed if we are outside of the boundaries
            if (!self.options.virtualLoop) {
                var yMaxDistUpper = -self.y;
                var yMaxDistLower = self.y - self.maxScrollY;
                var ySize = self.options.bounce ? self.wrapperH : 0;
                if ((deltaY > 0) && (newDistY > yMaxDistUpper)) {
                    /*
                    newDistY *= yMaxDistUpper / newDistY;
                    yMaxDistUpper += ySize * speedY / 3;
                    speedY *= yMaxDistUpper / newDistY;
                    newDistY = yMaxDistUpper;
                    */
                    if (self.options.bounce) {
                        newDistY = yMaxDistUpper + (newDistY - yMaxDistUpper)*(newDistY - yMaxDistUpper)/self.wrapperH;
                    } else {
                        newDistY = yMaxDistUpper;
                    }
                    //console.log("slowing newDistY=" + newDistY);
                } else if ((deltaY < 0) && (newDistY > yMaxDistLower)) {
                    /*
                    yMaxDistLower = yMaxDistLower + ySize * speedY / 3;
                    speedY *= yMaxDistLower / newDistY;
                    newDistY = yMaxDistLower;
                    */
                    if (self.options.bounce) {
                        newDistY = yMaxDistLower + (newDistY - yMaxDistLower)*(newDistY - yMaxDistLower)/self.wrapperH;
                    } else {
                        newDistY = yMaxDistLower;
                    }
                    //console.log("slowing newDistY=" + newDistY);
                }
            }
            deltaY = newDistY * (deltaY < 0 ? -1 : 1);
            //console.log('Scroll : momentumPos() 2 deltaY=' + deltaY);
        }

        time = Math.round(Math.max(speedX, speedY) * momentum / deceleration);
        //time = Math.round(time * momentum);
        return {deltaX:deltaX, deltaY:deltaY, time:time};
    }

    function snapPos(self, x, y) {
        var i, l,
            page, time,
            sizeX, sizeY;

        // Check page X
        page = self.pagesX.length - 1;
        for (i = 0, l = self.pagesX.length; i < l; i++) {
            if (x >= self.pagesX[i]) {
                page = i;
                break;
            }
        }
        if (page == self.currPageX && page > 0 && self.dirX < 0) page--;
        x = self.pagesX[page];
        sizeX = Math.abs(x - self.pagesX[self.currPageX]);
        sizeX = sizeX ? Math.abs(self.x - x) / sizeX * 500 : 0;
        self.currPageX = page;

        // Check page Y
        page = self.pagesY.length - 1;
        for (i = 0; i < page; i++) {
            if (y >= self.pagesY[i]) {
                page = i;
                break;
            }
        }
        if (page == self.currPageY && page > 0 && self.dirY < 0) page--;
        y = self.pagesY[page];
        sizeY = Math.abs(y - self.pagesY[self.currPageY]);
        sizeY = sizeY ? Math.abs(self.y - y) / sizeY * 500 : 0;
        self.currPageY = page;

        // Snap with constant speed (proportional duration)
        time = Math.round(Math.max(sizeX, sizeY)) || 200;

        return { x: x, y: y, time: time };
    }

    function Scroll(element, options) {
        // JQLite element
        this.element = element;

        // DOM element
        if (typeof(element) == 'object') {
            this.DOMelement = element[0];
        } else {
            this.DOMelement = document.getElementById(element);
        }
        this.scroller = this.DOMelement.children[0];

        // Default options
        this.options = {
            name:'',

            hScroll: true,
            vScroll: true,
            x: 0,
            y: 0,
            bounce: true,
            bounceLock: false,
            momentum: 100,
            virtualLoop: false,
            useTransform: true,
            useTransition: false,
            topOffset: 0,
            bottomOffset: 0,

            // Scrollbar
            hScrollbar: true,
            vScrollbar: true,
            fixedScrollbar: a4p.BrowserCapabilities.isAndroid,
            hideScrollbar: a4p.BrowserCapabilities.isIDevice,
            fadeScrollbar: a4p.BrowserCapabilities.isIDevice && a4p.BrowserCapabilities.has3d,
            scrollbarClass: '', // Apply a css class named this value + suffixe of 'H' or 'V' to the scrollbar wrapper

            // Zoom
            zoom: false,
            zoomMin: 1,
            zoomMax: 4,
            wheelAction: 'scroll',// or 'zoom' or 'none'

            // Snap
            pageSelector: null,// string value for querySelectorAll()
            snap: false,// true to snap to pages
            snapThreshold: 1,// minimal scroll distance to trigger snap to other page (else scroller returns to start pos)

            // Events
            onRefresh: null,
            onDestroy: null,
            onBeforeScrollMove: null,
            onAfterScrollEnd: null,
            onZoomStart: null,
            onZoom: null,
            onZoomEnd: null
        };
        // User defined options
        for (var i in options) {
            if (!options.hasOwnProperty(i)) continue;
            this.options[i] = options[i];
        }
        // Normalize options
        this.options.useTransform = a4p.BrowserCapabilities.hasTransform && this.options.useTransform;
        this.options.hScrollbar = this.options.hScroll && this.options.hScrollbar;
        this.options.vScrollbar = this.options.vScroll && this.options.vScrollbar;
        if (this.options.wheelAction == 'zoom') this.options.zoom = true;
        if (this.options.zoom && !this.options.useTransform) {
            a4p.ErrorLog.log("a4p.sense", "Zoom option impossible because Browser cannot use transform");
        }
        this.options.zoom = this.options.useTransform && this.options.zoom;
        this.options.useTransition = a4p.BrowserCapabilities.hasTransitionEnd && this.options.useTransition;
        if (this.options.useTransition) this.options.fixedScrollbar = true;

        //this.minScrollY = -this.options.topOffset || 0;

        // Styling
        this.DOMelement.style.overflow = 'hidden';
        this.DOMelement.style.position = 'relative';/* to have scrollbar right positionned in this container */
        this.scroller.style[a4p.BrowserCapabilities.transitionProperty] =
            this.options.useTransform ? a4p.BrowserCapabilities.cssVendor + 'transform' : 'top left';
        this.scroller.style[a4p.BrowserCapabilities.transitionDuration] = '0';
        this.scroller.style[a4p.BrowserCapabilities.transformOrigin] = '0 0';
        if (this.options.useTransition) {
            this.scroller.style[a4p.BrowserCapabilities.transitionTimingFunction] =
                'cubic-bezier(0.33,0.66,0.66,1)';
        }
        if (this.options.useTransform) {
            this.scroller.style[a4p.BrowserCapabilities.transform] =
                'translate(' + this.x + 'px,' + this.y + 'px)' + a4p.BrowserCapabilities.translateZ;
        } else {
            this.scroller.style.position = 'absolute';
            this.scroller.style.top = this.y + 'px';
            this.scroller.style.left = this.x + 'px';
        }

        this.x = 0;
        this.y = 0;
        this.enabled = true;
        this.steps = [];
        this.scale = 1;
        this.currPageX = 0;
        this.currPageY = 0;
        this.pagesX = [];
        this.pagesY = [];
        this.aniTime = null;
        this.bindTransitionEnd = null;
        this.wheelZoomCount = 0;
        this.scrollCount = 0;
        this.scrollHistory = [];

        this.hScroll = false;// Flag to do horizontal scrolling on mouse/touch down/move/up or mouse wheel
        this.vScroll = false;// Flag to do vertical scrolling on mouse/touch down/move/up or mouse wheel

        this.hScrollbar = false;// Flag to show horizontal scroll bar
        this.vScrollbar = false;// Flag to show vertical scroll bar

        // Calulate other attributes
        this.refresh();
        // Set starting position without calling onBeforeMove()
        //console.log('Scroll : constructor() scrollTo x=' + this.options.x + ' y=' + this.options.y);
        this.scrollTo(this.options.x, this.options.y, 0, false, true);
    }

    Scroll.prototype.destroy = function () {
        this.scroller.style[a4p.BrowserCapabilities.transform] = '';

        // Remove the scrollbars
        this.hScrollbar = false;
        this.vScrollbar = false;
        scrollbarH(this);
        scrollbarV(this);

        if (this.bindTransitionEnd) {
            this.bindTransitionEnd.destroy();
            this.bindTransitionEnd = null;
        }

        if (this.options.onDestroy) this.options.onDestroy.call(this);
    };

    Scroll.prototype.checkDOMChanges = function () {
        return this.isReady()
            && ((this.wrapperW != (this.DOMelement.offsetWidth || 1))
            || (this.wrapperH != (this.DOMelement.offsetHeight || 1))
            || (this.scrollerW != Math.round(this.scroller.offsetWidth * this.scale))
            || (this.scrollerH != Math.round((this.scroller.offsetHeight - this.options.topOffset - this.options.bottomOffset) * this.scale)));
    };

    Scroll.prototype.setScale = function (scale) {
        this.scale = scale;
        if (this.scale < this.options.zoomMin) this.scale = this.options.zoomMin;
    };

    Scroll.prototype.refresh = function () {
        var wrapperOffset, i, l, els;

        this.wrapperW = this.DOMelement.offsetWidth || 1;
        this.wrapperH = this.DOMelement.offsetHeight || 1;

        this.scrollerW = Math.round(this.scroller.offsetWidth * this.scale);
        this.scrollerH = Math.round((this.scroller.offsetHeight - this.options.topOffset - this.options.bottomOffset) * this.scale);
        this.maxScrollX = this.wrapperW - this.scrollerW;
        if (this.maxScrollX > 0) this.maxScrollX = 0;
        this.maxScrollY = this.wrapperH - this.scrollerH - this.options.topOffset - this.options.bottomOffset;
        if (this.maxScrollY > 0) this.maxScrollY = 0;
        this.dirX = 0;
        this.dirY = 0;
        /*
        a4p.InternalLog.log('a4p.Scroll ' + this.options.name, "refresh wrapper=" + this.wrapperW + "," + this.wrapperH
            + ' scroller=' + this.scrollerW + "," + this.scrollerH
            + ' maxScroll=' + this.maxScrollX + "," + this.maxScrollY);
        */
        if (this.options.onRefresh) this.options.onRefresh.call(this);

        this.hScroll = this.options.hScroll && this.maxScrollX < 0;
        this.vScroll = this.options.vScroll && ((!this.options.bounceLock && !this.hScroll) || (this.scrollerH > this.wrapperH));

        this.hScrollbar = this.hScroll && this.options.hScrollbar;
        this.vScrollbar = this.vScroll && this.options.vScrollbar && this.scrollerH > this.wrapperH;

        wrapperOffset = offset(this, this.DOMelement);
        this.wrapperOffsetLeft = wrapperOffset.left;
        this.wrapperOffsetTop = wrapperOffset.top;

        // Prepare snap
        if (this.options.pageSelector) {
            this.pagesX = [];
            this.pagesY = [];
            els = this.scroller.querySelectorAll(this.options.pageSelector);
            for (i = 0, l = els.length; i < l; i++) {
                var posLT = offset(this, els[i]);
                posLT.left -= this.wrapperOffsetLeft;
                posLT.top -= this.wrapperOffsetTop;
                this.pagesX[i] = -posLT.left < this.maxScrollX ? this.maxScrollX : -posLT.left * this.scale;
                this.pagesY[i] = -posLT.top < this.maxScrollY ? this.maxScrollY : -posLT.top * this.scale;
            }
        } else if (this.options.snap) {
            var pos = 0;
            var page = 0;
            this.pagesX = [];
            while (pos >= this.maxScrollX) {
                this.pagesX[page] = pos;
                pos = pos - this.wrapperW;
                page++;
            }
            if (this.maxScrollX % this.wrapperW) this.pagesX[this.pagesX.length] = this.maxScrollX - this.pagesX[this.pagesX.length - 1] + this.pagesX[this.pagesX.length - 1];

            pos = 0;
            page = 0;
            this.pagesY = [];
            while (pos >= this.maxScrollY) {
                this.pagesY[page] = pos;
                pos = pos - this.wrapperH;
                page++;
            }
            if (this.maxScrollY % this.wrapperH) this.pagesY[this.pagesY.length] = this.maxScrollY - this.pagesY[this.pagesY.length - 1] + this.pagesY[this.pagesY.length - 1];
        }

        // Prepare the scrollbars
        scrollbarH(this);
        scrollbarV(this);

        if (!this.zoomed) {
            this.scroller.style[a4p.BrowserCapabilities.transitionDuration] = '0';
            resetPos(this, 400);
        }
    };

    Scroll.prototype.scrollTo = function (x, y, time, relative, reset) {
        //a4p.InternalLog.log('a4p.Scroll ' + this.options.name, 'scrollTo ' + x + "," + y + "," + time + "," + relative);
        this.stop();
        if (relative) {
            x = this.x - x;
            y = this.y - y;
        }
        var deltaX = x - this.x;
        var deltaY = y - this.y;
        if (deltaX || deltaY) {
            //console.log('Scroll : scrollTo() steps.push : deltaX=' + deltaX + ' deltaY=' + deltaY + ' x=' + x + ' y=' + y + ' this.x=' + this.x + ' this.y=' + this.y);
            this.steps.push({ deltaX: deltaX, deltaY: deltaY, time: time || 0, reset: reset});
            startAni(this);
        }
    };

    Scroll.prototype.scrollToElement = function (el, time) {
        var pos;
        el = el.nodeType ? el : this.scroller.querySelector(el);
        if (!el) return;

        pos = offset(this, el);
        pos.left -= this.wrapperOffsetLeft;
        pos.top -= this.wrapperOffsetTop;

        pos.left = -pos.left > 0 ? 0 : -pos.left < this.maxScrollX ? this.maxScrollX : pos.left;
        pos.top = -pos.top > -this.options.topOffset ? -this.options.topOffset : -pos.top < this.maxScrollY ? this.maxScrollY : pos.top;
        time = a4p.isUndefined(time) ? Math.max(Math.abs(pos.left) * 2, Math.abs(pos.top) * 2) : time;

        //console.log('Scroll : scrollToElement() scrollTo : x=' + -pos.left + ' y=' + -pos.top);
        this.scrollTo(-pos.left, -pos.top, time);
    };

    Scroll.prototype.scrollToPage = function (pageX, pageY, time) {
        var x, y;

        time = a4p.isUndefined(time) ? 400 : time;

        if (this.options.pageSelector) {
            pageX = pageX == 'next' ? this.currPageX + 1 : pageX == 'prev' ? this.currPageX - 1 : pageX;
            pageY = pageY == 'next' ? this.currPageY + 1 : pageY == 'prev' ? this.currPageY - 1 : pageY;

            pageX = pageX < 0 ? 0 : pageX > this.pagesX.length - 1 ? this.pagesX.length - 1 : pageX;
            pageY = pageY < 0 ? 0 : pageY > this.pagesY.length - 1 ? this.pagesY.length - 1 : pageY;

            this.currPageX = pageX;
            this.currPageY = pageY;
            x = this.pagesX[pageX];
            y = this.pagesY[pageY];
        } else {
            x = -this.wrapperW * pageX;
            y = -this.wrapperH * pageY;
            if (x < this.maxScrollX) x = this.maxScrollX;
            if (y < this.maxScrollY) y = this.maxScrollY;
        }

        //console.log('Scroll : scrollToPage() scrollTo : x=' + x + ' y=' + y);
        this.scrollTo(x, y, time);
    };

    /**
     * Indicate if scroller has attained its limits on left side
     */
    Scroll.prototype.hasAttainedSideLeft = function () {
        return !this.hScroll || (this.x >= 0);
    };
    /**
     * Indicate if scroller has attained its limits on right side
     */
    Scroll.prototype.hasAttainedSideRight = function () {
        return !this.hScroll || (this.x <= this.maxScrollX);
    };
    /**
     * Indicate if scroller has attained its limits on top side
     */
    Scroll.prototype.hasAttainedSideTop = function () {
        return !this.vScroll || (this.y >= -this.options.topOffset);
    };
    /**
     * Indicate if scroller has attained its limits on bottom side
     */
    Scroll.prototype.hasAttainedSideBottom = function () {
        return !this.vScroll || (this.y <= this.maxScrollY);
    };

    Scroll.prototype.disable = function () {
        this.stop();
        resetPos(this, 0);
        this.enabled = false;
    };

    Scroll.prototype.enable = function () {
        this.enabled = true;
    };

    Scroll.prototype.stop = function () {
        stopMomentum(this);
        stopAni(this);
        this.steps = [];
        this.moved = false;
        this.animating = false;
    };

    Scroll.prototype.zoom = function (x, y, scale, time) {
        //a4p.InternalLog.log('a4p.Scroll ' + this.options.name, 'zoom ' + x + "," + y + "," + scale + "," + time);
        var relScale = scale / this.scale;

        if (!this.options.useTransform) return;

        //console.log('zoom() : this.maxScrollX=' + this.maxScrollX + ' this.maxScrollY=' + this.maxScrollY + ' this.x=' + this.x + ' this.y=' + this.y + ' this.scale=' + this.scale + ' scale=' + scale + ' relScale=' + relScale + ' x=' + x + ' y=' + y);
        this.zoomed = true;
        time = a4p.isUndefined(time) ? 200 : time;
        x = x - this.wrapperOffsetLeft - this.x;
        y = y - this.wrapperOffsetTop - this.y;
        //this.x = x - x * relScale + this.x;
        //this.y = y - y * relScale + this.y;
        this.x = this.x * relScale;
        this.y = this.y * relScale;
        //console.log('zoom() : this.x * relScale=' + this.x + ' this.y * relScale=' + this.y);

        this.setScale(scale);
        //console.log('zoom() : setScale(' + scale + ') => this.x=' + this.x + ' this.y=' + this.y);
        this.refresh();
        //console.log('zoom() : refresh() => this.maxScrollX=' + this.maxScrollX + ' this.maxScrollY=' + this.maxScrollY + ' this.x=' + this.x + ' this.y=' + this.y);

        //console.log('zoom() : this.x=' + this.x + ' this.y=' + this.y + ' this.maxScrollX=' + this.maxScrollX + ' -this.options.topOffset=' + (-this.options.topOffset) + ' this.maxScrollY=' + this.maxScrollY);
        this.x = this.x > 0 ? 0 : this.x < this.maxScrollX ? this.maxScrollX : this.x;
        this.y = this.y > -this.options.topOffset ? -this.options.topOffset : this.y < this.maxScrollY ? this.maxScrollY : this.y;
        //console.log('zoom() : limits => this.x=' + this.x + ' this.y=' + this.y);

        this.scroller.style[a4p.BrowserCapabilities.transitionDuration] = time + 'ms';
        this.scroller.style[a4p.BrowserCapabilities.transform] =
            'translate(' + this.x + 'px,' + this.y + 'px) scale(' + scale + ')' + a4p.BrowserCapabilities.translateZ;
        this.zoomed = false;
    };

    Scroll.prototype.isReady = function () {
        return !this.moved && !this.zoomed && !this.animating;
    };

    function zoomStart(self, pageX, pageY) {
        self.zoomed = false;
        self.originX = Math.abs(pageX - self.wrapperOffsetLeft) - self.x;
        self.originY = Math.abs(pageY - self.wrapperOffsetTop) - self.y;
        if (self.options.onZoomStart) {
            self.options.onZoomStart.call(self, {pageX:pageX, pageY:pageY});
        }
    }

    function scrollStart(self) {
        if (self.options.useTransition || self.options.zoom) transitionTime(self, 0);
        self.moved = false;
        self.animating = false;
        self.distX = 0;
        self.distY = 0;
        self.absDistX = 0;
        self.absDistY = 0;
        self.dirX = 0;
        self.dirY = 0;
        self.snapStartX = self.x;
        self.snapStartY = self.y;
        stopMomentum(self);
    }

    Scroll.prototype.onZoomStart = function (pageX, pageY) {
        if (!this.enabled) return false;
        //a4p.InternalLog.log('a4p.Scroll ' + this.options.name, "onZoomStart " + pageX + "," + pageY);
        if (this.checkDOMChanges()) {
            this.refresh();
        }
        if (this.options.zoom) {
            zoomStart(this, pageX, pageY);
            return true;
        }
        return false;
    };

    Scroll.prototype.onScrollStart = function (pageX, pageY, timeStamp) {
        if (!this.enabled) return false;
        //a4p.InternalLog.log('a4p.Scroll ' + this.options.name, "onScrollStart " + pageX + "," + pageY + "," + timeStamp);

        if (this.checkDOMChanges()) {
            this.refresh();
        }

        if (this.options.zoom) zoomStart(this, pageX, pageY);
        scrollStart(this);
        this.scrollCount++;
        this.scrollHistory = [{deltaX:0, deltaY:0, timeStamp:timeStamp}];
        this.startX = this.x;
        this.startY = this.y;
        this.pointX = pageX;
        this.pointY = pageY;
        this.startTime = timeStamp;
        return true;
    };

    function zoomMove(self, scale) {
        self.zoomed = true;
        // Slow down if outside of the boundaries
        if (scale < self.options.zoomMin) {
            scale = 0.5 * self.options.zoomMin * Math.pow(2.0, scale / self.options.zoomMin);
        } else if (scale > self.options.zoomMax) {
            scale = 2.0 * self.options.zoomMax * Math.pow(0.5, self.options.zoomMax / scale);
        }
        self.lastScale = scale / self.scale;
        var newX = self.originX - self.originX * self.lastScale + self.x;
        var newY = self.originY - self.originY * self.lastScale + self.y;
        self.scroller.style[a4p.BrowserCapabilities.transform] =
            'translate(' + newX + 'px,' + newY + 'px) scale(' + scale + ')' + a4p.BrowserCapabilities.translateZ;
        if (self.options.onZoom) {
            self.options.onZoom.call(self, {scale:scale});
        }
    }

    function scrollMove(self, deltaX, deltaY) {
        var newX = self.x + deltaX,
            newY = self.y + deltaY;

        // Slow down if outside of the boundaries
        if (!self.options.virtualLoop) {
            if (newX > 0 || newX < self.maxScrollX) {
                newX = self.options.bounce ? self.x + (deltaX / 2) : newX >= 0 || self.maxScrollX >= 0 ? 0 : self.maxScrollX;
            }
            if (newY > -self.options.topOffset || newY < self.maxScrollY) {
                newY = self.options.bounce ? self.y + (deltaY / 2) : newY >= -self.options.topOffset || self.maxScrollY >= 0 ? -self.options.topOffset : self.maxScrollY;
            }
        }
        self.distX += deltaX;
        self.distY += deltaY;
        self.absDistX = Math.abs(self.distX);
        self.absDistY = Math.abs(self.distY);
        self.moved = true;
        //console.log('Scroll : scrollMove() x=' + newX + ' y=' + newY);
        pos(self, newX, newY);
        self.dirX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
        self.dirY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;
    }

    Scroll.prototype.onZoomMove = function (scale) {
        if (!this.enabled) return false;
        //a4p.InternalLog.log('a4p.Scroll ' + this.options.name, "onZoomMove " + scale);
        if (this.options.zoom && (scale != 1)) {
            zoomMove(this, scale);
            return true;
        }
        return false;
    };

    Scroll.prototype.onScrollMove = function (pageX, pageY, timeStamp, scale) {
        if (!this.enabled) return false;
        //a4p.InternalLog.log('a4p.Scroll ' + this.options.name, "onScrollMove " + pageX + "," + pageY + "," + timeStamp + "," + scale);
        var deltaX = pageX - this.pointX,
            deltaY = pageY - this.pointY;
        if (this.options.zoom && (scale != 1)) {
            zoomMove(this, scale);
            return true;// TODO : do not return to manage zoom AND scroll at the same time ?
        }
        if ((deltaX != 0) || (deltaY != 0)) {
            scrollMove(this, deltaX, deltaY);
            this.scrollCount++;
            this.scrollHistory.push({deltaX:deltaX, deltaY:deltaY, timeStamp:timeStamp});
        }
        this.pointX = pageX;
        this.pointY = pageY;
        // Memorize only last 300ms moves for momentum
        if ((timeStamp - this.startTime) > 300) {
            this.startTime = timeStamp;
            this.startX = this.x;
            this.startY = this.y;
        }
        return true;
    };

    function zoomEnd(self, scale) {
        scale = Math.max(self.options.zoomMin, scale);
        scale = Math.min(self.options.zoomMax, scale);
        self.lastScale = scale / self.scale;
        self.setScale(scale);
        self.x = self.originX - self.originX * self.lastScale + self.x;
        self.y = self.originY - self.originY * self.lastScale + self.y;
        self.scroller.style[a4p.BrowserCapabilities.transitionDuration] = '200ms';
        self.scroller.style[a4p.BrowserCapabilities.transform] =
            'translate(' + self.x + 'px,' + self.y + 'px) scale(' + self.scale + ')' + a4p.BrowserCapabilities.translateZ;
        self.zoomed = false;
        self.refresh();
        if (self.options.onZoomEnd) {
            self.options.onZoomEnd.call(self, {scale:scale});
        }
    }

    function scrollEnd(self, deltaX, deltaY, duration) {
        if (self.options.momentum > 0) {
        //if (duration < 300 && self.options.momentum) {
            //console.log('Scroll : scrollEnd() duration=' + duration);
            var momentum = momentumPos(self, deltaX, deltaY, duration, self.options.momentum);
            deltaX = momentum.deltaX;
            deltaY = momentum.deltaY;
            duration = Math.max(momentum.time, 10);
            var newPosX = self.x + deltaX;
            var newPosY = self.y + deltaY;
            if ((self.x > 0 && newPosX > 0) || (self.x < self.maxScrollX && newPosX < self.maxScrollX)) {
                deltaX = 0;
            }
            if ((self.y > -self.options.topOffset && newPosY > -self.options.topOffset) || (self.y < self.maxScrollY && newPosY < self.maxScrollY)) {
                deltaY = 0;
            }
            if (deltaX || deltaY) {
                // Do we need to snap?
                if (self.options.snap) {
                    if (Math.abs(newPosX - self.snapStartX) < self.options.snapThreshold
                        && Math.abs(newPosY - self.snapStartY) < self.options.snapThreshold) {
                        //console.log('Scroll : scrollEnd() scrollTo : x=' + self.snapStartX + ' y=' + self.snapStartY);
                        self.scrollTo(self.snapStartX, self.snapStartY, 200);
                        return;
                    }
                    var snap = snapPos(self, newPosX, newPosY);
                    newPosX = snap.x;
                    newPosY = snap.y;
                    duration = Math.max(snap.time, duration);
                } else if (self.options.pageSelector) {
                    snapPos(self, newPosX, newPosY);
                }
                newPosX = Math.round(newPosX);
                newPosY = Math.round(newPosY);
                //console.log('Scroll : scrollEnd() scrollTo : newPosX=' + newPosX + ' newPosY=' + newPosY);
                self.scrollTo(newPosX, newPosY, duration);
                return;
            }
        } else {
            // Do we need to snap?
            var newPos2X = self.x + deltaX;
            var newPos2Y = self.y + deltaY;
            if (self.options.snap) {
                if (Math.abs(newPos2X - self.snapStartX) < self.options.snapThreshold
                    && Math.abs(newPos2Y - self.snapStartY) < self.options.snapThreshold) {
                    //console.log('Scroll : scrollEnd() 2 scrollTo : x=' + self.snapStartX + ' y=' + self.snapStartY);
                    self.scrollTo(self.snapStartX, self.snapStartY, 200);
                    return;
                }
                var snap2 = snapPos(self, newPos2X, newPos2Y);
                //console.log('Scroll : scrollEnd() 2 scrollTo : newPosX=' + snap2.x + ' newPosY=' + snap2.y);
                self.scrollTo(snap2.x, snap2.y, snap2.time);
                return
            } else if (self.options.pageSelector) {
                snapPos(self, newPos2X, newPos2Y);
            }
        }
        resetPos(self, 200);
    }

    Scroll.prototype.onZoomEnd = function (scale) {
        if (!this.enabled) return false;
        //a4p.InternalLog.log('a4p.Scroll ' + this.options.name, "onZoomEnd " + scale);
        if (this.zoomed) {
            zoomEnd(this, scale);
            return true;
        }
        return false;
    };

    Scroll.prototype.onScrollEnd = function (pageX, pageY, timeStamp, scale) {
        if (!this.enabled) return false;
        //a4p.InternalLog.log('a4p.Scroll ' + this.options.name, "onScrollEnd " + pageX + "," + pageY + "," + timeStamp + "," + scale);
        //var deltaX = pageX - this.pointX,
        //    deltaY = pageY - this.pointY;
        // Cumul of all moves
        //var deltaX = this.x - this.startX,
        //    deltaY = this.y - this.startY,
        //    duration = timeStamp - this.startTime;

        if (this.zoomed) {
            zoomEnd(this, scale);
            return true;
        }
        if (!this.moved) {
            resetPos(this, 400);
            return true;
        }

        var i = this.scrollHistory.length-1;
        var lastMove = this.scrollHistory[i];
        var deltaX = lastMove.deltaX;
        var deltaY = lastMove.deltaY;
        var duration = 35;
        for(i--;i >= 0;i--) {
            var move = this.scrollHistory[i];
            if ((lastMove.timeStamp - move.timeStamp) < 300) {
                deltaX += move.deltaX;
                deltaY += move.deltaY;
                if ((lastMove.timeStamp - move.timeStamp) >= duration) {
                    duration = lastMove.timeStamp - move.timeStamp;
                }
            } else {
                break;
            }
        }
        this.scrollCount = 0;
        this.scrollHistory = [];
        scrollEnd(this, deltaX, deltaY, duration);
        return true;
    };

    // Ex of scroll :
    // 15:28:05.991 onScrollStart 1241,284,1380547685990
    // 15:28:05.993 onScrollMove 1241,284,1380547685990,1
    // 15:28:06.027 onScrollMove 1239,268,1380547686026,1
    // 15:28:06.044 onScrollMove 1239,258,1380547686044,1
    // 15:28:06.063 onScrollMove 1239,247,1380547686062,1
    // 15:28:06.083 onScrollMove 1238,235,1380547686083,1
    // 15:28:06.104 nScrollMove 1238,220,1380547686104,1
    // 15:28:06.124 onScrollMove 1237,205,1380547686124,1
    // 15:28:06.153 onScrollMove 1236,184,1380547686153,1
    // 15:28:06.186 onScrollMove 1236,163,1380547686186,1
    // 15:28:06.208 onScrollMove 1236,152,1380547686208,1
    // 15:28:06.237 onScrollMove 1235,143,1380547686237,1
    // 15:28:06.246 onScrollEnd 1235,143,1380547686246,1

    // Ex of wheel :
    // 15:28:07.650 wheel 0,-120
    // 15:28:07.672 wheel 0,-120
    // 15:28:07.692 wheel 0,-120
    // 15:28:07.722 wheel 0,-360
    // 15:28:07.754 wheel 0,-360
    // 15:28:07.790 wheel 0,-120

    Scroll.prototype.wheel = function (e, cumulatedWheelDeltaX, cumulatedWheelDeltaY) {
        //a4p.InternalLog.log('a4p.Scroll ' + this.options.name, "wheel " + e.wheelDeltaX + "," + e.wheelDeltaY);
        // By default we consider 30 fps (== 33 ms) for the first wheel, and then we take Math.min(33, delayBetween2Wheels)
        var timeStamp = e.timeStamp;
        var deltaX = 0, deltaY = 0;

        if ((a4p.isDefined(cumulatedWheelDeltaX) && (cumulatedWheelDeltaX != 0)) || (a4p.isDefined(cumulatedWheelDeltaY) && (cumulatedWheelDeltaY != 0))) {
            deltaX = cumulatedWheelDeltaX / 12;
            deltaY = cumulatedWheelDeltaY / 12;
        } else if (('wheelDeltaX' in e) && ((e.wheelDeltaX != 0) || (e.wheelDeltaY != 0))) {
            deltaX = e.wheelDeltaX / 12;
            deltaY = e.wheelDeltaY / 12;
        } else if (('wheelDelta' in e) && (e.wheelDelta != 0)) {
            deltaX = deltaY = e.wheelDelta / 12;
        } else if (('detail' in e) && (e.detail != 0)) {
            deltaX = deltaY = -e.detail * 3;
        }
        if ((deltaX == 0) && (deltaY == 0)) {
            return false;
        }

        if (this.checkDOMChanges()) {
            this.refresh();
        }

        var self = this;
        if (this.options.wheelAction == 'zoom') {
            var deltaScale = this.scale * Math.pow(2, 1 / 3 * (deltaY ? deltaY / Math.abs(deltaY) : 0));
            if (deltaScale < this.options.zoomMin) deltaScale = this.options.zoomMin;
            if (deltaScale > this.options.zoomMax) deltaScale = this.options.zoomMax;

            if (deltaScale != this.scale) {
                if (!this.wheelZoomCount && this.options.onZoomStart) {
                    this.options.onZoomStart.call(this, e);
                }
                this.wheelZoomCount++;

                this.zoom(e.pageX, e.pageY, deltaScale, 400);
                window.setTimeout(function () {
                    self.wheelZoomCount--;
                    if (!self.wheelZoomCount && self.options.onZoomEnd) {
                        self.options.onZoomEnd.call(self, e);
                    }
                }, 400);
            }

            return true;
        }

        if (this.scrollCount == 0) {
            scrollStart(this);
            this.scrollCount++;
            this.scrollHistory = [{deltaX:0, deltaY:0, timeStamp:timeStamp}];
        }
        scrollMove(this, deltaX, deltaY);
        this.scrollCount++;
        this.scrollHistory.push({deltaX:deltaX, deltaY:deltaY, timeStamp:timeStamp});
        //this.wheelTimer = window.setTimeout(function () {...}
        window.setTimeout(function () {
            //self.wheelTimer = null;
            self.scrollCount--;
            if (self.scrollCount == 1) {
                var i = self.scrollHistory.length-1;
                var lastMove = self.scrollHistory[i];
                var deltaX = lastMove.deltaX;
                var deltaY = lastMove.deltaY;
                var duration = 35;
                for(i--;i >= 0;i--) {
                    var move = self.scrollHistory[i];
                    if ((lastMove.timeStamp - move.timeStamp) < 300) {
                        deltaX += move.deltaX;
                        deltaY += move.deltaY;
                        if ((lastMove.timeStamp - move.timeStamp) >= duration) {
                            duration = lastMove.timeStamp - move.timeStamp;
                        }
                    } else {
                        break;
                    }
                }
                self.scrollCount = 0;
                self.scrollHistory = [];
                scrollEnd(self, deltaX, deltaY, duration);
            }
        }, 35);
        /*
        if (this.wheelTimer) {
            clearTimeout(this.wheelTimer);
            this.wheelTimer = null;
        }
        */
        return true;
/*
        newX = this.x + deltaX;
        newY = this.y + deltaY;
        if (((newX != this.x) || (newY != this.y)) && (this.maxScrollY < 0)) {
            if (newX > 0) newX = 0;
            else if (newX < this.maxScrollX) newX = this.maxScrollX;
            if (newY > -this.options.topOffset) newY = -this.options.topOffset;
            else if (newY < this.maxScrollY) newY = this.maxScrollY;
            this.scrollTo(newX, newY, 0);
            return true;
        }
        return false;
        */
    };

    return Scroll;
})(navigator, window, document);

/**
 * Simultaneous management of many Mouse/Touch/Timer events in one DOM element
 */
a4p.Sense = (function (navigator, window, document) {

    var dndables = [];
    var dndablesMap = {};
    var droppables = [];
    var droppablesMap = {};

    // A consistent way to create a unique ID which will never overflow.

    var uid = ['0', '0', '0'];
    var idStr = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var idNext = {
        '0': 1, '1': 2, '2': 3, '3': 4, '4': 5, '5': 6, '6': 7, '7': 8, '8': 9, '9': 10,
        'A': 11, 'B': 12, 'C': 13, 'D': 14, 'E': 15, 'F': 16, 'G': 17, 'H': 18, 'I': 19, 'J': 20,
        'K': 21, 'L': 22, 'M': 23, 'N': 24, 'O': 25, 'P': 26, 'Q': 27, 'R': 28, 'S': 29, 'T': 30,
        'U': 31, 'V': 32, 'W': 33, 'X': 34, 'Y': 35, 'Z': 0
    };

    function nextUid() {
        var index = uid.length;
        while (index) {
            index--;
            var i = idNext[uid[index]];
            uid[index] = idStr[i];
            if (i > 0) {
                return uid.join('');
            }
        }
        uid.unshift('0');
        return uid.join('');
    }

    // Binding utilities

    function handleTouchStart(sense, evt) {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'handleTouchStart');
        sense.timeStamp = (new Date()).getTime();
        sense.inTouchMove = false;
        sense.evtHandled = false;
        sense.evtTriggered = false;
        if (sense.fingers.length <= 0) {
            bindOnTouchOther(sense);
        }
        onTouchStart[sense.state].call(sense, evt);
        if (sense.evtTriggered) {
            if (!sense.options.defaultAction) preventDefault(evt);
            if (!sense.options.bubble) stopPropagation(evt);
        }
        return !sense.options.defaultAction;
    }

    function handleTouchMove(sense, evt) {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'handleTouchMove');
        // ignore multiple move events in 1 frame (at 60 fps this gives 17 ms)
        var now = (new Date()).getTime();
        if ((now - sense.timeStamp) < 17) {
            return true;
        }
        sense.timeStamp = now;
        if (!sense.inTouchMove) {
            sense.inTouchMove = true;
            //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'handleTouchMove');
        }
        sense.evtHandled = false;
        sense.evtTriggered = false;
        // Beware : target is DOM element upon which button was down
        onTouchMove[sense.state].call(sense, evt);
        if (sense.evtTriggered) {
            if (!sense.options.defaultAction) preventDefault(evt);
            if (!sense.options.bubble) stopPropagation(evt);
            unbindAllOtherExceptFor(sense)
        }
        return !sense.options.defaultAction;
    }

    function handleTouchEnd(sense, evt) {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'handleTouchEnd');
        sense.timeStamp = (new Date()).getTime();
        sense.inTouchMove = false;
        sense.evtHandled = false;
        sense.evtTriggered = false;
        // Beware : target is DOM element upon which button was down
        onTouchEnd[sense.state].call(sense, evt);
        if (sense.evtTriggered) {
            if (!sense.options.defaultAction) preventDefault(evt);
            if (!sense.options.bubble) stopPropagation(evt);
            unbindAllOtherExceptFor(sense)
        }
        if (sense.fingers.length <= 0) {
            unbindOther(sense);
        }
        return !sense.options.defaultAction;
    }

    function handleTouchCancel(sense, evt) {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'handleTouchCancel');
        sense.timeStamp = (new Date()).getTime();
        sense.inTouchMove = false;
        sense.evtHandled = false;
        sense.evtTriggered = false;
        // Beware : target is DOM element upon which button was down
        onTouchCancel[sense.state].call(sense, evt);
        if (sense.evtTriggered) {
            if (!sense.options.defaultAction) preventDefault(evt);
            if (!sense.options.bubble) stopPropagation(evt);
            unbindAllOtherExceptFor(sense)
        }
        if (sense.fingers.length <= 0) {
            unbindOther(sense);
        }
        return !sense.options.defaultAction;
    }

    function handleMouseDown(sense, evt) {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'handleMouseDown');
        sense.timeStamp = (new Date()).getTime();
        sense.inMouseMove = false;
        sense.evtHandled = false;
        sense.evtTriggered = false;
        if (sense.fingers.length <= 0) {
            bindOnMouseOther(sense);
        }
        onMouseDown[sense.state].call(sense, evt);
        if (sense.evtTriggered) {
            if (!sense.options.defaultAction) preventDefault(evt);
            if (!sense.options.bubble) stopPropagation(evt);
        }
        return !sense.options.defaultAction;
    }

    function handleMouseMove(sense, evt) {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'handleMouseMove');
        // ignore multiple move events in 1 frame (at 60 fps this gives 17 ms)
        var now = (new Date()).getTime();
        if ((now - sense.timeStamp) < 17) {
            return true;
        }
        sense.timeStamp = now;
        if (!sense.inMouseMove) {
            sense.inMouseMove = true;
            //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'handleMouseMove');
        }
        sense.evtHandled = false;
        sense.evtTriggered = false;
        // Beware : target is DOM element upon which button is moved
        onMouseMove[sense.state].call(sense, evt);
        if (sense.evtTriggered) {
            if (!sense.options.defaultAction) preventDefault(evt);
            if (!sense.options.bubble) stopPropagation(evt);
            unbindAllOtherExceptFor(sense)
        }
        return !sense.options.defaultAction;
    }

    function handleMouseUp(sense, evt) {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'handleMouseUp');
        sense.timeStamp = (new Date()).getTime();
        sense.inMouseMove = false;
        sense.evtHandled = false;
        sense.evtTriggered = false;
        // Beware : target is DOM element upon which button is released
        onMouseUp[sense.state].call(sense, evt);
        if (sense.evtTriggered) {
            if (!sense.options.defaultAction) preventDefault(evt);
            if (!sense.options.bubble) stopPropagation(evt);
            unbindAllOtherExceptFor(sense)
        }
        if (sense.fingers.length <= 0) {
            unbindOther(sense);
        }
        return !sense.options.defaultAction;
    }

    function handleWheel(sense, evt) {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'handleWheel');
        // Cumulate previously ignored wheel events
        // TODO : take into account use case of attributes deltaMode,deltaX,deltaY,deltaZ
        if (('wheelDeltaX' in evt) && ((evt.wheelDeltaX != 0) || (evt.wheelDeltaY != 0))) {
            sense.wheelDeltaX += evt.wheelDeltaX;
            sense.wheelDeltaY += evt.wheelDeltaY;
        } else if (('wheelDelta' in evt) && (evt.wheelDelta != 0)) {
            sense.wheelDeltaX += evt.wheelDelta;
            sense.wheelDeltaY += evt.wheelDelta;
        } else if (('detail' in evt) && (evt.detail != 0)) {
            sense.wheelDeltaX += -evt.detail * 36;
            sense.wheelDeltaY += -evt.detail * 36;
        }

        // ignore multiple move events in 1 frame (at 60 fps this gives 17 ms)
        var now = (new Date()).getTime();
        if ((now - sense.timeStamp) < 17) {
            return !sense.options.defaultAction;
        }
        // Reinjecting cumulated deltas into current event is IMPOSSIBLE (read-only attributes)
        /*
        if ('wheelDeltaX' in evt) {
            evt.wheelDeltaX = sense.wheelDeltaX;
            evt.wheelDeltaY = sense.wheelDeltaY;
        }
        if ('wheelDelta' in evt) {
            evt.wheelDelta = (sense.wheelDeltaY != 0) ? sense.wheelDeltaY : sense.wheelDeltaX;
        }
        if ('detail' in evt) {
            evt.detail = Math.floor((sense.wheelDeltaY != 0) ? -sense.wheelDeltaY : -sense.wheelDeltaX)/36;
        }
        */
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'handleWheel');
        if (sense.scroll) {
            //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'scroll.wheel');
            sense.scroll.wheel(evt, sense.wheelDeltaX, sense.wheelDeltaY);
        }
        // Reset cumulator
        sense.wheelDeltaX = 0;
        sense.wheelDeltaY = 0;
        sense.timeStamp = now;
        return !sense.options.defaultAction;
    }

    var mouseListeners = [];
    var touchListeners = [];
    var timeStampDocMouseMove = 0;

    function handleDocMouseMove(evt) {
        //a4p.InternalLog.log('a4p.Sense', 'handleDocMouseMove');
        // ignore multiple move events in 1 frame (at 60 fps this gives 17 ms)
        var now = (new Date()).getTime();
        if ((now - timeStampDocMouseMove) < 17) {
            return true;
        }
        timeStampDocMouseMove = now;
        // mouseListeners array can be modified during call of handlers => we make a copy
        var i, nb, handlers = [];
        for (i = 0, nb = mouseListeners.length; i < nb; i++) {
            handlers.push(mouseListeners[i]);
        }
        var noBubble = false;
        for (i = 0, nb = handlers.length; i < nb; i++) {
            if (a4p.isDefined(handlers[i])) {
                handleMouseMove(handlers[i], evt);
                noBubble = handlers[i].evtTriggered && !handlers[i].options.bubble;
            }
            if (noBubble) break;
        }
        return true;
    }

    function handleDocMouseUp(evt) {
        //a4p.InternalLog.log('a4p.Sense', 'handleDocMouseUp');
        // mouseListeners array can be modified during call of handlers => we make a copy
        var i, nb, handlers = [];
        for (i = 0, nb = mouseListeners.length; i < nb; i++) {
            handlers.push(mouseListeners[i]);
        }
        var noBubble = false;
        for (i = 0, nb = handlers.length; i < nb; i++) {
            if (a4p.isDefined(handlers[i])) {
                handleMouseUp(handlers[i], evt);
                noBubble = handlers[i].evtTriggered && !handlers[i].options.bubble;
            }
            if (noBubble) break;
        }
        return true;
    }

    document.addEventListener('mousemove', handleDocMouseMove, false);
    document.addEventListener('mouseup', handleDocMouseUp, false);

    function bindOnStart(sense, newScroll) {
        if (a4p.BrowserCapabilities.hasTouch) {
            if (!sense.bindTouchStart) {
                sense.bindTouchStart = bindEvent(sense.DOMelement, 'touchstart', function (evt) {
                    handleTouchStart(sense, evt);
                });
                //sense.bindTouchStart = angularBindEvent(sense.element, 'touchstart', function(evt) {handleTouchStart(sense, evt);});
                //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'bind OnTouchStart');
            }
        } else {
            // In Chrome, useTouch = true BUT we receive only mouse events
            if (!sense.bindMouseDown) {
                sense.bindMouseDown = bindEvent(sense.DOMelement, 'mousedown', function (evt) {
                    handleMouseDown(sense, evt);
                });
                //sense.bindMouseDown = angularBindEvent(sense.element, 'mousedown', function(evt) {handleMouseDown(sense, evt);});
                //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'bind OnMouseStart');
            }
            if (newScroll) {
                if (!sense.bindMouseWheel) {
                    sense.bindMouseWheel = bindEvent(sense.DOMelement, 'mousewheel', function (evt) {
                        handleWheel(sense, evt);
                    });
                }
                if (!sense.bindDomMouseWheel) {
                    sense.bindDomMouseWheel = bindEvent(sense.DOMelement, 'DOMMouseScroll', function (evt) {
                        handleWheel(sense, evt);
                    });
                }
            }
        }
    }

    function unbindStart(sense) {
        if (sense.bindDomMouseWheel) {
            sense.bindDomMouseWheel.destroy();
            sense.bindDomMouseWheel = false;
        }
        if (sense.bindMouseWheel) {
            sense.bindMouseWheel.destroy();
            sense.bindMouseWheel = false;
        }
        if (a4p.BrowserCapabilities.hasTouch) {
            if (sense.bindTouchStart) {
                sense.bindTouchStart.destroy();
                sense.bindTouchStart = false;
            }
        } else {
            if (sense.bindMouseDown) {
                sense.bindMouseDown.destroy();
                sense.bindMouseDown = false;
            }
        }
    }

    function bindOnTouchOther(sense) {
        if (a4p.BrowserCapabilities.hasTouch && sense.bindTouchStart) {
            var found = false;
            for (var i = touchListeners.length - 1; i >= 0; i--) {
                if (touchListeners[i].id == sense.id) {
                    found = true;
                    break;
                }
            }
            if (!found) touchListeners.push(sense);
            if (!sense.bindTouchMove) {
                sense.bindTouchMove = bindEvent(sense.DOMelement, 'touchmove', function (evt) {
                    handleTouchMove(sense, evt);
                });
                //sense.bindTouchMove = angularBindEvent(sense.element, 'touchmove', function(evt) {handleTouchMove(sense, evt);});
            }
            if (!sense.bindTouchEnd) {
                sense.bindTouchEnd = bindEvent(sense.DOMelement, 'touchend', function (evt) {
                    handleTouchEnd(sense, evt);
                });
                //sense.bindTouchEnd = angularBindEvent(sense.element, 'touchend', function(evt) {handleTouchEnd(sense, evt);});
            }
            if (!sense.bindTouchCancel) {
                sense.bindTouchCancel = bindEvent(sense.DOMelement, 'touchcancel', function (evt) {

                	//evt.preventDefault();
                    handleTouchCancel(sense, evt);
                });
                //sense.bindTouchCancel = angularBindEvent(sense.element, 'touchcancel', function(evt) {handleTouchCancel(sense, evt);});
            }
            //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'bind OnTouchOther');
        }
    }

    function bindOnMouseOther(sense) {
        if (!a4p.BrowserCapabilities.hasTouch && sense.bindMouseDown && !sense.bindMouseOther) {
            var found = false;
            for (var i = mouseListeners.length - 1; i >= 0; i--) {
                if (mouseListeners[i].id == sense.id) {
                    found = true;
                    break;
                }
            }
            if (!found) mouseListeners.push(sense);
            /*
             if (!sense.bindMouseMove) {
             sense.bindMouseMove = angularBindEvent(sense.element, 'mousemove', function(evt) {handleMouseMove(sense, evt);});
             }
             if (!sense.bindMouseUp) {
             sense.bindMouseUp = angularBindEvent(sense.element, 'mouseup', function(evt) {handleMouseUp(sense, evt);});
             }
             */
            // Unbindings create in browser a lot of bad performances
            sense.bindMouseOther = true;
            //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'bind OnMouseOther');
        }
    }

    function unbindAllOtherExceptFor(sense) {
        var i;
        if (a4p.BrowserCapabilities.hasTouch) {
            for (i = touchListeners.length - 1; i >= 0; i--) {
                if (touchListeners[i].id != sense.id) {
                    touchListeners[i].resetState();
                } else {
                    // Skip below senses
                    break;
                }
            }
        } else {
            for (i = mouseListeners.length - 1; i >= 0; i--) {
                if (mouseListeners[i].id != sense.id) {
                    mouseListeners[i].resetState();
                } else {
                    // Skip below senses
                    break;
                }
            }
        }
    }

    function unbindOther(sense) {
        var i;
        if (a4p.BrowserCapabilities.hasTouch) {
            for (i = touchListeners.length - 1; i >= 0; i--) {
                if (touchListeners[i].id == sense.id) {
                    touchListeners.splice(i, 1);
                    break;
                }
            }
            //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'unbindOther');
            if (sense.bindTouchMove) {
                sense.bindTouchMove.destroy();
                sense.bindTouchMove = false;
            }
            if (sense.bindTouchEnd) {
                sense.bindTouchEnd.destroy();
                sense.bindTouchEnd = false;
            }
            if (sense.bindTouchCancel) {
                sense.bindTouchCancel.destroy();
                sense.bindTouchCancel = false;
            }
        } else {
            if (sense.bindMouseOther) {
                for (i = mouseListeners.length - 1; i >= 0; i--) {
                    if (mouseListeners[i].id == sense.id) {
                        mouseListeners.splice(i, 1);
                        break;
                    }
                }
                //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'unbindOther');
                /*
                 if (sense.bindMouseMove) {
                 sense.bindMouseMove.destroy();
                 sense.bindMouseMove = false;
                 }
                 if (sense.bindMouseUp) {
                 sense.bindMouseUp.destroy();
                 sense.bindMouseUp = false;
                 }
                 */
                // Unbindings create in browser a lot of bad performances
                sense.bindMouseOther = false;
            }
        }
    }

    /*
     function angularBindEvent(element, eventName, callback) {
     element.bind(eventName, callback, false);// go directly into JQLite
     //angular.element(element[0]).bind(eventName, callback, false);// Go through angular.scenario.js (enable e2e tests)
     return {
     destroy: function() {
     element.unbind(eventName, callback, false);// go directly into JQLite
     //angular.element(element[0]).unbind(eventName, callback, false);// Go through angular.scenario.js (enable e2e tests)
     }
     };
     }
     */

    function bindEvent(element, eventName, callback) {
        // bind directly into browser (no passthrough angular nor JQLite)
        //if (element.bind) {
        //    element.bind(eventName, callback, false);
        //} else
        if (element.addEventListener) {
            element.addEventListener(eventName, callback, false);
            return {
                destroy: function () {
                    element.removeEventListener(eventName, callback, false);
                }
            };
        } else if (element.attachEvent) {
            element.attachEvent('on' + eventName, callback);
            return {
                destroy: function () {
                    element.detachEvent('on' + eventName, callback);
                }
            };
        } else {
            return false;
        }
    }

    function preventDefault(event) {
        event = event || window.event;
        if (event.preventDefault) {
            event.preventDefault();
        } else {
            event.returnValue = false;
        }
    }

    function stopPropagation(event) {
        event = event || window.event;
        if (event.stopPropagation) {
            event.stopPropagation();
        } else {
            event.cancelBubble = true;
        }
    }

    function eventNameWithoutPrefixNorNbFinger(eventName) {
        if (eventName.substr(0, 5) == 'Short') {
            eventName = eventName.substr(5);
        } else if (eventName.substr(0, 4) == 'Long') {
            eventName = eventName.substr(4);
        }
        var lg = eventName.length;
        if ((lg > 0) && ((eventName.charAt(lg-1) == '1')
            || (eventName.charAt(lg-1) == '2')
            || (eventName.charAt(lg-1) == '3')
            || (eventName.charAt(lg-1) == '4')
            || (eventName.charAt(lg-1) == '5'))) {
            return eventName.substr(0, lg-1);
        }
        return eventName;
    }

    // Finger utilities

    function clearFingers(sense) {
        sense.fingers = [];
        sense.side = '';
        sense.scale = 1.0;
        sense.rotate = 0.0;
        sense.moves = [];
        sense.timeStamp = (new Date()).getTime();
        sense.wheelDeltaX = 0;
        sense.wheelDeltaY = 0;
        sense.sourcePoints = [];// First finger clientX and clientY coords

        // Start gesture position of the first finger touch
        sense.startPageX = 0;
        sense.startPageY = 0;
        sense.startClientX = 0;
        sense.startClientY = 0;
        // Current position of the first finger
        sense.pageX = 0;
        sense.pageY = 0;
        sense.clientX = 0;
        sense.clientY = 0;
        // Current relative position of first finger vs its last significant position (
        sense.deltaX = 0;
        sense.deltaY = 0;
        // Current relative position of second finger vs first finger
        sense.deltaFingerX = 0;
        sense.deltaFingerY = 0;

        delete sense.finger1;
        delete sense.finger2;
    }

    function addTouchFinger(sense, id, finger) {
        // finger.clientX: X coordinate of touch relative to the viewport (excludes scroll offset)
        // finger.clientY: Y coordinate of touch relative to the viewport (excludes scroll offset)
        // finger.screenX: Relative to the screen
        // finger.screenY: Relative to the screen
        // finger.pageX: Relative to the full page (includes scrolling)
        // finger.pageY: Relative to the full page (includes scrolling)
        // finger.identifier: An identifying number, unique to each touch point (finger) currently active on the screen
        // finger.target: The DOM node that the finger is touching
        for (var i = sense.fingers.length - 1; i >= 0; i--) {
            var item = sense.fingers[i];
            if (item.id == id) {
                // SET instead of ADD (this case appears with Browser debugger : end event does not come)
                if (i > 1) {
                    // Third+ finger => unused
                    sense.fingers[i] = {
                        id: id,
                        target: finger.target,
                        pageX: finger.pageX,
                        pageY: finger.pageY,
                        clientX: finger.clientX,
                        clientY: finger.clientY,
                        deltaFingerX: finger.clientX - sense.clientX,
                        deltaFingerY: finger.clientY - sense.clientY
                    };
                } else if (i == 1) {
                    // Second finger => needed for scale/rotate
                    sense.deltaFingerX = finger.clientX - sense.clientX;
                    sense.deltaFingerY = finger.clientY - sense.clientY;

                    sense.fingers[1] = {
                        id: id,
                        target: finger.target,
                        pageX: finger.pageX,
                        pageY: finger.pageY,
                        clientX: finger.clientX,
                        clientY: finger.clientY,
                        deltaFingerX: sense.deltaFingerX,
                        deltaFingerY: sense.deltaFingerY
                    };

                    sense.finger2 = sense.fingers[1];
                } else {
                    // First finger => reference for all
                    sense.startPageX = finger.pageX;
                    sense.startPageY = finger.pageY;
                    sense.startClientX = finger.clientX;
                    sense.startClientY = finger.clientY;
                    sense.pageX = finger.pageX;
                    sense.pageY = finger.pageY;
                    sense.clientX = finger.clientX;
                    sense.clientY = finger.clientY;
                    sense.deltaFingerX = 0;
                    sense.deltaFingerY = 0;

                    sense.fingers[0] = {
                        id: id,
                        target: finger.target,
                        pageX: finger.pageX,
                        pageY: finger.pageY,
                        clientX: finger.clientX,
                        clientY: finger.clientY,
                        deltaFingerX: 0,
                        deltaFingerY: 0
                    };

                    sense.finger1 = sense.fingers[0];
                }
                return;
            }
        }
        // ADD
        if (sense.fingers.length > 1) {
            // Third+ finger => unused
            sense.fingers.push({
                id: id,
                target: finger.target,
                pageX: finger.pageX,
                pageY: finger.pageY,
                clientX: finger.clientX,
                clientY: finger.clientY,
                deltaFingerX: finger.clientX - sense.clientX,
                deltaFingerY: finger.clientY - sense.clientY
            });
        } else if (sense.fingers.length == 1) {
            // Second finger => needed for scale/rotate
            sense.deltaFingerX = finger.clientX - sense.clientX;
            sense.deltaFingerY = finger.clientY - sense.clientY;

            sense.fingers.push({
                id: id,
                target: finger.target,
                pageX: finger.pageX,
                pageY: finger.pageY,
                clientX: finger.clientX,
                clientY: finger.clientY,
                deltaFingerX: sense.deltaFingerX,
                deltaFingerY: sense.deltaFingerY
            });

            sense.finger2 = sense.fingers[1];
        } else {
            // First finger => reference for all
            sense.startPageX = finger.pageX;
            sense.startPageY = finger.pageY;
            sense.startClientX = finger.clientX;
            sense.startClientY = finger.clientY;
            sense.pageX = finger.pageX;
            sense.pageY = finger.pageY;
            sense.clientX = finger.clientX;
            sense.clientY = finger.clientY;
            sense.deltaFingerX = 0;
            sense.deltaFingerY = 0;

            sense.fingers.push({
                id: id,
                target: finger.target,
                pageX: finger.pageX,
                pageY: finger.pageY,
                clientX: finger.clientX,
                clientY: finger.clientY,
                deltaFingerX: 0,
                deltaFingerY: 0
            });

            sense.finger1 = sense.fingers[0];
        }
    }

    function addMouseFinger(sense, id, evt) {
        var pageX = getMousePageX(evt);
        var pageY = getMousePageY(evt);
        // Beware : touch.target is the start target (while a mouse.target is the move target)
        // => to have same behaviour we set target on start.target even for mouse event
        for (var i = sense.fingers.length - 1; i >= 0; i--) {
            var item = sense.fingers[i];
            if (item.id == id) {
                // SET instead of ADD (this case appears with Browser debugger : end event does not come)
                if (i > 1) {
                    // Third+ finger => unused
                    sense.fingers[i] = {
                        id: id,
                        target: evt.target,
                        pageX: pageX,
                        pageY: pageY,
                        clientX: evt.clientX,
                        clientY: evt.clientY,
                        deltaFingerX: evt.clientX - sense.clientX,
                        deltaFingerY: evt.clientY - sense.clientY
                    };
                } else if (i == 1) {
                    // Second finger => needed for scale/rotate
                    sense.deltaFingerX = evt.clientX - sense.clientX;
                    sense.deltaFingerY = evt.clientY - sense.clientY;

                    sense.fingers[1] = {
                        id: id,
                        target: evt.target,
                        pageX: pageX,
                        pageY: pageY,
                        clientX: evt.clientX,
                        clientY: evt.clientY,
                        deltaFingerX: sense.deltaFingerX,
                        deltaFingerY: sense.deltaFingerY
                    };

                    sense.finger2 = sense.fingers[1];
                } else {
                    // First finger => reference for all
                    sense.startPageX = pageX;
                    sense.startPageY = pageY;
                    sense.startClientX = evt.clientX;
                    sense.startClientY = evt.clientY;
                    sense.pageX = pageX;
                    sense.pageY = pageY;
                    sense.clientX = evt.clientX;
                    sense.clientY = evt.clientY;
                    sense.deltaFingerX = 0;
                    sense.deltaFingerY = 0;

                    sense.fingers[0] = {
                        id: id,
                        target: evt.target,
                        pageX: pageX,
                        pageY: pageY,
                        clientX: evt.clientX,
                        clientY: evt.clientY,
                        deltaFingerX: 0,
                        deltaFingerY: 0
                    };

                    sense.finger1 = sense.fingers[0];
                }
                return;
            }
        }
        // ADD
        if (sense.fingers.length > 1) {
            // Third+ finger => unused
            sense.fingers.push({
                id: id,
                target: evt.target,
                pageX: pageX,
                pageY: pageY,
                clientX: evt.clientX,
                clientY: evt.clientY,
                deltaFingerX: evt.clientX - sense.clientX,
                deltaFingerY: evt.clientY - sense.clientY
            });
        } else if (sense.fingers.length == 1) {
            // Second finger => needed for scale/rotate
            sense.deltaFingerX = evt.clientX - sense.clientX;
            sense.deltaFingerY = evt.clientY - sense.clientY;

            sense.fingers.push({
                id: id,
                target: evt.target,
                pageX: pageX,
                pageY: pageY,
                clientX: evt.clientX,
                clientY: evt.clientY,
                deltaFingerX: sense.deltaFingerX,
                deltaFingerY: sense.deltaFingerY
            });

            sense.finger2 = sense.fingers[1];
        } else {
            // First finger => reference for all
            sense.startPageX = pageX;
            sense.startPageY = pageY;
            sense.startClientX = evt.clientX;
            sense.startClientY = evt.clientY;
            sense.pageX = pageX;
            sense.pageY = pageY;
            sense.clientX = evt.clientX;
            sense.clientY = evt.clientY;
            sense.deltaFingerX = 0;
            sense.deltaFingerY = 0;

            sense.fingers.push({
                id: id,
                target: evt.target,
                pageX: pageX,
                pageY: pageY,
                clientX: evt.clientX,
                clientY: evt.clientY,
                deltaFingerX: 0,
                deltaFingerY: 0
            });

            sense.finger1 = sense.fingers[0];
        }
    }

    function setTouchFinger(sense, id, finger) {
        for (var i = sense.fingers.length - 1; i >= 0; i--) {
            var item = sense.fingers[i];
            if (item.id == id) {
                item.pageX = finger.pageX;
                item.pageY = finger.pageY;
                item.clientX = finger.clientX;
                item.clientY = finger.clientY;
                if (i == 0) {
                    sense.pageX = item.pageX - item.deltaFingerX;
                    sense.pageY = item.pageY - item.deltaFingerY;
                    sense.clientX = item.clientX - item.deltaFingerX;
                    sense.clientY = item.clientY - item.deltaFingerY;
                    if (sense.fingers.length > 1) {
                        sense.deltaFingerX = sense.finger2.clientX - sense.clientX;
                        sense.deltaFingerY = sense.finger2.clientY - sense.clientY;
                    }
                } else if (i == 1) {
                    sense.deltaFingerX = item.clientX - sense.clientX;
                    sense.deltaFingerY = item.clientY - sense.clientY;
                }
                return true;
            }
        }
        return false;
    }

    function setMouseFinger(sense, id, evt) {
        for (var i = sense.fingers.length - 1; i >= 0; i--) {
            var item = sense.fingers[i];
            if (item.id == id) {
                item.pageX = getMousePageX(evt);
                item.pageY = getMousePageY(evt);
                item.clientX = evt.clientX;
                item.clientY = evt.clientY;
                if (i == 0) {
                    sense.pageX = item.pageX - item.deltaFingerX;
                    sense.pageY = item.pageY - item.deltaFingerY;
                    sense.clientX = item.clientX - item.deltaFingerX;
                    sense.clientY = item.clientY - item.deltaFingerY;
                    if (sense.fingers.length > 1) {
                        sense.deltaFingerX = sense.finger2.clientX - sense.clientX;
                        sense.deltaFingerY = sense.finger2.clientY - sense.clientY;
                    }
                } else if (i == 1) {
                    sense.deltaFingerX = item.clientX - sense.clientX;
                    sense.deltaFingerY = item.clientY - sense.clientY;
                }
                return true;
            }
        }
        return false;
    }

    function removeFinger(sense, id) {
        for (var i = sense.fingers.length - 1; i >= 0; i--) {
            var item = sense.fingers[i];
            if (item.id == id) {
                sense.fingers.splice(i, 1);
                if (i == 0) {
                    if (sense.fingers.length > 0) {
                        // TODO : sense.start* are still referencing the old first finger
                        sense.finger1 = sense.fingers[0];
                        sense.pageX = sense.finger1.pageX - sense.finger1.deltaFingerX;
                        sense.pageY = sense.finger1.pageY - sense.finger1.deltaFingerY;
                        sense.clientX = sense.finger1.clientX - sense.finger1.deltaFingerX;
                        sense.clientY = sense.finger1.clientY - sense.finger1.deltaFingerY;
                        if (sense.fingers.length > 1) {
                            sense.finger2 = sense.fingers[1];
                            sense.deltaFingerX = sense.finger2.clientX - sense.clientX;
                            sense.deltaFingerY = sense.finger2.clientY - sense.clientY;
                        } else {
                            // Keep sense.finger2 pointing on older finger
                        }
                    } else {
                        // Keep sense.finger1 pointing on older finger
                    }
                } else if (i == 1) {
                    if (sense.fingers.length > 1) {
                        sense.finger2 = sense.fingers[1];
                        sense.deltaFingerX = sense.finger2.clientX - sense.clientX;
                        sense.deltaFingerY = sense.finger2.clientY - sense.clientY;
                    } else {
                        // Keep sense.finger2 pointing on older finger
                    }
                }

                return true;
            }
        }
        return false;
    }

    function hasFinger(sense, id) {
        for (var i = sense.fingers.length - 1; i >= 0; i--) {
            var item = sense.fingers[i];
            if (item.id == id) {
                return true;
            }
        }
        return false;
    }

    function addSourcePoint(sense) {
        sense.sourcePoints.push({x: sense.clientX, y: sense.clientY, t: (new Date()).getTime()});
    }

    function add1FingerMove(sense) {
        if (sense.fingers.length <= 0) return false;

        var fromX = sense.startClientX;
        var fromY = sense.startClientY;
        if (sense.moves.length > 0) {
            fromX = sense.moves[sense.moves.length - 1].x;
            fromY = sense.moves[sense.moves.length - 1].y;
        }
        var deltaX = sense.clientX - fromX;
        var deltaY = sense.clientY - fromY;
        if ((deltaX * deltaX + deltaY * deltaY) > sense.options.smallMove * sense.options.smallMove) {
            // Move is sufficient => determine the type of move : arc or line
            if (sense.moves.length > 0) {
                if (a4p.isUndefined(sense.moves[sense.moves.length - 1].radius)) {
                    // Last move was a line move
                    var previousX = sense.startClientX;
                    var previousY = sense.startClientY;
                    if (sense.moves.length > 1) {
                        previousX = sense.moves[sense.moves.length - 2].x;
                        previousY = sense.moves[sense.moves.length - 2].y;
                    }
                    var center = getCircleCenter(previousX, previousY, fromX, fromY, sense.clientX, sense.clientY);
                    if (center != null) {
                        var radiusX = sense.clientX - center[0];
                        var radiusY = sense.clientY - center[1];
                        if ((radiusX * radiusX + radiusY * radiusY) < (sense.options.arcRadius * sense.options.arcRadius)) {
                            if (((radiusX * radiusX + radiusY * radiusY)) > (sense.options.smallMove * sense.options.smallMove)) {
                                // move is an arc move => replace previous line move
                                var angleStart = Math.atan2(previousY - center[1], previousX - center[0]); // in ]-PI, +PI]
                                var angleEnd = Math.atan2(radiusY, radiusX); // in ]-PI, +PI]
                                var rotation = angleEnd - angleStart;
                                sense.moves.splice(sense.moves.length - 1, 1, {
                                    x: sense.clientX, y: sense.clientY,
                                    centerx: center[0], centery: center[1],
                                    radius: Math.sqrt(radiusX * radiusX + radiusY * radiusY),
                                    start: angleStart, end: angleEnd,
                                    direction: ((rotation >= 0) ? 'right' : 'left')
                                });
                            } else {
                                // Move is too small in radius, but sufficient in line => new line move in other direction
                                sense.moves.push({
                                    x: sense.clientX, y: sense.clientY,
                                    deltaX: deltaX, deltaY: deltaY
                                });
                            }
                        } else {
                            // move is considered as a parallel line move (radius too big) => replace previous line move
                            sense.moves.splice(sense.moves.length - 1, 1, {
                                x: sense.clientX, y: sense.clientY,
                                deltaX: sense.clientX - previousX, deltaY: sense.clientY - previousY
                            });
                        }
                    } else {
                        // move is a parallel horizontal line move
                        if ((fromX - previousX) * deltaX >= 0) {
                            // Same direction => replace previous line move
                            sense.moves.splice(sense.moves.length - 1, 1, {
                                x: sense.clientX, y: sense.clientY,
                                deltaX: sense.clientX - previousX, deltaY: sense.clientY - previousY
                            });
                        } else {
                            // Opposite direction => add a new line move
                            sense.moves.push({
                                x: sense.clientX, y: sense.clientY,
                                deltaX: deltaX, deltaY: deltaY
                            });
                        }
                    }
                } else {
                    // Last move was an arc move
                    var radius = sense.moves[sense.moves.length - 1].radius;
                    var centerx = sense.moves[sense.moves.length - 1].centerx;
                    var centery = sense.moves[sense.moves.length - 1].centery;
                    var start = sense.moves[sense.moves.length - 1].start;
                    var end = sense.moves[sense.moves.length - 1].end;
                    var lastRadiusX = sense.clientX - centerx;
                    var lastRadiusY = sense.clientY - centery;
                    if (Math.abs((lastRadiusX * lastRadiusX + lastRadiusY * lastRadiusY) - radius * radius) <= (sense.options.smallMove * sense.options.smallMove)) {
                        // Same radius, that move can continue the previous arc move
                        var lastAngleEnd = Math.atan2(lastRadiusY, lastRadiusX); // in ]-PI, +PI]
                        var lastRotation = lastAngleEnd - end;
                        if ((end - start) * lastRotation >= 0) {
                            // Rotation in same direction => replace previous arc move
                            sense.moves.splice(sense.moves.length - 1, 1, {
                                x: sense.clientX, y: sense.clientY,
                                centerx: centerx, centery: centery,
                                radius: radius,
                                start: start, end: lastAngleEnd,
                                direction: ((lastRotation >= 0) ? 'right' : 'left')
                            });
                        } else {
                            // Rotation in opposite direction => add a new arc move
                            sense.moves.push({
                                x: sense.clientX, y: sense.clientY,
                                centerx: centerx, centery: centery,
                                radius: Math.sqrt(lastRadiusX * lastRadiusX + lastRadiusY * lastRadiusY),
                                start: start, end: lastAngleEnd,
                                direction: ((lastRotation >= 0) ? 'right' : 'left')
                            });
                        }
                    } else {
                        // Consider the new move as a line move
                        sense.moves.push({
                            x: sense.clientX, y: sense.clientY,
                            deltaX: deltaX, deltaY: deltaY
                        });
                    }
                }
            } else {
                // Consider the first move as a line move
                sense.moves.push({
                    x: sense.clientX, y: sense.clientY,
                    deltaX: deltaX, deltaY: deltaY
                });
            }
            return true;
        }
        return false;
    }

    function set2FingersScaleAndRotate(sense) {
        if (sense.fingers.length <= 1) return false;

        // Last positions
        var to1X = sense.clientX;
        var to1Y = sense.clientY;
        var to2X = sense.finger2.clientX;
        var to2Y = sense.finger2.clientY;
        // Previous positions
        var from1X = sense.moves[sense.moves.length - 1].x;
        var from1Y = sense.moves[sense.moves.length - 1].y;
        var from2X = from1X + sense.finger2.deltaFingerX;
        var from2Y = from1Y + sense.finger2.deltaFingerY;
        // Length of last move
        var delta1X = to1X - from1X;
        var delta1Y = to1Y - from1Y;
        var delta2X = to2X - from2X;
        var delta2Y = to2Y - from2Y;
        if (((delta1X * delta1X + delta1Y * delta1Y) > sense.options.smallMove * sense.options.smallMove)
            || ((delta2X * delta2X + delta2Y * delta2Y) > sense.options.smallMove * sense.options.smallMove)) {
            // Move is sufficient => Update scale and rotate values
            // Angles between 2 fingers lines at start and end of the move
            var angleStart = Math.atan2(sense.finger2.deltaFingerY, sense.finger2.deltaFingerX); // in ]-PI, +PI]
            var angleEnd = Math.atan2(sense.deltaFingerY, sense.deltaFingerX); // in ]-PI, +PI]
            sense.scale = Math.sqrt((sense.deltaFingerX * sense.deltaFingerX
                + sense.deltaFingerY * sense.deltaFingerY)
                / (sense.finger2.deltaFingerX * sense.finger2.deltaFingerX
                + sense.finger2.deltaFingerY * sense.finger2.deltaFingerY));
            sense.rotate = angleEnd - angleStart;
            if (Math.abs(sense.scale - 1.0) <= sense.options.smallScale) {
                sense.scale = 1.0;
            }
            if (Math.abs(sense.rotate) <= sense.options.smallRotation) {
                sense.rotate = 0.0;
            }
            return true;
        }
        return false;
    }

    // Gesture events utilities

    function onWhichEvent(sense, name, nbFinger) {
        var prefix = 'Short';
        if (sense.hasPaused) prefix = 'Long';
        var onEventName = 'on' + prefix + name + nbFinger;
        if (a4p.isDefined(sense[onEventName]) && (sense[onEventName] != null)) {
            return onEventName;
        }
        if (sense.options.prefixPriority) {
            // the 'Short'/'Long' prefix has priority over the number of fingers  : sense-long-tap before sense-tap-2
            onEventName = 'on' + prefix + name;
            if (a4p.isDefined(sense[onEventName]) && (sense[onEventName] != null)) {
                return onEventName;
            }
            onEventName = 'on' + name + nbFinger;
            if (a4p.isDefined(sense[onEventName]) && (sense[onEventName] != null)) {
                return onEventName;
            }
        } else {
            // the number of fingers has priority over the 'Short'/'Long' prefix  : sense-tap-2 before sense-long-tap
            onEventName = 'on' + name + nbFinger;
            if (a4p.isDefined(sense[onEventName]) && (sense[onEventName] != null)) {
                return onEventName;
            }
            onEventName = 'on' + prefix + name;
            if (a4p.isDefined(sense[onEventName]) && (sense[onEventName] != null)) {
                return onEventName;
            }
        }
        onEventName = 'on' + name;
        if (a4p.isDefined(sense[onEventName]) && (sense[onEventName] != null)) {
            return onEventName;
        }
        return '';
    }

    function executeEvent(sense, name, evt) {
        var onEventName = onWhichEvent(sense, name, evt.nbFinger);
        if (onEventName.length > 0) {
            try {
                sense[onEventName](evt);
            } catch (exception) {
                // handler may be destroyed
            }
            return true;
        }
        return false;
    }

    function isEventListened(sense, name, nbFinger) {
        var onEventName = onWhichEvent(sense, name, nbFinger);
        return (onEventName.length > 0);
    }

    // Drag and Drop utilities

    function clearDrops(sense) {
        sense.dropsStarted = [];
        sense.dropOver = null;
        sense.dropEvt = {
            dataType: 'text/plain',
            dataTransfer: ''
        };
    }

    function dndStart(sense) {
        for (var idx = dndables.length - 1; idx >= 0; idx--) {
            var dropSenseId = dndables[idx];
            var dropSense = dndablesMap[dropSenseId];
            executeEvent(dropSense, GST_DND_START, sense.dropEvt);
        }
    }

    function dndEnd(sense) {
        for (var idx = dndables.length - 1; idx >= 0; idx--) {
            var dropSenseId = dndables[idx];
            var dropSense = dndablesMap[dropSenseId];
            executeEvent(dropSense, GST_DND_END, sense.dropEvt);
        }
    }

    function dndCancel(sense) {
        for (var idx = dndables.length - 1; idx >= 0; idx--) {
            var dropSenseId = dndables[idx];
            var dropSense = dndablesMap[dropSenseId];
            executeEvent(dropSense, GST_DND_CANCEL, sense.dropEvt);
        }
    }

    function dragStart(sense) {
        // Because User should set dataTransfer attribute in DROP event
        // we must keep this DROP event structure for all the DROP life cycle
        sense.dropEvt.nbFinger = sense.fingers.length;
        sense.dropEvt.side = sense.side;
        sense.dropEvt.scale = sense.scale;
        sense.dropEvt.rotate = sense.rotate;
        sense.dropEvt.moves = sense.moves;
        sense.dropEvt.sourcePoints = sense.sourcePoints;
        sense.dropEvt.timeStamp = sense.timeStamp;
        // To get the position relative to the top-left corner of the browser window's client area, use the clientX and clientY properties.
        sense.dropEvt.clientX = sense.startClientX;
        sense.dropEvt.clientY = sense.startClientY;
        // To get the position relative to the top-left corner of the document, use the pageX and pageY properties.
        sense.dropEvt.pageX = sense.startPageX;
        sense.dropEvt.pageY = sense.startPageY;
        // Use a home-made fct instead of getBoundingClientRect() : BUT do not take into account translate() from webkitTransform
        //var box = findBoundingClientRect2(sense.DOMelement);
        var box = sense.DOMelement.getBoundingClientRect();
        // We must calculate from startClientX (the origin of all moves) and not only when drag is decided.
        //sense.dropEvt.elementX = sense.finger1.clientX - box.left;
        //sense.dropEvt.elementY = sense.finger1.clientY - box.top;
        sense.dropEvt.elementX = sense.startClientX - box.left;
        sense.dropEvt.elementY = sense.startClientY - box.top;
        // User should set sense.dropEvt.dataTransfer
        sense.triggerEvent(GST_DRAG_START, sense.dropEvt);
        dndStart(sense);
    }

    function dropStart(sense) {
        sense.dropEvt.nbFinger = sense.fingers.length;
        sense.dropEvt.side = sense.side;
        sense.dropEvt.scale = sense.scale;
        sense.dropEvt.rotate = sense.rotate;
        sense.dropEvt.moves = sense.moves;
        sense.dropEvt.sourcePoints = sense.sourcePoints;
        sense.dropEvt.timeStamp = sense.timeStamp;
        sense.dropEvt.clientX = sense.finger1.clientX;
        sense.dropEvt.clientY = sense.finger1.clientY;
        sense.dropEvt.pageX = sense.finger1.pageX;
        sense.dropEvt.pageY = sense.finger1.pageY;
        if (sense.dropOver != null) {
            var idx = sense.dropsStarted.indexOf(sense.dropOver);
            if (idx < 0) {
                sense.dropsStarted.push(sense.dropOver);
                executeEvent(droppablesMap[sense.dropOver], GST_DROP_START, sense.dropEvt);
            }
        }
    }

    function dropEnd(sense) {
        sense.dropEvt.nbFinger = sense.fingers.length;
        sense.dropEvt.side = sense.side;
        sense.dropEvt.scale = sense.scale;
        sense.dropEvt.rotate = sense.rotate;
        sense.dropEvt.moves = sense.moves;
        sense.dropEvt.sourcePoints = sense.sourcePoints;
        sense.dropEvt.timeStamp = sense.timeStamp;
        sense.dropEvt.clientX = sense.finger1.clientX;
        sense.dropEvt.clientY = sense.finger1.clientY;
        sense.dropEvt.pageX = sense.finger1.pageX;
        sense.dropEvt.pageY = sense.finger1.pageY;
        if (sense.dropsStarted.length > 0) {
            if (sense.dropOver != null) {
                sense.triggerEvent(GST_DRAG_OVER_LEAVE, sense.dropEvt);
                executeEvent(droppablesMap[sense.dropOver], GST_DROP_OVER_LEAVE, sense.dropEvt);
                sense.dropOver = null;
            }
            if (sense.scroll && sense.scroll.options.zoom) {
                //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'scroll.onScrollEnd');
                if (sense.scroll.onScrollEnd(sense.finger1.pageX, sense.finger1.pageY, sense.timeStamp, sense.scale)) {
                    sense.evtTriggered = true;
                }
                /*
                //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'scroll.onZoomEnd');
                if (sense.scroll.onZoomEnd(sense.scale)) {
                    sense.evtTriggered = true;
                }
                */
            }
            sense.triggerEvent(GST_DRAG_END, sense.dropEvt);
            sense.dropsStarted.forEach(function (targetId) {
                executeEvent(droppablesMap[targetId], GST_DROP_END, sense.dropEvt);
            });
            dndEnd(sense);
            clearDrops(sense);
        } else {
            dropCancel(sense);
        }
    }

    function dropCancel(sense) {
        sense.dropEvt.nbFinger = sense.fingers.length;
        sense.dropEvt.side = sense.side;
        sense.dropEvt.scale = sense.scale;
        sense.dropEvt.rotate = sense.rotate;
        sense.dropEvt.moves = sense.moves;
        sense.dropEvt.sourcePoints = sense.sourcePoints;
        sense.dropEvt.timeStamp = sense.timeStamp;
        sense.dropEvt.clientX = sense.finger1.clientX;
        sense.dropEvt.clientY = sense.finger1.clientY;
        sense.dropEvt.pageX = sense.finger1.pageX;
        sense.dropEvt.pageY = sense.finger1.pageY;
        if (sense.dropOver != null) {
            sense.triggerEvent(GST_DRAG_OVER_LEAVE, sense.dropEvt);
            executeEvent(droppablesMap[sense.dropOver], GST_DROP_OVER_LEAVE, sense.dropEvt);
            sense.dropOver = null;
        }
        if (sense.scroll && sense.scroll.options.zoom) {
            //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'scroll.onScrollEnd');
            if (sense.scroll.onScrollEnd(sense.finger1.pageX, sense.finger1.pageY, sense.timeStamp, sense.scale)) {
                sense.evtTriggered = true;
            }
            /*
            //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'scroll.onZoomEnd');
            if (sense.scroll.onZoomEnd(sense.scale)) {
                sense.evtTriggered = true;
            }
            */
        }
        sense.triggerEvent(GST_DRAG_CANCEL, sense.dropEvt);
        sense.dropsStarted.forEach(function (targetId) {
            executeEvent(droppablesMap[targetId], GST_DROP_CANCEL, sense.dropEvt);
        });
        dndCancel(sense);
        clearDrops(sense);
    }

    function findBoundingClientRect(obj) {
        var offsetLeft = 0, offsetTop = 0, width = obj.offsetWidth, height = obj.offsetHeight;
        do {
            offsetLeft += (obj.offsetLeft || 0);
            offsetTop += (obj.offsetTop || 0);
            while (obj.offsetParent) {
                obj = obj.offsetParent;
                offsetLeft += obj.offsetLeft;
                offsetTop += obj.offsetTop;
            }
        } while (obj = obj.parentNode);
        return {
            left:offsetLeft,
            top:offsetTop,
            width:width,
            height:height,
            right:offsetLeft+width-1,
            bottom:offsetTop+height-1
        };
    }
    // TODO : analyze and compare to another solution found at http://www.greywyvern.com/?post=331
    function findBoundingClientRect2(obj) {
        var offsetLeft = 0, offsetTop = 0, width = obj.offsetWidth, height = obj.offsetHeight;
        var scr = obj, fixed = false;
        while ((scr = scr.parentNode) && scr != document.body) {
            offsetLeft -= scr.scrollLeft || 0;
            offsetTop -= scr.scrollTop || 0;
            if (getStyle(scr, "position") == "fixed") fixed = true;
        }
        // You can take into account document.body.scrollLeft & document.body.scrollTop if you want to take into account global scroll of browser
        if (fixed && !window.opera) {
            var scrDist = scrollDist();
            offsetLeft += scrDist[0];
            offsetTop += scrDist[1];
        }
        do {
            offsetLeft += obj.offsetLeft;
            offsetTop += obj.offsetTop;
        } while (obj = obj.offsetParent);
        return {
            left:offsetLeft,
            top:offsetTop,
            width:width,
            height:height,
            right:offsetLeft+width-1,
            bottom:offsetTop+height-1
        };
    }
    function scrollDist() {
        var html = document.getElementsByTagName('html')[0];
        if (html.scrollTop && document.documentElement.scrollTop) {
            return [html.scrollLeft, html.scrollTop];
        } else if (html.scrollTop || document.documentElement.scrollTop) {
            return [
                html.scrollLeft + document.documentElement.scrollLeft,
                html.scrollTop + document.documentElement.scrollTop
            ];
        } else if (document.body.scrollTop)
            return [document.body.scrollLeft, document.body.scrollTop];
        return [0, 0];
    }
    function getStyle(obj, styleProp) {
        if (obj.currentStyle) {
            var y = obj.currentStyle[styleProp];
        } else if (window.getComputedStyle)
            var y = window.getComputedStyle(obj, null)[styleProp];
        return y;
    }

    function findDroppableSenseFromCoord(clientX, clientY) {
        var dropOverTargetId = null;
        var boxArea = -1;
        for (var idx = droppables.length - 1; idx >= 0; idx--) {
            var dropSenseId = droppables[idx];
            var dropSense = droppablesMap[dropSenseId];
            // Use a home-made fct instead of getBoundingClientRect() : BUT do not take into account translate() from webkitTransform
            //var box = findBoundingClientRect(dropSense.DOMelement);
            var box = dropSense.DOMelement.getBoundingClientRect();
            if ((box.left <= clientX) && (clientX <= box.right) && (box.top <= clientY) && (clientY <= box.bottom)) {
                if ((dropOverTargetId == null) || (box.height * box.width < boxArea)) {
                    /*
                    console.log('Drop over ' + dropSense.name + ' clientX=' + clientX + ', clientY='+clientY
                        + ', box.left='+box.left + ', box.right='+box.right
                        + ', box.top='+box.top + ', box.bottom='+box.bottom
                        + ', dropSense.DOMelement.clientTop='+dropSense.DOMelement.clientTop
                        + ', dropSense.DOMelement.clientLeft='+dropSense.DOMelement.clientLeft);
                    */
                    dropOverTargetId = dropSenseId;
                    boxArea = box.height * box.width;
                }
            }
        }
        return dropOverTargetId;
    }

    // Gesture utilities

    function startHoldGesture(sense) {
        sense.triggerEvent(GST_HOLD_START, {
            clientX: sense.finger1.clientX,
            clientY: sense.finger1.clientY,
            pageX: sense.finger1.pageX,
            pageY: sense.finger1.pageY,
            nbFinger: sense.fingers.length
        });
    }

    function stopHoldGesture(sense) {
        sense.triggerEvent(GST_HOLD_STOP, {
            clientX: sense.finger1.clientX,
            clientY: sense.finger1.clientY,
            pageX: sense.finger1.pageX,
            pageY: sense.finger1.pageY,
            nbFinger: sense.fingers.length
        });
    }

    function tapGesture(sense) {
        sense.triggerEvent(GST_TAP, {
            clientX: sense.finger1.clientX,
            clientY: sense.finger1.clientY,
            pageX: sense.finger1.pageX,
            pageY: sense.finger1.pageY,
            nbFinger: sense.fingers.length
        });
    }

    function tapAndStartGestureIfMoves(sense) {
        add1FingerMove(sense);
        if (sense.moves.length > 0) {
            // Validate Tap and change to Drag gesture
            tapGesture(sense);
            startGesture(sense);// Go to state SWIPE, SCROLL or DRAG
        }
    }

    function startGestureIfMoves(sense) {
        add1FingerMove(sense);
        if (sense.moves.length > 0) {
            startGesture(sense);// Go to state SWIPE, SCROLL or DRAG
        }
    }

    function startGesture(sense) {
        // prerequisite : sense.moves.length > 0
        // prerequisite : sense.fingers.length > 0
        var move = sense.moves[sense.moves.length - 1];
        // SCROLL has priority over SWIPE if scroller has not attained its border => Ex : to scroll
        // DRAG has priority over SWIPE if scroller has not attained its border => Ex : to move a zoomed image
        if ((move.deltaY == 0) || (Math.abs(move.deltaX / move.deltaY) > sense.options.axeRatio)) {
            if (move.deltaX >= 0) {
                sense.side = 'right';
                if (sense.scroll && !sense.scroll.hasAttainedSideLeft()) {
                    //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'startGesture ' + sense.side + ' !hasAttainedSideLeft => startScrollGesture');
                    startScrollGesture(sense);
                    return;
                } else if (sense.options.axeX == 'scroll') {
                    //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'startGesture ' + sense.side + ' scroll => startScrollGesture');
                    startScrollGesture(sense);
                    return;
                } else if (sense.options.axeX == 'swipe') {
                    //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'startGesture ' + sense.side + ' swipe => startSwipeGesture');
                    startSwipeGesture(sense);
                    return;
                }
            } else {
                sense.side = 'left';
                if (sense.scroll && !sense.scroll.hasAttainedSideRight()) {
                    //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'startGesture ' + sense.side + ' !hasAttainedSideRight => startScrollGesture');
                    startScrollGesture(sense);
                    return;
                } else if (sense.options.axeX == 'scroll') {
                    //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'startGesture ' + sense.side + ' scroll => startScrollGesture');
                    startScrollGesture(sense);
                    return;
                } else if (sense.options.axeX == 'swipe') {
                    //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'startGesture ' + sense.side + ' swipe => startSwipeGesture');
                    startSwipeGesture(sense);
                    return;
                }
            }
        } else if ((move.deltaX == 0) || (Math.abs(move.deltaY / move.deltaX) > sense.options.axeRatio)) {
            if (move.deltaY >= 0) {
                sense.side = 'bottom';
                if (sense.scroll && !sense.scroll.hasAttainedSideTop()) {
                    //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'startGesture ' + sense.side + ' !hasAttainedSideTop => startScrollGesture');
                    startScrollGesture(sense);
                    return;
                } else if (sense.options.axeY == 'scroll') {
                    //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'startGesture ' + sense.side + ' scroll => startScrollGesture');
                    startScrollGesture(sense);
                    return;
                } else if (sense.options.axeY == 'swipe') {
                    //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'startGesture ' + sense.side + ' swipe => startSwipeGesture');
                    startSwipeGesture(sense);
                    return;
                }
            } else {
                sense.side = 'top';
                if (sense.scroll && !sense.scroll.hasAttainedSideBottom()) {
                    //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'startGesture ' + sense.side + ' !hasAttainedSideBottom => startScrollGesture');
                    startScrollGesture(sense);
                    return;
                } else if (sense.options.axeY == 'scroll') {
                    //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'startGesture ' + sense.side + ' scroll => startScrollGesture');
                    startScrollGesture(sense);
                    return;
                } else if (sense.options.axeY == 'swipe') {
                    //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'startGesture ' + sense.side + ' swipe => startSwipeGesture');
                    startSwipeGesture(sense);
                    return;
                }
            }
        } else {
            sense.side = '';
            if (sense.scroll && sense.scroll.enabled && sense.scroll.options.zoom) {
                //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'startGesture ' + sense.side + ' zoom => startScrollGesture');
                startScrollGesture(sense);
                return;
            }
        }
        if (sense.fingers.length > 1) {
            set2FingersScaleAndRotate(sense);
        }
        sense.side = '';
        if (isEventListened(sense, GST_DRAG_START, sense.fingers.length)) {
            //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'startGesture ' + sense.side + ' drag Started');
            sense.gotoState(STATE_DRAGGING);
            dragStart(sense);
            dragGesture(sense);
        } else {
            // No SWIPE, SCROLL or DRAG but MOVE => cancel TAP
            sense.gotoState(STATE_0CLICK);
        }
    }

    function swipeGesture(sense) {
        if (sense.inPause) {
            sense.inPause = false;
            sense.startTimer(sense.options.holdTime);
        }
        sense.triggerEvent(GST_SWIPE_MOVE, {
            clientX: sense.clientX,
            clientY: sense.clientY,
            pageX: sense.pageX,
            pageY: sense.pageY,
            nbFinger: sense.fingers.length,
            side: sense.side,
            moves: sense.moves,
            sourcePoints: sense.sourcePoints,
            timeStamp: sense.timeStamp
        });
    }

    function startSwipeGesture(sense) {
        sense.gotoState(STATE_SWIPING);
        sense.triggerEvent(GST_SWIPE_START, {
            clientX: sense.startClientX,
            clientY: sense.startClientY,
            pageX: sense.startPageX,
            pageY: sense.startPageY,
            nbFinger: sense.fingers.length,
            side: sense.side,
            moves: sense.moves,
            sourcePoints: sense.sourcePoints,
            timeStamp: sense.timeStamp
        });
        swipeGesture(sense);
    }

    function continueSwipeGesture(sense) {
        add1FingerMove(sense);
        swipeGesture(sense);
    }

    function cancelSwipeGesture(sense) {
        sense.triggerEvent(GST_SWIPE_CANCEL, {
            clientX: sense.finger1.clientX,
            clientY: sense.finger1.clientY,
            pageX: sense.finger1.pageX,
            pageY: sense.finger1.pageY,
            nbFinger: sense.fingers.length,
            side: sense.side,
            moves: sense.moves,
            sourcePoints: sense.sourcePoints,
            timeStamp: sense.timeStamp
        });
        sense.gotoState(STATE_0CLICK);
    }

    function endSwipeGesture(sense) {
        sense.triggerEvent(GST_SWIPE_END, {
            clientX: sense.finger1.clientX,
            clientY: sense.finger1.clientY,
            pageX: sense.finger1.pageX,
            pageY: sense.finger1.pageY,
            nbFinger: sense.fingers.length,
            side: sense.side,
            moves: sense.moves,
            sourcePoints: sense.sourcePoints,
            timeStamp: sense.timeStamp
        });
        sense.gotoState(STATE_0CLICK);
    }

    function scrollGesture(sense) {
        if (sense.inPause) {
            sense.inPause = false;
            sense.startTimer(sense.options.holdTime);
        }
        if (sense.scroll && (sense.scroll.options.zoom || (sense.options.axeX == 'scroll') || (sense.options.axeY == 'scroll'))) {
            //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'scroll.onScrollMove');
            if (sense.scroll.onScrollMove(sense.pageX, sense.pageY, sense.timeStamp, sense.scale)) {
                sense.evtTriggered = true;
            }
        }
        sense.triggerEvent(GST_SCROLL_MOVE, {
            clientX: sense.clientX,
            clientY: sense.clientY,
            pageX: sense.pageX,
            pageY: sense.pageY,
            nbFinger: sense.fingers.length,
            side: sense.side,
            moves: sense.moves,
            sourcePoints: sense.sourcePoints,
            timeStamp: sense.timeStamp
        });
    }

    function startScrollGesture(sense) {
        sense.gotoState(STATE_SCROLLING);
        if (sense.scroll && (sense.scroll.options.zoom || (sense.options.axeX == 'scroll') || (sense.options.axeY == 'scroll'))) {
            //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'scroll.onScrollStart');
            if (sense.scroll.onScrollStart(sense.startPageX, sense.startPageY, sense.timeStamp)) {
                sense.evtTriggered = true;
            }
        }
        sense.triggerEvent(GST_SCROLL_START, {
            clientX: sense.startClientX,
            clientY: sense.startClientY,
            pageX: sense.startPageX,
            pageY: sense.startPageY,
            nbFinger: sense.fingers.length,
            side: sense.side,
            moves: sense.moves,
            sourcePoints: sense.sourcePoints,
            timeStamp: sense.timeStamp
        });
        scrollGesture(sense);
    }

    function continueScrollGesture(sense) {
        add1FingerMove(sense);
        if (sense.fingers.length > 1) {
            set2FingersScaleAndRotate(sense);
        }
        scrollGesture(sense);
    }

    function cancelScrollGesture(sense) {
        if (sense.scroll && (sense.scroll.options.zoom || (sense.options.axeX == 'scroll') || (sense.options.axeY == 'scroll'))) {
            //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'scroll.onScrollEnd');
            if (sense.scroll.onScrollEnd(sense.finger1.pageX, sense.finger1.pageY, sense.timeStamp, sense.scale)) {
                sense.evtTriggered = true;
            }
        }
        sense.triggerEvent(GST_SCROLL_CANCEL, {
            clientX: sense.finger1.clientX,
            clientY: sense.finger1.clientY,
            pageX: sense.finger1.pageX,
            pageY: sense.finger1.pageY,
            nbFinger: sense.fingers.length,
            side: sense.side,
            moves: sense.moves,
            sourcePoints: sense.sourcePoints,
            timeStamp: sense.timeStamp
        });
        sense.gotoState(STATE_0CLICK);
    }

    function endScrollGesture(sense) {
        if (sense.scroll && (sense.scroll.options.zoom || (sense.options.axeX == 'scroll') || (sense.options.axeY == 'scroll'))) {
            //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'scroll.onScrollEnd');
            if (sense.scroll.onScrollEnd(sense.finger1.pageX, sense.finger1.pageY, sense.timeStamp, sense.scale)) {
                sense.evtTriggered = true;
            }
        }
        sense.triggerEvent(GST_SCROLL_END, {
            clientX: sense.finger1.clientX,
            clientY: sense.finger1.clientY,
            pageX: sense.finger1.pageX,
            pageY: sense.finger1.pageY,
            nbFinger: sense.fingers.length,
            side: sense.side,
            moves: sense.moves,
            sourcePoints: sense.sourcePoints,
            timeStamp: sense.timeStamp
        });
        sense.gotoState(STATE_0CLICK);
    }

    function dragGesture(sense) {
        if (sense.inPause) {
            sense.inPause = false;
            sense.startTimer(sense.options.holdTime);
        }
        sense.dropEvt.nbFinger = sense.fingers.length;
        sense.dropEvt.side = sense.side;
        sense.dropEvt.scale = sense.scale;
        sense.dropEvt.rotate = sense.rotate;
        sense.dropEvt.moves = sense.moves;
        sense.dropEvt.sourcePoints = sense.sourcePoints;
        sense.dropEvt.timeStamp = sense.timeStamp;
        sense.dropEvt.clientX = sense.clientX;
        sense.dropEvt.clientY = sense.clientY;
        sense.dropEvt.pageX = sense.pageX;
        sense.dropEvt.pageY = sense.pageY;
        if (sense.scroll && sense.scroll.options.zoom) {
            //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'scroll.onScrollMove');
            if (sense.scroll.onScrollMove(sense.pageX, sense.pageY, sense.timeStamp, sense.scale)) {
                sense.evtTriggered = true;
            }
            /*
            if (sense.fingers.length > 1) {
                //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'scroll.onZoomMove');
                if (sense.scroll.onZoomMove(sense.scale)) {
                    sense.evtTriggered = true;
                }
            } else {
                //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'scroll.onZoomEnd');
                if (sense.scroll.onZoomEnd(sense.scale)) {
                    sense.evtTriggered = true;
                }
            }
            */
        }
        sense.triggerEvent(GST_DRAG_MOVE, sense.dropEvt);
        var targetId = findDroppableSenseFromCoord(sense.clientX, sense.clientY);
        if (sense.dropOver != targetId) {
            if (sense.dropOver != null) {
                sense.triggerEvent(GST_DRAG_OVER_LEAVE, sense.dropEvt);
                executeEvent(droppablesMap[sense.dropOver], GST_DROP_OVER_LEAVE, sense.dropEvt);
                sense.dropOver = null;
            }
            if (targetId != null) {
                sense.dropOver = targetId;
                sense.triggerEvent(GST_DRAG_OVER_ENTER, sense.dropEvt);
                executeEvent(droppablesMap[targetId], GST_DROP_OVER_ENTER, sense.dropEvt);
            }
        }
        if (sense.dropOver != null) {
            executeEvent(droppablesMap[sense.dropOver], GST_DROP_MOVE, sense.dropEvt);
        }
    }

    function continueDragGesture(sense) {
        var viewportWidth = document.documentElement.clientWidth;
        var viewportHeight = document.documentElement.clientHeight;
        if ((sense.finger1.clientX < sense.options.smallMove)
            || (sense.finger1.clientX > (viewportWidth - sense.options.smallMove))
            || (sense.finger1.clientY < sense.options.smallMove)
            || (sense.finger1.clientY > (viewportHeight - sense.options.smallMove))) {
            // Cancel gesture if touch go out of viewport
            dropCancel(sense);
            sense.gotoState(STATE_0CLICK);
        } else {
            add1FingerMove(sense);
            if (sense.fingers.length > 1) {
                set2FingersScaleAndRotate(sense);
            }
            dragGesture(sense);
        }
    }

    // Geometry utilities

    function getMousePageX(evt) {
        var body = document.body;
        evt = evt || window.event;
        return (evt.pageX ||
            evt.clientX + ( document && document.scrollLeft || body && body.scrollLeft || 0 )
                - ( document && document.clientLeft || body && body.clientLeft || 0 ));
    }

    function getMousePageY(evt) {
        var body = document.body;
        evt = evt || window.event;
        return (evt.pageY ||
            evt.clientY + ( document && document.scrollTop || body && body.scrollTop || 0 )
                - ( document && document.clientTop || body && body.clientTop || 0 ));
    }

    function getCircleCenter(x1, y1, x2, y2, x3, y3) {
        if ((y1 == y2) && (y2 == y3)) {
            return null;
        }
        var dx3, dx2, dx1, nx3, nx2, nx1, x0, y0;
        if (y3 == y2) {
            // y1 != y2 and y1 != y3
            dx3 = (x2 - x1) / (y2 - y1);
            dx2 = (x3 - x1) / (y3 - y1);
            nx2 = (dx2 * (x3 + x1) + (y3 + y1)) / 2;
            nx3 = (dx3 * (x2 + x1) + (y2 + y1)) / 2;
            x0 = (nx2 - nx3) / (dx3 - dx2);
            y0 = dx3 * x0 + nx3;
        } else if (y2 == y1) {
            // y1 != y3 and y2 != y3
            dx1 = (x3 - x2) / (y3 - y2);
            dx2 = (x3 - x1) / (y3 - y1);
            nx2 = (dx2 * (x3 + x1) + (y3 + y1)) / 2;
            nx1 = (dx1 * (x3 + x2) + (y3 + y2)) / 2;
            x0 = (nx2 - nx1) / (dx1 - dx2);
            y0 = dx1 * x0 + nx1;
        } else {// y3 == y1 possible
            // y1 != y2 and y2 != y3
            dx3 = (x2 - x1) / (y2 - y1);
            dx1 = (x3 - x2) / (y3 - y2);
            nx1 = (dx1 * (x3 + x2) + (y3 + y2)) / 2;
            nx3 = (dx3 * (x2 + x1) + (y2 + y1)) / 2;
            x0 = (nx1 - nx3) / (dx3 - dx1);
            y0 = dx3 * x0 + nx3;
        }
        return [x0, y0];
    }

    /*
    function documentXToViewportX(x) {
        return x - window.pageXOffset;
    }

    function documentYToViewportY(y) {
        return y - window.pageYOffset;
    }

    function viewportXToDocumentX(x) {
        return x + window.pageXOffset;
    }

    function viewportYToDocumentY(y) {
        return y + window.pageYOffset;
    }

    function elementFromPointIsUsingViewPortCoordinates() {
        if (window.pageYOffset > 0) {     // page scrolled down
            return (window.document.elementFromPoint(0, window.pageYOffset + window.innerHeight - 1) == null);
        } else if (window.pageXOffset > 0) {   // page scrolled to the right
            return (window.document.elementFromPoint(window.pageXOffset + window.innerWidth - 1, 0) == null);
        }
        return false; // no scrolling, don't care
    }

    var usingViewPortCoordinates = elementFromPointIsUsingViewPortCoordinates();

    function elementFromDocumentPoint(x, y) {
        if (usingViewPortCoordinates) {
            return window.document.elementFromPoint(documentXToViewportX(x), documentYToViewportY(y));
        } else {
            return window.document.elementFromPoint(x, y);
        }
    }

    function elementFromViewportPoint(x, y) {
        if (usingViewPortCoordinates) {
            return window.document.elementFromPoint(x, y);
        } else {
            return window.document.elementFromPoint(viewportXToDocumentX(x), viewportYToDocumentY(y));
        }
    }
    */

    function Sense(element, options, scrollOpts) {
        // State
        this.id = nextUid();
        this.name = this.id;
        this.state = STATE_0CLICK;
        this.createScroll = false;
        clearFingers(this);
        clearDrops(this);
        this.bindTouchStart = false;
        this.bindTouchMove = false;
        this.bindTouchEnd = false;
        this.bindTouchCancel = false;
        this.bindMouseDown = false;
        /*
        this.bindMouseMove = false;
        this.bindMouseUp = false;
        */
        this.bindMouseOther = false;
        this.hasPaused = false;
        this.inPause = false;
        this.inMouseMove = false;
        this.inTouchMove = false;
        this.holdTimer = null;
        this.scroll = null;
        this.checkDOMTimer = null;
        this.timeStamp = 0;
        this.wheelDeltaX = 0;
        this.wheelDeltaY = 0;

        this.element = element;// JQLite element
        // DOM element
        if (typeof(element) == 'object') {
            this.DOMelement = element[0];
        } else {
            this.DOMelement = document.getElementById(element);
        }
        this.destroyListener = null;

        // Default options
        this.options = {
            name: "",
            axeX: '', // ''|'swipe'|'scroll'
            axeY: '', // ''|'swipe'|'scroll'
            defaultAction: false, // true if you want to activate defaultAction upon events
            bubble: false, // true if you want to bubble events upward in DOM in case Sense have treated it
            prefixPriority: false,// by default the number of fingers has priority over the 'Short'/'Long' prefix (ex: sense-tap-2 before sense-long-tap)
            smallMove: 10, // minimal move in pixels to accept a real move (to ignore shakings)
            smallScale: 0.1, // minimal scale change
            smallRotation: 0.25, // minimal rotate angle (radians)
            doubleTime: 250, // maximal inactivity time after a DOWN to start double DOWN
            holdTime: 300, // minimal inactivity time after a DOWN to start HOLDING state
            arcRadius: 500, // maximal radius to stay into CIRCLE gesture (pass into LINE after)
            axeRatio: 2.5, // Y/X or X/Y minimal ratio to be parallel to an axe (nearly 45/2 degrees, must be > 1)
            callApply: false, // use $apply on every event/gesture sense directive
            checkDOMChanges: false // Check DOM changes every 500 ms to refresh scrolls
        };
        this.scrollOptions = {
            name: "",
            hScroll: scrollOpts['zoom'],
            vScroll: scrollOpts['zoom']
        };

        // User defined options
        for (var optKey in options) {
            if (!options.hasOwnProperty(optKey)) continue;
            this.options[optKey] = options[optKey];
            if (optKey == 'name') {
                this.name = options[optKey];
                this.scrollOptions.name = options[optKey];
            }
        }
        for (var scrollOptKey in scrollOpts) {
            if (!scrollOpts.hasOwnProperty(scrollOptKey)) continue;
            this.scrollOptions[scrollOptKey] = scrollOpts[scrollOptKey];
            this.createScroll = true;
        }
        if ((this.options.axeX == 'scroll') || (this.options.axeY == 'scroll')) {
            if (this.options.axeX == 'scroll') {
                this.scrollOptions.hScroll = true;
                this.createScroll = true;
            }
            if (this.options.axeY == 'scroll') {
                this.scrollOptions.vScroll = true;
                this.createScroll = true;
            }
        }

        bindOnStart(this, this.createScroll);

        var self = this;

        // BUG : element not destroyed (element $destroy not fired, but scope $destroy is fired)
        this.element.bind('$destroy', function () {
            self.destroy();
        });


        if (this.createScroll) {
            self.scroll = new a4p.Scroll(element, self.scrollOptions);
        }

        window.setTimeout(function () {
            self.sizeRefresh();
            if (self.options.checkDOMChanges) {
                self.checkDOMTimer = setInterval(function () {
                    self.sizeRefresh();
                }, 500);
            }
        }, 750);
    }

    Sense.hasTouch = a4p.BrowserCapabilities.hasTouch;

    Sense.prototype.destroy = function () {
        if (this.destroyListener != null) {
            this.destroyListener();
        }
        // Unbind
        unbindStart(this);
        unbindOther(this);
        if (this.checkDOMTimer) {
            clearInterval(this.checkDOMTimer);
            this.checkDOMTimer = null;
        }
        // Unregister
        var idx = dndables.indexOf(this.id);
        if (idx >= 0) {
            dndables.splice(idx, 1);
        }
        delete dndablesMap[this.id];
        idx = droppables.indexOf(this.id);
        if (idx >= 0) {
            droppables.splice(idx, 1);
        }
        delete droppablesMap[this.id];
        // Delete
        if (this.scroll) {
            if (this.scroll.destroy) this.scroll.destroy();
            this.scroll = null;
        }
        //a4p.InternalLog.log("a4p.sense", "del Sense " + this.name);
        return true;
    };

    Sense.prototype.addHandler = function (eventName, handler) {
        this['on' + eventName] = handler;
        // Register this droppable zone
        var self = this;
        var baseEventName = eventNameWithoutPrefixNorNbFinger(eventName);
        if ((baseEventName == GST_DROP_OVER_ENTER) || (baseEventName == GST_DROP_START)) {
            var dropIdx = droppables.indexOf(this.id);
            if (dropIdx < 0) {
                droppables.push(this.id);
            }
            droppablesMap[this.id] = self;
        }
        if ((baseEventName == GST_DND_START) || (baseEventName == GST_DND_END) || (baseEventName == GST_DND_CANCEL)) {
            var dndIdx = dndables.indexOf(this.id);
            if (dndIdx < 0) {
                dndables.push(this.id);
            }
            dndablesMap[this.id] = self;
        }
    };

    Sense.prototype.sizeRefresh = function () {
        if (this.scroll) {
            var self = this;
            window.setTimeout(function () {
                if (self.scroll && self.scroll.checkDOMChanges()) {
                    self.scroll.refresh();
                }
            }, 300);
        }
    };

    // Triggering User events via angular directives

    Sense.prototype.triggerEvent = function (name, evt) {
        //a4p.InternalLog.log('a4p.Sense ' + this.name + ' ' + this.state, 'triggerEvent ' + name);
        var eventFound = executeEvent(this, name, evt);
        if (eventFound) this.evtTriggered = true;
        return eventFound;
    };

    /**
     * Integration with angular directives
     *
     * @param directiveModule
     */
    Sense.declareDirectives = function (directiveModule) {
        var allEvents = [];
        for (var evtIdx=0, evtNb=Sense.ALL_EVENTS.length; evtIdx < evtNb; evtIdx++) {
            var name = Sense.ALL_EVENTS[evtIdx];
            allEvents.push(name);
            allEvents.push('Short' + name);
            allEvents.push('Long' + name);
            for (var i=1; i <= 5; i++) {
                allEvents.push(name + i);
                allEvents.push('Short' + name + i);
                allEvents.push('Long' + name + i);
            }
        }
        angular.forEach(allEvents, function (name) {
            var directiveName = "sense" + name.charAt(0).toUpperCase() + name.slice(1);
            var eventName = name.charAt(0).toUpperCase() + name.slice(1);
            directiveModule.directive(directiveName, ['$parse', '$rootScope', function ($parse, $rootScope) {
                return function (scope, element, attr) {
                    // Create only 1 Sense object for this DOM element
                    var sense = element.data("sense");
                    if (a4p.isUndefined(sense)) {
                        sense = Sense.newSense($parse, $rootScope, scope, element, attr);
                        var initFn = $parse(sense.options['init']);
                        initFn(scope, {$sense: sense});
                    }
                    /*opts = {};
                     var optionsName = directiveName + "Opts";
                     if (a4p.isDefined(attr[optionsName])) {
                     opts = $parse(attr[optionsName])(scope, {});
                     }
                     sense.setOpts(eventName, opts);*/
                    var fn = $parse(attr[directiveName]);
                    sense.addHandler(eventName, function (event) {
                        if (sense.options['callApply']) {
                            a4p.safeApply(scope, function() {
                                fn(scope, {$event: event});
                            });
                        } else {
                            fn(scope, {$event: event});
                        }
                    });
                };
            }]);
        });
        directiveModule.directive('senseOpts', ['$parse', '$rootScope', function ($parse, $rootScope) {
            return function (scope, element, attr) {
                // Create only 1 Sense object for this DOM element
                var sense = element.data("sense");
                if (a4p.isUndefined(sense)) {
                    sense = Sense.newSense($parse, $rootScope, scope, element, attr);
                    var initFn = $parse(sense.options['init']);
                    initFn(scope, {$sense: sense});
                }
            };
        }]);
        directiveModule.directive('senseScrollOpts', ['$parse', '$rootScope', function ($parse, $rootScope) {
            return function (scope, element, attr) {
                // Create only 1 Sense object for this DOM element
                var sense = element.data("sense");
                if (a4p.isUndefined(sense)) {
                    sense = Sense.newSense($parse, $rootScope, scope, element, attr);
                    var initFn = $parse(sense.options['init']);
                    initFn(scope, {$sense: sense});
                }
            };
        }]);

        /**
         * Attach the element as inifinite loop list container for the first parent having a sense
         */
        directiveModule.directive('senseLoop', ['$parse', function ($parse) {
            return function (scope, element, attr) {
                var list = element[0];
                var senseWrapper;
                var parent = element[0].parentNode;
                if (a4p.isDefinedAndNotNull(parent)) {
                    senseWrapper = angular.element(parent).data("sense");
                    while (a4p.isUndefined(senseWrapper) && a4p.isDefinedAndNotNull(parent.parentNode)) {
                        parent = parent.parentNode;
                        senseWrapper = angular.element(parent).data("sense");
                    }
                }
                if (a4p.isDefinedAndNotNull(senseWrapper)) {
                    var scrollOptions;
                    if (a4p.isDefinedAndNotNull(senseWrapper.scroll)) {
                        // Scroll already exists => change directly its options
                        scrollOptions = senseWrapper.scroll.options;
                    } else {
                        // Scroll not yet created => change sense scrollOptions
                        scrollOptions = senseWrapper.scrollOptions;
                    }

                    var callApply = attr['callApply'];
                    var onElementMove = $parse(attr['onElementMove']);

                    scrollOptions.hScrollbar = false;
                    scrollOptions.vScrollbar = false;
                    scrollOptions.virtualLoop = true;
                    // normalization required
                    scrollOptions.bounce = false;
                    scrollOptions.virtualLoop = true;
                    scrollOptions.onBeforeScrollMove = function(deltaX, deltaY) {
                        // scroller must stay around scroll.x and scroll.y specified in options
                        var initX = senseWrapper.scroll.options.x || 0;
                        var initY = senseWrapper.scroll.options.y || 0;
                        var first, last, nb;
                        if ((this.y + deltaY) > initY) {
                            // move last at first position
                            last = list.children[list.children.length-1];
                            var lastHeight = last.offsetHeight;// Save it because it becomes 0 after move
                            nb = Math.round((this.y + deltaY - initY) / lastHeight);
                            //for (var i=nb;i>0;i--) {
                                //var last = list.children[list.children.length-1];
                                //list.insertBefore(last, list.children[0]);
                            //}
                            if (nb > 0) {
                                this.y -= nb*lastHeight;
                                if (callApply) {
                                    a4p.safeApply(scope, function() {
                                        onElementMove(scope, {$side:'top', $nb:nb});
                                    });
                                } else {
                                    onElementMove(scope, {$side:'top', $nb:nb});
                                }
                            }
                        } else if ((this.y + deltaY) < initY) {
                            // move first to last position
                            first = list.children[0];
                            var firstHeight = first.offsetHeight;// Save it because it becomes 0 after move
                            nb = Math.round((initY - this.y - deltaY) / firstHeight);
                            //for (var i=nb;i>0;i--) {
                                //var first = list.children[0];
                                //list.appendChild(first);
                            //}
                            if (nb > 0) {
                                this.y += nb*firstHeight;
                                if (callApply) {
                                    a4p.safeApply(scope, function() {
                                        onElementMove(scope, {$side:'bottom', $nb:nb});
                                    });
                                } else {
                                    onElementMove(scope, {$side:'bottom', $nb:nb});
                                }
                            }
                        }
                        if ((this.x + deltaX) > initX) {
                            // move last at first position
                            last = list.children[list.children.length-1];
                            var lastWidth = last.offsetWidth;// Save it because it becomes 0 after move
                            nb = Math.round((this.x + deltaX - initX) / lastWidth);
                            //for (var i=nb;i>0;i--) {
                                //var last = list.children[list.children.length-1];
                                //list.insertBefore(last, list.children[0]);
                            //}
                            if (nb > 0) {
                                this.x -= nb*lastWidth;
                                if (callApply) {
                                    a4p.safeApply(scope, function() {
                                        onElementMove(scope, {$side:'left', $nb:nb});
                                    });
                                } else {
                                    onElementMove(scope, {$side:'left', $nb:nb});
                                }
                            }
                        } else if ((this.x + deltaX) < initX) {
                            // move first to last position
                            first = list.children[0];
                            var firstWidth = first.offsetWidth;// Save it because it becomes 0 after move
                            nb = Math.round((initX - this.x - deltaX) / firstWidth);
                            //for (var i=nb;i>0;i--) {
                                //var first = list.children[0];
                                //list.appendChild(first);
                            //}
                            if (nb > 0) {
                                this.x += nb*firstWidth;
                                if (callApply) {
                                    a4p.safeApply(scope, function() {
                                        onElementMove(scope, {$side:'right', $nb:nb});
                                    });
                                } else {
                                    onElementMove(scope, {$side:'right', $nb:nb});
                                }
                            }
                        }
                    };
                }
            };
        }]);
    };

    Sense.newSense = function ($parse, $rootScope, scope, element, attr) {
        var sense;
        var opts = {};
        var scrollOpts = {};

        if (a4p.isDefined(attr['senseOpts'])) {
            opts = $parse(attr['senseOpts'])(scope, {});
        }

        if (a4p.isDefined(attr['senseScrollOpts'])) {
            scrollOpts = $parse(attr['senseScrollOpts'])(scope, {});
        }
        sense = new a4p.Sense(element, opts, scrollOpts);
        element.data("sense", sense);
        // User function callable from Angular context
        /*
        scope.pullDownAction = function() {
            window.setTimeout(function() {
                scope.theList.splice(0, 1, 'Generated row ' + (new Date()).getTime());
            }, 1000);// Simulate network latency
        };
        scope.pullUpAction = function() {
            window.setTimeout(function() {
                scope.theList.push('Generated row ' + (new Date()).getTime());
            }, 1000);// Simulate network latency
        };
        */
        scope.getSenseId = function() {
            return sense.id;
        };
        scope.getSenseName = function() {
            return sense.name;
        };

        if (sense.createScroll) {
            scope.senseScrollToElement = function(eltQuery, timeMs) {
                sense.scroll.scrollToElement(eltQuery, timeMs);
            };
            scope.senseScrollToPage = function(pageX, pageY, timeMs) {
                // pageX and pageY can also be 'prev' or 'next'
                sense.scroll.scrollToPage(pageX, pageY, timeMs);
            };
            scope.senseScrollTo = function(x, y, timeMs, relative) {
                //console.log('Scroll : senseScrollTo() x=' + x + ' y=' + y);
                sense.scroll.scrollTo(x, y, timeMs, relative);
            };
            scope.scrollRefresh = function() {
                sense.sizeRefresh();
            };
            if (attr['senseAfterScrollEnd']) {
                var scrollOptions;
                if (a4p.isDefinedAndNotNull(sense.scroll)) {
                    // Scroll already exists => change directly its options
                    scrollOptions = sense.scroll.options;
                } else {
                    // Scroll not yet created => change sense scrollOptions
                    scrollOptions = sense.scrollOptions;
                }
                var fn = $parse(attr['senseAfterScrollEnd']);
                if (sense.options['callApply']) {
                    scrollOptions.onAfterScrollEnd = function() {
                        var x = this.x, y = this.y;// Scroll.x and Scroll.y
                        a4p.safeApply(scope, function() {
                            fn(scope, {$x:x, $y:y});
                        });
                    };
                } else {
                    scrollOptions.onAfterScrollEnd = function() {
                        var x = this.x, y = this.y;// Scroll.x and Scroll.y
                        fn(scope, {$x:x, $y:y});
                    };
                }
            }

            // Create only 1 Resize object for this DOM element to be called upon each resize event
            var resize = element.data("resize");
            if (a4p.isUndefined(resize)) {
                resize = a4p.Resize.newResize($parse, $rootScope, scope, element, attr);
            }
            resize['toSenseWindow'] = function() {sense.sizeRefresh();};
            resize['toSenseChanged'] = function() {sense.sizeRefresh();};
        }
        if (a4p.isDefined(sense.options['watchRefresh'])) {
            if (typeof sense.options['watchRefresh'] == "string") {
                scope.$watch(sense.options['watchRefresh'], function (newValue, oldValue) {
                	if (newValue === oldValue) return; // initialization
                    sense.sizeRefresh();
                });
            } else {
                for (var i= 0,nb=sense.options['watchRefresh'].length; i<nb; i++) {
                    scope.$watch(sense.options['watchRefresh'][i], function (newValue, oldValue) {
                    	if (newValue === oldValue) return; // initialization
                        sense.sizeRefresh();
                    });
                }
            }
        }
        sense.sizeRefresh();
        //a4p.InternalLog.log("a4p.sense", "new Sense " + sense.name);
        return sense;
    };

    // Basic events transmitted to user

    var EVT_TOUCH_START = 'Touchstart';
    var EVT_TOUCH_MOVE = 'Touchmove';
    var EVT_TOUCH_END = 'Touchend';
    var EVT_TOUCH_CANCEL = 'Touchcancel';
    var EVT_MOUSE_DOWN = 'Mousedown';
    var EVT_MOUSE_MOVE = 'Mousemove';
    var EVT_MOUSE_UP = 'Mouseup';

    // Gesture user events sent to Sense angular directives

    var GST_HOLD_START = 'HoldStart'; // => onHold, onHold(1:5)
    var GST_HOLD_STOP = 'HoldStop'; // => onHoldCancel, onHoldCancel(1:5)

    var GST_TAP = 'Tap';            // => onTap, onTap(1:5)
    var GST_DOUBLE_TAP = 'DoubleTap';      // => onDoubleTap, onDoubleTap(1:5)

    // DRAG gesture on draggable object if axeX!=(swipe/scroll) or axeY!=(swipe/scroll) in senseOpts
    var GST_DRAG_OVER_ENTER = 'DragOverEnter';  // => onDragOverEnter, onDragOverEnter(1:5)
    var GST_DRAG_OVER_LEAVE = 'DragOverLeave';  // => onDragOverLeave, onDragOverLeave(1:5)
    var GST_DRAG_START = 'DragStart';      // => onDragStart, onDragStart(1:5)
    var GST_DRAG_PAUSE = 'DragPause';    // => onDragPause, onDragPause(1:5)
    var GST_DRAG_MOVE = 'DragMove';       // => onDragMove, onDragMove(1:5)
    var GST_DRAG_END = 'DragEnd';        // => onDragEnd, onDragEnd(1:5)
    var GST_DRAG_CANCEL = 'DragCancel';     // => onDragCancel, onDragCancel(1:5)

    // DROP gesture on droppable object
    // an object is droppable ONLY if it listens on GST_DROP_OVER_ENTER or GST_DROP_START
    var GST_DROP_OVER_ENTER = 'DropOverEnter';  // => onDropOverEnter, onDropOverEnter(1:5)
    var GST_DROP_OVER_LEAVE = 'DropOverLeave';  // => onDropOverLeave, onDropOverLeave(1:5)
    var GST_DROP_START = 'DropStart';      // => onDropStart, onDropStart(1:5)
    var GST_DROP_MOVE = 'DropMove';       // => onDropMove, onDropMove(1:5)
    var GST_DROP_END = 'DropEnd';        // => onDropEnd, onDropEnd(1:5)
    var GST_DROP_CANCEL = 'DropCancel';     // => onDropCancel, onDropCancel(1:5)

    // DND events AFTER DRAG/DROP events
    var GST_DND_START = 'DndStart';      // => onDndStart, onDndStart(1:5)
    var GST_DND_END = 'DndEnd';        // => onDndEnd, onDndEnd(1:5)
    var GST_DND_CANCEL = 'DndCancel';     // => onDndCancel, onDndCancel(1:5)

    // SWIPE gesture if axeX==swipe or axeY==swipe in senseOpts
    var GST_SWIPE_START = 'SwipeStart';     // => onSwipeStart, onSwipeStart(1:5)
    var GST_SWIPE_PAUSE = 'SwipePause';     // => onSwipePause, onSwipePause(1:5)
    var GST_SWIPE_MOVE = 'SwipeMove';      // => onSwipeMove, onSwipeMove(1:5)
    var GST_SWIPE_END = 'SwipeEnd';       // => onSwipeEnd, onSwipeEnd(1:5)
    var GST_SWIPE_CANCEL = 'SwipeCancel';    // => onSwipeCancel, onSwipeCancel(1:5)

    // SWIPE gesture if axeX==scroll or axeY==scroll in senseOpts
    var GST_SCROLL_START = 'ScrollStart';    // => onScrollStart, onScrollStart(1:5)
    var GST_SCROLL_PAUSE = 'ScrollPause';    // => onScrollPause, onScrollPause(1:5)
    var GST_SCROLL_MOVE = 'ScrollMove';     // => onScrollMove, onScrollMove(1:5)
    var GST_SCROLL_END = 'ScrollEnd';      // => onScrollEnd, onScrollEnd(1:5)
    var GST_SCROLL_CANCEL = 'ScrollCancel';   // => onScrollCancel, onScrollCancel(1:5)

    Sense.ALL_EVENTS = [
        EVT_TOUCH_START, EVT_TOUCH_MOVE, EVT_TOUCH_END, EVT_TOUCH_CANCEL,
        EVT_MOUSE_DOWN, EVT_MOUSE_MOVE, EVT_MOUSE_UP,
        GST_TAP, GST_DOUBLE_TAP, GST_HOLD_START, GST_HOLD_STOP,
        GST_DRAG_OVER_ENTER, GST_DRAG_OVER_LEAVE, GST_DRAG_START, GST_DRAG_PAUSE, GST_DRAG_MOVE, GST_DRAG_END, GST_DRAG_CANCEL,
        GST_DND_START, GST_DND_END, GST_DND_CANCEL,
        GST_DROP_OVER_ENTER, GST_DROP_OVER_LEAVE, GST_DROP_START, GST_DROP_MOVE, GST_DROP_END, GST_DROP_CANCEL,
        GST_SWIPE_START, GST_SWIPE_PAUSE, GST_SWIPE_MOVE, GST_SWIPE_END, GST_SWIPE_CANCEL,
        GST_SCROLL_START, GST_SCROLL_PAUSE, GST_SCROLL_MOVE, GST_SCROLL_END, GST_SCROLL_CANCEL
    ];

    // States of our Finite State Machine

    var STATE_0CLICK = '0click';
    var STATE_1DOWN = '1down';
    var STATE_1CLICK = '1click';
    var STATE_2DOWN = '2down';
    var STATE_SWIPING = 'swiping';
    var STATE_SCROLLING = 'scrolling';
    var STATE_DRAGGING = 'dragging';

    // Event handlers of our Finite State Machine

    var onEnter = {};
    var onExit = {};
    var onTimeout = {};
    var onTouchStart = {};
    var onTouchMove = {};
    var onTouchEnd = {};
    var onTouchCancel = {};
    var onMouseDown = {};
    var onMouseMove = {};
    var onMouseUp = {};

    Sense.prototype.resetState = function () {
        this.clearTimeout();
        clearDrops(this);
        unbindOther(this);
        this.hasPaused = false;
        this.inPause = false;
        this.inMouseMove = false;
        this.inTouchMove = false;
        this.evtHandled = false;
        this.evtTriggered = false;
        this.state = STATE_0CLICK;
        onEnter[STATE_0CLICK].call(this);
    };

    Sense.prototype.gotoState = function (state) {
        onExit[this.state].call(this);
        this.state = state;
        onEnter[this.state].call(this);
    };

    // Timer utilities

    Sense.prototype.handleTimeout = function () {
        this.holdTimer = null;
        onTimeout[this.state].call(this);
    };

    Sense.prototype.clearTimeout = function () {
        if (this.holdTimer != null) {
            clearTimeout(this.holdTimer);
            this.holdTimer = null;
        }
    };

    Sense.prototype.startTimer = function (ms) {
        if (this.holdTimer != null) {
            clearTimeout(this.holdTimer);
        }
        var self = this;
        this.holdTimer = window.setTimeout(function () {
            self.handleTimeout();
        }, ms);
    };

    // States

    // 0CLICK state waits for all fingers be UP before starting a new gesture
    onEnter[STATE_0CLICK] = function () {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'onEnter');
        this.hasPaused = false;
        this.inPause = false;
        clearFingers(this);
    };
    onExit[STATE_0CLICK] = function () {
    };
    onTimeout[STATE_0CLICK] = function () {
    };
    onTouchStart[STATE_0CLICK] = function (evt) {
        // Analyse
        if (this.fingers.length <= 0) {
            this.evtHandled = true;
            for (var i = 0; i < evt.changedTouches.length; i++) {
                var finger = evt.changedTouches[i];
                var id = finger.identifier;
                addTouchFinger(this, id, finger);
            }
            addSourcePoint(this);
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_TOUCH_START, evt);
            this.gotoState(STATE_1DOWN);
        }
    };
    onTouchMove[STATE_0CLICK] = function (evt) {
    };
    onTouchEnd[STATE_0CLICK] = function (evt) {
        // Analyse
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            if (removeFinger(this, id)) {
                this.evtHandled = true;
            }
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_TOUCH_END, evt);
        }
    };
    onTouchCancel[STATE_0CLICK] = function (evt) {
        // Analyse
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            if (removeFinger(this, id)) {
                this.evtHandled = true;
            }
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_TOUCH_CANCEL, evt);
        }
    };
    onMouseDown[STATE_0CLICK] = function (evt) {
        // Analyse
        if (this.fingers.length <= 0) {
            this.evtHandled = true;
            var id = 'mouse' + (evt.which || 0);
            addMouseFinger(this, id, evt);
            addSourcePoint(this);
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_MOUSE_DOWN, evt);
            this.gotoState(STATE_1DOWN);
        }
    };
    onMouseMove[STATE_0CLICK] = function (evt) {
    };
    onMouseUp[STATE_0CLICK] = function (evt) {
        // Analyse
        var id = 'mouse' + (evt.which || 0);
        if (removeFinger(this, id)) {
            this.evtHandled = true;
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_MOUSE_UP, evt);
        }
    };

    onEnter[STATE_1DOWN] = function () {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'onEnter');
        this.inPause = false;
        this.startTimer(this.options.holdTime);
    };
    onExit[STATE_1DOWN] = function () {
        this.clearTimeout();
    };
    onTimeout[STATE_1DOWN] = function () {
        startHoldGesture(this);
        this.inPause = true;
        this.hasPaused = true;
    };
    onTouchStart[STATE_1DOWN] = function (evt) {
        // Analyse
        this.evtHandled = true;
        if (!this.inPause) {
            this.startTimer(this.options.holdTime);
        }
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            addTouchFinger(this, id, finger);
        }
        // Trigger
        evt.nbFinger = this.fingers.length;
        this.triggerEvent(EVT_TOUCH_START, evt);
    };
    onTouchMove[STATE_1DOWN] = function (evt) {
        // Analyse
        if (this.inPause) {
            this.clearTimeout();
            stopHoldGesture(this);
            this.inPause = false;
        }
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            if (hasFinger(this, id)) {
                this.evtHandled = true;
                setTouchFinger(this, id, finger);
                if (this.finger1.id == id) {
                    addSourcePoint(this);
                }
            }
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_TOUCH_MOVE, evt);
            startGestureIfMoves(this);
        }
    };
    onTouchEnd[STATE_1DOWN] = function (evt) {
        // Analyse
        if (this.inPause) {
            this.clearTimeout();
            stopHoldGesture(this);
            this.inPause = false;
        }
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            if (removeFinger(this, id)) {
                this.evtHandled = true;
            }
        }
        // Trigger
        // Validate GESTURE as soon as ONE finger is UP
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_TOUCH_END, evt);
            var onEventName = onWhichEvent(this, GST_DOUBLE_TAP, evt.nbFinger);
            if (onEventName.length > 0) {
                this.gotoState(STATE_1CLICK);
            } else {
                tapGesture(this);
                this.gotoState(STATE_0CLICK);
            }
        }
    };
    onTouchCancel[STATE_1DOWN] = function (evt) {
        // Analyse
        if (this.inPause) {
            this.clearTimeout();
            stopHoldGesture(this);
            this.inPause = false;
        }
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            if (removeFinger(this, id)) {
                this.evtHandled = true;
            }
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_TOUCH_CANCEL, evt);
            this.gotoState(STATE_0CLICK);
        }
    };
    onMouseDown[STATE_1DOWN] = function (evt) {
        // Analyse
        this.evtHandled = true;
        if (!this.inPause) {
            this.startTimer(this.options.holdTime);
        }
        var id = 'mouse' + (evt.which || 0);
        addMouseFinger(this, id, evt);
        // Trigger
        evt.nbFinger = this.fingers.length;
        this.triggerEvent(EVT_MOUSE_DOWN, evt);
    };
    onMouseMove[STATE_1DOWN] = function (evt) {
        // Analyse
        if (this.inPause) {
            this.clearTimeout();
            stopHoldGesture(this);
            this.inPause = false;
        }
        var id = 'mouse' + (evt.which || 0);
        if (hasFinger(this, id)) {
            this.evtHandled = true;
            setMouseFinger(this, id, evt);
            if (this.finger1.id == id) {
                addSourcePoint(this);
            }
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_MOUSE_MOVE, evt);
            startGestureIfMoves(this);
        }
    };
    onMouseUp[STATE_1DOWN] = function (evt) {
        // Analyse
        if (this.inPause) {
            this.clearTimeout();
            stopHoldGesture(this);
            this.inPause = false;
        }
        var id = 'mouse' + (evt.which || 0);
        if (removeFinger(this, id)) {
            this.evtHandled = true;
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_MOUSE_UP, evt);
            var onEventName = onWhichEvent(this, GST_DOUBLE_TAP, evt.nbFinger);
            if (onEventName.length > 0) {
                this.gotoState(STATE_1CLICK);
            } else {
                tapGesture(this);
                this.gotoState(STATE_0CLICK);
            }
        }
    };

    // 1CLICK state waits for all fingers be UP before starting a new gesture
    onEnter[STATE_1CLICK] = function () {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'onEnter');
        this.startTimer(this.options.doubleTime);
    };
    onExit[STATE_1CLICK] = function () {
        this.clearTimeout();
    };
    onTimeout[STATE_1CLICK] = function () {
        tapGesture(this);
        this.gotoState(STATE_0CLICK);
    };
    onTouchStart[STATE_1CLICK] = function (evt) {
        // Analyse
        if (this.fingers.length <= 0) {
            this.evtHandled = true;
            for (var i = 0; i < evt.changedTouches.length; i++) {
                var finger = evt.changedTouches[i];
                var id = finger.identifier;
                addTouchFinger(this, id, finger);
            }
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_TOUCH_START, evt);
            this.gotoState(STATE_2DOWN);
        }
    };
    onTouchMove[STATE_1CLICK] = function (evt) {
    };
    onTouchEnd[STATE_1CLICK] = function (evt) {
        // Analyse
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            if (removeFinger(this, id)) {
                this.evtHandled = true;
            }
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_TOUCH_END, evt);
        }
    };
    onTouchCancel[STATE_1CLICK] = function (evt) {
        // Analyse
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            if (removeFinger(this, id)) {
                this.evtHandled = true;
            }
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_TOUCH_CANCEL, evt);
        }
    };
    onMouseDown[STATE_1CLICK] = function (evt) {
        // Analyse
        if (this.fingers.length <= 0) {
            this.evtHandled = true;
            var id = 'mouse' + (evt.which || 0);
            addMouseFinger(this, id, evt);
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_MOUSE_DOWN, evt);
            this.gotoState(STATE_2DOWN);
        }
    };
    onMouseMove[STATE_1CLICK] = function (evt) {
    };
    onMouseUp[STATE_1CLICK] = function (evt) {
        // Analyse
        var id = 'mouse' + (evt.which || 0);
        if (removeFinger(this, id)) {
            this.evtHandled = true;
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_MOUSE_UP, evt);
        }
    };

    onEnter[STATE_2DOWN] = function () {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'onEnter');
    };
    onExit[STATE_2DOWN] = function () {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'onExit');
    };
    onTimeout[STATE_2DOWN] = function () {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'onTimeout');
    };
    onTouchStart[STATE_2DOWN] = function (evt) {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'onTouchStart');
        // Analyse
        this.evtHandled = true;
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            addTouchFinger(this, id, finger);
        }
        // Trigger
        evt.nbFinger = this.fingers.length;
        this.triggerEvent(EVT_TOUCH_START, evt);
    };
    onTouchMove[STATE_2DOWN] = function (evt) {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'onTouchMove');
        // Analyse
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            if (hasFinger(this, id)) {
                this.evtHandled = true;
                setTouchFinger(this, id, finger);
                if (this.finger1.id == id) {
                    addSourcePoint(this);
                }
            }
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_TOUCH_MOVE, evt);
            tapAndStartGestureIfMoves(this);
        }
    };
    onTouchEnd[STATE_2DOWN] = function (evt) {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'onTouchEnd');
        // Analyse
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            if (removeFinger(this, id)) {
                this.evtHandled = true;
            }
        }
        // Trigger
        // Validate GESTURE as soon as ONE finger is UP
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_TOUCH_END, evt);
            this.triggerEvent(GST_DOUBLE_TAP, {
                clientX: this.finger1.clientX,
                clientY: this.finger1.clientY,
                pageX: this.finger1.pageX,
                pageY: this.finger1.pageY,
                nbFinger: this.fingers.length
            });
            this.gotoState(STATE_0CLICK);
        }
    };
    onTouchCancel[STATE_2DOWN] = function (evt) {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'onTouchCancel');
        // Analyse
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            if (removeFinger(this, id)) {
                this.evtHandled = true;
            }
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_TOUCH_CANCEL, evt);
            tapGesture(this);
            this.gotoState(STATE_0CLICK);
        }
    };
    onMouseDown[STATE_2DOWN] = function (evt) {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'onMouseDown');
        // Analyse
        this.evtHandled = true;
        var id = 'mouse' + (evt.which || 0);
        addMouseFinger(this, id, evt);
        // Trigger
        evt.nbFinger = this.fingers.length;
        this.triggerEvent(EVT_MOUSE_DOWN, evt);
    };
    onMouseMove[STATE_2DOWN] = function (evt) {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'onMouseMove');
        // Analyse
        var id = 'mouse' + (evt.which || 0);
        if (hasFinger(this, id)) {
            this.evtHandled = true;
            setMouseFinger(this, id, evt);
            if (this.finger1.id == id) {
                addSourcePoint(this);
            }
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_MOUSE_MOVE, evt);
            tapAndStartGestureIfMoves(this);
        }
    };
    onMouseUp[STATE_2DOWN] = function (evt) {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'onMouseUp');
        // Analyse
        var id = 'mouse' + (evt.which || 0);
        if (removeFinger(this, id)) {
            this.evtHandled = true;
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_MOUSE_UP, evt);
            this.triggerEvent(GST_DOUBLE_TAP, {
                clientX: this.finger1.clientX,
                clientY: this.finger1.clientY,
                pageX: this.finger1.pageX,
                pageY: this.finger1.pageY,
                nbFinger: this.fingers.length
            });
            this.gotoState(STATE_0CLICK);
        }
    };

    onEnter[STATE_SWIPING] = function () {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'onEnter');
        this.inPause = false;
        this.startTimer(this.options.holdTime);
    };
    onExit[STATE_SWIPING] = function () {
        this.clearTimeout();
    };
    onTimeout[STATE_SWIPING] = function () {
        this.triggerEvent(GST_SWIPE_PAUSE, {
            clientX: this.finger1.clientX,
            clientY: this.finger1.clientY,
            pageX: this.finger1.pageX,
            pageY: this.finger1.pageY,
            nbFinger: this.fingers.length,
            side: this.side,
            moves: this.moves,
            sourcePoints: this.sourcePoints,
            timeStamp: this.timeStamp
        });
        this.inPause = true;
    };
    onTouchStart[STATE_SWIPING] = function (evt) {
        // Analyse
        this.evtHandled = true;
        if (!this.inPause) {
            this.startTimer(this.options.holdTime);
        }
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            addTouchFinger(this, id, finger);
        }
        // Trigger
        evt.nbFinger = this.fingers.length;
        this.triggerEvent(EVT_TOUCH_START, evt);
    };
    onTouchMove[STATE_SWIPING] = function (evt) {
        // Analyse
        if (!this.inPause) {
            this.startTimer(this.options.holdTime);
        }
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            if (hasFinger(this, id)) {
                this.evtHandled = true;
                setTouchFinger(this, id, finger);
                if (this.finger1.id == id) {
                    addSourcePoint(this);
                }
            }
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_TOUCH_MOVE, evt);
            continueSwipeGesture(this);
        }
    };
    onTouchEnd[STATE_SWIPING] = function (evt) {
        // Analyse
        if (!this.inPause) {
            this.clearTimeout();
        }
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            if (removeFinger(this, id)) {
                this.evtHandled = true;
            }
        }
        // Trigger
        // Validate GESTURE as soon as ONE finger is UP
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_TOUCH_END, evt);
            endSwipeGesture(this);
        }
    };
    onTouchCancel[STATE_SWIPING] = function (evt) {
        // Analyse
        if (!this.inPause) {
            this.clearTimeout();
        }
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            if (removeFinger(this, id)) {
                this.evtHandled = true;
            }
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_TOUCH_CANCEL, evt);
            cancelSwipeGesture(this);
        }
    };
    onMouseDown[STATE_SWIPING] = function (evt) {
        // Analyse
        this.evtHandled = true;
        if (!this.inPause) {
            this.startTimer(this.options.holdTime);
        }
        var id = 'mouse' + (evt.which || 0);
        addMouseFinger(this, id, evt);
        // Trigger
        evt.nbFinger = this.fingers.length;
        this.triggerEvent(EVT_MOUSE_DOWN, evt);
    };
    onMouseMove[STATE_SWIPING] = function (evt) {
        // Analyse
        if (!this.inPause) {
            this.startTimer(this.options.holdTime);
        }
        var id = 'mouse' + (evt.which || 0);
        if (hasFinger(this, id)) {
            this.evtHandled = true;
            setMouseFinger(this, id, evt);
            if (this.finger1.id == id) {
                addSourcePoint(this);
            }
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_MOUSE_MOVE, evt);
            continueSwipeGesture(this);
        }
    };
    onMouseUp[STATE_SWIPING] = function (evt) {
        // Analyse
        if (!this.inPause) {
            this.clearTimeout();
        }
        var id = 'mouse' + (evt.which || 0);
        if (removeFinger(this, id)) {
            this.evtHandled = true;
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_MOUSE_UP, evt);
            endSwipeGesture(this);
        }
    };

    onEnter[STATE_SCROLLING] = function () {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'onEnter');
        this.inPause = false;
        this.startTimer(this.options.holdTime);
    };
    onExit[STATE_SCROLLING] = function () {
        this.clearTimeout();
    };
    onTimeout[STATE_SCROLLING] = function () {
        this.triggerEvent(GST_SCROLL_PAUSE, {
            clientX: this.finger1.clientX,
            clientY: this.finger1.clientY,
            pageX: this.finger1.pageX,
            pageY: this.finger1.pageY,
            nbFinger: this.fingers.length,
            side: this.side,
            moves: this.moves,
            sourcePoints: this.sourcePoints,
            timeStamp: this.timeStamp
        });
        this.inPause = true;
    };
    onTouchStart[STATE_SCROLLING] = function (evt) {
        // Analyse
        this.evtHandled = true;
        if (!this.inPause) {
            this.startTimer(this.options.holdTime);
        }
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            addTouchFinger(this, id, finger);
        }
        // Trigger
        evt.nbFinger = this.fingers.length;
        this.triggerEvent(EVT_TOUCH_START, evt);
    };
    onTouchMove[STATE_SCROLLING] = function (evt) {
        // Analyse
        if (!this.inPause) {
            this.startTimer(this.options.holdTime);
        }
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            if (hasFinger(this, id)) {
                this.evtHandled = true;
                setTouchFinger(this, id, finger);
                if (this.finger1.id == id) {
                    addSourcePoint(this);
                }
            }
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_TOUCH_MOVE, evt);
            continueScrollGesture(this);
        }
    };
    onTouchEnd[STATE_SCROLLING] = function (evt) {
        // Analyse
        if (!this.inPause) {
            this.clearTimeout();
        }
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            if (removeFinger(this, id)) {
                this.evtHandled = true;
            }
        }
        // Trigger
        // Validate GESTURE as soon as ONE finger is UP
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_TOUCH_END, evt);
            endScrollGesture(this);
        }
    };
    onTouchCancel[STATE_SCROLLING] = function (evt) {
        // Analyse
        if (!this.inPause) {
            this.clearTimeout();
        }
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            if (removeFinger(this, id)) {
                this.evtHandled = true;
            }
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_TOUCH_CANCEL, evt);
            cancelScrollGesture(this);
        }
    };
    onMouseDown[STATE_SCROLLING] = function (evt) {
        // Analyse
        this.evtHandled = true;
        if (!this.inPause) {
            this.startTimer(this.options.holdTime);
        }
        var id = 'mouse' + (evt.which || 0);
        addMouseFinger(this, id, evt);
        // Trigger
        evt.nbFinger = this.fingers.length;
        this.triggerEvent(EVT_MOUSE_DOWN, evt);
    };
    onMouseMove[STATE_SCROLLING] = function (evt) {
        // Analyse
        if (!this.inPause) {
            this.startTimer(this.options.holdTime);
        }
        var id = 'mouse' + (evt.which || 0);
        if (hasFinger(this, id)) {
            this.evtHandled = true;
            setMouseFinger(this, id, evt);
            if (this.finger1.id == id) {
                addSourcePoint(this);
            }
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_MOUSE_MOVE, evt);
            continueScrollGesture(this);
        }
    };
    onMouseUp[STATE_SCROLLING] = function (evt) {
        // Analyse
        if (!this.inPause) {
            this.clearTimeout();
        }
        var id = 'mouse' + (evt.which || 0);
        if (removeFinger(this, id)) {
            this.evtHandled = true;
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_MOUSE_UP, evt);
            endScrollGesture(this);
        }
    };

    onEnter[STATE_DRAGGING] = function () {
        //a4p.InternalLog.log('a4p.Sense ' + sense.name + ' ' + sense.state, 'onEnter');
        clearDrops(this);
        this.inPause = false;
        this.startTimer(this.options.holdTime);
    };
    onExit[STATE_DRAGGING] = function () {
        this.clearTimeout();
    };
    onTimeout[STATE_DRAGGING] = function () {
        this.triggerEvent(GST_DRAG_PAUSE, {
            clientX: this.finger1.clientX,
            clientY: this.finger1.clientY,
            pageX: this.finger1.pageX,
            pageY: this.finger1.pageY,
            nbFinger: this.fingers.length,
            side: this.side,
            moves: this.moves,
            sourcePoints: this.sourcePoints,
            timeStamp: this.timeStamp
        });
        this.inPause = true;
    };
    onTouchStart[STATE_DRAGGING] = function (evt) {
        // Analyse
        this.evtHandled = true;
        if (!this.inPause) {
            this.startTimer(this.options.holdTime);
        }
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            addTouchFinger(this, id, finger);
        }
        // Trigger
        evt.nbFinger = this.fingers.length;
        this.triggerEvent(EVT_TOUCH_START, evt);
    };
    onTouchMove[STATE_DRAGGING] = function (evt) {
        // Analyse
        if (!this.inPause) {
            this.startTimer(this.options.holdTime);
        }
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            if (hasFinger(this, id)) {
                this.evtHandled = true;
                setTouchFinger(this, id, finger);
                if (this.finger1.id == id) {
                    addSourcePoint(this);
                }
            }
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_TOUCH_MOVE, evt);
            continueDragGesture(this);
        }
    };
    onTouchEnd[STATE_DRAGGING] = function (evt) {
        // Analyse
        if (!this.inPause) {
            this.clearTimeout();
        }
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            if (hasFinger(this, id)) {
                this.evtHandled = true;
                break;
            }
        }
        // Trigger
        // Validate GESTURE as soon as ONE finger is UP
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_TOUCH_END, evt);
            dropStart(this);
            dropEnd(this);
            this.gotoState(STATE_0CLICK);
        }
    };
    onTouchCancel[STATE_DRAGGING] = function (evt) {
        // Analyse
        if (!this.inPause) {
            this.clearTimeout();
        }
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var finger = evt.changedTouches[i];
            var id = finger.identifier;
            if (removeFinger(this, id)) {
                this.evtHandled = true;
            }
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_TOUCH_CANCEL, evt);
            dropCancel(this);
            this.gotoState(STATE_0CLICK);
        }
    };
    onMouseDown[STATE_DRAGGING] = function (evt) {
        // Analyse
        this.evtHandled = true;
        if (!this.inPause) {
            this.startTimer(this.options.holdTime);
        }
        var id = 'mouse' + (evt.which || 0);
        addMouseFinger(this, id, evt);
        // Trigger
        evt.nbFinger = this.fingers.length;
        this.triggerEvent(EVT_MOUSE_DOWN, evt);
    };
    onMouseMove[STATE_DRAGGING] = function (evt) {
        // Analyse
        if (!this.inPause) {
            this.startTimer(this.options.holdTime);
        }
        var id = 'mouse' + (evt.which || 0);
        if (hasFinger(this, id)) {
            this.evtHandled = true;
            setMouseFinger(this, id, evt);
            if (this.finger1.id == id) {
                addSourcePoint(this);
            }
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_MOUSE_MOVE, evt);
            continueDragGesture(this);
        }
    };
    onMouseUp[STATE_DRAGGING] = function (evt) {
        // Analyse
        if (!this.inPause) {
            this.clearTimeout();
        }
        var id = 'mouse' + (evt.which || 0);
        if (hasFinger(this, id)) {
            this.evtHandled = true;
        }
        // Trigger
        if (this.evtHandled) {
            evt.nbFinger = this.fingers.length;
            this.triggerEvent(EVT_MOUSE_UP, evt);
            dropStart(this);
            dropEnd(this);
            this.gotoState(STATE_0CLICK);
        }
    };

    return Sense;
})(navigator, window, document);
