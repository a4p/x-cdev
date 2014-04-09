'use strict';

directiveModule.directive('c4pModal', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            scope.$watch(attrs.c4pModal, function (value) {
                if (a4p.isUndefined(value)) {
                    element.modal('hide');
                } else if (value) {
                    element.modal('show');
                } else {
                    element.modal('hide');
                }
            });
        }
    }
});

directiveModule.directive('c4pPinbox', function () {
    return {
        restrict: 'CE',
        replace: false,
        link: function (scope, element, attrs) {
        	element.ready(function () {

        		var createPinbox = function(){
        			$(element[0]).pinbox();//.hide(0).fadeIn(10000);
        		};

        		setTimeout(createPinbox, 10000);

        	});
        }
    }
});


directiveModule.directive('c4pWaiting', function () {
    return {
        restrict: 'C',
        replace: false,
        link: function (scope, element, attrs) {
            if (scope.setSpinner) {
                scope.setSpinner(element[0]);
            }
        }
    }
});


directiveModule.directive('a4pRefresh', function () {
    return {
        restrict: 'A',
        template: "<div class='a4pRefresh'>" +
            "<span class='glyphicon glyphicon-refresh glyphicon-lg' ng-show='a4pSpinnerState == \"done\"'></span>" +
            "<span class='glyphicon glyphicon-refresh glyphicon-lg glyphicon-spin' ng-show='a4pSpinnerState == \"run\"'></span>" +
            "<span class='glyphicon glyphicon-refresh glyphicon-lg alert-error' ng-show='a4pSpinnerState == \"doneWithPb\"'></span>" +
            "<span class='glyphicon glyphicon-refresh glyphicon-lg close' ng-show='a4pSpinnerState == \"offline\"'></span>" +
            "</div>",
        //scope : '=',
        link: function (scope, element, attrs) {

            //a4pSpinnerState

            //	if (!scope.a4pSpin) {
            //		return; //scope.a4pSpin = new a4p.Spinner();
            //	}
            //scope.a4pSpin.init($(element).find('#a4pRefresh'));
        }
    }
});


/*
 *
 *



 //MLE : Needed to be sure that animation is done at the beginning
 //________________
 //same as you'd pass it to bind()
 //[fn] is the handler function
 $.fn.bindFirst = function(name, fn) {
 // bind as you normally would
 // don't want to miss out on any jQuery magic
 this.on(name, fn);

 // Thanks to a comment by @Martin, adding support for
 // namespaced events too.
 this.each(function() {
 var handlers = $._data(this, 'events')[name.split('.')[0]];
 // take out the handler we just inserted from the end
 var handler = handlers.pop();
 // move it at the beginning
 handlers.splice(0, 0, handler);
 });
 };




 (function() {
 // From: http://code.this.com/mobile/articles/fast_buttons.html
 //Also see: http://stackoverflow.com/questions/6300136/trying-to-implement-googles-fast-button


 // For IE8 and earlier compatibility: https://developer.mozilla.org/en/DOM/element.addEventListener
 function addListener(el, type, listener, useCapture) {
 if (el.addEventListener) {
 el.addEventListener(type, listener, useCapture);
 return {
 destroy: function() { el.removeEventListener(type, listener, useCapture); }
 };
 } else {
 // see: http://stackoverflow.com/questions/5198845/javascript-this-losing-context-in-ie
 var handler = function(e) { listener.handleEvent(window.event, listener); }
 el.attachEvent('on' + type, handler);

 return {
 destroy: function() { el.detachEvent('on' + type, handler); }
 };
 }
 }

 var isTouch = "ontouchstart" in window;

 // Construct the FastButton with a reference to the element and click handler.
 this.FastButton = function(element, handler, useCapture) {
 // collect functions to call to cleanup events
 this.events = [];
 this.touchEvents = [];
 this.element = element;
 this.handler = handler;
 this.useCapture = useCapture;
 if (isTouch)
 this.events.push(addListener(element, 'touchstart', this, this.useCapture));
 this.events.push(addListener(element, 'click', this, this.useCapture));
 };

 // Remove event handling when no longer needed for this button
 this.FastButton.prototype.destroy = function() {
 for (i = this.events.length - 1; i >= 0; i -= 1)
 this.events[i].destroy();
 this.events = this.touchEvents = this.element = this.handler = this.fastButton = null;
 };

 // acts as an event dispatcher
 this.FastButton.prototype.handleEvent = function(event) {
 switch (event.type) {
 case 'touchstart': this.onTouchStart(event); break;
 case 'touchmove': this.onTouchMove(event); break;
 case 'touchend': this.onClick(event); break;
 case 'click': this.onClick(event); break;
 }
 };

 // Save a reference to the touchstart coordinate and start listening to touchmove and
 // touchend events. Calling stopPropagation guarantees that other behaviors don�t get a
 // chance to handle the same click event. This is executed at the beginning of touch.
 this.FastButton.prototype.onTouchStart = function(event) {
 event.stopPropagation ? event.stopPropagation() : (event.cancelBubble=true);
 this.touchEvents.push(addListener(this.element, 'touchend', this, this.useCapture));
 this.touchEvents.push(addListener(document.body, 'touchmove', this, this.useCapture));
 this.startX = event.touches[0].clientX;
 this.startY = event.touches[0].clientY;
 };

 // When /if touchmove event is invoked, check if the user has dragged past the threshold of 10px.
 this.FastButton.prototype.onTouchMove = function(event) {
 if (Math.abs(event.touches[0].clientX - this.startX) > 10 || Math.abs(event.touches[0].clientY - this.startY) > 10) {
 this.reset(); //if he did, then cancel the touch event
 }
 };

 // Invoke the actual click handler and prevent ghost clicks if this was a touchend event.
 this.FastButton.prototype.onClick = function(event) {
 event.stopPropagation ? event.stopPropagation() : (event.cancelBubble=true);
 this.reset();
 // Use .call to call the method so that we have the correct "this": https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/call
 var result = this.handler.call(this.element, event);
 if (event.type == 'touchend')
 clickbuster.preventGhostClick(this.startX, this.startY);
 return result;
 };

 this.FastButton.prototype.reset = function() {
 for (i = this.touchEvents.length - 1; i >= 0; i -= 1)
 this.touchEvents[i].destroy();
 this.touchEvents = [];
 };

 this.clickbuster = function() {}

 // Call preventGhostClick to bust all click events that happen within 25px of
 // the provided x, y coordinates in the next 2.5s.
 this.clickbuster.preventGhostClick = function(x, y) {
 clickbuster.coordinates.push(x, y);
 window.setTimeout(clickbuster.pop, 2500);
 };

 this.clickbuster.pop = function() {
 clickbuster.coordinates.splice(0, 2);
 };

 // If we catch a click event inside the given radius and time threshold then we call
 // stopPropagation and preventDefault. Calling preventDefault will stop links
 // from being activated.
 this.clickbuster.onClick = function(event) {
 for (var i = 0; i < clickbuster.coordinates.length; i += 2) {
 var x = clickbuster.coordinates[i];
 var y = clickbuster.coordinates[i + 1];
 if (Math.abs(event.clientX - x) < 25 && Math.abs(event.clientY - y) < 25) {
 event.stopPropagation ? event.stopPropagation() : (event.cancelBubble=true);
 event.preventDefault ? event.preventDefault() : (event.returnValue=false);
 }
 }
 };

 if (isTouch) {
 // Don't need to use our custom addListener function since we only bust clicks on touch devices
 document.addEventListener('click', clickbuster.onClick, true);
 clickbuster.coordinates = [];
 }
 })(this);

 (function($) {
 $.event.special.fastClick = {
 setup: function () {
 $(this).data('fastClick', new FastButton(this, $.event.special.fastClick.handler));
 },
 teardown: function () {
 $(this).data('fastClick').destroy();
 $(this).removeData('fastClick');
 },
 handler: function (e) {
 // convert native event to jquery event
 e = $.event.fix(e);
 e.type = 'fastClick';


 //event.handle is deprecated and removed as of version 1.9
 //use event.dispatch instead,
 //$.event.handle.apply(this, arguments);
 $.event.dispatch.apply(this, arguments);
 }
 };

 $.fn.fastClick = function(fn) {
 return $(this).each(function() {
 return fn ? $(this).bind("fastClick", fn) : $(this).trigger("fastClick");
 });
 };
 }(jQuery));



 directiveModule.directive('ngTap', function() {
 return function(scope, element, attrs) {
 var tapping;
 tapping = false;

 element.bind('touchstart', function(e) {
 element.addClass('active');
 //element.css({'-webkit-transform':'perspective(800) rotateX(45deg)'});
 tapping = true;
 });
 element.bind('touchmove', function(e) {
 element.removeClass('active');
 tapping = false;
 });
 element.bind('touchend', function(e) {
 element.removeClass('active');

 if (tapping) {
 element.css({'-webkit-transform':'perspective(800) rotateX(20deg)'});
 scope.$apply(attrs['ngTap'], element);
 }
 });
 };
 });


 directiveModule.directive('ngFastClick', function() {
 return function(scope, element, attrs) {
 element.ngFastClick(function (e) {
 scope.$apply(attrs.ngFastClick);
 })
 };
 });
 */

/*
directiveModule.directive('c4pConfigFeedback', function () {
    return {
        restrict: 'A',
        template: "" +
            "<div>" +
            "	<label>{{srvLocale.translations.htmlFormConfigFeedback}}</label>" +
            "	<a ng-click='sendFeedback()'>{{srvLocale.translations.htmlFormConfigFeedback}}</a>" +
            "</div>",
        //scope : '=',
        controller: 'ctrlConfig'
        link: function (scope, element, attrs) {


        }
    }
});*/

//
//  Must provide an animation for click; use css class = c4p-action or c4p-color-action-transparent or c4p-color-action-aside-transparent
//
var actionOnClick = function (scope, element, attrs) {
        var focus = function(){
            //element.focus();
            element.addClass('c4p-shadow-white');
        };
        var blur = function(){
            //element.blur();
            element.removeClass('c4p-shadow-white');
        };
        if (a4p.BrowserCapabilities.hasTouch) {
            element.bind('touchstart', function(e) {
                focus();
            });
            element.bind('touchend', function(e) {
                setTimeout(blur, 1500);
            });
        }
        else {
            element.bind('click', function(e) {
                focus();
                setTimeout(blur, 1500);
            });
        }
 };

 directiveModule.directive('c4pColorActionAsideTransparent', function() {
    return {
        restrict: 'C',
        replace: false,
        link: actionOnClick
    }
 });
 directiveModule.directive('c4pColorActionTransparent', function() {
    return {
        restrict: 'C',
        replace: false,
        link: actionOnClick
    }
 });

// Spinner Directive
var startSpinnerDirective = function (scope, element, attrs) {
        var launch = function(){
           console.log('Spinner Directive Start !');
            if (typeof window.spinnerplugin != 'undefined' && a4p.isDefined(window.spinnerplugin)) {
                window.spinnerplugin.show({
                    overlay: true, // defaults to true
                    timeout: 3     // defaults to 0 (no timeout)
                });
            } 
        };

        if (a4p.BrowserCapabilities.hasTouch) {
            element.bind('touchstart', function(e) {
                launch();
            });
        }
        else {
            element.bind('click', function(e) {
                launch();
            });
        }
};
directiveModule.directive('c4pAction', function() {
    return {
        restrict: 'C',
        replace: false,
        link: startSpinnerDirective
    }
});


// Thumbnails

directiveModule.directive('c4pThumb', function () {
    return {
        restrict: 'E',
        template:   "<div>" +
                    "</div>",
        link: function (scope, element, attrs) {
            
            console.log(' c4pThumb ');
            var text = attrs.text;
            var icon = attrs.icon;
            var indic = attrs.indic;
            var width = attrs.width;
            var height = attrs.height;
            var color = attrs.color;

            console.log(' c4pThumb '+ text+' '+icon+' '+indic+' '+color+' '+width+' '+height);
            
            var thumb = new a4p.Thumb(element[0]);
            thumb.add(text, indic, color, width, height);

        }
    }
});


