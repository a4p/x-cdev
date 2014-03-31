'use strict';

function ctrlDupMeeting($scope, srvLocale, srvData, mEvent, mEventSrc, dialog) {

    $scope.srvLocale  = srvLocale;
    $scope.event  = mEvent;

    $scope.hasWhat  = a4p.isDefined(mEventSrc.what_id.dbid);
    $scope.hasAssignedContact  = a4p.isDefined(mEventSrc.assigned_contact_id.dbid);
    $scope.nbAttachment  = srvData.getTypedDirectLinks(mEventSrc, 'child', 'Document').length + srvData.getTypedRemoteLinks(mEventSrc, 'attachee', 'Document').length;
    $scope.nbAttendee  = srvData.getTypedRemoteLinks(mEventSrc, 'attendee', 'Contact').length;

    $scope.dupWhat  = false;
    $scope.dupAssignedContact  = false;
    $scope.dupAttachment  = false;
    $scope.dupAttendee  = false;

    $scope.valid  = function () {

        if ($scope.nameField.warn != '' ||  $scope.startField.warn != '' || $scope.endField.warn != '') {
            return ;
        }

        dialog.close({
            dupWhat:$scope.dupWhat,
            dupAssignedContact:$scope.dupAssignedContact,
            dupAttachment:$scope.dupAttachment,
            dupAttendee:$scope.dupAttendee
        });
    };

    $scope.cancel  = function () {
        dialog.close();
    };

    /**
     * validation
     */
    $scope.nameField = {
        'title': srvLocale.translations.htmlFormName,
        'key':'name',
        'warn': '',
        'type': ''
    };

    $scope.startField = {
        'title': srvLocale.translations.htmlFormDateStart,
        'key':'date_start',
        'warn': '',
        'type': 'datetime'
    };

    $scope.endField = {
        'title': srvLocale.translations.htmlFormDateEnd,
        'key':'date_end',
        'warn': '',
        'type': 'datetime'
    };

    $scope.objectGroups = [
        {
            title: 'Dates',
            warn: '',
            groupFields: [$scope.startField, $scope.endField]
        }
    ];

    /**
     * Events catch
     */
    $scope.onFieldChanged = function (field) {
        var validationHasChanged = false;
        calculateFields($scope, field);
        if (a4p.isDefined(c4p.Model.a4p_types[$scope.event.a4p_type].editObjectFields)) {
            var editObjectFields = c4p.Model.a4p_types[$scope.event.a4p_type].editObjectFields;
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


    function calculateFields(scope, changedField) {
        if (a4p.isDefined(c4p.Model.a4p_types[scope.event.a4p_type].editObjectFields)) {
            var editObjectFields = c4p.Model.a4p_types[scope.event.a4p_type].editObjectFields;
            if (a4p.isDefined(editObjectFields[changedField.key])) {
                var editObjectField = editObjectFields[changedField.key];
                // Update some dependant fields
                if (a4p.isDefined(editObjectField.calculations)) {
                    for (var calculationIdx = 0; calculationIdx < editObjectField.calculations.length; calculationIdx++) {
                        var calculation = editObjectField.calculations[calculationIdx];
                        var values = [];
                        for (var j = 0, len2 = calculation.fromFields.length; j < len2; j++) {
                            values.push(scope.event[calculation.fromFields[j]]);
                        }
                        scope.event[calculation.toField] = c4p.Model[calculation.getter].apply(c4p.Model, values);
                        a4p.InternalLog.log('ctrlDupMeeting', 'onFieldChanged : calculate ' + calculation.toField + '=' + scope.event[calculation.toField]);
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
        if (a4p.isDefined(c4p.Model.a4p_types[scope.event.a4p_type].editObjectFields)) {
            var editObjectFields = c4p.Model.a4p_types[scope.event.a4p_type].editObjectFields;
            if (a4p.isDefined(editObjectFields[thisFieldName])) {
                var editObjectField = editObjectFields[thisFieldName];
                if (a4p.isDefined(editObjectField.validations)) {
                    for (var validationIdx = 0; validationIdx < editObjectField.validations.length; validationIdx++) {
                        var validation = editObjectField.validations[validationIdx];
                        var valid = c4p.Model.validateObject.apply(c4p.Model, [scope.event, validation.expr]);
                        //var valid = scope.$eval(validation.expr);
                        if (!valid) {
                            return c4p.Model.getErrorMsg.apply(c4p.Model, [scope, validation.errorKey]);;
                        }
                    }
                }
            }
        }
        return null;
    }

}
