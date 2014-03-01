'use strict';

function ctrlResumedObject($scope, srvLocale, srvData, srvLink, srvConfig) {

    // TODO : listen to srvLocale to update fields if language updated
    // TODO : listen to srvData to update fields if item updated
    // TODO : listen to srvData to update fields if link target objects updated

    $scope.srvLocale = srvLocale;
    // Do NOT initialize $scope.item otherwise IT is used (instead of parent) in HTML code ng-init="set(item)"
    //$scope.item = null;

    $scope.linkedItems = {};
    $scope.dataListener = srvData.addListenerOnUpdate(function (callbackId, action, type, id) {
        if (action == 'clear') {
            a4p.safeApply($scope, function() {
                $scope.clear();
            });
        } else if (action == 'remove') {
            if ($scope.item) {
                if ($scope.item.id.dbid == id) {
                    a4p.safeApply($scope, function() {
                        $scope.clear();
                    });
                } else if ($scope.linkedItems[id]) {
                    a4p.safeApply($scope, function() {
                        $scope.init($scope.item);
                    });
                }
            }
        } else if (action == 'set') {
            if ($scope.item) {
                if (($scope.item.id.dbid == id) || $scope.linkedItems[id]) {
                    a4p.safeApply($scope, function() {
                        $scope.init($scope.item);
                    });
                }
            }
        } else if (action == 'add') {
            // TODO : take into account if the new object is linked to $scope.item
            if ($scope.item) {
                a4p.safeApply($scope, function() {
                    $scope.init($scope.item);
                });
            }
        }
    });

    $scope.$on('$destroy', function (event) {
        srvData.cancelListener($scope.dataListener);
    });

    $scope.set = function (item, modelType) {
        if (item) {
            $scope.init(item, modelType);
        } else {
            $scope.clear();
        }
    };

    $scope.clear = function () {
        $scope.item = null;
        $scope.itemIcon = '';
        $scope.itemName = '';
        $scope.isFile = false;
        $scope.allDayEvent = false;
        $scope.groups = [];
        $scope.linkedItems = {};
    };

    $scope.init = function (item, modelType) {
        $scope.item = item;
        $scope.itemIcon = c4p.Model.getItemIcon(item);
        $scope.itemName = srvConfig.getItemName(item);
        $scope.isFile = !!c4p.Model.files[item.a4p_type];
        $scope.linkedItems = {};

        // fieldset
        $scope.allDayEvent = false;
        // TODO : Specific case not yet parameterized in c4p.Model.displayResumedObjectGroups
        if ($scope.item['date_start'] && $scope.item['date_end']) {
            var startDate = srvLocale.formatDate($scope.item['date_start'], 'shortDate');
            var endDate = srvLocale.formatDate($scope.item['date_end'], 'shortDate');
            if ((startDate != endDate) || ($scope.item['duration_hours'] > 23)) {
                // All day event
                $scope.allDayEvent = true;
            }
        }


        $scope.groups = [];
        var objDesc = c4p.Model.a4p_types[$scope.item.a4p_type];
        var editDesc = objDesc.editObjectFields;
        var groups = objDesc[modelType];
        if (a4p.isDefined(editDesc) && a4p.isDefined(groups)) {
            for (var groupIdx = 0, groupNb = groups.length; groupIdx < groupNb; groupIdx++) {
                var groupDesc = groups[groupIdx];
                var groupShow = !!groupDesc.icon || !!groupDesc.name || !!groupDesc.synchro;
                var group = {
                    key:groupDesc.key,
                    synchro:!!groupDesc.synchro,
                    icon:!!groupDesc.icon,
                    name:!!groupDesc.name,
                    title:groupDesc.title?srvLocale.translations[groupDesc.title]:'',
                    size:groupDesc.size,
                    type:groupDesc.type,
                    brSeparated:groupDesc.brSeparated,
                    fields:[]
                };
                for (var fieldIdx = 0, fieldNb = groupDesc.fields.length; fieldIdx < fieldNb; fieldIdx++) {
                    var fieldDesc = groupDesc.fields[fieldIdx];
                    var fieldKey = fieldDesc.key;
                    var fieldTitle = '';
                    var isLink = objDesc.linkDescs[fieldKey];
                    var isArray = a4p.isDefined(c4p.Model.objectArrays[$scope.item.a4p_type][fieldKey]);
                    // Beware : editDesc[fieldKey] does not exists for link attributes
                    var fieldType = '';
                    var fieldValue = $scope.item[fieldKey];
                    var value = '';
                    if (isLink) {
                        fieldTitle = srvLocale.translations.htmlShortLinkName[objDesc.linkDescs[fieldKey].one];
                        fieldType = '';// TODO : 'link';
                        var targetItem;
                        if (isArray) {
                            value = [];
                            for (var valueIdx = 0, valueNb = fieldValue.length; valueIdx < valueNb; valueIdx++) {
                                targetItem = srvData.getObject(fieldValue[valueIdx].dbid);
                                if (targetItem) {
                                    // listen to srvData to update fields if link target objects updated
                                    $scope.linkedItems[targetItem.id.dbid] = targetItem;
                                    value.push(srvConfig.getItemName(targetItem));
                                }
                            }
                        } else {
                            targetItem = srvData.getObject(fieldValue.dbid);
                            if (targetItem) {
                                // listen to srvData to update fields if link target objects updated
                                $scope.linkedItems[targetItem.id.dbid] = targetItem;
                                value = srvConfig.getItemName(targetItem);
                            }
                        }
                    } else if (a4p.isDefined(editDesc[fieldKey])) {
                        if (a4p.isDefined(editDesc[fieldKey]) && editDesc[fieldKey].type) {
                            fieldType = fieldDesc.type ? fieldDesc.type : editDesc[fieldKey].type;
                        }
                        if (a4p.isDefined(editDesc[fieldKey]) && editDesc[fieldKey].title) {
                            fieldTitle = srvLocale.translations[editDesc[fieldKey].title];
                        }
                        if (fieldType == 'duration') {
                            // TODO : Specific case not yet parameterized in c4p.Model.displayResumedObjectGroups
                            if ($scope.allDayEvent) {
                                // All day event
                                fieldType = 'datetime';
                                value = fieldValue;
                            } else {
                                fieldType = '';
                                value = $scope.item['duration_hours'] + ":" + a4pPadNumber($scope.item['duration_minutes'], 2);
                            }
                        } else {
                            value = fieldValue;
                        }
                    } else if (a4p.isDefined(fieldValue)) {
                        // Calculated field or not editable field
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
                    var field = {
                        key:fieldKey,
                        title:fieldDesc.title ? fieldTitle : '',
                        type:fieldType,
                        isArray:isArray,
                        value:value,
                        prefix:fieldDesc.prefix?srvLocale.translations[fieldDesc.prefix]:'',
                        suffix:fieldDesc.suffix?srvLocale.translations[fieldDesc.suffix]:'',
                        size:fieldDesc.size
                    };
                    if (!!value) {
                        groupShow = true;
                        group.fields.push(field);
                    }
                }
                if (groupShow) {
                    $scope.groups.push(group);
                }
            }
        }
   	};
}
ctrlResumedObject.$inject = ['$scope', 'srvLocale', 'srvData', 'srvLink', 'srvConfig'];



