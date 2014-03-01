'use strict';

/*
//write-a-custom-editable-directive-with-angularjs example :
directiveModule.directive('markdown', function() {
    var converter = new Showdown.converter();
    var editTemplate = '<textarea ng-show="isEditMode" ng-dblclick="switchToPreview()" rows="10" cols="30" ng-model="markdown"></textarea>';
    var previewTemplate = '<div ng-hide="isEditMode" ng-dblclick="switchToEdit()">Preview</div>';
    return {
        restrict:'E',
        scope:{},
        compile:function (tElement, tAttrs, transclude) {
            var markdown = tElement.text();

            tElement.html(editTemplate);
            var previewElement = angular.element(previewTemplate);
            tElement.append(previewElement);

            return function (scope, element, attrs) {
                scope.isEditMode = true;
                scope.markdown = markdown;

                scope.switchToPreview = function () {
                    var makeHtml = converter.makeHtml(scope.markdown);
                    previewElement.html(makeHtml);
                    scope.isEditMode = false;
                };
                scope.switchToEdit = function () {
                    scope.isEditMode = true;
                };
            }
        }
    };
});
*/

angular.module("c4p/input.html", []).run(["$templateCache", function ($templateCache) {
    $templateCache.put("c4p/input.html",
    		'<div class="form-group">' +
            '<label class="control-label a4p-dot"></label>' +
            //'	<div class="form-control"></div>' +
            '</div>');
}]);

angular.module('c4p.input', ['c4p/input.html'])
    .controller('c4pInputCtrl', ['$scope', function ($scope) {

        /*
         $scope.datePopup = false;
         $scope.timePopup = false;

         $scope.startDatePopup = function () {
         $scope.datePopup = true;
         };
         $scope.stopDatePopup = function () {
         $scope.datePopup = false;
         };
         $scope.toggleDatePopup = function () {
         $scope.datePopup = !$scope.datePopup;
         };

         $scope.startTimePopup = function () {
         $scope.timePopup = true;
         };
         $scope.stopTimePopup = function () {
         $scope.timePopup = false;
         };
         $scope.toggleTimePopup = function () {
         $scope.timePopup = !$scope.timePopup;
         };
         */

        $scope.stringDate = '';
        $scope.stringTime = '';
        $scope.previousStringDate = '';
        $scope.valueType = '';
        $scope.ngModelCtrl = null;

        $scope.initInputCtrl = function (ngModelCtrl, type) {
            $scope.ngModelCtrl = ngModelCtrl;
            $scope.valueType = type;

            //if (!$scope.ngModelCtrl) return;
            // not yet defined
            //var value = (ngModelCtrl.$viewValue || '').toString();
        };

        $scope.setInputValue = function (value) {
            if (!$scope.ngModelCtrl) return;

            if (($scope.valueType == 'time') || ($scope.valueType == 'datetime')) {
                var hourS, minuteS;
                var timeReg = new RegExp("([01]\\d|2[0-3]):([0-5]\\d)");
                if (a4p.isDefinedAndNotNull(value)) {
                    var timeParts = value.match(timeReg);
                    if (timeParts != null) {
                        hourS = timeParts[1] || '00';
                        minuteS = timeParts[2] || '00';
                    } else {
                        hourS = '00';
                        minuteS = '00';
                    }
                    $scope.stringTime = hourS + ':' + minuteS;
                }
            }
            if (($scope.valueType == 'date') || ($scope.valueType == 'datetime')) {
                var dateReg = new RegExp("[-/ T]+", "g");
                if (a4p.isDefinedAndNotNull(value)) {
                    var dateParts = value.split(dateReg);
                    var yearS = dateParts[0] || '1970';
                    var monthS = dateParts[1] || '01';
                    while (monthS.length < 2) monthS = '0' + monthS;
                    var dayS = dateParts[2] || '01';
                    while (dayS.length < 2) dayS = '0' + dayS;
                    $scope.stringDate = yearS + '-' + monthS + '-' + dayS;
                    $scope.previousStringDate = $scope.stringDate;
                }
            }
        };

        $scope.onDateChanged = function () {
            if (!$scope.ngModelCtrl) return;

            var dateReg = new RegExp("[-/]+", "g");
            var dateParts = $scope.stringDate.split(dateReg);
            var yearS = dateParts[0] || '0000';
            var monthS = dateParts[1] || '00';
            while (monthS.length < 2) monthS = '0' + monthS;
            var dayS = dateParts[2] || '00';
            while (dayS.length < 2) dayS = '0' + dayS;

            var newDate = yearS + '-' + monthS + '-' + dayS;
            if (!a4pDateParse(newDate)) {
                a4p.ErrorLog.log('c4pInputCtrl', 'date ' + $scope.stringDate + ' is invalid => return to previous date ' + $scope.previousStringDate);
                $scope.stringDate = $scope.previousStringDate;
                dateParts = $scope.stringDate.split(dateReg);
                yearS = dateParts[0] || '1970';
                monthS = dateParts[1] || '01';
                while (monthS.length < 2) monthS = '0' + monthS;
                dayS = dateParts[2] || '01';
                while (dayS.length < 2) dayS = '0' + dayS;
                newDate = yearS + '-' + monthS + '-' + dayS;
            }

            $scope.ngModelCtrl.$setViewValue(newDate);
            $scope.ngModelCtrl.$render();
        };

        $scope.onTimeChanged = function () {
            if (!$scope.ngModelCtrl) return;

            var hourS, minuteS;
            var timeReg = new RegExp("([01]\\d|2[0-3]):([0-5]\\d)");
            var timeParts = $scope.stringTime.match(timeReg);
            if (timeParts != null) {
                hourS = timeParts[1] || '00';
                minuteS = timeParts[2] || '00';
            } else {
                hourS = '00';
                minuteS = '00';
            }

            // do not show seconds
            $scope.ngModelCtrl.$setViewValue(hourS + ':' + minuteS + ':00');
            $scope.ngModelCtrl.$render();
        };

        $scope.onDateTimeChanged = function () {
            if (!$scope.ngModelCtrl) return;

            var dateReg = new RegExp("[-/]+", "g");
            var dateParts = $scope.stringDate.split(dateReg);
            var yearS = dateParts[0] || '0000';
            var monthS = dateParts[1] || '00';
            while (monthS.length < 2) monthS = '0' + monthS;
            var dayS = dateParts[2] || '00';
            while (dayS.length < 2) dayS = '0' + dayS;

            var hourS, minuteS;
            var timeReg = new RegExp("([01]\\d|2[0-3]):([0-5]\\d)");
            var timeParts = $scope.stringTime.match(timeReg);
            if (timeParts != null) {
                hourS = timeParts[1] || '00';
                minuteS = timeParts[2] || '00';
            } else {
                hourS = '00';
                minuteS = '00';
            }

            var newDate = yearS + '-' + monthS + '-' + dayS + ' ' + hourS + ':' + minuteS + ':00';
            if (!a4pDateParse(newDate)) {
                a4p.ErrorLog.log('c4pInputCtrl', 'date ' + $scope.stringDate + ' is invalid => return to previous date ' + $scope.previousStringDate);
                $scope.stringDate = $scope.previousStringDate;
                $scope.stringDate = $scope.previousStringDate;
                dateParts = $scope.stringDate.split(dateReg);
                yearS = dateParts[0] || '1970';
                monthS = dateParts[1] || '01';
                while (monthS.length < 2) monthS = '0' + monthS;
                dayS = dateParts[2] || '01';
                while (dayS.length < 2) dayS = '0' + dayS;
                newDate = yearS + '-' + monthS + '-' + dayS + ' ' + hourS + ':' + minuteS + ':00';
            }

            // do not show seconds
            $scope.ngModelCtrl.$setViewValue(newDate);
            $scope.ngModelCtrl.$render();
        };
    }]).directive('c4pInputLimited', [function () {
        return {
            restrict: 'E',
            replace: true,
            template: "" +
                "<div class='form-group'>" +
                "<span class='control-label a4p-dot'></span>" +
                //"<div class='form-control'>" +
                "<span class='nocontrol'></span>" +
                //"<input type='text' readonly = 'readonly' />" +
                //"</div>" +
                "</div>",
            compile: function compile(element, attrs, transclude) {
                var labelElt = element.find("span.control-label");
                var spanElt = element.find("span.nocontrol");
                var controlsElt = element.find("div.form-group");

                //labelElt.text("{{" + attrs.titleVar + "}}");
                if (a4p.isDefined(attrs.ngModel)) {
                    if (attrs.type == "currency") {
                        spanElt.text("{{" + attrs.ngModel + " | c4pCurrency}}");
                    }
                    else if (attrs.type == "percent") {
                        spanElt.text("{{" + attrs.ngModel + "}}%");
                    }
                    else {
                        spanElt.text("{{" + attrs.ngModel + "}}");
                    }
                }
                labelElt.prepend("<span>{{" + attrs.titleVar + "}}</span>");

                //if (icon) $(element).find("label").prepend("<span class='glyphicon glyphicon-"+icon+" icon-large'></span> ");
                /*
                 // Optional icon
                 if (attrs.icon && a4p.isDefined(attrs.icon)) {
                 if (attrs.type)
                 labelElt.prepend('<a href="{{'+attrs.type+'}}:{{'+attrs.ngModel+'}}" target=_blank class="pull-left"> <span class="glyphicon glyphicon-{{' + attrs.icon + '}} icon-large">' + '</span></a>');
                 else
                 labelElt.prepend('<a href="{{'+attrs.ngModel+'}}" target=_blank class="pull-left"> <span class="glyphicon glyphicon-{{' + attrs.icon + '}} icon-large">' + '</span></a>');
                 }
                 */
                if (attrs.icon && a4p.isDefined(attrs.icon)) {
                    if (attrs.type == "tel") {
                        //labelElt.prepend('<a href="tel:{{'+attrs.ngModel+'}}" target=_blank><span class="glyphicon glyphicon-' + attrs.icon + ' icon-large pull-left">' + '</span></a>');
                        labelElt.before('<a href="tel:{{' + attrs.ngModel + '}}" target=_blank></a>');
                        //labelElt.prepend('<span class="glyphicon glyphicon-' + attrs.icon + ' icon-large pull-left">' + '</span>');
                        labelElt.appendTo(element.find("a"));
                        controlsElt.appendTo(element.find("a"));
                        //spanElt.css("color","black");
                    } else if (attrs.type == "mail") {
                        labelElt.before('<a href="mailto:{{' + attrs.ngModel + '}}" target=_blank></a>');
                        //labelElt.prepend('<span class="glyphicon glyphicon-' + attrs.icon + ' icon-large pull-left">' + '</span>');
                        labelElt.appendTo(element.find("a"));
                        controlsElt.appendTo(element.find("a"));
                        //spanElt.css("color","black");
                    } else if (attrs.type == "url") {
                        //labelElt.prepend('<a href="{{'+attrs.ngModel+'}}" target=_blank><span class="glyphicon glyphicon-' + attrs.icon + ' icon-large pull-left">' + '</span></a>');
                        labelElt.before('<a href="{{' + attrs.ngModel + '}}" target=_blank></a>');
                        //labelElt.prepend('<span class="glyphicon glyphicon-' + attrs.icon + ' icon-large pull-left">' + '</span>');
                        labelElt.appendTo(element.find("a"));
                        controlsElt.appendTo(element.find("a"));
                        //spanElt.css("color","black");
                    } else {
                        //labelElt.prepend('<span class="glyphicon glyphicon-' + attrs.icon + ' icon-large pull-left">' + '</span>');
                    }
                }
            }
        };
    }])
    .directive('c4pInputCard', [function () {
        return {
            restrict: 'E',
            replace: true,
            template: "<span></span>",
            compile: function compile(element, attrs, transclude) {
                //link : function (scope, element, attrs) {

                var name = attrs.titleVar;
                var value = attrs.ngModel;
                var icon = type;
                var type = attrs.type;

                //element.find("label").text("{{" + name + "}}");
                //element.find("input").attr('ng-model',value);
                element.attr('ng-show', value);
                //if (icon) $(element).find("label").prepend("<span class='glyphicon glyphicon-"+icon+" icon-large'></span> ");
                // Optional icon
                var span = "<span>{{" + value + "}}</span>";
                var link = null;

                if (type == "tel") {
                    link = '<a href="tel:{{' + value + '}}" target=_blank></a>';
                }
                else if (type == "mail") {
                    link = '<a href="mailto:{{' + value + '}}" target=_blank></a>';
                }
                else if (type == "url") {
                    link = '<a href="{{' + value + '}}" target=_blank></a>';
                }
                else if (type == "currency") {
                    span = "<span>{{" + value + " | c4pCurrency}}</span>";
                }
                else if (type == "percent") {
                    span = "<span>{{" + value + "}}%</span>";
                }


                if (link) {
                    element.prepend(link);
                    element.find('a').prepend(span);
                }
                else {
                    element.prepend(span);
                }

            }
        };
    }])
    .directive('c4pInput', ["$compile", function ($compile) {
        return {
            restrict: 'E',
            replace: true,
            require: '?ngModel',
            controller: 'c4pInputCtrl',
            templateUrl: 'c4p/input.html',
            scope: true,// create new scope to isolate c4pInputCtrl from sibling fields
            compile: function compile(element, attrs, transclude) {
                // BEWARE : 'ng-class' is not interpreted by Angular here (we should insert it in html)
                //if (a4p.isDefined(attrs.warnVar)) {
                //    element.attr('ng-class', "{'has-error': " + attrs.warnVar + "}");
                //}

                // link function
                return function (scope, element, attrs, ngModelCtrl) {
                    // Dynamic type of field
                    var inputType = 'text';
                    if (a4p.isDefined(attrs.type)) {
                        inputType = attrs.type;
                    } else if (a4p.isDefined(attrs.typeVar)) {
                        // WE CANNOT move this code into COMPILE function (use of scope)
                        inputType = scope.$eval(attrs.typeVar);
                    }

                    // Htm template
                    var labelIcon = '';
                    if (a4p.isDefined(attrs.icon) && (attrs.icon.length > 0)) {
                        if (inputType == "tel") {
                            labelIcon = '<a href="" target=_blank><span class="glyphicon glyphicon-' + attrs.icon + ' icon-large"></span></a> ';
                            // href updated later by a watcher
                        } else if (inputType == "mail") {
                            labelIcon = '<a href="" target=_blank><span class="glyphicon glyphicon-' + attrs.icon + ' icon-large"></span></a> ';
                            // href updated later by a watcher
                        } else if (inputType == "url") {
                            labelIcon = '<a href="" target=_blank><span class="glyphicon glyphicon-' + attrs.icon + ' icon-large"></span></a> ';
                            // href updated later by a watcher
                        } else {
                            labelIcon = '<span class="glyphicon glyphicon-' + attrs.icon + ' icon-large"></span>';
                        }
                    }
                    var controlsTemplate = '';
                    if (a4p.isDefined(attrs.titleVar) && (attrs.titleVar.length > 0)) {
                        if (a4p.isDefined(attrs.warnVar) && (attrs.warnVar.length > 0)) {
                            controlsTemplate = controlsTemplate + '<label ng-hide="' + attrs.warnVar + '" class="control-label a4p-dot">' + labelIcon + '{{' + attrs.titleVar + '}}</label>';
                            controlsTemplate = controlsTemplate + '<span ng-show="' + attrs.warnVar + '" class="help-inline c4p-field-error-message">{{' + attrs.warnVar + '}}</span>';
                        } else {
                            controlsTemplate = controlsTemplate + '<label class="control-label a4p-dot">' + labelIcon + '{{' + attrs.titleVar + '}}</label>';
                        }
                    } else {
                        if (a4p.isDefined(attrs.warnVar) && (attrs.warnVar.length > 0)) {
                            if (labelIcon.length > 0) {
                                controlsTemplate = controlsTemplate + '<label ng-hide="' + attrs.warnVar + '" class="control-label a4p-dot">' + labelIcon + '</label>';
                            }
                            controlsTemplate = controlsTemplate + '<span ng-show="' + attrs.warnVar + '" class="help-inline c4p-field-error-message">{{' + attrs.warnVar + '}}</span>';
                        } else {
                            if (labelIcon.length > 0) {
                                controlsTemplate = controlsTemplate + '<label class="control-label a4p-dot">' + labelIcon + '</label>';
                            }
                        }
                    }
                    
                    var autofocus = '';
                    if(scope.$eval(attrs.focusVar)) autofocus = 'autofocus';
                    
                    var inputAttrs = 'class="form-control" onfocus="this.select();" ' + autofocus + ' ';
                    var inputDateAttrs = 'class="form-control" onfocus="this.select();" ' + autofocus + ' ';
                    var inputTimeAttrs = 'class="form-control" onfocus="this.select();" ' + autofocus + ' ';
                    var inputSelectAttrs = 'class="form-control" ' + autofocus + ' ';
                    
                    if (a4p.isDefined(attrs.ngModel)) {
                        //element.find("input").attr('ng-model', attrs.ngModel);
                        inputAttrs = inputAttrs + 'ng-model="' + attrs.ngModel + '" ';
                        inputSelectAttrs = inputSelectAttrs + 'ng-model="' + attrs.ngModel + '" ';
                    }
                    if (a4p.isDefined(attrs.ngChange)) {
                        //element.find("input").attr('ng-change', attrs.ngChange);
                        inputAttrs = inputAttrs + 'ng-change="' + attrs.ngChange + '" ';
                    }
                    if (a4p.isDefined(attrs.c4pBlur)) {
                        inputAttrs = inputAttrs + 'c4p-blur="' + attrs.c4pBlur + '" ';
                    }
                    if (a4p.isDefined(attrs.placeholder)) {
                        inputAttrs = inputAttrs + 'placeholder="' + attrs.placeholder + '" ';
                    }
                    if (inputType == "tel") {
                        controlsTemplate = controlsTemplate + '<input type="tel" ' + inputAttrs + '/>';
                    } else if (inputType == "mail") {
                        controlsTemplate = controlsTemplate + '<input type="email" ' + inputAttrs + '/>';
                    } else if (inputType == "url") {
                        controlsTemplate = controlsTemplate + '<input type="url" ' + inputAttrs + '/>';
                    } else if ((inputType == "number") || (inputType == "currency")) {
                        controlsTemplate = controlsTemplate + '<input type="number" min="0" ' + inputAttrs + '/>';
                    } else if ((inputType == "probability")) {
                        controlsTemplate = controlsTemplate + '<input type="number" min="0" max="100" ' + inputAttrs + '/>';
                    } else if ((inputType == "boolean")) {
                        controlsTemplate = controlsTemplate + '<input type="checkbox" ' + inputAttrs + '/>';
                    } else if (inputType == "date") {
                        inputDateAttrs = inputDateAttrs + 'ng-model="stringDate" ';
                        if (a4p.isDefined(attrs.ngChange)) {
                            inputDateAttrs = inputDateAttrs + 'ng-change="onDateChanged();' + attrs.ngChange + '" ';
                        } else {
                            inputDateAttrs = inputDateAttrs + 'ng-change="onDateChanged()" ';
                        }
                        if (a4p.isDefined(attrs.c4pBlur)) {
                            inputDateAttrs = inputDateAttrs + 'c4p-blur="' + attrs.c4pBlur + '" ';
                        }
                        controlsTemplate = controlsTemplate + '<input type="date" c4p-input-date style="margin-bottom:10px;" ' + inputDateAttrs + '/>';
                    } else if (inputType == "time") {
                        inputTimeAttrs = inputTimeAttrs + 'ng-model="stringTime" ';
                        if (a4p.isDefined(attrs.ngChange)) {
                            inputTimeAttrs = inputTimeAttrs + 'ng-change="onTimeChanged();' + attrs.ngChange + '" ';
                        } else {
                            inputTimeAttrs = inputTimeAttrs + 'ng-change="onTimeChanged()" ';
                        }
                        if (a4p.isDefined(attrs.c4pBlur)) {
                            inputTimeAttrs = inputTimeAttrs + 'c4p-blur="' + attrs.c4pBlur + '" ';
                        }
                        controlsTemplate = controlsTemplate + '<input type="time" c4p-input-date style="margin-bottom:10px;" ' + inputTimeAttrs + '/>';
                    } else if (inputType == "datetime") {
                        inputDateAttrs = inputDateAttrs + 'ng-model="stringDate" ';
                        if (a4p.isDefined(attrs.ngChange)) {
                            inputDateAttrs = inputDateAttrs + 'ng-change="onDateTimeChanged();' + attrs.ngChange + '" ';
                        } else {
                            inputDateAttrs = inputDateAttrs + 'ng-change="onDateTimeChanged()" ';
                        }
                        if (a4p.isDefined(attrs.c4pBlur)) {
                            inputDateAttrs = inputDateAttrs + 'c4p-blur="' + attrs.c4pBlur + '" ';
                        }
                        inputTimeAttrs = inputTimeAttrs + 'ng-model="stringTime" ';
                        if (a4p.isDefined(attrs.ngChange)) {
                            inputTimeAttrs = inputTimeAttrs + 'ng-change="onDateTimeChanged();' + attrs.ngChange + '" ';
                        } else {
                            inputTimeAttrs = inputTimeAttrs + 'ng-change="onDateTimeChanged()" ';
                        }
                        if (a4p.isDefined(attrs.c4pBlur)) {
                            inputTimeAttrs = inputTimeAttrs + 'c4p-blur="' + attrs.c4pBlur + '" ';
                        }
                        controlsTemplate = controlsTemplate + '<input type="date" c4p-input-date style="margin-bottom:10px;" ' + inputDateAttrs + '/>';
                        controlsTemplate = controlsTemplate + '<input type="time" c4p-input-date style="margin-bottom:10px;" ' + inputTimeAttrs + '/>';
                    } else if (inputType == "textarea") {
                        inputAttrs = inputAttrs + 'ng-trim="false"';
                        if (a4p.isDefined(attrs.rows)) {
                            inputAttrs = inputAttrs + 'rows="' + attrs.rows + '" ';
                        }
                        if (a4p.isDefined(attrs.cols)) {
                            inputAttrs = inputAttrs + 'cols="' + attrs.cols + '" ';
                        }
                        controlsTemplate = controlsTemplate + '<textarea ' + inputAttrs + '/>';
                    } else if (inputType == "select") {
                    	var optionsArr = scope.$eval(attrs.optionsVar);
                    	
                    	controlsTemplate = controlsTemplate + '<select '+ inputSelectAttrs + '>';
                    	
                    	if(optionsArr != '') {
                    		for(var key in optionsArr) {
                    			controlsTemplate = controlsTemplate + '<option>' + optionsArr[key] + '</option>';
                    		}
                    	}
                    	
                    	controlsTemplate = controlsTemplate + '</select>';
                    } else {
                        controlsTemplate = controlsTemplate + '<input type="text" ' + inputAttrs + '/>';
                    }
                    
                    var controlsElt = $(element[0]);//.find("div.form-group");
                    //controlsElt.append($compile(controlsTemplate)(scope));
                    controlsTemplate = $compile(controlsTemplate)(scope);
                    var controlsElement = angular.element(controlsTemplate);
                    controlsElt.append(controlsElement);

                    // Watchers

                    // Equivalent of 'ng-class="{\'has-error\': ' + attrs.warnVar + '}"' directive
                    if (a4p.isDefined(attrs.warnVar) && (attrs.warnVar.length > 0)) {
                        // we watch and modify class by ourself
                        scope.$watch(attrs.warnVar, warnVarWatchAction, true);

                        attrs.$observe('class', function (value) {
                            var ngClass = scope.$eval(attrs.warnVar);
                            warnVarWatchAction(ngClass, ngClass);
                        });
                    }
                    var oldWarnValue = undefined;
                    function warnVarWatchAction(warnValue) {
                        if (warnValue) {
                            if (!oldWarnValue) {
                            	element.addClass('has-error');
                            	element.addClass('scrollTop'); //MLE automatic scroll to value
                            }
                        } else {
                            if (oldWarnValue){
                            	element.removeClass('has-error');
                            	element.removeClass('scrollTop');
                            }
                        }
                        oldWarnValue = warnValue;
                    }

                    scope.initInputCtrl(ngModelCtrl, inputType);
                    if (a4p.isDefined(attrs.ngModel)) {
                        scope.setInputValue(scope.$eval(attrs.ngModel));
                    }
                    // change the attribute
                    //attrs.$set('ngModel', 'new value');
                    // observe changes to interpolated attribute ({{...}})
                    //attrs.$observe('ngModel', function(value) {
                    //    scope.setInputValue(value);
                    //});

                    // Input
                    if (inputType == "tel") {
                        if (a4p.isDefined(attrs.ngModel) && a4p.isDefined(attrs.icon) && (attrs.icon.length > 0)) {
                            scope.$watch(attrs.ngModel, function (value) {
                                element.find("a").attr('href', 'tel:' + encodeURIComponent(value));
                            });
                        }
                    } else if (inputType == "mail") {
                        if (a4p.isDefined(attrs.ngModel) && a4p.isDefined(attrs.icon) && (attrs.icon.length > 0)) {
                            scope.$watch(attrs.ngModel, function (value) {
                                element.find("a").attr('href', 'mailto:' + encodeURIComponent(value));
                            });
                        }
                    } else if (inputType == "url") {
                        if (a4p.isDefined(attrs.ngModel) && a4p.isDefined(attrs.icon) && (attrs.icon.length > 0)) {
                            scope.$watch(attrs.ngModel, function (value) {
                                element.find("a").attr('href', encodeURI(value));
                            });
                        }
                    } else if (inputType == "date") {
                        if (a4p.isDefined(attrs.ngModel)) {
                            scope.$watch(attrs.ngModel, function (value) {
                                // Required if user set some other fields on same $digest loop
                                scope.setInputValue(value);
                            });
                        }
                    } else if (inputType == "time") {
                        if (a4p.isDefined(attrs.ngModel)) {
                            scope.$watch(attrs.ngModel, function (value) {
                                // Required if user set some other fields on same $digest loop
                                scope.setInputValue(value);
                            });
                        }
                    } else if (inputType == "datetime") {
                        if (a4p.isDefined(attrs.ngModel)) {
                            scope.$watch(attrs.ngModel, function (value) {
                                // Required if user set some other fields on same $digest loop
                                scope.setInputValue(value);
                            });
                        }
                    } else if (inputType == "textarea") {
                        // Autogrow textarea
                        var textAreaElement = controlsElement[0],
                            cols = textAreaElement.cols,// Probably a default value : 20 while really over 35
                            minCols = -1,
                            maxCols = -1,
                            initialRows = textAreaElement.rows,
                            rows = textAreaElement.rows,
                            offsetWidth = textAreaElement.offsetWidth,
                            previousValueInChange = '';

                        if (a4p.isDefined(attrs.ngModel)) {
                            scope.$watch(attrs.ngModel, function (value, oldValue) {
                            	if (value == oldValue) return; // do not need change textarea size

                                if ((textAreaElement.offsetHeight < textAreaElement.scrollHeight) || (textAreaElement.offsetWidth < offsetWidth)) {
                                    // Scrollbar appears => grow
                                    var nbLines = Math.max(rows, Math.ceil(textAreaElement.rows * textAreaElement.scrollHeight / textAreaElement.offsetHeight));
                                    if (textAreaElement.rows < nbLines) {
                                        textAreaElement.rows = nbLines;
                                        if (scope.scrollRefresh) scope.scrollRefresh();
                                    } else {
                                        textAreaElement.rows = textAreaElement.rows + 1;
                                        if (scope.scrollRefresh) scope.scrollRefresh();
                                    }
                                    // Number of cols in a textarea depends of many factors such fonts, browsers, etc...
                                    // => we try to approximate the right cols value by registering minimas and maximas encountered
                                    var newMinCols = Math.floor(value.length / textAreaElement.rows);
                                    var newMaxCols = Math.ceil(value.length / textAreaElement.rows);
                                    if ((minCols < 0) || (newMinCols < minCols)) minCols = newMinCols;
                                    if ((maxCols < 0) || (newMaxCols > maxCols)) maxCols = newMaxCols;
                                    previousValueInChange = value;
                                } else if (value.length == 0) {
                                    // Reset to initial values if empty
                                    minCols = -1;
                                    maxCols = -1;
                                    textAreaElement.rows = initialRows;
                                    if (scope.scrollRefresh) scope.scrollRefresh();
                                    previousValueInChange = value;
                                } else if ((value.length < (previousValueInChange.length - minCols)) || (value.length > (previousValueInChange.length + minCols))) {
                                    // Wait for a certain amount of text before changing size
                                    var nbLines = Math.max(rows, value.split(new RegExp("\n")).length);
                                    var nbMinRows = nbLines;
                                    var nbMaxRows = nbLines;
                                    if (maxCols > 0) nbMinRows = Math.max(nbLines, Math.floor(value.length / maxCols));
                                    if (minCols > 0) nbMaxRows = Math.max(nbLines, Math.floor(value.length / minCols));
                                    if ((maxCols > 0) && (textAreaElement.rows < nbMinRows)) {
                                        // Estimations say that textarea is too small
                                        textAreaElement.rows = nbMinRows;
                                        if (scope.scrollRefresh) scope.scrollRefresh();
                                    } else if ((minCols > 0) && (textAreaElement.rows > nbMaxRows)) {
                                        // Estimations say that textarea is too big
                                        textAreaElement.rows = nbMaxRows;
                                        if (scope.scrollRefresh) scope.scrollRefresh();
                                    }
                                    previousValueInChange = value;
                                }
                            });
                        }
                    }
                }
            }
        };
    }])
    .directive('c4pInputDate', [function () {
        return {
            replace: false,
            restrict: 'A',
            require: 'ngModel',
            //restrict:'E',
            //replace:true,
            //template : 	"<div class='control-group'>" +
            //				" <label class='control-label a4p-dot'></label>" +
            //			" <div class='controls'>" +
            //			"  <input type='text' name='date' />" +
            //			"  <input type='text' name='time' />" +
            //			" </div>" +
            //			"</div>",
            //compile : function compile(element, attrs, transclude) {
            link: function (scope, element, attrs, ngModelCtrl) {

                // TODO : CCN : faut-il desactiver ce listener ou corrige-t-il un bug iPad ?
                var listener = function () {
                    var value = element.val();
                    if (ngModelCtrl.$viewValue !== value) {
                        a4p.safeApply(scope, function() {
                            ngModelCtrl.$setViewValue(value);
                        });
                    }
                };
                // NOTE : you should call scope.$apply() on every bind()
                element.bind('change', listener);

                // Phonegap compliant
                if (typeof device != "undefined") {
                    if (device.platform === "Android" && window.plugins && window.plugins.datePicker) {

                        var type = attrs.type;
                        // NOTE : you should call scope.$apply() on every bind()
                        element.bind('click', function (event) {
                            a4p.safeApply(scope, function() {
                                var myNewDate, value = scope.$eval(attrs.ngModel);
                                a4p.InternalLog.log('c4pInputDate', 'Android datePicker focus : ' + attrs.ngModel + '=' + value);
                                if (type == 'time') {
                                    var hourS = parseInt(value.substr(0, 2)) || 0;
                                    var minuteS = parseInt(value.substr(3, 2)) || 0;
                                    var secS = parseInt(value.substr(6, 2)) || 0;
                                    myNewDate = new Date(1970, 0, 1, hourS, minuteS, secS, 0);
                                } else if (type == 'date') {
                                    var yearS = parseInt(value.substr(0, 4)) || 1970;
                                    var monthS = parseInt(value.substr(5, 2)) || 1;
                                    var dayS = parseInt(value.substr(8, 2)) || 1;
                                    myNewDate = new Date(yearS, monthS - 1, dayS, 0, 0, 0, 0);
                                } else {
                                    // Argh : not supported by DatePickerPugin
                                    type = '';
                                    var yearS = parseInt(value.substr(0, 4)) || 1970;
                                    var monthS = parseInt(value.substr(5, 2)) || 1;
                                    var dayS = parseInt(value.substr(8, 2)) || 1;
                                    var hourS = parseInt(value.substr(11, 2)) || 0;
                                    var minuteS = parseInt(value.substr(14, 2)) || 0;
                                    var secS = parseInt(value.substr(17, 2)) || 0;
                                    myNewDate = new Date(yearS, monthS - 1, dayS, hourS, minuteS, secS, 0);
                                }

                                // Same handling for iPhone and Android
                                window.plugins.datePicker.show({
                                    date: myNewDate,
                                    mode: type, // date or time or blank for both
                                    allowOldDates: true
                                }, function (returnDate) {
                                    a4p.safeApply(scope, function() {
                                        var reg, parts;
                                        // returnDate date example 2014/4/13
                                        // returnDate time example 12 mars 2013 12:01:43
                                        if (type == 'time') {
                                            var hourS, minuteS, secS;
                                            reg = new RegExp("([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)");
                                            parts = returnDate.match(reg);
                                            if (parts != null) {
                                                hourS = parts[1] || 0;
                                                minuteS = parts[2] || 0;
                                                secS = parts[3] || 0;
                                            } else {
                                                hourS = 0;
                                                minuteS = 0;
                                                secS = 0;
                                            }
                                            // do not show seconds in input field
                                            ngModelCtrl.$setViewValue(hourS + ':' + minuteS);
                                            ngModelCtrl.$render();
                                        } else if (type == 'date') {
                                            reg = new RegExp("[-/]+", "g");
                                            parts = returnDate.split(reg);
                                            var yearS = parts[0] || '1970';
                                            var monthS = parts[1] || '01';
                                            while (monthS.length < 2) monthS = '0' + monthS;
                                            var dayS = parts[2] || '01';
                                            while (dayS.length < 2) dayS = '0' + dayS;
                                            ngModelCtrl.$setViewValue(yearS + '-' + monthS + '-' + dayS);
                                            ngModelCtrl.$render();
                                        } else {
                                            // Argh : not supported by DatePickerPugin
                                        }
                                    });
                                });
                            });
                        });

                    }
                }


            }
        };
    }]);




// ----------------------
// Ratings
//----------------------
/*.controller('testCtrl', function($scope){
$scope.user_rating = 3;
$scope.id = 1;
})*/

angular.module('c4p.ratings', [])
    .directive("c4pAngularRatings", ['$parse', function ($parse) {
        return {
            restrict: 'E',
            require: 'ngModel',
            replace: true,
            transclude: true,
            template: '<span><ol class="c4p-angular-ratings">'
                + '<li class="star" ng-class="{selected:model>4,readonly:readonly}" ng-click="setRating(5)"><span class="hidden">5</span></li>'
                + '<li class="star" ng-class="{selected:model>3,readonly:readonly}" ng-click="setRating(4)"><span class="hidden">4</span></li>'
                + '<li class="star" ng-class="{selected:model>2,readonly:readonly}" ng-click="setRating(3)"><span class="hidden">3</span></li>'
                + '<li class="star" ng-class="{selected:model>1,readonly:readonly}" ng-click="setRating(2)"><span class="hidden">2</span></li>'
                + '<li class="star" ng-class="{selected:model>0,readonly:readonly}" ng-click="setRating(1)"><span class="hidden">1</span></li>'
                + '</ol></span>',
            link: function (scope, element, attrs, ngModelCtrl) {
                if (a4p.isDefined(attrs.ngModel)) {
                    scope.model = scope.$eval(attrs.ngModel);
                    scope.$watch(attrs.ngModel, function (value, oldValue) {
                    	if (value == oldValue) return; // do not need change textarea size
                        scope.model = value;
                    });
                }
                var onChangeFct = attrs.onChange ? $parse(attrs.onChange) : null;
                var readonly = attrs.readonly ? scope.$eval(attrs.readonly) : false;
                scope.readonly = readonly;
                if (readonly) {
                    scope.setRating = function(rating) {}
                } else {
                    scope.setRating = function(rating) {
                        ngModelCtrl.$setViewValue(rating);
                        ngModelCtrl.$render();
                        if (onChangeFct) onChangeFct(scope);
                    };
                }
            }
        };
    }]);

directiveModule.directive('c4pBlur', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            element.bind('blur', function () {
                //apply scope (attributes)
                scope.$apply(attr.c4pBlur);
            });
        }
    };
});


// Check Box
directiveModule.directive('c4pCheck', ['$parse', function ($parse) {
    return {
        restrict: 'E',
        require: 'ngModel',
        template: "" +
            "<span>" +
            "<span class='glyphicon glyphicon-check icon-large' ng-show='model == true' ng-click='setCheck(false)'></span>" +
            "<span class='glyphicon glyphicon-unchecked icon-large' ng-show='model != true' ng-click='setCheck(true)'></span>" +
            "</span>",
        replace: true,
        transclude: true,
        link: function (scope, element, attrs, ngModelCtrl) {
            if (a4p.isDefined(attrs.ngModel)) {
                scope.model = scope.$eval(attrs.ngModel);
                scope.$watch(attrs.ngModel, function (value, oldValue) {
                	if (value == oldValue) return; // do not need change textarea size
                    scope.model = value;
                });
            }
            var onChangeFct = attrs.onChange ? $parse(attrs.onChange) : null;
            var readonly = attrs.readonly ? scope.$eval(attrs.readonly) : false;
            if (readonly) {
                scope.setCheck = function(check) {}
            } else {
                scope.setCheck = function(check) {
                    ngModelCtrl.$setViewValue(check == true);
                    ngModelCtrl.$render();
                    if (onChangeFct) onChangeFct(scope);
                };
            }
        }
    }
}]);




