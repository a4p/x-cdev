'use strict';

// Namespace a4p
var a4p;
if (!a4p) a4p = {};

/**
 * Management of resize listeners
 */
a4p.Resize = (function (navigator, window, document) {

    //var nameExpr = "[a-zA-Z_][a-zA-Z0-9_-]*";
    //var nodeExpr = "(parentNode|previousElementSibling|nextElementSibling|firstElementChild|lastElementChild)";
    //var attrExpr = "(clientTop|clientLeft|clientWidth|clientHeight|offsetTop|offsetLeft|offsetWidth|offsetHeight)";
    //var subPathExpr = "(\\."+nodeExpr+")*";
    //var atPathExpr=new RegExp("@(("+nodeExpr+subPathExpr+")\\.)?"+attrExpr, "g");
    //var atResizerExpr=new RegExp("@("+nameExpr+")("+subPathExpr+")\\."+attrExpr, "g");

    var orientationChangeHandlerStarted = false;
    var orientationChangeEvent = false;
    var endRefreshResizersTimer = null;
    var endRefreshResizersTimeout = 200;
    var endRefreshResizersCount = 0;
    var rootListener = [];
    var listenersIndex = {};
    var rootScope = null;
    var attrIndex = {};// Dictionary of css attributes to read (some will be calculated by readers)
    var refreshWriteQueue = [];// List of writes to do

    // TODO : do all needed reads, and then do all writes in one pass to reduce CPU of reflow
    // TODO : limit at 1 refresh per frame

    function refreshResizers() {
        attrIndex = {};
        refreshWriteQueue = [];// List of writes to do
        var key, fn, nodeDependent, value;

        // Set readers list => Trigger the "Forced synchronous layout"
        for (var idx = 0, nb = rootListener.length; idx < nb; idx++) {
            var resizer = rootListener[idx];

            // Set scoped variables
            for (var varIdx= 0, varNb = resizer.scopeVars.length; varIdx < varNb; varIdx++) {
                key = resizer.scopeVars[varIdx].key;
                fn = resizer.scopeVars[varIdx].fn;
                nodeDependent = resizer.scopeVars[varIdx].nodeDependent;
                //this.scope[key] = 0;
                value = fn(resizer.scope, {});
                setVar(resizer, key, value);
            }
            // Set css attributes
            for (var cssIdx= 0, cssNb = resizer.cssKeys.length; cssIdx < cssNb; cssIdx++) {
                key = resizer.cssKeys[cssIdx].key;
                fn = resizer.cssKeys[cssIdx].fn;
                nodeDependent = resizer.cssKeys[cssIdx].nodeDependent;
                value = fn(resizer.scope, {});
                switch (key) {
                    case 'top':
                        //console.log('@'+resizer.name+'.clientTop = ' + value);
                        if (a4p.isDefined(listenersIndex[resizer.name]) && (listenersIndex[resizer.name].id == resizer.id)) {
                            attrIndex['@'+resizer.name+'.clientTop'] = value;
                            attrIndex['@'+resizer.name+'.offsetTop'] = value;
                        }
                        attrIndex['@'+resizer.id+'.clientTop'] = value;
                        attrIndex['@'+resizer.id+'.offsetTop'] = value;
                        break;
                    case 'left':
                        //console.log('@'+resizer.name+'.clientLeft = ' + value);
                        if (a4p.isDefined(listenersIndex[resizer.name]) && (listenersIndex[resizer.name].id == resizer.id)) {
                            attrIndex['@'+resizer.name+'.clientLeft'] = value;
                            attrIndex['@'+resizer.name+'.offsetLeft'] = value;
                        }
                        attrIndex['@'+resizer.id+'.clientLeft'] = value;
                        attrIndex['@'+resizer.id+'.offsetLeft'] = value;
                        break;
                    case 'width':
                        //console.log('@'+resizer.name+'.clientWidth = ' + value);
                        if (a4p.isDefined(listenersIndex[resizer.name]) && (listenersIndex[resizer.name].id == resizer.id)) {
                            attrIndex['@'+resizer.name+'.clientWidth'] = value;
                            attrIndex['@'+resizer.name+'.offsetWidth'] = value;
                        }
                        attrIndex['@'+resizer.id+'.clientWidth'] = value;
                        attrIndex['@'+resizer.id+'.offsetWidth'] = value;
                        break;
                    case 'height':
                        //console.log('@'+resizer.name+'.clientHeight = ' + value);
                        if (a4p.isDefined(listenersIndex[resizer.name]) && (listenersIndex[resizer.name].id == resizer.id)) {
                            attrIndex['@'+resizer.name+'.clientHeight'] = value;
                            attrIndex['@'+resizer.name+'.offsetHeight'] = value;
                        }
                        attrIndex['@'+resizer.id+'.clientHeight'] = value;
                        attrIndex['@'+resizer.id+'.offsetHeight'] = value;
                        break;
                    case 'minHeight':
                        break;
                    case 'minWidth':
                        break;
                    case 'lineHeight':
                        break;
                }
                refreshWriteQueue.push({
                    resizer:resizer,
                    cssAttr:key,
                    value:value,
                    nodeDependent:nodeDependent
                });
            }
        }

        // Exec writers list
        for (var jobIdx = 0, jobNb = refreshWriteQueue.length; jobIdx < jobNb; jobIdx++) {
            var job = refreshWriteQueue[jobIdx];
            setCss(job.resizer, job.cssAttr, ''+job.value+'px');
        }

        if (rootScope) a4p.safeApply(rootScope);
    }

    function endRefreshResizers() {
        if (endRefreshResizersCount) {
            //console.log("Redo endRefreshResizers");
        }

        var previousAttrIndex = attrIndex;
        var previousRefreshWrites = {};
        for (var i = 0, nb = refreshWriteQueue.length; i < nb; i++) {
            var job = refreshWriteQueue[i];
            previousRefreshWrites[job.resizer.id + '-' +job.cssAttr] = job.value;
        }

        refreshResizers();

        var dirty = false;
        for (var optKey in attrIndex) {
            if (!attrIndex.hasOwnProperty(optKey)) continue;
            if (previousAttrIndex[optKey] != attrIndex[optKey]) {
                dirty = true;
                a4p.ErrorLog.log('a4p.Resize', 'COLLATERAL ' + endRefreshResizersCount + ' effect of resizers upon ' + optKey
                    + ' : ' + previousAttrIndex[optKey] + ',' + attrIndex[optKey]
                    + ' : try to move some resize-css-* option in its DOM children.');
            }
        }
        for (var jobIdx = 0, jobNb = refreshWriteQueue.length; jobIdx < jobNb; jobIdx++) {
            var job = refreshWriteQueue[jobIdx];
            if (a4p.isUndefined(previousRefreshWrites[job.resizer.id + '-' +job.cssAttr])) {
                dirty = true;
                a4p.ErrorLog.log('a4p.Resize', 'COLLATERAL ' + endRefreshResizersCount + ' effect of resizers upon ' + job.resizer.name + '.' + job.cssAttr + ' which did not exist previously.');
            } else if (previousRefreshWrites[job.resizer.id + '-' +job.cssAttr] != job.value) {
                dirty = true;
                a4p.ErrorLog.log('a4p.Resize', 'COLLATERAL ' + endRefreshResizersCount + ' effect of resizers upon ' + job.resizer.name + '.' + job.cssAttr + ' which had another value previously.');
            }
        }

        if (dirty && !endRefreshResizersCount) {
            endRefreshResizersCount++;
            endRefreshResizersTimer = a4p.BrowserCapabilities.nextFrame(endRefreshResizers);
        } else {
            // AFTER having updated resizers, we now can broadcast EVT_WINDOW to Sense and Scroll objects
            // BEWARE : we MUST update resizers BEFORE transmitting event to Sense which will refresh SCROLLERS, or else maxScrollX==WrapperW-ScrollerW are false
            if (orientationChangeEvent) {
                /*
                Resize.clearWindowAll();
                windowAllTimeout();
                */
                Resize.windowAll();
            }
        }
    }

    function refreshAllTimeout() {
        /*
        a4p.InternalLog.log('a4p.Resize', 'refreshAllTimeout : resizeOrientation=' + Resize.resizeOrientation
            + ' resizePortrait=' + Resize.resizePortrait + ' resizeOneColumn=' + Resize.resizeOneColumn
            + ' resizeWidth=' + Resize.resizeWidth + ' resizeHeight=' + Resize.resizeHeight);
        */
        // Method 1 : ONE call only
        /*
        endRefreshResizers();
        */

        // Method 2 : TWO calls via nextFrame
        if (endRefreshResizersTimer) {
            a4p.BrowserCapabilities.cancelFrame(endRefreshResizersTimer);
            endRefreshResizersTimer = null;
        }

        refreshResizers();

        // Because writers can change again readers,
        // we should call again refreshResizers() if something has changed.
        // But we do it only once more after Browser had recalculated its layout.
        endRefreshResizersCount = 0;
        endRefreshResizersTimer = a4p.BrowserCapabilities.nextFrame(endRefreshResizers);

        // Method 3 : TWO calls via setTimeout
        /*
        if (endRefreshResizersTimer) {
            window.clearTimeout(endRefreshResizersTimer);
            endRefreshResizersTimer = null;
        }

        refreshResizers();

        // Because writers can change again readers,
        // we should call again refreshResizers() if something has changed.
        // But we do it only once more after Browser had recalculated its layout.
        endRefreshResizersTimer = window.setTimeout(endRefreshResizers, endRefreshResizersTimeout);
        */
    }

    function windowAllTimeout() {
        orientationChangeEvent = false;

        for (var idx = 0, nb = rootListener.length; idx < nb; idx++) {
            var resizer = rootListener[idx];
            resizer.triggerEvent(EVT_WINDOW, {
                id:resizer.id,
                name:resizer.name,
                resizeOrientation:Resize.resizeOrientation,
                resizePortrait:Resize.resizePortrait,
                resizeOneColumn:Resize.resizeOneColumn,
                resizeWidth:Resize.resizeWidth,
                resizeHeight:Resize.resizeHeight
            });
        }
    }

    function orderResizeListeners() {
        // reorder listeners (do only 1 pass even if dependency loops exist)
        var trace;
        /*
        var trace = rootListener.length + ' resizeListeners';
        for (var i = 0, nb = rootListener.length; i < nb; i++) {
            trace += '\n  [' + i + '] ' + rootListener[i].name;
        }
        a4p.InternalLog.log('a4p.Resize', 'before reorder : ' + trace);
        */
        Resize.isReordering = true;
        for (var idx = rootListener.length-1; idx >= 0; idx--) {
            var depNodes = rootListener[idx].dependingOnNodes();
            /*
            trace = rootListener[idx].name + ' depends on following nodes :';
            for (var i = 0, nb = depNodes.length; i < nb; i++) {
                trace += ' ' + depNodes[i];
            }
            a4p.InternalLog.log('a4p.Resize', trace);
            */
            moveResizeListenerAfterDependentNodes(rootListener[idx], depNodes);
        }
        Resize.isReordering = false;
        /*
        trace = rootListener.length + ' resizeListeners';
        for (var i = 0, nb = rootListener.length; i < nb; i++) {
            trace += '\n  [' + i + '] ' + rootListener[i].name;
        }
        a4p.InternalLog.log('a4p.Resize', 'after reorder : ' + trace);
        */
    }

    /**
     * Add a listener at highest priority level (do not depend on others)
     *
     * @param resizeListener
     */
    function addResizeListener(resizeListener) {
        if (a4p.isUndefinedOrNull(listenersIndex[resizeListener.id])) {
            listenersIndex[resizeListener.id] = resizeListener;
            rootListener.push(resizeListener);
            // Not perfect alternative key because duplicate key is possible and then old resize is hidden
            listenersIndex[resizeListener.name] = resizeListener;
            orderResizeListeners();
        }
    }

    /**
     * Remove a listener
     *
     * @param resizeListener
     */
    function removeResizeListener(resizeListener) {
        removeIdFromList(rootListener, resizeListener.id);
        if (a4p.isDefined(listenersIndex[resizeListener.id])) {
            delete listenersIndex[resizeListener.id];
        }
        if (a4p.isDefined(listenersIndex[resizeListener.name]) && (listenersIndex[resizeListener.name].id == resizeListener.id)) {
            delete listenersIndex[resizeListener.name];
        }
    }

    function moveResizeListenerAfterDependentNodes(resizeListener, dependentNodeNames) {
        var selfIdx, nb = rootListener.length, depNb = dependentNodeNames.length;
        for (selfIdx=0; selfIdx < nb; selfIdx++) {
            if (rootListener[selfIdx].id == resizeListener.id) break;
        }
        var lastDepIdx = selfIdx;
        for (var otherIdx = selfIdx+1; otherIdx < nb; otherIdx++) {
            var otherListenerId = rootListener[otherIdx].id;
            for (var depIdx = 0; depIdx < depNb; depIdx++) {
                var depName = dependentNodeNames[depIdx];
                if (otherListenerId == listenersIndex[depName].id) {
                    lastDepIdx = otherIdx;
                    break;
                }
            }
        }
        if (lastDepIdx > selfIdx) {
            rootListener.splice(selfIdx, 1);
            rootListener.splice(lastDepIdx, 0, resizeListener);
            /*
            var trace = rootListener.length + ' resizeListeners';
            for (var i = 0, nb = rootListener.length; i < nb; i++) {
                trace += '\n  [' + i + '] ' + rootListener[i].name;
            }
            a4p.InternalLog.log('a4p.Resize', 'reorder : ' + trace);
            */
        }
    }

    function setVar(self, name, newValue) {
        //a4p.InternalLog.log('a4p.Resize ' + self.name, 'setVar ' + name + '=' + newValue);
        self.scope[name] = newValue;
    }

    function setCss(self, name, newValue) {
        //a4p.InternalLog.log('a4p.Resize ' + self.name, 'setCss ' + name + '=' + newValue);
        var oldValue = self.DOMelement.style[name];
        //self.DOMelement.style[name] = newValue;
        self.element.css(name, newValue);
        if (newValue !== oldValue) {
            //a4p.InternalLog.log('a4p.Resize ' + self.name, 'set its css attribute ' + name + ' to ' + newValue);
            window.setTimeout(function() {
                self.triggerEvent(EVT_CHANGED, {
                    id:self.id,
                    name:self.name,
                    attr:name,
                    value:newValue
                });
            }, a4p.BrowserCapabilities.isAndroid ? 200 : 0);
        }
    }

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

    // Basic events transmitted to user

    var EVT_BEFORE_WINDOW = 'BeforeWindow';// When viewport has changed (orientation, size) but BEFORE updating Resizers
    var EVT_WINDOW = 'Window';// When viewport has changed (orientation, size)
    var EVT_CHANGED = 'Changed';

    // Gesture utilities

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

    function Resize($rootScope, scope, element, options) {
        rootScope = $rootScope;
        // State
        this.id = nextUid();
        this.name = this.id;
        this.scope = scope;
        this.timeStamp = 0;
        // JQLite element
        this.element = element;
        // DOM element
        /**
         * HTMLElement associated with this Resize listener
         * @type {HTMLElement}
         */
        this.DOMelement = null;
        if (typeof(element) == 'object') {
            this.DOMelement = element[0];
        } else {
            this.DOMelement = document.getElementById(element);
        }

        // Default options
        this.options = {
            callApply: false // use $apply on every event/gesture resize directive
        };

        // User defined options
        this.nodeList = [];
        this.nodeIndex = {};
        this.cssKeys = [];
        this.scopeVars = [];
        for (var optKey in options) {
            if (!options.hasOwnProperty(optKey)) continue;
            this.options[optKey] = options[optKey];
            if (optKey == 'name') {
                this.name = options[optKey];
            }
        }

        var self = this;

        // Add this listener
        addResizeListener(this);

        // BUG : element not destroyed (element $destroy not fired, but scope $destroy is fired)
        this.element.bind('$destroy', function () {
            self.destroy();
        });

        if (!orientationChangeHandlerStarted) {
            //a4p.InternalLog.log('a4p.Resize', 'window.addEventListener('+a4p.BrowserCapabilities.RESIZE_EVENT+', Resize.handleDocOrientationChange)');
            window.addEventListener(a4p.BrowserCapabilities.RESIZE_EVENT, Resize.handleDocOrientationChange, false);
            orientationChangeHandlerStarted = true;
            window.setTimeout(function() {
                a4p.safeApply($rootScope, function() {
                    Resize.handleDocOrientationChange();
                });
            }, 200);
        }
    }

    Resize.prototype.destroy = function () {
        // Unregister
        removeResizeListener(this);

        //a4p.InternalLog.log('a4p.Resize ' + this.name, 'delete Resize');
        return true;
    };

    // Static variables to be accessible from any Angular Controller

    Resize.initWidth = 0;
    Resize.initHeight = 0;
    Resize.initOrientation = 0;
    Resize.initPortrait = false;
    Resize.initPortrait0Orientation = false;

    Resize.resizeOrientation = "landscape";
    Resize.resizePortrait = false;
    Resize.resizeOneColumn = false;
    Resize.resizeWidth = 240;
    Resize.resizeHeight = 240;

    Resize.isReordering = false;

    // Triggering User events via angular directives

    Resize.prototype.triggerEvent = function (name, evt) {
        var toSenseEventName = 'toSense' + name;
        if (a4p.isDefined(this[toSenseEventName]) && (this[toSenseEventName] != null)) {
            try {
                //a4p.InternalLog.log('a4p.Resize ' + this.name, 'triggerEvent toSense '+name);
                this[toSenseEventName](evt);
            } catch (exception) {
                // handler may be destroyed
            }
        }
        var onEventName = 'on' + name;
        if (a4p.isDefined(this[onEventName]) && (this[onEventName] != null)) {
            try {
                //a4p.InternalLog.log('a4p.Resize ' + this.name, 'triggerEvent '+name);
                this[onEventName](evt);
            } catch (exception) {
                // handler may be destroyed
            }
            return true;
        }
        return false;
    };

    /*
    // Solution to resolve parent/scroll offsets found at http://www.greywyvern.com/?post=331
    function findBoundingClientRect(obj) {
        var curleft = 0, curtop = 0, scr = obj, fixed = false;
        while ((scr = scr.parentNode) && scr != document.body) {
            curleft -= scr.scrollLeft || 0;
            curtop -= scr.scrollTop || 0;
            if (getStyle(scr, "position") == "fixed") fixed = true;
        }
        if (fixed && !window.opera) {
            var scrDist = scrollDist();
            curleft += scrDist[0];
            curtop += scrDist[1];
        }
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
        return {
            left: curleft,
            top: curtop
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
    // Home-made solution
    function findBoundingClientRect(obj) {
        var offsetLeft = 0, offsetTop = 0;
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
            top:offsetTop
        };
    }
    function getPathValue(path, key) {
        var box, value;
        if (a4p.isDefinedAndNotNull(path)) {
            var node = eval("resizer.DOMelement."+path);
            if (key == 'offsetTop') {
                box = findBoundingClientRect(node);
                return box.top;
            } else if (key == 'offsetLeft') {
                box = findBoundingClientRect(node);
                return box.left;
            } else {
                return node[key];
            }
        } else {
            if (a4p.isDefined(attrIndex['@'+resizer.id+'.'+key])) {
                return attrIndex['@'+resizer.id+'.'+key];
            } else {
                if (key == 'offsetTop') {
                    box = findBoundingClientRect(resizer.DOMelement);
                    attrIndex['@'+resizer.id+'.offsetTop'] = box.top;
                    attrIndex['@'+resizer.id+'.offsetLeft'] = box.left;
                    return box.top;
                } else if (key == 'offsetLeft') {
                    box = findBoundingClientRect(resizer.DOMelement);
                    attrIndex['@'+resizer.id+'.offsetTop'] = box.top;
                    attrIndex['@'+resizer.id+'.offsetLeft'] = box.left;
                    return box.left;
                } else {
                    value = eval("resizer.DOMelement."+key);
                    attrIndex['@'+resizer.id+'.'+key] = value;
                    return value;
                }
            }
        }
    }
    */
    Resize.prototype.getPathValue = function (path, key) {
        var value = 0, node;
        try {
            if (a4p.isTrueOrNonEmpty(path)) {
                if (a4p.isDefined(attrIndex['@'+this.id+'.'+path+'.'+key])) {
                    value = attrIndex['@'+this.id+'.'+path+'.'+key];
                } else {
                    node = eval("this.DOMelement."+path);
                    if (Resize.isReordering) this.addDependentNode(node);
                    value = node[key];
                    if (a4p.isDefined(listenersIndex[this.name]) && (listenersIndex[this.name].id == this.id)) {
                        attrIndex['@'+this.name+'.'+path+'.'+key] = value;
                    }
                    attrIndex['@'+this.id+'.'+path+'.'+key] = value;
                    //a4p.InternalLog.log('a4p.Resize ' + this.name, 'getPathValue('+path+', '+key+')='+value);
                    return value;
                }
            } else {
                if (a4p.isDefined(attrIndex['@'+this.id+'.'+key])) {
                    value = attrIndex['@'+this.id+'.'+key];
                } else {
                    node = this.DOMelement;
                    value = node[key];
                    if (a4p.isDefined(listenersIndex[this.name]) && (listenersIndex[this.name].id == this.id)) {
                        attrIndex['@'+this.name+'.'+key] = value;
                    }
                    attrIndex['@'+this.id+'.'+key] = value;
                    //a4p.InternalLog.log('a4p.Resize ' + this.name, 'getPathValue('+path+', '+key+')='+value);
                    return value;
                }
            }
        } catch (e) {
            a4p.ErrorLog.log('a4p.Resize ' + this.name,
                'getPathValue('+path+', '+key+') has invalid parameters : ' + e.message);
        }
        return value;
    };

    Resize.prototype.addDependentNode = function (node) {
        var nodeResize = null;
        for (var i=0, nb=rootListener.length; i < nb; i++) {
            if (rootListener[i].DOMelement == node) {
                nodeResize = rootListener[i];
                break;
            }
        }
        if (nodeResize) {
            if (listenersIndex[nodeResize.name].id == nodeResize.id) {
                if (a4p.isUndefined(this.nodeIndex[nodeResize.name])) {
                    this.nodeIndex[nodeResize.name] = true;
                    this.nodeList.push(nodeResize.name);
                }
                if (a4p.isUndefined(this.nodeIndex[nodeResize.id])) {
                    this.nodeIndex[nodeResize.id] = true;
                }
            } else {
                if (a4p.isUndefined(this.nodeIndex[nodeResize.id])) {
                    this.nodeIndex[nodeResize.id] = true;
                    this.nodeList.push(nodeResize.id);
                }
            }
        }
    };

    Resize.prototype.addScopeVar = function (key, fn) {
        this.scope[key] = 0;
        // Determine if this value depends on other nodes or not
        this.tmpNodeDependent = false;
        fn(this.scope, {});
        this.scopeVars.push({key:key, fn:fn, nodeDependent:this.tmpNodeDependent});
    };

    Resize.prototype.addCssKey = function (key, fn) {
        // Determine if this value depends on other nodes or not
        this.tmpNodeDependent = false;
        fn(this.scope, {});
        if (!this.tmpNodeDependent) {
            a4p.ErrorLog.log('a4p.Resize', 'USELESS resize-css-' + key + ' option in resizer ' + this.name
                + ' : try to use style="' + key + ':..." or ng-style="{' + key
                + ':getResize...()+\'px\'}" to calculate it asap.');
            // ng-style="{width:getResizeWidth()+'px', height:getResizeHeight()+'px'}"
            // ng-style="{minHeight:getResizeHeight()+'px'}"
        }
        this.cssKeys.push({key:key, fn:fn, nodeDependent:this.tmpNodeDependent});
    };

    Resize.prototype.dependingOnNodes = function () {
        var key, fn;
        this.nodeList = [];
        this.nodeIndex = {};
        for (var varIdx= 0, varNb = this.scopeVars.length; varIdx < varNb; varIdx++) {
            key = this.scopeVars[varIdx].key;
            fn = this.scopeVars[varIdx].fn;
            //this.scope[key] = 0;
            fn(this.scope, {});
        }
        for (var cssIdx= 0, cssNb = this.cssKeys.length; cssIdx < cssNb; cssIdx++) {
            key = this.cssKeys[cssIdx].key;
            fn = this.cssKeys[cssIdx].fn;
            fn(this.scope, {});
        }
        return this.nodeList;
    };

    Resize.prototype.resize = function () {
        if (this.scopeVars.length > 0) {
            Resize.refreshAll();
            return true;
        }
        if (this.cssKeys.length > 0) {
            Resize.refreshAll();
            return true;
        }
        return false;
    };

    Resize.refreshAll = a4p.delay(refreshAllTimeout, 300);
    Resize.windowAll = a4p.delay(windowAllTimeout, 300);

    /*
    var windowTimer = null;
    Resize.clearWindowAll = function () {
        if (windowTimer != null) window.clearTimeout(windowTimer);
        windowTimer = null;
    };
    Resize.windowAll = function () {
        // Delay timer to be sure it will trigger ONLY after all resizers are up to date
        if (windowTimer != null) window.clearTimeout(windowTimer);
        windowTimer = window.setTimeout(function () {
            windowTimer = null;
            windowAllTimeout();
        }, 300);
    };
    */
    Resize.handleDocOrientationChange = function () {
        window.setTimeout(Resize.handleDocOrientationChangeDelay, 750);
    };

    Resize.handleDocOrientationChangeDelay = function () {
        // Pour forcer la page a avoir la taille du viewscreen (pour eviter d'avoir le scroll du browser)
        var html = document.documentElement;
        // BEWARE : width and height are switched under Android for example, but not all the times !!!
        // BEWARE : orientation is undefined under PC Chrome for example, and width and height are right !!!
        // => memorize the RIGHT ratio and orientation pairing at start : the sole moment where all is right
        // NO MORE VALID BECAUSE orientation == 0 at start under new Android for every orientations (then false value !)
        if (Resize.initWidth == 0) {
            a4p.InternalLog.log('a4p.Resize', 'INIT orientationChange : window.orientation=' + window.orientation
                + ', window.innerWidth=' + window.innerWidth + ', window.outerWidth=' + window.outerWidth
                + ', screen.width=' + screen.width + ', html.clientWidth=' + html.clientWidth
                + ', window.innerHeight=' + window.innerHeight + ', window.outerHeight=' + window.outerHeight
                + ', screen.height=' + screen.height + ', html.clientHeight=' + html.clientHeight);
            Resize.initWidth = html.clientWidth;
            if ((window.innerWidth > 0) && (window.innerWidth < Resize.initWidth)) {
                // In IOS, html attributes are no right the first time (ex: 1024*1024), while window.inner attributes seem better (ex: 1024*768).
                // Beware window.outer attributes are as false as html attributes (ex: 1024*1024)
                Resize.initWidth = window.innerWidth;
            }
            Resize.resizeWidth = Resize.initWidth;
            Resize.initHeight = html.clientHeight;
            if ((window.innerHeight > 0) && (window.innerHeight < Resize.initHeight)) {
                // In IOS, html attributes are no right the first time (ex: 1024*1024), while window attributes seem better (ex: 1024*768).
                // Beware window.outer attributes are as false as html attributes (ex: 1024*1024)
                Resize.initHeight = window.innerHeight;
            }
            Resize.resizeHeight = Resize.initHeight;
            // NB : screen attributes does not exist everywhere and seem not orientation dependent
            Resize.initOrientation = window.orientation;// 0 up, 90 left, -90 right, 180 down
            if (a4p.isUndefined(Resize.initOrientation) || (Resize.initOrientation == 0) || (Resize.initOrientation == 180)) {
                // Up or down side => orientation IS currently the default device orientation
                // At start, width and height are in their right place
                Resize.initPortrait = (Resize.initWidth < Resize.initHeight);
                Resize.initPortrait0Orientation = Resize.initPortrait;
            } else {
                // left or right side => orientation is NOT currently the default device orientation
                // At start, width and height are in their right place
                Resize.initPortrait = (Resize.initWidth < Resize.initHeight);
                Resize.initPortrait0Orientation = !Resize.initPortrait;
            }
            Resize.resizePortrait = Resize.initPortrait;
            Resize.resizeOrientation = (Resize.initPortrait ? 'portrait' : 'landscape');
            a4p.InternalLog.log('a4p.Resize', 'INIT orientation : initOrientation=' + Resize.initOrientation
                + ', initWidth=' + Resize.initWidth + ', initHeight=' + Resize.initHeight
                + ', initPortrait=' + Resize.initPortrait+ ', initPortrait0Orientation=' + Resize.initPortrait0Orientation);
            // TODO : save that in local storage, because orientation changes are not detected while application is paused
        } else {
            a4p.InternalLog.log('a4p.Resize', 'orientationChange : window.orientation=' + window.orientation
                + ', window.innerWidth=' + window.innerWidth + ', window.outerWidth=' + window.outerWidth
                + ', screen.width=' + screen.width + ', html.clientWidth=' + html.clientWidth
                + ', window.innerHeight=' + window.innerHeight + ', window.outerHeight=' + window.outerHeight
                + ', screen.height=' + screen.height + ', html.clientHeight=' + html.clientHeight);
            var initWidth = html.clientWidth;
            if ((window.innerWidth > 0) && (window.innerWidth < initWidth)) {
                // In IOS, html attributes are no right the first time (ex: 1024*1024), while window.inner attributes seem better (ex: 1024*768).
                // Beware window.outer attributes are as false as html attributes (ex: 1024*1024)
                initWidth = window.innerWidth;
            }
            var initHeight = html.clientHeight;
            if ((window.innerHeight > 0) && (window.innerHeight < initHeight)) {
                // In IOS, html attributes are no right the first time (ex: 1024*1024), while window attributes seem better (ex: 1024*768).
                // Beware window.outer attributes are as false as html attributes (ex: 1024*1024)
                initHeight = window.innerHeight;
            }
            if (a4p.isUndefined(window.orientation)) {
                // NO orientation change (desktop) => orientation IS determined by ratio width/height
                Resize.resizeOrientation = ((initWidth < initHeight) ? 'portrait' : 'landscape');
                Resize.resizePortrait = (initWidth < initHeight);
            } else {
                // Detect if initOrientation is valid or not by keeping priority for ratio width/height if all 4 are same
                if ((initWidth < initHeight)
                    && (window.innerWidth < window.innerHeight)
                    && (window.outerWidth < window.outerHeight)
                    && (html.clientWidth < html.clientHeight)) {
                    Resize.resizeOrientation = 'portrait';
                    Resize.resizePortrait = true;
                } else if ((initWidth >= initHeight)
                    && (window.innerWidth >= window.innerHeight)
                    && (window.outerWidth >= window.outerHeight)
                    && (html.clientWidth >= html.clientHeight)) {
                    Resize.resizeOrientation = 'landscape';
                    Resize.resizePortrait = false;
                } else {
                    if ((window.orientation == 0) || (window.orientation == 180)) {
                        // Up or down side => orientation IS currently the same as INITIALLY
                        Resize.resizeOrientation = (Resize.initPortrait0Orientation ? 'portrait' : 'landscape');
                        Resize.resizePortrait = Resize.initPortrait0Orientation;
                    } else {
                        // left or right side => orientation is NOT currently the same as INITIALLY
                        Resize.resizeOrientation = (Resize.initPortrait0Orientation ? 'landscape' : 'portrait');
                        Resize.resizePortrait = !Resize.initPortrait0Orientation;
                    }
                }
            }
            if (Resize.resizePortrait) {
                // Width is the smallest value between initWidth and initHeight
                // Height is the biggest value between initWidth and initHeight
                Resize.resizeWidth = (initWidth < initHeight) ? initWidth : initHeight;
                Resize.resizeHeight = (initWidth < initHeight) ? initHeight : initWidth;
            } else {
                // Width is the biggest value between initWidth and initHeight
                // Height is the smallest value between initWidth and initHeight
                Resize.resizeWidth = (initWidth >= initHeight) ? initWidth : initHeight;
                Resize.resizeHeight = (initWidth >= initHeight) ? initHeight : initWidth;
            }
        }

        document.body.style.width = Resize.resizeWidth + 'px';
        document.body.style.height = Resize.resizeHeight + 'px';


        //document.body.setAttribute("class", Resize.resizeOrientation);
        //document.body.setAttribute("orient", Resize.resizeOrientation);
        /*
        switch (window.orientation) {
            case 0:
                Resize.resizeOrientation = "portrait";
                document.body.setAttribute("orient", Resize.resizeOrientation);
                break;
            case -90:
                Resize.resizeOrientation = "landscape";
                document.body.setAttribute("orient", Resize.resizeOrientation);
                break;
            case 90:
                Resize.resizeOrientation = "landscape";
                document.body.setAttribute("orient", Resize.resizeOrientation);
                break;
            case 180:
                Resize.resizeOrientation = "portrait";
                document.body.setAttribute("orient", Resize.resizeOrientation);
                break;
        }
        */
        if (Resize.resizeWidth < 500) {// 768
            Resize.resizeOneColumn = true;
            document.body.setAttribute("resizeOneColumn", "1");
        } else {
            Resize.resizeOneColumn = false;
            document.body.setAttribute("resizeOneColumn", "0");
        }
        a4p.InternalLog.log('a4p.Resize', 'orientationChange : resizeOrientation=' + Resize.resizeOrientation
            + ', resizePortrait=' + Resize.resizePortrait + ', resizeOneColumn=' + Resize.resizeOneColumn
            + ', resizeWidth=' + Resize.resizeWidth + ', resizeHeight=' + Resize.resizeHeight);

        // prevent iOS fixed pb still usefull ?
        // cf. http://stackoverflow.com/questions/7970389/ios-5-fixed-positioning-and-virtual-keyboard
        window.setTimeout(function() {
            var scrollTop = $(window).scrollTop();
            //var offsetTop = $('body').offset().top;
            if (scrollTop <= 0) {
	          //$("body").css("height", "+=1").css("height", "-=1");
	          //$("body").scrollTop();
	          //$("body").scroll(0);
	          window.scrollTo(0,0);
              //$('body,html').animate({'scrollTop': '0'}, 10000);
            }
        });

        // Triggers listeners BEFORE updating Resizers
        for (var idx = 0, nb = rootListener.length; idx < nb; idx++) {
            var resizer = rootListener[idx];
            resizer.triggerEvent(EVT_BEFORE_WINDOW, {
                id:resizer.id,
                name:resizer.name,
                resizeOrientation:Resize.resizeOrientation,
                resizePortrait:Resize.resizePortrait,
                resizeOneColumn:Resize.resizeOneColumn,
                resizeWidth:Resize.resizeWidth,
                resizeHeight:Resize.resizeHeight
            });
        }
        // BEWARE : we MUST update resizers BEFORE transmitting event to Sense which will refresh SCROLLERS, or else maxScrollX==WrapperW-ScrollerW are false
        orientationChangeEvent = true;
        Resize.refreshAll();
    };

    /**
     * Integration with angular directives
     *
     * @param directiveModule
     */
    Resize.declareDirectives = function (directiveModule) {
        angular.forEach([EVT_BEFORE_WINDOW, EVT_WINDOW, EVT_CHANGED], function (name) {
            var directiveName = "resize" + name.charAt(0).toUpperCase() + name.slice(1);
            var eventName = name.charAt(0).toUpperCase() + name.slice(1);
            directiveModule.directive(directiveName, ['$parse', '$rootScope', function ($parse, $rootScope) {
                return function (scope, element, attr) {
                    // Create only 1 Resize object for this DOM element
                    var resize = element.data("resize");
                    if (a4p.isUndefined(resize)) {
                        resize = Resize.newResize($parse, $rootScope, scope, element, attr);
                        var initFn = $parse(resize.options['init']);
                        initFn(scope, {$resize: resize});
                    }
                    var fn = $parse(attr[directiveName]);
                    resize['on' + eventName] = function (event) {
                        if (resize.options['callApply']) {
                            a4p.safeApply(scope, function() {
                                fn(scope, {$event: event});
                            });
                        } else {
                            fn(scope, {$event: event});
                        }
                    };
                };
            }]);
        });
        directiveModule.directive('resizeOpts', ['$parse', '$rootScope', function ($parse, $rootScope) {
            return function (scope, element, attr) {
                // Create only 1 Resize object for this DOM element
                var resize = element.data("resize");
                if (a4p.isUndefined(resize)) {
                    resize = Resize.newResize($parse, $rootScope, scope, element, attr);
                    var initFn = $parse(resize.options['init']);
                    initFn(scope, {$resize: resize});
                }
            };
        }]);
        directiveModule.directive('resizeVars', ['$parse', '$rootScope', function ($parse, $rootScope) {
            return function (scope, element, attr) {
                // Create only 1 Resize object for this DOM element
                var resize = element.data("resize");
                if (a4p.isUndefined(resize)) {
                    resize = Resize.newResize($parse, $rootScope, scope, element, attr);
                    var initFn = $parse(resize.options['init']);
                    initFn(scope, {$resize: resize});
                }
                var vars = $parse(attr['resizeVars'])(scope, {});
                for (var varName in vars) {
                    if (!vars.hasOwnProperty(varName)) continue;
                    var fn = $parse(vars[varName]);
                    resize.addScopeVar(varName, fn);
                }
            };
        }]);
        angular.forEach(['top', 'left', 'width', 'height', 'lineHeight', 'minHeight', 'minWidth' ], function (name) {
            var directiveName = "resizeCss" + name.charAt(0).toUpperCase() + name.slice(1);
            directiveModule.directive(directiveName, ['$parse', '$rootScope', function ($parse, $rootScope) {
                return function (scope, element, attr) {
                    // Create only 1 Resize object for this DOM element
                    var resize = element.data("resize");
                    if (a4p.isUndefined(resize)) {
                        resize = Resize.newResize($parse, $rootScope, scope, element, attr);
                        var initFn = $parse(resize.options['init']);
                        initFn(scope, {$resize: resize});
                    }
                    var fn = $parse(attr[directiveName]);
                    resize.addCssKey(name, fn);
                };
            }]);
        });
    };

    Resize.newResize = function ($parse, $rootScope, scope, element, attr) {
        var resize;
        var opts = {};
        if (a4p.isDefined(attr['resizeOpts'])) {
            opts = $parse(attr['resizeOpts'])(scope, {});
        }
        resize = new a4p.Resize($rootScope, scope, element, opts);
        element.data("resize", resize);
        // User function callable from Angular context
        scope.getResizeOrientation = function() {
            return Resize.resizeOrientation;// document orientation
        };
        scope.getResizePortrait = function() {
            return Resize.resizePortrait;// document orientation is portrait ?
        };
        scope.getResizeOneColumn = function() {
            return Resize.resizeOneColumn;
        };
        scope.getResizeWidth = function() {
            return Resize.resizeWidth;// document width
        };
        scope.getResizeHeight = function() {
            return Resize.resizeHeight;// document height
        };
        scope.getResizeId = function() {
            return resize.id;
        };
        scope.getResizeName = function() {
            return resize.name;
        };
        scope.getPathValue = function(path, key) {
            resize.tmpNodeDependent = true;
            return resize.getPathValue(path, key);
        };
        scope.getResizePathValue = function(name, path, key) {
            resize.tmpNodeDependent = true;
            var resizer = listenersIndex[name];
            if (a4p.isDefined(resizer)) {
                if (Resize.isReordering) resize.addDependentNode(resizer.DOMelement);
                return resizer.getPathValue(path, key);
            } else {
                return 0;
            }
        };
        scope.resizeRefresh = function() {
            // DO NOT TRIGGER EVT_WINDOW because we are in a manual refresh
            resize.resize();
        };
        if (a4p.isDefined(resize.options['watchRefresh'])) {
            if (typeof resize.options['watchRefresh'] == "string") {
                scope.$watch(resize.options['watchRefresh'], function (newValue, oldValue) {
                	if (newValue === oldValue) return; // initialization
                    resize.resize();
                });
            } else {
                for (var i= 0,nb=resize.options['watchRefresh'].length; i<nb; i++) {
                    scope.$watch(resize.options['watchRefresh'][i], function (newValue, oldValue) {
                    	if (newValue === oldValue) return; // initialization
                        resize.resize();
                    });
                }
            }
        }
        Resize.refreshAll();
        //a4p.InternalLog.log('a4p.Resize ' + this.name, 'new Resize');
        return resize;
    };

    Resize.getResize = function (name) {
        if (a4p.isDefined(listenersIndex[name])) {
            return listenersIndex[name];
        } else {
            return null;
        }
    };

    return Resize;
})(navigator, window, document);
