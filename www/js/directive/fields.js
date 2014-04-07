
'use strict';


directiveModule.directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
}]);


/**
 * Upgrade of Angular's directive ngPluralizeDirective to take into account any change in whenExp
 * as we can change our language at any time.
 */
directiveModule.directive('c4pPluralize', ['$locale', '$interpolate', function ($locale, $interpolate) {
    var BRACE = /{}/g;
    return {
        restrict:'EA',
        link:function (scope, element, attrs) {
            var numberExp = attrs.count,
                whenExp = element.attr(attrs.$attr.when), // this is because we have {{}} in attrs
                offset = attrs.offset || 0;
            // whens = scope.$eval(whenExp)
            // whensExpFns = {}
            // forEach(whens, ...);

            scope.$watch(function () {
                var value = parseFloat(scope.$eval(numberExp));
                // Move whens and whensExpFns calculations here
                var whens = scope.$eval(whenExp);
                var whensExpFns = {};
                for (var key in whens) {
                    if (!whens.hasOwnProperty(key)) continue;
                    var whenValue = whens[key];
                    whensExpFns[key] = $interpolate(whenValue.replace(BRACE, '{{' + numberExp + '-' + offset + '}}'));
                }

                if (!isNaN(value)) {
                    //if explicit number rule such as 1, 2, 3... is defined, just use it. Otherwise,
                    //check it against pluralization rules in $locale service
                    if (!whens[value]) value = $locale.pluralCat(value - offset);
                    return whensExpFns[value](scope, element, true);
                } else {
                    return '';
                }
            }, function (newVal) {
                element.text(newVal);
            });
        }
    };
}]);

/**
 * This directive conditionally includes your template in the DOM structure based on a scope expression,
 * instead of only hiding it with style "display:none;".
 *
 * @usage
 * <ANY c4p-show="expression">...</ANY>
 * <ANY c4p-show on="expression">...</ANY>
 * <c4p-show on="expression">...</c4p-show>
 *
 * @param {*} c4pShow|on expression to match against true or false.
 *
 * @example
 <head>
     <style>
         .example-leave-setup, .example-enter-setup {
             -webkit-transition: all cubic-bezier(0.250, 0.460, 0.450, 0.940) 0.5s;
             -moz-transition: all cubic-bezier(0.250, 0.460, 0.450, 0.940) 0.5s;
             -ms-transition: all cubic-bezier(0.250, 0.460, 0.450, 0.940) 0.5s;
             -o-transition: all cubic-bezier(0.250, 0.460, 0.450, 0.940) 0.5s;
             transition: all cubic-bezier(0.250, 0.460, 0.450, 0.940) 0.5s;
         }
         .example-enter-setup {
             opacity: 0;
         }
         .example-enter-setup.example-enter-start {
             opacity: 1;
         }
         .example-leave-setup {
             opacity: 1;
         }
         .example-leave-setup.example-leave-start {
             opacity: 0;
         }
     </style>
     <script language="javascript">
         function Ctrl($scope) {
             $scope.items = ['settings', 'home', 'other'];
             $scope.selection = $scope.items[0];
         }
     </script>
 </head>
 <body ng-app="c4p">
 <div ng-controller="Ctrl">
     <select ng-model="selection" ng-options="item for item in items">
     </select>
     <p>selection={{selection}}</p>
     <hr/>
     <div c4p-show on="selection == 'home'"
          ng-animate="{enter: 'example-enter', leave: 'example-leave'}">
         <div>Home Span</div>
     </div>
 </div>
 </body>
 */
directiveModule.directive('c4pShow', ['$animate', function ($animate) {
    return {
        restrict:'EA',
        transclude: 'element',
        priority: 500,
        compile: function(element, attrs, transclude) {
          return function(scope, element, attr) {
              var animate = $animate;//(scope, attr);
              var watchExpr = attr.c4pShow || attr.on;
              var selectedScope = null;
              var selectedElement = null;
              scope.$watch(watchExpr, function (newVal) {
                  if (newVal) {
                      if (selectedScope == null) {
                          selectedScope = scope;
                          //selectedScope = scope.$new();
                          transclude(selectedScope, function(showElement) {
                              var anchor = element;
                              selectedElement = showElement;
                              animate.enter(showElement, anchor.parent(), anchor);
                          });
                      }
                  } else {
                      if (selectedScope != null) {
                          //selectedScope.$destroy();
                          animate.leave(selectedElement);
                          selectedScope = null;
                          selectedElement = null;
                      }
                  }
              });
          };
        }
    };
}]);

directiveModule.directive('c4pHide', ['$animate', function ($animate) {
    return {
        restrict:'EA',
        transclude: 'element',
        priority: 500,
        compile: function(element, attrs, transclude) {
          return function(scope, element, attr) {
              var animate = $animate;//(scope, attr);
              var watchExpr = attr.c4pHide || attr.on;
              var selectedScope = scope;
              //var selectedScope = scope.$new();
              var selectedElement = null;
              transclude(selectedScope, function(showElement) {
                  var anchor = element;
                  selectedElement = showElement;
                  animate.enter(showElement, anchor.parent(), anchor);
              });
              scope.$watch(watchExpr, function (newVal) {
                  if (newVal) {
                      if (selectedScope != null) {
                          //selectedScope.$destroy();
                          animate.leave(selectedElement);
                          selectedScope = null;
                          selectedElement = null;
                      }
                  } else {
                      if (selectedScope == null) {
                          selectedScope = scope;
                          //selectedScope = scope.$new();
                          transclude(selectedScope, function(showElement) {
                              var anchor = element;
                              selectedElement = showElement;
                              animate.enter(showElement, anchor.parent(), anchor);
                          });
                      }
                  }
              });
          };
        }
    };
}]);




/**
 * Example : <input ng-model="sth" ng-trim="false" no-space-and-lower-case />
 */
directiveModule.directive('noSpaceAndLowerCase', function () {
    return {
        require:'ngModel',
        link:function (scope, element, attrs, ngModelCtrl) {
            ngModelCtrl.$parsers.push(function (inputValue) {
                var transformedInput = inputValue.toLowerCase().replace(/ /g, '');
                if (transformedInput != inputValue) {
                    ngModelCtrl.$setViewValue(transformedInput);
                    ngModelCtrl.$render();
                }
                return transformedInput;
            });
        }
    };
});

directiveModule.directive('zippy', function () {
    return {
        restrict:'C',
        // This HTML will replace the zippy directive.
        replace:true,
        transclude:true,
        scope:{ title:'@zippyTitle' },
        template:'<div>' +
            '<div class="title">{{title}}</div>' +
            '<div class="body" ng-transclude></div>' +
            '</div>',
        // The linking function will add behavior to the template
        link:function (scope, element, attrs) {
            // Title element
            var title = angular.element(element.children()[0]),
            // Opened / closed state
                opened = true;

            // Clicking on title should open/close the zippy
            title.bind('click', toggle);

            // Toggle the closed/opened state
            function toggle() {
                opened = !opened;
                element.removeClass(opened ? 'closed' : 'opened');
                element.addClass(opened ? 'opened' : 'closed');
            }

            // initialize the zippy
            toggle();
        }
    }
});

// Prevent ellipse or wrap
directiveModule.directive('c4pNoDot', function () {
    return {
        restrict:'CA',
        link:function (scope, element, attrs) {
        //compile: function compile(element, attrs, transclude) {

        	var originalFontSize = element.css('font-size');
        	originalFontSize = parseInt(originalFontSize.substring(0, originalFontSize.length - 2));

        	var container = element.parent();
        	while (!container.hasClass('c4p-no-dot-container'))
        		container = container.parent();

        	//var originalWidth = 0;
    		//if (container && container.hasClass('c4p-no-dot-container'))
    		//	originalWidth = container[0].offsetWidth;

        	scope.$watch(attrs.c4pNoDot, function (value) {
                if (a4p.isUndefinedOrNull(value)) return;
                //element.find("a").attr('href', 'tel:' + encodeURIComponent(value));

            	var length = value.length;
            	var width = originalFontSize * length;
        		if (container && container.hasClass('c4p-no-dot-container'))
            		width = container[0].offsetWidth;

            	var fontSize = width * 1.5 / length; // Max is originalFontSize
            	if (originalFontSize < fontSize)
            		fontSize = originalFontSize;

            	fontSize = ''+fontSize+'px';
                a4p.InternalLog.log('c4pNoDot','l:'+length+' w:'+width+' fs:'+fontSize+' t:'+value);
            	element.css('font-size', fontSize);
            });


        }
    }
});


directiveModule.directive('c4pBackImg', function(){
    return function(scope, element, attrs){
        var url = attrs.c4pBackImg;
        element.css({
            'background': 'url(' + url +') no-repeat center center',
            'background-size' : 'cover',
            '-webkit-background-size' : 'cover'
        });
    }
});


directiveModule.directive('c4pDrawing', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
                
            var ctx = element[0].getContext('2d');

            // variable that decides if something should be drawn on mousemove
            var drawing = false;

            // the last coordinates before the current move
            var lastX;
            var lastY;

            element.bind('mousedown', function(event){
            if(event.offsetX!==undefined){
              lastX = event.offsetX;
              lastY = event.offsetY;
            } else { // Firefox compatibility
              lastX = event.layerX - event.currentTarget.offsetLeft;
              lastY = event.layerY - event.currentTarget.offsetTop;
            }

            // begins new line
            ctx.beginPath();

            drawing = true;
            });
            element.bind('mousemove', function(event){
            if(drawing){
              // get current mouse position
              if(event.offsetX!==undefined){
                currentX = event.offsetX;
                currentY = event.offsetY;
              } else {
                currentX = event.layerX - event.currentTarget.offsetLeft;
                currentY = event.layerY - event.currentTarget.offsetTop;
              }

              draw(lastX, lastY, currentX, currentY);

              // set current coordinates to last one
              lastX = currentX;
              lastY = currentY;
            }

            });
            element.bind('mouseup', function(event){
            // stop drawing
            drawing = false;
            });

            // canvas reset
            function reset(){
            element[0].width = element[0].width; 
            }

            function draw(lX, lY, cX, cY){
            // line from
            ctx.moveTo(lX,lY);
            // to
            ctx.lineTo(cX,cY);
            // color
            ctx.strokeStyle = "#4bf";
            // draw it
            ctx.stroke();
            }


        }
    }
});





