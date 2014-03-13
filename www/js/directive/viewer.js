

angular.module('c4p.viewer', [])
    .directive('c4pViewerContent', ['$compile', function ($compile) {

        return {
            restrict: 'E',
            replace: true,
            compile: function compile(element, attrs, transclude) {

                //----------------------------------------------------------------------
                // Private functions
                //----------------------------------------------------------------------
                var getObjDocType = function (objDoc) {

                    if (a4p.isUndefinedOrNull(objDoc)) {
                        return '';
                    }
                    if (c4p.Model.isImage(objDoc.extension)) {
                        return 'img';
                    }
                    else if (objDoc.a4p_type== 'Note') {
                        return 'note';
                    }
                    else if (objDoc.a4p_type== 'Report') {
                        return 'report';
                    }

                };

                //----------------------------------------------------------------------
                // link function
                //----------------------------------------------------------------------
                return function (scope, element, attrs) {

                    if ( a4p.isUndefinedOrNull(attrs.objVar)) {
                        return ;
                    }
                    if ( attrs.objVar == '') {
                        return ;
                    }

                    //scope.model = scope.$eval(attrs.ngModel);
                    scope.$watch(attrs.objVar, function (value, oldValue) {
                        //if (value == oldValue) return;

                        if (value != null) {

                            element.empty();
                            var domStr ='';
                            switch (getObjDocType(value) ) {
                                case 'img':
                                    domStr = '<img src="'+ value.fileUrl +'"/>';
                                    break;
                                case 'note':
                                    domStr = $compile('<div ng-include="\'partials/meeting/meeting_viewer_note.html\'"></div>') (scope);
                                    break;
                                case 'report':
                                    domStr = $compile('<div ng-include="\'partials/meeting/meeting_viewer_report.html\'"></div>') (scope);
                                    break;
                                default:
                                //do nothing;
                            }
                            element.prepend(domStr);
                        }
                    });
                };
            }
        };
    }]);
