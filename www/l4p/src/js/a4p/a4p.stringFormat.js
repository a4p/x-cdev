'use strict';

function strCompare(str1, str2) {
    var lg1 = str1.length;
    var lg2 = str2.length;
    var nb = (lg1 < lg2) ? lg1 : lg2;
    for (var i = 0; i < nb; i++) {
        var c1 = str1.charCodeAt(i);
        var c2 = str2.charCodeAt(i);
        if (c1 < c2) return -1;
        if (c1 > c2) return 1;
    }
    if (lg1 < lg2) return -1;
    if (lg1 > lg2) return 1;
    return 0;
}

// BEWARE : timestamps from Saleforce are in SECONDS, while timestamp in Javascript is in MILLI-SECONDS since 1/1/1970.

function a4pFormat(input) {

	if (a4p.isUndefined(input) || !input) {
        a4p.ErrorLog.log('a4pFormat', 'invalid string '+input);
		return '';
	}

    var formatted = input;
    var max = arguments.length;
    for (var i = 1; i < max; i++) {
        var regexp = new RegExp('\\{' + (i - 1) + '\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
}

/**
 * Return a Date object of the first day of the month
 * BEWARE : month argument value must be between 1 and 12.
 *
 * @param {Number} year
 * @param {Number} month The month as an integer between 1 and 12.
 * @returns {Date}
 */
function a4pFirstDayOfMonth(year, month) {
    return new Date(year, month - 1, 1, 0, 0, 0, 0);
}

/**
 * Return a Date object of the last day of the month
 * BEWARE : month argument value must be between 1 and 12.
 *
 * @param {Number} year
 * @param {Number} month The month as an integer between 1 and 12.
 * @returns {Date}
 */
function a4pLastDayOfMonth(year, month) {
    return new Date(year, month, 0, 0, 0, 0, 0);
}

/**
 * Return a Date object of the dayOfWeek of the same week as the given date
 * BEWARE : in this case the week begin on Monday and end at Sunday
 *
 * @param {Date} date Any date of this week
 * @param {Number} dayOfWeek 1 for Monday, 2 for Thuesday, ... , 7 for Sunday (date.getDay() || 7)
 * @returns {Date}
 */
function a4pDayOfSameWeek(date, dayOfWeek) {
    return new Date(date.getFullYear(), date.getMonth(),
        date.getDate() + dayOfWeek - (date.getDay() || 7), 0, 0, 0, 0);
}

/**
 * Return the week number of the given date
 * http://www.merlyn.demon.co.uk/weekcalc.htm#WNR
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
 *
 * @param {Date} date Any date of this week
 * @returns {Number}
 */
function a4pWeek(date) {
    var thursday = a4pDayOfSameWeek(date, 4);// Thursday of date's week is in right year to calculate Week number
    //var firstDayOfYear =  a4pFirstDayOfMonth(thursday.getFullYear(), 1);
    var fourthJanuary =  new Date(thursday.getFullYear(), 0, 4, 0, 0, 0, 0);// This day is always in Week 1
    var thursdayOfWeek1 = a4pDayOfSameWeek(fourthJanuary, 4);// Thursday of Week 1
    var nbDays = Math.round((thursday.getTime() - thursdayOfWeek1.getTime())/86400000);
    return (1 + Math.floor(nbDays / 7));
}
