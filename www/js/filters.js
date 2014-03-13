'use strict';

/* Filters */

var filterModule = angular.module('c4p.filters', ['c4p.services']);

filterModule.filter('interpolate', ['version', function (version) {
    return function (text) {
        return String(text).replace(/\%VERSION\%/mg, version);
    }
}]);

filterModule.filter('c4pCurrency', ['srvLocale', function (srvLocale) {
    return function (amount, currencySymbol) {
        return srvLocale.formatCurrency(amount, currencySymbol);
    };
}]);

filterModule.filter('c4pNumber', ['srvLocale', function (srvLocale) {
    return function (number, fractionSize) {
        return srvLocale.formatNumber(number, fractionSize);
    };
}]);

filterModule.filter('accountNameFilter', function () {
    return function (itemList, accountQuery) {
        if (accountQuery.length <= 0) return '';
        itemList = itemList || new Array();
        for (var j = 0; j < itemList.length; j++) {
            var item = itemList[j];
            // Filter on accountQuery
            if (item.id.dbid == accountQuery) {
                return item.company_name;
            }
        }
        return '';
    }
});

filterModule.filter('accountDisplayFilter', function () {
    return function (itemList, accountQuery) {
        if (accountQuery.length <= 0) return 'display:none';
        itemList = itemList || new Array();
        for (var j = 0; j < itemList.length; j++) {
            var item = itemList[j];
            // Filter on accountQuery
            if (item.id.dbid == accountQuery) {
                return '';
            }
        }
        return 'display:none';
    }
});

filterModule.filter('contactNameFilter', function () {
    return function (itemList, contactQuery) {
        if (contactQuery.length <= 0) return '';
        itemList = itemList || new Array();
        for (var j = 0; j < itemList.length; j++) {
            var item = itemList[j];
            // Filter on contactQuery
            if (item.id.dbid == contactQuery) {
                return item.first_name + ' ' + item.last_name;
            }
        }
        return '';
    }
});

filterModule.filter('contactDisplayFilter', function () {
    return function (itemList, contactQuery) {
        if (contactQuery.length <= 0) return 'display:none';
        itemList = itemList || new Array();
        for (var j = 0; j < itemList.length; j++) {
            var item = itemList[j];
            // Filter on contactQuery
            if (item.id.dbid == contactQuery) {
                return '';
            }
        }
        return 'display:none';
    }
});

filterModule.filter('eventNameFilter', function () {
    return function (itemList, eventQuery) {
        if (eventQuery.length <= 0) return '';
        itemList = itemList || new Array();
        for (var j = 0; j < itemList.length; j++) {
            var item = itemList[j];
            // Filter on eventQuery
            if (item.id.dbid == eventQuery) {
                return item.name ;
            }
        }
        return '';
    }
});

filterModule.filter('eventDisplayFilter', function () {
    return function (itemList, eventQuery) {
        if (eventQuery.length <= 0) return 'display:none';
        itemList = itemList || new Array();
        for (var j = 0; j < itemList.length; j++) {
            var item = itemList[j];
            // Filter on eventQuery
            if (item.id.dbid == eventQuery) {
                return '';
            }
        }
        return 'display:none';
    }
});

filterModule.filter('opportunityNameFilter', function () {
    return function (itemList, opportunityQuery) {
        if (opportunityQuery.length <= 0) return '';
        itemList = itemList || new Array();
        for (var j = 0; j < itemList.length; j++) {
            var item = itemList[j];
            // Filter on opportunityQuery
            if (item.id.dbid == opportunityQuery) {
                return item.name ;
            }
        }
        return '';
    }
});

filterModule.filter('opportunityDisplayFilter', function () {
    return function (itemList, opportunityQuery) {
        if (opportunityQuery.length <= 0) return 'display:none';
        itemList = itemList || new Array();
        for (var j = 0; j < itemList.length; j++) {
            var item = itemList[j];
            // Filter on opportunityQuery
            if (item.id.dbid == opportunityQuery) {
                return '';
            }
        }
        return 'display:none';
    }
});

filterModule.filter('documentNameFilter', function () {
    return function (itemList, documentQuery) {
        if (documentQuery.length <= 0) return '';
        itemList = itemList || new Array();
        for (var j = 0; j < itemList.length; j++) {
            var item = itemList[j];
            // Filter on documentQuery
            if (item.id.dbid == documentQuery) {
                return item.name ;
            }
        }
        return '';
    }
});

filterModule.filter('documentDisplayFilter', function () {
    return function (itemList, documentQuery) {
        if (documentQuery.length <= 0) return 'display:none';
        itemList = itemList || new Array();
        for (var j = 0; j < itemList.length; j++) {
            var item = itemList[j];
            // Filter on documentQuery
            if (item.id.dbid == documentQuery) {
                return '';
            }
        }
        return 'display:none';
    }
});

filterModule.filter('inObjectListFilter', function () {
    return function (itemList, inObjectList, query, caseSensitive) {
        var filteredInObjectList = [];
        itemList = itemList || [];
        for (var itemRejectIdx = 0; itemRejectIdx < itemList.length; itemRejectIdx++) {
            var itemReject = itemList[itemRejectIdx];
            var accepted = true;
            for (var inIdx = 0; inIdx < inObjectList.length; inIdx++) {
                if (itemReject.id.dbid == inObjectList[inIdx].id.dbid) {
                    accepted = false;
                    break;
                }
            }
            if (accepted) {
                filteredInObjectList.push(itemReject);
            }
        }

        itemList = filteredInObjectList;
        query = query || '';
        var words = query.split(/\s/);
        if (!caseSensitive) {
            for (var wordIdx = 0; wordIdx < words.length; wordIdx++) {
                words[wordIdx] = words[wordIdx].toLowerCase();
            }
        }
        var filteredList = [];
        for (var itemIdx = 0; itemIdx < itemList.length; itemIdx++) {
            var item = itemList[itemIdx];
            // Filter on words in query
            var acceptItem = true;// AND condition on words
            for (var i = 0; i < words.length; i++) {
                var word = words[i];
                var acceptWord = false;// OR condition on item attributes
                for (var k in item) {
                    if (!item.hasOwnProperty(k)) continue;
                    var attr = item[k];
                    if (typeof(attr) == 'string') {
                        if (!caseSensitive) {
                            attr = attr.toLowerCase();
                        }
                        if (attr.indexOf(word) >= 0) {
                            acceptWord = true;
                            break;
                        }
                    }
                }
                if (!acceptWord) {
                    acceptItem = false;
                    break;
                }
            }
            if (acceptItem) {
                filteredList.push(item);
            }
        }
        return filteredList;
    }
});

filterModule.filter('listFilter', function () {
    return function (itemList, query, caseSensitive, whiteAttribute) {
        query = query || '';
        itemList = itemList || [];
        var words = query.split(/\s/);
        var filteredList = [];
        for (var j = 0; j < itemList.length; j++) {
            var item = itemList[j];
            // Filter on words in query OR having true for their whiteAttribute
            var acceptItem = true;// AND condition on words
            if (a4p.isUndefined(whiteAttribute) || !item[whiteAttribute]) {
                for (var i = 0; i < words.length; i++) {
                    var word = words[i];
                    if (!caseSensitive) {
                        word = word.toLowerCase();
                    }
                    var acceptWord = false;// OR condition on item attributes
                    for (var k in item) {
                        if (!item.hasOwnProperty(k)) continue;
                        var attr = item[k];
                        if (typeof(attr) == 'string') {
                            if (!caseSensitive) {
                                attr = attr.toLowerCase();
                            }
                            if (attr.indexOf(word) >= 0) {
                                acceptWord = true;
                                break;
                            }
                        }
                    }
                    if (!acceptWord) {
                        acceptItem = false;
                        break;
                    }
                }
            }
            if (acceptItem) {
                filteredList.push(item);
            }
        }
        return filteredList;
    }
});

filterModule.filter('c4pFilterEventDateMoreThan', function () {
    return function (itemList, date) {

    	var dateDayRounded = new Date(date.getFullYear(),date.getMonth(),date.getDate(),0,0,0,0);
    	var items = [];
        itemList = itemList || new Array();
        for (var j = 0; j < itemList.length; j++) {
            var item = itemList[j];

            if (item.date >= dateDayRounded )
            	items.push(item);
        }

       return items;
    }
});


filterModule.filter('c4pFilterEventDateContains', function () {
    return function (itemList, date) {

    	var items = [];
        itemList = itemList || new Array();
        for (var j = 0; j < itemList.length; j++) {
            var item = itemList[j];

            // Show item with same day
            if (!(item.date > date || date > item.date))
            	items.push(item);
            else if (item.date < date) {
            	// Show item with allDay events coming later
            	for (var i=0; i < item.eventsAllDay.length;i++){
	            	var evtStart = a4pDateParse(item.eventsAllDay[i].date_start);
	            	var evtEnd = a4pDateParse(item.eventsAllDay[i].date_end);
	            	if(evtStart <= date && date < evtEnd)
	                	items.push(item);
            	}
            }
        }

       return items;
    }
});



filterModule.filter('c4pExludeNameFilter', function () {
    return function (itemList, nameToExludeArray) {
    	var items = [];
        itemList = itemList || [];
        for (var j = 0; j < itemList.length; j++) {
            var item = itemList[j];
            var present = false;
            for (var i = 0; i < nameToExludeArray.length; i++) {
                var name = nameToExludeArray[i].name;
                if (item.name == name) {
                	present = true;
                	break;
                }
            }
            if (!present) items.push(item);

        }
        return items;
    }
});

filterModule.filter('c4pItemTypeFilter', function () {
    return function (itemList, typeToIncludeInArray) {
    	var items = [];
        itemList = itemList || [];
        for (var j = 0; j < itemList.length; j++) {
            var item = itemList[j];
            if (item && item.item && item.item.a4p_type === typeToIncludeInArray ) items.push(item);

        }
        return items;
    }
});


filterModule.filter('c4pLinksWithCreation', function () {
    return function (itemList) {
    	var items = [];
        itemList = itemList || [];
        for (var j = 0; j < itemList.length; j++) {
            var item = itemList[j];
            if (item && item.creation ) items.push(item);

        }
        return items;
    }
});

filterModule.filter('c4pLinksWithoutCreation', function () {
    return function (itemList) {
    	var items = [];
        itemList = itemList || [];
        for (var j = 0; j < itemList.length; j++) {
            var item = itemList[j];
            if (item && !item.creation ) items.push(item);

        }
        return items;
    }
});



