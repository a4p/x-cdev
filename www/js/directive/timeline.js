'use strict';


//Check Box
directiveModule.directive('c4pTimeline', function ($timeout) {
    return {
        restrict: 'E',
        template: "<div id='c4p-timeline'></div>",
        link: function (scope, element, attrs) {
            var postpone = $timeout(function() {
                var dataObject = scope.$eval(attrs.data);

                createStoryJS({
                    type: 'timeline',
                    width: '100%',
                    height: (scope.getResizeHeight() - scope.getResizePathValue('timeline_header', '', 'offsetHeight')),
                    source: dataObject,
                    embed_id: 'c4p-timeline',
                    css: 'l4p/libs/js/jquery-plugins/TimelineJS-master/compiled/css/timeline.css',
                    js: 'l4p/libs/js/jquery-plugins/TimelineJS-master/compiled/js/timeline.js'
                });
            }, 0);
        }
    }
});




