'use strict';

// Namespace c4p
var c4p;
if (!c4p) c4p = {};
if (!c4p.Organizer) c4p.Organizer = {};

// Helper functions to populate item lists of the type {keyes: [], lists: {}, others: []}

function addKey(items, prefix, title, key) {
    if (a4p.isDefined(key)) {
        if (a4p.isUndefined(items.lists[key])) {
            items.lists[key] = [];
            items.keyes.push({prefix: prefix, title: title, value: key});
        }
    }
}

function addItem(items, prefix, title, key, item) {
    if (a4p.isUndefined(key)) {
        items.others.push(item);
    } else {
        if (a4p.isUndefined(items.lists[key])) {
            items.lists[key] = [];
            items.keyes.push({prefix: prefix, title: title, value: key});
        }
        items.lists[key].push(item);
    }
}

function addOther(items, item) {
    items.others.push(item);
}

var SrvFacet = (function () {

    function Service(srvData, srvLocale, srvConfig) {

        // Creation of some standard Organizers
        // They are created here because some need to use srvData or srvLocale

        c4p.Organizer.objects = {
            key:'objects',
            icon:'fullscreen',
            keepValue:function (title, value, parentFilterFacets) {
                // Return true if you want to keep this facet in stack of added facets depending on existing parentFilterFacets
                var typeDocument = false;
                for (var facetIdx = 0; facetIdx < parentFilterFacets.length; facetIdx++) {
                    if (parentFilterFacets[facetIdx].key == 'objects') {
                        // Le sous-typage de Contact en Contact/User est plus perturbant qu'autre chose et n'est pas retenu !!!
                        if (!typeDocument && (parentFilterFacets[facetIdx].value == 'Document')) {
                            // At sub level, take Document extensions if needed
                            typeDocument = true;
                        } else {
                            // Duplicate objects Facet on same value or on 2 incompatible types or 3 Facets is useless
                            return false;
                        }
                    }
                }
                if (!typeDocument && (c4p.Model.allTypes.indexOf(value) < 0)) {
                    // AT root level, old sub-level of Document must be rejected
                    return false;
                }
                return true;
            },
            keepActive:function (parentFilterFacets) {
                // Return true if you want to keep this facet active depending on existing parentFilterFacets
                var typeDocument = false;
                for (var facetIdx = 0; facetIdx < parentFilterFacets.length; facetIdx++) {
                    if (parentFilterFacets[facetIdx].key == 'objects') {
                        // Le sous-typage de Contact en Contact/User est plus perturbant qu'autre chose et n'est pas retenu !!!
                        if (!typeDocument && (parentFilterFacets[facetIdx].value == 'Document')) {
                            // At sub level, take Document extensions if needed
                            typeDocument = true;
                        } else {
                            // Duplicate objects Facet on same value or on 2 incompatible types or 3 Facets is useless
                            return false;
                        }
                    }
                }
                return true;
            },
            filter:function (parentObjects, parentFilterFacets) {
                // Return the full categorization of all objects in parentObjects
                var typeDocument = false;
                var typeUndefined = false;
                for (var facetIdx = 0; facetIdx < parentFilterFacets.length; facetIdx++) {
                    if (parentFilterFacets[facetIdx].key == 'objects') {
                        // Le sous-typage de Contact en Contact/User est plus perturbant qu'autre chose et n'est pas retenu !!!
                        if (!typeDocument && (parentFilterFacets[facetIdx].value == 'Document')) {
                            // At sub level, take Document extensions if needed
                            typeDocument = true;
                        } else {
                            // Duplicate objects Facet on same value or on 2 incompatible types or 3 Facets is useless
                            typeUndefined = true;
                            break;
                        }
                    }
                }

                var items = {keyes: [], lists: {}, others: []};
                if (parentFilterFacets.length ==  0) {
                    // At root level hide objects not creatable alone : Note, Report, Attendee, Attachee
                    // At root level add ALL object types even if empty children
                    // Use c4p.Model.allTypes if you want to see Attendees and Attachees in root menu
                    for (var i = 0, nb = c4p.Model.objectTypes.length; i < nb; i++) {
                        var value = c4p.Model.objectTypes[i];
                        //if ((value == 'Note') || (value == 'Report')) continue;
                        var title = srvLocale.translations.htmlTitleType[value];
                        addKey(items, '', title, value);
                    }
                    for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                        var item = parentObjects[objectIdx];
                        var value = item.object.a4p_type;
                        //if ((value == 'Note') || (value == 'Report')) continue;
                        var title = srvLocale.translations.htmlTitleType[value];
                        if (isValueInList(c4p.Model.objectTypes, value)) {
                            addItem(items, '', title, value, item);
                        } else {
                            addOther(items, item);
                        }
                    }
                } else {
                    for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                        var item = parentObjects[objectIdx];
                        var value;
                        var title;
                        if (typeUndefined) {
                            value = undefined;
                            title = '';
                        } else if (typeDocument) {
                            value = item.object.extension;
                            title = value;
                        } else {
                            value = item.object.a4p_type;
                            title = srvLocale.translations.htmlTitleType[value];
                        }
                        addItem(items, '', title, value, item);
                    }
                }
                return items;
            }
        };

        c4p.Organizer.recents = {
            key:'recents',
            icon:'archive',
            keepValue:function (title, value, parentFilterFacets) {
                // Return true if you want to keep this facet in stack of added facets depending on existing parentFilterFacets
                for (var facetIdx = 0; facetIdx < parentFilterFacets.length; facetIdx++) {
                    if (parentFilterFacets[facetIdx].key == 'recents') {
                        // Duplicate recents Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'top20') {
                        // Duplicate recents Facet with top20 Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'mine') {
                        // Duplicate recents Facet with mine Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'favorites') {
                        // Duplicate recents Facet with favorites Facet is useless
                        return false;
                    }
                }
                return true;
            },
            keepActive:function (parentFilterFacets) {
                // Return true if you want to keep this facet active depending on existing parentFilterFacets
                for (var facetIdx = 0; facetIdx < parentFilterFacets.length; facetIdx++) {
                    if (parentFilterFacets[facetIdx].key == 'recents') {
                        // Duplicate recents Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'top20') {
                        // Duplicate recents Facet with top20 Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'mine') {
                        // Duplicate recents Facet with mine Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'favorites') {
                        // Duplicate recents Facet with favorites Facet is useless
                        return false;
                    }
                }
                return true;
            },
            filter:function (parentObjects, parentFilterFacets) {
                var items = {keyes: [], lists: {}, others: []};
                var now = (new Date()).getTime();

                var rootLevel = true;
                for (var facetIdx = 0; facetIdx < parentFilterFacets.length; facetIdx++) {
                    if (parentFilterFacets[facetIdx].key == 'recents') {
                        rootLevel = false;
                    }
                }
                if (rootLevel) {
                    // At root level add ALL object types even if empty children
                    addKey(items, '1', srvLocale.translations.htmlRecently['hour'], 1);
                    addKey(items, '2', srvLocale.translations.htmlRecently['day'], 24);
                    addKey(items, '3', srvLocale.translations.htmlRecently['week'], 7 * 24);
                    addKey(items, '4', srvLocale.translations.htmlRecently['month'], 28 * 24);
                    addKey(items, '5', srvLocale.translations.htmlRecently['year'], 365 * 24);
                    addKey(items, '6', srvLocale.translations.htmlRecently['epoch'], 25 * 365 * 24);
                    for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                        var item = parentObjects[objectIdx];
                        var prefix;
                        var value;
                        var title;
                        if (a4p.isUndefined(item.object.last_modified_date)) {
                            value = undefined;
                            title = '';
                        } else {
                            var date = a4pDateParse(item.object.last_modified_date);
                            if (!date) {
                                value = undefined;
                                title = '';
                            } else {
                                var diffMs = Math.abs(now - date.getTime());
                                if (diffMs < (3600 * 1000)) {
                                    // Less than 1 hour
                                    prefix = '1';
                                    value = 1;
                                    title = srvLocale.translations.htmlRecently['hour'];
                                } else if (diffMs < (24 * 3600 * 1000)) {
                                    // Less than 1 day
                                    prefix = '2';
                                    value = 24;
                                    title = srvLocale.translations.htmlRecently['day'];
                                } else if (diffMs < (7 * 24 * 3600 * 1000)) {
                                    // Less than 1 week
                                    prefix = '3';
                                    value = 7 * 24;
                                    title = srvLocale.translations.htmlRecently['week'];
                                } else if (diffMs < (28 * 24 * 3600 * 1000)) {
                                    // Less than 4 weeks
                                    prefix = '4';
                                    value = 28 * 24;
                                    title = srvLocale.translations.htmlRecently['month'];
                                } else if (diffMs < (365 * 24 * 3600 * 1000)) {
                                    // Less than 1 year
                                    prefix = '5';
                                    value = 365 * 24;
                                    title = srvLocale.translations.htmlRecently['year'];
                                } else {
                                    prefix = '6';
                                    value = 25 * 365 * 24;
                                    title = srvLocale.translations.htmlRecently['epoch'];
                                }
                            }
                        }
                        addItem(items, prefix, title, value, item);
                    }
                } else {
                    for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                        addOther(items, parentObjects[objectIdx]);
                    }
                }

                return items;
            }
        };

        c4p.Organizer.top20 = {
            key:'top20',
            icon:'thumbs-up',
            keepValue:function (title, value, parentFilterFacets) {
                // Return true if you want to keep this facet in stack of added facets depending on existing parentFilterFacets
                for (var facetIdx = 0; facetIdx < parentFilterFacets.length; facetIdx++) {
                    if (parentFilterFacets[facetIdx].key == 'top20') {
                        // Duplicate top20 Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'recents') {
                        // Duplicate top20 Facet with recents Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'mine') {
                        // Duplicate top20 Facet with mine Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'favorites') {
                        // Duplicate top20 Facet with favorites Facet is useless
                        return false;
                    }
                }
                return true;
            },
            keepActive:function (parentFilterFacets) {
                // Return true if you want to keep this facet active depending on existing parentFilterFacets
                for (var facetIdx = 0; facetIdx < parentFilterFacets.length; facetIdx++) {
                    if (parentFilterFacets[facetIdx].key == 'top20') {
                        // Duplicate top20 Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'recents') {
                        // Duplicate top20 Facet with recents Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'mine') {
                        // Duplicate top20 Facet with mine Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'favorites') {
                        // Duplicate top20 Facet with favorites Facet is useless
                        return false;
                    }
                }
                return true;
            },
            filter:function (parentObjects, parentFilterFacets) {
                // 20 most recents
                var items = {keyes: [], lists: {}, others: []};
                var now = (new Date()).getTime();
                var itemList = parentObjects.slice(0);
                itemList.sort(function (a, b) {
                    if (a4p.isUndefined(a.object.last_modified_date)) {
                        return -1;
                    }
                    if (a4p.isUndefined(b.object.last_modified_date)) {
                        return 1;
                    }
                    var dateA = a4pDateParse(a.object.last_modified_date);
                    if (!dateA) {
                        return -1;
                    }
                    var dateB = a4pDateParse(b.object.last_modified_date);
                    if (!dateB) {
                        return 1;
                    }
                    if (dateA.getTime() < dateB.getTime()) return -1;
                    if (dateA.getTime() > dateB.getTime()) return 1;
                    return 0;
                });

                for (var objectIdx = 0, objectNb = itemList.length; (objectIdx < objectNb) && (objectIdx < 20); objectIdx++) {
                    addOther(items, itemList[objectIdx]);
                }

                return items;
            }
        };

        c4p.Organizer.mine = {
            key:'mine',
            icon:'gift',
            keepValue:function (title, value, parentFilterFacets) {
                // Return true if you want to keep this facet in stack of added facets depending on existing parentFilterFacets
                for (var facetIdx = 0; facetIdx < parentFilterFacets.length; facetIdx++) {
                    if (parentFilterFacets[facetIdx].key == 'mine') {
                        // Duplicate mine Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'top20') {
                        // Duplicate mine Facet with top20 Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'recents') {
                        // Duplicate mine Facet with recents Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'favorites') {
                        // Duplicate mine Facet with favorites Facet is useless
                        return false;
                    }
                }
                return true;
            },
            keepActive:function (parentFilterFacets) {
                // Return true if you want to keep this facet active depending on existing parentFilterFacets
                for (var facetIdx = 0; facetIdx < parentFilterFacets.length; facetIdx++) {
                    if (parentFilterFacets[facetIdx].key == 'mine') {
                        // Duplicate mine Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'top20') {
                        // Duplicate mine Facet with top20 Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'recents') {
                        // Duplicate mine Facet with recents Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'favorites') {
                        // Duplicate mine Facet with favorites Facet is useless
                        return false;
                    }
                }
                return true;
            },
            filter:function (parentObjects, parentFilterFacets) {
                var items = {keyes: [], lists: {}, others: []};
                for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                    var item = parentObjects[objectIdx];
                    var object = item.object;
                    if (srvData.isObjectOwnedByUser(object)) {
                        addOther(items, item);
                    }
                }

                return items;
            }
        };

        c4p.Organizer.favorites = {
            key:'favorites',
            icon:'star',
            keepValue:function (title, value, parentFilterFacets) {
                // Return true if you want to keep this facet in stack of added facets depending on existing parentFilterFacets
                for (var facetIdx = 0; facetIdx < parentFilterFacets.length; facetIdx++) {
                    if (parentFilterFacets[facetIdx].key == 'favorites') {
                        // Duplicate favorites Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'mine') {
                        // Duplicate favorites Facet with mine Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'top20') {
                        // Duplicate favorites Facet with top20 Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'recents') {
                        // Duplicate favorites Facet with recents Facet is useless
                        return false;
                    }
                }
                return true;
            },
            keepActive:function (parentFilterFacets) {
                // Return true if you want to keep this facet active depending on existing parentFilterFacets
                for (var facetIdx = 0; facetIdx < parentFilterFacets.length; facetIdx++) {
                    if (parentFilterFacets[facetIdx].key == 'favorites') {
                        // Duplicate favorites Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'mine') {
                        // Duplicate favorites Facet with mine Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'top20') {
                        // Duplicate favorites Facet with top20 Facet is useless
                        return false;
                    }
                    if (parentFilterFacets[facetIdx].key == 'recents') {
                        // Duplicate favorites Facet with recents Facet is useless
                        return false;
                    }
                }
                return true;
            },
            filter:function (parentObjects, parentFilterFacets) {
                var items = {keyes: [], lists: {}, others: []};
                var favoriteFacet = srvData.favoritesObject;
                if (a4p.isDefinedAndNotNull(favoriteFacet)) {
                    for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                        var item = parentObjects[objectIdx];
                        if (inFacet(favoriteFacet, item.object)) {
                            addOther(items, item);
                        }
                    }
                }
                return items;
            }
        };

        c4p.Organizer.month = {
            key:'month',
            icon:'calendar',
            keepValue:function (title, value, parentFilterFacets) {
                // Return true if you want to keep this facet in stack of added facets depending on existing parentFilterFacets
                var typeYear = false;
                var typeMonth = false;
                for (var facetIdx = 0; facetIdx < parentFilterFacets.length; facetIdx++) {
                    if (parentFilterFacets[facetIdx].key == 'month') {
                        if (!typeYear) {
                            typeYear = true;
                        } else if (!typeMonth) {
                            typeMonth = true;
                        } else {
                            // month Facet is useless after Date filtering
                            return false;
                        }
                    } else if (parentFilterFacets[facetIdx].key == 'week') {
                        // month Facet is useless with week Facet
                        return false;
                    }
                }
                if (typeMonth) {
                    // Should do Date level
                    if (('' + value) != title) {
                        return false;
                    }
                    if ((value < 1) || (value > 31)) {
                        return false;
                    }
                } else if (typeYear) {
                    // Should do Month level
                    if (srvLocale.translations.htmlMonth['' + value] != title) {
                        return false;
                    }
                    if ((value < 0) || (value > 11)) {
                        return false;
                    }
                } else {
                    // Should do Year level
                    if (('' + value) != title) {
                        return false;
                    }
                }
                return true;
            },
            keepActive:function (parentFilterFacets) {
                // Return true if you want to keep this facet active depending on existing parentFilterFacets
                var typeYear = false;
                var typeMonth = false;
                for (var facetIdx = 0; facetIdx < parentFilterFacets.length; facetIdx++) {
                    if (parentFilterFacets[facetIdx].key == 'month') {
                        if (!typeYear) {
                            typeYear = true;
                        } else if (!typeMonth) {
                            typeMonth = true;
                        } else {
                            // month Facet is useless after Date filtering
                            return false;
                        }
                    } else if (parentFilterFacets[facetIdx].key == 'week') {
                        // month Facet is useless with week Facet
                        return false;
                    }
                }
                return true;
            },
            filter:function (parentObjects, parentFilterFacets) {
                var typeYear = false;
                var typeMonth = false;
                for (var facetIdx = 0; facetIdx < parentFilterFacets.length; facetIdx++) {
                    if (parentFilterFacets[facetIdx].key == 'month') {
                        if (!typeYear) {
                            typeYear = true;// A parent already does Year level
                        } else if (!typeMonth) {
                            typeMonth = true;// A parent already does Month level
                        }
                    }
                }
                var items = {keyes: [], lists: {}, others: []};
                if (typeMonth) {
                    // Do Date level
                    for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                        var item = parentObjects[objectIdx];
                        var modifiedDate = item.object.last_modified_date;
                        if (a4p.isUndefined(modifiedDate)) {
                            addOther(items, item);
                        } else {
                            var date = a4pDateParse(modifiedDate);
                            if (!date) {
                                addOther(items, item);
                            } else {
                                var value = date.getDate();
                                var title = ''+value;
                                addItem(items, '', title, value, item);
                            }
                        }
                    }
                } else if (typeYear) {
                    // Do Month level
                    for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                        var item = parentObjects[objectIdx];
                        var modifiedDate = item.object.last_modified_date;
                        if (a4p.isUndefined(modifiedDate)) {
                            addOther(items, item);
                        } else {
                            var date = a4pDateParse(modifiedDate);
                            if (!date) {
                                addOther(items, item);
                            } else {
                                var value = date.getMonth();
                                var title = srvLocale.translations.htmlMonth['' + value];
                                addItem(items, '', title, value, item);
                            }
                        }
                    }
                } else {
                    // Do Year level
                    for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                        var item = parentObjects[objectIdx];
                        var modifiedDate = item.object.last_modified_date;
                        if (a4p.isUndefined(modifiedDate)) {
                            addOther(items, item);
                        } else {
                            var date = a4pDateParse(modifiedDate);
                            if (!date) {
                                addOther(items, item);
                            } else {
                                var value = date.getFullYear();
                                var title = '' + value;
                                addItem(items, '', title, value, item);
                            }
                        }
                    }
                }
                return items;
            }
        };

        c4p.Organizer.week = {
            key:'week',
            icon:'calendar-empty',
            keepValue:function (title, value, parentFilterFacets) {
                // Return true if you want to keep this facet in stack of added facets depending on existing parentFilterFacets
                var typeYear = false;
                var typeWeek = false;
                for (var facetIdx = 0; facetIdx < parentFilterFacets.length; facetIdx++) {
                    if (parentFilterFacets[facetIdx].key == 'week') {
                        if (!typeYear) {
                            typeYear = true;
                        } else if (!typeWeek) {
                            typeWeek = true;
                        } else {
                            // week Facet is useless after Day filtering
                            return false;
                        }
                    } else if (parentFilterFacets[facetIdx].key == 'month') {
                        // week Facet is useless with month Facet
                        return false;
                    }
                }
                if (typeWeek) {
                    // Should do Day level
                    if (srvLocale.translations.htmlDayOfWeek['' + value] != title) {
                        return false;
                    }
                    if ((value < 0) || (value > 6)) {
                        return false;
                    }
                } else if (typeYear) {
                    // Should do Week level
                    if (('' + value) != title) {
                        return false;
                    }
                    if ((value < 1) || (value > 54)) {
                        return false;
                    }
                } else {
                    // Should do Year level
                    if (('' + value) != title) {
                        return false;
                    }
                }
                return true;
            },
            keepActive:function (parentFilterFacets) {
                // Return true if you want to keep this facet active depending on existing parentFilterFacets
                var typeYear = false;
                var typeWeek = false;
                for (var facetIdx = 0; facetIdx < parentFilterFacets.length; facetIdx++) {
                    if (parentFilterFacets[facetIdx].key == 'week') {
                        if (!typeYear) {
                            typeYear = true;
                        } else if (!typeWeek) {
                            typeWeek = true;
                        } else {
                            // week Facet is useless after Day filtering
                            return false;
                        }
                    } else if (parentFilterFacets[facetIdx].key == 'month') {
                        // week Facet is useless with month Facet
                        return false;
                    }
                }
                return true;
            },
            filter:function (parentObjects, parentFilterFacets) {
                var typeYear = false;
                var typeWeek = false;
                for (var facetIdx = 0; facetIdx < parentFilterFacets.length; facetIdx++) {
                    if (parentFilterFacets[facetIdx].key == 'week') {
                        if (!typeYear) {
                            typeYear = true;// A parent already does Year level
                        } else if (!typeWeek) {
                            typeWeek = true;// A parent already does Week level
                        }
                    }
                }
                var items = {keyes: [], lists: {}, others: []};
                if (typeWeek) {
                    // Do Day level
                    for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                        var item = parentObjects[objectIdx];
                        var modifiedDate = item.object.last_modified_date;
                        if (a4p.isUndefined(modifiedDate)) {
                            addOther(items, item);
                        } else {
                            var date = a4pDateParse(modifiedDate);
                            if (!date) {
                                addOther(items, item);
                            } else {
                                var value = date.getDay();
                                var title = srvLocale.translations.htmlDayOfWeek['' + value];
                                addItem(items, '', title, value, item);
                            }
                        }
                    }
                } else if (typeYear) {
                    // Do Week level
                    for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                        var item = parentObjects[objectIdx];
                        var modifiedDate = item.object.last_modified_date;
                        if (a4p.isUndefined(modifiedDate)) {
                            addOther(items, item);
                        } else {
                            var date = a4pDateParse(modifiedDate);
                            if (!date) {
                                addOther(items, item);
                            } else {
                                var value = date.getWeek();
                                var title = '' + value;
                                addItem(items, '', title, value, item);
                            }
                        }
                    }
                } else {
                    // Do Year level
                    for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                        var item = parentObjects[objectIdx];
                        var modifiedDate = item.object.last_modified_date;
                        if (a4p.isUndefined(modifiedDate)) {
                            addOther(items, item);
                        } else {
                            var date = a4pDateParse(modifiedDate);
                            if (!date) {
                                addOther(items, item);
                            } else {
                                var value = date.getFullYear();
                                var title = '' + value;
                                addItem(items, '', title, value, item);
                            }
                        }
                    }
                }
                return items;
            }
        };

        function nextDirName(path, rootLevel) {
            var slashBeg, antiSlashBeg, previousSlashEnd, previousAntiSlashEnd;
            slashBeg = path.indexOf("/");
            previousSlashEnd = -1;
            antiSlashBeg = path.indexOf("\\");
            previousAntiSlashEnd = -1;
            if (slashBeg == 0) {
                // Skip successive '/' in first position
                previousSlashEnd = slashBeg;
                slashBeg = path.indexOf("/", previousSlashEnd + 1);
                while (slashBeg == (previousSlashEnd + 1)) {
                    previousSlashEnd = slashBeg;
                    slashBeg = path.indexOf("/", previousSlashEnd + 1);
                }
            } else if (antiSlashBeg == 0) {
                // Skip successive '\\' in first position
                previousAntiSlashEnd = antiSlashBeg;
                antiSlashBeg = path.indexOf("\\", previousAntiSlashEnd + 1);
                while (antiSlashBeg == (previousAntiSlashEnd + 1)) {
                    previousAntiSlashEnd = antiSlashBeg;
                    antiSlashBeg = path.indexOf("\\", previousAntiSlashEnd + 1);
                }
            }
            if (slashBeg >= 0) {
                if (antiSlashBeg >= 0) {
                    if (slashBeg < antiSlashBeg) {
                        if (rootLevel) {
                            // We must take into account ROOT dir to differenciate it between absolute and relative path
                            // => keep the first '/' or '\\' in its name.
                            return [path.substring(0, slashBeg), path.substring(slashBeg + 1)];
                        } else {
                            return [path.substring(previousSlashEnd + 1, slashBeg), path.substring(slashBeg + 1)];
                        }
                    } else {
                        if (rootLevel) {
                            // We must take into account ROOT dir to differenciate it between absolute and relative path
                            // => keep the first '/' or '\\' in its name.
                            return [path.substring(0, antiSlashBeg), path.substring(antiSlashBeg + 1)];
                        } else {
                            return [path.substring(previousAntiSlashEnd + 1, antiSlashBeg), path.substring(antiSlashBeg + 1)];
                        }
                    }
                } else {
                    if (rootLevel) {
                        // We must take into account ROOT dir to differenciate it between absolute and relative path
                        // => keep the first '/' or '\\' in its name.
                        return [path.substring(0, slashBeg), path.substring(slashBeg + 1)];
                    } else {
                        return [path.substring(previousSlashEnd + 1, slashBeg), path.substring(slashBeg + 1)];
                    }
                }
            } else {
                if (antiSlashBeg >= 0) {
                    if (rootLevel) {
                        // We must take into account ROOT dir to differenciate it between absolute and relative path
                        // => keep the first '/' or '\\' in its name.
                        return [path.substring(0, antiSlashBeg), path.substring(antiSlashBeg + 1)];
                    } else {
                        return [path.substring(previousAntiSlashEnd + 1, antiSlashBeg), path.substring(antiSlashBeg + 1)];
                    }
                } else {
                    return undefined;
                }
            }
        }

        c4p.Organizer.fileDir = {
            key:'fileDir',
            icon:'folder-open',
            keepValue:function (title, value, parentFilterFacets) {
                // Return true if you want to keep this facet in stack of added facets depending on existing parentFilterFacets
                return true;
            },
            keepActive:function (parentFilterFacets) {
                // Return true if you want to keep this facet active depending on existing parentFilterFacets
                return true;
            },
            filter:function (parentObjects, parentFilterFacets) {
                var dirLevel = 0;
                for (var facetIdx = 0; facetIdx < parentFilterFacets.length; facetIdx++) {
                    if (parentFilterFacets[facetIdx].key == 'fileDir') {
                        dirLevel++;
                    }
                }
                var items = {keyes: [], lists: {}, others: []};
                for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                    var item = parentObjects[objectIdx];
                    var filePath = item.object.filePath;
                    if (a4p.isUndefined(filePath)) {
                        addOther(items, item);
                    } else {
                        var done = false, result, rootLevel = true;
                        for (var level = dirLevel; level > 0; level--) {
                            result = nextDirName(filePath, rootLevel);
                            if (a4p.isUndefined(result)) {
                                // Can occurs if facet value has chosen 'others'
                                addOther(items, item);
                                done = true;
                                break;
                            }
                            // result[0] should equals parentFilterFacets[facetIdx].value
                            filePath = result[1];
                            rootLevel = false;
                        }
                        if (!done) {
                            result = nextDirName(filePath, rootLevel);
                            if (a4p.isUndefined(result)) {
                                // Can occurs if facet value has chosen 'others'
                                addOther(items, item);
                            } else {
                                addItem(items, '', result[0], result[0], item);
                            }
                        }
                    }
                }
                return items;
            }
        };

        function inRootFacet(biblio, object) {
            // facet = {facets_ids:[], items_ids:[]}
            if (a4p.isUndefined(object.id.dbid)) return false;
            for (var i = 0, nb = biblio.facets_ids.length; i < nb; i++) {
                if (object.id.dbid == biblio.facets_ids[i].dbid) return true;
            }
            for (var i = 0, nb = biblio.items_ids.length; i < nb; i++) {
                if (object.id.dbid == biblio.items_ids[i].dbid) return true;
            }
            return false;
        }

        function inFacet(facet, object, alreadyScanned) {
            // facet = {facets_ids:[], items_ids:[]}
            if (a4p.isUndefined(alreadyScanned)) alreadyScanned = {};
            if (a4p.isUndefined(object.id.dbid)) return false;
            if (inRootFacet(facet, object)) return true;
            alreadyScanned[facet.id.dbid] = facet;
            for (var i = 0, nb = facet.facets_ids.length; i < nb; i++) {
                if (a4p.isUndefined(facet.facets_ids[i].dbid)) continue;
                var subFacet = srvData.getObject(facet.facets_ids[i].dbid);
                if (a4p.isUndefined(subFacet)) continue;
                if (a4p.isDefined(alreadyScanned[subFacet.id.dbid])) continue;
                if (inFacet(subFacet, object)) return true;
            }
            return false;
        }

        c4p.Organizer.biblio = {
            key:'biblio',
            icon:'sitemap',
            keepValue:function (title, value, parentFilterFacets) {
                // Return true if you want to keep this facet in stack of added facets depending on existing parentFilterFacets
                return true;
            },
            keepActive:function (parentFilterFacets) {
                // Return true if you want to keep this facet active depending on existing parentFilterFacets
                return true;
            },
            filter:function (parentObjects, parentFilterFacets) {
                // facet = {facets_ids:[], items_ids:[]}
                var items = {keyes: [], lists: {}, others: []};
                // Go backward in parentFilterFacets to find RootFacet name
                var rootFacet;
                for (var rootFacetIdx = parentFilterFacets.length - 1; rootFacetIdx >= 0; rootFacetIdx--) {
                    if (parentFilterFacets[rootFacetIdx].key == 'biblio') {
                        if (a4p.isUndefined(parentFilterFacets[rootFacetIdx].value)) {
                            // undefined biblio
                            for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                                addOther(items, parentObjects[objectIdx]);
                            }
                            return items;
                        } else {
                            for (var dataIdx = 0, dataNb = srvData.currentItems.Facet.length; dataIdx < dataNb; dataIdx++) {
                                var facet = srvData.currentItems.Facet[dataIdx];
                                if (a4p.isUndefined(facet.parent_id) || a4p.isUndefined(facet.parent_id.dbid)) {
                                    if (facet.name == parentFilterFacets[rootFacetIdx].value) {
                                        rootFacet = facet;
                                        break;
                                    }
                                }
                            }
                            if (a4p.isDefined(rootFacet)) break;
                        }
                    }
                }
                if (a4p.isUndefined(rootFacet)) {
                    // Root facets
                    var rootFacets = [];
                    for (var dataIdx = 0, dataNb = srvData.currentItems.Facet.length; dataIdx < dataNb; dataIdx++) {
                        var facet = srvData.currentItems.Facet[dataIdx];
                        if (a4p.isUndefined(facet.parent_id) || a4p.isUndefined(facet.parent_id.dbid)) {
                            // root facet
                            rootFacets.push(facet);
                        }
                    }
                    // Add ALL root facets even if empty children
                    for (var i = 0, nb = rootFacets.length; i < nb; i++) {
                        addKey(items, rootFacets[i].prefix, rootFacets[i].name, rootFacets[i].name);
                    }
                    for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                        var item = parentObjects[objectIdx];
                        if ((item.object.a4p_type == 'Facet')
                            && (a4p.isUndefined(item.object.parent_id) || a4p.isUndefined(item.object.parent_id.dbid))) {
                            // Do not show root facets in others or any sub-facet
                            continue;
                        }
                        var others = true;
                        for (var i = 0, nb = rootFacets.length; i < nb; i++) {
                            if (inFacet(rootFacets[i], item.object)) {
                                addItem(items, rootFacets[i].prefix, rootFacets[i].name, rootFacets[i].name, item);
                                others = false;
                            }
                        }
                        if (others) {
                            addOther(items, item);
                        }
                    }
                    return items;
                } else {
                    // Sub facets
                    // Go forward in parentFilterFacets to follow subFacets path
                    for (var facetIdx = rootFacetIdx + 1; facetIdx < parentFilterFacets.length; facetIdx++) {
                        if (parentFilterFacets[facetIdx].key == 'biblio') {
                            if (a4p.isUndefined(parentFilterFacets[facetIdx].value)) {
                                for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                                    addOther(items, parentObjects[objectIdx]);
                                }
                                return items;
                            } else {
                                var found = false;
                                for (var i = 0, nb = rootFacet.facets_ids.length; i < nb; i++) {
                                    if (a4p.isUndefined(rootFacet.facets_ids[i].dbid)) continue;
                                    var subFacet = srvData.getObject(rootFacet.facets_ids[i].dbid);
                                    if (a4p.isUndefined(subFacet)) continue;
                                    if (subFacet.name == parentFilterFacets[facetIdx].value) {
                                        rootFacet = subFacet;
                                        found = true;
                                        break;
                                    }
                                }
                                if (!found) {
                                    // It should not appear except in change of model which delete the Facet
                                    // No biblio and no object is possible under inexistant biblio
                                    for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                                        addOther(items, parentObjects[objectIdx]);
                                    }
                                    return items;
                                }
                            }
                        }
                    }
                    // Organize objects
                    // Add ALL sub-facets even if empty children
                    for (var i = 0, nb = rootFacet.facets_ids.length; i < nb; i++) {
                        if (a4p.isUndefined(rootFacet.facets_ids[i].dbid)) continue;
                        var subFacet = srvData.getObject(rootFacet.facets_ids[i].dbid);
                        if (a4p.isUndefined(subFacet)) continue;
                        addKey(items, subFacet.prefix, subFacet.name, subFacet.name);
                    }
                    for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                        var item = parentObjects[objectIdx];
                        if ((item.object.a4p_type == 'Facet') && (item.object.parent_id.dbid == rootFacet.id.dbid)) {
                            // Do not show sub-facets in others or any sub-facet
                            continue;
                        }
                        for (var i = 0, nb = rootFacet.facets_ids.length; i < nb; i++) {
                            if (a4p.isUndefined(rootFacet.facets_ids[i].dbid)) continue;
                            var subFacet = srvData.getObject(rootFacet.facets_ids[i].dbid);
                            if (a4p.isUndefined(subFacet)) continue;
                            if (inFacet(subFacet, item.object)) {
                                addItem(items, subFacet.prefix, subFacet.name, subFacet.name, item);
                            }
                        }
                        if (inRootFacet(rootFacet, item.object)) {
                            addOther(items, item);
                        }
                    }
                    return items;
                }
            }
        };


        this.srvData = srvData;
        this.srvLocale = srvLocale;
        this.srvConfig = srvConfig;

        /**
         * List of predefined facets accessible to the User
         * @type {Array}
         */
        this.definedFacetKeyes = [];

        /**
         * Map of predefined facets
         * @type {{}}
         */
        this.definedOrganizers = {};

        // TODO : listening on srvData changes to update facets results.

        this.ascendingOrder = true;
        this.caseSensitive = false;
        this.filterQuery = '';
        this.filterFacets = [];
        this.lastFacetKey = '';
        this.rootItems = [];
        this.queryItems = [];
        this.items = {keyes: [], lists: {}, others: []};

        var self = this;
        this.srvData.addListenerOnUpdate(function (callbackId, action, type, id) {
            self.updateItems();
        });
    }

    /**
     * Helper function creating a specific sameCompany Organizer
     *
     * @param companyDbid
     */
    Service.prototype.createSameCompanyOrganizer = function (companyDbid) {
        var account = this.srvData.getObject(companyDbid);
        var companyName = a4p.isDefined(account) ? this.srvConfig.getItemName(account) : this.srvLocale.translations.htmlFacetName['sameCompany'];
        return {
            key:'sameCompany',
            icon:'building-o',
            keepValue:function (title, value, parentFilterFacets) {
                // Return true if you want to keep this facet in stack of added facets depending on existing parentFilterFacets
                return true;
            },
            keepActive:function (parentFilterFacets) {
                // Return true if you want to keep this facet active depending on existing parentFilterFacets
                return true;
            },
            filter:function (parentObjects, parentFilterFacets) {
                var items = {keyes: [], lists: {}, others: []};
                for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                    var item = parentObjects[objectIdx];
                    if (item.object.id.dbid == companyDbid) {
                        addItem(items, '', companyName, companyName, item);
                    } else if (a4p.isDefined(item.object.account_id) && (item.object.account_id.dbid == companyDbid)) {
                        addItem(items, '', companyName, companyName, item);
                    } else {
                        addOther(items, item);
                    }
                }
                return items;
            }
        }
    };

    /**
     * Helper function creating a specific sameManager Organizer
     *
     * @param managerDbid
     */
    Service.prototype.createSameManagerOrganizer = function (managerDbid) {
        var contact = this.srvData.getObject(managerDbid);
        var managerName = a4p.isDefined(contact) ? this.srvConfig.getItemName(contact) : this.srvLocale.translations.htmlFacetName['sameManager'];
        return {
            key:'sameManager',
            icon:'user',
            keepValue:function (title, value, parentFilterFacets) {
                // Return true if you want to keep this facet in stack of added facets depending on existing parentFilterFacets
                return true;
            },
            keepActive:function (parentFilterFacets) {
                // Return true if you want to keep this facet active depending on existing parentFilterFacets
                return true;
            },
            filter:function (parentObjects, parentFilterFacets) {
                var items = {keyes: [], lists: {}, others: []};
                for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                    var item = parentObjects[objectIdx];
                    if (item.object.id.dbid == managerDbid) {
                        addItem(items, '', managerName, managerName, item);
                    } else if (a4p.isDefined(item.object.manager_id) && (item.object.manager_id.dbid == managerDbid)) {
                        addItem(items, '', managerName, managerName, item);
                    } else {
                        addOther(items, item);
                    }
                }
                return items;
            }
        }
    };

    /**
     * Helper function creating a specific sameTeam Organizer
     *
     * @param managerDbid
     */
    Service.prototype.createSameTeamOrganizer = function (managerDbid) {
        var contact = this.srvData.getObject(managerDbid);
        var managerName = a4p.isDefined(contact) ? this.srvConfig.getItemName(contact) : this.srvLocale.translations.htmlFacetName['sameTeam'];
        return {
            key:'sameTeam',
            icon:'group',
            keepValue:function (title, value, parentFilterFacets) {
                // Return true if you want to keep this facet in stack of added facets depending on existing parentFilterFacets
                return true;
            },
            keepActive:function (parentFilterFacets) {
                // Return true if you want to keep this facet active depending on existing parentFilterFacets
                return true;
            },
            filter:function (parentObjects, parentFilterFacets) {
                var items = {keyes: [], lists: {}, others: []};
                for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                    var item = parentObjects[objectIdx];
                    if (item.object.id.dbid == managerDbid) {
                        addItem(items, '', managerName, managerName, item);
                    } else if (a4p.isDefined(item.object.manager_id) && (item.object.manager_id.dbid == managerDbid)) {
                        addItem(items, '', managerName, managerName, item);
                    } else {
                        addOther(items, item);
                    }
                }
                return items;
            }
        }
    };

    /**
     * Helper function creating a specific eventAttendees Organizer
     *
     * @param attendeesList
     */
    Service.prototype.createEventAttendeesOrganizer = function (attendeesList) {
        var facetName = this.srvLocale.translations.htmlFacetName['eventAttendees'];
        return {
            key:'eventAttendees',
            icon:'coffee',
            keepValue:function (title, value, parentFilterFacets) {
                // Return true if you want to keep this facet in stack of added facets depending on existing parentFilterFacets
                return true;
            },
            keepActive:function (parentFilterFacets) {
                // Return true if you want to keep this facet active depending on existing parentFilterFacets
                return true;
            },
            filter:function (parentObjects, parentFilterFacets) {
                var items = {keyes: [], lists: {}, others: []};
                for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                    var item = parentObjects[objectIdx];
                    var found = false;
                    for (var i = 0; i < attendeesList.length; i++) {
                        if (attendeesList[i].relation_id.dbid == item.object.id.dbid) {
                            var event = this.srvData.getObject(attendeesList[i].event_id.dbid);
                            var eventName = a4p.isDefined(event) ? this.srvConfig.getItemName(event) : facetName;
                            addItem(items, '', eventName, eventName, item);
                            found = true;
                        }
                    }
                    if (!found) {
                        addOther(items, item);
                    }
                }
                return items;
            }
        }
    };

    /**
     * Helper function creating a specific eventAttachments Organizer
     *
     * @param attachmentsList
     */
    Service.prototype.createEventAttachmentsOrganizer = function (attachmentsList) {
        var facetName = this.srvLocale.translations.htmlFacetName['eventAttachments'];
        return {
            key:'eventAttachments',
            icon:'file-text-alt',
            keepValue:function (title, value, parentFilterFacets) {
                // Return true if you want to keep this facet in stack of added facets depending on existing parentFilterFacets
                return true;
            },
            keepActive:function (parentFilterFacets) {
                // Return true if you want to keep this facet active depending on existing parentFilterFacets
                return true;
            },
            filter:function (parentObjects, parentFilterFacets) {
                var items = {keyes: [], lists: {}, others: []};
                for (var objectIdx = 0, objectNb = parentObjects.length; objectIdx < objectNb; objectIdx++) {
                    var item = parentObjects[objectIdx];
                    var found = false;
                    for (var i = 0; i < attachmentsList.length; i++) {
                        if (attachmentsList[i].id.dbid == item.object.id.dbid) {
                            addItem(items, '', facetName, facetName, item);
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        addOther(items, item);
                    }
                }
                return items;
            }
        }
    };

    /**
     * Configuration of the service by adding a new possible Organizer Facet
     * Facets which use virtual containers :  container is editable, objects are movable, objects can be in MANY sub-containers.
     *
     * @param organizer
     */
    Service.prototype.addPossibleOrganizerFacet = function (organizer) {
        if (a4p.isUndefined(this.definedOrganizers[organizer.key])) {
            this.definedFacetKeyes.push(organizer.key);
        }
        this.definedOrganizers[organizer.key] = organizer;
        if (this.lastFacetKey == '') this.setFacet(organizer.key);
    };

    /**
     * User choose to change the active facet => change categories
     *
     * @param facetKey
     */
    Service.prototype.setFacet = function (facetKey) {
        var updateFromLevel = -1;
        if (this.lastFacetKey == '') {
            this.lastFacetKey = facetKey;
            updateFromLevel = -1;
            //this.updateItems();
        } else {
            this.lastFacetKey = facetKey;
            updateFromLevel = this.filterFacets.length;
            //this.updateFinalItems();
        }
        /*
        if (this.items.keyes.length == 0) {
            // If no sub-categories, add automatically the facet (usefull for registering top20 for example)
            this.filterFacets.push({key: facetKey, title: '', value: undefined, items: this.items.others});
            // Remove useless facets
            for (var facetIdx = this.filterFacets.length-1; facetIdx >= 0; facetIdx--) {
                var filterFacet = this.filterFacets[facetIdx];
                var organizer = this.definedOrganizers[filterFacet.key];
                if (a4p.isDefined(organizer.keepValue)) {
                    if (!organizer.keepValue(filterFacet.title, filterFacet.value, this.filterFacets.slice(0, facetIdx))) {
                        this.filterFacets.splice(facetIdx, 1);
                        if (facetIdx <= updateFromLevel) updateFromLevel = (facetIdx - 1);
                    }
                }
            }
        }
        */
        // Reject active facet if needed
        if (!this.isFacetActivable(facetKey)) {
            // Return to the first defined Facet
            this.lastFacetKey = this.definedFacetKeyes[0];
        }
        this.updateItems(updateFromLevel);
    };

    /**
     * User select a value for the active facet => add this pair (facet:value) in filterFacets and reset active facet.
     * In doing this we NEVER select others objects, since they are at root level and in no sub category.
     *
     * @param facetKey
     * @param title
     * @param value
     */
    Service.prototype.addFacet = function (facetKey, title, value) {
        var updateFromLevel = -1;
        if (this.lastFacetKey != facetKey) {
            if (this.lastFacetKey == '') {
                this.lastFacetKey = facetKey;
                updateFromLevel = -1;
                //this.updateItems();
            } else {
                this.lastFacetKey = facetKey;
                updateFromLevel = this.filterFacets.length;
                //this.updateFinalItems();
            }
        }
        if (a4p.isDefined(value)) {
            this.filterFacets.push({key: facetKey, title: title, value: value, items: this.items.lists[value]});
        } else {
            this.filterFacets.push({key: facetKey, title: title, value: value, items: this.items.others});
        }
        // Remove useless facets
        for (var facetIdx = this.filterFacets.length-1; facetIdx >= 0; facetIdx--) {
            var filterFacet = this.filterFacets[facetIdx];
            var organizer = this.definedOrganizers[filterFacet.key];
            if (a4p.isDefined(organizer) && a4p.isDefined(organizer.keepValue)) {
                if (!organizer.keepValue(filterFacet.title, filterFacet.value, this.filterFacets.slice(0, facetIdx))) {
                    this.filterFacets.splice(facetIdx, 1);
                    if (facetIdx <= updateFromLevel) updateFromLevel = (facetIdx - 1);
                }
            }
        }
        // Reject active facet if needed
        if (!this.isFacetActivable(facetKey)) {
            // Return to the first defined Facet
            this.lastFacetKey = this.definedFacetKeyes[0];
        }
        this.updateItems(updateFromLevel);
    };

    Service.prototype.removeFacet = function (facetIdx) {
        var updateFromLevel = facetIdx - 1;
        this.filterFacets.splice(facetIdx, 1);
        // Remove useless facets
        for (var i = this.filterFacets.length-1; i >= 0; i--) {
            var filterFacet = this.filterFacets[i];
            var organizer = this.definedOrganizers[filterFacet.key];
            if (a4p.isDefined(organizer) && a4p.isDefined(organizer.keepValue)) {
                if (!organizer.keepValue(filterFacet.title, filterFacet.value, this.filterFacets.slice(0, i))) {
                    this.filterFacets.splice(i, 1);
                    if (i <= updateFromLevel) updateFromLevel = (i - 1);
                }
            }
        }
        // Reject active facet if needed
        if (this.filterFacets.length > 0) {
            this.lastFacetKey = (this.getFacet(this.filterFacets.length - 1)).key;
        }
        if ((this.lastFacetKey == '') || !this.isFacetActivable(this.lastFacetKey)) {
            // Return to the first defined Facet
            this.lastFacetKey = this.definedFacetKeyes[0];
        }
        this.updateItems(updateFromLevel);
    };

    Service.prototype.removeLastFacet = function () {
        if (this.filterFacets.length > 0) {
            this.removeFacet(this.filterFacets.length - 1);
        }
    };

    Service.prototype.clearOrRemoveFacet = function (doClear, removeIndex) {
        if (doClear) {
            this.clear();
        }
        else {
            this.removeFacet(removeIndex);
        }
    };

    Service.prototype.getFacet = function (facetIdx) {
        return this.filterFacets[facetIdx];
    };

    Service.prototype.getFirstFacet = function () {
        if (this.filterFacets.length > 0) {
            return this.getFacet(0);
        } else {
            return null;
        }
    };

    Service.prototype.getFirstFacetKey = function () {
        if (this.filterFacets.length > 0) {
            return (this.getFacet(0)).key;
        } else {
            return '';
        }
    };

    Service.prototype.getFirstFacetValue = function () {
        if (this.filterFacets.length > 0) {
            return (this.getFacet(0)).value;
        } else {
            return '';
        }
    };

    Service.prototype.getFirstFacetTitle = function () {
        if (this.filterFacets.length > 0) {
            return (this.getFacet(0)).title;
        } else {
            return '';
        }
    };

    Service.prototype.isFirstFacetAnObjectType = function () {
        if (this.filterFacets.length > 0) {
            return c4p.Model.allTypes.indexOf(this.getFirstFacet().value) >= 0;
        } else {
            return false;
        }
    };

    Service.prototype.getLastFacet = function () {
        if (this.filterFacets.length > 0) {
            return this.getFacet(this.filterFacets.length - 1);
        } else {
            return null;
        }
    };

    Service.prototype.getLastFacetKey = function () {
        if (this.filterFacets.length > 0) {
            return (this.getFacet(this.filterFacets.length - 1)).key;
        } else {
            return '';
        }
    };

    Service.prototype.getLastFacetValue = function () {
        if (this.filterFacets.length > 0) {
            return (this.getFacet(this.filterFacets.length - 1)).value;
        } else {
            return '';
        }
    };

    Service.prototype.getLastFacetTitle = function () {
        if (this.filterFacets.length > 0) {
            return (this.getFacet(this.filterFacets.length - 1)).title;
        } else {
            return '';
        }
    };

    Service.prototype.isLastFacetAnObjectType = function () {
        if (this.filterFacets.length > 0) {
            return c4p.Model.allTypes.indexOf(this.getLastFacet().value) >= 0;
        } else {
            return false;
        }
    };

    Service.prototype.isFacetActivable = function (facetKey) {
        var organizer = this.definedOrganizers[facetKey];
        if (a4p.isDefined(organizer) && a4p.isDefined(organizer.keepActive)) {
            return organizer.keepActive(this.filterFacets);
        }
        return false;
    };

    Service.prototype.isFacetAnObjectType = function (value) {
        return c4p.Model.allTypes.indexOf(value) >= 0;
    };

    Service.prototype.toggleOrder = function () {
        this.ascendingOrder = !this.ascendingOrder;
        this.updateItems(0);
    };

    Service.prototype.toggleCaseSensitive = function () {
        this.caseSensitive = !this.caseSensitive;
        this.updateItems(0);
    };

    Service.prototype.setFilterQuery = function (filterQuery) {
        this.filterQuery = filterQuery;
        this.updateItems(0);
    };

    Service.prototype.clear = function () {
        this.ascendingOrder = true;
        this.caseSensitive = false;
        this.filterQuery = '';
        this.filterFacets = [];
        this.lastFacetKey = '';
        //this.rootItems = [];
        // We clear rootItems only on srvData update, not on User clear
        this.queryItems = [];
        this.items = {keyes: [], lists: {}, others: []};
        if (this.definedFacetKeyes.length) {
            this.lastFacetKey = this.definedFacetKeyes[0];
            this.updateItems(0);// do not update rootItems
        }
    };

    /**
     * Calculate root objects list : Objects from srvData ordered and filtered by filterQuery.
     * Then apply filter facets on parent objects list (starting from root objects list).
     * Then apply active facet on parent objects list to categorize objects and split them into sublists.
     *
     * @param from Level from which we must re-calculate items lists (-1=rootItems, 0=firstFilterFacet, etc.)
     */
    Service.prototype.updateItems = function (from) {
        if (this.lastFacetKey == '') return;
        if (a4p.isUndefined(from)) from = -1;
        if (from < 0) this.updateRootItems();
        if (from <= 0) {
            this.queryItems = this.queryFilter(this.rootItems, this.filterQuery, this.caseSensitive);
            this.sortItems(this.queryItems, this.ascendingOrder, this.caseSensitive);
        }
        this.applyFilterFacets(from);
        this.updateFinalItems();
    };

    /**
     * Calculate root objects list : Objects from srvData ordered and filtered by filterQuery
     */
    Service.prototype.updateRootItems = function () {
        this.rootItems = [];
        // TODO : accept to show attachTypes in the future
        for (var typeIdx = 0; typeIdx < c4p.Model.objectTypes.length; typeIdx++) {
            var type = c4p.Model.objectTypes[typeIdx];
            for (var i = 0, nb = this.srvData.currentItems[type].length; i < nb; i++) {
                this.rootItems.push({object: this.srvData.currentItems[type][i]});
            }
        }
    };

    /**
     * Apply filter facets on parent objects list (starting from root objects list)
     * @param from Level from which we must re-calculate items lists (0=firstFilterFacet, etc.)
     */
    Service.prototype.applyFilterFacets = function (from) {
        if (a4p.isUndefined(from)) from = 0;
        if (from < 0) from = 0;
        if (from < this.filterFacets.length) {
            var parentItems = (from <= 0) ? this.queryItems : this.filterFacets[from - 1].items;
            for (var facetIdx = from; facetIdx < this.filterFacets.length; facetIdx++) {
                this.applyFilterFacet(this.definedOrganizers, parentItems, this.filterFacets.slice(0, facetIdx), this.filterFacets[facetIdx]);
                parentItems = this.filterFacets[facetIdx].items;
            }
        }
    };

    /**
     * Apply active facet on parent objects list
     */
    Service.prototype.updateFinalItems = function () {
        var parentItems = (this.filterFacets.length <= 0) ? this.queryItems : this.filterFacets[this.filterFacets.length - 1].items;
        this.items = this.applyFacet(this.definedOrganizers, parentItems, this.filterFacets, this.lastFacetKey);
        this.sortKeyes(this.items.keyes, this.ascendingOrder, this.caseSensitive);
    };

    /**
     * Apply one filter facet on parent objects list
     */
    Service.prototype.applyFilterFacet = function (definedOrganizers, parentItems, parentFilterFacets, filterFacet) {
        var items = [];
        var facetKey = filterFacet.key;
        var facetValue = filterFacet.value;// undefined if chosen 'others'
        var organizer = definedOrganizers[facetKey];
        if (a4p.isDefined(organizer.filter)) {
            // objectList = {keyes:[], lists:{}, others:[]};
            var objectList = organizer.filter(parentItems, parentFilterFacets);
            if (a4p.isUndefined(facetValue)) {
                filterFacet.items = objectList.others;
            } else {
                filterFacet.items = objectList.lists[facetValue];
            }
            if (a4p.isUndefined(filterFacet.items)) {
                filterFacet.items = [];
            }
        } else {
            // Unknown facet
            for (var i = 0, nb = parentItems.length; i < nb; i++) {
                var item = parentItems[i];
                items.push(item);
            }
            filterFacet.items = items;
        }
    };

    /**
     * Apply active facet on parent objects list
     */
    Service.prototype.applyFacet = function (definedOrganizers, parentItems, parentFilterFacets, facetKey) {
        var objectList = {keyes: [], lists: {}, others: []};
        var organizer = definedOrganizers[facetKey];
        if (a4p.isDefined(organizer.filter)) {
            objectList = organizer.filter(parentItems, parentFilterFacets);
        } else {
            // Unknown facet
            for (var i = 0, nb = parentItems.length; i < nb; i++) {
                addOther(objectList, parentItems[i]);
            }
        }
        return objectList;
    };

    Service.prototype.sortKeyes = function (keyList, ascendingOrder, caseSensitive) {
        if (caseSensitive) {
            if (ascendingOrder) {
                keyList.sort(function (a, b) {
                    return strCompare(a.prefix + a.title, b.prefix + b.title);
                });
            } else {
                keyList.sort(function (a, b) {
                    return strCompare(b.prefix + b.title, a.prefix + a.title);
                });
            }
        } else {
            if (ascendingOrder) {
                keyList.sort(function (a, b) {
                    return strCompare((a.prefix + a.title).toLowerCase(), (b.prefix + b.title).toLowerCase());
                });
            } else {
                keyList.sort(function (a, b) {
                    return strCompare((b.prefix + b.title).toLowerCase(), (a.prefix + a.title).toLowerCase());
                });
            }
        }
    };

    Service.prototype.sortItems = function (itemList, ascendingOrder, caseSensitive) {
        var self = this;
        if (caseSensitive) {
            if (ascendingOrder) {
                itemList.sort(function (a, b) {
                    var nameA = self.srvConfig.getItemName(a.object);
                    var nameB = self.srvConfig.getItemName(b.object);
                    return strCompare(nameA, nameB);
                });
            } else {
                itemList.sort(function (a, b) {
                    var nameA = self.srvConfig.getItemName(a.object);
                    var nameB = self.srvConfig.getItemName(b.object);
                    return strCompare(nameB, nameA);
                });
            }
        } else {
            if (ascendingOrder) {
                itemList.sort(function (a, b) {
                    var nameA = self.srvConfig.getItemName(a.object).toLowerCase();
                    var nameB = self.srvConfig.getItemName(b.object).toLowerCase();
                    return strCompare(nameA, nameB);
                });
            } else {
                itemList.sort(function (a, b) {
                    var nameA = self.srvConfig.getItemName(a.object).toLowerCase();
                    var nameB = self.srvConfig.getItemName(b.object).toLowerCase();
                    return strCompare(nameB, nameA);
                });
            }
        }
    };

    Service.prototype.queryFilter = function (itemList, query, caseSensitive) {
        query = query || '';
        var words = query.split(/\s/);
        var filteredList = [];
        for (var j = 0; j < itemList.length; j++) {
            var item = itemList[j];
            // Filter on words in query
            var acceptItem = true;// AND condition on words
            for (var i = 0; i < words.length; i++) {
                var word = words[i];
                if (!caseSensitive) {
                    word = word.toLowerCase();
                }
                var acceptWord = false;// OR condition on item attributes
                for (var k in item.object) {
                    if (!item.object.hasOwnProperty(k)) continue;
                    var attr = item.object[k];
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
    };

    return Service;
})();
