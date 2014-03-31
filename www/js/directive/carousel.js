
'use strict';

/**
 * Patched version of ui-bootstrap
 */
angular.module("a4p/carousel/carousel.html", []).run(["$templateCache", function ($templateCache) {
    $templateCache.put("a4p/carousel/carousel.html",
            "<div ng-mouseenter=\"pause()\" ng-mouseleave=\"play()\" class=\"carousel\" sense-opts=\"{name:'slide', axeX:'scroll', axeY:'swipe'}\" sense-scrollopts=\"{scrollbarClass:'c4p-scrollbar'}\" sense-scrollend=\"scrollEnd($event)\">" +
            	   "<div class=\"carousel-inner\" ng-transclude></div>" +
                    //"    <a sense-tap=\"prev()\" class=\"carousel-control left\">&lsaquo;</a>" +
                    //"    <a sense-tap=\"next()\" class=\"carousel-control right\">&rsaquo;</a>" +
                    "</div>" +
                    "");
}]);

angular.module("a4p/carousel/slide.html", []).run(["$templateCache", function ($templateCache) {
    $templateCache.put("a4p/carousel/slide.html",
            "<div ng-class=\"{" +
                    "    'active': leaving || (active && !entering)," +
                    "    'prev': (next || active) && direction=='prev'," +
                    "    'next': (next || active) && direction=='next'," +
                    "    'right': direction=='prev'," +
                    "    'left': direction=='next'" +
                    "  }\" class=\"item\" ng-transclude></div>" +
                    "");
}]);

angular.module('a4p.bootstrap.carousel', ['ui.bootstrap.transition', 'a4p/carousel/carousel.html', 'a4p/carousel/slide.html'])
        .controller('A4PCarouselController', ['$scope', '$transition', '$q', function ($scope, $transition, $q) {
    var self = this,
            slides = self.slides = [],
            currentIndex = -1,
            currentTimeout, isPlaying;
    self.currentSlide = null;

    /* direction: "prev" or "next" */
    self.select = function (nextSlide, direction) {
    	//a4p.InternalLog.log('Directive Carousel Select '+nextSlide+' - '+ direction);
        var nextIndex = slides.indexOf(nextSlide);
        //Decide direction if it's not given
        if (a4p.isUndefined(direction)) {
            direction = nextIndex > currentIndex ? "next" : "prev";
        }
        if (nextSlide && nextSlide !== self.currentSlide) {
            if ($scope.$currentTransition) {
                $scope.$currentTransition.cancel();
                //Timeout so ng-class in template has time to fix classes for finished slide
                setTimeout(goNext);
            } else {
                goNext();
            }
        }
        function goNext() {

            //If we have a slide to transition from and we have a transition type and we're allowed, go
            if (self.currentSlide && angular.isString(direction) && !$scope.noTransition && nextSlide.$element) {

            	//a4p.InternalLog.log('Directive Carousel goNext 1 ='+nextSlide.$element.length);
            	//We shouldn't do class manip in here, but it's the same weird thing bootstrap does. need to fix sometime
                nextSlide.$element.addClass(direction);
                //nextSlide.$element[0].offsetWidth = nextSlide.$element[0].offsetWidth; //force reflow
                var elz = nextSlide.$element.find('item');
                var temp = elz.context.offsetWidth;

                //Set all other slides to stop doing their stuff for the new transition
                angular.forEach(slides, function (slide) {
                    angular.extend(slide, {direction:'', entering:false, leaving:false, active:false});
                });
            	//a4p.InternalLog.log('Directive Carousel goNext 3');
                angular.extend(nextSlide, {direction:direction, active:true, entering:true});
                angular.extend(self.currentSlide || {}, {direction:direction, leaving:true});

                //a4p.InternalLog.log('Directive Carousel goNext before closure');
                $scope.$currentTransition = $transition(nextSlide.$element, {});
                //a4p.InternalLog.log('Directive Carousel goNext before closure__');
                //We have to create new pointers inside a closure since next & current will change
                (function (next, current) {
                    //a4p.InternalLog.log('Directive Carousel goNext closure b');
                    $scope.$currentTransition.then(
                            function () {
                                //a4p.InternalLog.log('Directive Carousel goNext closure ba'+next+current);
                                transitionDone(next, current);
                            },
                            function () {
                                //a4p.InternalLog.log('Directive Carousel goNext closure bb'+next+current);
                                transitionDone(next, current);
                            }
                    );
                }(nextSlide, self.currentSlide));
            } else {
                transitionDone(nextSlide, self.currentSlide);
            }
            self.currentSlide = nextSlide;
            currentIndex = nextIndex;
            //every time you change slides, reset the timer
            restartTimer();
            //a4p.InternalLog.log('Directive Carousel goNext END');

        }

        function transitionDone(next, current) {
        	//a4p.InternalLog.log('Directive Carousel transitionDone');
            angular.extend(next, {direction:'', active:true, leaving:false, entering:false});
            angular.extend(current || {}, {direction:'', active:false, leaving:false, entering:false});
            $scope.$currentTransition = null;
        }
    };

    /* Allow outside people to call indexOf on slides array */
    self.indexOfSlide = function (slide) {
        return slides.indexOf(slide);
    };

    self.scrollEnd = function(event) {
        //a4p.InternalLog.log('scrollEnd ' + event.side);
        if (event && event.side == 'right') $scope.prev(); else $scope.next();
    };

    $scope.scrollEnd = function(event) {
        //a4p.InternalLog.log('scrollEnd ' + event.side);
        if (event && event.side == 'right') $scope.prev(); else $scope.next();
    };

    $scope.next = function () {
        //a4p.InternalLog.log('Directive Carousel - next ');
        var newIndex = (currentIndex + 1) % slides.length;
        return self.select(slides[newIndex], 'next');
    };

    $scope.prev = function () {
        //a4p.InternalLog.log('Directive Carousel - prev ');
        var newIndex = currentIndex - 1 < 0 ? slides.length - 1 : currentIndex - 1;
        return self.select(slides[newIndex], 'prev');
    };

    $scope.$watch('interval', restartTimer);
    function restartTimer() {
        if (currentTimeout) {
            clearTimeout(currentTimeout);
        }
        function go() {
            if (isPlaying) {
                $scope.next();
                restartTimer();
            } else {
                $scope.pause();
            }
        }

        var interval = +$scope.interval;
        if (!isNaN(interval) && interval >= 0) {
            currentTimeout = setTimeout(go, interval);
        }
    }

    $scope.play = function () {
        if (!isPlaying) {
            isPlaying = true;
            restartTimer();
        }
    };
    $scope.pause = function () {
        isPlaying = false;
        if (currentTimeout) {
            clearTimeout(currentTimeout);
        }
    };

    self.addSlide = function (slide, element) {
        //a4p.InternalLog.log('Directive Carousel - addSlide '+element);
        slide.$element = element;
        slides.push(slide);
        //if this is the first slide or the slide is set to active, select it
        if (slides.length === 1 || slide.active) {
            self.select(slides[slides.length - 1]);
            if (slides.length == 1) {
                $scope.play();
            }
        } else {
            slide.active = false;
        }
    };

    self.removeSlide = function (slide) {
        //get the index of the slide inside the carousel
        var index = slides.indexOf(slide);
        slides.splice(index, 1);
        if (slides.length > 0 && slide.active) {
            if (index >= slides.length) {
                self.select(slides[index - 1]);
            } else {
                self.select(slides[index]);
            }
        }
    };
}]).directive('a4pCarousel', [function () {
    return {
        restrict:'EA',
        transclude:true,
        replace:true,
        controller:'A4PCarouselController',
        require:'a4pCarousel',
        templateUrl:'a4p/carousel/carousel.html',
        scope:{
            interval:'=',
            noTransition:'='
        }
    };
}]).directive('a4pSlide', [function () {
    return {
        require:'^a4pCarousel',
        restrict:'EA',
        transclude:true,
        replace:true,
        templateUrl:'a4p/carousel/slide.html',
        scope:{
            active:'='
        },
        link:function (scope, element, attrs, carouselCtrl) {
            carouselCtrl.addSlide(scope, element);
            //when the scope is destroyed then remove the slide from the current slides array
            scope.$on('$destroy', function () {
                carouselCtrl.removeSlide(scope);
            });

            scope.$watch('active', function (active) {
                if (active) {
                    carouselCtrl.select(scope);
                }
            });
            scope.$parent.scrollEnd = function(event){
            	carouselCtrl.scrollEnd(event);
            };
        }
    };
}]);



