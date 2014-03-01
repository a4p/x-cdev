'use strict';

var SrvLocale = (function() {
    function Service(httpService, srvLoad, srvLocalStorage) {
        this.http = httpService;
        this.srvLoad = srvLoad;
        this.srvLocalStorage = srvLocalStorage;
        this.localeDir = '';
        this.initDone = false;
        clear(this);
    }

    Service.prototype.resetLocale = function () {
        clear(this);
        saveTranslations(this);
        saveLang(this);
        saveCurrency(this);
    };

    Service.prototype.init = function () {
        if (this.initDone) return;
        this.translations = this.srvLocalStorage.get('Translations', this.translations);
        this.language = this.srvLocalStorage.get('Language', this.language);
        this.lang = this.srvLocalStorage.get('Locale', this.lang);
        this.numberPattern = this.srvLocalStorage.get('NumberPattern', this.numberPattern);
        this.datetimePattern = this.srvLocalStorage.get('DatetimePattern', this.datetimePattern);
        this.currency = this.srvLocalStorage.get('Currency', this.currency);
        var langs = getLangParts(this.lang.code);
        this.lang1 = langs[0];
        this.lang2 = langs[1];
        this.lang3 = langs[2];
        this.initDone = true;
        a4p.InternalLog.log('srvLocale', "initialized");
    };
    Service.prototype.setLocaleDir = function (localeDir) {
        this.localeDir = localeDir;
    };
    Service.prototype.startLoading = function (callback) {
        //var msg = "Initializing Locale ...";
        var msg = this.translations.htmlTextInitializingLocale;
        a4p.InternalLog.log('srvLocale', msg);
        this.srvLoad.setStatus(msg);
        this.srvLoad.setError('');
        var self = this;
        var onSuccess1 = function (response) {
            //response.data, response.status, response.headers
            var msg = a4pFormat(self.translations.htmlMsgLoadLocaleReady, self.lang1);
            a4p.InternalLog.log('srvLocale', msg);
            self.srvLoad.setStatus(msg);
            self.srvLoad.setError('');
            self.setTranslations(response.data);
            callback();
        };
        var onFailure1 = function (response) {
            //response.data, response.status, response.headers
            var msg = self.translations.htmlMsgLoadLocalePb;
            a4p.ErrorLog.log('srvLocale', msg);
            self.srvLoad.setStatus(msg);
            self.srvLoad.setError(response.data);
            callback();
        };
        if (self.lang2 != self.lang1) {
            var onSuccess2 = function (response) {
                //response.data, response.status, response.headers
                var msg = a4pFormat(self.translations.htmlMsgLoadLocaleReady, self.lang2);
                a4p.InternalLog.log('srvLocale', msg);
                self.srvLoad.setStatus(msg);
                self.srvLoad.setError('');
                self.setTranslations(response.data);
                callback();
            };
            var onFailure2 = function (response) {
                //response.data, response.status, response.headers
                self.http.get(self.localeDir + 'models/local_' + self.lang1 + '.json').then(onSuccess1, onFailure1);
            };
            if (self.lang3 != self.lang2) {
                var onSuccess3 = function (response) {
                    //response.data, response.status, response.headers
                    var msg = a4pFormat(self.translations.htmlMsgLoadLocaleReady, self.lang3);
                    a4p.InternalLog.log('srvLocale', msg);
                    self.srvLoad.setStatus(msg);
                    self.srvLoad.setError('');
                    self.setTranslations(response.data);
                    callback();
                };
                var onFailure3 = function (response) {
                    //response.data, response.status, response.headers
                    self.http.get(self.localeDir + 'models/local_' + self.lang2 + '.json').then(onSuccess2, onFailure2);
                };
                this.http.get(self.localeDir + 'models/local_' + self.lang3 + '.json').then(onSuccess3, onFailure3);
            } else {
                self.http.get(self.localeDir + 'models/local_' + self.lang2 + '.json').then(onSuccess2, onFailure2);
            }
        } else {
            self.http.get(self.localeDir + 'models/local_' + self.lang1 + '.json').then(onSuccess1, onFailure1);
        }
    };

    Service.prototype.setTranslations = function (translations) {
        this.translations = translations;
        saveTranslations(this);
    };

    Service.prototype.setLanguage = function (language) {
        language = language.toLowerCase();
        if (this.language != language) {
            var langs = getLangParts(language);
            for (var i = this.langs.length - 1; i >= 0; i--) {
                if ((this.langs[i].code == langs[2])
                    || (this.langs[i].code == langs[1])
                    || (this.langs[i].code == langs[0])) {
                    this.language = language;
                    saveLanguage(this);
                    this.setLang(this.langs[i]);
                    return;
                }
            }
            // No lang found => no change
        }
    };

    Service.prototype.getLanguage = function () {
        return (this.srvLocalStorage.get('Locale', this.lang)).code;
    };

    Service.prototype.setLang = function (lang) {
        this.lang = lang;
        var langs = getLangParts(this.lang.code);
        this.lang1 = langs[0];
        this.lang2 = langs[1];
        this.lang3 = langs[2];
        this.numberPattern = this.numberPatterns[0];
        this.datetimePattern = this.datetimePatterns[0];// english by default
        for (var i = this.langs.length - 1; i >= 0; i--) {
            if ((this.langs[i].code == this.lang3)
                || (this.langs[i].code == this.lang2)
                || (this.langs[i].code == this.lang1)) {
                this.numberPattern = this.numberPatterns[i];
                this.datetimePattern = this.datetimePatterns[i];
                break;
            }
        }
        saveLang(this);
        this.startLoading(function () {});
    };

    Service.prototype.setCurrency = function (currency) {
    	this.currency = currency;
        saveCurrency(this);
    };

    Service.prototype.formatCurrency = function (amount, currencySymbol) {
        if (typeof currencySymbol == 'undefined') {
            currencySymbol = this.currency;
        }
        return formatDecimal(amount, this.numberPattern.currencyPattern,
            this.numberPattern.groupSeparator, this.numberPattern.decimalSeparator, 2).
            replace(/\u00A4/g, a4p.Utf8.decode(currencySymbol));
    };

    Service.prototype.formatNumber = function (number, fractionSize) {
        return formatDecimal(number, this.numberPattern.decimalPattern,
            this.numberPattern.groupSeparator, this.numberPattern.decimalSeparator, fractionSize);
    };

    /**
     * Format a date in locale format
     *
     * format argument string can be composed of the following elements :
     *
     * 'yyyy': 4 digit padded (0000-9999) representation of year, (e.g. AD 1 => 0001, AD 2010 => 2010)
     * yy': 2 digit padded and trimmed (00-99) representation of year, (e.g. AD 2001 => 01, AD 2010 => 10)
     * 'y': not padded representation of year, e.g. (AD 1 => 1, AD 199 => 199)
     * 'MMMM': Month name in year (January-December)
     * 'MMM': Month shortname in year (Jan-Dec)
     * 'MM': 2 digit padded (01-12) month number in year
     * 'M': not padded month number in year (1-12)
     * 'dd': 2 digit padded (01-31) day in month,
     * 'd': not padded day in month (1-31)
     * 'EEEE': Day name in week,(Sunday-Saturday)
     * 'EEE': Day shortname in week, (Sun-Sat)
     * 'HH': 2 digit padded (00-23) hour in day
     * 'H': not padded hour in day (0-23)
     * 'hh': 2 digit padded (01-12) hour in am/pm
     * 'h': not padded (1-12) hour in am/pm
     * 'mm': 2 digit padded (00-59) minute in hour
     * 'm': Minute in hour (0-59)
     * 'ss': 2 digit padded (00-59) second in minute
     * 's': Second in minute (0-59)
     * 'a': am/pm marker
     * 'Z': 4 digit (+sign) representation of the timezone offset (-1200-1200)
     *
     * format argument can also be one of the following predefined values :
     *
     * 'medium': equivalent to 'MMM d, y h:mm:ss a' for en_US locale (e.g. Sep 3, 2010 12:05:08 pm)
     * 'short': equivalent to 'M/d/yy h:mm a' for en_US  locale (e.g. 9/3/10 12:05 pm)
     * 'fullDate': equivalent to 'EEEE, MMMM d,y' for en_US  locale (e.g. Friday, September 3, 2010)
     * 'longDate': equivalent to 'MMMM d, y' for en_US  locale (e.g. September 3, 2010
     * 'mediumDate': equivalent to 'MMM d, y' for en_US  locale (e.g. Sep 3, 2010)
     * 'shortDate': equivalent to 'M/d/yy' for en_US locale (e.g. 9/3/10)
     * 'mediumTime': equivalent to 'h:mm:ss a' for en_US locale (e.g. 12:05:08 pm)
     * 'shortTime': equivalent to 'h:mm a' for en_US locale (e.g. 12:05 pm)
     *
     * format argument can contain literal values. These need to be quoted with single quotes (e.g.
     * "h 'in the morning'"). In order to output single quote, use two single quotes in a sequence
     * (e.g. "h o''clock").
     *
     * @param {(Date|number|string)} date Date to format either as Date object, milliseconds (string or
     *    number) or various ISO 8601 datetime string formats (e.g. yyyy-MM-ddTHH:mm:ss.SSSZ and it's
     *    shorter versions like yyyy-MM-ddTHH:mmZ, yyyy-MM-dd or yyyyMMddTHHmmssZ).
     * @param {string=} format Formatting rules (see Description). If not specified, 'mediumDate' is used.
     * @return {string} Formatted string or the input if input is not recognized as date/millis.
     */
    Service.prototype.formatDate = function (date, format) {
        return formatDate(date, format, this.datetimePattern);
    };

    function clear(self) {
        self.translations = c4p.Locale.en;
        self.currency = "\xe2\x82\xac";// Set by Salesforce : utf8Symbol or isoCode ('\x24' for Dollar)
        self.langs = [
            {code:'en', title:'English'},
            {code:'fr', title:"Fran\u00E7ais"}
        ];
        self.lang = self.langs[0];// english by default
        self.language = 'en';// Set by Salesforce
        var langs = getLangParts(self.lang.code);
        self.lang1 = langs[0];
        self.lang2 = langs[1];
        self.lang3 = langs[2];
        self.numberPatterns = [
            {
                decimalSeparator:'.',
                groupSeparator:',',
                decimalPattern:{
                    minInt:1,
                    minFrac:0,
                    maxFrac:3,
                    posPre:'',
                    posSuf:'',
                    negPre:'-',
                    negSuf:'',
                    gSize:3,
                    lgSize:3
                },
                currencyPattern:{
                    minInt:1,
                    minFrac:2,
                    maxFrac:2,
                    posPre:'\u00A4',
                    posSuf:'',
                    negPre:'(\u00A4',
                    negSuf:')',
                    gSize:3,
                    lgSize:3
                }
            },
            {
                decimalSeparator:',',
                groupSeparator:' ',
                decimalPattern:{
                    minInt:1,
                    minFrac:0,
                    maxFrac:3,
                    posPre:'',
                    posSuf:'',
                    negPre:'-',
                    negSuf:'',
                    gSize:3,
                    lgSize:3
                },
                currencyPattern:{
                    minInt:1,
                    minFrac:2,
                    maxFrac:2,
                    posPre:'',
                    posSuf:' \u00A4',
                    negPre:'(',
                    negSuf:' \u00A4)',
                    gSize:3,
                    lgSize:3
                }
            }
        ];
        self.numberPattern = self.numberPatterns[0];// english by default
        /*
         * 'yyyy': 4 digit padded (0000-9999) representation of year, (e.g. AD 1 => 0001, AD 2010 => 2010)
         * 'yy': 2 digit padded and trimmed (00-99) representation of year, (e.g. AD 2001 => 01, AD 2010 => 10)
         * 'y': not padded representation of year, e.g. (AD 1 => 1, AD 199 => 199)
         * 'MMMM': Month name in year (January-December)
         * 'MMM': Month shortname in year (Jan-Dec)
         * 'MM': 2 digit padded (01-12) month number in year
         * 'M': not padded month number in year (1-12)
         * 'dd': 2 digit padded (01-31) day in month,
         * 'd': not padded day in month (1-31)
         * 'EEEE': Day name in week,(Sunday-Saturday)
         * 'EEE': Day shortname in week, (Sun-Sat)
         * 'HH': 2 digit padded (00-23) hour in day
         * 'H': not padded hour in day (0-23)
         * 'hh': 2 digit padded (01-12) hour in am/pm
         * 'h': not padded (1-12) hour in am/pm
         * 'mm': 2 digit padded (00-59) minute in hour
         * 'm': Minute in hour (0-59)
         * 'ss': 2 digit padded (00-59) second in minute
         * 's': Second in minute (0-59)
         * 'a': am/pm marker
         * 'Z': 4 digit (+sign) representation of the timezone offset (-1200-1200)
         *
         * 'medium': equivalent to 'MMM d, y h:mm:ss a' for en_US locale (e.g. Sep 3, 2010 12:05:08 pm)
         * 'short': equivalent to 'M/d/yy h:mm a' for en_US  locale (e.g. 9/3/10 12:05 pm)
         * 'fullDate': equivalent to 'EEEE, MMMM d,y' for en_US  locale (e.g. Friday, September 3, 2010)
         * 'longDate': equivalent to 'MMMM d, y' for en_US  locale (e.g. September 3, 2010
         * 'mediumDate': equivalent to 'MMM d, y' for en_US  locale (e.g. Sep 3, 2010)
         * 'shortDate': equivalent to 'M/d/yy' for en_US locale (e.g. 9/3/10)
         * 'mediumTime': equivalent to 'h:mm:ss a' for en_US locale (e.g. 12:05:08 pm)
         * 'shortTime': equivalent to 'h:mm a' for en_US locale (e.g. 12:05 pm)
         *
         * format string can contain literal values. These need to be quoted with single quotes (e.g.
         * "h 'in the morning'"). In order to output single quote, use two single quotes in a sequence
         * (e.g. "h o''clock").
         */
        self.datetimePatterns = [
            {
                month:'January,February,March,April,May,June,July,August,September,October,November,December'.split(','),
                shortMonth:'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(','),
                day:'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'.split(','),
                shortDay:'Sun,Mon,Tue,Wed,Thu,Fri,Sat'.split(','),
                ampms:['AM', 'PM'],
                medium:'MMM d, y h:mm:ss a',
                short: 'M/d/yy h:mm a',
                fullDate: 'EEEE, MMMM d, y',
                longDate: 'MMMM d, y',
                mediumDate: 'MMM d, y',
                shortDate: 'M/d/yy',
                mediumTime: 'h:mm:ss a',
                shortTime: 'h:mm a'
            },
            {
                month:'Janvier,F\u00E9vrier,Mars,Avril,Mai,Juin,Juillet,Aout,Septembre,Octobre,Novembre,D\u00E9cembre'.split(','),
                shortMonth:'Jan,Fev,Mar,Avr,Mai,Jun,Jul,Aou,Sep,Oct,Nov,Dec'.split(','),
                day:'Dimanche,Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi'.split(','),
                shortDay:'Dim,Lun,Mar,Mer,Jeu,Ven,Sam'.split(','),
                ampms:['AM', 'PM'],
                medium:'d MMM y HH:mm:ss',
                short: 'd/M/yy HH:mm',
                fullDate: 'EEEE, d MMMM y',
                longDate: 'd MMMM y',
                mediumDate: 'd MMM y',
                shortDate: 'd/M/yy',
                mediumTime: 'HH:mm:ss',
                shortTime: 'HH:mm'
            }
        ];
        self.datetimePattern = self.datetimePatterns[0];// english by default
    }

    function getLangParts(code) {
        var s = code.toLowerCase();
        s = s.replace(/-/g, '_');
        var names = s.split('_');
        var max = names.length;
        var lang1 = "";
        var lang2 = "";
        var lang3 = "";
        if (0 < max) {
            lang1 = names[0];
            lang2 = names[0];
            lang3 = names[0];
            if (1 < max) {
                lang2 = lang2 + "_" + names[1];
                lang3 = lang3 + "_" + names[1];
                if (2 < max) {
                    lang3 = lang3 + "_" + names[2];
                }
            }
        }
        return [lang1, lang2, lang3];
    }

    function saveTranslations(self) {
        self.srvLocalStorage.set('Translations', self.translations);
    }

    function saveLanguage(self) {
        self.srvLocalStorage.set('Language', self.language);
    }

    function saveLang(self) {
        self.srvLocalStorage.set('Locale', self.lang);
        self.srvLocalStorage.set('NumberPattern', self.numberPattern);
        self.srvLocalStorage.set('DatetimePattern', self.datetimePattern);
    }

    function saveCurrency(self) {
        self.srvLocalStorage.set('Currency', self.currency);
    }

    function formatDecimal(number, pattern, groupSep, decimalSep, fractionSize) {
        if (isNaN(number) || !isFinite(number)) return '';

        var isNegative = number < 0;
        number = Math.abs(number);
        var numStr = number + '',
            formatedText = '',
            parts = [];

        if (numStr.indexOf('e') !== -1) {
            formatedText = numStr;
        } else {
            var fractionLen = (numStr.split('.')[1] || '').length;// use standard float decimal separator

            // determine fractionSize if it is not specified
            if (typeof fractionSize == 'undefined') {
                fractionSize = Math.min(Math.max(pattern.minFrac, fractionLen), pattern.maxFrac);
            }

            var pow = Math.pow(10, fractionSize);
            number = Math.round(number * pow) / pow;
            var fraction = ('' + number).split('.');// use standard float decimal separator
            var whole = fraction[0];
            fraction = fraction[1] || '';

            var pos = 0,
                lgroup = pattern.lgSize,
                group = pattern.gSize;

            if (whole.length >= (lgroup + group)) {
                pos = whole.length - lgroup;
                for (var i = 0; i < pos; i++) {
                    if ((pos - i) % group === 0 && i !== 0) {
                        formatedText += groupSep;
                    }
                    formatedText += whole.charAt(i);
                }
            }

            for (i = pos; i < whole.length; i++) {
                if ((whole.length - i) % lgroup === 0 && i !== 0) {
                    formatedText += groupSep;
                }
                formatedText += whole.charAt(i);
            }

            // format fraction part.
            while (fraction.length < fractionSize) {
                fraction += '0';
            }

            if (fractionSize) formatedText += decimalSep + fraction.substr(0, fractionSize);
        }

        parts.push(isNegative ? pattern.negPre : pattern.posPre);
        parts.push(formatedText);
        parts.push(isNegative ? pattern.negSuf : pattern.posSuf);
        return parts.join('');
    }

    function dateGetter(name, size, offset, trim) {
        return function (date, datetimePattern) {
            var value = date['get' + name]();
            if (offset > 0 || value > -offset)
                value += offset;
            if (value === 0 && offset == -12) value = 12;
            return a4pPadNumber(value, size, trim);
        };
    }

    function dateStrGetter(name, translateKey) {
        return function (date, datetimePattern) {
            var value = date['get' + name]();
            return datetimePattern[translateKey][value];
        };
    }

    function timeZoneGetter(date, datetimePattern) {
        var offset = date.getTimezoneOffset();
        return a4pPadNumber(offset / 60, 2) + a4pPadNumber(Math.abs(offset % 60), 2);
    }

    function ampmGetter(date, datetimePattern) {
        return date.getHours() < 12 ? datetimePattern.ampms[0] : datetimePattern.ampms[1];
    }

    var DATE_FORMATS = {
      yyyy: dateGetter('FullYear', 4, 0, false),
        yy: dateGetter('FullYear', 2, 0, true),
         y: dateGetter('FullYear', 1, 0, false),
      MMMM: dateStrGetter('Month', 'month'),
       MMM: dateStrGetter('Month', 'shortMonth'),
        MM: dateGetter('Month', 2, 1, false),
         M: dateGetter('Month', 1, 1, false),
        dd: dateGetter('Date', 2, 0, false),
         d: dateGetter('Date', 1, 0, false),
        HH: dateGetter('Hours', 2, 0, false),
         H: dateGetter('Hours', 1, 0, false),
        hh: dateGetter('Hours', 2, -12, false),
         h: dateGetter('Hours', 1, -12, false),
        mm: dateGetter('Minutes', 2, 0, false),
         m: dateGetter('Minutes', 1, 0, false),
        ss: dateGetter('Seconds', 2, 0, false),
         s: dateGetter('Seconds', 1, 0, false),
      EEEE: dateStrGetter('Day', 'day'),
       EEE: dateStrGetter('Day', 'shortDay'),
         a: ampmGetter,
         Z: timeZoneGetter
    };
    var DATE_FORMATS_SPLIT = /((?:[^yMdHhmsaZE']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|a|Z))(.*)/;
    var NUMBER_STRING = /^\d+$/;
    // CCN change : We accept 'T' or ' ' between date and time. We accept no 'Z' at the end
    var R_ISO8601_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:[T ](\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d{3}))?)?)?((Z)?|([+-])(\d\d):?(\d\d)))?$/;

    function jsonStringToDate(string) {
        var match;
        if (match = string.match(R_ISO8601_STR)) {
            var date = new Date(match[1], match[2]-1, match[3], match[4] || 0, match[5] || 0, match[6] || 0, 0),
                tzHour = 0,
                tzMin = 0;
            if (match[10]) {
                tzHour = Math.floor(match[10] + match[11]);
                tzMin = Math.floor(match[10] + match[12]);
            }
            date.setUTCFullYear(match[1]);
            if (match[9] || match[10]) {
                // if 'Z' or tz fields then its a UTC time and not a local time
                date.setUTCHours((match[4] || 0) - tzHour);
            }
            return date;
        }
        return string;
    }

    /*
    * 'yyyy': 4 digit padded (0000-9999) representation of year, (e.g. AD 1 => 0001, AD 2010 => 2010)
    * 'yy': 2 digit padded and trimmed (00-99) representation of year, (e.g. AD 2001 => 01, AD 2010 => 10)
    * 'y': not padded representation of year, e.g. (AD 1 => 1, AD 199 => 199)
    * 'MMMM': Month name in year (January-December)
    * 'MMM': Month shortname in year (Jan-Dec)
    * 'MM': 2 digit padded (01-12) month number in year
    * 'M': not padded month number in year (1-12)
    * 'dd': 2 digit padded (01-31) day in month,
    * 'd': not padded day in month (1-31)
    * 'EEEE': Day name in week,(Sunday-Saturday)
    * 'EEE': Day shortname in week, (Sun-Sat)
    * 'HH': 2 digit padded (00-23) hour in day
    * 'H': not padded hour in day (0-23)
    * 'hh': 2 digit padded (01-12) hour in am/pm
    * 'h': not padded (1-12) hour in am/pm
    * 'mm': 2 digit padded (00-59) minute in hour
    * 'm': Minute in hour (0-59)
    * 'ss': 2 digit padded (00-59) second in minute
    * 's': Second in minute (0-59)
    * 'a': am/pm marker
    * 'Z': 4 digit (+sign) representation of the timezone offset (-1200-1200)
    *
    * format string can contain literal values. These need to be quoted with single quotes (e.g.
    * "h 'in the morning'"). In order to output single quote, use two single quotes in a sequence
    * (e.g. "h o''clock").
    */
    function formatDate(date, format, datetimePattern) {
        var text = '',
            fn, match;

        format = format || 'mediumDate';
        format = datetimePattern[format] || format;
        if (typeof date == 'string') {
            if (NUMBER_STRING.test(date)) {
                date = Math.floor(date);
            } else {
                date = jsonStringToDate(date);
            }
        }

        if (typeof date == 'number') {// isNumber(date)
            date = new Date(date);
        }

        if (toString.apply(date) != '[object Date]') {// !isDate(date)
            return date;
        }

        while (format) {
            match = DATE_FORMATS_SPLIT.exec(format);
            if (match) {
                var value = match[1];
                fn = DATE_FORMATS[value];
                text += fn ? fn(date, datetimePattern) : value.replace(/(^'|'$)/g, '').replace(/''/g, "'");
                format = match.pop();
            } else {
                fn = DATE_FORMATS[format];
                text += fn ? fn(date, datetimePattern) : format.replace(/(^'|'$)/g, '').replace(/''/g, "'");
                format = null;
            }
        }

        return text;
    }

    /**
     * Week & Hours
     *
     * return a month matrix with all locale info
     */



    Service.prototype.getMonths = function() {
    	 var localeMonths = [
    	         	        {idx:0, name:this.translations.htmlTextJanuary, shortName:this.translations.htmlTextShortJanuary},
    	         	        {idx:1, name:this.translations.htmlTextFebruary, shortName:this.translations.htmlTextShortFebruary},
    	         	        {idx:2, name:this.translations.htmlTextMarch, shortName:this.translations.htmlTextShortMarch},
    	         	        {idx:3, name:this.translations.htmlTextApril, shortName:this.translations.htmlTextShortApril},
    	         	        {idx:4, name:this.translations.htmlTextMay, shortName:this.translations.htmlTextShortMay},
    	         	        {idx:5, name:this.translations.htmlTextJune, shortName:this.translations.htmlTextShortJune},
    	         	        {idx:6, name:this.translations.htmlTextJuly, shortName:this.translations.htmlTextShortJuly},
    	         	        {idx:7, name:this.translations.htmlTextAugust, shortName:this.translations.htmlTextShortAugust},
    	         	        {idx:8, name:this.translations.htmlTextSeptember, shortName:this.translations.htmlTextShortSeptember},
    	         	        {idx:9, name:this.translations.htmlTextOctober, shortName:this.translations.htmlTextShortOctober},
    	         	        {idx:10, name:this.translations.htmlTextNovember, shortName:this.translations.htmlTextShortNovember},
    	         	        {idx:11, name:this.translations.htmlTextDecember, shortName:this.translations.htmlTextShortDecember}
    	         	    ];

    	 return localeMonths;
    };

    Service.prototype.getHoursDay = function() {
    	var hours=[];
        for (var i = 0; i < 24; i++) {

        	var h = "" + i;
        	if (h.length < 2) {h = "0" + h;} // add 0 before if length == 1
        	var text = h;//+":00";
        	var cssClass = '';
        	if (i < 9 || (12 <= i && i < 14) || i >= 19 ) cssClass = 'c4p-color'; //TODO inactive hours
        	var hour = {hour:i, text:text, cssClass:cssClass};
        	hours.push(hour);
        }

        return hours;
    };

    return Service;
})();
