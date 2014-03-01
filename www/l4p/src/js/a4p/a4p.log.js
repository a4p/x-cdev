'use strict';

// Namespace a4p
var a4p;
if (!a4p) a4p = {};

function a4pDumpData(input, maxDepth) {
    var str = "";
    if (typeof input === "object") {
        if (input instanceof Array) {
            if (maxDepth > 0) {
                str += "[\n";
                str += a4pDumpArray("  ", input, maxDepth-1);
                str += "]\n";
            } else {
                str += "[Array]\n";
            }
        } else {
            if (maxDepth > 0) {
                str += "{\n";
                str += a4pDumpObject("  ", input, maxDepth-1);
                str += "}\n";
            } else {
                str += "[" + typeof(input) + "]\n";
            }
        }
    } else {
        str += input + "\n";
    }
    return str;
}

function a4pDumpArray(offset, input, maxDepth) {
    var str = "";
    for (var key = 0,nb = input.length; key<nb; key++) {
        if (typeof input[key] === "object") {
            if (input[key] instanceof Array) {
                if (maxDepth > 0) {
                    str += offset + key + " : [\n";
                    str += a4pDumpArray(offset + "  ", input[key], maxDepth-1);
                    str += offset + "]\n";
                } else {
                    str += offset + key + " : [Array]\n";
                }
            } else {
                if (maxDepth > 0) {
                    str += offset + key + " : {\n";
                    str += a4pDumpObject(offset + "  ", input[key], maxDepth-1);
                    str += offset + "}\n";
                } else {
                    str += offset + key + " : [" + typeof(input[key]) + "]\n";
                }
            }
        } else {
            str += offset + key + " : " + input[key] + "\n";
        }
    }
    return str;
}

function a4pDumpObject(offset, input, maxDepth) {
    var str = "", key;
    for (key in input) {
        if (!input.hasOwnProperty(key)) continue;
        if (typeof input[key] === "object") {
            if (input[key] instanceof Array) {
                if (maxDepth > 0) {
                    str += offset + key + " : [\n";
                    str += a4pDumpArray(offset + "  ", input[key], maxDepth-1);
                    str += offset + "]\n";
                } else {
                    str += offset + key + " : [Array]\n";
                }
            } else {
                if (maxDepth > 0) {
                    str += offset + key + " : {\n";
                    str += a4pDumpObject(offset + "  ", input[key], maxDepth-1);
                    str += offset + "}\n";
                } else {
                    str += offset + key + " : [" + typeof(input[key]) + "]\n";
                }
            }
        } else {
            str += offset + key + " : " + input[key] + "\n";
        }
    }
    return str;
}

/**
 * Return a string format "yyyy-MM-dd HH:mm:ss" from a Number which is the result of any Date.getTime (timestamp in ms).
 * @param {Number} timestamp in ms since 1/1/1970
 * @returns {string} result
 */
function a4pTimestampFormat(timestamp) {
    var date = new Date(timestamp);
    return a4pPadNumber(date.getFullYear(), 4) + '-' +
        a4pPadNumber(date.getMonth() + 1, 2) + '-' +
        a4pPadNumber(date.getDate(), 2) + ' ' +
        a4pPadNumber(date.getHours(), 2) + ':' +
        a4pPadNumber(date.getMinutes(), 2) + ':' +
        a4pPadNumber(date.getSeconds(), 2);
}

/**
 * Return a string format "yyyy-MM-dd HH:mm:ss" from a Date object.
 * @param {Date} date to format
 * @returns {string} result
 */
function a4pDateFormat(date) {
    if (!date) return '';
    return a4pPadNumber(date.getFullYear(), 4) + '-' +
        a4pPadNumber(date.getMonth() + 1, 2) + '-' +
        a4pPadNumber(date.getDate(), 2) + ' ' +
        a4pPadNumber(date.getHours(), 2) + ':' +
        a4pPadNumber(date.getMinutes(), 2) + ':' +
        a4pPadNumber(date.getSeconds(), 2);
}

/**
 * Parse a date string to create a Date object
 * @param {string} date string at format "yyyy-MM-dd HH:mm:ss"
 * @returns {Number} Number resulting from Date.getTime or 0 if invalid date
 */
function a4pTimestampParse(date) {
    var newDate = a4pDateParse(date);
    return (newDate !== false) ? newDate.getTime() : 0;
}

/**
 * Parse a date string to create a Date object
 * @param {string} date string at format "yyyy-MM-dd HH:mm:ss"
 * @returns {Date} Date object or false if invalid date
 */
function a4pDateParse(date) {
    // Date (choose 0 in date to force an error if parseInt fails)
    var yearS = parseInt(date.substr(0,4), 10) || 0;
    var monthS = parseInt(date.substr(5,2), 10) || 0;
    var dayS = parseInt(date.substr(8,2), 10) || 0;
    var hourS = parseInt(date.substr(11,2), 10) || 0;
    var minuteS = parseInt(date.substr(14,2),10) || 0;
    var secS = parseInt(date.substr(17,2),10) || 0;
    /*
    BEWARE : here are the ONLY formats supported by all browsers in creating a Date object
    var d = new Date(2011, 01, 07); // yyyy, mm-1, dd
    var d = new Date(2011, 01, 07, 11, 05, 00); // yyyy, mm-1, dd, hh, mm, ss
    var d = new Date("02/07/2011"); // "mm/dd/yyyy"
    var d = new Date("02/07/2011 11:05:00"); // "mm/dd/yyyy hh:mm:ss"
    var d = new Date(1297076700000); // milliseconds
    var d = new Date("Mon Feb 07 2011 11:05:00 GMT"); // ""Day Mon dd yyyy hh:mm:ss GMT/UTC
     */

    var newDate = new Date(yearS, monthS-1, dayS, hourS, minuteS, secS, 0);
    if ((newDate.getFullYear() !== yearS) || (newDate.getMonth() !== (monthS-1)) || (newDate.getDate() !== dayS)) {
        // Invalid date
        return false;
    }
    return newDate;
}

function a4pPadNumber(num, digits, trim) {
    var neg = '';
    if (num < 0) {
        neg = '-';
        num = -num;
    }
    num = '' + num;
    while (num.length < digits) {
        num = '0' + num;
    }
    if (trim && (num.length > digits)) {
        num = num.substr(num.length - digits);
    }
    return neg + num;
}

a4p.formatError = function(arg) {
    if (arg instanceof Error) {
        if (arg.stack) {
            arg = (arg.message && arg.stack.indexOf(arg.message) === -1)
                ? 'Error: ' + arg.message + '\n' + arg.stack
                : arg.stack;
        } else if (arg.sourceURL) {
            arg = arg.message + '\n' + arg.sourceURL + ':' + arg.line;
        }
    }
    return arg;
};

a4p.Log = (function () {

    function Log(nbMax) {
        this.nbMax = nbMax || 1000;
        if (this.nbMax < 1) this.nbMax = 1;
        this.logEntries = [];
        this.callbackHandle = 0;
        this.callbacks = [];
    }

    Log.prototype.getLog = function () {
        return this.logEntries;
    };

    Log.prototype.clearLog = function () {
        this.logEntries = [];
    };

    Log.prototype.setNbMax = function (nbMax) {
        this.nbMax = nbMax || 1000;
        if (this.nbMax < 1) this.nbMax = 1;
        if (this.logEntries.length > this.nbMax) {
            this.logEntries.splice(0, (this.logEntries.length - this.nbMax));
        }
    };

    Log.prototype.log = function (msg, details, traceStackOffset) {
    	
    	//REMOVE_IN_PROD return {'date':'','msg':msg,'details':details};
    	    	
        details = details || '';
        var now = new Date();
        now = a4pDateFormat(now) + '.' + now.getMilliseconds();
        // TODO : get the file and line of caller
        //var nb = (new Error).lineNumber;
        var from = '';
       	var stack;
        /*
        try {
            throw Error('');
        } catch(e) {
            stack = e.stack;
        }
        */
        traceStackOffset = traceStackOffset || 0;
        stack = (new Error).stack;
       	if (stack) {
            var caller_stack = stack.split("\n");
            var caller_line = caller_stack[2+traceStackOffset];
       		if (caller_line) {
       			var index = caller_line.indexOf("at ") + 3;
                from = ' at ' + caller_line.substr(index);
       		}
       	}
        if (details) {
            console.log(now + from + ' : ' + msg + " : " + details);
        } else {
            console.log(now + from + ' : ' + msg);
        }
        var logEntry = {
            'date':now,
            'msg':msg,
            'details':details
        };
        if (this.logEntries.length >= this.nbMax) {
            this.logEntries.splice(0, 1);
        }
        this.logEntries.push(logEntry);

        for (var idx = 0, nb = this.callbacks.length; idx < nb; idx++) {
            try {
                this.callbacks[idx].callback(this.callbacks[idx].id, logEntry);
            } catch (e) {
                console.log("Error on callback#" + idx
                    + " called from Log for the logEntry " + a4pDumpData(logEntry, 1)
                    + " : " + a4p.formatError(e));
            }
        }
        return logEntry;
    };

    Log.prototype.addListener = function (fct) {
        this.callbackHandle++;
        this.callbacks.push({id:this.callbackHandle, callback:fct});
        return this.callbackHandle;
    };

    Log.prototype.cancelListener = function (callbackHandle) {
        for (var idx = this.callbacks.length - 1; idx >= 0; idx--) {
            if (this.callbacks[idx].id == callbackHandle) {
                this.callbacks.splice(idx, 1);
                return true;
            }
        }
        return false;
    };

    // The public API for this module is the constructor function.
    // We need to export that function from this private namespace so that
    // it can be used on the outside.
    return Log;
})(); // Invoke the function immediately to create this class.

a4p.ErrorLog = new a4p.Log(1000);
a4p.InternalLog = new a4p.Log(1000);
