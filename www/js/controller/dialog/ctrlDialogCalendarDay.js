'use strict';

function ctrlDialogCalendarDay($scope, calendarDayCasualName, calendarDayFullName, calendarSelectedDay, srvLocale, $modalInstance) {
    /**
     * Variables
     */
    $scope.srvLocale = null;
    $scope.calendarDayCasualName = "none";
    $scope.calendarDayFullName = "none";
    $scope.calendarSelectedDay = {events : []};

    /**
     * Functions
     */

    $scope.constructor = function (calendarDayCasualName, calendarDayFullName, calendarSelectedDay, srvLocale) {
        $scope.srvLocale = srvLocale;
        $scope.calendarDayCasualName = calendarDayCasualName || "...";
        $scope.calendarDayFullName = calendarDayFullName || "...";
        $scope.calendarSelectedDay = calendarSelectedDay || {events : []};
    };


    $scope.close = function () {
        $modalInstance.dismiss();
    };


    $scope.selectItem = function (item) {
        $modalInstance.close(item);
    };

    /**
     * Initialization
     */
    $scope.constructor( calendarDayCasualName, calendarDayFullName, calendarSelectedDay, srvLocale);
}
