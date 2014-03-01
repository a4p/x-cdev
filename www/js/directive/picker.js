
'use strict';



angular.module("c4p/datePicker.html", []).run(["$templateCache", function ($templateCache) {
    $templateCache.put("c4p/datePicker.html",
            '<table class="table-condensed">' +
            '<thead><tr>' +
            '<th colspan="3">' +
            '<div class="btn-group pull-left">' +
            '<label class="btn" sense-tap="gotoPreviousMonth()"><span class="glyphicon glyphicon-chevron-left icon-small"></span></label>' +
            '<label class="btn" sense-tap="gotoToday()"><span class="glyphicon glyphicon-home icon-small"></span></label>' +
            '<label class="btn" sense-tap="gotoNextMonth()"><span class="glyphicon glyphicon-chevron-right icon-small"></span></label>' +
            '</div>' +
            '</th>' +
            '<th colspan="2">' +
            '<label>{{monthShortName}}. {{year}}</label>' +
            '</th>' +
            '<th colspan="2">' +
            '<div class="btn-group pull-right">' +
            '<label class="btn" sense-tap="resetDate()" c4p-date-setter><span class="glyphicon glyphicon-trash icon-small"></span></label>' +
            '</div>' +
            '</th>' +
            '</tr>' +
            '<tr>' +
            '<th class="dow" ng-repeat="weekday in weekDays">{{weekday.shortName}}.</th>' +
            '</tr></thead>' +
            '<tbody>' +
            '<tr ng-repeat="week in monthWeeks">' +
            '<td ng-repeat="weekday in weekDays"><label' +
            ' ng-class="{true:\'btn btn-primary\', false:\'btn\'}[(week[weekday.idx].day == day) && (sel.getFullYear() == year) && (sel.getMonth() == month)]"' +
            ' ng-show="typeof(week[weekday.idx]) != \'undefined\'"' +
            ' sense-tap="onDayClick(week[weekday.idx].day)" c4p-date-setter c4p-date-set-event>{{week[weekday.idx].day}}</label>' +
            '</td>' +
            '</tr>' +
            '</tbody>' +
            '</table>');
}]);

angular.module('c4p.datePicker', ['c4p/datePicker.html'])
        .controller('dateViewCtrl', ['$scope', function ($scope) {
    var self = this;
    $scope.weekDays = [
        {idx:1, name:$scope.srvLocale.translations.htmlTextMonday, shortName:$scope.srvLocale.translations.htmlTextShortMonday},
        {idx:2, name:$scope.srvLocale.translations.htmlTextTuesday, shortName:$scope.srvLocale.translations.htmlTextShortTuesday},
        {idx:3, name:$scope.srvLocale.translations.htmlTextWednesday, shortName:$scope.srvLocale.translations.htmlTextShortWednesday},
        {idx:4, name:$scope.srvLocale.translations.htmlTextThursday, shortName:$scope.srvLocale.translations.htmlTextShortThursday},
        {idx:5, name:$scope.srvLocale.translations.htmlTextFriday, shortName:$scope.srvLocale.translations.htmlTextShortFriday},
        {idx:6, name:$scope.srvLocale.translations.htmlTextSaturday, shortName:$scope.srvLocale.translations.htmlTextShortSaturday},
        {idx:0, name:$scope.srvLocale.translations.htmlTextSunday, shortName:$scope.srvLocale.translations.htmlTextShortSunday}
    ];

    $scope.months = [
        {idx:0, name:$scope.srvLocale.translations.htmlTextJanuary, shortName:$scope.srvLocale.translations.htmlTextShortJanuary},
        {idx:1, name:$scope.srvLocale.translations.htmlTextFebruary, shortName:$scope.srvLocale.translations.htmlTextShortFebruary},
        {idx:2, name:$scope.srvLocale.translations.htmlTextMarch, shortName:$scope.srvLocale.translations.htmlTextShortMarch},
        {idx:3, name:$scope.srvLocale.translations.htmlTextApril, shortName:$scope.srvLocale.translations.htmlTextShortApril},
        {idx:4, name:$scope.srvLocale.translations.htmlTextMay, shortName:$scope.srvLocale.translations.htmlTextShortMay},
        {idx:5, name:$scope.srvLocale.translations.htmlTextJune, shortName:$scope.srvLocale.translations.htmlTextShortJune},
        {idx:6, name:$scope.srvLocale.translations.htmlTextJuly, shortName:$scope.srvLocale.translations.htmlTextShortJuly},
        {idx:7, name:$scope.srvLocale.translations.htmlTextAugust, shortName:$scope.srvLocale.translations.htmlTextShortAugust},
        {idx:8, name:$scope.srvLocale.translations.htmlTextSeptember, shortName:$scope.srvLocale.translations.htmlTextShortSeptember},
        {idx:9, name:$scope.srvLocale.translations.htmlTextOctober, shortName:$scope.srvLocale.translations.htmlTextShortOctober},
        {idx:10, name:$scope.srvLocale.translations.htmlTextNovember, shortName:$scope.srvLocale.translations.htmlTextShortNovember},
        {idx:11, name:$scope.srvLocale.translations.htmlTextDecember, shortName:$scope.srvLocale.translations.htmlTextShortDecember}
    ];

    /**
     * Current Date
     * @type {Date}
     */
    $scope.today = new Date();
    $scope.todayYear = $scope.today.getFullYear();
    $scope.todayMonth = $scope.today.getMonth();
    $scope.todayDate = $scope.today.getDate();

    /**
     * Selected Date
     * @type {Date}
     */
    $scope.sel = $scope.today;
    $scope.initial = $scope.today;

    $scope.getMonthWeeks = function () {
        var firstDay = new Date($scope.year, $scope.month, 1, 0, 0, 0, 0);
        var firstDayNextMonth;
        if ($scope.month < 11) {
            firstDayNextMonth = new Date($scope.year, $scope.month + 1, 1, 0, 0, 0, 0);
        } else {
            firstDayNextMonth = new Date($scope.year+1, 0, 1, 0, 0, 0, 0);
        }
        var firstDayIdx = firstDay.getDay();// day of week (0 = Sunday)
        var weeks = [];
        var dayIdx, date, events, evt, evtDate, i, len;
        // First week
        var weekDayIdx = firstDayIdx;
        var day = 1;
        var week = {};
        // Skip empty first cells
        for (dayIdx = 0; dayIdx < $scope.weekDays.length; dayIdx++) {
            weekDayIdx = $scope.weekDays[dayIdx].idx;
            if (weekDayIdx == firstDayIdx) break;
        }
        for (; dayIdx < $scope.weekDays.length; dayIdx++) {
            weekDayIdx = $scope.weekDays[dayIdx].idx;
            date = new Date($scope.year, $scope.month, day, 0, 0, 0, 0);
            week[weekDayIdx] = {day:day};
            day++;
        }
        weeks.push(week);
        // Other weeks
        for (var weekIdx = 1; weekIdx < 7; weekIdx++) {
            week = {};
            var weekEmpty = true;
            for (dayIdx = 0; dayIdx < $scope.weekDays.length; dayIdx++, day++) {
                weekDayIdx = $scope.weekDays[dayIdx].idx;
                date = new Date($scope.year, $scope.month, day, 0, 0, 0, 0);
                if (date < firstDayNextMonth) {
                    week[weekDayIdx] = {day:day};
                    weekEmpty = false;
                } else break;
            }
            if (!weekEmpty) {
                weeks.push(week);
            }
        }

        return weeks;
    };

    $scope.setDate = function () {
        $scope.year = $scope.sel.getFullYear();
        if ($scope.year < 1970) $scope.year = 1970;
        $scope.month = $scope.sel.getMonth();
        if ($scope.month < 0) $scope.month = 0;
        $scope.day = $scope.sel.getDate();
        if ($scope.day < 1) $scope.day = 1;
        $scope.monthName = $scope.months[$scope.month].name;
        $scope.monthShortName = $scope.months[$scope.month].shortName;
        $scope.monthWeeks = $scope.getMonthWeeks();
    };

    $scope.setDate();

    $scope.setInitialDate = function (date) {
        var values = date.split(' ')[0].split('-')
        $scope.initial = new Date(parseInt(values[0]) || 1970, (parseInt(values[1]) || 1) - 1, parseInt(values[2]) || 1, 0, 0, 0, 0);
    };

    $scope.resetDate = function () {
        $scope.sel = new Date($scope.initial.getFullYear(), $scope.initial.getMonth(), $scope.initial.getDate(), 0, 0, 0, 0);
        $scope.setDate();
    };

    $scope.gotoToday = function () {
        $scope.today = new Date();
        $scope.year = $scope.today.getFullYear();
        $scope.month = $scope.today.getMonth();
        $scope.monthName = $scope.months[$scope.month].name;
        $scope.monthShortName = $scope.months[$scope.month].shortName;
        $scope.monthWeeks = $scope.getMonthWeeks();
    };

    $scope.onDayClick = function (day) {
        $scope.sel = new Date($scope.year, $scope.month, day, 0, 0, 0, 0);
        $scope.day = $scope.sel.getDate();
    };

    $scope.gotoPreviousMonth = function () {
        if ($scope.month > 0) {
            $scope.month = $scope.month-1;
        } else {
            $scope.month = 11;
            $scope.year = $scope.year-1;
        }
        $scope.monthName = $scope.months[$scope.month].name;
        $scope.monthShortName = $scope.months[$scope.month].shortName;
        $scope.monthWeeks = $scope.getMonthWeeks();
    };

    $scope.gotoNextMonth = function () {
        if ($scope.month < 11) {
            $scope.month = $scope.month+1;
        } else {
            $scope.month = 0;
            $scope.year = $scope.year+1;
        }
        $scope.monthName = $scope.months[$scope.month].name;
        $scope.monthShortName = $scope.months[$scope.month].shortName;
        $scope.monthWeeks = $scope.getMonthWeeks();
    };

    $scope.getDate = function () {
        return a4pPadNumber($scope.year, 2) + '-' + a4pPadNumber($scope.month + 1, 2) + '-' + a4pPadNumber($scope.day, 2);
    };
}]).directive('c4pDateSetEvent', [function () {
    return {
        restrict:'A',
        require: '^ngModel', // get a hold of NgModelController
        compile:function compile(element, attrs, transclude) {
            // link function
            return function (scope, element, attrs, ngModelCtrl) {
                if(!ngModelCtrl) return; // do nothing if no ng-model

                // Listen for change events to enable binding
                element.bind('click', function() {
                    scope.$emit("c4pDateSetterEvent");
                });
            }
        }
    };
}]).directive('c4pDateSetter', [function () {
    return {
        restrict:'A',
        require: '^ngModel', // get a hold of NgModelController
        compile:function compile(element, attrs, transclude) {
            // link function
            return function (scope, element, attrs, ngModelCtrl) {
                if(!ngModelCtrl) return; // do nothing if no ng-model

                // Write data to the model
                function read() {
                    var value = (ngModelCtrl.$viewValue || '').toString();
                    var values = value.split(' ');
                    if (values.length > 1) {
                        ngModelCtrl.$setViewValue(scope.getDate() + ' ' + values[1]);
                    } else {
                        ngModelCtrl.$setViewValue(scope.getDate());
                    }
                }

                // Listen for change events to enable binding
                element.bind('click', function() {
                    a4p.safeApply(scope, read);
                });
            }
        }
    };
}]).directive('c4pDatePicker', [function () {
    return {
        restrict:'E',
        //priority: 100,
        require: '^ngModel', // get a hold of NgModelController
        replace:true,
        controller:'dateViewCtrl',
        templateUrl:'c4p/datePicker.html',
        scope:true,// create new scope to isolate dateViewCtrl from sibling fields
        compile:function compile(element, attrs, transclude) {
            // link function
            return function (scope, element, attrs, ngModelCtrl) {
                if(!ngModelCtrl) return; // do nothing if no ng-model

                // Read data from the model
                function write() {
                    if (ngModelCtrl.$viewValue) {
                        scope.setInitialDate(ngModelCtrl.$viewValue);
                    } else {
                        var date = new Date();
                        scope.setInitialDate(date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate());
                    }
                    scope.resetDate();
                }

                // Specify how UI should be updated
                ngModelCtrl.$render = write;

                // Initialize
                write();
            }
        }
    };
}]);

angular.module("c4p/timePicker.html", []).run(["$templateCache", function ($templateCache) {
    $templateCache.put("c4p/timePicker.html",
            '<table class="table-condensed">' +
            '<thead><tr>' +
            '<th colspan="2">' +
            '<div class="btn-group pull-left">' +
            '<label class="btn" sense-tap="gotoNow()"><span class="glyphicon glyphicon-home icon-small"></span></label>' +
            '</div>' +
            '</th>' +
            '<th colspan="3">' +
            '<label>{{getTime()}}</label>' +
            '</th>' +
            '<th colspan="2">' +
            '<div class="btn-group pull-right">' +
            '<label class="btn" sense-tap="resetTime()" c4p-time-setter><span class="glyphicon glyphicon-trash icon-small"></span></label>' +
            '</div>' +
            '</th>' +
            '</tr>' +
            '<tr>' +
            '<th colspan="6">{{srvLocale.translations.htmlTextHours}}</th>' +
            '<th>{{srvLocale.translations.htmlTextMinutes}}</th>' +
            '</tr></thead>' +
            '<tbody>' +
            '<tr>' +
            '<td ng-repeat="hr in [0,1,2,3,4,5]"><label' +
            ' ng-class="{true:\'btn btn-primary\', false:\'btn\'}[hr == hour]"' +
            ' sense-tap="onHourClick(hr)" c4p-time-setter>{{hr}}</label>' +
            '</td>' +
            '<td><label' +
            ' ng-class="{true:\'btn btn-primary\', false:\'btn\'}[0 == minute]"' +
            ' sense-tap="onMinuteClick(0)" c4p-time-setter c4p-time-set-event>00</label>' +
            '</td>' +
            '</tr>' +
            '<tr>' +
            '<td ng-repeat="hr in [6,7,8,9,10,11]"><label' +
            ' ng-class="{true:\'btn btn-primary\', false:\'btn\'}[hr == hour]"' +
            ' sense-tap="onHourClick(hr)" c4p-time-setter>{{hr}}</label>' +
            '</td>' +
            '<td><label' +
            ' ng-class="{true:\'btn btn-primary\', false:\'btn\'}[15 == minute]"' +
            ' sense-tap="onMinuteClick(15)" c4p-time-setter c4p-time-set-event>15</label>' +
            '</td>' +
            '</tr>' +
            '<tr>' +
            '<td ng-repeat="hr in [12,13,14,15,16,17]"><label' +
            ' ng-class="{true:\'btn btn-primary\', false:\'btn\'}[hr == hour]"' +
            ' sense-tap="onHourClick(hr)" c4p-time-setter>{{hr}}</label>' +
            '</td>' +
            '<td><label' +
            ' ng-class="{true:\'btn btn-primary\', false:\'btn\'}[30 == minute]"' +
            ' sense-tap="onMinuteClick(30)" c4p-time-setter c4p-time-set-event>30</label>' +
            '</td>' +
            '</tr>' +
            '<tr>' +
            '<td ng-repeat="hr in [18,19,20,21,22,23]"><label' +
            ' ng-class="{true:\'btn btn-primary\', false:\'btn\'}[hr == hour]"' +
            ' sense-tap="onHourClick(hr)" c4p-time-setter>{{hr}}</label>' +
            '</td>' +
            '<td><label' +
            ' ng-class="{true:\'btn btn-primary\', false:\'btn\'}[45 == minute]"' +
            ' sense-tap="onMinuteClick(45)" c4p-time-setter c4p-time-set-event>45</label>' +
            '</td>' +
            '</tr>' +
            '</tbody>' +
            '</table>');
}]);

angular.module('c4p.timePicker', ['c4p/timePicker.html'])
        .controller('timeViewCtrl', ['$scope', function ($scope) {
    var self = this;
    /**
     * Current Time
     * @type {Number}
     */
    $scope.nowHour = new Date().getHours();
    $scope.nowMinute = new Date().getMinutes();
    $scope.initialHour = $scope.nowHour;
    $scope.initialMinute = $scope.nowMinute;
    $scope.hour = $scope.initialHour;
    $scope.minute = $scope.initialMinute;

    $scope.setTime = function () {
        if ($scope.minute > 45) {
            $scope.minute = 0;
            $scope.hour += 1;
            if ($scope.hour > 23) {
                $scope.hour -= 24;
            }
        } else if ($scope.minute > 30) {
            $scope.minute = 45;
        } else if ($scope.minute > 15) {
            $scope.minute = 30;
        } else if ($scope.minute > 0) {
            $scope.minute = 15;
        } else {
            $scope.minute = 0;
        }
    };

    $scope.setTime();

    $scope.setInitialTime = function (hour, minute) {
        $scope.initialHour = hour;
        $scope.initialMinute = minute;
    };

    $scope.resetTime = function () {
        $scope.hour = $scope.initialHour;
        $scope.minute = $scope.initialMinute;
        $scope.setTime();
    };

    $scope.gotoNow = function () {
        $scope.hour = $scope.nowHour;
        $scope.minute = $scope.nowMinute;
        $scope.setTime();
    };

    $scope.onHourClick = function (hour) {
        $scope.hour = hour;
    };

    $scope.onMinuteClick = function (minute) {
        if (minute > 45) {
            $scope.minute = 0;
        } else if (minute > 30) {
            $scope.minute = 45;
        } else if (minute > 15) {
            $scope.minute = 30;
        } else if (minute > 0) {
            $scope.minute = 15;
        } else {
            $scope.minute = 0;
        }
    };

    $scope.getTime = function () {
        return a4pPadNumber($scope.hour, 2) + ':' + a4pPadNumber($scope.minute, 2) + ':00';
    };
}]).directive('c4pTimeSetEvent', [function () {
    return {
        restrict:'A',
        require: '^ngModel', // get a hold of NgModelController
        compile:function compile(element, attrs, transclude) {
            // link function
            return function (scope, element, attrs, ngModelCtrl) {
                if(!ngModelCtrl) return; // do nothing if no ng-model

                // Listen for change events to enable binding
                element.bind('click', function() {
                    scope.$emit("c4pTimeSetterEvent");
                });
            }
        }
    };
}]).directive('c4pTimeSetter', [function () {
    return {
        restrict:'A',
        require: '^ngModel', // get a hold of NgModelController
        compile:function compile(element, attrs, transclude) {
            // link function
            return function (scope, element, attrs, ngModelCtrl) {
                if(!ngModelCtrl) return; // do nothing if no ng-model

                // Write data to the model
                function read() {
                    var value = (ngModelCtrl.$viewValue || '').toString();
                    var values = value.split(' ');
                    if (values.length > 1) {
                        ngModelCtrl.$setViewValue(values[0] + ' ' + scope.getTime());
                    } else {
                        ngModelCtrl.$setViewValue(scope.getTime());
                    }
                }

                // Listen for change events to enable binding
                element.bind('click', function() {
                    a4p.safeApply(scope, read);
                });
            }
        }
    };
}]).directive('c4pTimePicker', function () {
    return {
        restrict:'E',
        //priority: 100,
        require: '^ngModel', // get a hold of NgModelController
        replace:true,
        controller:'timeViewCtrl',
        templateUrl:'c4p/timePicker.html',
        scope:true,// create new scope to isolate dateViewCtrl from sibling fields
        compile:function compile(element, attrs, transclude) {
            // link function
            return function (scope, element, attrs, ngModelCtrl) {
                if(!ngModelCtrl) return; // do nothing if no ng-model

                // Read data from the model
                function write() {
                    var value = (ngModelCtrl.$viewValue || '').toString();
                    var values = value.split(' ');
                    if (values.length > 1) {
                        values = values[1].split(':');
                    } else {
                        values = values[0].split(':');
                    }
                    scope.setInitialTime(values[0], values[1]);
                    scope.resetTime();
                }

                // Specify how UI should be updated
                ngModelCtrl.$render = write;

                // Initialize
                write();
            }
        }
    };
});

