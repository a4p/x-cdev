'use strict';

function ctrlEditDialogEmail($scope, srvLocale, srvData, srvConfig, srvFacet, title, attendees, attachments, email, emailId, editable, modeEdit, openDialogFct, $dialog, dialog) {
    /**
     * Helpers
     */

    /**
     * Variables
     */
    $scope.title = title || $scope.srvLocale.translations.htmlTitleDialogEmail;
    $scope.mailLastUpdate = 0;
    $scope.modeEdit = modeEdit;
    $scope.editable = editable;
    $scope.emailInput = '';
    $scope.errorMap = {};
    $scope.openDialogFct = openDialogFct;

    /**
     * Functions
     */
    $scope.initEditDialogEmailCtrl = function () {
        $scope.srvLocale = srvLocale;
        $scope.srvData = srvData;
        $scope.emails = [];// Direct email addresses to send to
        $scope.contacts = [];// Contacts for who email will be sent
        $scope.documents = [];// Documents attached to this email
        $scope.email = email;
        for (var i = 0; i < $scope.email.emailsInput.length; i++) {
            $scope.emails.push($scope.email.emailsInput[i]);
        }
        for (var i = 0; i < $scope.email.contacts.length; i++) {
            var contact = $scope.srvData.getObject($scope.email.contacts[i].dbid);
            $scope.contacts.push(contact);
        }
        for (var i = 0; i < $scope.email.documents.length; i++) {
            var document = $scope.srvData.getObject($scope.email.documents[i].dbid);
            $scope.documents.push(document);
        }

        // Watch on Mail Update
        $scope.$watch('emails.length', function () {
            $scope.setLastUpdate();
        });
        $scope.$watch('contacts.length', function () {
            $scope.setLastUpdate();
        });
        $scope.$watch('documents.length', function () {
            $scope.setLastUpdate();
        });
        $scope.$watch('email.body', function () {
            $scope.setLastUpdate();
        });
    };

    $scope.getTypeColor = function (){
        return c4p.Model.getTypeColor('Document');
    };

    $scope.setLastUpdate = function () {
        $scope.mailLastUpdate = new Date();
    };

    $scope.addEmailToList = function(value) {
        var emailAddrList = value.split(';');
        for (var i= 0, n = emailAddrList.length; i < n; i++) {
            var emailAddr = emailAddrList[i].trim();
            if(emailAddr != '') {
                addKeyToList($scope.email.emailsInput, 'email', {email: emailAddr});
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
            backdropClick: false,
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
                    // reject contacts already attached to this event
                    for (var i = 0; i < $scope.email.contacts.length; i++) {
                        if ($scope.email.contacts[i].dbid == object.id.dbid) return false;
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
        $scope.openDialogFct(dialogOptions, function (result) {
            if (a4p.isDefined(result)) {
                a4p.safeApply($scope, function () {
                    // Synchronize $scope.note.contacts and $scope.contacts
                    //$scope.email.contacts = [];
                    //$scope.contacts = [];
                    for (var i = 0; i < result.length; i++) {
                        $scope.email.contacts.push(result[i].id);
                        $scope.contacts.push(result[i]);
                    }
                });
            }
        });
    };


    //open dialog attachments
    $scope.openDialogAttachments = function () {
        var menus = [];
        var addedDocuments = [];
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
        addedDocuments.push(srvFacet.createEventAttachmentsOrganizer(attachments));
        var dialogOptions = {
            backdropClick: false,
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
                    // reject this email
                    if (emailId && (emailId.dbid == object.id.dbid)) return false;
                    // reject documents already attached to this note
                    for (var i = 0; i < $scope.email.documents.length; i++) {
                        if ($scope.email.documents[i].dbid == object.id.dbid) return false;
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
            resolve.addedDocuments = function () { return []; };
        } else {
            dialogOptions.controller = 'ctrlSelectObjectsDialog';
            dialogOptions.templateUrl = 'partials/dialog/dialogSelectObjects.html';
            resolve.suggestedMenus = function () { return []; };
        }
        dialogOptions.resolve = resolve;
        openDialog(dialogOptions, function (result) {
            if (a4p.isDefined(result)) {
                a4p.safeApply($scope, function () {
                    // Synchronize $scope.note.documents and $scope.documents
                    //$scope.email.documents = [];
                    //$scope.documents = [];
                    for (var i = 0; i < result.length; i++) {
                        $scope.email.documents.push(result[i].id);
                        $scope.documents.push(result[i]);
                    }
                });
            }
        });
    };

    //remove a contact or a document from email.contacts or email.documents by dbid
    $scope.closeAlert = function (index, type) {
        if (type == 'contact') {
            $scope.email.contacts.splice(index, 1);
            $scope.contacts.splice(index, 1);
        }
        else if (type == 'email') {
            $scope.email.emailsInput.splice(index, 1);
            $scope.emails.splice(index, 1);
        }
        else {
            $scope.email.documents.splice(index, 1);
            $scope.documents.splice(index, 1);
        }

    };

    //close dialog email , init $scope.email
    $scope.close = function () {
        dialog.close(undefined);
    };

    $scope.setSubject = function (subject) {
        $scope.email.subject = subject;
    };

    $scope.setBody = function (body) {
        $scope.email.body = body;
    };

    //create email
    $scope.createEmail = function () {
        $scope.validateEmail();
        if(a4p.isTrueOrNonEmpty($scope.errorMap)) {
            return;
        }
    	$scope.email.editable = true;
        dialog.close($scope.email);
    };

    $scope.setModeEdit = function(modeEdit){
    	$scope.modeEdit = modeEdit;
    };

    $scope.validateEmail = function() {
        $scope.errorMap = {};
        var emailErrors = [];
        if(($scope.emails.length < 1) && ($scope.email.contacts.length < 1)) {
            emailErrors.push(srvLocale.translations['htmlRequireOneEmail']);
        }
        for(var i = 0, nbContact = $scope.email.contacts.length; i < nbContact; i++) {
            var contact = srvData.getObject($scope.email.contacts[i].dbid);
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
        if($scope.email.subject.trim() == '') {
            $scope.errorMap.subject = srvLocale.translations['htmlRequiredSubject'];
        }
        if($scope.email.body.trim() == '') {
            $scope.errorMap.message = srvLocale.translations['htmlRequiredMessage'];
        }
    };

    function isEmail(email){
        return /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/.test( email );
    }


    $scope.openDialogPasteNote = function () {
        var menus = [];
        var toPasteDoc = [];
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
        toPasteDoc.push(srvFacet.createEventAttachmentsOrganizer(attachments));
        var dialogOptions = {
            backdropClick: false,
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
                return 'Note';
            },
            initFilter: function () {
                return function (object) {
                    // reject this email
                    if (emailId && (emailId.dbid == object.id.dbid)) return false;
                    // reject documents already attached to this note
                    for (var i = 0; i < $scope.email.documents.length; i++) {
                        if ($scope.email.documents[i].dbid == object.id.dbid) return false;
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
            resolve.toPasteDoc = function () { return []; };
        } else {
            dialogOptions.controller = 'ctrlSelectObjectsDialog';
            dialogOptions.templateUrl = 'partials/dialog/dialogSelectObjects.html';
            resolve.suggestedMenus = function () { return []; };
        }
        dialogOptions.resolve = resolve;
        $scope.openDialogFct(dialogOptions, function (result) {
            if (a4p.isDefined(result)) {
                a4p.safeApply($scope, function () {
                    // Synchronize $scope.note.documents and $scope.documents
                    //$scope.email.documents = [];
                    //$scope.documents = [];
                    for (var i = 0; i < result.length; i++) {
                        $scope.email.body = $scope.email.body + "\n" + result[i].title + "\n" + result[i].description;
                    }
                });
            }
        });
    };

    $scope.openDialogPasteReport = function () {
        var menus = [];
        var toPasteDoc = [];
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
        toPasteDoc.push(srvFacet.createEventAttachmentsOrganizer(attachments));
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
                return 'Report';
            },
            initFilter: function () {
                return function (object) {
                    // reject this email
                    if (emailId && (emailId.dbid == object.id.dbid)) return false;
                    // reject documents already attached to this note
                    for (var i = 0; i < $scope.email.documents.length; i++) {
                        if ($scope.email.documents[i].dbid == object.id.dbid) return false;
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
            resolve.srvFacet = function () {
                return srvFacet;
            };
            resolve.toPasteDoc = function () {
                return [];
            };
        } else {
            dialogOptions.controller = 'ctrlSelectObjectsDialog';
            dialogOptions.templateUrl = 'partials/dialog/dialogSelectObjects.html';
            resolve.suggestedMenus = function () {
                return [];
            };
        }
        dialogOptions.resolve = resolve;
        $scope.openDialogFct(dialogOptions, function (result) {
            if (a4p.isDefined(result)) {
                a4p.safeApply($scope, function () {
                    // Synchronize $scope.note.documents and $scope.documents
                    //$scope.email.documents = [];
                    //$scope.documents = [];
                    for (var i = 0; i < result.length; i++) {
                        $scope.email.body = $scope.email.body + "\n" + result[i].title + "\n" + result[i].description + "\n" + result[i].message;
                    }
                });
            }
        });
    };

    /**
     * Initialization
     */
    $scope.initEditDialogEmailCtrl();
}
