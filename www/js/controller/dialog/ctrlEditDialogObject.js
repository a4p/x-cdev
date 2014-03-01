'use strict';

function ctrlEditDialogObject($scope, srvData, srvLocale, srvConfig,  objectItem, removeFct, spinner, dialog, $dialog) {

    /**********************************************************
     *
     * 				DIALOG HELPERS START
     *
     *********************************************************/
    function promiseDialog(dialogOptions) {
        return $dialog.dialog(dialogOptions).open();
    }

    function openDialog(dialogOptions, onSuccess) {
        a4p.safeApply($scope, function() {
            $dialog.dialog(dialogOptions).open().then(onSuccess);
        });
    }

    /**********************************************************
     *
     * 				DIALOG HELPERS END
     *
     *********************************************************/




    /**********************************************************
     *
     * 				CONSTANTS DECLARATION START
     *
     *********************************************************/
    $scope.srvData = srvData;
    $scope.srvLocale = srvLocale;
    $scope.srvConfig = srvConfig;
    $scope.object = angular.copy(objectItem);
    $scope.objectName = srvConfig.getItemName(objectItem);
    $scope.objectIcon = c4p.Model.getItemIcon(objectItem);
    $scope.objectGroups = [];
    $scope.objectTypeLocale = objectItem.a4p_type;
    $scope.objectValidated = false;

    // Prohibit removing an object which you do not own (ex: Group Event)
    var object = srvData.getObject(objectItem.id.dbid);
    $scope.removeEnabled = a4p.isDefined(object) && srvData.isObjectOwnedByUser(object) && (objectItem.id.dbid != srvData.userId.dbid);

    $scope.removeFct = removeFct;
    $scope.objectGroup = null;
    $scope.objectGroupFilter = null; // used to filter edition group

    $scope.hasOpenImportContactDialog = (($scope.object.a4p_type == 'Contact') && navigator && navigator.contacts);
    $scope.hasOpenImportAccountDialog = (($scope.object.a4p_type == 'Account') && navigator && navigator.contacts);
    $scope.hasOpenImportEventDialog = (($scope.object.a4p_type == 'Event') && a4p.isDefined(calendarPlugin));

    // Change event
    $scope.objectLastChange = new Date();

    $scope.scrollsense = null;

    /**********************************************************
     *
     * 				CONSTANTS DECLARATION END
     *
     *********************************************************/


    $scope.startSpinner = function () {
        if (spinner != null) {
            spinner.style['display'] = '';
        }
    };
    $scope.stopSpinner = function () {
        if (spinner != null) {
            spinner.style['display'] = 'none';
        }
    };


    /**********************************************************
     *
     * 				PAGE LIFECYCLE START
     *
     *********************************************************/
    function initFields(scope) {
        scope.objectValidated = true;
        scope.objectGroups = [];

        // Retrieve object structure from c4p.model.js from its type 'a4p_type'
        var objDesc = c4p.Model.a4p_types[objectItem.a4p_type];
        var groups;

        // Case form groups are defined
        if (a4p.isDefined(objDesc.editObjectGroups)) {
        	// Retrieve form groups structure
            groups = objDesc.editObjectGroups;

        // No form group is defined
        } else {
            var fields = [];

            // Loop on fields and push them into 'fields' array if described in object structure
            for (var i = 0; i < objDesc.fields.length; i++) {
                var key = objDesc.fields[i];
                if (a4p.isDefined(objDesc.editObjectFields)
                    && a4p.isDefined(objDesc.editObjectFields[key])) {
                    fields.push(key);
                }
            }

            // Create a default form group structure called "Details", including fields
            groups = [
                {
                    key:'details',
                    title: 'htmlFieldsetDetails',
                    fields: fields
                }
            ];
        }

        // For each group from retrieved (or created on the fly) structure
        for (var groupIdx = 0; groupIdx < groups.length; groupIdx++) {
            var groupDesc = groups[groupIdx]; 	// Group structure iteration
            var groupWarn = '';					// Group warn message. Do not display any messages. Only used for css purposes when form error
            var groupSet = [];					// Group containing all fields display structure [title, type, warn, key]
            var group = [];						// The result group fully initialized (translation, warn...) and ready for display

            //For each field from the group structure iteration
            for (var fieldIdx = 0; fieldIdx < groupDesc.fields.length; fieldIdx++) {
                var key = groupDesc.fields[fieldIdx];	// Field iteration from group

                // If field is from strucutre and has an "Edit object" definition
                if (a4p.isDefined(c4p.Model.a4p_types[objectItem.a4p_type].editObjectFields)
                    && a4p.isDefined(c4p.Model.a4p_types[objectItem.a4p_type].editObjectFields[key])) {

                	// Retrieve "Edit object" structure
                    var editObjectField = c4p.Model.a4p_types[objectItem.a4p_type].editObjectFields[key];

                    // Get field iteration translation
                    var fieldLabel = scope.srvLocale.translations[editObjectField.title];

                    // If undefined, display the field key
                    if (!a4p.isDefined(fieldLabel)) {
                    	fieldLabel = key;
                    }

                    // Check if input must be autofocus on modal load
                    var isFocus = false;
                    if(a4p.isDefined(editObjectField.autofocus)) isFocus = editObjectField.autofocus;

                    // In case of select object, load options list
                    var selectOptions = '';
                    if(a4p.isDefined(editObjectField.optionList)) selectOptions = scope.srvLocale.translations[editObjectField.optionList]; // WARN: returns an array of options

                    // Push field iteration into group set
                    groupSet.push({
                        title: fieldLabel,				// Field display label
                        type: editObjectField.type,		// Field type
                        warn: '',						// Field warn message
                        key: key,						// Field structure key
                        focus: isFocus,
                        optionList: selectOptions
                    });
                }
            }

            // Create a higher level structure containing initialized fields, group title and group warn message
            group = {
                title: scope.srvLocale.translations[groupDesc.title],
                warn: groupWarn,
                groupFields: groupSet
            };

            // Push initialized group iteration in page scope for display
            scope.objectGroups.push(group);
        }

        // Check all fields for all groups
        for (var objectGroupIdx = 0; objectGroupIdx < scope.objectGroups.length; objectGroupIdx++) {
        	// Loop on all groups
            var objectGroup = scope.objectGroups[objectGroupIdx];

            // Loop on all group fields
            for (var objectFieldIdx = 0; objectFieldIdx < objectGroup.groupFields.length; objectFieldIdx++) {
            	// Call field check method
                var objectField = objectGroup.groupFields[objectFieldIdx];
                scope.onFieldChanged(objectField);
            }
        }
    }

    // Button submit
    $scope.submit = function () {
        if ($scope.objectValidated) {
            for (var objectGroupIdx = 0; objectGroupIdx < $scope.objectGroups.length; objectGroupIdx++) {
                var objectGroup = $scope.objectGroups[objectGroupIdx];
                for (var objectFieldIdx = 0; objectFieldIdx < objectGroup.groupFields.length; objectFieldIdx++) {
                    var objectField = objectGroup.groupFields[objectFieldIdx];
                    objectItem[objectField.key] = $scope.object[objectField.key];
                }
            }
            dialog.close(objectItem);
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
                        warnList.push(objectField.warn);
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
            openDialog({
                backdropClick: true,
                dialogClass: 'modal c4p-modal-confirm',
                backdropClass: 'modal-backdrop c4p-modal-confirm',
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

    /**********************************************************
     *
     * 				PAGE LIFECYCLE END
     *
     *********************************************************/




    /**********************************************************
     *
     * 				ACTIONS START
     *
     *********************************************************/
    $scope.onFieldChanged = function (field) {
    	// Boolean used to check if groups warn message must be refreshed
        var validationHasChanged = false;

        // Perform fields value initialization (fields value can depend on other fields)
        calculateFields($scope, field);

        // If object "Edit object" structure is defined
        if (a4p.isDefined(c4p.Model.a4p_types[objectItem.a4p_type].editObjectFields)) {
        	// Retrieve object "Edit object" structure
            var editObjectFields = c4p.Model.a4p_types[objectItem.a4p_type].editObjectFields;

            // If field structure exists in object "Edit object" structure
            if (a4p.isDefined(editObjectFields[field.key])) {
            	// Retrieve field "Edit object" structure
                var editObjectField = editObjectFields[field.key];

                // If validations expr are defined in field structure
                if (a4p.isDefined(editObjectField.validations)) {
                	// Check field is valid
                    var message = warningForThisField($scope, field.key);

                    // Case field invalid, at least 1 error
                    if (message != null) {
                    	// Check if validation has changed
                    	if (field.warn != message) validationHasChanged = true;

                    	// Set field warn message
                        field.warn = message;

                        // Set validation to false (css changes...)
                        $scope.objectValidated = false;

                    // Cas field valid
                    } else {
                    	// Check if validation has changed
                    	if (field.warn != '') validationHasChanged = true;

                    	// Reset field warn message
                    	field.warn = '';

                    	// Check if form is valid (current field may be the only form invalid item)
                    	$scope.objectValidated = checkGlobalFormValidation($scope);
                    }
                }
            }
        }

        // Case form validity has changed, update all groups error
        if (validationHasChanged) {

            // For each group of fields
            for (var objectGroupIdx = 0; objectGroupIdx < $scope.objectGroups.length; objectGroupIdx++) {
            	// Retrieve the group iteration
                var objectGroup = $scope.objectGroups[objectGroupIdx];

                // Reset group warn message
                objectGroup.warn = '';

                // For each field in group iteration
                for (var objectFieldIdx = 0; objectFieldIdx < objectGroup.groupFields.length; objectFieldIdx++) {
                	// Retrieve the field iteration
                    var objectField = objectGroup.groupFields[objectFieldIdx];

                    // If field is invalid
                    if (objectField.warn != '') {
                    	// Invalidate group
                    	objectGroup.warn = objectField.warn;

                        // Check next group
                        break;
                    }
                }
            }

            //MLE change iScroll
            $scope.setLastChange();
        }
    };

    // Button cancel
    $scope.close = function () {
        dialog.close();
    };

    // Button clear
    $scope.clear = function () {
        $scope.objectName = '';
        $scope.object = angular.copy(objectItem);

        $scope.objectName = srvConfig.getItemName(objectItem);

        initFields($scope);

        //MLE Change event
        $scope.setLastChange();
    };

    // Button Remove
    $scope.remove = function () {
    	$scope.confirmRemove();
    };

    $scope.confirmRemove = function () {
        var text = $scope.srvLocale.translations.htmlTextConfirmDelete;
        var array = [$scope.objectName];
        openDialog({
                backdropClick: false,
                dialogClass: 'modal c4p-modal-confirm',
                backdropClass: 'modal-backdrop c4p-modal-confirm',
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
                    $scope.removeFct(objectItem);
                    dialog.close();
                }
            });
    };

    /**********************************************************
     *
     * 				ACTIONS END
     *
     *********************************************************/




    /**********************************************************
     *
     * 				METHODS START
     *
     *********************************************************/
    /**
     * Function used to set up a field value.
     * Some field may depend on other fields
     */
    function calculateFields(scope, changedField) {
    	// If current object has an "Edit object" structure
        if (a4p.isDefined(c4p.Model.a4p_types[objectItem.a4p_type].editObjectFields)) {
        	// Retrieve "Edit object" structure
            var editObjectFields = c4p.Model.a4p_types[objectItem.a4p_type].editObjectFields;

            // If input field is defined in the "Edit object" structure
            if (a4p.isDefined(editObjectFields[changedField.key])) {
            	// Retrieve object structure definition
                var editObjectField = editObjectFields[changedField.key];

                // If field has defined calculations
                if (a4p.isDefined(editObjectField.calculations)) {
                	// Loop on calculations
                    for (var calculationIdx = 0; calculationIdx < editObjectField.calculations.length; calculationIdx++) {
                    	// Retrieve calculation iteration
                        var calculation = editObjectField.calculations[calculationIdx];

                        // Store fields values on which calculation depends
                        var values = [];
                        for (var j = 0, len2 = calculation.fromFields.length; j < len2; j++) {
                            values.push(scope.object[calculation.fromFields[j]]);
                        }

                        // Calculate and set value for current object field
                        scope.object[calculation.toField] = c4p.Model[calculation.getter].apply(c4p.Model, values);

                        a4p.InternalLog.log('ctrlEditDialogObject', 'onFieldChanged : calculate ' + calculation.toField + '=' + scope.object[calculation.toField]);
                    }
                }
            }
        }
    }

	/**
	 * Function used to check if among current object structure,
	 * a field is invalid
	 */
    function checkGlobalFormValidation(scope) {
    	// For each group of fields
        for (var objectGroupIdx = 0; objectGroupIdx < scope.objectGroups.length; objectGroupIdx++) {
        	// Retrieve the fields group container
            var objectGroup = scope.objectGroups[objectGroupIdx];

            // For each field of the group
            for (var objectFieldIdx = 0; objectFieldIdx < objectGroup.groupFields.length; objectFieldIdx++) {
            	// Retrieve the field
                var objectField = objectGroup.groupFields[objectFieldIdx];

                // Check if field is invalid
                if (objectField.warn != '') {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Function used to check if a field is valid
     */
    function warningForThisField(scope, thisFieldName) {
    	// Check object has an "Edit Object" definition
        if (a4p.isDefined(c4p.Model.a4p_types[objectItem.a4p_type].editObjectFields)) {
        	// Retrieve object "Edit object" structure
            var editObjectFields = c4p.Model.a4p_types[objectItem.a4p_type].editObjectFields;

            // Now check object field has an "Edit object" definition
            if (a4p.isDefined(editObjectFields[thisFieldName])) {
            	// Retrieve field "Edit object" strucutre
                var editObjectField = editObjectFields[thisFieldName];

                // If validations are required for this object
                if (a4p.isDefined(editObjectField.validations)) {

                	// Loop on all validation expressions and return the first error matched
                    for (var validationIdx = 0; validationIdx < editObjectField.validations.length; validationIdx++) {
                        var validation = editObjectField.validations[validationIdx]; 	// The validation iteration

                        // Perform the object validation through an eval (validation expr may contain functions)
                        var valid = c4p.Model.validateObject.apply(c4p.Model, [scope.object, validation.expr]);

                        // If unvalid, eval the error message and return it
                        if (!valid) {
                        	return c4p.Model.getErrorMsg.apply(c4p.Model, [scope, validation.errorKey]);
                        }
                    }
                }
            }
        }

        // All is fine, no error or validation structure found
        return null;
    }

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

    $scope.getTypeColor = function (type){
        return c4p.Model.getTypeColor(type);
    };

    $scope.setLastChange = function() {
        //MLE Change event
    	$scope.objectLastChange = new Date();
    };

    /**********************************************************
     *
     * 				METHODS END
     *
     *********************************************************/




    /**********************************************************
     *
     * 				IMPORTS START
     *
     *********************************************************/
    $scope.openImportContactDialog = function() {
        var possibleContacts = [];
        if (navigator && navigator.contacts) {
            var onContactsSuccess = function(contacts) {
                a4p.safeApply($scope, function() {
                    $scope.stopSpinner();
                    var nbNewContact = 0;
                    for (var i = 0, nb = contacts.length; i < nb; i++) {
                        var contact = contacts[i];
                        a4p.InternalLog.log('ctrlEditDialogObject', 'analyze a contact from IOS : ' + a4pDumpData(contact, 3));
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
                        a4p.InternalLog.log('ctrlEditDialogObject', 'NO Contact found in IOS');
                    } else {
                        var menus = [];
                        var addedOrganizers = [];
                        var dialogOptions = {
                            backdropClick: false,
                            dialogClass: 'modal modal-left c4p-modal-search c4p-dialog',
                            backdropClass: 'modal-backdrop c4p-modal-search-backdrop'
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
                        openDialog(dialogOptions, function (result) {
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
                        a4p.ErrorLog.log('ctrlEditDialogObject', 'Device Contacts not imported from IOS : UNKNOWN_ERROR');
                    } else if (contactError.code == ContactError.INVALID_ARGUMENT_ERROR) {
                        a4p.ErrorLog.log('ctrlEditDialogObject', 'Device Contacts not imported from IOS : INVALID_ARGUMENT_ERROR');
                    } else if (contactError.code == ContactError.TIMEOUT_ERROR) {
                        a4p.ErrorLog.log('ctrlEditDialogObject', 'Device Contacts not imported from IOS : TIMEOUT_ERROR');
                    } else if (contactError.code == ContactError.PENDING_OPERATION_ERROR) {
                        a4p.ErrorLog.log('ctrlEditDialogObject', 'Device Contacts not imported from IOS : PENDING_OPERATION_ERROR');
                    } else if (contactError.code == ContactError.IO_ERROR) {
                        a4p.ErrorLog.log('ctrlEditDialogObject', 'Device Contacts not imported from IOS : IO_ERROR');
                    } else if (contactError.code == ContactError.NOT_SUPPORTED_ERROR) {
                        a4p.ErrorLog.log('ctrlEditDialogObject', 'Device Contacts not imported from IOS : NOT_SUPPORTED_ERROR');
                    } else if (contactError.code == ContactError.PERMISSION_DENIED_ERROR) {
                        a4p.ErrorLog.log('ctrlEditDialogObject', 'Device Contacts not imported from IOS : PERMISSION_DENIED_ERROR');
                    } else {
                        a4p.ErrorLog.log('ctrlEditDialogObject', 'Device Contacts not imported from IOS : contactError.code unknown');
                    }
                });
            };
            var findOptions = new ContactFindOptions();
            findOptions.filter = "";
            findOptions.multiple = true;
            navigator.contacts.find(['*'], onContactsSuccess, onContactsFailure, findOptions);
            $scope.startSpinner();
        } else {
            a4p.InternalLog.log('ctrlEditDialogObject', 'NO Device to import Contacts');
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
                        a4p.InternalLog.log('ctrlEditDialogObject', 'analyze a contact from IOS : ' + a4pDumpData(contact, 3));
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
                        a4p.InternalLog.log('ctrlEditDialogObject', 'NO Account found in IOS');
                    } else {
                        openDialog(
                            {
                                backdropClick: true,
                                dialogClass: 'modal modal-left c4p-modal-search',
                                backdropClass: 'modal-backdrop c4p-modal-search',
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
                        a4p.ErrorLog.log('ctrlEditDialogObject', 'Device Accounts not imported from IOS : UNKNOWN_ERROR');
                    } else if (contactError.code == ContactError.INVALID_ARGUMENT_ERROR) {
                        a4p.ErrorLog.log('ctrlEditDialogObject', 'Device Accounts not imported from IOS : INVALID_ARGUMENT_ERROR');
                    } else if (contactError.code == ContactError.TIMEOUT_ERROR) {
                        a4p.ErrorLog.log('ctrlEditDialogObject', 'Device Accounts not imported from IOS : TIMEOUT_ERROR');
                    } else if (contactError.code == ContactError.PENDING_OPERATION_ERROR) {
                        a4p.ErrorLog.log('ctrlEditDialogObject', 'Device Accounts not imported from IOS : PENDING_OPERATION_ERROR');
                    } else if (contactError.code == ContactError.IO_ERROR) {
                        a4p.ErrorLog.log('ctrlEditDialogObject', 'Device Accounts not imported from IOS : IO_ERROR');
                    } else if (contactError.code == ContactError.NOT_SUPPORTED_ERROR) {
                        a4p.ErrorLog.log('ctrlEditDialogObject', 'Device Accounts not imported from IOS : NOT_SUPPORTED_ERROR');
                    } else if (contactError.code == ContactError.PERMISSION_DENIED_ERROR) {
                        a4p.ErrorLog.log('ctrlEditDialogObject', 'Device Accounts not imported from IOS : PERMISSION_DENIED_ERROR');
                    } else {
                        a4p.ErrorLog.log('ctrlEditDialogObject', 'Device Accounts not imported from IOS : contactError.code unknown');
                    }
                });
            };
            var findOptions = new ContactFindOptions();
            findOptions.filter = "";
            findOptions.multiple = true;
            navigator.contacts.find(['*'], onContactsSuccess, onContactsFailure, findOptions);
        } else {
            a4p.InternalLog.log('ctrlEditDialogObject', 'NO Device to import Accounts');
        }
    };

    $scope.openImportEventDialog = function() {
        var possibleEvents = [];
        if (a4p.isDefined(calendarPlugin)) {
            var onEventsSuccess = function(events) {
                a4p.InternalLog.log('ctrlEditDialogObject', 'analyze events from IOS : ' + a4pDumpData(events, 3));
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
                        a4p.InternalLog.log('ctrlEditDialogObject', 'NO Event found in IOS');
                    } else {
                        openDialog(
                            {
                                backdropClick: true,
                                dialogClass: 'modal modal-left c4p-modal-search',
                                backdropClass: 'modal-backdrop c4p-modal-search',
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
                    a4p.ErrorLog.log('ctrlEditDialogObject', 'Device Events not imported from IOS : ' + a4pDumpData(contactError, 3));
                });
            };
            var cal = new calendarPlugin();
            var startDate = "2012-01-01 00:00:00";
            var endDate = "2016-01-01 00:00:00";
            cal.findEvent('*', '', '', startDate, endDate, onEventsSuccess, onEventsFailure);
        } else {
            a4p.InternalLog.log('ctrlEditDialogObject', 'NO Device to import Events');
        }
    };

    /**********************************************************
     *
     * 				IMPORTS END
     *
     *********************************************************/






    /**
     * Initialization
     */
    initFields($scope);
}
