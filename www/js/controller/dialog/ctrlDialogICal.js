'use strict';

function ctrlDialogICal($scope, srvLocale, srvData, srvConfig, srvFacet, ical, attendees, $modal, dialog) {
    /**
     * Helpers
     */


    /**
     * Variables
     */
    $scope.emailInput = '';
    $scope.errorMap = {};

    /**
     * Functions
     */
    $scope.initDialogICalCtrl = function () {
        $scope.srvLocale = srvLocale;
        $scope.srvData = srvData;
        $scope.emails = [];// Direct email addresses to send to
        $scope.contacts = [];// Contacts for who ical will be sent
        $scope.ical = ical;
        // TODO: get event attendees
        /*for (var i = 0; i < $scope.email.contacts.length; i++) {
            var contact = $scope.srvData.getObject($scope.email.contacts[i].dbid);
            $scope.contacts.push(contact);
        }*/
    };

    $scope.addEmailToList = function(value) {
        var emailAddrList = value.split(';');
        for (var i= 0, n = emailAddrList.length; i < n; i++) {
            var emailAddr = emailAddrList[i].trim();
            if(emailAddr != '') {
                addKeyToList($scope.ical.emailsInput, 'email', {email: emailAddr});
                addKeyToList($scope.emails, 'email', {email: emailAddr});
            }
        }
        $scope.emailInput = '';
    };

    //open dialog contacts
    $scope.openDialogContacts = function () {
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
            backdrop: false,
            windowClass: 'modal c4p-modal-left c4p-modal-search c4p-dialog'
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
                    // reject contacts already attached to this event
                    for (var i = 0; i < $scope.contacts.length; i++) {
                        if ($scope.contacts[i].dbid == object.id.dbid) return false;
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
            resolve.addedOrganizers = function () { return addedOrganizers; };
        } else {
            dialogOptions.controller = 'ctrlSelectObjectsDialog';
            dialogOptions.templateUrl = 'partials/dialog/dialogSelectObjects.html';
            resolve.suggestedMenus = function () { return menus; };
        }
        dialogOptions.resolve = resolve;
        openDialog(dialogOptions, function (result) {
            if (a4p.isDefined(result)) {
                a4p.safeApply($scope, function () {
                    // Synchronize $scope.note.contacts and $scope.contacts
                    //$scope.ical.contacts = [];
                    //$scope.contacts = [];
                    for (var i = 0; i < result.length; i++) {
                        $scope.ical.contacts.push(result[i].id);
                        $scope.contacts.push(result[i]);
                    }
                });
            }
        });
    };

    //remove a contact from email.contacts by dbid
    $scope.closeAlert = function (index, type) {
        if (type == 'contact') {
            $scope.ical.contacts.splice(index, 1);
            $scope.contacts.splice(index, 1);
        }
        else if (type == 'email') {
            $scope.ical.emailsInput.splice(index, 1);
            $scope.emails.splice(index, 1);
        }
    };

    //close dialog ical , init $scope.ical
    $scope.close = function () {
        dialog.close(undefined);
    };

    //sendICal
    $scope.sendICal = function () {
        $scope.validateICal();
        if(a4p.isTrueOrNonEmpty($scope.errorMap)) {
            return;
        }
        dialog.close($scope.ical);
    };

    $scope.setModeEdit = function(modeEdit){
        $scope.modeEdit = modeEdit;
    };

    $scope.validateICal = function() {
        $scope.errorMap = {};
        var emailErrors = [];
        if(($scope.emails.length < 1) && ($scope.ical.contacts.length < 1)) {
            emailErrors.push(srvLocale.translations['htmlRequireOneEmail']);
        }
        for(var i = 0, nbContact = $scope.ical.contacts.length; i < nbContact; i++) {
            var contact = srvData.getObject($scope.ical.contacts[i].dbid);
            if(a4p.isEmptyOrFalse(contact.email)) {
                var fullName = contact.first_name + ' ' + contact.last_name
                emailErrors.push(a4pFormat(srvLocale.translations['htmlNoEmailAddr'], fullName));
            }
        }
        for(var j = 0, nbEmail = $scope.emails.length; j < nbEmail; j++) {
            if(!isEmail($scope.emails[j].email)) {
                emailErrors.push(a4pFormat(srvLocale.translations['htmlInvalidEmail'], $scope.emails[j].email));
            }
        }
        if(emailErrors.length > 0) {
            $scope.errorMap.email = emailErrors;
        }
    };

    function isEmail(email){
        return /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/.test( email );
    }

    /**
     * Initialization
     */
    $scope.initDialogICalCtrl();
}
