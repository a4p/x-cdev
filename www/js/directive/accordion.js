'use strict';


/**
 * Patched version of ui-bootstrap
 */


angular.module("template/c4p-accordion/accordion-group.html", []).run(["$templateCache", function ($templateCache) {
    $templateCache.put("template/c4p-accordion/accordion-group.html",
        "<div class=\"c4p-accordion-group\">" +
            "  <div class=\"pull-right c4p-accordion-heading\" >" +
            "	<a class=\"c4p-accordion-toggle\" ng-click=\"isOpen = !isOpen\" c4p-accordion-transclude-heading=\"heading\">{{heading}}</a>" +
            "  </div>" +
            // " is open :{{isOpen}}" +
            "  <div ng-transclude></div>" +
            // "  <div c4p-accordion-transclude-body=\"body\">{{body}}</div>"+
            "  <div class=\"c4p-accordion-item\" collapse=\"!isOpen\">" +
            "    <div class=\"c4p-accordion-inner clearfix\" c4p-accordion-transclude-item=\"item\">{{item}}</div>" +
            "	 <a class=\"pull-right c4p-accordion-toggle\" ng-click=\"isOpen = !isOpen\"><span class=\"glyphicon glyphicon-chevron-up\"></span></a> " +
            "  </div>" +
            "</div>");
}]);

angular.module("template/c4p-accordion/accordion.html", []).run(["$templateCache", function ($templateCache) {
    $templateCache.put("template/c4p-accordion/accordion.html",
        "<div class=\"c4p-accordion\" ng-transclude></div>");
}]);


angular.module('a4p.bootstrap.accordion', ['ui.bootstrap.transition', 'ui.bootstrap.collapse', "template/c4p-accordion/accordion-group.html", "template/c4p-accordion/accordion.html"])
    .constant('c4pAccordionConfig', {
        closeOthers: true
    })
    .controller('c4pAccordionController', ['$scope', '$attrs', 'c4pAccordionConfig', function ($scope, $attrs, accordionConfig) {

        // This array keeps track of the accordion groups
        this.groups = [];
        this.changeFn = function () {
        };
        var self = this;

        // Ensure that all the groups in this accordion are closed, unless close-others explicitly says not to
        this.closeOthers = function (openGroup) {
            var closeOthers = angular.isDefined($attrs.closeOthers) ? $scope.$eval($attrs.closeOthers) : c4pAccordionConfig.closeOthers;
            if (closeOthers) {
                angular.forEach(this.groups, function (group) {
                    if (group !== openGroup) {
                        group.isOpen = false;
                    }
                });
            }
            this.updateScroll();
        };

        this.closeAll = function () {
            angular.forEach(this.groups, function (group) {
                group.isOpen = false;
            });
            this.updateScroll();
        };

        // This is called from the accordion-group directive to add itself to the accordion
        this.addGroup = function (groupScope) {
            var that = this;
            this.groups.push(groupScope);

            groupScope.$on('$destroy', function (event) {
                that.removeGroup(groupScope);
            });
            this.updateScroll();
        };

        this.setChangeFn = function (fn) {
            this.changeFn = fn;
        };

        this.updateScroll = function () {
            if ($scope.scrollRefresh) $scope.scrollRefresh();
        };

        // This is called from the accordion-group directive when to remove itself
        this.removeGroup = function (group) {
            var index = this.groups.indexOf(group);
            if (index !== -1) {
                this.groups.splice(this.groups.indexOf(group), 1);
                this.updateScroll();
            }
        };

    }])

// The accordion directive simply sets up the directive controller
// and adds an accordion CSS class to itself element.
    .directive('c4pAccordion', function () {
        return {
            restrict: 'EA',
            controller: 'c4pAccordionController',
            transclude: true,
            replace: false,
            templateUrl: 'template/c4p-accordion/accordion.html',
            link: function (scope, element, attrs) {
            }
        };
    })

// The accordion-group directive indicates a block of html that will expand and collapse in an accordion
    .directive('c4pAccordionGroup', ['$parse', '$transition', function ($parse, $transition) {
        return {
            require: '^c4pAccordion',         // We need this directive to be inside an accordion
            restrict: 'EA',
            transclude: true,              // It transcludes the contents of the directive into the template
            replace: true,                // The element containing the directive will be replaced with the template
            templateUrl: 'template/c4p-accordion/accordion-group.html',
            scope: { heading: '@', item: '@'},        // Create an isolated scope and interpolate the heading attribute onto this scope
            controller: ['$scope', function ($scope) {
                this.setHeading = function (element) {
                    this.heading = element;
                };
                this.setItem = function (element) {
                    this.item = element;
                };
                this.closeGroup = function () {
                    $scope.isOpen = false;
                };
                $scope.toggleGroup = function () {
                    $scope.isOpen = !$scope.isOpen;
                };
            }],
            link: function (scope, element, attrs, c4pAccordionCtrl) {
                var getIsOpen, setIsOpen;

                c4pAccordionCtrl.addGroup(scope);
                // var fnOnToggle = attrs.onToggle;
                // if (fnOnToggle) c4pAccordionCtrl.setChangeFn(fnOnToggle);

                if (attrs.isOpen) {
                    getIsOpen = $parse(attrs.isOpen);
                    setIsOpen = getIsOpen.assign;

                    scope.$watch(
                        function watchIsOpen() {
                            return getIsOpen(scope.$parent);
                        },
                        function updateOpen(value) {
                            scope.isOpen = value;
                        }
                    );

                    scope.isOpen = getIsOpen ? getIsOpen(scope.$parent) : false;
                }

                scope.$watch('isOpen', function (value) {
                    if (value) {
                        c4pAccordionCtrl.closeOthers(scope);
                    } else {
                        c4pAccordionCtrl.updateScroll();
                    }
                    if (setIsOpen) {
                        setIsOpen(scope.$parent, value);
                    }
                });
            }
        };
    }])


// Use accordion-heading below an accordion-group to provide a heading containing HTML
// <accordion-group>
//   <accordion-heading>Heading containing HTML - <img src="..."></accordion-heading>
// </accordion-group>
    .directive('c4pAccordionHeading', function () {
        return {
            restrict: 'E',
            transclude: true,   // Grab the contents to be used as the heading
            template: '',       // In effect remove this element!
            replace: true,
            require: '^c4pAccordionGroup',
            compile: function (element, attr, transclude) {
                return function link(scope, element, attr, c4pAccordionGroupCtrl) {
                    // Pass the heading to the accordion-group controller
                    // so that it can be transcluded into the right place in the template
                    // [The second parameter to transclude causes the elements to be cloned so that they work in ng-repeat]
                    c4pAccordionGroupCtrl.setHeading(transclude(scope, function () {
                    }));
                };
            }
        };
    })

    .directive('c4pAccordionItem', function () {
        return {
            restrict: 'E',
            transclude: true,   // Grab the contents to be used as the heading
            template: '',       // In effect remove this element!
            replace: true,
            require: ['^c4pAccordionGroup', '^c4pAccordion'],
            compile: function (element, attr, transclude) {
                return function link(scope, element, attr, ctrls) {

                    var c4pAccordionGroupCtrl = ctrls[0];
                    var c4pAccordionCtrl = ctrls[1];

                    scope.closeAccordionGroup = function () {
                        c4pAccordionGroupCtrl.closeGroup();
                    };

                    // Pass the heading to the accordion-group controller
                    // so that it can be transcluded into the right place in the template
                    // [The second parameter to transclude causes the elements to be cloned so that they work in ng-repeat]
                    c4pAccordionGroupCtrl.setItem(transclude(scope, function () {
                    }));
                };
            }
        };
    })

// Use in the accordion-group template to indicate where you want the heading to be transcluded
// You must provide the property on the accordion-group controller that will hold the transcluded element
// <div class="accordion-group">
//   <div class="accordion-heading" ><a ... accordion-transclude="heading">...</a></div>
//   ...
// </div>
    .directive('c4pAccordionTranscludeHeading', function () {
        return {
            require: '^c4pAccordionGroup',
            link: function (scope, element, attr, controller) {
                scope.$watch(function () {
                    return controller[attr.c4pAccordionTranscludeHeading];
                }, function (heading) {
                    if (heading) {
                        element.html('');
                        element.append(heading);
                    }
                });
            }
        };
    })

    .directive('c4pAccordionTranscludeItem', function () {
        return {
            require: '^c4pAccordionGroup',
            link: function (scope, element, attr, controller) {
                scope.$watch(function () {
                    return controller[attr.c4pAccordionTranscludeItem];
                }, function (item) {
                    if (item) {
                        element.html('');
                        element.append(item);
                    }
                });
            }
        };
    });


