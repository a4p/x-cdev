'use strict';

function ctrlEditObject($scope, srvData, srvLocale, srvConfig, openDialogFct, $dialog) {

    /**
     * Constants
     */
    $scope.srvData = srvData;
    $scope.srvLocale = srvLocale;
    $scope.srvConfig = srvConfig;
    $scope.openDialogFct = openDialogFct;
    $scope.object = null;
    $scope.realObject = null;
    $scope.objectName =  '';
    $scope.objectIcon = '';
    $scope.objectGroups = [];
    $scope.objectTypeLocale = '';
    $scope.objectValidated = false;

    $scope.removeEnabled = false;

    $scope.objectGroup = null;
    $scope.objectGroupFilter = null; // used to filter edition group

    $scope.hasOpenImportContactDialog = false;
    $scope.hasOpenImportAccountDialog = false;
    $scope.hasOpenImportEventDialog = false;


    // Change event
    $scope.objectLastChange = new Date();

    $scope.scrollsense = null;


    /**
     * Functions
     */

    $scope.init = function(object) {
        $scope.object = angular.copy(object);
        $scope.hasOpenImportContactDialog = (($scope.object.a4p_type == 'Contact') && navigator && navigator.contacts);
        $scope.hasOpenImportAccountDialog = (($scope.object.a4p_type == 'Account') && navigator && navigator.contacts);
        $scope.hasOpenImportEventDialog = (($scope.object.a4p_type == 'Event') && typeof calendarPlugin != 'undefined');
        // Prohibit removing an object which you do not own (ex: Group Event)
        $scope.realObject = object;
        $scope.removeEnabled = a4p.isDefined(object.id) && a4p.isDefined(srvData.getObject(object.id.dbid)) && srvData.isObjectOwnedByUser(object) && (object.id.dbid != srvData.userId.dbid);
        $scope.objectName = srvConfig.getItemName(object);
        $scope.objectIcon = c4p.Model.getItemIcon(object);
        $scope.objectTypeLocale = object.a4p_type;
        initFields($scope);
        $scope.setLastChange();
    };

    $scope.getTypeColor = function (type){
        return c4p.Model.getTypeColor(type);
    };

    // Button cancel
    $scope.close = function () {
        $scope.setEditMode(false);
    };

    // Button clear
    $scope.clear = function () {
        $scope.objectName = '';
        $scope.object = angular.copy($scope.realObject);

        $scope.objectName = srvConfig.getItemName($scope.object);

        initFields($scope);

        //MLE Change event
        $scope.setLastChange();
    };

    // Button submit
    $scope.submit = function () {
        if ($scope.objectValidated) {
            for (var objectGroupIdx = 0; objectGroupIdx < $scope.objectGroups.length; objectGroupIdx++) {
                var objectGroup = $scope.objectGroups[objectGroupIdx];
                for (var objectFieldIdx = 0; objectFieldIdx < objectGroup.groupFields.length; objectFieldIdx++) {
                    var objectField = objectGroup.groupFields[objectFieldIdx];
                    $scope.realObject[objectField.key] = $scope.object[objectField.key];
                }
            }
            if (a4p.isDefined($scope.realObject)) {
                a4p.safeApply($scope, function() {
                    srvData.setAndSaveObject($scope.realObject);
                    //$scope.setItemAndGoDetail(result);
                });
            }
            $scope.close();
        }
        else {
            // Goto first erroneous field and update all groups error
            var globalWarn = '';
            var warnList = [];
            for (var objectGroupIdx = 0; objectGroupIdx < $scope.objectGroups.length; objectGroupIdx++) {
                var objectGroup = $scope.objectGroups[objectGroupIdx];
                var groupWarn = '';
                for (var objectFieldIdx = 0; objectFieldIdx < objectGroup.groupFields.length; objectFieldIdx++) {
                    var objectField = objectGroup.groupFields[objectFieldIdx];
                    if (objectField.warn != '') {
                        warnList.push(objectField.title + ' : ' + objectField.warn);
                        if (groupWarn.length == 0) {
                            groupWarn = objectField.warn;
                        }
                        if (globalWarn.length == 0) {
                            globalWarn = objectField.warn;
                            $scope.setSenseScrollerPageY(objectGroupIdx);
                        }
                    }
                }
                objectGroup.warn = groupWarn;
            }
	        //MLE Change event
	        $scope.setLastChange();
            $scope.openDialogFct({
                backdropClick: true,
                dialogClass: 'modal c4p-modal-small c4p-modal-confirm',
                backdropClass: 'modal-backdrop c4p-modal-small',
                controller: 'ctrlDialogConfirm',
                templateUrl: 'partials/dialog/message.html',
                resolve: {
                    text: function () {
                        return srvLocale.translations.htmlMsgObjectInvalid;
                    },
                    textArray: function () {
                        return warnList;
                    },
                    srvLocale: function () {
                        return srvLocale;
                    }
                }
            }, function () {});
        }
    };


    // Button Remove
    $scope.remove = function () {

    	$scope.confirmRemove();

    };



    //open dialog contacts
    $scope.confirmRemove = function () {

    	var text = $scope.srvLocale.translations.htmlTextConfirmDelete;
    	var array = [$scope.objectName];

        openDialog(
            {
                backdropClick: false,
                dialogClass: 'modal c4p-modal-small c4p-modal-confirm',
                backdropClass: 'modal-backdrop c4p-modal-small',
                controller: 'ctrlDialogConfirm',
                templateUrl: 'partials/dialog/confirm.html',
                resolve: {
                    text: function () {
                        return text;
                    },
                    textArray: function () {
                        return array;
                    },
                    srvLocale: function () {
                        return $scope.srvLocale;
                    }
                }
            },
            function (result) {
                if (result) {
                    //$scope.srvData.removeObject(objectItem.id.dbid, false);
                    $scope.srvData.removeAndSaveObject($scope.object);
                    $scope.setEditMode(false);
                    $scope.gotoBack(0);
                }
            });
    };

    /**
     * Events catch
     */
    $scope.onFieldChanged = function (field) {
        var validationHasChanged = false;
        calculateFields($scope, field);
        if (a4p.isDefined(c4p.Model.a4p_types[$scope.object.a4p_type].editObjectFields)) {
            var editObjectFields = c4p.Model.a4p_types[$scope.object.a4p_type].editObjectFields;
            if (a4p.isDefined(editObjectFields[field.key])) {
                var editObjectField = editObjectFields[field.key];
                // Validate some fields
                if (a4p.isDefined(editObjectField.validations)) {
                    $scope.objectValidated = isObjectValidatedByOtherFields($scope, field.key);
                    var message = warningForThisField($scope, field.key);
                    if (message != null) {
                    	if (field.warn != message) validationHasChanged = true;
                        field.warn = message;
                        $scope.objectValidated = false;
                    }
                    else {
                    	if (field.warn != '') validationHasChanged = true;
                    	field.warn = '';
                    }
                }
            }
        }

        if (validationHasChanged) {
            // Update all groups error
            for (var objectGroupIdx = 0; objectGroupIdx < $scope.objectGroups.length; objectGroupIdx++) {
                var objectGroup = $scope.objectGroups[objectGroupIdx];
                var groupWarn = '';
                for (var objectFieldIdx = 0; objectFieldIdx < objectGroup.groupFields.length; objectFieldIdx++) {
                    var objectField = objectGroup.groupFields[objectFieldIdx];
                    if (objectField.warn != '') {
                        if (groupWarn.length == 0) {
                            groupWarn = objectField.warn;
                        }
                    }
                }
                objectGroup.warn = groupWarn;
            }
            //MLE change iScroll
            $scope.setLastChange();
        }

    };

    $scope.setLastChange = function() {
        //MLE Change event
    	$scope.objectLastChange = new Date();
    };

    function initFields(scope) {
        scope.objectValidated = true;
        scope.objectGroups = [];
        var objDesc = c4p.Model.a4p_types[$scope.object.a4p_type];
        var groups;
        if (a4p.isDefined(objDesc.editObjectGroups)) {
            groups = objDesc.editObjectGroups;
        } else {
            var fields = [];
            for (var i = 0; i < objDesc.fields.length; i++) {
                var key = objDesc.fields[i];
                if (a4p.isDefined(objDesc.editObjectFields)
                    && a4p.isDefined(objDesc.editObjectFields[key])) {
                    fields.push(key);
                }
            }
            groups = [
                {
                    key:'description',
                    title: 'htmlFieldsetDescription',
                    fields: fields
                }
            ];
        }

        for (var groupIdx = 0; groupIdx < groups.length; groupIdx++) {
            var groupDesc = groups[groupIdx];
            var groupWarn = '';
            var groupSet = [];
            for (var fieldIdx = 0; fieldIdx < groupDesc.fields.length; fieldIdx++) {
                var key = groupDesc.fields[fieldIdx];
                if (a4p.isDefined(c4p.Model.a4p_types[$scope.object.a4p_type].editObjectFields)
                    && a4p.isDefined(c4p.Model.a4p_types[$scope.object.a4p_type].editObjectFields[key])) {
                    var editObjectField = c4p.Model.a4p_types[$scope.object.a4p_type].editObjectFields[key];
                    var warn = '';
                    if (a4p.isDefined(editObjectField.validations)) {
                        var message = warningForThisField(scope, key);
                        if (message != null) {
                            warn = message;
                            if (groupWarn.length == 0) {
                                groupWarn = message;
                            }
                            scope.objectValidated = false;
                        }
                    }
                    if (a4p.isDefined(scope.srvLocale.translations[editObjectField.title])) {
                        groupSet.push({
                            title: scope.srvLocale.translations[editObjectField.title],
                            type: editObjectField.type,
                            warn: warn,
                            key: key
                        });
                    } else {
                        groupSet.push({
                            title: key,
                            type: editObjectField.type,
                            warn: warn,
                            key: key
                        });
                    }
                }
            }
            // add field group
            var group = {
                title: scope.srvLocale.translations[groupDesc.title],
                warn: groupWarn,
                groupFields: groupSet
            };
            if (groupIdx == 0) scope.toggleObjectGroupFilter(group); // set first group
            scope.objectGroups.push(group);
        }
        // Check values
        for (var objectGroupIdx = 0; objectGroupIdx < scope.objectGroups.length; objectGroupIdx++) {
            var objectGroup = scope.objectGroups[objectGroupIdx];
            for (var objectFieldIdx = 0; objectFieldIdx < objectGroup.groupFields.length; objectFieldIdx++) {
                var objectField = objectGroup.groupFields[objectFieldIdx];
                scope.onFieldChanged(objectField);
            }
        }
    }

    function calculateFields(scope, changedField) {
        if (a4p.isDefined(c4p.Model.a4p_types[$scope.object.a4p_type].editObjectFields)) {
            var editObjectFields = c4p.Model.a4p_types[$scope.object.a4p_type].editObjectFields;
            if (a4p.isDefined(editObjectFields[changedField.key])) {
                var editObjectField = editObjectFields[changedField.key];
                // Update some dependant fields
                if (a4p.isDefined(editObjectField.calculations)) {
                    for (var calculationIdx = 0; calculationIdx < editObjectField.calculations.length; calculationIdx++) {
                        var calculation = editObjectField.calculations[calculationIdx];
                        var values = [];
                        for (var j = 0, len2 = calculation.fromFields.length; j < len2; j++) {
                            values.push(scope.object[calculation.fromFields[j]]);
                        }
                        scope.object[calculation.toField] = c4p.Model[calculation.getter].apply(c4p.Model, values);
                        a4p.InternalLog.log('ctrlEditObject', 'onFieldChanged : calculate ' + calculation.toField + '=' + scope.object[calculation.toField]);
                    }
                }
            }
        }
    }

    function isObjectValidatedByOtherFields(scope, skippedFieldName) {
        for (var objectGroupIdx = 0; objectGroupIdx < scope.objectGroups.length; objectGroupIdx++) {
            var objectGroup = scope.objectGroups[objectGroupIdx];
            for (var objectFieldIdx = 0; objectFieldIdx < objectGroup.groupFields.length; objectFieldIdx++) {
                var objectField = objectGroup.groupFields[objectFieldIdx];
                if ((objectField.key != skippedFieldName) && (objectField.warn != '')) {
                    return false;
                }
            }
        }
        return true;
    }

    function warningForThisField(scope, thisFieldName) {
        if (a4p.isDefined(c4p.Model.a4p_types[$scope.object.a4p_type].editObjectFields)) {
            var editObjectFields = c4p.Model.a4p_types[$scope.object.a4p_type].editObjectFields;
            if (a4p.isDefined(editObjectFields[thisFieldName])) {
                var editObjectField = editObjectFields[thisFieldName];
                if (a4p.isDefined(editObjectField.validations)) {
                    for (var validationIdx = 0; validationIdx < editObjectField.validations.length; validationIdx++) {
                        var validation = editObjectField.validations[validationIdx];
                        var valid = c4p.Model.validateObject.apply(c4p.Model, [scope.object, validation.expr]);
                        //var valid = scope.$eval(validation.expr);
                        if (!valid) {
                            return c4p.Model.getErrorMsg.apply(c4p.Model, [scope, validation.errorKey]);
                        }
                    }
                }
            }
        }
        return null;
    }

    $scope.toggleObjectGroupFilter = function(group){
        if (!group) return;
        $scope.objectGroupFilter = group;
        //MLE Change event
        $scope.setLastChange();
    };


    $scope.openImportContactDialog = function() {
        var possibleContacts = [];
        if (navigator && navigator.contacts) {
            var onContactsSuccess = function(contacts) {
                a4p.safeApply($scope, function() {
                    $scope.stopSpinner();
                    var nbNewContact = 0;
                    for (var i = 0, nb = contacts.length; i < nb; i++) {
                        var contact = contacts[i];
                        a4p.InternalLog.log('ctrlEditObject', 'analyze a contact from IOS : ' + a4pDumpData(contact, 3));
                        var possibleContact = {
                            salutation: contact.name.honorificPrefix || '',
                            first_name: contact.name.givenName,
                            last_name: contact.name.familyName,
                            birthday: contact.birthday,
                            description: contact.note || ''
                        };
                        var j, max;
                        if (contact.phoneNumbers) {
                            for (j = 0, max = contact.phoneNumbers.length; j < max; j++) {
                                if (contact.phoneNumbers[j].type == 'home') {
                                    if (!possibleContact.phone_house) possibleContact.phone_house = contact.phoneNumbers[j].value;
                                } else if (contact.phoneNumbers[j].type == 'work') {
                                    if (!possibleContact.phone_work) possibleContact.phone_work = contact.phoneNumbers[j].value;
                                } else if (contact.phoneNumbers[j].type == 'mobile') {
                                    if (!possibleContact.phone_mobile) possibleContact.phone_mobile = contact.phoneNumbers[j].value;
                                } else if (contact.phoneNumbers[j].type == 'fax') {
                                    if (!possibleContact.phone_fax) possibleContact.phone_fax = contact.phoneNumbers[j].value;
                                } else if (contact.phoneNumbers[j].type == 'pager') {
                                } else {
                                    if (!possibleContact.phone_other) possibleContact.phone_other = contact.phoneNumbers[j].value;
                                }
                            }
                        }
                        if (contact.emails) {
                            for (j = 0, max = contact.emails.length; j < max; j++) {
                                if (contact.emails[j].type == 'home') {
                                    if (!possibleContact.email_home) possibleContact.email_home = contact.emails[j].value;
                                } else if (contact.emails[j].type == 'work') {
                                    if (!possibleContact.email) possibleContact.email = contact.emails[j].value;
                                } else {
                                    if (!possibleContact.email_other) possibleContact.email_other = contact.emails[j].value;
                                }
                            }
                        }
                        if (contact.addresses) {
                            for (j = 0, max = contact.addresses.length; j < max; j++) {
                                if (!possibleContact.primary_address_city) {
                                    possibleContact.primary_address_street = contact.addresses[j].streetAddress;
                                    possibleContact.primary_address_city = contact.addresses[j].locality;
                                    possibleContact.primary_address_state = contact.addresses[j].region;
                                    possibleContact.primary_address_zipcode = contact.addresses[j].postalCode;
                                    possibleContact.primary_address_country = contact.addresses[j].country;
                                } else if (!possibleContact.alt_address_city) {
                                    possibleContact.alt_address_street = contact.addresses[j].streetAddress;
                                    possibleContact.alt_address_city = contact.addresses[j].locality;
                                    possibleContact.alt_address_state = contact.addresses[j].region;
                                    possibleContact.alt_address_zipcode = contact.addresses[j].postalCode;
                                    possibleContact.alt_address_country = contact.addresses[j].country;
                                }
                            }
                        }
                        if (contact.organizations) {
                            for (j = 0, max = contact.organizations.length; j < max; j++) {
                                // TODO : how to enable Account creation ?
                                // newAccount.type = contact.organizations[j].type;
                                // newAccount.company_name = contact.organizations[j].name;
                                if (!possibleContact.title) possibleContact.title = contact.organizations[j].title;
                                if (!possibleContact.department) possibleContact.department = contact.organizations[j].department;
                            }
                        }
                        possibleContacts.push(srvData.createObject('Contact', possibleContact));
                        nbNewContact++;
                    }
                    if (!nbNewContact) {
                        a4p.InternalLog.log('ctrlEditObject', 'NO Contact found in IOS');
                    } else {
                        var menus = [];
                        var addedOrganizers = [];
                        var dialogOptions = {
                            backdropClick: false,
                            dialogClass: 'modal c4p-modal-left c4p-modal-search c4p-dialog',
                            backdropClass: 'modal-backdrop c4p-modal-left'
                        };
                        var resolve = {
                            srvData: function () {
                                return srvData;
                            },
                            srvConfig: function () {
                                return srvConfig;
                            },
                            srvLocale: function () {
                                return srvLocale;
                            },
                            type: function () {
                                return 'Contact';
                            },
                            objects: function () {
                                //return possibleContacts.slice(0);// copy full array
                                return possibleContacts;
                            },
                            initFilter: function () {
                                return function (object) {
                                    return true
                                };
                            },
                            initSelector: function () {
                                return function (object) {
                                    return false
                                };
                            },
                            multiple: function () {
                                return false;
                            },
                            createFct: function () {
                                return null;
                            }
                        };
                        dialogOptions.controller = 'ctrlSelectDialog';
                        dialogOptions.templateUrl = 'partials/dialog/dialogSelectObjects.html';
                        resolve.suggestedMenus = function () {
                            return menus;
                        };
                        dialogOptions.resolve = resolve;
                        $scope.openDialogFct(dialogOptions, function (result) {
                            if (a4p.isDefined(result)) {
                                a4p.safeApply($scope, function () {
                                    $scope.clear();
                                    for (var i = 0; i < result.length; i++) {
                                        $scope.object.salutation = result[i].salutation;
                                        $scope.object.first_name = result[i].first_name;
                                        $scope.object.last_name = result[i].last_name;
                                        $scope.object.birthday = result[i].birthday;
                                        $scope.object.description = result[i].description;
                                        $scope.object.salutation = result[i].salutation;
                                        $scope.object.salutation = result[i].salutation;
                                        if (result[i].phone_house) $scope.object.phone_house = result[i].phone_house;
                                        if (result[i].phone_work) $scope.object.phone_work = result[i].phone_work;
                                        if (result[i].phone_mobile) $scope.object.phone_mobile = result[i].phone_mobile;
                                        if (result[i].phone_fax) $scope.object.phone_fax = result[i].phone_fax;
                                        if (result[i].phone_other) $scope.object.phone_other = result[i].phone_other;
                                        if (result[i].email_home) $scope.object.email_home = result[i].email_home;
                                        if (result[i].email) $scope.object.email = result[i].email;
                                        if (result[i].email_other) $scope.object.email_other = result[i].email_other;
                                        if (result[i].primary_address_city) {
                                            $scope.object.primary_address_street = result[i].primary_address_street;
                                            $scope.object.primary_address_city = result[i].primary_address_city;
                                            $scope.object.primary_address_state = result[i].primary_address_state;
                                            $scope.object.primary_address_zipcode = result[i].primary_address_zipcode;
                                            $scope.object.primary_address_country = result[i].primary_address_country;
                                        }
                                        if (result[i].alt_address_city) {
                                            $scope.object.alt_address_street = result[i].alt_address_street;
                                            $scope.object.alt_address_city = result[i].alt_address_city;
                                            $scope.object.alt_address_state = result[i].alt_address_state;
                                            $scope.object.alt_address_zipcode = result[i].alt_address_zipcode;
                                            $scope.object.alt_address_country = result[i].alt_address_country;
                                        }
                                        if (result[i].title) $scope.object.title = result[i].title;
                                        if (result[i].department) $scope.object.department = result[i].department;
                                        // Check values
                                        for (var objectGroupIdx = 0; objectGroupIdx < $scope.objectGroups.length; objectGroupIdx++) {
                                            var objectGroup = $scope.objectGroups[objectGroupIdx];
                                            for (var objectFieldIdx = 0; objectFieldIdx < objectGroup.groupFields.length; objectFieldIdx++) {
                                                var objectField = objectGroup.groupFields[objectFieldIdx];
                                                $scope.onFieldChanged(objectField);
                                            }
                                        }
                                        break; // Only first contact in result array
                                    }
                                });
                            }
                        });
                    }
                });
            };
            var onContactsFailure = function(contactError) {
                a4p.safeApply($scope, function() {
                    $scope.stopSpinner();
                    if (contactError.code == ContactError.UNKNOWN_ERROR) {
                        a4p.ErrorLog.log('ctrlEditObject', 'Device Contacts not imported from IOS : UNKNOWN_ERROR');
                    } else if (contactError.code == ContactError.INVALID_ARGUMENT_ERROR) {
                        a4p.ErrorLog.log('ctrlEditObject', 'Device Contacts not imported from IOS : INVALID_ARGUMENT_ERROR');
                    } else if (contactError.code == ContactError.TIMEOUT_ERROR) {
                        a4p.ErrorLog.log('ctrlEditObject', 'Device Contacts not imported from IOS : TIMEOUT_ERROR');
                    } else if (contactError.code == ContactError.PENDING_OPERATION_ERROR) {
                        a4p.ErrorLog.log('ctrlEditObject', 'Device Contacts not imported from IOS : PENDING_OPERATION_ERROR');
                    } else if (contactError.code == ContactError.IO_ERROR) {
                        a4p.ErrorLog.log('ctrlEditObject', 'Device Contacts not imported from IOS : IO_ERROR');
                    } else if (contactError.code == ContactError.NOT_SUPPORTED_ERROR) {
                        a4p.ErrorLog.log('ctrlEditObject', 'Device Contacts not imported from IOS : NOT_SUPPORTED_ERROR');
                    } else if (contactError.code == ContactError.PERMISSION_DENIED_ERROR) {
                        a4p.ErrorLog.log('ctrlEditObject', 'Device Contacts not imported from IOS : PERMISSION_DENIED_ERROR');
                    } else {
                        a4p.ErrorLog.log('ctrlEditObject', 'Device Contacts not imported from IOS : contactError.code unknown');
                    }
                });
            };
            var findOptions = new ContactFindOptions();
            findOptions.filter = "";
            findOptions.multiple = true;
            navigator.contacts.find(['*'], onContactsSuccess, onContactsFailure, findOptions);
            $scope.startSpinner();
        } else {
            a4p.InternalLog.log('ctrlEditObject', 'NO Device to import Contacts');
        }
    };

    $scope.openImportAccountDialog = function() {
        var possibleAccounts = [];
        if (navigator && navigator.contacts) {
            var onContactsSuccess = function(contacts) {
                a4p.safeApply($scope, function() {
                    var nbNewAccount = 0;
                    var accountIndex = {};
                    for (var i = 0, nb = contacts.length; i < nb; i++) {
                        var contact = contacts[i];
                        a4p.InternalLog.log('ctrlEditObject', 'analyze a contact from IOS : ' + a4pDumpData(contact, 3));
                        var j, max;
                        if (contact.organizations) {
                            for (j = 0, max = contact.organizations.length; j < max; j++) {
                                var name = contact.organizations[j].name;
                                if (a4p.isUndefined(accountIndex[name])) {
                                    var possibleAccount = {
                                        type : contact.organizations[j].type,
                                        company_name : name
                                    };
                                    possibleAccounts.push(possibleAccount);
                                    nbNewAccount++;
                                    accountIndex[name] = true;
                                }
                            }
                        }
                    }
                    if (!nbNewAccount) {
                        a4p.InternalLog.log('ctrlEditObject', 'NO Account found in IOS');
                    } else {
                        $scope.openDialogFct(
                            {
                                backdropClick: true,
                                dialogClass: 'modal c4p-modal-left c4p-modal-search',
                                backdropClass: 'modal-backdrop c4p-modal-left',
                                controller: 'ctrlAddAccount',
                                templateUrl: 'partials/dialog/dialogAddAccount.html',
                                resolve: {
                                    srvLocale: function () {
                                        return $scope.srvLocale;
                                    },
                                    accounts: function () {
                                        return possibleAccounts.slice(0);// copy full array
                                    }
                                }
                            },
                            function (result) {
                                if (a4p.isDefined(result)) {
                                    a4p.safeApply($scope, function() {
                                        $scope.clear();
                                        $scope.object.type = result.type;
                                        $scope.object.company_name = result.company_name;
                                        // Check values
                                        for (var objectGroupIdx = 0; objectGroupIdx < $scope.objectGroups.length; objectGroupIdx++) {
                                            var objectGroup = $scope.objectGroups[objectGroupIdx];
                                            for (var objectFieldIdx = 0; objectFieldIdx < objectGroup.groupFields.length; objectFieldIdx++) {
                                                var objectField = objectGroup.groupFields[objectFieldIdx];
                                                $scope.onFieldChanged(objectField);
                                            }
                                        }
                                    });
                                }
                            }
                        );
                    }
                });
            };
            var onContactsFailure = function(contactError) {
                a4p.safeApply($scope, function() {
                    if (contactError.code == ContactError.UNKNOWN_ERROR) {
                        a4p.ErrorLog.log('ctrlEditObject', 'Device Accounts not imported from IOS : UNKNOWN_ERROR');
                    } else if (contactError.code == ContactError.INVALID_ARGUMENT_ERROR) {
                        a4p.ErrorLog.log('ctrlEditObject', 'Device Accounts not imported from IOS : INVALID_ARGUMENT_ERROR');
                    } else if (contactError.code == ContactError.TIMEOUT_ERROR) {
                        a4p.ErrorLog.log('ctrlEditObject', 'Device Accounts not imported from IOS : TIMEOUT_ERROR');
                    } else if (contactError.code == ContactError.PENDING_OPERATION_ERROR) {
                        a4p.ErrorLog.log('ctrlEditObject', 'Device Accounts not imported from IOS : PENDING_OPERATION_ERROR');
                    } else if (contactError.code == ContactError.IO_ERROR) {
                        a4p.ErrorLog.log('ctrlEditObject', 'Device Accounts not imported from IOS : IO_ERROR');
                    } else if (contactError.code == ContactError.NOT_SUPPORTED_ERROR) {
                        a4p.ErrorLog.log('ctrlEditObject', 'Device Accounts not imported from IOS : NOT_SUPPORTED_ERROR');
                    } else if (contactError.code == ContactError.PERMISSION_DENIED_ERROR) {
                        a4p.ErrorLog.log('ctrlEditObject', 'Device Accounts not imported from IOS : PERMISSION_DENIED_ERROR');
                    } else {
                        a4p.ErrorLog.log('ctrlEditObject', 'Device Accounts not imported from IOS : contactError.code unknown');
                    }
                });
            };
            var findOptions = new ContactFindOptions();
            findOptions.filter = "";
            findOptions.multiple = true;
            navigator.contacts.find(['*'], onContactsSuccess, onContactsFailure, findOptions);
        } else {
            a4p.InternalLog.log('ctrlEditObject', 'NO Device to import Accounts');
        }
    };

    $scope.openImportEventDialog = function() {
        var possibleEvents = [];
        if (typeof calendarPlugin != 'undefined') {
            var onEventsSuccess = function(events) {
                a4p.InternalLog.log('ctrlEditObject', 'analyze events from IOS : ' + a4pDumpData(events, 3));
                /*
                a4p.safeApply($scope, function() {
                    var nbNewEvent = 0;
                    for (var i = 0, nb = events.length; i < nb; i++) {
                        var event = events[i];
                        var j, max;
                        var possibleEvent = {
                            type : event.organizations[j].type,
                            company_name : name
                        };
                        possibleEvents.push(possibleEvent);
                        nbNewEvent++;
                    }
                    if (!nbNewEvent) {
                        a4p.InternalLog.log('ctrlEditObject', 'NO Event found in IOS');
                    } else {
                        $scope.openDialogFct(
                            {
                                backdropClick: true,
                                dialogClass: 'modal c4p-modal-left c4p-modal-search',
                                backdropClass: 'modal-backdrop c4p-modal-left',
                                controller: 'ctrlAddEvent',
                                templateUrl: 'partials/dialog/dialogAddEvent.html',
                                resolve: {
                                    srvLocale: function () {
                                        return $scope.srvLocale;
                                    },
                                    events: function () {
                                        return possibleEvents.slice(0);// copy full array
                                    }
                                }
                            },
                            function (result) {
                                if (a4p.isDefined(result)) {
                                    a4p.safeApply($scope, function() {
                                        $scope.clear();
                                        $scope.object.type = result.type;
                                        $scope.object.company_name = result.company_name;
                                        // Check values
                                        for (var objectGroupIdx = 0; objectGroupIdx < $scope.objectGroups.length; objectGroupIdx++) {
                                            var objectGroup = $scope.objectGroups[objectGroupIdx];
                                            for (var objectFieldIdx = 0; objectFieldIdx < objectGroup.groupFields.length; objectFieldIdx++) {
                                                var objectField = objectGroup.groupFields[objectFieldIdx];
                                                $scope.onFieldChanged(objectField);
                                            }
                                        }
                                    });
                                }
                            }
                        );
                    }
                });
                */
            };
            var onEventsFailure = function(contactError) {
                a4p.safeApply($scope, function() {
                    a4p.ErrorLog.log('ctrlEditObject', 'Device Events not imported from IOS : ' + a4pDumpData(contactError, 3));
                });
            };
            var cal = new calendarPlugin();
            var startDate = "2012-01-01 00:00:00";
            var endDate = "2016-01-01 00:00:00";
            cal.findEvent('*', '', '', startDate, endDate, onEventsSuccess, onEventsFailure);
        } else {
            a4p.InternalLog.log('ctrlEditObject', 'NO Device to import Events');
        }
    };

    $scope.setSenseScroller = function(sense) {
        $scope.scrollsense = sense;
    };

    $scope.getSenseScrollerPageY = function () {
        if ($scope.scrollsense == null)
        {
            return (-1);
        }
        if ($scope.scrollsense.scroll == null)
        {
            return (-1);
        }

        return $scope.scrollsense.scroll.currPageY;
    };

    $scope.setSenseScrollerPageY = function (index) {
        if ($scope.scrollsense == null)
        {
            return (-1);
        }
        if ($scope.scrollsense.scroll == null)
        {
            return (-1);
        }
        $scope.scrollsense.scroll.scrollToPage($scope.scrollsense.scroll.currPageX, index, 200);
        $scope.pageY = index;

    };

    $scope.onSenseScrollEnd = function (event) {
        a4p.safeApply($scope, function  () {
            $scope.pageY = $scope.getSenseScrollerPageY();
        });
    };
}
ctrlEditObject.$inject = ['$scope', 'srvData', 'srvLocale', 'srvConfig', '$dialog'];
