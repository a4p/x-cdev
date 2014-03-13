'use strict';

/**
 * Calendar view controller
 *
 * @param $scope
 * @param version
 * @param srvAnalytics
 * @param srvLocale
 * @param srvTime
 * @param srvConfig
 */
function ctrlCalendar($scope, version, srvAnalytics, srvLocale, srvTime, srvConfig) {

    // TODO : manage also Tasks

    $scope.calendarNow = new Date(srvTime.year, srvTime.month - 1, srvTime.day, 0, 0, 0, 0);
    //var now = new Date();
    //$scope.calendarNow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

	/**
	 * Variables
	 */

	//$scope.datetimeFormat = "yyyy-MM-dd HH:mm:ss";
    $scope.sel = new Date(); // now

	// Date selected by user
    $scope.calendarSelectedDay = null; // Structure with Date <= calendarSel

    // Display fields
    $scope.calendarYear = 0;
    $scope.calendarMonth = 0;
    $scope.calendarMonthName = '';
    $scope.calendarMonthShortName = '';
    $scope.calendarMonthFullName = '';
    $scope.calendarDayFullName = '';
    $scope.calendarDayCasualName = '';
	$scope.calendarPreviousMonthName = '';
	$scope.calendarPreviousYear = 0;
	$scope.calendarNextMonthName = '';
	$scope.calendarNextYear = 0;

    $scope.calendarMonths = []; 	// Locale Month Info
    $scope.calendarMonthWeeks = [];	// Locale Weeks Info
    $scope.calendarHoursDay = [];	// Locale Hours info

    // Events groups
    $scope.calendarEventsGroupsByDay = [];

	/**
	 * Methods
	 */

	$scope.initCalendarCtrl = function () {

        // FIXME : no update of data in this controller if srvLocale.translations change

	    // ConfigCtrl inherit
	    $scope.configStateEdit 	= false;
	    $scope.configStateAdd 	= true;

		// Header & Footer
		$scope.setNavTitle(srvLocale.translations.htmlTitleCalendar);
        $scope.calendarViews = [
            {
                id: 'dayView',
                icon: 'time'
            },
            {
                id: 'monthView',
                icon: 'calendar'
            },
            {
                id: 'listView',
                icon: 'list'
            }
        ];

        // Events filters
	    $scope.filterAscEvent = false;
        $scope.filterCriteriaEvent = 'date_start';
	    $scope.filterAscEventGroup = false;
        $scope.filterCriteriaEventGroup = 'date';

        $scope.calendarHoursDay = $scope.srvLocale.getHoursDay();
        $scope.calendarMonths = $scope.srvLocale.getMonths();

	    // Init selected day
        var back = $scope.srvNav.lastInHistoryWithType('Event');
        if (back != null) {
            var selEvent = $scope.srvData.getObject(back.id);
            $scope.sel = a4pDateParse(selEvent.date_start);
        } else {
	    	$scope.sel = new Date(); // now
	    }
        onEventChange();

        srvTime.addListenerOnDay(function() {
            $scope.calendarNow = new Date(srvTime.year, srvTime.month - 1, srvTime.day, 0,  0,  0, 0);
            onCalendarNowChange();
        });
    };

    function createGroup(date) {
        return {
            date: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0),
            day: date.getDate(),
            year: date.getFullYear(),
            month: date.getMonth(),
            //TODO ??
            //monthName:$scope.calendarMonths[$scope.sel.getMonth()].name,
            //monthShortName:$scope.calendarMonths[$scope.sel.getMonth()].shortName,
            //orderDate: evtStartDate,
            //closestDate : closestDate,
            events: [],
            eventsPosition: [],
            eventsAllDay: [],
            eventsAllDayPosition: []
        };
    };

    function buildEventGroupsByDay() {
        // Build Events group by Date
        var eventsSorted = $scope.srvData.currentItems.Event.slice(0);// Copy array but NOT events (copy only pointers on events)
        eventsSorted.sort(function (a,b) {
            if (a[$scope.filterCriteriaEvent] <= b[$scope.filterCriteriaEvent]) {
                return -1;
            }
            return 1;
        });
        $scope.calendarEventsGroupsByDay = [];

        var eventNb = eventsSorted.length;
        if (eventNb <= 0) {
            return;
        }
        var initEvent = eventsSorted[0];
        var initEventStartDate = a4pDateParse(initEvent.date_start);
        var groupStartDate = new Date(initEventStartDate.getFullYear(), initEventStartDate.getMonth(), initEventStartDate.getDate(), 0, 0, 0, 0);
        //var groupStartDate = new Date(srvTime.year, srvTime.month - 1, srvTime.day, 0, 0, 0, 0);
        var groupEndDate = new Date(groupStartDate.getFullYear(), groupStartDate.getMonth(), groupStartDate.getDate(), 23, 59, 59, 0);

        // BEWARE : order by date_start, but NOT by date_end
        var firstEventIdx = 0;
        while (firstEventIdx < eventNb) {
            var firstEvent = eventsSorted[firstEventIdx];
            var firstEventEndDate = a4pDateParse(firstEvent.date_end);
            if (firstEventEndDate.getTime() < groupStartDate.getTime()) {
                // Event in past time
                firstEventIdx++;
                continue;
            }
            // Start group
            var firstEventStartDate = a4pDateParse(firstEvent.date_start);
            if (firstEventStartDate.getTime() >= groupEndDate.getTime()) {
                // Group starts directly on next event start_date
                groupStartDate = new Date(firstEventStartDate.getFullYear(), firstEventStartDate.getMonth(), firstEventStartDate.getDate(), 0, 0, 0, 0);
                groupEndDate = new Date(groupStartDate.getFullYear(), groupStartDate.getMonth(), groupStartDate.getDate() + 1, 0, 0, 0, 0);
            }
            var group = createGroup(groupStartDate);
            // Add events in group
            var nextEventIdx = firstEventIdx;
            var nextEvent = firstEvent;
            var nextEventStartDate = firstEventStartDate;
            var nextEventEndDate = firstEventEndDate;
            while ((nextEventIdx < eventNb) && (nextEventStartDate.getTime() < groupEndDate.getTime())) {
                if (groupStartDate.getTime() <= nextEventEndDate.getTime()) {
                    var posPercent = 0;
                    var lengthPercent = 100;
                    if (nextEventStartDate.getTime() <= groupStartDate.getTime()) {
                        lengthPercent = a4pTranslateDatesToPxSize(groupStartDate, nextEventEndDate, 100);
                    } else {
                        posPercent = a4pTranslateDateToPx(nextEventStartDate, 100);
                        if (nextEventEndDate.getTime() >= groupEndDate.getTime()) {
                            lengthPercent = a4pTranslateDatesToPxSize(nextEventStartDate, groupEndDate, 100);
                        } else {
                            lengthPercent = a4pTranslateDatesToPxSize(nextEventStartDate, nextEventEndDate, 100);
                        }
                    }
                    // We have already following conditions :
                    // (nextEventStartDate.getTime() <= groupEndDate.getTime())
                    // && (groupStartDate.getTime() <= nextEventEndDate.getTime())

                    if ((nextEventStartDate.getTime() < groupStartDate.getTime())
                        || (groupEndDate.getTime() <= nextEventEndDate.getTime())
                        || ((nextEventStartDate.getTime() == groupStartDate.getTime())
                            && ((groupEndDate.getTime() - 1000) <= nextEventEndDate.getTime()))) {
                        // Event covers one full day or covers many days
                        group.eventsAllDay.push(nextEvent);
                        group.eventsAllDayPosition.push({
                            posPercent: posPercent,
                            lengthPercent: lengthPercent,
                            posWithLastPercent: 0,
                            event: nextEvent
                        });
                    } else {
                        group.events.push(nextEvent);
                        group.eventsPosition.push({
                            posPercent: posPercent,
                            lengthPercent: lengthPercent,
                            posWithLastPercent: 0,
                            event: nextEvent
                        });
                    }
                }
                // Next event
                nextEventIdx++;
                if (nextEventIdx < eventNb) {
                    nextEvent = eventsSorted[nextEventIdx];
                    nextEventStartDate = a4pDateParse(nextEvent.date_start);
                    nextEventEndDate = a4pDateParse(nextEvent.date_end);
                }
            }
            // End group
            if ((group.events.length > 0) || (group.eventsAllDay.length > 0)) {
                $scope.calendarEventsGroupsByDay.push(group);
            }
            // Next group  : group starts on next day
            groupStartDate = new Date(groupStartDate.getFullYear(), groupStartDate.getMonth(), groupStartDate.getDate() + 1, 0, 0, 0, 0);
            groupEndDate = new Date(groupStartDate.getFullYear(), groupStartDate.getMonth(), groupStartDate.getDate() + 1, 0, 0, 0, 0);
        }
    };

    function buildEventsGroupsByDaySinceToday() {
        // Keep only groups starting since calendarNow
        $scope.calendarEventsGroupsByDaySinceToday = [];
        var nb = $scope.calendarEventsGroupsByDay.length;
        for (var i = 0; i < nb; i++) {
            var group = $scope.calendarEventsGroupsByDay[i];
            if (group.date.getTime() >= $scope.calendarNow.getTime()) {
                $scope.calendarEventsGroupsByDaySinceToday = $scope.calendarEventsGroupsByDay.slice(i);
                break;
            }
        }
    };

    function computeCasualDay() {
        var day = $scope.sel.getDay() - 1;
        if (day < 0) day = 6;
        var dayQualif = '';
        var checkToday = new Date($scope.sel.getFullYear(), $scope.sel.getMonth(), $scope.sel.getDate(), 0, 0, 0, 0);
        var checkYesterday = new Date($scope.sel.getFullYear(), $scope.sel.getMonth(), $scope.sel.getDate() + 1, 0, 0, 0, 0);
        var checkTomorrow = new Date($scope.sel.getFullYear(), $scope.sel.getMonth(), $scope.sel.getDate() - 1, 0, 0, 0, 0);
        if (checkToday.getTime() == $scope.calendarNow.getTime()) {
            dayQualif = srvLocale.translations.htmlTextToday + ', ';
        } else if (checkYesterday.getTime() == $scope.calendarNow.getTime()) {
            dayQualif = srvLocale.translations.htmlTextYesterday + ', ';
        } else if (checkTomorrow.getTime() == $scope.calendarNow.getTime()) {
            dayQualif = srvLocale.translations.htmlTextTomorrow + ', ';
        }
        $scope.calendarDayCasualName = dayQualif + $scope.calendarMonthWeeks[0].days[day].name;
    };

    function onCalendarNowChange() {
        // update all data influenced by $scope.calendarNow
        buildEventsGroupsByDaySinceToday();
        computeCasualDay();
    };

    function getGroupForSelectedDay() {
        // retrieve or create group for current Day
        var len = $scope.calendarEventsGroupsByDay.length;
        for (var i = 0; i < len; i++) {
            var currentDay = $scope.calendarEventsGroupsByDay[i];
            if (currentDay.year < $scope.sel.getFullYear()) continue;
            if (currentDay.year > $scope.sel.getFullYear()) break;
            if (currentDay.month < $scope.sel.getMonth()) continue;
            if (currentDay.month > $scope.sel.getMonth()) break;
            if (currentDay.day < $scope.sel.getDate()) continue;
            if (currentDay.day > $scope.sel.getDate()) break;
            return currentDay;
        }
        return createGroup($scope.sel);
    };

	/* For a given date, get the ISO week number
	*
	* Based on information at:
	*
	*    http://www.merlyn.demon.co.uk/weekcalc.htm#WNR
	*
	* Algorithm is to find nearest thursday, it's year
	* is the year of the week number. Then get weeks
	* between that date and the first day of that year.
	*
	* Note that dates in one year can be weeks of previous
	* or next year, overlap is up to 3 days.
	*
	* e.g. 2014/12/29 is Monday in week  1 of 2015
	*      2012/1/1   is Sunday in week 52 of 2011
	*/
    function getWeekNumber(d) {
        // Copy date so don't modify original
        d = new Date(d);
        d.setHours(0, 0, 0);
        // Set to nearest Thursday: current date + 4 - current day number
        // Make Sunday's day number 7
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        // Get first day of year
        var yearStart = new Date(d.getFullYear(), 0, 1);
        // Calculate full weeks to nearest Thursday
        var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1) / 7)
        // Return array of year and week number
        return [d.getFullYear(), weekNo];
    }

    function getMonthWeeks(month, year) {
        var monthWeeks = [];
        var localeWeekDays = [
            {idx: 0, name: srvLocale.translations.htmlTextMonday, shortName: srvLocale.translations.htmlTextShortMonday},
            {idx: 1, name: srvLocale.translations.htmlTextTuesday, shortName: srvLocale.translations.htmlTextShortTuesday},
            {idx: 2, name: srvLocale.translations.htmlTextWednesday, shortName: srvLocale.translations.htmlTextShortWednesday},
            {idx: 3, name: srvLocale.translations.htmlTextThursday, shortName: srvLocale.translations.htmlTextShortThursday},
            {idx: 4, name: srvLocale.translations.htmlTextFriday, shortName: srvLocale.translations.htmlTextShortFriday},
            {idx: 5, name: srvLocale.translations.htmlTextSaturday, shortName: srvLocale.translations.htmlTextShortSaturday},
            {idx: 6, name: srvLocale.translations.htmlTextSunday, shortName: srvLocale.translations.htmlTextShortSunday}
        ];

        // Init
        var firstDayMonth = a4pFirstDayOfMonth(year, month+1);
        var firstDayMonthWeek = a4pDayOfSameWeek(firstDayMonth, 1);
        var lastDayMonth = a4pLastDayOfMonth(year, month+1);
        //var lastDayMonthWeek = a4pDayOfSameWeek(lastDayMonth, 7);

 	    // Loop on each week and each day
        var nbGroups = $scope.calendarEventsGroupsByDay.length;
 	    var currentDay = new Date(firstDayMonthWeek.getFullYear(), firstDayMonthWeek.getMonth(), firstDayMonthWeek.getDate(), 0, 0, 0, 0);
        var groupIdx = 0;
        var currentGroup = null;
        for (; groupIdx < nbGroups; groupIdx++) {
            var initGroup = $scope.calendarEventsGroupsByDay[groupIdx];
            if (initGroup.year < currentDay.getFullYear()) continue;
            if (initGroup.year > currentDay.getFullYear()) break;
            if (initGroup.month < currentDay.getMonth()) continue;
            if (initGroup.month > currentDay.getMonth()) break;
            if (initGroup.day < currentDay.getDate()) continue;
            if (initGroup.day > currentDay.getDate()) break;
            currentGroup = initGroup;
            break
        }
        if (currentGroup == null) {
            currentGroup = createGroup(currentDay);
        }
 	    while (currentDay <= lastDayMonth) {
 	    	var week = {
                id:a4pWeek(currentDay),
                days:[]
            };
 	    	for (var dayId = 0; dayId < 7; dayId++) {
                var day = {
                    day: dayId,
                    date: new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate(), 0, 0, 0, 0),
                    name: localeWeekDays[dayId].name,
                    shortName: localeWeekDays[dayId].shortName,
                    isWeekend: (!!(dayId >= 5)),
                    group:currentGroup
                };
                week.days.push(day);
 	            currentDay.setDate(currentDay.getDate()+1);
                currentGroup = null;
                for (; groupIdx < nbGroups; groupIdx++) {
                    var testGroup = $scope.calendarEventsGroupsByDay[groupIdx];
                    if (testGroup.year < currentDay.getFullYear()) continue;
                    if (testGroup.year > currentDay.getFullYear()) break;
                    if (testGroup.month < currentDay.getMonth()) continue;
                    if (testGroup.month > currentDay.getMonth()) break;
                    if (testGroup.day < currentDay.getDate()) continue;
                    if (testGroup.day > currentDay.getDate()) break;
                    currentGroup = testGroup;
                    break
                }
                if (currentGroup == null) {
                    currentGroup = createGroup(currentDay);
                }
 	    	}
 	    	monthWeeks.push(week)
        }

        return monthWeeks;
    }

    function onSelChange() {
        // update all data influenced by $scope.sel
        if (($scope.calendarYear != $scope.sel.getFullYear()) || ($scope.calendarMonth != $scope.sel.getMonth())) {
            $scope.calendarYear = $scope.sel.getFullYear();
            $scope.calendarMonth = $scope.sel.getMonth();
            $scope.calendarMonthWeeks = getMonthWeeks($scope.calendarMonth, $scope.calendarYear);
            $scope.calendarMonthName = $scope.calendarMonths[$scope.calendarMonth].name;
            $scope.calendarMonthShortName = $scope.calendarMonths[$scope.calendarMonth].shortName;
            $scope.calendarMonthFullName = $scope.calendarMonthName + ' ' + $scope.calendarYear;
        }
        $scope.calendarDayFullName = $scope.sel.getDate() + ' ' + $scope.calendarMonthName + ' ' + $scope.calendarYear;
        computeCasualDay();
		//Previous
		var previous = new Date($scope.sel.getFullYear(),$scope.sel.getMonth() - 1, 1,0,0,0,0);
		$scope.calendarPreviousMonthName = $scope.calendarMonths[previous.getMonth()].name;
		$scope.calendarPreviousYear = $scope.sel.getFullYear() - 1;
		//Next
		var next = new Date($scope.sel.getFullYear(),$scope.sel.getMonth() + 1, 1,0,0,0,0);
		$scope.calendarNextMonthName = $scope.calendarMonths[next.getMonth()].name;
		$scope.calendarNextYear = $scope.sel.getFullYear() + 1;

        $scope.calendarSelectedDay = getGroupForSelectedDay();

        //GA: user really interact with calendar, he changes the Selected day
        srvAnalytics.add('Once', 'Calendar');
    }

    function onEventChange() {
        buildEventGroupsByDay();
        buildEventsGroupsByDaySinceToday();
        // update all data influenced by $scope.sel
        $scope.calendarYear = $scope.sel.getFullYear();
        $scope.calendarMonth = $scope.sel.getMonth();
        $scope.calendarMonthWeeks = getMonthWeeks($scope.calendarMonth, $scope.calendarYear);
        $scope.calendarMonthName = $scope.calendarMonths[$scope.calendarMonth].name;
        $scope.calendarMonthShortName = $scope.calendarMonths[$scope.calendarMonth].shortName;
        $scope.calendarMonthFullName = $scope.calendarMonthName + ' ' + $scope.calendarYear;
        $scope.calendarDayFullName = $scope.sel.getDate() + ' ' + $scope.calendarMonthName + ' ' + $scope.calendarYear;
        computeCasualDay();
		//Previous
		var previous = new Date($scope.sel.getFullYear(),$scope.sel.getMonth() - 1, 1,0,0,0,0);
		$scope.calendarPreviousMonthName = $scope.calendarMonths[previous.getMonth()].name;
		$scope.calendarPreviousYear = $scope.sel.getFullYear() - 1;
		//Next
		var next = new Date($scope.sel.getFullYear(),$scope.sel.getMonth() + 1, 1,0,0,0,0);
		$scope.calendarNextMonthName = $scope.calendarMonths[next.getMonth()].name;
		$scope.calendarNextYear = $scope.sel.getFullYear() + 1;

        $scope.calendarSelectedDay = getGroupForSelectedDay();
    }

    /**
     * Navigation : view, next/previous day
     */

	$scope.checkViewActive = function(id){
		//a4p.InternalLog.log('ctrlCalendar - checkViewActive', ''+id+' ?= '+$scope.calendarView);
		return $scope.calendarView == id;
	};

	$scope.checkViewNp1Active = function(id){
		//a4p.InternalLog.log('ctrlCalendar - checkViewActive', ''+id+' ?= '+$scope.calendarView);
        return ($scope.calendarView != id);
	};

    $scope.onEventClick = function (event) {
        a4p.InternalLog.log('ctrlCalendar - onEventClick',event.name);
    	$scope.setItemAndGoDetail(event);
    };

    $scope.onDayClick = function (date) {
    	if (!date || date == "undefined") return;
        if (($scope.sel.getFullYear() != date.getFullYear())
            || ($scope.sel.getMonth() != date.getMonth())
            || ($scope.sel.getDate() != date.getDate())) {
            $scope.sel = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
            // Refresh
            onSelChange();
        }
        //focus on Day Column
        $scope.setCalendarView('dayView');
    };

    $scope.gotoPreviousMonth = function () {
    	/*var year = $scope.sel.getFullYear();
    	var month = $scope.sel.getMonth();
    	var day = $scope.sel.getDate();
        if (month > 0) {
            month = month - 1;
        } else {
            month = 11;
            year = year -1;
        }
    	$scope.sel = new Date(year, month, day, 0, 0, 0, 0);*/
    	$scope.sel.setMonth($scope.sel.getMonth()-1);
        // Refresh
        onSelChange();
    };

    $scope.gotoNextMonth = function () {

    	/*var year = $scope.sel.getFullYear();
    	var month = $scope.sel.getMonth();
    	var day = $scope.sel.getDate();
        if (month < 11) {
            month = month+1;
        } else {
            month = 0;
            year = year+1;
        }
    	$scope.sel = new Date(year, month, day, 0, 0, 0, 0);
         */
    	$scope.sel.setMonth($scope.sel.getMonth()+1);
        // Refresh
        onSelChange();
    };

    $scope.gotoNow = function () {
    	//$scope.calendarNow = new Date();
        $scope.sel = new Date($scope.calendarNow.getFullYear(), $scope.calendarNow.getMonth(), $scope.calendarNow.getDate(), 0, 0, 0, 0);
        // Refresh
        onSelChange();
    };

    $scope.gotoPreviousDay = function () {
        $scope.sel.setDate($scope.sel.getDate()-1);
        // Refresh
        onSelChange();
    };

    $scope.gotoNextDay = function () {
        $scope.sel.setDate($scope.sel.getDate()+1);
        // Refresh
        onSelChange();
    };

    $scope.gotoNextYear = function () {
        $scope.sel.setFullYear($scope.sel.getFullYear()+1);
        // Refresh
        onSelChange();
    };

    $scope.gotoPreviousYear = function () {
        $scope.sel.setFullYear($scope.sel.getFullYear()-1);
        // Refresh
        onSelChange();
    };

    /**
     * Translate Date & Time
     */
    $scope.translateDateDayToString = function(date) {
    	var val = $scope.srvLocale.formatDate(date,'shortDate');
    	return val;
    };
    $scope.translateDateDayToFullString = function(date) {
    	var val = $scope.srvLocale.formatDate(date,'fullDate');
    	return val;
    };
    $scope.translateDateToTimeString = function (date) {

    	var val = srvLocale.formatDate(date,'shortTime');
    	return val;
    	//return a4pTranslateDateToTimeString(oneDate);
    };



    $scope._formatStringDateToDay = function(string) {

    	var date = a4pDateParse(string);
    	var val = $scope.srvLocale.formatDate(date,'shortDate');
    	return val;
    };

    $scope._formatStringDateToTime = function(string) {

    	var date = a4pDateParse(string);
    	var val = $scope.srvLocale.formatDate(date,'shortTime');
    	return val;
    };


    $scope.getEventTime = function(dateStr) {
    	var time = '';
    	//var event = $scope.srvData.getObject($scope.itemDBId);
    	if (!dateStr) return time;

    	var date = a4pDateParse(dateStr);
    	time = $scope.translateDateToTimeString(date);

    	return time;
    };



    $scope.isMultiDayEventWithTimeToShow = function(event, date,isBegin){
    	var b = false;

        var evtStartDate = a4pDateParse(event.date_start);
        var evtEndDate = a4pDateParse(event.date_end);
        var dateBegin = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
        var dateEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 0);

        if (	isBegin
        		&& dateBegin < evtStartDate){
        	b = true;
    	}
        else if(	!isBegin
        			&& evtEndDate < dateEnd){
        	b = true;
    	}
    	return b;
    };

    //
    // CtrlNavigation inheritance : addItemDialog
    //
    // Launch Event Edit Dialog
    $scope.addItemDialog = function(type, hour){

    	// if hour is given, use it as now
        var now = new Date();
    	var hourBegin = now.getHours() + 1;
    	var hourEnd = now.getHours() + 2;
    	if (hour) {
    		hourBegin = hour;
        	hourEnd = hour +1;
    	}

    	// Create a temp event to edit
        var selectedDayAsDate = $scope.sel;
        var selectedDayAsDateStart = new Date(	selectedDayAsDate.getFullYear(),
												selectedDayAsDate.getMonth(),
												selectedDayAsDate.getDate(),
												hourBegin, 0, 0, 0);
        var selectedDayAsDateEnd = new Date(	selectedDayAsDate.getFullYear(),
												selectedDayAsDate.getMonth(),
												selectedDayAsDate.getDate(),
												hourEnd, 0, 0, 0);
        var newEvent = $scope.srvData.createObject('Event', {
            name:srvLocale.translations.htmlTextDefaultEventName,
            date_start: a4pDateFormat(selectedDayAsDateStart),
            date_end: a4pDateFormat(selectedDayAsDateEnd)
        });

        $scope.openDialog(
                {
                    backdropClick: false,
                    dialogClass: 'modal c4p-modal-full c4p-dialog',
                    backdropClass: 'modal-backdrop c4p-modal-full',
                    controller: 'ctrlEditDialogObject',
                    templateUrl: 'partials/dialog/edit_object.html',
                    resolve: {
                        srvData: function () {
                            return $scope.srvData;
                        },
                        srvLocale: function () {
                            return $scope.srvLocale;
                        },
                        srvonfig: function () {
                            return srvConfig;
                        },
                        objectItem: function () {
                            //return angular.copy(newEvent);
                            return newEvent;
                        },
                        removeFct: function () {
                            return function (obj) {
                                $scope.srvData.removeAndSaveObject(obj);
                                $scope.gotoBack(0);
                            };
                        },
                        spinner: function () {
                            return $scope.spinnerContainer;
                        },
                        openDialogFct: function () {
                            return $scope.openDialog;
                        }    
                    }
                },
                function (result) {
                    if (a4p.isDefined(result)) {
                        a4p.safeApply($scope, function() {
                            $scope.addEvent(result);
                        });
                    }
                });
    };

    $scope.addEvent = function(event) {
        if (a4p.isUndefined(event) || !event) return;

        $scope.srvData.addAndSaveObject(event);
        onEventChange();
        a4p.InternalLog.log('ctrlCalendar - openDialogEditEvent', 'Created event.id.dbid:' + event.id.dbid);
        $scope.onEventClick(event);

        //GA: user really interact with calendar, he adds one event
        srvAnalytics.add('Once', 'Calendar - add Event');
    };

    $scope.removeEvent = function(event){
        a4p.InternalLog.log('ctrlCalendar - removeEvent',event.name);
    	var array = [event.name];
    	$scope.openDialogConfirm(srvLocale.translations.htmlTextConfirmDelete , array,
    			function(confirm) {
    				if (confirm) {
                        a4p.safeApply($scope, function() {
                            var attendees = $scope.srvData.getRemoteLinks(event, 'attendee');
                            for (var i = 0; i < attendees.length; i++) {
                                $scope.srvData.delAndSaveAttachment('Attendee', attendees[i], event);
                            }
                            var attachees = $scope.srvData.getRemoteLinks(event, 'attachee');
                            for (var i = 0; i < attachees.length; i++) {
                                $scope.srvData.delAndSaveAttachment('Attachee', attachees[i], event);
                            }
                            var children = $scope.srvData.getRemoteLinks(event, 'child');
                            for (var i = 0; i < children.length; i++) {
                                $scope.srvData.removeAndSaveObject(children[i]);
                            }
        					$scope.srvData.removeAndSaveObject(event);
                            onEventChange();
        					//$scope.gotoNow();
                        });
    				}
    			}
    	);

    };

    $scope.selectHour = function (event, hour) {
        hour.selected = true;
    };

    $scope.cancelHour = function (event, hour) {
        hour.selected = false;
    };

    $scope.newEventAtHour = function (event, hour) {
        hour.selected = false;
        $scope.addItemDialog(null, hour.hour);
    };

    /**
     * Events catched
     */

    $scope.$on('mindMapUpdated', function (event) {
        onEventChange();
    });

    $scope.$on('mindMapLoaded', function (event) {
        onEventChange();
    });


    /**
     * Initialization
     *
     */

    if ($scope.slide == 'calendar') $scope.initCalendarCtrl();

};
ctrlCalendar.$inject = ['$scope', 'version', 'srvAnalytics', 'srvLocale', 'srvTime', 'srvConfig'];
