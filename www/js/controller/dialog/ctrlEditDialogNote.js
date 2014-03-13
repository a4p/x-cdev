'use strict';

function ctrlEditDialogNote($scope, srvLocale, srvConfig, srvData, srvFacet, attendees, attachments, event, note, editable, modeEdit, spinner, openDialogFct, $dialog, dialog) {

    /**
     * Helpers
     */
     
    /**
     * Variables
     */
    $scope.srvLocale = srvLocale;
    $scope.srvData = srvData;
    $scope.openDialogFct = openDialogFct;

    $scope.note = note;
    $scope.footerToolboxInEditMode = [];		//used for action in footer
    $scope.removeEnabled = a4p.isDefined(note.id) && a4p.isDefined(srvData.getObject(note.id.dbid)) && srvData.isObjectOwnedByUser(note) && (note.id.dbid != srvData.userId.dbid);
    //$scope.inBackground = false;//used to prevent double dialog
    $scope.noteLastUpdate = 0;	//used for scroll update
    $scope.modeEdit = modeEdit;
    $scope.editable = editable;


    // $scope.contacts = contacts.slice(0);
    // $scope.documents = documents.slice(0);

    // ToolBox objects that you can add to a report
    $scope.toolboxContacts = [];
    $scope.toolboxDocs = [];
    $scope.toolboxRatings = [];

    // Objects already selected in event
    $scope.event = event;

    /**
     * Functions
     */
    $scope.getTypeColor = function () {
        return c4p.Model.getTypeColor(note.a4p_type);
    };

    function initFields() {
        $scope.objectValidated = true;
        $scope.objectGroups = [];
        var objDesc = c4p.Model.a4p_types[note.a4p_type];
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
            var groupSet = [];
            for (var fieldIdx = 0; fieldIdx < groupDesc.fields.length; fieldIdx++) {
                var key = groupDesc.fields[fieldIdx];
                if (a4p.isDefined(c4p.Model.a4p_types[note.a4p_type].editObjectFields)
                    && a4p.isDefined(c4p.Model.a4p_types[note.a4p_type].editObjectFields[key])) {
                    var editObjectField = c4p.Model.a4p_types[note.a4p_type].editObjectFields[key];
                    var warn = '';
                    if (a4p.isDefined(editObjectField.validations)) {
                        var message = warningForThisField(key);
                        if (message != null) {
                            warn = message;
                            $scope.objectValidated = false;
                        }
                    }
                    if (a4p.isDefined($scope.srvLocale.translations[editObjectField.title])) {
                        groupSet.push({
                            title: $scope.srvLocale.translations[editObjectField.title],
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
                title: $scope.srvLocale.translations[groupDesc.title],
                groupFields: groupSet
            };
            if (groupIdx == 0) $scope.toggleObjectGroupFilter(group); // set first group
            $scope.objectGroups.push(group);
        }
        // Check values
        for (var objectGroupIdx = 0; objectGroupIdx < $scope.objectGroups.length; objectGroupIdx++) {
            var objectGroup = $scope.objectGroups[objectGroupIdx];
            for (var objectFieldIdx = 0; objectFieldIdx < objectGroup.groupFields.length; objectFieldIdx++) {
                var objectField = objectGroup.groupFields[objectFieldIdx];
                $scope.onFieldChanged(objectField);
            }
        }
    }

    $scope.initEditDialogNoteCtrl = function () {
        $scope.note.description = $scope.note['description'] || $scope.event.description || '';
        $scope.noteDescriptionRows = Math.max(1, Math.round($scope.note.description.length / 40));
        $scope.note.message = $scope.note['message'] || '';
        var now = new Date();
        var stringNow = $scope.srvLocale.formatDate(now, 'fullDate');
        $scope.note.when = $scope.note['when'] || stringNow;
        if (note.a4p_type == 'Report') {
            // Report specifics
            $scope.note.title = $scope.note['title'] || ($scope.event.name
                ? a4pFormat(srvLocale.translations.htmlTitleReportOf, $scope.event.name)
                : srvLocale.translations.htmlTitleTypeReport);

            // Synchronize $scope.note.document_ids and $scope.toolboxDocs
            $scope.toolboxDocs = [];
            for (var i = 0; i < $scope.note.document_ids.length; i++) {
                $scope.toolboxDocs.push($scope.srvData.getObject($scope.note.document_ids[i].dbid));
            }
            // Synchronize $scope.note.contact_ids and $scope.toolboxContacts
            $scope.toolboxContacts = [];
            for (var i = 0; i < $scope.note.contact_ids.length; i++) {
                $scope.toolboxContacts.push($scope.srvData.getObject($scope.note.contact_ids[i].dbid));
            }
            // Synchronize $scope.note.ratings and $scope.toolboxRatings
            $scope.toolboxRatings = $scope.note.ratings;
            // Init toolbox action
            $scope.toolboxInEditMode = [
                {fn: $scope.openDialogPeople, icon: "user"},
                {fn: $scope.openDialogDocs, icon: "link"},
                {fn: $scope.openDialogAddRatings, icon: "star"}
            ];
        } else {
            // Note specifics
            $scope.note.title = $scope.note['title'] || ($scope.event.name
                ? a4pFormat(srvLocale.translations.htmlTitleNoteOf, $scope.event.name)
                : srvLocale.translations.htmlTitleTypeNote);
        }
    };

    $scope.toggleObjectGroupFilter = function(group){
        if (!group) return;
        $scope.objectGroupFilter = group;
        //MLE Change event
        $scope.setLastChange();
    };

    $scope.setLastChange = function() {
        //MLE Change event
        $scope.objectLastChange = new Date();
    };

    /**
     * Events catch
     */
    $scope.onFieldChanged = function (field) {
        var validationHasChanged = false;
        if (a4p.isDefined(c4p.Model.a4p_types[note.a4p_type].editObjectFields)) {
            var editObjectFields = c4p.Model.a4p_types[note.a4p_type].editObjectFields;
            if (a4p.isDefined(editObjectFields[field.key])) {
                var editObjectField = editObjectFields[field.key];
                // Validate some fields
                if (a4p.isDefined(editObjectField.validations)) {
                    $scope.objectValidated = isObjectValidatedByOtherFields($scope, field.key);
                    var message = warningForThisField(field.key);
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


        //MLE change iScroll
        if (validationHasChanged)
            $scope.setLastChange();

    };

    /*$scope.submit = function () {
        $scope.note.editable = true;
        dialog.close({note:$scope.note, share:false});
    };*/

    $scope.submit = function () {
        if ($scope.objectValidated) {
            for (var objectGroupIdx = 0; objectGroupIdx < $scope.objectGroups.length; objectGroupIdx++) {
                var objectGroup = $scope.objectGroups[objectGroupIdx];
                for (var objectFieldIdx = 0; objectFieldIdx < objectGroup.groupFields.length; objectFieldIdx++) {
                    var objectField = objectGroup.groupFields[objectFieldIdx];
                    note[objectField.key] = $scope.note[objectField.key];
                }
            }
            $scope.note.editable = true;
            dialog.close({note:$scope.note, share:false});
        }
        else {
            //MLE Change event
            $scope.setLastChange();
        }
    };

    $scope.submitAndShare = function () {
        $scope.note.editable = true;
        dialog.close({note:$scope.note, share:true, byChatter:false});
    };

    $scope.submitAndShareByChatter = function () {
        $scope.note.editable = true;
        dialog.close({note:$scope.note, share:true, byChatter:true});
    };

    $scope.close = function () {
        dialog.close();
    };

    // Button Remove
    $scope.remove = function () {
    	$scope.confirmRemove();
    };

    $scope.confirmRemove = function () {
        var text = $scope.srvLocale.translations.htmlTextConfirmDelete;
        var array = [srvConfig.getItemName($scope.note)];
        $scope.openDialogFct({
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
                    srvData.removeAndSaveObject($scope.note);
                    dialog.close();
                }
            });
    };

    $scope.setModeEdit = function (modeEdit) {
        $scope.modeEdit = modeEdit;
        $scope.noteLastUpdate = new Date();
    };

    // Add objects to report
    $scope.openDialogPeople = function () {
        var menus = [];
        var addedOrganizers = [];
        menus.push({
            icon: 'chevron-right',
            name: 'eventAttendees',
            filterFct: function (object) {
                if (a4p.isDefinedAndNotNull(object)) {
                    for (var i = 0; i < attendees.length; i++) {
                        if (attendees[i].relation_id.dbid == object.id.dbid) return true;
                    }
                }
                return false;
            }
        });
        addedOrganizers.push(srvFacet.createEventAttendeesOrganizer(attendees));
        var dialogOptions = {
            backdropClick: true,
            dialogClass: 'modal c4p-modal-left c4p-modal-search c4p-dialog',
            backdropClass: 'modal-backdrop c4p-modal-left'
        };
        var resolve = {
            srvData: function () {
                return srvData;
            },
            srvConfig: function() {
                return srvConfig;
            },
            srvLocale: function () {
                return srvLocale;
            },
            type: function () {
                return 'Contact';
            },
            initFilter: function () {
                return function (object) {
                    // reject contacts already attached to this note
                    for (var i = 0; i < $scope.note.contact_ids.length; i++) {
                        if ($scope.note.contact_ids[i].dbid == object.id.dbid) return false;
                    }
                    return true
                };
            },
            initSelector: function () {
                return function (object) {
                    return false
                };
            },
            multiple: function () {
                return true;
            },
            createFct: function () {
                return function() {
                    var newObject = $scope.srvData.createObject('Contact', {});
                    // dialog to edit a new Contact
                    return promiseDialog({
                        backdropClick: false,
                        dialogClass: 'modal c4p-modal-full c4p-dialog',
                        backdropClass: 'modal-backdrop c4p-modal-full',
                        controller: 'ctrlEditDialogObject',
                        templateUrl: 'partials/dialog/edit_object.html',
                        resolve: {
                            srvData: function () {
                                return srvData;
                            },
                            srvLocale: function () {
                                return srvLocale;
                            },
                            srvConfig: function () {
                                return srvConfig;
                            },
                            objectItem: function () {
                                //return angular.copy(newObject);
                                return newObject;
                            },
                            removeFct: function () {
                                return function (obj) {
                                    srvData.removeAndSaveObject(obj);
                                };
                            },
                            spinner: function () {
                                return spinner;
                            },
                            openDialogFct: function () {
                                return $scope.openDialog;
                            }    
                        }
                    });
                };
            }
        };
        if (srvConfig.c4pConfig.exposeFacetDialog) {
            dialogOptions.controller = 'ctrlFacetSelectedDialog';
            dialogOptions.templateUrl = 'partials/dialog/dialogFacetSelected.html';
            resolve.srvFacet = function () { return srvFacet; };
            resolve.addedOrganizers = function () { return addedOrganizers; };
        } else {
            dialogOptions.controller = 'ctrlSelectObjectsDialog';
            dialogOptions.templateUrl = 'partials/dialog/dialogSelectObjects.html';
            resolve.suggestedMenus = function () { return menus; };
        }
        dialogOptions.resolve = resolve;
        $scope.openDialogFct(dialogOptions, function (result) {
            if (a4p.isDefined(result)) {
                a4p.safeApply($scope, function () {
                    // Synchronize $scope.note.contact_ids and $scope.toolboxContacts
                    //$scope.note.contact_ids = [];
                    //$scope.toolboxContacts = [];
                    for (var i = 0; i < result.length; i++) {
                        $scope.note.contact_ids.push(result[i].id);
                        $scope.toolboxContacts.push(result[i]);
                    }
                    $scope.noteLastUpdate = new Date();
                });
            }
        });
    };

    /**
     * Dialog to add some other documents as attachments
     */
    $scope.openDialogDocs = function () {
        var menus = [];
        var addedOrganizers = [];
        menus.push({
            icon: 'chevron-right',
            name: 'eventAttachments',
            filterFct: function (object) {
                for (var i = 0; i < attachments.length; i++) {
                    if (attachments[i].id.dbid == object.id.dbid) return true;
                }
                return false;
            }
        });
        addedOrganizers.push(srvFacet.createEventAttachmentsOrganizer(attachments));
        var dialogOptions = {
            backdropClick: true,
            dialogClass: 'modal c4p-modal-left c4p-modal-search c4p-dialog',
            backdropClass: 'modal-backdrop c4p-modal-left'
        };
        var resolve = {
            srvData: function () {
                return srvData;
            },
            srvConfig: function() {
                return srvConfig;
            },
            srvLocale: function () {
                return srvLocale;
            },
            type: function () {
                return 'Document';
            },
            initFilter: function () {
                return function (object) {
                    // reject documents already attached to this note
                    for (var i = 0; i < $scope.note.document_ids.length; i++) {
                        if ($scope.note.document_ids[i].dbid == object.id.dbid) return false;
                    }
                    return true
                };
            },
            initSelector: function () {
                return function (object) {
                    return false
                };
            },
            multiple: function () {
                return true;
            },
            createFct: function () {
                return null;
            }
        };
        if (srvConfig.c4pConfig.exposeFacetDialog) {
            dialogOptions.controller = 'ctrlFacetSelectedDialog';
            dialogOptions.templateUrl = 'partials/dialog/dialogFacetSelected.html';
            resolve.srvFacet = function () { return srvFacet; };
            resolve.addedOrganizers = function () { return []; };
        } else {
            dialogOptions.controller = 'ctrlSelectObjectsDialog';
            dialogOptions.templateUrl = 'partials/dialog/dialogSelectObjects.html';
            resolve.suggestedMenus = function () { return []; };
        }
        dialogOptions.resolve = resolve;
        $scope.openDialogFct(dialogOptions, function (result) {
            if (a4p.isDefined(result)) {
                a4p.safeApply($scope, function () {
                    // Synchronize $scope.note.document_ids and $scope.toolboxDocs
                    //$scope.note.document_ids = [];
                    //$scope.toolboxDocs = [];
                    for (var i = 0; i < result.length; i++) {
                        $scope.note.document_ids.push(result[i].id);
                        $scope.toolboxDocs.push(result[i]);
                    }
                    $scope.noteLastUpdate = new Date();
                });
            }
        });
    };

    $scope.openDialogAddRatings = function () {
        $scope.openDialogFct(
            {
                dialogClass: 'modal c4p-modal-left c4p-modal-search c4p-dialog',
                backdropClass: 'modal-backdrop c4p-modal-left',
                backdropClick: true,
                controller: 'ctrlAddRatings',
                templateUrl: 'partials/dialog/dialogAddRatings.html',
                resolve: {
                    srvLocale: function () {
                        return $scope.srvLocale;
                    },
                    ratings: function () {
                        return $scope.toolboxRatings.slice(0);// copy full array
                    }
                }
            },
            function (result) {
                if (a4p.isDefined(result)) {
                    // Synchronize $scope.note.ratings and $scope.toolboxRatings
                    $scope.toolboxRatings = result.slice(0);// copy full array
                    $scope.note.ratings = $scope.toolboxRatings;
                    $scope.noteLastUpdate = new Date();
                }
            }
        );
    };

    // Remove

    $scope.removeContact = function (index) {
        // Synchronize $scope.note.contact_ids and $scope.toolboxContacts
        $scope.note.contact_ids.splice(index, 1);
        $scope.toolboxContacts.splice(index, 1);
        $scope.noteLastUpdate = new Date();
    };

    $scope.removeDoc = function (index) {
        // Synchronize $scope.note.document_ids and $scope.toolboxDocs
        $scope.note.document_ids.splice(index, 1);
        $scope.toolboxDocs.splice(index, 1);
        $scope.noteLastUpdate = new Date();
    };

    $scope.removeRating = function (index) {
        // Synchronize $scope.note.ratings and $scope.toolboxRatings
        $scope.note.ratings.splice(index, 1);
        $scope.toolboxRatings = $scope.note.ratings;
        $scope.noteLastUpdate = new Date();
    };

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
    };

    function warningForThisField(thisFieldName) {
        if (a4p.isDefined(c4p.Model.a4p_types[note.a4p_type].editObjectFields)) {
            var editObjectFields = c4p.Model.a4p_types[note.a4p_type].editObjectFields;
            if (a4p.isDefined(editObjectFields[thisFieldName])) {
                var editObjectField = editObjectFields[thisFieldName];
                if (a4p.isDefined(editObjectField.validations)) {
                    for (var validationIdx = 0; validationIdx < editObjectField.validations.length; validationIdx++) {
                        var validation = editObjectField.validations[validationIdx];
                        var valid = c4p.Model.validateObject.apply(c4p.Model, [$scope.note, validation.expr]);
                        //var valid = scope.$eval(validation.expr);
                        if (!valid) {
                            return c4p.Model.getErrorMsg.apply(c4p.Model, [$scope, validation.errorKey]);
                        }
                    }
                }
            }
        }
        return null;
    };

    /**
     * Initialization
     */
    $scope.initEditDialogNoteCtrl();
    initFields();
}
