'use strict';

function ctrlDetailedObject($scope, srvLocale, srvData, srvNav, srvLink, srvConfig, srvAnalytics) {

    // TODO : listen to srvLocale to update fields if language updated
    // TODO : listen to srvData to update fields if item updated
    // TODO : listen to srvData to update fields if link target objects updated

    // Do NOT initialize $scope.item otherwise IT is used (instead of parent) in HTML code ng-init="set(item)"
    //$scope.item = null;

    /**********************************************************
     *
     * 				SCOPE VARIABLES INITIALIZATION START
     *
     *********************************************************/
    $scope.srvLocale = srvLocale;
    $scope.linkedItems = {};

    /**********************************************************
     *
     * 				SCOPE VARIABLES INITIALIZATION END
     *
     *********************************************************/




    /**********************************************************
     *
     * 				PAGE LIFECYCLE START
     *
     *********************************************************/
    $scope.init = function (item) {
    	// TODO : Specific case not yet parameterized in c4p.Model.displayResumedObjectGroups

        $scope.item = item;
        $scope.itemIcon = c4p.Model.getItemIcon(item);
        $scope.itemColor = c4p.Model.getItemColor(item);
        $scope.itemName = srvConfig.getItemName(item);
        $scope.isFile = !!c4p.Model.files[item.a4p_type];
        $scope.isVideo = $scope.isVideoFormatSupported();
        $scope.linkedItems = {};
        $scope.cards = [];
        $scope.allDayEvent = false;
        $scope.manyDayEvent = false;

        var objDesc = c4p.Model.a4p_types[$scope.item.a4p_type];	// Item category
        var editDesc = objDesc.editObjectFields;					// Item 'Edit object' structure
        var cards = objDesc.displayDetailedObjectCards;				// Item 'Display object' structure

        // Check if item is all day event (case item == event)
        if ($scope.item['date_start'] && $scope.item['date_end']) {
            var startDate = srvLocale.formatDate($scope.item['date_start'], 'shortDate');
            var endDate = srvLocale.formatDate($scope.item['date_end'], 'shortDate');
            if (startDate != endDate) {
                $scope.manyDayEvent = true;
                $scope.allDayEvent = true;
            } else if ($scope.item['duration_hours'] > 23) {
                $scope.allDayEvent = true;
            }
        }

        if (a4p.isDefined(editDesc) && a4p.isDefined(cards)) {
        	// Loop on all cards. Cards define the display structure
            for (var cardIdx = 0, cardNb = cards.length; cardIdx < cardNb; cardIdx++) {
            	// Retrieve a card structure
                var cardDesc = cards[cardIdx];

                var cardShow = false;

                var card = {
                    type:cardDesc.type,					// Deprecated: type used for 'well' classes
                    brSeparated:cardDesc.brSeparated,	// Tells whether the card must be followed by a <br/>
                    groups:[]							// Fields display structure
                };

                // Retrieve fields display structures for retrieved card
                var groups = cardDesc.groups;

                if (a4p.isDefined(groups)) {
                	// Loop on card groups
                    for (var groupIdx = 0, groupNb = groups.length; groupIdx < groupNb; groupIdx++) {
                    	// Fields display structure
                        var groupDesc = groups[groupIdx];

                        // Display group if at least icon, name or synchro is defined and true
                        var groupShow = (!!groupDesc.icon && (groupDesc.icon.length > 0)) || !!groupDesc.name || !!groupDesc.synchro;

                        var group = {
                            synchro:!!groupDesc.synchro,	// Is the group currently synchronizing with CRM ?
                            icon: !!groupDesc.icon ? groupDesc.icon : '', // Icon name for group icon display
                            name:!!groupDesc.name,			// Boolean for group name display
                            title:groupDesc.title?srvLocale.translations[groupDesc.title]:'', // Field label
                            size:groupDesc.size,			// Font size
                            fields:[]
                        };

                        // Loop on group fields
                        for (var fieldIdx = 0, fieldNb = groupDesc.fields.length; fieldIdx < fieldNb; fieldIdx++) {

                        	var fieldType = '';
                            var value = '';
                            var fieldTitle = '';

                        	// Retrieve field display structure
                            var fieldDesc = groupDesc.fields[fieldIdx];

                            // Item key for value access
                            var fieldKey = fieldDesc.key;

                            // Item value, can be an array of technical ids
                            var fieldValue = $scope.item[fieldKey];

                            // Is the field a foreign key to other objects ? (example: owner_id, created_by_id...)
                            var isLink = objDesc.linkDescs[fieldKey];

                            // Is the field an array of subfields ?
                            var isArray = a4p.isDefined(c4p.Model.objectArrays[$scope.item.a4p_type][fieldKey]);

                            // Beware : editDesc[fieldKey] does not exists for link attributes
                            if (isLink) {
                            	// Get field label
                                fieldTitle = srvLocale.translations.htmlShortLinkName[objDesc.linkDescs[fieldKey].one];

                                // Get field type
                                fieldType = '';// TODO : 'link';

                                var targetItem;

                                // Case field is an array of technical ids
                                if (isArray) {
                                    value = [];

                                    // Loop on all technical ids
                                    for (var valueIdx = 0, valueNb = fieldValue.length; valueIdx < valueNb; valueIdx++) {
                                    	// Retrieve object associated to id
                                        targetItem = srvData.getObject(fieldValue[valueIdx].dbid);

                                        // If defined store its value for display
                                        // And listen to srvData to update fields if link target objects updated
                                        if (targetItem) {
                                            $scope.linkedItems[targetItem.id.dbid] = targetItem;
                                            value.push(srvConfig.getItemName(targetItem));
                                        }
                                    }
                                // Case field is a single technical id
                                } else {
                                	// Retrieve object associated to id
                                    targetItem = srvData.getObject(fieldValue.dbid);

                                    // If defined store its value for display
                                    // And listen to srvData to update fields if link target objects updated
                                    if (targetItem) {
                                        $scope.linkedItems[targetItem.id.dbid] = targetItem;
                                        value = srvConfig.getItemName(targetItem);
                                    }
                                }
                            // Case field has a defined structure
                            } else if (a4p.isDefined(editDesc[fieldKey])) {
                            	// Get field type
                                if (a4p.isDefined(editDesc[fieldKey].type) || a4p.isDefined(fieldDesc.type)) {
                                    fieldType = fieldDesc.type ? fieldDesc.type : editDesc[fieldKey].type;
                                }

                                // Get field label
                                if (a4p.isDefined(editDesc[fieldKey].title)) {
                                    fieldTitle = srvLocale.translations[editDesc[fieldKey].title];
                                }

                                // Process field value
                                if (fieldType == 'duration') {
                                    // TODO : Specific case not yet parameterized in c4p.Model.displayDetailedObjectGroups

                                    // All day event
                                    if ($scope.allDayEvent) {
                                        fieldType = 'datetime';
                                        value = fieldValue;
                                    // Change value to display duration instead of end date
                                    } else {
                                        fieldType = '';
                                        value = $scope.item['duration_hours'] + ":" + a4pPadNumber($scope.item['duration_minutes'], 2);
                                    }
                                } else if (fieldType == 'samedayTIME') {
                                    if ($scope.manyDayEvent) {
                                        fieldType = 'dateTIME';
                                        value = fieldValue;
                                    } else {
                                        fieldType = 'TIME';
                                        value = fieldValue;
                                    }
                                } else {
                                    value = fieldValue;
                                }
                            // Calculated field or not editable field
                            } else if (a4p.isDefined(fieldValue)) {
                                value = fieldValue;
                            } else {
                                // Link name not found directly as attribute => use srvLink
                                fieldTitle = srvLocale.translations.htmlShortLinkName[fieldKey];
                                fieldType = '';// TODO : 'link';
                                isArray = true;
                                value = [];
                                fieldValue = srvData.getRemoteLinks($scope.item, fieldKey);
                                for (var valueIdx = 0, valueNb = fieldValue.length; valueIdx < valueNb; valueIdx++) {
                                    targetItem = fieldValue[valueIdx];
                                    if (targetItem) {
                                        // listen to srvData to update fields if link target objects updated
                                        $scope.linkedItems[targetItem.id.dbid] = targetItem;
                                        value.push(srvConfig.getItemName(targetItem));
                                    }
                                }
                            }

                            // Field final display structure
                            var field = {
                                key:fieldKey,								// Field technical key
                                title:fieldDesc.title ? fieldTitle : '',	// Field label
                                type:fieldType,								// Field type
                                isArray:isArray,							// Field is sub group of other fields
                                value:value,								// Field value, can be an array of values
                                prefix:fieldDesc.prefix?srvLocale.translations[fieldDesc.prefix]:'',	// Localized string before field
                                suffix:fieldDesc.suffix?srvLocale.translations[fieldDesc.suffix]:'',	// Localized string after field
                                size:fieldDesc.size,						// CSS class to apply for font size
                                separator:fieldDesc.separator || ''			// String between this and next field
                            };

                            // If value is defined and not blank
                            if (!!value) {
                                groupShow = true;			// Display fields group
                                group.fields.push(field);	// Push into array for display
                            }
                        }

                        // Show group if at least 1 field is to be displayed
                        if (groupShow) {
                            cardShow = true;			// Display groups card
                            card.groups.push(group);	// Push into array for display
                        // Title alone does not show group, but it will be shown if other fields are shown
                        } else if (group.title) {
                            card.groups.push(group);
                        }
                    }
                }

                // Show card if at  least 1 group is to be displayed
                if (cardShow) {
                    $scope.cards.push(card); 	// Push into array for display
                }
            }
        }

        if(a4p.isTrueOrNonEmpty(item.a4p_type)) {
            //GA: user really interact with navigation, he views object
            srvAnalytics.add('Once', 'View '+item.a4p_type);
        }
   	};

    /**********************************************************
     *
     * 				PAGE LIFECYCLE END
     *
     *********************************************************/




    /**********************************************************
     *
     * 				METHODS START
     *
     *********************************************************/
    $scope.clear = function () {
        $scope.item = null;
        $scope.itemIcon = '';
        $scope.itemName = '';
        $scope.isFile = false;
        $scope.isVideo = false;
        $scope.allDayEvent = false;
        $scope.manyDayEvent = false;
        $scope.cards = [];
        $scope.linkedItems = {};
    };

    $scope.isVideoFormatSupported = function() {
        // TODO: Update for Windows 8
        if($scope.isFile && c4p.Model.isVideo($scope.item.extension)) {
             if(a4p.BrowserCapabilities.isIDevice) {
                if($scope.item.extension == 'mp4') {
                    return true;
                }
            } else { // Works with Android and Chrome
                 if(($scope.item.extension == 'mp4') || ($scope.item.extension == 'ogv') || ($scope.item.extension == 'webm')) {
                     return true;
                 }
             }
        }
        return false;
    };

    /**********************************************************
     *
     * 				METHODS END
     *
     *********************************************************/




    /**********************************************************
     *
     * 				LISTENERS START
     *
     *********************************************************/
    $scope.dataListener = srvData.addListenerOnUpdate(function (callbackId, action, type, id) {
        if (action == 'clear') {
            a4p.safeApply($scope, function() {
                $scope.clear();
            });
        } else if (action == 'remove') {
            if ($scope.item && $scope.item.id.dbid == id) {
                a4p.safeApply($scope, function() {
                    $scope.clear();
                });
            } else if ($scope.linkedItems[id]) {
                a4p.safeApply($scope, function() {
                    $scope.init(srvNav.item);
                });
            }
        } else if (action == 'set') {
            var object = srvData.getObject(id);
            if ($scope.item && (($scope.item.id.dbid == id) || $scope.linkedItems[id] || (object && srvData.hasAnyLinkTo($scope.item, object)))) {
                a4p.safeApply($scope, function() {
                    $scope.init(srvNav.item);
                });
            }
        } else if (action == 'add') {
            var object = srvData.getObject(id);
            if ($scope.item && object && srvData.hasAnyLinkTo($scope.item, object)) {
                a4p.safeApply($scope, function() {
                    $scope.init(srvNav.item);
                });
            }
        }
    });

    $scope.navListener = srvNav.addListenerOnUpdate(function (callbackId, action, page, slide, id) {
        if (action == 'clear') {
            a4p.safeApply($scope, function() {
                $scope.clear();
            });
        } else if (action == 'goto') {
            if (srvNav.item) {
                a4p.safeApply($scope, function() {
                    $scope.init(srvNav.item);
                });
            } else {
                a4p.safeApply($scope, function() {
                    $scope.clear();
                });
            }
        }
    });

    $scope.$on('$destroy', function (event) {
        srvNav.cancelListener($scope.navListener);
        srvData.cancelListener($scope.dataListener);
    });

    /**********************************************************
     *
     * 				LISTENERS END
     *
     *********************************************************/




    /**
     * Initialization
     */
    if (srvNav.item) {
        $scope.init(srvNav.item);
    } else {
        $scope.clear();
    }
}

ctrlDetailedObject.$inject = ['$scope', 'srvLocale', 'srvData', 'srvNav', 'srvLink', 'srvConfig', 'srvAnalytics'];
