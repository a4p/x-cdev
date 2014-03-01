'use strict';

// Namespace c4p
var c4p;
if (!c4p) c4p = {};

c4p.Synchro = (function () {
    // Constructor
    function Synchro() {
        this.version = "0.1";
    }

    Synchro.NEW = 3;
    Synchro.QUEUE = 2;
    Synchro.NETWORK = 1;
    Synchro.NONE = 0;// Must be ZERO (false test in srvData to know if synchro running or not)

    return Synchro;
})();

var SrvData = (function() {
    function Service(exceptionHandlerService, qService, srvLocalStorage, srvConfig, srvLog, srvLocale, srvSecurity, srvDataTransfer, srvRunning, srvSynchro, srvFileStorage, $rootScope) {
        this.exceptionHandler = exceptionHandlerService;
        this.q = qService;
        this.srvLocalStorage = srvLocalStorage;
        this.srvConfig = srvConfig;
        this.srvLog = srvLog;
        this.srvLocale = srvLocale;
        this.srvSecurity = srvSecurity;
        this.dataTransfer = srvDataTransfer;
        this.srvRunning = srvRunning;
        this.srvSynchro = srvSynchro;
        this.srvFileStorage = srvFileStorage;
        this.rootScope = $rootScope;

        this.callbackHandle = 0;
        this.callbacksUpdate = [];

        // To keep in sync with $a4pTypesInC4PFirst in c4p_create_slim.php
        this.a4pTypesInC4PFirst = ['Note', 'Report'];
        // To keep in sync with A4pForSF::$a4pTypesForSF in c4p.tools.php
        this.a4pTypesForSF = ['Contact', 'Account', 'Event', 'Task', 'Opportunity', 'Lead', 'Document', 'Attendee'];
        this.a4p_methods = {
            'toggleFavorite':{
                icon: 'star-empty',
                iconeToggle:{
                    icon:'star',
                    when:'isTaggedFavorite'
                },
                objectTypes:{
                    'Contact':true,
                    'Account':true,
                    'Event':true,
                    'Task':true,
                    'Opportunity':true,
                    'Lead':true,
                    'Document':true,
                    'Note':true,
                    'Report':true
                },
                mustHaveFavorite:true
            },
            'viewDocument':{
                icon: 'eye-open',
                objectTypes:{
                    'Document':true,
                    'Note':true,
                    'Report':true
                },
                mustBeCreated:true
            },
            'setItemAndGoTimeline':{
                icon: 'tags',
                objectTypes:{
                    'Event':true
                },
                mustHaveBetaOption:'exposeTimeline'
            },
            'setItemAndGoCalendar':{
                icon: 'calendar',
                objectTypes:{
                    'Event':true,
                    'Task':true
                }
            },
            'setItemAndGoMeeting':{
                icon: 'comments',
                objectTypes:{
                    'Event':true
                }
            },
            'shareDocumentByChatter':{
                icon: 'share',
                objectTypes:{
                    'Document':true
                },
                possibleCrms:['sf']
            },
            'shareDocumentByEmail':{
                icon: 'envelope',// TODO : Another icon
                objectTypes:{
                    'Document':true
                },
                possibleCrms:['c4p', 'sf']
            },
            'addDocuments':{// Create Attachee objects (HTML file linking on Document in SF)
                icon: 'paper-clip',
                objectTypes:{
                    'Contact':true,
                    'Account':true,
                    'Event':true,
                    'Opportunity':true
                },
                mustBeOwner:true
            },
            'addContacts':{// Create Attendee objects
                icon: 'user',
                objectTypes:{
                    'Event':true
                },
                mustBeOwner:true
            },
            'createNewEmail':{
                icon: 'envelope',
                objectTypes:{
                    'Contact':true,
                    'Account':true,
                    'Event':true,
                    'Opportunity':true
                },
                mustBeOwner:true
            },
            'sendICal':{
                icon: 'group',
                objectTypes: {
                    'Event':true
                },
                mustBeOwner:true,
                mustBeInFuture:true
            },
            'createNewPicture':{
                icon: 'camera',
                objectTypes:{
                    'Contact':true,
                    'Account':true,
                    'Event':true,
                    'Opportunity':true
                },
                mustBeOwner:true
            },
            'createNewNote':{
                icon: 'comment',
                objectTypes:{
                    'Contact':true,
                    'Account':true,
                    'Event':true,
                    'Opportunity':true
                },
                mustBeOwner:true
            },
            'createNewReport':{
                icon: 'book',
                objectTypes:{
                    'Contact':true,
                    'Account':true,
                    'Event':true,
                    'Opportunity':true
                },
                mustBeOwner:true
            },
            'editItem':{
                icon: 'pencil',
                objectTypes:{
                    'Facet':true,
                    'Contact':true,
                    'Account':true,
                    'Event':true,
                    'Task':true,
                    'Opportunity':true,
                    'Lead':true,
                    'Document':true,
                    'Note':true,
                    'Report':true
                },
                mustBeOwner:true
            },
            'dupMeeting':{
                icon: 'plus',
                objectTypes:{
                    'Event':true
                },
                mustBeOwner:true
            }
        };

        this.isDemo = false;// demo mode of last downloadFullMap
        this.originalDbIndex = {};// global index of all original objects via dbid
        this.index = {
            'db':{},
            'sf':{},
            'ios':{},
            'c4p':{}
        };
        this.userId = {'sf_id':'005i0000000I8c5AAC', 'c4p_id':'demo@apps4pro.com'};
        a4p.InternalLog.log('srvData', 'constructor : userId=' + a4pDumpData(this.userId, 2));
        this.userObject = undefined;
        this.favoritesObject = undefined;
        this.currentItems = {};
        this.originalItems = {};
        var i, type;
        for (i=0; i<c4p.Model.allTypes.length; i++) {
            type = c4p.Model.allTypes[i];
            this.currentItems[type] = [];
            this.originalItems[type] = [];
        }
        this.lastRefreshMindMap = 0;
        this.nbObjects = 0;
        this.objectsToSave = [];
        this.objectsToDownload = [];
        this.savingObject = {};
        this.initDone = false;
    }

    // a4p_methods Helper functions

    Service.prototype.isMethodPossibleForObject = function (methodName, object) {
        var methodDesc = this.a4p_methods[methodName];
        return !!methodDesc.objectTypes[object.a4p_type];
    };

    Service.prototype.getMethodIcon = function (methodName, object) {
        var methodDesc = this.a4p_methods[methodName];
        var icon = methodDesc.icon;
        if (a4p.isDefined(methodDesc.iconeToggle) && a4p.isDefined(this[methodDesc.iconeToggle.when])) {
            if (this[methodDesc.iconeToggle.when](object)) {
                icon = methodDesc.iconeToggle.icon;
            }
        }
        return icon;
    };

    Service.prototype.isMethodDisabledForObject = function (methodName, object) {
        var methodDesc = this.a4p_methods[methodName];
        var disabled = false;
        if (methodDesc.mustBeOwner && !this.isObjectOwnedByUser(object)) {
            disabled = true;
        } else if (a4p.isDefined(methodDesc.mustHaveFavorite) && !this.favoritesObject) {
            disabled = true;
        } else if (a4p.isDefined(methodDesc.mustHaveBetaOption) && !this.srvConfig.c4pConfig[methodDesc.mustHaveBetaOption]) {
            disabled = true;
        } else if (a4p.isDefined(methodDesc.mustBeCreated) && (object.c4p_synchro.creating || object.c4p_synchro.reading)) {
            disabled = true;
        } else if(a4p.isDefined(methodDesc.mustBeInFuture) && a4p.isDefined(object.date_start)) {
            var date = new Date();
            if(a4pDateParse(object.date_start).getTime() < date.getTime()) {
                disabled = true;
            }
        } else if (a4p.isDefinedAndNotNull(methodDesc.possibleCrms)) {
            var enabled = false;
            for (var j= 0, max=methodDesc.possibleCrms.length; j < max; j++) {
                var crm = methodDesc.possibleCrms[j];
                if (isValueInList(this.srvConfig.getActiveCrms(), crm)) {
                    enabled = true;
                    break;
                }
            }
            if (!enabled) disabled = true;
        }
        return disabled;
    };

    Service.prototype.isTaggedFavorite = function (object) {
        if (a4p.isUndefinedOrNull(object)) return false;
        if (a4p.isUndefinedOrNull(this.favoritesObject)) return false;
        return this.hasDirectNamedLinkTo('Facet', 'faceted', this.favoritesObject, object);
    };

    Service.prototype.toggleFavorite = function (object) {
        if (a4p.isUndefinedOrNull(object)) return false;
        if (a4p.isUndefinedOrNull(this.favoritesObject)) return false;
        if (this.hasDirectNamedLinkTo('Facet', 'faceted', this.favoritesObject, object)) {
            this.unlinkFromItem('Facet', 'faceted', [this.favoritesObject], object);
        } else {
            this.linkToItem('Facet', 'faceted', [this.favoritesObject], object);
        }
        return true;
    };

    /**
     * Add a callback function which will be called each time srvData is cleared, initialized or there is a add/set/remove object.
     * Callback function will be called with 2 or 4 arguments : handle, action, type, id.
     * the first argument 'handle' is the listen handle of this callback (needed to cancel listener).
     * the second argument 'action' can be 'clear', 'init', 'add', 'set' or 'remove'
     * the third argument 'type' is defined only for actions 'add', 'set' or 'remove' and gives the object type
     * the fourth argument 'id' is defined only for actions 'add', 'set' or 'remove' and gives the object id.dbid
     *
     * @param fct
     * @returns {number}
     */
    Service.prototype.addListenerOnUpdate = function (fct) {
        this.callbackHandle++;
        this.callbacksUpdate.push({id:this.callbackHandle, callback:fct});
        return this.callbackHandle;
    };

    Service.prototype.cancelListener = function (callbackHandle) {
        return (removeIdFromList(this.callbacksUpdate, callbackHandle) !== false);
    };

    function triggerUpdate(self, action, type, id) {
        var callbacks = self.callbacksUpdate.slice(0);// Copy to be independant of updates
        for (var idx = 0, max = callbacks.length; idx < max; idx++) {
            try {
                callbacks[idx].callback(callbacks[idx].id, action, type, id);
            } catch (e) {
                self.exceptionHandler(e, "SrvData.callbacksUpdate#" + idx);
            }
        }
    }

    Service.prototype.clear = function () {
        a4p.InternalLog.log('srvData', "clearData : " + this.nbObjects + " objects");

        this.srvSynchro.clearChannel('data');

        a4p.initUid();
        this.isDemo = false;// demo mode of last downloadFullMap
        this.srvLocalStorage.set('Data-isDemo', this.isDemo);
        this.originalDbIndex = {};// global index of all original objects via dbid
        this.index = {
            'db':{},
            'sf':{},
            'ios':{},
            'c4p':{}
        };
        this.userId = {'sf_id':'005i0000000I8c5AAC', 'c4p_id':'demo@apps4pro.com'};
        this.userObject = undefined;
        this.favoritesObject = undefined;
        this.srvLocalStorage.set('Data-userId', this.userId);
        a4p.InternalLog.log('srvData', 'clear : userId=' + a4pDumpData(this.userId, 2));
        this.currentItems = {};
        this.originalItems = {};
        var i, type;
        for (i=0; i<c4p.Model.allTypes.length; i++) {
            type = c4p.Model.allTypes[i];
            this.currentItems[type] = [];
            this.srvLocalStorage.set('Data-'+type, this.currentItems[type]);
            this.originalItems[type] = [];
            this.srvLocalStorage.set('Data-Original'+type, this.originalItems[type]);
/*
            if (a4p.isDefined(c4p.Model.files[type])) {
                for (var j=0; j<this.currentItems[type].length; j++) {
                    var oldObject = this.currentItems[type][j];
                    var oldObject = deletedItems[0];
                    var onRemoveSuccess = function() {
                        var msg = 'File ' + oldObject.filePath + ' successfully removed from file storage';
                        this.srvLog.logSuccess(this.srvConfig.c4pConfig.exposeFileStorage,
                            this.srvLocale.translations.htmlMsgRemoveFileOK, msg);
                    };
                    var onRemoveFailure = function(message) {
                        var msg = 'Removing file ' + oldObject.filePath + ' from file storage failure : ' + message;
                        this.srvLog.logInfo(this.srvConfig.c4pConfig.exposeFileStorage,
                            this.srvLocale.translations.htmlMsgRemoveFilePb, msg);
                    };
                    this.srvFileStorage.deleteFile(oldObject.filePath,
                        onRemoveSuccess,
                        onRemoveFailure);
                    // Until the end of this future, file will be accessible (still at old place)
                }
            }
*/
        }
        this.lastRefreshMindMap = 0;
        this.srvLocalStorage.set('Data-lastRefreshMindMap', this.lastRefreshMindMap);

        this.nbObjects = 0;
        this.objectsToSave = [];
        this.srvLocalStorage.set('Data-objectsToSave', this.objectsToSave);

        this.objectsToDownload = [];
        this.srvLocalStorage.set('Data-objectsToDownload', this.objectsToDownload);

        this.savingObject = {};
        this.srvLocalStorage.set('Data-savingObject', this.savingObject);

        var self = this;
        var onRemoveSuccess = function() {
            var msg = 'File storage successfully cleared';
            self.srvLog.logSuccess(self.srvConfig.c4pConfig.exposeFileStorage,
                self.srvLocale.translations.htmlMsgClearFileStorageOK, msg);
        };
        var onRemoveFailure = function(message) {
            var msg = 'File storage clearing failure : ' + message;
            self.srvLog.logInfo(self.srvConfig.c4pConfig.exposeFileStorage,
                self.srvLocale.translations.htmlMsgClearFileStoragePb, msg);
        };
        this.srvFileStorage.deleteFullDir('/a4p/c4p/doc',
            onRemoveSuccess,
            onRemoveFailure);
        // Until the end of this future, files will be accessible (still at old place)
        triggerUpdate(this, 'clear');
    };
    Service.prototype.init = function () {
        if (this.initDone) return;

        var i, j, type, object, self = this;
        a4p.initUid(this.srvLocalStorage.get('Data-Uid', '000'));
        this.isDemo = this.srvLocalStorage.get('Data-isDemo', false);
        this.originalDbIndex = {};// global index of all original objects via dbid
        this.index = {
            'db':{},
            'sf':{},
            'ios':{},
            'c4p':{}
        };
        this.userId = this.srvLocalStorage.get('Data-userId', {'sf_id':'005i0000000I8c5AAC', 'c4p_id':'demo@apps4pro.com'});
        a4p.InternalLog.log('srvData', 'init : a4p.uid=' + a4p.getUid() + ' userId=' + a4pDumpData(this.userId, 2));
        this.userObject = this.srvLocalStorage.get('Data-userObject', undefined);
        this.favoritesObject = this.srvLocalStorage.get('Data-favoritesObject', undefined);
        this.currentItems = {};
        this.originalItems = {};
        this.nbObjects = 0;

        this.lastRefreshMindMap = this.srvLocalStorage.get('Data-lastRefreshMindMap', 0);
        this.objectsToSave = this.srvLocalStorage.get('Data-objectsToSave', []);
        this.objectsToDownload = this.srvLocalStorage.get('Data-objectsToDownload', []);
        this.savingObject = this.srvLocalStorage.get('Data-savingObject', {});

        // Indexation objets originaux
        for (i=0; i<c4p.Model.allTypes.length; i++) {
            type = c4p.Model.allTypes[i];
            this.originalItems[type] = this.srvLocalStorage.get('Data-Original'+type, []);
            for (j=0; j<this.originalItems[type].length; j++) {
                object = this.originalItems[type][j];
                this.originalDbIndex[object.id.dbid] = object;
            }
        }

        // Indexation objets courants
        for (i=0; i<c4p.Model.allTypes.length; i++) {
            type = c4p.Model.allTypes[i];
            this.currentItems[type] = this.srvLocalStorage.get('Data-'+type, []);
            this.nbObjects += this.currentItems[type].length;
            for (j=0; j<this.currentItems[type].length; j++) {
            	object = this.currentItems[type][j];
                if (!this.isObjectToSave(object.id.dbid)) {
                    if (object.toSaveWhenCrm) {
                        // Retry a Save of object
                        delete object.toSaveWhenCrm;
                        // Add in queue to be saved
                        var fromObject = this.originalDbIndex[object.id.dbid];
                        var diffResult = diffObject(fromObject, object);
                        // BEWARE : note, feed and email attributes of Document object are not checked into diffObject() =>
                        if (diffResult == null) {
                            // no change
                            if (type == 'Document') {
                                if (a4p.isTrueOrNonEmpty(object.feed)) {
                                    if (object.c4p_synchro.sharing == c4p.Synchro.NONE) {
                                        object.c4p_synchro.sharing = c4p.Synchro.NEW;
                                    }
                                }
                            }
                        } else if (diffResult == 'new') {
                            // new
                            object.c4p_synchro.creating = c4p.Synchro.NEW;
                            if (type == 'Document') {
                                if (a4p.isTrueOrNonEmpty(object.feed)) {
                                    if (object.c4p_synchro.sharing == c4p.Synchro.NONE) {
                                        object.c4p_synchro.sharing = c4p.Synchro.NEW;
                                    }
                                }
                            }
                        } else if (diffResult == 'delete') {
                            // delete
                            if (object.c4p_synchro.deleting == c4p.Synchro.NONE) {
                                if ((object.c4p_synchro.creating == c4p.Synchro.NEW)
                                    || (object.c4p_synchro.creating == c4p.Synchro.QUEUE)) {
                                    // delete NOW the object if its creation has not been sent yet
                                    // Remove objects created but not already saved or in saving state
                                    this.currentItems[type].splice(j, 1);
                                    this.nbObjects--;
                                    j--;
                                    continue;
                                }
                                object.c4p_synchro.deleting = c4p.Synchro.NEW;
                                if ((object.c4p_synchro.writing == c4p.Synchro.NEW)) {
                                    // Cancel any update
                                    object.c4p_synchro.writing = c4p.Synchro.NONE;
                                }
                            }
                        } else {
                            // update
                            if (object.c4p_synchro.writing == c4p.Synchro.NONE) {
                                object.c4p_synchro.writing = c4p.Synchro.NEW;
                            }
                            if (type == 'Document') {
                                if (a4p.isTrueOrNonEmpty(object.feed)) {
                                    if (object.c4p_synchro.sharing == c4p.Synchro.NONE) {
                                        object.c4p_synchro.sharing = c4p.Synchro.NEW;
                                    }
                                }
                            }
                        }

                        if (a4p.isTrueOrNonEmpty(object.feed) && (object.c4p_synchro.sharing == c4p.Synchro.NEW)) {
                            object.c4p_synchro.sharing = c4p.Synchro.QUEUE;
                        }
                        if (object.c4p_synchro.creating == c4p.Synchro.NEW) {
                            object.c4p_synchro.creating = c4p.Synchro.QUEUE;
                        }
                        if (object.c4p_synchro.writing == c4p.Synchro.NEW) {
                            object.c4p_synchro.writing = c4p.Synchro.QUEUE;
                        }
                        if (object.c4p_synchro.deleting == c4p.Synchro.NEW) {
                            object.c4p_synchro.deleting = c4p.Synchro.QUEUE;
                        }
                        this.objectsToSave.push({
                            'type':type,
                            'dbid':object.id.dbid
                        });
                        this.srvLocalStorage.set('Data-objectsToSave', this.objectsToSave);
                    } else {
                        // Erase objects modified but not already in saving state
                        if (a4p.isEmptyOrFalse(this.originalDbIndex[object.id.dbid])) {
                            // Remove objects created but not already saved or in saving state
                            this.currentItems[type].splice(j, 1);
                            this.nbObjects--;
                            j--;
                            continue;
                        } else {
                            // BEWARE : we must recreate all attributes not saved in originalDbIndex
                            object = copyObject(this.originalDbIndex[object.id.dbid]);
                            object.c4p_synchro = {
                                creating : c4p.Synchro.NONE,
                                sharing : c4p.Synchro.NONE,
                                writing : c4p.Synchro.NONE,
                                reading : c4p.Synchro.NONE,
                                deleting : c4p.Synchro.NONE
                            };
                            this.completeFields(object);
                            if (this.isObjectToDownload(object.id.dbid)) {
                                object.c4p_synchro.reading = c4p.Synchro.QUEUE;
                            }
                            this.currentItems[type][j] = object;
                        }
                    }
                }
                this.index.db[object.id.dbid] = object;
                /* ccn_future
                for (var mergeIdx = 0; mergeIdx < object.crmObjects.length; mergeIdx++) {
                    var merge = object.crmObjects[mergeIdx];
                    this.index[merge.crmId.crm][merge.crmId.id] = object;
                }
                */
                if (a4p.isDefined(object.id)) {
                    if (a4p.isDefined(object.id.sf_id)) {
                        this.index.sf[object.id.sf_id] = object;
                    }
                    if (a4p.isDefined(object.id.c4p_id)) {
                        this.index.c4p[object.id.c4p_id] = object;
                    }
                }
            }
            this.srvLocalStorage.set('Data-'+type, this.currentItems[type]);
        }

        // Add objects deleted but not already saved or in saving state
        for (i=0; i<c4p.Model.allTypes.length; i++) {
            type = c4p.Model.allTypes[i];
            for (j=0; j<this.originalItems[type].length; j++) {
                var originalObject = this.originalItems[type][j];
                object = this.index.db[originalObject.id.dbid];
                if (a4p.isUndefined(object) && !this.isObjectToSave(originalObject.id.dbid)) {
                    object = copyObject(originalObject);
                    this.currentItems[type].push(object);
                    this.nbObjects++;
                    // TODO : update indexes also ?
                }
            }
            this.srvLocalStorage.set('Data-'+type, this.currentItems[type]);
        }

        // BEWARE : objects were copies of originals when restored from localstorage
        if (a4p.isDefinedAndNotNull(this.userObject)) {
            this.userObject = this.index.db[this.userObject.id.dbid];
        } else {
            this.userObject = undefined;
        }
        if (a4p.isDefinedAndNotNull(this.favoritesObject)) {
            this.favoritesObject = this.index.db[this.favoritesObject.id.dbid];
        } else {
            this.favoritesObject = undefined;
        }

        this.srvConfig.init();// Useless because we need to call startLoading() already done by ctrlNavigation
        this.srvLog.init();
        this.srvLocale.init();
        this.srvSynchro.init();// Must be initialized() AFTER srvFileStorage
        this.srvSynchro.clearChannel('data');
        this.srvSynchro.setPingUrl(this.srvConfig.c4pUrlPing);

        this.synchroListenerOnStart = this.srvSynchro.addListenerOnStart('data', function (callbackId, requestId, requestCtx, requestNbTry) {
            onSynchroStart(self, callbackId, requestId, requestCtx, requestNbTry);
        });
        this.synchroListenerOnCancel = this.srvSynchro.addListenerOnCancel('data', function (callbackId, requestId, requestCtx, requestNbTry) {
            // Also called upon clearChannel()
            onSynchroCancel(self, callbackId, requestId, requestCtx, requestNbTry);
        });
        this.synchroListenerOnError = this.srvSynchro.addListenerOnError('data', function (callbackId, requestId, requestCtx, requestNbTry, message) {
            onSynchroError(self, callbackId, requestId, requestCtx, requestNbTry, message);
        });
        this.synchroListenerOnSuccess = this.srvSynchro.addListenerOnSuccess('data', function (callbackId, requestId, requestCtx, requestNbTry, responseStatus, responseData, responseHeaders) {
            onSynchroSuccess(self, callbackId, requestId, requestCtx, requestNbTry, responseStatus, responseData, responseHeaders);
        });
        this.runningListenerOnPause = this.srvRunning.addListenerOnPause(function (callbackId, value) {
            onRunningPause(self, callbackId, value);
        });

        this.initDone = true;
        a4p.InternalLog.log('srvData', "initialized");
        triggerUpdate(this, 'init');
    };
    Service.prototype.start = function () {
        this.init();
        // Send object to save ONLY after ALL downloads are done (because new object can link on document not yet downloaded)
        if (!getFirstObjectToDownload(this)) {
            sendFirstObjectToSave(this);
        }
    };
    // TODO : call this from ctrlNavigation.$on('$destroy') ?
    Service.prototype.destroy = function () {
        this.srvSynchro.cancelListener(this.synchroListenerOnStart);
        this.srvSynchro.cancelListener(this.synchroListenerOnCancel);
        this.srvSynchro.cancelListener(this.synchroListenerOnError);
        this.srvSynchro.cancelListener(this.synchroListenerOnSuccess);
        this.srvRunning.cancelListener(this.runningListenerOnPause);
    };

    function onRunningPause(self, callbackId, value) {
        if (value) {
            a4p.InternalLog.log('srvData', "pause begin");
            self.srvLocalStorage.set('Data-Uid', a4p.getUid());
            self.srvLocalStorage.set('Data-isDemo', self.isDemo);
            self.srvLocalStorage.set('Data-userId', self.userId);
            self.srvLocalStorage.set('Data-userObject', self.userObject);
            self.srvLocalStorage.set('Data-favoritesObject', self.favoritesObject);
            for (var i=0; i<c4p.Model.allTypes.length; i++) {
                var type = c4p.Model.allTypes[i];
                self.srvLocalStorage.set('Data-'+type, self.currentItems[type]);
                self.srvLocalStorage.set('Data-Original'+type, self.originalItems[type]);
            }
            self.srvLocalStorage.set('Data-lastRefreshMindMap', self.lastRefreshMindMap);
            self.srvLocalStorage.set('Data-objectsToSave', self.objectsToSave);
            self.srvLocalStorage.set('Data-objectsToDownload', self.objectsToDownload);
            self.srvLocalStorage.set('Data-savingObject', self.savingObject);
            a4p.InternalLog.log('srvData', "data saved in srvLocalStorage");
        } else {
            a4p.InternalLog.log('srvData', "pause ended");
        }
    };

    function onSynchroStart(self, callbackId, requestId, requestCtx, requestNbTry) {
        self.srvLog.logInfo(self.srvConfig.c4pConfig.exposeDataSynchro, requestCtx.title + ' started try#' + requestNbTry, '');
        // requestCtx = {type:'Report', title:title, dbid:object.id.dbid};
        if (a4p.isDefined(requestCtx.dbid)) {
            a4p.safeApply(self.rootScope, function() {
                var object = self.getObject(requestCtx.dbid);
                if (requestCtx.type == 'Create') {
                    if (a4p.isDefined(object) && (object.c4p_synchro.creating == c4p.Synchro.QUEUE)) {
                        object.c4p_synchro.creating = c4p.Synchro.NETWORK;
                    }
                } else if (requestCtx.type == 'Update') {
                    if (a4p.isDefined(object) && (object.c4p_synchro.writing == c4p.Synchro.QUEUE)) {
                        object.c4p_synchro.writing = c4p.Synchro.NETWORK;
                    }
                } else if (requestCtx.type == 'Delete') {
                    // Beware object is no more here if it has been removed via removeObject()
                    if (a4p.isDefined(object) && (object.c4p_synchro.deleting == c4p.Synchro.QUEUE)) {
                        object.c4p_synchro.deleting = c4p.Synchro.NETWORK;
                    }
                } else if (requestCtx.type == 'Share') {
                    if (a4p.isDefined(object) && (object.c4p_synchro.sharing == c4p.Synchro.QUEUE)) {
                        object.c4p_synchro.sharing = c4p.Synchro.NETWORK;
                    }
                } else if (requestCtx.type == 'Email') {
                    // TODO : should it be c4p_synchro.creating ?
                    if (a4p.isDefined(object) && (object.c4p_synchro.writing == c4p.Synchro.QUEUE)) {
                        object.c4p_synchro.writing = c4p.Synchro.NETWORK;
                    }
                } else if (requestCtx.type == 'Note') {
                    // TODO : should it be c4p_synchro.creating ?
                    if (a4p.isDefined(object) && (object.c4p_synchro.writing == c4p.Synchro.QUEUE)) {
                        object.c4p_synchro.writing = c4p.Synchro.NETWORK;
                    }
                } else if (requestCtx.type == 'Download') {
                    if (a4p.isDefined(object) && (object.c4p_synchro.reading == c4p.Synchro.QUEUE)) {
                        object.c4p_synchro.reading = c4p.Synchro.NETWORK;
                    }
                } else if (requestCtx.type == 'Attachment') {
                    // Ignore answers ... we wait for 'Email' or 'Note' body
                }
                // NOTA : synchro status not saved in local storage, because it lasts only during network request
            });
        }
    }
    function onSynchroCancel(self, callbackId, requestId, requestCtx, requestNbTry) {
        self.srvLog.logInfo(self.srvConfig.c4pConfig.exposeDataSynchro, requestCtx.title + ' cancelled try#' + requestNbTry, '');
        if (requestCtx.type == 'Create') {
            onCreateFailure(self, requestCtx);
        } else if (requestCtx.type == 'Update') {
            onUpdateFailure(self, requestCtx);
        } else if (requestCtx.type == 'Delete') {
            onDeleteFailure(self, requestCtx);
        } else if (requestCtx.type == 'Download') {
            onDownloadFailure(self, requestCtx);
        } else if (requestCtx.type == 'Attachment') {
            // Ignore answers ... we wait for 'Email body in event ' or 'Note '
            // TODO : verify if we should not go to next request ?
            //sendNextObjectToSave(self);
        } else if (requestCtx.type == 'Share') {
            onShareFailure(self, requestCtx);
        } else if (requestCtx.type == 'Email') {
            onEmailFailure(self, requestCtx);
        } else if (requestCtx.type == 'Note') {
            onNoteFailure(self, requestCtx);
        }
    }
    function onSynchroError(self, callbackId, requestId, requestCtx, requestNbTry, message) {
        // => automatically retry by srvSynchro
        self.srvSynchro.serverHs();
        a4p.safeApply(self.rootScope, function() {
            a4p.InternalLog.log('srvData', "onSynchroError: requestNbTry=" + requestNbTry + " requestCtx=" + a4pDumpData(requestCtx, 2) + "message=" + message);
            // TODO : cancel request if too many errors ?
            // TODO : propose user with cancelling task upon failure ?
            // self.synchro.cancelRequest(requestId);
            if (requestNbTry > 3) {
                self.srvLog.logWarning(self.srvConfig.c4pConfig.exposeDataSynchro,
                    requestCtx.title + ' failed try#' + requestNbTry + ' : cancelled', message);
                self.srvSynchro.cancelRequest(requestId);
            } else {
                // Retry this request : this is done automatically by srvSynchro
                //sendFirstObjectToSave(self);
                self.srvLog.logWarning(self.srvConfig.c4pConfig.exposeDataSynchro,
                    requestCtx.title + ' failed try#' + requestNbTry + ' : retry', message);
            }
        });
    }
    function onSynchroSuccess(self, callbackId, requestId, requestCtx, requestNbTry, responseStatus, responseData, responseHeaders) {
        // => automatically NO MORE retry by srvSynchro
        /*
        a4p.InternalLog.log('srvData', "onSynchroSuccess: requestNbTry=" + requestNbTry + " requestCtx=" + a4pDumpData(requestCtx, 2)
            + " responseStatus=" + responseStatus
            + " responseData=" + a4pDumpData(responseData, 3));
        */
        if (requestCtx.type != 'Download') {
            // responseData is BINARY data in case of 'Download'
            // In case of Redirect or Error (network or server)
            var diag = checkErrorData(responseData);
            if (diag) {
                // BEWARE : DO self.srvSynchro.tryAgainCurrentRequest() IMMEDIATLY (and not in safeApply),
                // because srvSynchro uses it as soon as you return from this callback.
                if (diag.maintenance) {
                    // Server is not yet ready, retry later
                    self.srvSynchro.serverHs();
                    self.srvSynchro.tryAgainCurrentRequest();
                } else if (diag.redirect) {
                } else {
                    if (requestNbTry <= 3) {
                        self.srvSynchro.tryAgainCurrentRequest();
                    }
                }
                a4p.safeApply(self.rootScope, function() {
                    if (diag.maintenance) {
                        // Server is not yet ready, retry later
                        self.srvLog.logWarning(self.srvConfig.c4pConfig.exposeDataSynchro,
                            requestCtx.title + ' failed try#' + requestNbTry + ' (server in status "' + diag.maintenance + '") : retry', diag.log);
                    } else if (diag.redirect) {
                        // Ignore the redirect and do not retry this request
                        self.srvLog.logWarning(self.srvConfig.c4pConfig.exposeDataSynchro,
                            requestCtx.title + ' redirected try#' + requestNbTry + ' : cancelled', diag.log);
                        // TODO : propose the redirect URL (SalesForce login page ?)
                        //openChildBrowser(diag.redirect, 'url', function() {
                        //    a4p.safeApply(self.rootScope, function() {
                        //      self.rootScope.refreshClient();
                        //    });
                        //});
                        sendNextObjectToSave(self);
                    } else {
                        var errorMsg = '';
                        if (a4p.isDefined(diag.error) && a4p.isDefined(self.srvLocale.translations[diag.error])) {
                            errorMsg = self.srvLocale.translations[diag.error];
                        } else {
                            errorMsg = diag.error;
                        }
                        if (requestNbTry > 3) {
                            // Abandon this request et pass to the next ASAP because we are sure this error will not disappear
                            self.srvLog.logWarning(self.srvConfig.c4pConfig.exposeDataSynchro,
                                requestCtx.title + ' failed try#' + requestNbTry + ' (' + errorMsg + ') : cancelled', diag.log);
                            sendNextObjectToSave(self);
                        } else {
                            // Retry this request
                            self.srvLog.logWarning(self.srvConfig.c4pConfig.exposeDataSynchro,
                                requestCtx.title + ' failed try#' + requestNbTry + ' (' + errorMsg + ') : retry',  diag.log);
                            //sendFirstObjectToSave(self);
                        }
                    }
                });
                return;
            }
        }
        // NOW we can delay execution of code
        a4p.safeApply(self.rootScope, function() {
            // In case of Success
            self.srvLog.logSuccess(self.srvConfig.c4pConfig.exposeDataSynchro, requestCtx.title + ' success', '');

            if (requestCtx.type == 'Create') {
                onCreateSuccess(self, requestCtx, responseData);
            } else if (requestCtx.type == 'Update') {
                onUpdateSuccess(self, requestCtx, responseData);
            } else if (requestCtx.type == 'Delete') {
                onDeleteSuccess(self, requestCtx, responseData);
            } else if (requestCtx.type == 'Download') {
                // responseStatus gives the fileUrl (result of fileEntry.toURL())
                onDownloadSuccess(self, requestCtx, responseStatus);
            } else if (requestCtx.type == 'Attachment') {
                // Ignore answers ... we wait for 'Email body in event ' or 'Note '
            } else if (requestCtx.type == 'Share') {
                onShareSuccess(self, requestCtx, responseData);
            } else if (requestCtx.type == 'Email') {
                onEmailSuccess(self, requestCtx, responseData);
            } else if (requestCtx.type == 'Note') {
                onNoteSuccess(self, requestCtx, responseData);
            }
        });
    }

    function onCreateSuccess(self, requestCtx, responseData) {
        var object = self.getObject(requestCtx.dbid);
        var askedCreated = responseData['askedCreated'];
        var created = responseData['created'];
        var errors = responseData['errors'];
        // errors is not here if it is an uploadFile
        if (a4p.isTrueOrNonEmpty(errors)) {
            a4p.ErrorLog.log('srvData', 'reject creating parts of item '
                + requestCtx.dbid + ' : ' + a4pDumpData(errors, 1));
        }
        // askedCreated and created are not here if it is an uploadFile without uploadFileInCrm parameter
        if (a4p.isDefined(object)) {
            // Update creating synchro status
            object.c4p_synchro.creating = c4p.Synchro.NONE;
            createdObject(self, requestCtx.dbid, askedCreated, created);
        } else {
            // Object has been deleted during the request
            a4p.InternalLog.log('srvData', 'create success on unknown object ' + requestCtx.dbid + ' : object has been deleted during the request');
        }
        sendNextObjectToSave(self);
    }
    function onCreateFailure(self, requestCtx) {
        var object = self.getObject(requestCtx.dbid);
        if (a4p.isDefined(object)) {
            // Update creating synchro status
            object.c4p_synchro.creating = c4p.Synchro.NONE;
            // TODO : send delete request on CRMs where create was successfull
            var deleted = [];
            var askedCrms = self.srvConfig.getActiveCrms() || [];
            for (var i = 0, nb = askedCrms.length; i < nb; i++) {
                var crm = askedCrms[i];
                var id = object.id[crm+'_id'];
                delete self.index[crm][id];
                deleted.push({crm:crm,id:id});
            }
            deletedObject(self, requestCtx.dbid, askedCrms, deleted, false);
        } else {
            // Object has been deleted during the request
            a4p.InternalLog.log('srvData', 'create failure on unknown object ' + requestCtx.dbid + ' : object has been deleted during the request');
        }
        sendNextObjectToSave(self);
    }

    function onUpdateSuccess(self, requestCtx, responseData) {
        var object = self.getObject(requestCtx.dbid);
        var askedUpdated = responseData['askedUpdated'];
        var updated = responseData['updated'];
        var errors = responseData['errors'];
        if (a4p.isTrueOrNonEmpty(errors)) {
            a4p.ErrorLog.log('srvData', 'reject updating parts of item '
                + requestCtx.dbid + ' : ' + a4pDumpData(errors, 1));
        }
        if (a4p.isDefined(object)) {
            // Update writing synchro status
            object.c4p_synchro.writing = c4p.Synchro.NONE;
            updatedObject(self, requestCtx.dbid, askedUpdated, updated);
        } else {
            // Object has been deleted during the request
            a4p.InternalLog.log('srvData', 'update success on unknown object ' + requestCtx.dbid + ' : object has been deleted during the request');
        }
        sendNextObjectToSave(self);
    }
    function onUpdateFailure(self, requestCtx) {
        var object = self.getObject(requestCtx.dbid);
        if (a4p.isDefined(object)) {
            // Update writing synchro status
            object.c4p_synchro.writing = c4p.Synchro.NONE;
            self.srvLocalStorage.set('Data-'+object.a4p_type, self.currentItems[object.a4p_type]);
            // TODO : do what about this object not updated ?
        } else {
            // Object has been deleted during the request
            a4p.InternalLog.log('srvData', 'update failure on unknown object ' + requestCtx.dbid + ' : object has been deleted during the request');
        }
        sendNextObjectToSave(self);
    }

    function onDeleteSuccess(self, requestCtx, responseData) {
        var object = self.getObject(requestCtx.dbid);
        var askedDeleted = responseData['askedDeleted'];
        var deleted = responseData['deleted'];
        var errors = responseData['errors'];
        if (a4p.isTrueOrNonEmpty(errors)) {
            a4p.ErrorLog.log('srvData', 'reject deleting parts of item '
                + requestCtx.dbid + ' : ' + a4pDumpData(errors, 1));
        }
        if (a4p.isDefined(object)) {
            // Update deleting synchro status
            object.c4p_synchro.deleting = c4p.Synchro.NONE;
            // Remove the object only NOW and not in removeObject()
            deletedObject(self, requestCtx.dbid, askedDeleted, deleted, false);
        } else {
            // Object has been deleted during the request
            a4p.InternalLog.log('srvData', 'delete success on unknown object ' + requestCtx.dbid + ' : object has been deleted during the request');
        }
        sendNextObjectToSave(self);
    }
    function onDeleteFailure(self, requestCtx) {
        var object = self.getObject(requestCtx.dbid);
        if (a4p.isDefined(object)) {
            // Update deleting synchro status
            object.c4p_synchro.deleting = c4p.Synchro.NONE;
            self.srvLocalStorage.set('Data-'+object.a4p_type, self.currentItems[object.a4p_type]);
            // TODO : do what about this object not updated ?
        } else {
            // Object has been deleted during the request
            a4p.InternalLog.log('srvData', 'delete failure on unknown object ' + requestCtx.dbid + ' : object has been deleted during the request');
        }
        sendNextObjectToSave(self);
    }

    function onDownloadSuccess(self, requestCtx, responseStatus) {
        var object = self.getObject(requestCtx.dbid);
        if (a4p.isDefined(object)) {
            if ((object.a4p_type == 'Document') && (a4p.isDefined(object.email))) {
                delete object.email;
            }
            // responseStatus gives the fileUrl (result of fileEntry.toURL())
            object.fileUrl = responseStatus;
            a4p.InternalLog.log('srvData', 'Document ' + object.filePath + ' has after download fileUrl=' + object.fileUrl);
            if (c4p.Model.isImage(object.extension)) {
                object.thumb_url = object.fileUrl;
                a4p.InternalLog.log('srvData', 'Image ' + object.filePath + ' has after download thumb_url=' + object.thumb_url);
            }
            updateOriginalObject(self, object, {fileUrl:object.fileUrl, thumb_url:object.thumb_url});

            // Update reading synchro status
            object.c4p_synchro.reading = c4p.Synchro.NONE;
            self.srvLocalStorage.set('Data-'+object.a4p_type, self.currentItems[object.a4p_type]);
            //self.setObject(object, false); // NO that implies an useless writing status&request
        } else {
            // Object has been deleted during the request
            a4p.InternalLog.log('srvData', 'download success on unknown object ' + requestCtx.dbid + ' : object has been deleted during the request');
        }
        getNextObjectToDownload(self, requestCtx.dbid);
    }
    function onDownloadFailure(self, requestCtx) {
        var object = self.getObject(requestCtx.dbid);
        if (a4p.isDefined(object)) {
            // Update reading synchro status
            object.c4p_synchro.reading = c4p.Synchro.NONE;
            self.srvLocalStorage.set('Data-'+object.a4p_type, self.currentItems[object.a4p_type]);
            //self.setObject(object, false); // NO that implies an useless writing status&request
            // TODO : do what about this document not downloaded ?
        } else {
            // Object has been deleted during the request
            a4p.InternalLog.log('srvData', 'download failure on unknown object ' + requestCtx.dbid + ' : object has been deleted during the request');
        }
        getNextObjectToDownload(self, requestCtx.dbid);
    }

    function onShareSuccess(self, requestCtx, responseData) {
    	if (responseData['log'] == 'Document shared.' && a4p.isDefined(responseData['id'])) {
            var object = self.getObject(requestCtx.dbid);
            if (a4p.isDefined(object)) {
                //var feedId = responseData['id'];// FeedItem id
                delete object.feed;
                // Update sharing synchro status
                object.c4p_synchro.sharing = c4p.Synchro.NONE;
                self.setObject(object, false);
                // DO NOT download FEED
                // Redo save of object to save Document itself if needed, after having deleted feed attribute
                self.addObjectToSave(object.a4p_type, object.id.dbid);
            } else {
                // Object has been deleted during the request
                a4p.InternalLog.log('srvData', 'share success on unknown object ' + requestCtx.dbid + ' : object has been deleted during the request');
            }
        } else{
    		// TODO : error on sharing
    	}
        sendNextObjectToSave(self);
    }
    function onShareFailure(self, requestCtx) {
        var object = self.getObject(requestCtx.dbid);
        if (a4p.isDefined(object)) {
            // Update sharing synchro status
            object.c4p_synchro.sharing = c4p.Synchro.NONE;
            self.srvLocalStorage.set('Data-'+object.a4p_type, self.currentItems[object.a4p_type]);
            // TODO : do what about this object not shared ?
        } else {
            // Object has been deleted during the request
            a4p.InternalLog.log('srvData', 'share failure on unknown object ' + requestCtx.dbid + ' : object has been deleted during the request');
        }
        sendNextObjectToSave(self);
    }

    function onEmailSuccess(self, requestCtx, responseData) {
        var object = self.getObject(requestCtx.dbid);
        if (a4p.isDefined(object)) {
            if (a4p.isDefined(responseData['nbSent'])) {
                // New server version
                if (responseData['nbSent'] > 0) {
                    // nbSent emails has been sent
                } else {
                    // NO email has been sent => error on sending
                }
                // Update writing synchro status
                object.c4p_synchro.writing = c4p.Synchro.NONE;
                // We save in original only fields valued at the request moment, not those modified afterward
                var pdfEmailExists = false;
                if (a4p.isDefined(responseData['created'])) {
                    // New Server version
                    for (var i = 0, nb = responseData['created'].length; i < nb; i++) {
                        var crm = responseData['created'][i].crm;
                        var id = responseData['created'][i].id;
                        object.id[crm + '_id'] = id;
                        self.savingObject.fields.id[crm + '_id'] = id;
                        pdfEmailExists = true;
                    }
                } else if (a4p.isDefined(responseData['id']) && a4p.isDefined(responseData['id'].sf_id)) {
                    // responseData['id'] exists only if object_id has been given in request
                    // Old Server version
                    object.id.sf_id = responseData['id'].sf_id;
                    self.savingObject.fields.id.sf_id = object.id.sf_id;
                    pdfEmailExists = true;
                }
                self.setObject(object, false);
                // DO download PDF file because WE have NOT created it, it's C4P server who has created it
                // DO download file if we are not in DEMO mode only
                addOriginalObject(self, self.savingObject.fields, !self.isDemo && pdfEmailExists);
                if (a4p.isDefined(responseData['created'])) {
                    for (var i = 0, nb = responseData['created'].length; i < nb; i++) {
                        var crm = responseData['created'][i].crm;
                        var id = responseData['created'][i].id;
                        updateLinkedObjects(self, 'Document', object.id.dbid, crm + '_id', id);
                    }
                } else if (a4p.isDefined(responseData['id']) && a4p.isDefined(responseData['id'].sf_id)) {
                    updateLinkedObjects(self, 'Document', object.id.dbid, 'sf_id', object.id.sf_id);
                }
            } else {
                // Old server version : no info if email has been sent
                if (responseData['responseStatus'] == 'Create email success.' && a4p.isDefined(responseData['id'])) {
                    // responseData['id'] exists only if object_id has been given in request
                    object.id.sf_id = responseData['id'].sf_id;
                    // Update writing synchro status
                    object.c4p_synchro.writing = c4p.Synchro.NONE;
                    self.setObject(object, false);
                    // We save in original only fields valued at the request moment, not those modified afterward
                    self.savingObject.fields.id.sf_id = object.id.sf_id;
                    // DO download PDF file because WE have NOT created it, it's C4P server who has created it
                    // DO download file if we are not in DEMO mode only
                    addOriginalObject(self, self.savingObject.fields, !self.isDemo);
                    updateLinkedObjects(self, 'Document', object.id.dbid, 'sf_id', object.id.sf_id);
                } else{
                    // TODO : error on creation
                }
            }
        } else {
            // Object has been deleted during the request
            a4p.InternalLog.log('srvData', 'email success on unknown object ' + requestCtx.dbid + ' : object has been deleted during the request');
        }
        sendNextObjectToSave(self);
    }
    function onEmailFailure(self, requestCtx) {
        var object = self.getObject(requestCtx.dbid);
        if (a4p.isDefined(object)) {
            // Update writing synchro status
            object.c4p_synchro.writing = c4p.Synchro.NONE;
            self.srvLocalStorage.set('Data-'+object.a4p_type, self.currentItems[object.a4p_type]);
            // TODO : do what about this email not sent ?
        } else {
            // Object has been deleted during the request
            a4p.InternalLog.log('srvData', 'email failure on unknown object ' + requestCtx.dbid + ' : object has been deleted during the request');
        }
        sendNextObjectToSave(self);
    }

    function onNoteSuccess(self, requestCtx, responseData) {
        if ((responseData['responseStatus'] == 'Create report success.' || responseData['responseStatus'] == 'Create note success.') && a4p.isDefined(responseData['id'])) {
            var object = self.getObject(requestCtx.dbid);
            if (a4p.isDefined(object)) {
                object.id.sf_id = responseData['id'].sf_id;
                // Update writing synchro status
                object.c4p_synchro.writing = c4p.Synchro.NONE;
                self.setObject(object, false);
                // We save in original only fields valued at the request moment, not those modified afterward
                self.savingObject.fields.id.sf_id = object.id.sf_id;
                // DO download PDF file because WE have NOT created it, it's C4P server who has created it
                // DO download file if we are not in DEMO mode only
                addOriginalObject(self, self.savingObject.fields, !self.isDemo);
                updateLinkedObjects(self, 'Document', object.id.dbid, 'sf_id', object.id.sf_id);
                // TODO : merge SF Documents generated from Note/Report with this C4P Document
            } else {
                // Object has been deleted during the request
                a4p.InternalLog.log('srvData', 'note success on unknown object ' + requestCtx.dbid + ' : object has been deleted during the request');
            }
        } else {
            // TODO : error on creation
        }
        sendNextObjectToSave(self);
    }
    function onNoteFailure(self, requestCtx, responseData) {
        var object = self.getObject(requestCtx.dbid);
        if (a4p.isDefined(object)) {
            // Update writing synchro status
            object.c4p_synchro.writing = c4p.Synchro.NONE;
            self.srvLocalStorage.set('Data-'+object.a4p_type, self.currentItems[object.a4p_type]);
            // TODO : do what about this note/report not created ?
        } else {
            // Object has been deleted during the request
            a4p.InternalLog.log('srvData', 'note failure on unknown object ' + requestCtx.dbid + ' : object has been deleted during the request');
        }
        sendNextObjectToSave(self);
    }

    /**
     * Return undefined if object not found
     *
     * @param dbid
     * @return {*}
     */
    Service.prototype.getObject = function (dbid) {
        return this.index.db[dbid];
    };

    Service.prototype.getObjectCount = function (type) {
        return this.currentItems[type] ? this.currentItems[type].length : 0;
    };

    Service.prototype.isObjectOwnedByUser = function(item) {
        if (a4p.isEmptyOrFalse(item)) return false;
        if (a4p.isEmptyOrFalse(item.crmObjects)) {
            // Object and not item
            if (a4p.isTrueOrNonEmpty(item.owner_id)) {
                if (item.owner_id.dbid != this.userId.dbid) return false;
            }
        } else {
            for (var mergeIdx = item.crmObjects.length-1; mergeIdx >= 0; mergeIdx--) {
                if (a4p.isDefined(item.crmObjects[mergeIdx].owner_id)) {
                    var crm = item.crmObjects[mergeIdx].crm;
                    if (item.crmObjects[mergeIdx].owner_id != this.userId[crm+'_id']) return false;
                }
            }
        }
        return true;
    };

    /**
     * Complete object attributes (those not saved in originalIndex, or calculated for example)
     * @param object
     */
    Service.prototype.completeFields = function (object) {
        // Set undefined fields to a default value
        this.setDefaultFields(object);

        // If needed, force the conversion of string fields into a number
        this.convertFields(object);

        //this.setThumbNail(object);// already done in setCalculatedFields()
        this.setCalculatedFields(object);
    };

    /**
     * Create a new object, not yet added in srvData (=> no dbid)
     *
     * @param {string} type Type of the object to create
     * @param {Object} object Skeleton object to create, with its predefined attributes
     */
    Service.prototype.createObject = function(type, object) {
        var i, len, j, len2, k, len3, key, targetType;

        /* ccn_future
        var id = type + '-' + a4p.nextUid();
        var item = {
            id:id,
            a4p_type:type,
            crmObjects:[{
                crmId:{
                    crm:crm,
                    id:a4p.nextUid()
                    // temporary id until created by CRM server
                    // other object linking on it points onto crmId object (pointer and not copy)
                },
                data:object,
                editable:true
            }]
        };
        */
        object.a4p_type = type;

        // feed attribute at creation should not be used
        if (a4p.isDefined(object.feed)) {
            delete object.feed;
        }

        if (a4p.isUndefined(object.id)) object.id = {};
        if (a4p.isUndefined(object.id.dbid)) {
            object.id.dbid = type + '-' + a4p.nextUid();
            this.srvLocalStorage.set('Data-Uid', a4p.getUid());
        } else {
            if (a4p.isDefined(this.index.db[object.id.dbid])) {
                throw new Error("Object of type " + type + " and id " + object.id.dbid + " already exists");
            }
        }

        /*
        if ((type == 'Event') && a4p.isUndefined(object.editionStatus)) {
            object.editionStatus = {editable: true};
        }
        */
        // Complete creation of object fields (not yet id.dbid)
        object.c4p_synchro = {
            creating : c4p.Synchro.NONE,
            sharing : c4p.Synchro.NONE,
            writing : c4p.Synchro.NONE,
            reading : c4p.Synchro.NONE,
            deleting : c4p.Synchro.NONE
        };
        this.completeFields(object);

        var now = new Date();
        var objDesc = c4p.Model.a4p_types[object.a4p_type];
        // Force owner in 'owner_id' field (but not in 'assigned_contact_id' field)
        for (var fieldIdx = 0, fieldNb = objDesc.fields.length; fieldIdx < fieldNb; fieldIdx++) {
            var fieldName = objDesc.fields[fieldIdx];
            if (fieldName == 'owner_id') {
                var owner = this.index.db[this.userId.dbid];
                if (a4p.isDefined(owner) && (a4p.isUndefined(object.owner_id) || a4p.isUndefined(object.owner_id.dbid))) {
                    object.owner_id = angular.copy(owner.id);
                }
                break;
            }
        }

        /*if (a4p.isUndefined(object.created_by_id) || a4p.isUndefined(object.created_by_id.dbid)) {
            object.created_by_id = angular.copy(object.owner_id);
        }
        if (a4p.isUndefined(object.created_date) || (object.created_date == '')) {
            object.created_date = a4pDateFormat(now);
        }
        if (a4p.isUndefined(object.last_modified_by_id) || a4p.isUndefined(object.last_modified_by_id.dbid)) {
            object.last_modified_by_id = angular.copy(object.owner_id);
        }
        if (a4p.isUndefined(object.last_modified_date) || (object.last_modified_date == '')) {
            object.last_modified_date = a4pDateFormat(now);
        }*/

        return object;
    };

    /**
     * Add a new object in srvData.
     *
     * Create a new dbid, set its type, calculates some fields if undefined.
     * Its links must refer objects already inserted in data service.
     *
     * @param object
     * @param isOriginal
     * @return {*} the object enriched with its new fields
     */
    Service.prototype.addObject = function (object, isOriginal) {
        /* ccn_future
        // Type of item
        if (!item.a4p_type) {
            a4p.ErrorLog.log('srvData', 'reject adding item without type');
            return item;
        }
        // Id of item
        if (!item.id) {
            item.id = item.a4p_type + '-' + a4p.nextUid();
        }
        // Fields translation and completion
        this.completeFields(item);
        // Indexation
        if (this.index.db[item.id]) {
            a4p.ErrorLog.log('srvData', 'reject adding item with duplicate key : ' + item.id);
            return item;
        }
        this.index.db[item.id] = item;
        for (var mergeIdx = 0; mergeIdx < item.crmObjects.length; mergeIdx++) {
            var object = item.crmObjects[mergeIdx];
            // Objects not owned by user must not be editable
            if (object.data.owner_id && (object.data.owner_id != this.userId['sf_id'])) {
                object.editable = false;
            }
            // BEWARE :
            // this.index[object.crmId.crm][object.crmId.id] can exist upon splitting (reversing a merging)
            // when adding new before updating old => we move the index on the new object
            this.index[object.crmId.crm][object.crmId.id] = item;
        }
        // TODO : useless ?
        // feed attribute in creation should not be used
        if (a4p.isDefined(item.feed)) {
            delete item.feed;
        }
        */
        // Type of object
        if (a4p.isUndefined(object.a4p_type)) {
            throw new Error("Object must have a type");
        }
        // feed attribute at creation should not be used
        if (a4p.isDefined(object.feed)) {
            delete object.feed;
        }

        // Id generation
        if (a4p.isUndefined(object.id)) object.id = {};
        if (a4p.isUndefined(object.id.dbid)) {
            object.id.dbid = object.a4p_type + '-' + a4p.nextUid();
            this.srvLocalStorage.set('Data-Uid', a4p.getUid());
        } else {
            if (a4p.isDefined(this.index.db[object.id.dbid])) {
                throw new Error("Object of type " + object.a4p_type + " and id " + object.id.dbid + " already exists");
            }
        }
        object.c4p_synchro = {
            creating : c4p.Synchro.NONE,
            sharing : c4p.Synchro.NONE,
            writing : c4p.Synchro.NONE,
            reading : c4p.Synchro.NONE,
            deleting : c4p.Synchro.NONE
        };
        this.completeFields(object);

        // Indexation and set userId.dbid
        this.index.db[object.id.dbid] = object;
        if (a4p.isDefined(object.id.sf_id)) {
            this.index.sf[object.id.sf_id] = object;
            if (a4p.isDefined(this.userId.sf_id)) {
                if (this.userId.sf_id == object.id.sf_id) {
                    this.userId.dbid = object.id.dbid;
                    this.srvLocalStorage.set('Data-userId', this.userId);
                    a4p.InternalLog.log('srvData', 'addObject : userId=' + a4pDumpData(this.userId, 2));
                }
            }
        }
        if (a4p.isDefined(object.id.c4p_id)) {
            this.index.c4p[object.id.c4p_id] = object;
            if (a4p.isDefined(this.userId.c4p_id)) {
                if (this.userId.c4p_id == object.id.c4p_id) {
                    this.userId.dbid = object.id.dbid;
                    this.srvLocalStorage.set('Data-userId', this.userId);
                    a4p.InternalLog.log('srvData', 'addObject : userId=' + a4pDumpData(this.userId, 2));
                }
            }
        }
        if (a4p.isDefined(object.id.ios_id)) {
            this.index.ios[object.id.ios_id] = object;
            if (a4p.isDefined(this.userId.ios_id)) {
                if (this.userId.ios_id == object.id.ios_id) {
                    this.userId.dbid = object.id.dbid;
                    this.srvLocalStorage.set('Data-userId', this.userId);
                    a4p.InternalLog.log('srvData', 'addObject : userId=' + a4pDumpData(this.userId, 2));
                }
            }
        }

        // Ask for a creation request in CRM
        if (!isOriginal) {
            object.c4p_synchro.creating = c4p.Synchro.NEW;
        }

        // Save object in local storage
        this.currentItems[object.a4p_type].push(object);
        this.nbObjects++;
        this.srvLocalStorage.set('Data-'+object.a4p_type, this.currentItems[object.a4p_type]);

        // Save an original copy for later comparison
        if (a4p.isDefined(isOriginal) && isOriginal) {
            // DO download file if we are not in DEMO mode
            addOriginalObject(this, object, !this.isDemo);
        }

        triggerUpdate(this, 'add', object.a4p_type, object.id.dbid);

        return object;
    };

    /**
     * Update an existant item : update or add objects existing in item, but do not delete missing ones.
     *
     * @param object
     * @param isOriginal
     * @return {*} return the object enriched with its type and calculated fields, or false if update invalid
     */
    Service.prototype.setObject = function (object, isOriginal) {
        // Type of object
        if (!object.a4p_type) {
            a4p.ErrorLog.log('srvData', 'reject updating object without type');
            return false;
        }
        // Id of object
        if (a4p.isUndefinedOrNull(object.id) || a4p.isUndefinedOrNull(object.id.dbid)) {
            a4p.ErrorLog.log('srvData', 'reject updating object without id');
            return false;
        }
        var oldObject = this.index.db[object.id.dbid];
        if (!oldObject) {
            a4p.ErrorLog.log('srvData', 'reject updating object which is not indexed');
            return false;
        }
        if (object.a4p_type != oldObject.a4p_type) {
            a4p.ErrorLog.log('srvData', 'reject updating object with different type');
            return false;
        }
        if (a4p.isUndefinedOrNull(object.c4p_synchro)) {
            object.c4p_synchro = {
                creating : c4p.Synchro.NONE,
                sharing : c4p.Synchro.NONE,
                writing : c4p.Synchro.NONE,
                reading : c4p.Synchro.NONE,
                deleting : c4p.Synchro.NONE
            };
        }
        // Fields translation and completion
        this.completeFields(object);
        /* ccn_future
        // Type of item
        if (!item.a4p_type) {
            a4p.ErrorLog.log('srvData', 'reject updating item without type');
            return false;
        }
        // Id of item
        if (!item.id) {
            a4p.ErrorLog.log('srvData', 'reject updating item without id');
            return false;
        }
        var oldItem = this.index.db[item.id];
        if (!oldItem) {
            a4p.ErrorLog.log('srvData', 'reject updating item which is not indexed');
            return false;
        }
        if (item.a4p_type != oldItem.a4p_type) {
            a4p.ErrorLog.log('srvData', 'reject updating item with different type');
            return false;
        }
        // Fields translation and completion
        this.completeFields(item);
        // Update or create new objects
        for (var mergeIdx = 0; mergeIdx < item.crmObjects.length; mergeIdx++) {
            var object = item.crmObjects[mergeIdx];
            var created = true;
            for (var oldMergeIdx = oldItem.crmObjects.length - 1; oldMergeIdx >= 0; oldMergeIdx--) {
                var oldObject = oldItem.crmObjects[oldMergeIdx];
                if ((oldObject.crmId.crm == object.crmId.crm) && (oldObject.crmId.id == object.crmId.id)) {
                    created = false;
                    // Accept modification only for original Object (fullMap/refreshMap) or owned by user
                    if (!isOriginal && !oldObject.editable) continue;
                    // Update object
                    oldItem.crmObjects[oldMergeIdx] = object;
                    break;
                }
            }
            // Indexation + Create object
            if (created) {
                // Objects not owned by user must not be editable
                if (object.data.owner_id && (object.data.owner_id != this.userId['sf_id'])) {
                    object.editable = false;
                }
                oldItem.crmObjects.push(object);
                // BEWARE :
                // this.index[object.crmId.crm][object.crmId.id] can exist upon splitting (reversing a merging)
                // when adding new before updating old => we move the index on the new object
                this.index[object.crmId.crm][object.crmId.id] = oldItem;
            }
        }
        // TODO : useless ?
        // feed attribute in update
        if (a4p.isDefined(item.feed) && item.feed
            && (item.c4p_synchro.sharing == c4p.Synchro.NONE)) {
            item.c4p_synchro.sharing = c4p.Synchro.NEW;
        }
        // Synchro status
        if (isOriginal) {
            // TODO : verify how it works if there is a current request : delete request if error, ignore result if success ?
            item.c4p_synchro.creating = c4p.Synchro.NONE;
            item.c4p_synchro.writing = c4p.Synchro.NONE;
            item.c4p_synchro.reading = c4p.Synchro.NONE;
            item.c4p_synchro.deleting = c4p.Synchro.NONE;
        } else if (item.c4p_synchro.writing == c4p.Synchro.NONE) {
            item.c4p_synchro.writing = c4p.Synchro.NEW;
        }
        // Save object in local storage
        this.srvLocalStorage.set('Data-'+item.a4p_type, this.currentItems[item.a4p_type]);
        // Save an original copy for later comparison
        if (isOriginal) {
            // DO download file if we are not in DEMO mode
            setOriginalObject(this, oldItem, !this.isDemo);
        }
        */
        var type = object.a4p_type;
        var oldObject = false;
        for (var objectIdx = this.currentItems[type].length - 1; objectIdx >= 0; objectIdx--) {
       		if (this.currentItems[type][objectIdx].id.dbid == object.id.dbid) {
                oldObject = this.currentItems[type][objectIdx];
                break;
       		}
       	}
        if (a4p.isTrueOrNonEmpty(oldObject)) {
            // Reject modification of any Object not owned
            if (!isOriginal && !this.isObjectOwnedByUser(oldObject)) {
                return false;
            }

            // Take into account running synchro requests on this object
            object.c4p_synchro.sharing = oldObject.c4p_synchro.sharing;
            object.c4p_synchro.creating = oldObject.c4p_synchro.creating;
            object.c4p_synchro.writing = oldObject.c4p_synchro.writing;
            object.c4p_synchro.reading = oldObject.c4p_synchro.reading;
            object.c4p_synchro.deleting = oldObject.c4p_synchro.deleting;

            if (a4p.isDefined(object.feed) && object.feed
                && (object.c4p_synchro.sharing == c4p.Synchro.NONE)) {
                object.c4p_synchro.sharing = c4p.Synchro.NEW;
            }
            if (a4p.isDefined(isOriginal) && isOriginal) {
                // TODO : verify how it works if there is a current request : delete request if error, ignore result if success ?
                object.c4p_synchro.creating = c4p.Synchro.NONE;
                object.c4p_synchro.writing = c4p.Synchro.NONE;
                object.c4p_synchro.reading = c4p.Synchro.NONE;
                object.c4p_synchro.deleting = c4p.Synchro.NONE;
            } else if ((object.c4p_synchro.creating == c4p.Synchro.NONE)
                && (object.c4p_synchro.writing == c4p.Synchro.NONE)) {
                object.c4p_synchro.writing = c4p.Synchro.NEW;
            }
            this.completeFields(object);
/*
        // If file is renamed then it is moved in file storage
        if (a4p.isDefined(c4p.Model.files[object.a4p_type]) && (oldObject.filePath != object.filePath)) {
            var onMoveSuccess = function(toFileEntry) {
                // toFileEntry.fullPath
                var msg = 'File successfully moved from ' + oldObject.filePath + ' to ' + object.filePath;
                this.srvLog.logSuccess(this.srvConfig.c4pConfig.exposeFileStorage,
                    this.srvLocale.translations.htmlMsgRenameFileOK, msg);
            };
            var onMoveFailure = function(message) {
                var msg = 'Moving file from ' + oldObject.filePath + ' to ' + object.filePath + ' failure : ' + message;
                this.srvLog.logInfo(this.srvConfig.c4pConfig.exposeFileStorage,
                    this.srvLocale.translations.htmlMsgRenameFilePb, msg);
            };
            this.srvFileStorage.moveFile(oldObject.filePath, object.filePath,
                onMoveSuccess,
                onMoveFailure);
            // Until the end of this future, file will not be accessible (still at old place)
        }
*/
            // Indexation
            this.index.db[object.id.dbid] = object;
            // TODO : dynamic CRM list
            if (a4p.isDefined(object.id.sf_id)) this.index.sf[object.id.sf_id] = object;
            if (a4p.isDefined(object.id.c4p_id)) this.index.c4p[object.id.c4p_id] = object;
            if (a4p.isDefined(object.id.ios_id)) this.index.ios[object.id.ios_id] = object;

            // Save object in local storage
            this.currentItems[type][objectIdx] = object;
            this.srvLocalStorage.set('Data-'+type, this.currentItems[type]);

            // Save an original copy for later comparison
            if (a4p.isDefined(isOriginal) && isOriginal) {
                // DO download file if we are not in DEMO mode
                setOriginalObject(this, object, !this.isDemo);
            }

            triggerUpdate(this, 'set', type, object.id.dbid);

            return object;
        }
        return false;
    };

    /**
     * Remove an item : remove objects existing in item, but do not delete missing ones.
     *
     * @param dbid
     * @param isOriginal
     * @return {*} Return the removed object or false if invalid.
     */
    Service.prototype.removeObject = function (dbid, isOriginal) {
        /* ccn_future
        // Type of item
        if (!item.a4p_type) {
            a4p.ErrorLog.log('srvData', 'reject deleting item without type');
            return false;
        }
        // Id of item
        if (!item.id) {
            a4p.ErrorLog.log('srvData', 'reject deleting item without id');
            return false;
        }
        var oldItem = this.index.db[item.id];
        if (!oldItem) {
            a4p.ErrorLog.log('srvData', 'reject deleting item which is not indexed');
            return false;
        }
        if (item.a4p_type != oldItem.a4p_type) {
            a4p.ErrorLog.log('srvData', 'reject deleting item with different type');
            return false;
        }
        // Indexation + Delete objects
        var deleted = [];
        for (var mergeIdx = 0; mergeIdx < item.crmObjects.length; mergeIdx++) {
            var object = item.crmObjects[mergeIdx];
            for (var oldMergeIdx = oldItem.crmObjects.length - 1; oldMergeIdx >= 0; oldMergeIdx--) {
                var oldObject = oldItem.crmObjects[oldMergeIdx];
                if ((oldObject.crmId.crm == object.crmId.crm) && (oldObject.crmId.id == object.crmId.id)) {
                    // Accept deletion only for original Object (fullMap/refreshMap) or owned by user
                    if (!isOriginal && !oldObject.editable) break;
                    deleted.push({crm:object.crmId.crm, id:object.crmId.id});
                    oldObject.deleted = true;
                    break;
                }
            }
        }

        // Synchro status
        if (isOriginal) {
            // TODO : verify how it works if there is a current request : delete request if error, ignore result if success ?
            oldItem.c4p_synchro.creating = c4p.Synchro.NONE;
            oldItem.c4p_synchro.writing = c4p.Synchro.NONE;
            oldItem.c4p_synchro.reading = c4p.Synchro.NONE;
            oldItem.c4p_synchro.deleting = c4p.Synchro.NONE;
            // delete NOW the object because it is already deleted in server
            deletedObject(this, item.id, askedDeleted, deleted, true);
        } else if (oldItem.c4p_synchro.deleting == c4p.Synchro.NONE) {
            oldItem.c4p_synchro.deleting = c4p.Synchro.NEW;
            if ((oldItem.c4p_synchro.writing == c4p.Synchro.NEW)) {
                // Cancel any update
                oldItem.c4p_synchro.writing = c4p.Synchro.NONE;
            }
            if ((oldItem.c4p_synchro.creating == c4p.Synchro.NEW)
                || (oldItem.c4p_synchro.creating == c4p.Synchro.QUEUE)) {
                // delete NOW the object if its creation has not been sent yet
                deletedObject(this, item.id, askedDeleted, deleted, false);
            }
        }
        return item;
        */
        var object = this.getObject(dbid);
        if (a4p.isDefined(object)) {
            if (!isOriginal && !this.isObjectOwnedByUser(object)) {
                return false;
            }
            if (a4p.isDefined(isOriginal) && isOriginal) {
                // TODO : verify how it works if there is a current request : delete request if error, ignore result if success ?
                object.c4p_synchro.creating = c4p.Synchro.NONE;
                object.c4p_synchro.writing = c4p.Synchro.NONE;
                object.c4p_synchro.reading = c4p.Synchro.NONE;
                object.c4p_synchro.deleting = c4p.Synchro.NONE;
                // delete NOW the object because it is already deleted in server
                var deleted = [];
                /* ccn_future
                for (var mergeIdx = 0; mergeIdx < toObject.crmObjects.length; mergeIdx++) {
                    var object = toObject.crmObjects[mergeIdx];
                    if (!toObject.editable) continue;
                    if (object.deleted) {
                        deleted.push({crm:object.crmId.crm, id:object.crmId.id});
                    }
                }
                */
                // TODO : dynamic CRM list
                if (a4p.isDefined(object.id.c4p_id)) {
                    deleted.push({crm: 'c4p', id: object.id.c4p_id});
                } else if (a4p.isDefined(object.id.sf_id)) {
                    deleted.push({crm: 'sf', id: object.id.sf_id});
                } else {
                    deleted.push({crm: 'ios', id: object.id.ios_id});
                }
                deletedObject(this, object.id.dbid, deleted, deleted, true);
            } else if (object.c4p_synchro.deleting == c4p.Synchro.NONE) {
                object.c4p_synchro.deleting = c4p.Synchro.NEW;
                if ((object.c4p_synchro.writing == c4p.Synchro.NEW)) {
                    // Cancel any update
                    object.c4p_synchro.writing = c4p.Synchro.NONE;
                }
                if ((object.c4p_synchro.creating == c4p.Synchro.NEW)
                    || (object.c4p_synchro.creating == c4p.Synchro.QUEUE)) {
                    // delete NOW the object if its creation has not been sent yet
                    var deleted = [];
                    /* ccn_future
                    for (var mergeIdx = 0; mergeIdx < toObject.crmObjects.length; mergeIdx++) {
                        var object = toObject.crmObjects[mergeIdx];
                        if (!toObject.editable) continue;
                        if (object.deleted) {
                            deleted.push({crm:object.crmId.crm, id:object.crmId.id});
                        }
                    }
                    */
                    if (a4p.isDefined(object.id.c4p_id)) {
                        deleted.push({crm:'c4p',id:object.id.c4p_id});
                    } else {
                        deleted.push({crm:'sf',id:object.id.sf_id});
                    }
                    deletedObject(this, object.id.dbid, deleted, deleted, false);
                }
            }
            return object;
        }
        return false;
    };

    /**
     *
     * @param fromLink Name of link (one or many) on from side (its not the attribute name of object, but it is associated with it)
     * @param fromObject
     * @param toType
     * @param toObjects
     */
    Service.prototype.linkToObjects = function (fromLink, fromObject, toType, toObjects) {
        // Common cases
        var done = false;
        for (var fromFieldIdx=0; fromFieldIdx<c4p.Model.a4p_types[fromObject.a4p_type].linkFields.length; fromFieldIdx++) {
            var linkModel = c4p.Model.a4p_types[fromObject.a4p_type].linkFields[fromFieldIdx];
            var fromField = linkModel.key;
            if (linkModel.one == fromLink) {
                for (var toTypeIdx=0; toTypeIdx<linkModel.types.length; toTypeIdx++) {
                    if (linkModel.types[toTypeIdx] == toType) {
                        this.linkItemToAllObjects(fromObject, fromField, toObjects);
                        done = true;
                        break;
                    }
                }
                if (done) break;
            }
        }
        // Some relations are mirrored (Facet-Facet for example)
        done = false;
        for (var fromFieldIdx=0; fromFieldIdx<c4p.Model.a4p_types[toType].linkFields.length; fromFieldIdx++) {
            var linkModel = c4p.Model.a4p_types[toType].linkFields[fromFieldIdx];
            var fromField = linkModel.key;
            if (linkModel.many == fromLink) {
                for (var toTypeIdx=0; toTypeIdx<linkModel.types.length; toTypeIdx++) {
                    if (linkModel.types[toTypeIdx] == fromObject.a4p_type) {
                        this.linkAllObjectsToItem(toObjects, fromField, fromObject);
                        done = true;
                        break;
                    }
                }
                if (done) break;
            }
        }
    };

    /**
     *
     * @param fromType
     * @param fromLink Name of link (one or many) on from side (its not the attribute name of object, but it is associated with it)
     * @param fromObjects
     * @param toObject
     */
    Service.prototype.linkToItem = function (fromType, fromLink, fromObjects, toObject) {
        // Common cases
        var done = false;
        for (var fromFieldIdx=0; fromFieldIdx<c4p.Model.a4p_types[fromType].linkFields.length; fromFieldIdx++) {
            var linkModel = c4p.Model.a4p_types[fromType].linkFields[fromFieldIdx];
            var fromField = linkModel.key;
            if (linkModel.one == fromLink) {
                for (var toTypeIdx=0; toTypeIdx<linkModel.types.length; toTypeIdx++) {
                    if (linkModel.types[toTypeIdx] == toObject.a4p_type) {
                        this.linkAllObjectsToItem(fromObjects, fromField, toObject);
                        done = true;
                        break;
                    }
                }
                if (done) break;
            }
        }
        // Some relations are mirrored (Facet-Facet for example)
        done = false;
        for (var fromFieldIdx=0; fromFieldIdx<c4p.Model.a4p_types[toObject.a4p_type].linkFields.length; fromFieldIdx++) {
            var linkModel = c4p.Model.a4p_types[toObject.a4p_type].linkFields[fromFieldIdx];
            var fromField = linkModel.key;
            if (linkModel.many == fromLink) {
                for (var toTypeIdx=0; toTypeIdx<linkModel.types.length; toTypeIdx++) {
                    if (linkModel.types[toTypeIdx] == fromType) {
                        this.linkItemToAllObjects(toObject, fromField, fromObjects);
                        done = true;
                        break;
                    }
                }
                if (done) break;
            }
        }
    };

    /**
     *
     * @param fromType
     * @param fromLink Name of link (one or many) on from side (its not the attribute name of object, but it is associated with it)
     * @param fromObjects
     * @param toObject
     */
    Service.prototype.unlinkFromItem = function (fromType, fromLink, fromObjects, toObject) {
        // Common cases
        var done = false;
        for (var fromFieldIdx=0; fromFieldIdx<c4p.Model.a4p_types[fromType].linkFields.length; fromFieldIdx++) {
            var linkModel = c4p.Model.a4p_types[fromType].linkFields[fromFieldIdx];
            var fromField = linkModel.key;
            if (linkModel.one == fromLink) {
                for (var toTypeIdx=0; toTypeIdx<linkModel.types.length; toTypeIdx++) {
                    if (linkModel.types[toTypeIdx] == toObject.a4p_type) {
                        this.unlinkAllObjectsFromItem(fromObjects, fromField, toObject);
                        done = true;
                        break;
                    }
                }
                if (done) break;
            }
        }
        // Some relations are mirrored (Facet-Facet for example) => reset done to false
        done = false;
        for (var fromFieldIdx=0; fromFieldIdx<c4p.Model.a4p_types[toObject.a4p_type].linkFields.length; fromFieldIdx++) {
            var linkModel = c4p.Model.a4p_types[toObject.a4p_type].linkFields[fromFieldIdx];
            var fromField = linkModel.key;
            if (linkModel.many == fromLink) {
                for (var toTypeIdx=0; toTypeIdx<linkModel.types.length; toTypeIdx++) {
                    if (linkModel.types[toTypeIdx] == fromType) {
                        this.unlinkItemFromAllObjects(toObject, fromField, fromObjects);
                        done = true;
                        break;
                    }
                }
                if (done) break;
            }
        }
    };

    /**
     *
     * @param fromType
     * @param fromLink Name of link (one or many) on from side (its not the attribute name of object, but it is associated with it)
     * @param fromObject
     * @param toObject
     * @returns {*}
     */
    Service.prototype.hasDirectNamedLinkTo = function (fromType, fromLink, fromObject, toObject) {
        // Special cases not referenced into c4p.Model.a4p_types[fromType].linkDescs
        if (fromObject.a4p_type != fromType) return false;
        // Common cases
        for (var fromFieldIdx=0; fromFieldIdx<c4p.Model.a4p_types[fromType].linkFields.length; fromFieldIdx++) {
            var linkModel = c4p.Model.a4p_types[fromType].linkFields[fromFieldIdx];
            var fromField = linkModel.key;
            if (linkModel.one == fromLink) {
                for (var toTypeIdx=0; toTypeIdx<linkModel.types.length; toTypeIdx++) {
                    if (linkModel.types[toTypeIdx] == toObject.a4p_type) {
                        return this.isItemLinkedToObject(fromObject, fromField, toObject);
                    }
                }
            }
        }
        for (var fromFieldIdx=0; fromFieldIdx<c4p.Model.a4p_types[toObject.a4p_type].linkFields.length; fromFieldIdx++) {
            var linkModel = c4p.Model.a4p_types[toObject.a4p_type].linkFields[fromFieldIdx];
            var fromField = linkModel.key;
            if (linkModel.many == fromLink) {
                for (var toTypeIdx=0; toTypeIdx<linkModel.types.length; toTypeIdx++) {
                    if (linkModel.types[toTypeIdx] == fromType) {
                        return this.isItemLinkedToObject(toObject, fromField, fromObject);
                    }
                }
            }
        }
        return false;
    };

    Service.prototype.linkAllObjectsToItem = function (fromObjects, fromLinkName, toItem) {
        for (var fromObjectIdx = 0, fromObjectNb = fromObjects.length; fromObjectIdx < fromObjectNb; fromObjectIdx++) {
            var object = fromObjects[fromObjectIdx];
            var isArrayField = a4p.isDefined(c4p.Model.objectArrays[object.a4p_type][fromLinkName]);
            if (isArrayField) {
                if (addLinkToList(object[fromLinkName], angular.copy(toItem.id))) {
                    this.setAndSaveObject(object);
                }
            } else {
                object[fromLinkName] = angular.copy(toItem.id);
                this.setAndSaveObject(object);
            }
        }
    };

    Service.prototype.unlinkAllObjectsFromItem = function (fromObjects, fromLinkName, toItem) {
        for (var fromObjectIdx = 0, fromObjectNb = fromObjects.length; fromObjectIdx < fromObjectNb; fromObjectIdx++) {
            var object = fromObjects[fromObjectIdx];
            var isArrayField = a4p.isDefined(c4p.Model.objectArrays[object.a4p_type][fromLinkName]);
            if (isArrayField) {
                if (removeLinkFromList(object[fromLinkName], toItem.id.dbid) !== false) {
                    var fromDesc = c4p.Model.a4p_types[object.a4p_type];
                    var fromLinkDesc = fromDesc.linkDescs[fromLinkName];
                    if ((object[fromLinkName].length <= 0) && (fromLinkDesc.cascadeDelete == 'many')) {
                        // Object must be deleted as soon as ONE of its cascadeDelete links is broken
                        this.removeAndSaveObject(object);
                    } else {
                        this.setAndSaveObject(object);
                    }
                }
            } else {
                if (object[fromLinkName].dbid == toItem.id.dbid) {
                    object[fromLinkName] = {};
                    var fromDesc = c4p.Model.a4p_types[object.a4p_type];
                    var fromLinkDesc = fromDesc.linkDescs[fromLinkName];
                    if (fromLinkDesc.cascadeDelete == 'many') {
                        // Object must be deleted as soon as ONE of its cascadeDelete links is broken
                        this.removeAndSaveObject(object);
                    } else {
                        this.setAndSaveObject(object);
                    }
                }
            }
        }
    };

    Service.prototype.linkItemToOneOfObjects = function (fromItem, fromLinkName, toObjects) {
        var isArrayField = a4p.isDefined(c4p.Model.objectArrays[fromItem.a4p_type][fromLinkName]);
        if (isArrayField) {
            // Error in application : we should never have gone here
            this.linkItemToAllObjects(fromItem, fromLinkName, toObjects);
        } else {
            if ((toObjects.length > 0) && (getObjectFromList(toObjects, fromItem[fromLinkName].dbid) === false)) {
                fromItem[fromLinkName] = angular.copy(toObjects[0].id);
                this.setAndSaveObject(fromItem);
            }
        }
    };

    Service.prototype.unlinkItemFromOneOfObjects = function (fromItem, fromLinkName, toObjects) {
        var isArrayField = a4p.isDefined(c4p.Model.objectArrays[fromItem.a4p_type][fromLinkName]);
        if (isArrayField) {
            // Error in application : we should never have gone here
            this.unlinkItemFromAllObjects(fromItem, fromLinkName, toObjects);
        } else {
            if (getObjectFromList(toObjects, fromItem[fromLinkName].dbid) !== false) {
                fromItem[fromLinkName] = {};
                var fromDesc = c4p.Model.a4p_types[fromItem.a4p_type];
                var fromLinkDesc = fromDesc.linkDescs[fromLinkName];
                if (fromLinkDesc.cascadeDelete == 'many') {
                    // Object must be deleted as soon as ONE of its cascadeDelete links is broken
                    this.removeAndSaveObject(fromItem);
                } else {
                    this.setAndSaveObject(fromItem);
                }
            }
        }
    };

    Service.prototype.isItemLinkedToObject = function (fromItem, fromLinkName, toObject) {
        var isArrayField = a4p.isDefined(c4p.Model.objectArrays[fromItem.a4p_type][fromLinkName]);
        if (isArrayField) {
            return (getLinkFromList(fromItem[fromLinkName], toObject.id.dbid) !== false);
        }
        return (fromItem[fromLinkName].dbid == toObject.id.dbid);
    };

    Service.prototype.linkItemToAllObjects = function (fromItem, fromLinkName, toObjects) {
        var isArrayField = a4p.isDefined(c4p.Model.objectArrays[fromItem.a4p_type][fromLinkName]);
        if (!isArrayField) {
            // Error in application : we should never have gone here
            this.linkItemToOneOfObjects(fromItem, fromLinkName, toObjects);
        } else {
            var itemUpdated = false;
            for (var toObjectIdx = 0, toObjectNb = toObjects.length; toObjectIdx < toObjectNb; toObjectIdx++) {
                var toObject = toObjects[toObjectIdx];
                if (addLinkToList(fromItem[fromLinkName], angular.copy(toObject.id))) {
                    itemUpdated = true;
                }
            }
            if (itemUpdated) {
                this.setAndSaveObject(fromItem);
            }
        }
    };

    Service.prototype.unlinkItemFromAllObjects = function (fromItem, fromLinkName, toObjects) {
        var isArrayField = a4p.isDefined(c4p.Model.objectArrays[fromItem.a4p_type][fromLinkName]);
        if (!isArrayField) {
            // Error in application : we should never have gone here
            this.unlinkItemFromOneOfObjects(fromItem, fromLinkName, toObjects);
        } else {
            var itemUpdated = false;
            for (var toObjectIdx = 0, toObjectNb = toObjects.length; toObjectIdx < toObjectNb; toObjectIdx++) {
                var toObject = toObjects[toObjectIdx];
                if (removeLinkFromList(fromItem[fromLinkName], toObject.id.dbid) !== false) {
                    itemUpdated = true;
                }
            }
            if (itemUpdated) {
                var fromDesc = c4p.Model.a4p_types[fromItem.a4p_type];
                var fromLinkDesc = fromDesc.linkDescs[fromLinkName];
                if ((fromItem[fromLinkName].length <= 0) && (fromLinkDesc.cascadeDelete == 'many')) {
                    // Object must be deleted as soon as ONE of its cascadeDelete links is broken
                    this.removeAndSaveObject(fromItem);
                } else {
                    this.setAndSaveObject(fromItem);
                }
            }
        }
    };

    /**
     * Specific link treatment : copy the Document object for each new link with an Event
     *
     * @param fromItem Document to link
     * @param toObjects Events to link the Document
     */
    Service.prototype.linkDocumentToAllObjects = function (fromItem, toObjects) {
        for (var toIdx = 0, toNb = toObjects.length; toIdx < toNb; toIdx++) {
            var document = angular.copy(fromItem);
            delete document.id;
            document.rootname = 'copy_'+document.rootname;
            //document.name = 'copy_'+document.name; // name will be calculated by srvData
            document.parent_id = angular.copy(toObjects[toIdx].id);
            this.addAndSaveObject(document);
        }
    };

    /**
     * Specific link treatment : copy Document objects for each new link with an Event
     *
     * @param fromDocuments Documents to link
     * @param toItem Event to link the Documents
     */
    Service.prototype.linkAllDocumentsToItem = function (fromDocuments, toItem) {
        for (var documentIdx = 0, documentNb = fromDocuments.length; documentIdx < documentNb; documentIdx++) {
            var document = angular.copy(fromDocuments[documentIdx]);
            delete document.id;
            document.rootname = 'copy_'+document.rootname;
            // document.name = 'copy_'+document.name; // name will be calculated by srvData
            document.parent_id = angular.copy(toItem.id);
            this.addAndSaveObject(document);
        }
    };

    /**
     * Specific attachType treatment : create an Attendee/Attachee/Plannee between a Contact/Document/Note/Report and an Event/Plan
     *
     * @param a4p_type Type of attachment (Attendee or Attachee)
     * @param attachee Contact/Document/Note/Report to link
     * @param attached Event/Plan to link to the Contact/Document/Note/Report
     */
    Service.prototype.newAttachment = function (a4p_type, attachee, attached) {
        var objDesc = c4p.Model.a4p_types[a4p_type];
        var attachment = {a4p_type:a4p_type};
        attachment[objDesc.attached] = angular.copy(attached.id);
        attachment[objDesc.attachee] = angular.copy(attachee.id);
        this.addObject(attachment);
        return attachment;
    };
    Service.prototype.newAndSaveAttachment = function (a4p_type, attachee, attached) {
        var objDesc = c4p.Model.a4p_types[a4p_type];
        var attachment = {a4p_type:a4p_type};
        attachment[objDesc.attached] = angular.copy(attached.id);
        attachment[objDesc.attachee] = angular.copy(attachee.id);
        this.addAndSaveObject(attachment);
        return attachment;
    };

    /**
     * Specific attachType treatment : remove an Attendee/Attachee between a Contact/Document and an Event
     *
     * @param a4p_type Type of attachment (Attendee or Attachee)
     * @param attachee Contact/Document to unlink
     * @param attached Event to unlink from the Contact/Document
     */
    Service.prototype.delAndSaveAttachment = function (a4p_type, attachee, attached) {
        var objDesc = c4p.Model.a4p_types[a4p_type];
        for (var i = 0, nb = this.currentItems[a4p_type].length; i < nb; i++) {
            var attachment = this.currentItems[a4p_type][i];
            if ((attachment[objDesc.attached].dbid == attached.id.dbid)
                && (attachment[objDesc.attachee].dbid == attachee.id.dbid)) {
                this.removeAndSaveObject(attachment);
            }
        }
    };

    /**
     * Specific attachType treatment : check if an Attendee/Attachee exists between a Contact/Document and an Event
     *
     * @param a4p_type Type of attachment (Attendee or Attachee)
     * @param attachee Contact/Document to link
     * @param attached Event to link to the Contact/Document
     */
    Service.prototype.getAttachment = function (a4p_type, attachee, attached) {
        var objDesc = c4p.Model.a4p_types[a4p_type];
        for (var i = 0, nb = this.currentItems[a4p_type].length; i < nb; i++) {
            var attachment = this.currentItems[a4p_type][i];
            if ((attachment[objDesc.attached].dbid == attached.id.dbid)
                && (attachment[objDesc.attachee].dbid == attachee.id.dbid)) {
                return attachment;
            }
        }
        return null;
    };

    Service.prototype.addAndSaveObject = function(object) {
        this.addObject(object);
        this.addObjectToSave(object.a4p_type, object.id.dbid);
    };

    Service.prototype.setAndSaveObject = function (object) {
        this.setObject(object);
        this.addObjectToSave(object.a4p_type, object.id.dbid);
    };

    Service.prototype.removeAndSaveObject = function (object) {
        this.removeObject(object.id.dbid);
        this.addObjectToSave(object.a4p_type, object.id.dbid);
    };

    Service.prototype.addObjectToSave = function(type, dbid) {
        // Do not add it a second time in waiting queue
        if (getLinkFromList(this.objectsToSave, dbid) !== false) return false;

        // Send object to save ONLY after ALL downloads are done (because new object can link on document not yet downloaded)
        var delayedSave = (a4p.isDefined(this.savingObject.dbid) || (this.objectsToSave.length > 0) || (this.objectsToDownload.length > 0));
        // Update writing synchro status
        var object = this.getObject(dbid);
        // Beware object is no more here if it has been removed via removeObject()
        if (a4p.isDefined(object)) {
            if (a4p.isTrueOrNonEmpty(object.feed) && (object.c4p_synchro.sharing == c4p.Synchro.NEW)) {
                object.c4p_synchro.sharing = c4p.Synchro.QUEUE;
            }
            if (object.c4p_synchro.creating == c4p.Synchro.NEW) {
                object.c4p_synchro.creating = c4p.Synchro.QUEUE;
            }
            if (object.c4p_synchro.writing == c4p.Synchro.NEW) {
                object.c4p_synchro.writing = c4p.Synchro.QUEUE;
            }
            if (object.c4p_synchro.deleting == c4p.Synchro.NEW) {
                object.c4p_synchro.deleting = c4p.Synchro.QUEUE;
            }
            this.srvLocalStorage.set('Data-'+object.a4p_type, this.currentItems[object.a4p_type]);
        }

        this.objectsToSave.push({
            'type':type,
            'dbid':dbid
        });
        this.srvLocalStorage.set('Data-objectsToSave', this.objectsToSave);
        if (!delayedSave) {
            sendFirstObjectToSave(this);
        }
        return true;
    };

    /**
     * Tell if an object is in saving state
     *
     * @param dbid
     * @return {boolean}
     */
    Service.prototype.isObjectToSave = function(dbid) {
        if (this.savingObject.dbid == dbid) {
            return true;
        }
        return (getLinkFromList(this.objectsToSave, dbid) !== false);
    };

    /**
     * Tell if an object is in downloading state
     * @param dbid
     * @return {boolean}
     */
    Service.prototype.isObjectToDownload = function(dbid) {
        return (getLinkFromList(this.objectsToDownload, dbid) !== false);
    };

    Service.prototype.getObjectOrderToDownload = function(dbid) {
        for (var i=0, len = this.objectsToDownload.length; i < len; i++) {
            if (this.objectsToDownload[i].dbid == dbid) return (i+1);
        }
        return false;
    };

    // TODO : remove emails to send also (email and all its attachments) ?

    Service.prototype.adjustDate = function(data, from, to) {
    	var timestampDif = to.getTime() - from.getTime() - (((to.getHours()*60 + to.getMinutes())*60)+to.getSeconds())*1000 ;
    	var keysToAdjust = new Array('date_start', 'date_end', 'date_reminder');
    	var typesToAdjust = new Array('Event', 'Task');

        for(var i = 0 ; i < typesToAdjust.length ; i++){
       		var type = typesToAdjust[i];
        }
        if (a4p.isDefined(data.objects)){
            for(var j = 0 ; j < data.objects.length ; j++){
                var item = data.objects[j];
                if (!isValueInList(typesToAdjust, item.a4p_type)) continue;
                for(var mergeIdx = 0 ; mergeIdx < item.crmObjects.length ; mergeIdx++){
                    var object = item.crmObjects[mergeIdx].data;
                    for(var k = 0; k < keysToAdjust.length; k++){
                        var key = keysToAdjust[k];
                        if (a4p.isDefined(object[key])) {
                            var date = a4pDateParse(object[key]);
                            var timestamp = date.getTime() + timestampDif;
                            object[key] = a4pDateFormat(new Date(timestamp));
                        }
                    }
                }
            }
        }
    	return data;
    };

    Service.prototype.loginUser = function(isDemo, userEmail, userPassword, c4pToken, keepCrmLogin, userFeedback, appVersion) {
        var deferred = this.q.defer();

        if (isDemo) {
            this.isDemo = true;
            this.srvLocalStorage.set('Data-isDemo', this.isDemo);
            deferred.resolve();
        } else {
            var self = this;
            var fctOnHttpSuccess = function(response) {
                //response.data, response.status, response.headers
                var data = response.data;

                self.isDemo = false;
                self.srvLocalStorage.set('Data-isDemo', self.isDemo);

                if (a4p.isTrueOrNonEmpty(data['infoMessage'])) {
                    self.srvLog.userLogPersistentMessage(data['infoMessage']);
                }
                // Save server Token which asserts user identity
                var c4pToken = data['c4pToken'];
                if (a4p.isDefined(c4pToken) && (c4pToken != '')) {
                    self.srvSecurity.setA4pLogin(userEmail);
                    self.srvSecurity.setA4pPassword(userPassword);
                    self.srvSecurity.setC4pServerToken(c4pToken);
                }

                // In case of UrlBase change
                var urlBase = data.urlBase;
                if (a4p.isTrueOrNonEmpty(urlBase) && (self.srvConfig.c4pUrlBase != urlBase)) {
                    //a4p.InternalLog.log('synchro c4pUrlBase : ' + urlBase + '. You must refresh.');
                    self.srvConfig.setUrlBase(urlBase);
                    self.srvSynchro.setPingUrl(self.srvConfig.c4pUrlPing);
                    deferred.reject({urlBase:urlBase});
                    return;
                }
                // In case of Redirect or Error (network or server)
                var diag = checkErrorData(data);
                if (diag) {
                    if (diag.maintenance) {
                        // Server is not yet ready, retry later
                        self.srvSynchro.serverHs();
                        self.srvLog.logWarning(self.srvConfig.c4pConfig.exposeDataSynchro,
                            'Login User failed (server in status "' + diag.maintenance + '") : cancelled', diag.log);
                    } else if (diag.redirect) {
                        // Ignore the redirect and do not retry this request
                        self.srvLog.logWarning(self.srvConfig.c4pConfig.exposeDataSynchro,
                            'Login User redirected : cancelled', diag.log);
                        // TODO : propose the redirect URL (SalesForce login page ?)
                        //openChildBrowser(diag.redirect, 'url', function() {
                        //    a4p.safeApply(self.rootScope, function() {
                        //      self.rootScope.refreshClient();
                        //    });
                        //});
                    } else {// if (diag.error)
                        var errorMsg = '';
                        if (a4p.isDefined(diag.error) && a4p.isDefined(self.srvLocale.translations[diag.error])) {
                            errorMsg = self.srvLocale.translations[diag.error];
                        } else {
                            errorMsg = diag.error;
                        }
                        self.srvLog.logWarning(self.srvConfig.c4pConfig.exposeDataSynchro,
                            'Login User failed (' + errorMsg + ') : cancelled', diag.log);
                    }
                    deferred.reject(diag);
                    return;
                }

                if ((typeof(data['currencySymbol']) != 'undefined') && (data['currencySymbol'] != null) && (data['currencySymbol'].length > 0)) {
                    self.srvLocale.setCurrency(a4p.Utf8.encode(data['currencySymbol']));
                } else if ((typeof(data['currencyIsoCode']) != 'undefined') && (data['currencyIsoCode'] != null) && (data['currencyIsoCode'].length > 0)) {
                    self.srvLocale.setCurrency(a4p.Utf8.encode(data['currencyIsoCode']));
                }

                // TODO : activate it ?
                /*
                if ((typeof(data['userLanguage']) != 'undefined') && (data['userLanguage'] != null) && (data['userLanguage'].length > 0)) {
                    // BEWARE : SF will then replace user choice
                    self.srvLocale.setLanguage(data['userLanguage']);
                }
                */

                // Treat Meta Data
                checkMetaData(self, data);

                deferred.resolve();
            };
            var fctOnHttpError = function(response) {
                //response.data, response.status, response.headers
                self.srvSynchro.serverHs();
                deferred.reject({error:'htmlMsgSynchronizationClientPb', log:response.data});
            };
            var feedbackValue = {
                company_name:userFeedback.company_name || '',
                phone:userFeedback.phone || '',
                feedback:userFeedback.feedback || '',
                star:userFeedback.star || ''
            };
            var deviceName = '';
            var deviceCordova = '';
            var devicePlatform = '';
            var deviceUuid = '';
            var deviceVersion = '';
            if (window.device) {
                deviceName = window.device.name;
                deviceCordova = window.device.cordova;
                devicePlatform = window.device.platform;
                deviceUuid = window.device.uuid;
                deviceVersion = window.device.version;
            } else {
                deviceUuid = window.location.hostname;
            }
            var deviceValue = {
                uuid:deviceUuid,
                name:deviceName,
                cordova:deviceCordova,
                platform:devicePlatform,
                version:deviceVersion
            };
            var params = {
                login: userEmail,
                password: userPassword,
                rememberPassword: keepCrmLogin,
                serverUpdates: {
                    fifo: '',
                    feedback: feedbackValue,
                    device: deviceValue,
                    appVersion: appVersion,
                    c4pBuildDate: this.srvConfig.c4pBuildDate,
                    language: this.srvLocale.getLanguage()
                }
                //c4pToken:c4pToken // not used since server must validate login/password by calling a4p_login
            };
            this.dataTransfer.sendData(this.srvConfig.c4pUrlData, params, null, 30000)
                .then(fctOnHttpSuccess, fctOnHttpError);
        }
        return deferred.promise;
    };

    /**
     * Import a file : user receive the document as arg in promise success
     * @param url
     * @param targetDirPath
     */
    Service.prototype.importFile = function(url, targetDirPath) {
        var deferred = this.q.defer();
        a4p.InternalLog.log('srvData', "Try to import file " + url + ' targetDirPath=' + targetDirPath);
        var self = this;
        var getDirSuccess = function(dirEntry) {
            console.log('importFile getDir ' + targetDirPath + ' success');
            var onGetUrlFailure = function(message) {
                console.log('importFile getFileFromUrl ' + url + ' failure ' + message);
                a4p.safeApply(self.rootScope, function() {
                    var msg = 'Getting file entry from ' + url + ' failure : ' + message;
                    deferred.reject({error:'htmlMsgFileImportPb', log:msg});
                });
            };
            var onGetUrlSuccess = function(fileEntry) {
                console.log('importFile getFileFromUrl ' + url + ' success : ' + fileEntry.name);
                var targetFileName = fileEntry.name;
                var targetFileUid = 'file_'+((new Date()).getTime());
                var targetFileExtension = c4p.Model.fileExtension(targetFileName);
                var onWriteFailure = function(message) {
                    console.log('importFile copyTo ' + targetFileUid + '.' + targetFileExtension + ' failure ' + message);
                    a4p.safeApply(self.rootScope, function() {
                        var msg = 'Copying newly imported file from ' + url + ' to ' + targetFileUid + '.' + targetFileExtension + ' failure : ' + message;
                        deferred.reject({error:'htmlMsgFileImportPb', log:msg});
                    });
                };
                var onWriteSuccess = function (newFileEntry) {
                    console.log('importFile copyTo ' + targetFileUid + '.' + targetFileExtension + ' success');
                    console.log('importFile getUrlFromFile ' + newFileEntry.fullPath);
                    var filePath = targetDirPath + '/' + targetFileUid + '.' + targetFileExtension;
                    var newUrl = newFileEntry.toURL();
                    console.log('importFile getUrlFromFile success');
                    a4p.safeApply(self.rootScope, function() {
                        a4p.InternalLog.log('srvData', "File importation from " + url + " ok : fileName = " + targetFileName + ", filePath = " + filePath + ", url = " + newUrl);
                        var document = self.createObject('Document', {
                            name:targetFileName,
                            body:'',
                            length:'0',
                            path:targetDirPath,
                            description:"Imported file",
                            uid:targetFileUid,
                            url:newUrl,
                            fileUrl:newUrl,
                            src:newUrl,
                            filePath:filePath
                        });
                        deferred.resolve(document);
                    });
            	};
                console.log('importFile copyTo ' + targetFileUid + '.' + targetFileExtension);
                fileEntry.copyTo(dirEntry, targetFileUid + '.' + targetFileExtension, onWriteSuccess, onWriteFailure)
            };
            console.log('importFile getFileFromUrl ' + url);
            self.srvFileStorage.getFileFromUrl(url, onGetUrlSuccess, onGetUrlFailure);
        };
        var getDirFailure = function(message) {
            console.log('importFile getDir ' + targetDirPath + ' failure ' + message);
            console.log('importFile createDir ' + targetDirPath);
            self.srvFileStorage.createDir(targetDirPath, getDirSuccess, createDirFailure);
        };
        var createDirFailure = function(message) {
            console.log('importFile createDir ' + targetDirPath + ' failure ' + message);
            a4p.safeApply(self.rootScope, function() {
                var msg = 'Getting/Creating directory entry for ' + targetDirPath + ' failure : ' + message;
                deferred.reject({error:'htmlMsgFileImportPb', log:msg});
            });
        };
        console.log('importFile getDir ' + targetDirPath);
        this.srvFileStorage.getDir(targetDirPath, getDirSuccess, getDirFailure);
        return deferred.promise;
    };

    Service.prototype.downloadFullMap = function(c4pToken) {
        var deferred = this.q.defer();
        var self = this;
        var requestTimestamp =  (new Date()).getTime();

        var askedCrms = this.srvConfig.getActiveCrms();

        var fctOnHttpSuccess = function(response) {
            //response.data, response.status, response.headers
            var data = response.data;

            var today_app4pro = a4pDateParse('2013-04-25 00:00:00');
           	var today = new Date();

            if (self.isDemo) {
                data = self.adjustDate(data, today_app4pro, today);
                addFullMap(self, {'sf_id':'005i0000000I8c5AAC', 'c4p_id':'demo@apps4pro.com'}, data, requestTimestamp);
                deferred.resolve(data);
            } else {
                // In case of Redirect or Error (network or server)
                var diag = checkErrorData(data);
                if (diag) {
                    if (diag.maintenance) {
                        // Server is not yet ready, retry later
                        self.srvSynchro.serverHs();
                        self.srvLog.logWarning(self.srvConfig.c4pConfig.exposeDataSynchro,
                            'Full Mind Map failed (server in status "' + diag.maintenance + '") : cancelled', diag.log);
                    } else if (diag.redirect) {
                        // Ignore the redirect and do not retry this request
                        self.srvLog.logWarning(self.srvConfig.c4pConfig.exposeDataSynchro,
                            'Full Mind Map redirected : cancelled', diag.log);
                        // TODO : propose the redirect URL (SalesForce login page ?)
                        //openChildBrowser(diag.redirect, 'url', function() {
                        //    a4p.safeApply(self.rootScope, function() {
                        //      self.rootScope.refreshClient();
                        //    });
                        //});
                    } else {
                        var errorMsg = '';
                        if (a4p.isDefined(diag.error) && a4p.isDefined(self.srvLocale.translations[diag.error])) {
                            errorMsg = self.srvLocale.translations[diag.error];
                        } else {
                            errorMsg = diag.error;
                        }
                        self.srvLog.logWarning(self.srvConfig.c4pConfig.exposeDataSynchro,
                            'Full Mind Map failed (' + errorMsg + ') : cancelled', diag.log);
                    }
                    deferred.reject(diag);
                    return;
                }

                if ((typeof(data['currencySymbol']) != 'undefined') && (data['currencySymbol'] != null) && (data['currencySymbol'].length > 0)) {
                    self.srvLocale.setCurrency(a4p.Utf8.encode(data['currencySymbol']));
                } else if ((typeof(data['currencyIsoCode']) != 'undefined') && (data['currencyIsoCode'] != null) && (data['currencyIsoCode'].length > 0)) {
                    self.srvLocale.setCurrency(a4p.Utf8.encode(data['currencyIsoCode']));
                }

                // TODO : activate it ?
                /*
                if ((typeof(data['userLanguage']) != 'undefined') && (data['userLanguage'] != null) && (data['userLanguage'].length > 0)) {
                    // BEWARE : SF will then replace user choice
                    self.srvLocale.setLanguage(data['userLanguage']);
                }
                */

                // Treat Meta Data ? NO, only at login time
                //checkMetaData(self, data);

                // TODO
                //addRecent(self, data['recent']);
                //addLayout(self, data['layout']);
                //addModel(self, data['model']);

                // Treat Full Mind Map
                var dataInsert = data['map'];
                if (a4p.isDefinedAndNotNull(dataInsert)) {
                    // WARNING : do not delete '/a4p/c4p' as external viewers keep locks on files already viewed.
                    // lee show demo data
                    //console.log('demo data Json \n' + a4pExportJson(dataInsert, 3));
                    addFullMap(self, data['userId'], dataInsert, requestTimestamp);
                    deferred.resolve(dataInsert);
                } else {
                    // Empty mindmap update
                    deferred.reject({nop:true});
                }
            }
        };
        var fctOnHttpError = function(response) {
            //response.data, response.status, response.headers
            self.srvSynchro.serverHs();
            deferred.reject({error:'htmlMsgSynchronizationClientPb', log:response.data});
        };

        if (this.isDemo) {
            // TODO : use directly memory version of demo data.json
            /*
            var today_app4pro = a4pDateParse('2013-04-25 00:00:00');
           	var today = new Date();
            data = this.adjustDate(data, today_app4pro, today);
            addFullMap(this, {'sf_id':'005i0000000I8c5AAC', 'c4p_id':'demo@apps4pro.com'}, angular.copy(c4p.Demo), requestTimestamp);
            deferred.resolve(data);
            */
            this.dataTransfer.recvData('models/data.json')
                .then(fctOnHttpSuccess, fctOnHttpError);
        } else {
            var params = {
                c4pToken:c4pToken,
                askedCrms:askedCrms
            };
            this.dataTransfer.sendData(this.srvConfig.c4pUrlFullMap, params, null, 120000)
                .then(fctOnHttpSuccess, fctOnHttpError);
        }
        return deferred.promise;
    };

    Service.prototype.refreshFullMap = function(c4pToken) {
        var deferred = this.q.defer();
        if (this.isDemo) {
            // WARNING : do not delete '/a4p/c4p' as external viewers keep locks on files already viewed.
            // Do not delete already downloaded objects nor return to demo mode
            //self.clear();
            deferred.resolve({});
            return deferred.promise;
        }
        var self = this;
        var askedCrms = this.srvConfig.getActiveCrms();
        // BEWARE : timestamps from Saleforce are in SECONDS, while timestamp in Javascript is in MILLI-SECONDS since 1/1/1970.
        var time = new Date().getTime();
        if (this.lastRefreshMindMap < Math.floor(time/1000 - 28*24*3600)) {
            // Salesforce reject a 'since' older than 30 days ago
            this.lastRefreshMindMap = Math.floor(time/1000 - 28*24*3600);
        } else if (this.lastRefreshMindMap > Math.floor(time/1000 - 60)) {
            // Salesforce reject a 'since' newer than 1 minute ago
            this.lastRefreshMindMap = Math.floor(time/1000 - 60);
        }
        var params = {
            since:this.lastRefreshMindMap,
            c4pToken:c4pToken,
            askedCrms:askedCrms
        };
        var requestTimestamp =  (new Date()).getTime();
        var fctOnHttpSuccess = function(response) {
            //response.data, response.status, response.headers
            var data = response.data;
            if (a4p.isTrueOrNonEmpty(data['infoMessage'])) {
                self.srvLog.userLogPersistentMessage(data['infoMessage']);
            }
            // In case of Redirect or Error (network or server)
            var diag = checkErrorData(data);
            if (diag) {
                if (diag.maintenance) {
                    // Server is not yet ready, retry later
                    self.srvSynchro.serverHs();
                    self.srvLog.logWarning(self.srvConfig.c4pConfig.exposeDataSynchro,
                        'Refresh Mind Map failed (server in status "' + diag.maintenance + '") : cancelled', diag.log);
                } else if (diag.redirect) {
                    // Ignore the redirect and do not retry this request
                    self.srvLog.logWarning(self.srvConfig.c4pConfig.exposeDataSynchro,
                        'Refresh Mind Map redirected : cancelled', diag.log);
                    // TODO : propose the redirect URL (SalesForce login page ?)
                    //openChildBrowser(diag.redirect, 'url', function() {
                    //    a4p.safeApply(self.rootScope, function() {
                    //      self.rootScope.refreshClient();
                    //    });
                    //});
                } else {
                    var errorMsg = '';
                    if (a4p.isDefined(diag.error) && a4p.isDefined(self.srvLocale.translations[diag.error])) {
                        errorMsg = self.srvLocale.translations[diag.error];
                    } else {
                        errorMsg = diag.error;
                    }
                    self.srvLog.logWarning(self.srvConfig.c4pConfig.exposeDataSynchro,
                        'Refresh Mind Map failed (' + errorMsg + ') : cancelled', diag.log);
                }
                deferred.reject(diag);
                return;
            }

            // Treat Meta Data ? NO, only at login time
            //checkMetaData(self, data);

            var dataUpdate = data['responseUpdate'];
            if (a4p.isDefinedAndNotNull(dataUpdate)) {
                // WARNING : do not delete '/a4p/c4p' as external viewers keep locks on files already viewed.
                // Do not delete already downloaded objects nor return to demo mode
                //self.clear();
                updFullMap(self, dataUpdate, requestTimestamp);
                deferred.resolve(dataUpdate);
            } else {
                // Empty mindmap update
                deferred.reject({nop:true});
            }
        };
        var fctOnHttpError = function(response) {
            //response.data, response.status, response.headers
            self.srvSynchro.serverHs();
            deferred.reject({error:'htmlMsgSynchronizationClientPb', log:response.data});
        };
        this.dataTransfer.sendData(this.srvConfig.c4pUrlRefreshMap, params, null, 60000)
            .then(fctOnHttpSuccess, fctOnHttpError);
        return deferred.promise;
    };

    Service.prototype.takePicture = function(parentObject, pictureName) {
        var deferred = this.q.defer();
        var targetDirPath = 'a4p/c4p/doc';
        pictureName = pictureName.replace(/ /g, '_');
    	var timestamp = ''+(new Date()).getTime();
    	var photoRootname = pictureName + '_' + timestamp;
        var photoExtension = window.device ? 'jpg' : 'png';
        var filePath = normalizedPath(targetDirPath, photoRootname, photoExtension);
        var self = this;

        var createPicture = function (fileEntry) {
            self.srvFileStorage.getUrlFromFile(filePath,
                function (url) {
                    a4p.safeApply(self.rootScope, function() {
                        a4p.InternalLog.log('srvData', "Picture file creation ok : filePath = " + filePath + ", url = " + url);
                        var document = self.createObject('Document', {
                            name:photoRootname + '.' + photoExtension,
                            body:'',
                            length:'0',
                            path:targetDirPath,
                            description:"Picture for " + self.srvConfig.getItemName(parentObject),
                            uid:'pict_'+timestamp,// TODO : useless attribute ?
                            url:url,
                            fileUrl:url,
                            src:url,
                            filePath:filePath
                        });
                        deferred.resolve(document);
                    });
                }, function (message) {
                    a4p.safeApply(self.rootScope, function() {
                        var msg = 'Getting URL of picture file ' + filePath + ' failure : ' + message;
                        deferred.reject({error:'htmlMsgTakePicturePb', log:msg});
                    });
                });
    	};

        if (window.device) {
           var onGetPictureSuccess = function (imageURI) {
               a4p.InternalLog.log('srvData', "Picture saved temporarily in " + imageURI);
               var onGetUriSuccess = function(fileEntry) {
                   a4p.InternalLog.log('srvData', 'File entry of newly taken picture at ' + imageURI + ' as ' + fileEntry.fullPath + ' will be moved to ' + filePath);
                   var onMoveFailure = function(message) {
                       a4p.safeApply(self.rootScope, function() {
                           var msg = 'Moving newly taken picture from ' + imageURI + ' to ' + filePath + ' failure : ' + message;
                           deferred.reject({error:'htmlMsgTakePicturePb', log:msg});
                       });
                   };
                   self.srvFileStorage.moveFileEntry(fileEntry, filePath, createPicture, onMoveFailure);
               };
               var onGetUriFailure = function(message) {
                   a4p.safeApply(self.rootScope, function() {
                       var msg = 'Getting file entry of newly taken picture at ' + imageURI + ' failure : ' + message;
                       deferred.reject({error:'htmlMsgTakePicturePb', log:msg});
                   });
               };
               self.srvFileStorage.getFileFromUrl(imageURI, onGetUriSuccess, onGetUriFailure);
           };
           var onGetPictureFailure = function (message) {
               a4p.safeApply(self.rootScope, function() {
                   var msg = 'Camera getting picture failure : ' + message;
                   deferred.reject({error:'htmlMsgTakePicturePb', log:msg});
               });
           };
           navigator.camera.getPicture(onGetPictureSuccess, onGetPictureFailure,
               // options
               {
                   quality:50,
                   destinationType:Camera.DestinationType.FILE_URI
               });
        } else {
            var onWriteFailure = function (message) {
                a4p.safeApply(self.rootScope, function() {
                    var msg = 'Writing dummy picture file ' + filePath + ' failure : ' + message;
                    deferred.reject({error: 'htmlMsgTakePicturePb', log: msg});
                });
            };

            // PNG image
            var pngData = '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A\x00\x00\x00\x0D\x49\x48\x44\x52\x00\x00\x00\xC8\x00\x00\x00\xC8\x08\x03\x00\x00\x00\x9A\x86\x5E\xAC\x00\x00\x00\x20\x63\x48\x52'+
            '\x4D\x00\x00\x7A\x25\x00\x00\x80\x83\x00\x00\xF9\xFF\x00\x00\x80\xE9\x00\x00\x75\x30\x00\x00\xEA\x60\x00\x00\x3A\x98\x00\x00\x17\x6F\x92\x5F\xC5\x46\x00\x00\x03'+
            '\x00\x50\x4C\x54\x45\x0D\x00\x00\x19\x01\x01\x1D\x0F\x10\x14\x13\x0D\x19\x17\x12\x1D\x22\x18\x1F\x34\x1E\x26\x02\x01\x29\x12\x0B\x27\x16\x16\x36\x02\x00\x37\x17'+
            '\x0F\x32\x1C\x1B\x21\x2A\x1C\x27\x32\x1C\x28\x28\x22\x29\x37\x25\x38\x27\x26\x32\x3C\x2B\x3B\x34\x31\x2D\x42\x2B\x31\x41\x2C\x35\x4C\x34\x3A\x55\x36\x48\x02\x00'+
            '\x4A\x16\x0A\x44\x1F\x16\x58\x02\x00\x58\x17\x08\x5D\x12\x11\x54\x25\x18\x43\x2A\x28\x46\x31\x2E\x48\x37\x37\x59\x38\x29\x53\x39\x37\x67\x04\x00\x67\x12\x04\x66'+
            '\x1A\x19\x77\x05\x00\x77\x12\x03\x7C\x1C\x18\x66\x2A\x1B\x73\x23\x0F\x7B\x21\x1D\x6B\x27\x27\x67\x35\x27\x6F\x33\x32\x7A\x29\x26\x79\x31\x2D\x7A\x37\x36\x4E\x43'+
            '\x28\x40\x4A\x35\x47\x59\x3F\x56\x58\x3E\x41\x66\x3E\x53\x60\x37\x69\x46\x3D\x7B\x40\x3D\x4C\x44\x42\x49\x5B\x46\x5B\x48\x48\x5F\x50\x4D\x5E\x50\x50\x47\x67\x44'+
            '\x4B\x76\x47\x50\x66\x4B\x53\x78\x4E\x55\x7E\x51\x63\x4C\x49\x68\x51\x4E\x69\x58\x58\x7D\x45\x44\x7A\x55\x4C\x75\x59\x55\x70\x5F\x60\x67\x60\x44\x65\x64\x5B\x6D'+
            '\x78\x4E\x72\x60\x5F\x6F\x63\x63\x77\x67\x67\x7D\x70\x6C\x7E\x70\x70\x4F\x83\x4C\x56\x87\x4D\x57\x87\x53\x5D\x95\x55\x5F\xA1\x5C\x67\x98\x5E\x70\x8F\x5A\x67\x99'+
            '\x64\x76\x98\x6D\x68\xA0\x5B\x69\xA7\x66\x6D\xB1\x6A\x75\xA7\x69\x71\xB6\x6E\x77\xBA\x73\x7A\xC8\x75\x87\x09\x00\x8A\x16\x0B\x86\x1C\x14\x96\x0C\x00\x98\x17\x08'+
            '\x91\x1D\x10\x86\x21\x19\x9C\x22\x0D\x97\x29\x18\x80\x25\x20\x80\x3E\x3D\xA6\x0D\x00\xA7\x16\x02\xB4\x0D\x00\xB7\x19\x00\xA8\x24\x0E\xA9\x28\x15\xAA\x32\x1C\xBE'+
            '\x20\x00\xB7\x28\x15\xB9\x33\x1B\xA2\x37\x26\xB7\x39\x25\x82\x40\x2D\x85\x49\x36\x9E\x42\x2F\x98\x4B\x36\xAA\x46\x2F\xA4\x4A\x34\xB6\x42\x2C\xBA\x4B\x36\xB5\x54'+
            '\x3E\x81\x49\x48\x80\x4F\x50\x84\x51\x4C\x87\x57\x56\x95\x59\x45\x8A\x5E\x60\x8B\x61\x59\x97\x67\x59\x8D\x63\x63\x84\x77\x75\x92\x6A\x6B\x95\x6F\x70\x93\x70\x6F'+
            '\x99\x77\x77\xA6\x58\x42\xB2\x66\x51\xB1\x77\x65\xC6\x1A\x01\xD1\x1E\x04\xC7\x21\x00\xC9\x28\x15\xCA\x33\x1D\xD7\x25\x02\xDC\x28\x12\xD8\x31\x19\xCE\x3C\x25\xD2'+
            '\x38\x23\xE2\x2C\x04\xE1\x2D\x13\xE9\x34\x09\xE9\x38\x16\xF0\x3B\x0D\xF0\x3D\x11\xE9\x3C\x23\xCD\x45\x2D\xCC\x4B\x34\xCA\x51\x3A\xD3\x43\x2D\xDC\x55\x3C\xEE\x41'+
            '\x1D\xF3\x44\x18\xED\x42\x26\xE8\x4B\x33\xEB\x53\x3B\xF3\x4A\x25\xF2\x4C\x31\xF7\x53\x29\xF7\x58\x35\xFA\x62\x3A\xC4\x5A\x42\xD4\x5C\x43\xCD\x6A\x52\xD1\x7A\x63'+
            '\xEB\x5D\x44\xF7\x5D\x41\xE2\x61\x4A\xE6\x6A\x52\xEB\x73\x5B\xFA\x68\x46\xF9\x6C\x52\xFC\x72\x4E\xFC\x78\x58\xF7\x7C\x62\x9E\x7F\x80\x87\x87\x7A\x8A\x96\x7E\x9D'+
            '\x80\x7F\x87\xA7\x7B\x8A\xBF\x7E\xB6\x84\x75\x82\xC6\x7C\x83\xD2\x7D\xD1\x8B\x76\xFD\x80\x5F\xF7\x8B\x70\x8E\x83\x83\x8B\x99\x80\x9C\x82\x82\x9C\x90\x8F\x9D\x93'+
            '\x92\x8C\xA6\x81\x8E\xB7\x84\x90\xBC\x86\xA4\x88\x88\xA8\x8F\x90\xAB\x95\x95\xB1\x9C\x9C\xB3\x9F\xA0\xAA\xA0\x9F\xAD\xA2\xA2\xB7\xA7\xA7\xB8\xAF\xB0\xBD\xB0\xAF'+
            '\xBD\xB2\xB2\x89\xC4\x83\x88\xDA\x82\x90\xC8\x88\x92\xD7\x8A\x89\xE6\x84\x8F\xF1\x8A\x93\xE8\x8D\x91\xF5\x8C\x95\xFE\x90\xD8\x97\x82\xDF\xA0\x8C\xC4\xB8\xB8\xE9'+
            '\x9B\x83\xE5\xA2\x8B\xC6\xBF\xC0\xCA\xC0\xBF\xCB\xC4\xC3\xD2\xCA\xCB\xD7\xCF\xD0\xD4\xD0\xCF\xDA\xD5\xD5\xE1\xDD\xDC\xE4\xE0\xDF\xE8\xE6\xE7\xF0\xEE\xEE\xF0\xEF'+
            '\xF0\xF0\xF0\xEF\xF3\xF2\xF2\x00\x00\x00\x00\x00\x00\x23\x85\x62\xE2\x00\x00\x00\x09\x70\x48\x59\x73\x00\x00\x0B\x12\x00\x00\x0B\x12\x01\xD2\xDD\x7E\xFC\x00\x00'+
            '\x00\x1A\x74\x45\x58\x74\x53\x6F\x66\x74\x77\x61\x72\x65\x00\x50\x61\x69\x6E\x74\x2E\x4E\x45\x54\x20\x76\x33\x2E\x35\x2E\x31\x31\x47\xF3\x42\x37\x00\x00\x16\xA4'+
            '\x49\x44\x41\x54\x78\x5E\xED\x9B\x0D\x74\x53\x65\x9A\xC7\x9B\x23\x4E\x68\xC5\x95\x8A\x03\xD5\xAA\x6C\x9D\x42\xE9\x2E\xD5\xB6\xFB\x29\x1A\x87\xD9\xB1\xA4\xD4\x75'+
            '\x35\xF4\x88\xCE\xCE\x2E\xB3\x2B\x6D\x49\x91\x42\xDA\x32\xF8\x31\xEE\x9C\x9D\x19\xA0\x0A\x0D\x8A\x52\x60\xC0\x11\x28\x65\xDD\x5D\x81\x45\xF1\xFB\xCC\x11\x91\xE2'+
            '\x0C\x23\x0A\x39\xA5\x4A\xD5\x46\x2B\x58\xDB\x3A\x75\xB4\x68\x05\x39\x7B\xCE\xFE\x9F\x8F\x9B\xDC\xF4\x23\xC9\x4D\xC2\x99\xAC\x27\xBF\xF7\xDE\xF7\xBE\x37\xB9\xF7'+
            '\x7D\x9F\xDF\x7D\xDE\x7B\x93\x96\x92\xD6\xF7\x0D\x21\x25\x92\x6C\xA4\x44\x92\x8D\x94\x48\xB2\x91\x12\x49\x36\x52\x22\xC9\x46\x4A\x24\xD9\x48\x89\x24\x1B\x49\x29'+
            '\xD2\xCD\xF4\xEA\x5E\x74\x24\xA3\x48\x6F\x1A\x73\xBB\xEE\x46\x47\x4A\xE4\x1C\x92\x12\x49\x36\x52\x22\xC9\x46\x4A\x24\xD9\x48\x89\x24\x1B\x29\x91\x64\x23\x25\xF2'+
            '\xC7\xA7\x37\x84\x6E\x15\xD1\x5D\x03\x3D\x76\x14\x92\x42\x44\x23\x0F\xCF\x6D\x7A\xF0\x28\xA4\x44\x12\x49\x4A\xC4\x44\x4A\x24\x91\x7C\x63\x44\x7A\x6F\x0F\x61\xAE'+
            '\x44\x3E\x49\x77\x95\xF9\x7A\xF0\x28\x24\x85\xC8\x10\x7A\x6D\x2C\xF2\xFF\xFF\x93\xFD\x63\xF6\x48\x7D\x45\x49\x1E\x52\x22\xC9\x46\x4A\x24\xD9\x48\x89\x24\x1B\x29'+
            '\x91\x64\x23\x25\x92\x6C\x7C\x73\x44\x6E\x63\x22\x7C\x6F\x1F\x42\x32\x8A\xC4\x44\x4A\x24\xD9\x48\x89\x8C\xCA\x9D\xF3\xEE\xB8\xFD\xFA\x89\x13\xC7\x7F\xEB\x5B\xE3'+
            '\x27\x4E\xBC\xFE\x8E\x3B\xE6\x7D\xA8\x6F\x9C\x5B\x12\x29\xD2\x3D\xFF\xB6\x89\x63\x6C\xB6\x34\x94\x20\x78\x8E\x9E\x77\xFE\xF5\x73\x4F\x7C\xAC\x07\x9D\x2B\x12\x25'+
            '\xD2\x3D\xFF\xC6\x49\x21\x02\xA1\xA4\xA5\x8D\x99\x74\xFB\x7C\x6B\x7F\x5D\x62\x8D\x84\x88\xF4\xFE\x68\xD2\xF9\x2C\x61\x4F\xCF\x71\xB8\x8E\x74\x74\x76\x0D\x08\x9F'+
            '\x75\x75\xB6\x79\x5D\x8E\xC9\xE9\x76\xB6\xB9\x68\xE6\x9D\x7A\x46\xE2\x89\x5F\xA4\xF7\xF5\x99\x63\xC8\xC2\x3E\xCE\xE1\xED\x1C\x18\x3C\xFB\xBF\xC3\x38\x33\xD8\xDF'+
            '\x51\x7E\x1D\xCB\xA4\x5D\xF8\xFD\x6E\x3D\x2F\xC1\xC4\x2B\xD2\x3B\xEF\x62\xB6\xC8\x71\x75\x0E\x9E\xD1\xC0\x47\xE2\xEC\x99\x81\x36\x67\x26\x27\x66\xD2\x9D\xE7\x62'+
            '\x8A\xC5\x27\xD2\xFB\x83\xF1\xA4\x91\xE9\x0C\x6F\xA1\x9C\x1D\x68\x73\xA4\x53\x5A\x2E\x39\x07\x33\x2C\x1E\x91\xDE\x79\x17\x42\xC3\x9E\xE3\x1B\x20\x8B\xB3\x28\xA8'+
            '\xCF\xD2\x96\x6B\x59\xCF\x7E\xFD\xF5\x19\x54\xBC\x62\x96\xF5\x7B\x33\x59\xC5\xDA\x17\xA9\x28\x88\x43\xE4\x4E\xCA\x86\xDD\xD1\x89\xDB\xE2\xCC\xD9\x33\x58\x86\x97'+
            '\xAF\x51\xA8\xA6\xF5\x8C\x1E\x35\xE8\xCB\xC1\x0C\x4B\x9B\xF4\xBA\x76\x93\x20\x62\x16\x39\x31\x13\x57\xD6\xEE\x68\x1B\x44\x74\x08\x8F\x8A\x6E\x10\xB3\xEE\xA1\x45'+
            '\x0D\xDE\x72\x43\xAA\x2F\x8E\x4C\xC6\xB9\x63\x6E\xD4\x9E\x12\x43\xAC\x22\x3F\xC4\x27\x9F\x2D\xF3\xC8\xA0\x11\x9C\x46\x3B\x02\x23\xBD\x3E\xE0\xC5\xBD\x92\x36\x3E'+
            '\x91\xB7\x4A\x6C\x22\xDD\x33\x69\x56\xDD\xFA\x99\xC6\x65\x9D\xD3\xEF\x3B\x70\x21\x6C\x73\x13\xF7\xFC\x8A\x49\x64\xFE\xF9\x94\x8E\x36\x4A\xC7\xA8\x9C\xA6\x45\x2B'+
            '\x29\x5F\x9D\x39\x4D\x7C\x75\x66\xF0\xCC\x57\xA7\x4F\x9F\xF2\x8E\x43\x52\xBE\x9D\xB0\x4F\x95\x58\x44\xE6\x9E\x87\x74\x38\xFB\x25\x38\x2E\x12\xE1\xE9\xAF\xD0\xA0'+
            '\x7A\x74\xBA\x8E\x74\x0D\x0E\xCA\x11\x83\xFE\x1C\xBA\x53\xFE\x55\x3B\x8D\x17\xEB\x22\xBD\xDF\xA3\x69\xE5\x1A\xA4\x58\xB0\x9C\x46\xE1\xC0\xC2\x23\x87\x0F\xB6\xE1'+
            '\x3B\x64\xE6\x20\xF1\xD5\xE0\x60\xBF\x13\x26\x69\x77\x68\xBF\x71\x62\x59\xA4\x9B\x3E\xC9\xD3\x8F\x70\x24\xA7\xA9\x96\x22\xA1\x71\xCD\xBB\xB2\x13\x44\xF7\x07\x20'+
            '\x32\x06\x49\x91\xDD\x01\x17\x3D\x88\x67\x26\xE4\x46\xB1\x2A\xD2\x3D\x1E\x57\x71\x5C\x1B\xC7\x11\x02\x85\xA6\x46\x0A\xDA\x81\x25\x40\x7A\x5A\x9A\x2D\x78\xF6\xA9'+
            '\xF2\xB1\xE8\x6E\x52\x22\x4C\x2C\x8A\x9C\xB8\x90\x3C\xDE\xD3\x38\xAC\x73\x2A\x07\x29\x71\xE9\xCE\x97\x58\x8E\xD0\x77\x96\x49\x09\xF8\x61\xC5\x9A\x48\x37\x3D\xAE'+
            '\xC6\xB5\x9D\xD2\x48\x82\x7C\xC1\xCB\x29\x2D\x5F\x7C\xF1\xC5\x29\x59\x4F\x0D\xE5\x56\x88\x5C\x37\xA0\x3B\x60\xC0\x4B\x5F\x24\x27\xC6\x6F\x62\x49\xA4\x9B\xF2\x91'+
            '\xEE\x43\xAC\xA7\x4E\x7D\x29\x81\x28\xC3\x23\x36\x63\x7A\xF7\x08\x44\xD2\x07\x06\xBE\x1C\x38\x45\x36\xA8\xF9\x3E\x49\xC0\xEC\xB2\x22\xC2\x1E\x76\xAF\x06\x61\x01'+
            '\xBF\xD7\xD7\xE1\xEF\xEA\xA7\xB3\x3A\xF1\xC3\xA2\xCD\xAF\x3F\x77\x09\xF4\xEC\x8A\xDF\xC4\x82\x08\xDF\xE7\x36\x27\x8D\x8D\x0B\x29\x48\xA0\x23\x42\xBA\x5A\x7C\x48'+
            '\x43\x9A\x2D\x3D\x33\xE7\xBA\x5B\xCB\xE9\x87\xF8\x23\x7A\xB6\xD0\x45\x9F\x27\xB6\x78\x9F\x5D\x16\x44\xFE\x86\xC6\xCB\x31\x7E\x8A\x65\x02\x42\x03\x9F\x7F\xFE\xF9'+
            '\x00\x8A\x32\xD0\x2F\xBB\x5C\x06\x06\xDA\xE4\x2F\x00\x02\x4C\x28\xEF\xE8\x97\xD3\xF0\xD3\xF0\x67\x03\x1D\xFC\x43\x8A\xB5\x5F\xF5\x0E\x23\x7A\x91\xB9\xE4\x91\xEE'+
            '\x0B\x44\x40\x20\x5E\x86\xB7\xFD\xD8\xE5\x82\xC5\x68\x62\xA7\xBF\x7F\xA0\x63\x8C\x1A\x98\xB8\xC8\xE1\x6A\xF3\x77\x81\xCF\xBA\xBA\xCA\xE9\x36\x49\x8B\xEF\x2B\x64'+
            '\xD4\x22\xF3\xF0\x39\x68\xB3\xB9\x68\xDC\xFE\x2E\x0A\xEF\x33\xAA\x38\x50\x86\x5A\x14\xF8\x67\xFA\x5A\xF0\x9D\xFE\x7E\xFF\x77\x73\x32\x33\xD3\xE9\x0B\x6F\x00\x6E'+
            '\xA6\x4F\xE8\x44\x77\x5D\x5D\x7E\xFE\x06\x39\x26\xAE\xEF\x5D\xD1\x8A\x9C\xA0\xAF\xED\xB6\xC9\xB8\x86\xA4\x00\x1D\x8D\x31\x3A\x38\xDA\x8E\x0E\xFA\x8D\x4A\x26\x7B'+
            '\x18\x78\xE9\x9D\xAE\xAE\x36\x7C\x81\xB4\xD9\x2E\xE9\xD1\xC1\x62\x21\x5A\x91\x8B\x69\x24\xFB\x11\x19\x17\x68\x84\x16\xE0\x93\xBA\xFA\xF9\x7E\xC9\x71\x64\x8E\xE1'+
            '\x9C\x38\xDE\xE7\xDE\xFC\xFC\xE4\xB2\x45\xF8\x4B\xA6\xB0\x44\x29\xC2\x37\x88\x2D\xA7\xB3\xEB\x03\x1E\xB8\xAB\xFF\x83\x0F\xFC\xFD\x1F\xA0\x28\xD4\xFC\xC0\xA8\x14'+
            '\x3F\x0E\xF1\xD3\x71\x7E\xB4\xFC\xD8\xA0\xD1\xEF\xEF\x20\x01\xA7\xDF\xDF\xE1\x43\x76\xD2\x27\xF8\x3B\xDF\xEF\xF4\x77\xFA\xDF\xE3\x94\xC4\x73\x9B\x44\x27\xF2\x3B'+
            '\x9E\x58\xF6\x56\x0C\xC9\xBC\x4F\x01\x22\x3C\xAE\x08\x34\x25\x74\xAA\x82\xE0\x0D\xAC\xA4\xF3\x3E\x1F\x46\xE0\xDB\x56\xDA\x75\xDA\x6E\xF3\xF9\xD1\x65\x67\x67\xA7'+
            '\xA6\xE4\xA2\xD8\x27\x57\x74\x22\x13\x79\x98\xC9\xEF\xC1\x43\x55\x40\x40\x41\x4B\xE0\x25\x13\xC3\x5E\xF0\xFB\xE9\x26\x49\xD7\x36\x60\x8F\xCE\x4E\xBE\x4B\xEC\xB6'+
            '\xEF\xE9\x80\xD6\x89\x4A\x44\x9E\x58\x36\x57\x67\x47\x67\x87\x8E\x1F\x3B\xF4\xB5\x31\xBD\xE3\x5D\xFF\xBB\xFE\x77\x88\x77\xDF\xE9\xA4\x6E\x3B\x1C\xF4\x08\xB6\x9D'+
            '\xF7\x3B\x1D\xD2\x32\xD1\x88\x74\x5F\xC4\x1E\xE3\x7C\x1D\x1D\x1D\x78\xF6\xF0\xF8\xEF\x20\x0E\x3F\x82\xA1\x12\xD8\xCA\x06\xEF\xD0\x42\x20\x4C\x2C\xA8\x4C\x38\x20'+
            '\x62\x43\x57\xEF\xA0\x23\x74\x68\xC0\x9F\x25\x76\xDB\x24\x1D\xD3\x32\xD1\x88\xC8\x9D\x6E\xCF\x69\xD3\x31\x0D\x17\x2B\xE8\x29\x38\xD5\x09\x91\xB4\x72\xED\xC8\xA0'+
            '\xAD\xC3\x47\xBF\xB8\xC3\xFD\x1E\xEB\x8F\xBE\x51\x88\xC8\x47\x88\xCD\x5E\xD6\xE1\xEB\x78\x5B\x07\x16\x38\xC0\x40\x63\x08\xF2\xCE\x70\x5C\xFC\xD8\xD2\x9D\x0E\xF4'+
            '\xC8\xA5\xCD\xE7\x40\x3E\xC0\x78\x1D\xD5\x2A\x51\x88\xD0\x6F\xE2\xE0\x91\xEE\xF5\xF9\x7C\x6F\x83\xE3\x6F\x1F\x37\x84\x42\xBD\xA2\xE2\xB8\x97\x32\xE2\x40\xEC\x41'+
            '\xD0\xAD\xCF\xC7\x5F\xE7\x41\x8C\x29\x89\x2C\xD2\xCB\xDD\xDB\xED\x93\xD7\xC2\x83\x4D\x82\x50\x34\x1D\xC7\x8F\x1F\xD7\xCB\x0A\x45\x14\x69\x9B\x5F\x09\x61\x2D\x89'+
            '\x4C\xD6\x1D\x40\x97\x07\xAB\xCF\x3B\x16\x26\x58\x62\x4C\x49\x64\x11\xB9\x43\x6C\xF6\xEF\xAC\x25\x0E\x68\x5A\x46\x62\x58\xCC\x23\xE2\xCB\xC9\x1C\x97\x9E\x49\xA1'+
            '\xFB\x7C\x6B\x5F\x43\x97\x3E\xEE\x78\xED\xDA\xC9\x76\xC9\x49\x6C\x29\x89\x28\xC2\x3F\xDD\x22\x21\xF6\x12\x1D\x8F\x19\xDD\x26\x3C\xAF\xD1\x75\x78\xED\x80\xF6\x12'+
            '\x82\xF7\x3B\x76\xB9\x4B\x26\xEA\xC8\xD6\x88\x28\xF2\x43\xD2\x80\x48\x46\x59\xA3\xB7\x51\xC7\x34\x71\x60\xDD\x81\xB5\x98\x19\xEB\xDE\x3E\x80\x49\x83\xE2\xF3\x1D'+
            '\xE2\x2D\xB7\xE8\x75\xD9\xD1\xA3\xC3\xF1\x50\x29\xAE\x16\x89\xD8\x62\xFA\x16\x1C\x51\x84\x7F\x2C\xC4\x10\x59\x65\x6B\x1A\xD7\xAC\x69\x6C\x7C\xF8\x61\x1D\x98\x58'+
            '\xE7\x5B\x7B\x00\x97\x77\xDD\x01\xAA\x69\x1F\x1B\x6A\xD1\x56\xDA\xF2\x3A\x41\xB3\x68\x08\x6B\xD6\xAE\x61\x1A\x99\xD2\x0C\x88\x90\x4A\x4C\x1F\xEF\x91\x44\xE6\x93'+
            '\x06\x25\x24\xAB\x41\x86\x6B\x24\x1F\x42\x83\x31\x13\x8C\x3A\x2C\x0F\xF3\xF9\xD4\x95\x5C\x1B\xA5\x2C\x83\x4C\xC0\x18\x1D\xDB\x12\x91\x44\x6E\xA4\x9E\xE1\x91\x91'+
            '\xF5\x60\xD9\x83\x01\x17\x13\xB8\xAC\x0F\x71\x01\x5C\x99\x41\xF6\x1E\xE6\xEB\xFE\xF0\x9A\x87\xF4\x78\x04\x4E\x55\x30\xFE\x00\x65\x59\x86\x49\x2C\x5F\x82\x23\x89'+
            '\xE0\xC7\x3A\x4E\x08\x32\xC2\x34\x1A\x32\x40\x02\xB3\x82\x9E\x18\xE0\xC1\xC6\x86\x07\x1B\xB0\xA0\x02\x2C\x42\x26\x33\x75\x70\x2B\x44\x10\xF9\x2D\x7D\x5D\x64\x8F'+
            '\xAC\x86\x32\x14\x83\x55\x8D\xAB\x34\x16\x45\x23\x1D\x8E\xBE\x6F\x06\x57\x43\x22\x0F\xA5\x34\x8B\x4C\xE8\x2E\xB9\x30\x86\x6F\xF3\x11\x44\xE6\x72\x3E\x70\x87\x64'+
            '\x5D\x5A\x5A\x5A\xBA\xA2\x74\x45\xD0\x85\x59\xD5\xA0\x46\x6C\xC6\x4D\xDD\xF2\x1B\x46\x02\xE5\xCA\x8F\x4C\x59\xC3\x8A\x86\x32\xF4\x5B\x06\x91\x2C\x9D\x5B\x31\xFC'+
            '\x53\x69\x04\x11\x3C\xB3\xC8\x03\x22\x59\xEC\x51\xBA\x7C\x79\xE9\x10\x17\x81\xE3\x44\xB5\xCA\x98\x29\x3A\x5F\x1A\xA9\x1A\x99\x15\xCB\x71\x6D\x4A\xA9\x47\xAE\x96'+
            '\xCF\x20\x11\x79\x72\xC5\x30\xB7\xC2\x8B\x9C\xA0\x44\x73\x42\xB2\xB2\x8A\x79\x58\x8C\x49\x2B\x58\xB9\x52\x03\x1A\x02\x54\xB0\x8C\xCA\x8A\x86\xE5\x2B\x38\xF6\xD2'+
            '\xE5\x65\x28\xB3\x4B\x4B\xB1\x30\xD7\xD0\x28\x92\x92\x6F\xEB\xF8\x16\x08\x2F\xF2\xA3\xC0\x1D\x92\x95\x7D\x8D\x8E\x27\xAC\x24\x17\x65\x25\x9C\x96\x6B\x9C\x14\xA9'+
            '\x19\x7A\x7D\xC5\x4A\xC4\x8E\xE8\x09\x5C\x07\x49\x04\x11\x6C\x11\x05\x2C\x22\x29\xB1\xFE\x99\x18\x5E\xE4\xEF\x68\x62\x49\x42\xB2\x0A\x66\x14\x17\x17\xCF\xD0\x41'+
            '\x81\x04\x66\x09\x3D\x33\x40\x31\x95\x19\x33\x66\x14\x73\x99\x9A\x9D\x4D\x26\x9C\x12\xEB\x0F\xE0\xF0\x22\x97\xE8\xA3\x37\x0B\x63\x4C\x2D\x2E\xBE\x16\xE3\x41\x86'+
            '\xC7\x2F\x2D\x5D\x4C\xB1\x68\x88\x91\xE1\xC8\x4D\xA0\x0B\x00\x0F\xDA\x50\xA7\xC5\x57\x64\xA9\x08\x4C\xAC\x7F\xB8\x87\x15\xE9\x4E\x0F\x24\x24\x3B\xEB\x0A\x19\x51'+
            '\x91\xF1\x17\x73\x05\x96\x2F\xBE\x1F\x2B\x97\xE5\xCB\xEF\x47\x4D\xEB\xE2\xE5\x94\xC0\x19\x7C\xD9\xE9\xC2\xA3\x85\xAB\x1F\xC4\xDC\x06\xD9\x04\x99\xE0\xE2\x4D\xD0'+
            '\x08\xA2\x27\xAC\xC8\xEB\xF2\xCC\xA2\x84\x80\x6B\x74\x40\x03\x9A\x0F\xC5\xF7\x2F\xA6\x4B\xBB\x18\x46\xE4\x13\x84\x1C\x51\xF1\x96\x85\x79\x3B\x1C\x74\xAA\x4B\x01'+
            '\x69\xB0\x08\xB0\xFE\x2D\x25\xAC\xC8\x3C\xF6\x20\x11\x52\x29\x28\x28\x2E\xA0\x21\x87\x62\x0A\x5A\xE1\x97\x0C\x99\x51\x91\xAE\x8A\xAE\x29\xBE\xA6\x90\x16\xDC\x22'+
            '\x84\xCE\x2D\xCB\x1F\x89\x61\x45\x6E\x34\x27\x24\x7B\x6A\x61\x61\x71\x21\x28\x28\x2A\x2A\x2A\x2E\x2C\x2E\x42\x11\xB0\xBB\xB8\x70\x31\xF6\x17\xF3\xAB\xD8\x2B\x0A'+
            '\x13\x3F\x0E\xA1\x7E\x8A\x0A\xD0\x13\x17\xA6\xA0\xF0\x0A\x19\x45\xEF\x12\xCB\x77\x7B\x58\x91\x99\xE8\x12\x22\x32\x42\x76\x36\x0D\xCB\x41\x80\x22\xAE\x41\x4D\x61'+
            '\x4D\x51\x11\xAD\x35\x8B\x51\x15\xA3\x5E\x5C\x08\x2B\xA5\xB8\x86\x95\x71\x52\x31\x4E\x09\x9C\x54\xC4\xFD\xC8\x4B\x05\x50\x22\x1B\x1D\x44\x53\x32\x4F\x43\x88\x9A'+
            '\xB0\x22\x17\x93\x47\x50\x84\x2F\x9E\x5C\x41\x84\x44\x41\x14\x21\x18\x44\x5E\x53\x54\x03\x03\xBC\x04\x1B\xA8\x15\xD7\xA0\xA2\x97\x8B\x6B\xE0\x51\x54\x43\xF1\x9B'+
            '\x4E\xA0\x65\x38\x98\x59\xB9\x28\x24\x02\x13\xDB\x5C\x0D\x21\x6A\xC2\x8A\x5C\xC4\x09\x51\x11\x0C\xA3\x63\x06\xA0\x80\xB1\xA2\x2A\xC2\xB6\x86\x56\xE4\x46\x43\x27'+
            '\x02\x29\x18\x19\x9E\x5D\xBA\xC9\xCD\x85\x05\xAB\x70\x4A\xAE\xD7\x10\xA2\x26\x9C\x48\x2F\x9E\xBE\x9C\x10\xEA\x1F\xE3\xE4\x06\x66\x74\x00\x56\xA1\xE8\x51\xB3\x0E'+
            '\x0B\x19\x4E\x5C\x46\x67\x3A\x2D\x54\xB0\x4C\xA5\xFE\x09\x11\xC9\xF8\x4B\x8D\x21\x6A\xC2\x66\xC4\x96\xA1\x33\x8B\xAF\x14\x46\x99\x5E\x98\xAF\x63\x53\xD1\x88\x25'+
            '\x6C\xC5\x68\x88\x03\x2F\xDC\x0A\x20\xD1\x33\xD8\x70\x2B\x1F\x2B\x4B\xB0\x0B\xCF\xAD\x0C\xCB\xDF\xB6\xC2\x66\xC4\xA6\x9F\xEA\x3A\x44\x6E\x2E\x34\xE0\xC2\x41\x54'+
            '\x15\x2E\x9C\x5E\xB3\x50\xC3\x1E\x11\x11\x14\x95\xAA\xC2\xE9\x0B\xE9\xB4\xE9\xF9\x85\xF9\x58\xA4\xF0\x0B\x02\x12\x62\x80\xE7\x16\x32\x62\xF9\xB7\x5B\x61\x33\x92'+
            '\x96\x01\x38\x1F\x06\xF9\x3A\xFA\xC2\xFC\xE9\x0B\x17\xD6\x40\x86\x19\x51\x88\xDF\xAF\x9A\x2E\x05\x67\xC8\x89\x44\xFE\xF4\x7C\x42\xEA\xFC\xA9\x54\xE5\x69\xFF\x40'+
            '\x6E\xF7\x3F\xD1\x10\xA2\x26\x9C\xC8\xC7\x24\x22\x09\x31\xA0\xD1\xB1\x54\xE5\xD7\x54\x21\x34\xB5\x18\x85\x9A\xAA\x9A\xAA\x85\x28\x48\x07\x5A\xE4\x63\xC4\x4E\x7D'+
            '\x70\x47\xD2\xDB\xF4\x7C\xF4\x9C\xA7\x85\xE7\x96\x3D\xE3\x42\x8D\x21\x6A\xC2\x4E\x2D\x11\x61\x03\x82\xC6\x41\x10\xB0\xC8\xAF\x42\x80\xA0\x86\xB6\x1A\xF7\x30\xE8'+
            '\x10\x92\x61\x70\x16\x4C\x78\x3B\x02\x79\x79\x86\x07\x4C\x38\x23\x89\x15\xB1\xF1\x2D\x12\xB4\x40\xC9\x83\x88\xC2\x91\x9A\x3C\x16\xE9\x96\x90\xF7\x03\x98\x6C\xF8'+
            '\x74\x6E\xB0\x13\x37\xD8\x83\xA0\x9A\x45\x32\x12\x3B\xB5\x48\x44\x66\x16\x0D\x21\x63\x4D\xA3\x50\x44\xC6\xF0\xA8\x5A\xC4\xA5\x6A\x51\x35\x36\xD5\xD5\xD5\x55\x28'+
            '\x6A\x39\x02\x14\xBB\xD1\x12\xB8\x5F\x81\xC6\xC8\xCE\x86\xC8\xC5\x1A\x43\xD4\x44\xCE\x88\x58\x18\x1E\x79\x79\x3A\x3A\x87\xC9\x31\x53\xF8\x01\x17\xBC\x80\x95\x5E'+
            '\x25\x78\x7F\x44\x54\x87\x2E\x8A\xF6\x6B\x90\x9B\x8B\x8C\x64\x5D\x6C\xF5\x4F\x53\xC2\x8A\xA4\xCB\x2D\x02\x07\xC3\x82\xE0\x40\x00\x5B\x20\x05\x08\xBA\x52\x03\x37'+
            '\x60\x15\xA3\x50\x35\x8C\xCA\xAA\xCA\x4A\x5A\xB1\xE4\x55\xA0\x98\xC8\xA5\x8C\x24\xF6\x03\x51\x44\x42\x2C\x68\xD4\x4A\x04\x52\x5D\xE5\xD6\xA0\x23\x53\x55\x5D\x09'+
            '\x57\x37\x4A\x10\x32\x61\x8F\x69\xA4\x81\x52\x21\x5B\x90\x8B\x2F\xC0\x19\x7F\xA5\x21\x44\x4D\xD8\x8C\x64\x8A\x88\x19\x0C\x58\x51\x51\x59\xE9\xAE\x72\x57\x61\x71'+
            '\x57\x73\x59\xC4\x35\x37\xB8\x8D\x0D\x1B\xC8\x8B\xD5\xEE\x4A\x4A\x19\x8A\x86\xAF\x0A\x02\x77\x08\x44\x05\x6B\x5E\xEE\xE5\x10\xF9\xBE\xC6\x10\x35\x61\x33\x32\xC1'+
            '\x4E\x0F\x2D\x55\x90\xCB\x26\xA3\x55\x56\x43\x82\x62\x44\xB0\x14\x39\x2A\x29\xB4\xDC\xC5\xFB\x86\x05\x6D\xB9\x8D\x8C\xD0\x3A\x24\x33\x81\x2E\x65\x43\x0B\x3F\xB6'+
            '\xFE\x59\x43\x88\x9A\xB0\x22\x0E\x93\x08\x2E\x15\x86\xD1\x21\x2B\x28\x28\x0A\x8E\xA0\x30\x3D\xD5\xC1\x02\x15\xB7\xDB\xB3\xC8\xE3\xE6\x36\x1D\x26\x1A\x32\xBB\xCC'+
            '\x25\x98\x0F\x13\x10\xB9\x34\x23\xC3\xF2\x3F\x5B\x85\x15\xB9\x99\x7E\xAA\x12\x8B\x80\x02\x51\xB9\x60\x81\x44\x27\xA1\xBB\xEB\xDD\x8B\x10\x38\x42\x5F\xEA\xF6\x2C'+
            '\xF5\xD4\xBB\x97\x52\x1B\xAF\xCA\xBB\x02\x1D\x4E\x88\x83\x2C\xE4\x81\x35\x54\x27\x2F\x0F\x53\xEB\x02\xCB\x7F\x38\x10\x56\xE4\x9F\x6C\xF4\x31\xA2\x1A\x86\x4B\x65'+
            '\xC5\x02\x2A\x14\x94\x78\x2C\xF2\x30\x6E\x4F\xBD\x07\x1A\x6E\xD4\x6E\x0F\xB5\xE1\xE3\xE1\xE4\xA0\x0C\x07\x26\xE8\x04\x1D\x61\xA9\x5C\x50\xE1\xE6\xBE\x41\x65\x05'+
            '\x7D\x6D\x1C\xAB\x11\x44\x4F\x58\x91\xDF\x8C\xC5\xD4\xA2\x84\x00\xCD\x08\x8D\x8C\x7C\x50\xA1\x08\x39\x6E\x0F\x5C\x96\x72\x03\x6B\x3D\x0A\x65\xC5\x73\x17\xF6\x69'+
            '\x45\x45\xC9\x19\x62\x83\xD3\xA9\x27\xB8\x54\xB8\x69\xC3\xBD\xA2\x77\x80\x9B\xFD\xD2\xC9\x96\xFF\xC2\x31\xAC\xC8\xB1\x74\xFA\xEE\x1B\xB8\xCD\x01\x86\x34\x4C\x28'+
            '\x36\x4E\x86\xB8\x00\x72\xA0\x22\x6D\x6E\x42\x89\x77\xC9\x43\x8A\x81\xF4\x42\xA0\x43\x52\x50\x9B\x8A\x8A\x29\xC8\xC8\x5F\x6B\x04\xD1\x13\x56\xE4\xC3\x1C\x7A\xFC'+
            '\xAA\x03\xD0\xB1\x38\x21\x9E\x05\x14\x17\x4D\x26\x8D\x39\xB0\xA9\x97\x85\x65\xF8\x05\x1C\x23\x2E\x01\x1F\xBA\x0E\x2C\x43\x3D\x89\x0E\xD7\xEC\x83\x9B\x3D\xEB\x07'+
            '\x1A\x41\xF4\x84\x15\xE9\x71\xD8\xF9\x1E\x09\x6A\xD0\xD5\xC3\x80\x9E\x05\x1C\x96\x01\x45\xBC\xCC\xB3\xAC\xBE\x8E\x4A\x5D\x1D\xDA\x75\x58\xB0\x23\x42\x01\x51\xC5'+
            '\xED\x59\xE2\x5E\xB2\x60\x89\x5A\x04\x5D\x98\x8A\xCA\x29\x78\x6A\xBD\xAE\x11\x44\x4F\x78\x11\x97\x9D\x1E\xBF\x41\x0F\xC1\x83\x7C\x78\x3C\x4B\x78\x01\xF5\x1E\x84'+
            '\x0E\x0F\x89\x7F\x59\x3D\x84\xD8\xA9\x0E\xAF\x53\x31\x3B\x10\x74\x67\x2D\x41\xB5\xC0\xB3\x04\x57\x84\x56\x64\x37\xE8\x82\x0F\xC4\xEC\xCB\xAC\xFF\x93\x55\x58\x91'+
            '\xBE\x83\xE9\x86\x48\x50\xC3\x8D\xC1\x11\x89\x46\xC5\xA1\xB2\x45\x5D\xFD\x32\x48\x20\x21\x02\x5E\xC0\x0E\xBD\x4E\x3B\x54\x42\xA1\xEB\x80\xAE\xA0\x45\x36\x54\x51'+
            '\x41\xF7\x95\x10\xF9\x5B\x1D\xDF\x02\x11\x44\x26\x64\xB0\x48\x50\x03\x97\x31\xE0\x20\x16\x28\x00\x12\xBC\x41\x43\x21\x09\xD2\x40\x9E\x70\x04\xDA\xD8\x9A\x53\x43'+
            '\xDD\x90\x0D\x49\xB0\x0C\x0A\x36\x15\x79\x98\x5A\xFF\xA8\xE3\x5B\x20\xBC\x48\xBB\xD3\x1E\x22\x42\x83\xD1\x14\x57\x17\xC3\x42\x50\x01\x49\x0A\xE5\x43\x64\xA8\xAD'+
            '\xC8\x09\x72\x2E\x90\xA4\xF0\x46\xDA\x4B\x70\xDF\xB8\x49\xC4\xFA\x2D\x12\x41\xE4\x23\xD7\x58\x7C\x90\x40\xC4\x00\x97\x8E\x07\x05\x21\x0E\x62\xA1\xE1\x1B\xB0\x89'+
            '\xE1\xC1\x47\x53\xC5\x27\x72\x0F\xE2\x60\x78\x50\xCF\xB8\x4E\x15\xD3\x72\x2F\xFF\x0B\x1D\xDE\x0A\xE1\x45\x7A\x5A\x33\xF9\xF9\x2B\x16\xC8\x87\xC9\x22\x60\x22\xD1'+
            '\x93\xC0\x06\x14\xD9\xF0\x16\x2F\x6E\xD0\x77\xE4\x48\xD5\x09\x08\xD1\xC2\x36\xA2\x44\x15\x6E\x91\x29\xD9\x31\xCC\xAC\x08\x22\x7D\x47\x79\x6E\x05\x3C\xE8\xFA\xD1'+
            '\xB8\x41\x0B\x82\xE2\x47\xE8\x1B\x64\x0D\x61\xD9\x06\xBC\xCB\x1E\x50\x92\xA3\x01\xA5\x44\x16\x43\x85\x3D\xD0\x3B\x32\x32\x65\x4A\x2C\x33\x2B\x92\xC8\x87\xAE\xF4'+
            '\x2C\xDC\x24\xAC\x61\x64\xA4\x6E\x09\x8A\xC1\xB2\xA6\x26\x84\x88\x60\x35\xF2\x11\x60\xCD\xBA\xBA\x26\x94\xA0\x0B\x01\x13\x74\xC4\x57\x45\x4D\x3C\x9E\xCA\x69\xB9'+
            '\x53\xAE\xD2\xC1\x2D\x11\x41\xA4\xC7\x9B\x43\x37\x89\x48\x00\x1E\x8D\x22\x10\x28\x38\x5C\xF3\x88\xB0\x26\x1D\x3A\xD4\x85\x54\x6A\x3D\x54\xEA\x24\x23\x15\xD3\xA6'+
            '\x5C\xFE\x2F\x3A\xB8\x25\x22\x88\xF4\xB5\xDE\x3C\x16\x37\x09\x79\x88\x09\x0D\xAC\x21\x90\xC7\x86\x26\x0E\x34\xC0\x26\x53\x19\x02\x8E\x6C\xDA\xD0\xD4\x44\xEE\x4D'+
            '\x7A\xBE\x19\xEA\x99\x6E\x91\x69\xB9\x57\xC6\xF4\xE7\xD8\x91\x44\xDA\xCB\x33\x31\xB7\x90\x11\xC2\x53\x4B\x73\x41\x4D\x10\x13\x02\xD3\x28\x39\x74\x40\x95\xAE\xBC'+
            '\x0C\x35\xA2\x33\xC8\x25\x54\xA6\xB6\xAE\x96\xFB\xAD\x5D\xB2\x00\x33\xEB\x1F\x74\x68\x6B\x44\x12\xE9\xF1\x3A\x33\x54\xA4\x76\x09\xA6\x80\x49\xA3\x8E\x62\xA2\xE8'+
            '\x28\x66\x89\x7B\x28\x81\x37\x4C\x3A\x94\x19\x3E\x9B\x64\x48\x47\x3A\xAC\xAD\xC5\x16\xB7\xC8\xB4\x2B\x4F\xE8\xD0\xD6\x88\x24\xD2\x77\xD0\x85\x94\x60\x6E\x91\x87'+
            '\xA1\x41\x51\x00\xCE\x87\x86\x6F\x48\x6C\xD1\x6D\x00\x7D\x83\x95\xC4\x43\x4E\x0D\x40\x32\x48\x09\xB9\xD4\x2D\xA8\xCC\x9B\xF2\xF7\xB1\xFD\x67\xAB\x88\x22\x1F\x79'+
            '\x6F\xA0\x94\xC0\x82\xA9\xAB\x6D\xAA\xD5\x08\x10\x0D\x5D\xE9\xA0\x04\x59\x6C\x91\xB2\x45\xB6\x66\xF8\x28\x54\x38\x49\x72\x42\xC8\x15\x01\xB5\x4D\xE4\x82\x5B\xE4'+
            '\xF2\x18\xFF\x3A\x3E\xA2\x48\x5F\xAB\x2B\x13\xCF\x2D\x64\x44\x2D\x02\x63\x23\xA4\x4D\x9B\xD6\x53\x78\x8C\xC6\x8E\x22\x2D\xAA\x78\xDF\x04\x7B\xAC\x07\x94\x4D\xED'+
            '\x86\x6C\x70\x6D\xA8\x6B\x7A\x66\x95\xC4\xF8\x3F\x2F\x22\x8B\xB4\x97\xCF\xBA\xC0\x48\x09\x0F\x27\xAC\x6F\x5A\xBF\x09\x8B\x01\xC7\xBE\x69\x1B\x24\x50\x73\xE1\xC6'+
            '\x10\x11\x02\xE7\xB0\x0A\x95\x50\xE8\x16\xB9\xF2\x37\x3A\xAC\x55\x22\x8B\xF4\x79\x5D\x7F\x9A\x35\xAD\x62\x09\x5F\x35\x03\x44\x62\x4E\x06\x39\x18\x05\x2A\xDB\x50'+
            '\xA8\x12\x31\x10\x2A\x84\x53\xE9\x74\x98\xB0\x8F\x01\x9E\x59\x95\x53\x66\xC7\x98\x90\x68\x44\xDA\xCB\x6F\xBE\x00\xB7\xBB\x29\x1D\x34\x3C\x85\x23\x71\x21\x48\x03'+
            '\x35\x90\xB6\x61\x21\x84\xBA\x80\x61\x99\xA1\x84\x5C\xF5\x5B\x1D\xD4\x32\x51\x88\xE0\x2E\x71\x5C\x3A\xC5\xED\x31\x6E\x0E\x1A\x9E\xE3\x20\x34\x4C\x31\xA0\x9A\x2A'+
            '\x46\x5F\xE4\x55\x90\xFB\x46\x74\x58\x83\x4D\x04\xF4\x8B\x5B\x7D\xCA\x9C\x58\x13\x12\x95\x48\xBB\xF7\xA6\xC9\x97\x57\x54\x53\x3A\xF8\x02\x06\xA7\x15\x07\x07\x24'+
            '\x78\x35\x18\x82\xBC\x15\x84\xCE\x90\xB3\x81\x58\x30\x94\x90\x92\x76\x1D\xD2\x3A\xD1\x88\xF4\xB4\xBA\x9C\x97\x4D\xAB\xF4\x40\x61\x23\x0D\xB9\x79\xFD\xE6\x4D\x9B'+
            '\x37\x6D\xDA\xBC\x65\xCB\x56\x8A\x8C\xC3\x1D\xCA\x76\xDD\x9A\xA0\x63\x05\x64\x25\xE0\xC2\x12\xA0\xA9\xAE\xBA\xF2\x2A\x6F\xEC\xFF\x61\x37\x1A\x11\x7C\x96\xB8\x1C'+
            '\x97\x55\xDD\x55\x4B\x1A\x62\xB1\x79\xD3\x56\x2A\x50\xD9\xD6\x1C\x30\xD9\x1E\x2C\xB2\xA0\x04\x30\x8E\x82\xBC\x16\x74\x20\x5D\xA1\xCB\xF5\x9B\xEB\xEA\x2B\xFF\xCC'+
            '\x75\x52\x07\x8C\x81\xA8\x44\xF0\xF1\xEE\xBA\x6A\xAA\xBB\x7E\xE3\xFA\xCD\x9B\x37\x6E\x16\x60\xD1\xBC\xA5\xB9\x79\x5B\xF3\x36\x2C\xA8\x38\x09\xDB\x15\x69\x88\x93'+
            '\xD8\xF0\x61\x58\xB7\x34\x93\x0A\x96\xCD\x28\xA8\x0D\x9B\x8D\xF5\xEE\xE9\xB3\x5A\xE3\xF8\x1F\xD4\xD1\x89\xF4\x78\x5D\xCE\xC9\xF9\xEE\xBB\x37\xE2\xD2\x31\x5B\xB7'+
            '\x6E\x6D\xDE\xDA\xCC\x1E\x54\x6D\x6F\x6E\x21\x38\xFC\xED\xDB\xCD\xDB\x9D\xDB\x5A\xB6\xB5\x6C\xC7\x01\xAC\x8B\x22\xF2\xCD\xCD\x92\x15\xE4\x45\x3A\x5C\xB6\xF4\xCF'+
            '\xAF\xF5\x7E\xA4\xC3\xC5\x42\x74\x22\x7D\x27\x61\x72\x65\xD5\xD2\xBB\x65\x54\x68\xC0\x62\x1B\xAB\x10\x2D\x28\x3B\x9B\x5B\x76\xB6\xEC\xD4\x05\xAB\x34\xB6\xB7\xA0'+
            '\x05\xF8\x90\x20\x74\x15\x50\x14\xF4\xB8\x71\xE9\xC2\xAB\xBD\x71\x4C\xAC\xA8\x45\xFA\x8E\xB9\x6E\x2D\xB9\xB2\x7A\x29\x26\x16\x0D\xCD\x71\x18\x20\x52\x84\x1E\x11'+
            '\xD1\x31\x61\x72\xD9\x78\xF7\xD2\xAB\x5D\x07\xE3\x98\x58\xD1\x8B\xE0\xC9\x75\x53\x49\xC1\xA2\xBB\x37\x3E\xF6\xD8\xD6\x1D\x5B\x77\x68\x2C\xB0\x68\xDE\xF9\xA4\x46'+
            '\x1A\x8E\x16\x1C\x87\xEA\x49\xE8\x0C\x4F\xCD\xD6\xC7\x7E\xB9\xA8\xE8\x16\x6F\xCC\x1F\x21\x4C\xB4\x22\x7D\x1F\xE1\x19\xEC\x28\xB8\xF7\x9E\xC7\xC9\x63\xEB\x8E\x1D'+
            '\xCD\x28\x2D\xBB\x76\xEE\x22\x8F\x3D\x1A\x6E\x28\xF2\x6A\xF0\x3D\x6A\x35\xEF\x41\xD9\xD1\xB2\x43\x65\xD0\x07\x96\xC7\x7E\xF9\x63\x78\xC4\x73\x83\x80\xA8\x45\xF0'+
            '\xB1\xE8\x72\x5E\x7B\xF5\x8F\xEF\x79\x7C\x87\xB2\x8B\x78\x72\xD7\x9E\x5D\x7B\x76\xEE\x51\x9E\x36\x83\xBD\x9D\x4F\xF3\x7B\xF2\x3E\x6A\xC8\xEC\x79\x12\x6B\x0B\xCE'+
            '\xA4\x2E\x60\x82\xE5\x57\xF7\x14\xCD\x9E\x13\xEB\x97\x45\x83\xE8\x45\xFA\xDA\xE7\xC0\xA4\x08\x39\x61\x0D\x78\xB4\x70\x7C\x06\x14\xFB\x4E\x0A\x7D\x0F\x96\x3D\x68'+
            '\x90\x89\xB1\xC8\x21\x02\xA9\x43\x1E\x15\xF7\xF3\xF8\xAF\xEE\xFB\x49\x59\xF9\x51\x1D\x24\x66\x2C\x88\xF4\x1D\x75\x61\x76\x15\xDD\x7B\x1F\x99\x20\x94\x20\x9C\x80'+
            '\x08\xE8\xA1\x0A\xCB\xEC\xDA\xB1\x87\x44\xEE\xFB\x89\x73\x4E\xAB\x0E\x11\x3B\x56\x44\xF0\xED\xF1\x16\x67\x49\xF1\xBD\x3F\x7F\x7C\xF7\xAE\x5D\x4F\xED\x31\xCA\x5E'+
            '\x0D\x35\x0A\xF6\xB2\xC5\x53\x5C\x83\xA7\xF6\xEC\xDE\xF5\x1F\x3F\xBB\xBF\xCC\xD5\x1A\xDF\x8D\x4E\x58\x12\xE9\x69\xC5\xEC\x2A\x99\xF1\x6F\x3F\xFB\xAF\xDD\x4F\x09'+
            '\x7B\x87\xF0\xCC\xDE\x67\x0C\xB8\xFD\xF4\x33\xFA\x86\xF0\xF4\xDE\xBD\x4F\xED\xD5\x53\x89\xDD\xBB\x9F\xF8\xF7\x19\x65\x73\x12\xE0\x61\x4D\x44\x72\x32\x6B\xC6\x4F'+
            '\x7F\xFE\x04\x99\x20\x24\xC4\x65\xC0\x0E\xBA\x9A\x85\x08\x3D\x24\x88\xE8\xB0\x87\x2B\x11\xF9\xB0\x2C\xC2\x39\x99\x75\x2D\x4C\xFE\xC7\x9C\x0D\x8D\x37\x2C\x90\xDB'+
            '\xFB\x12\x8E\xA5\x15\x15\xCA\xEE\x17\x9F\xF8\xE9\xEC\x04\x79\x58\x15\xE9\xEB\xA1\x3B\xDE\x59\x72\xFF\x2F\xFE\xF3\xB9\x97\x94\x97\x5F\x7E\x99\x56\xE2\x19\x5A\xA8'+
            '\x7A\x85\x0A\xB5\x42\xC1\x71\x7A\x12\x78\xF1\xBF\x7F\xB1\xD2\x99\x28\x0F\xCB\x22\x7D\x3D\xF4\x79\xE2\x2C\x29\x7D\xE4\xD9\xE7\x5E\x44\x34\x46\x7C\xCA\x2B\x2F\xBF'+
            '\xC2\x50\x83\x9A\xF4\xCA\x10\x5E\xA2\x42\x1E\xCF\x3D\x02\x8F\x39\xC7\xB4\xDF\x78\xB1\x2C\xC2\x9F\x8C\xB7\x38\x6F\x28\x7D\xE0\xD9\x67\x5F\xDC\x27\x0A\xFB\xB0\x1A'+
            '\x0A\x23\xB1\xFF\x95\xFD\x2F\xEF\xDF\x87\xC3\x70\xA0\x6C\xF6\xBD\xF4\xFC\xB3\x0F\x94\xDD\xE2\xF2\x26\xCA\x23\x16\x91\xBE\x93\xAD\x34\xBD\x1C\xB3\x1F\x7D\xFE\xF9'+
            '\x5F\xEF\x03\xFB\xA3\x86\x8E\x66\x7E\xFD\xFC\x23\x0D\x98\x56\xF1\x7D\xE1\x0D\x21\x16\x91\xBE\x9E\x83\xE5\x34\xBD\x4A\x1E\x80\xCA\xBE\xFD\xC3\x45\xDE\x78\xE3\x8D'+
            '\xFD\x28\x5C\xA1\x04\x79\x95\x2B\x68\x3C\xDA\xE0\x74\xBA\xCA\x0F\xC6\xF9\xFD\xCA\x4C\x4C\x22\x3C\xBD\x48\x65\xD6\xEA\xE7\x5F\x78\x55\x79\xD3\xC4\x1B\x81\x5A\x5A'+
            '\xAF\xBE\xA9\x07\x31\x2F\xAC\x5B\x5D\x46\xE9\x88\xFD\x37\x0D\x23\x10\xA3\x48\xDF\x47\x48\x0A\x67\x65\xF5\x0B\x50\x41\xA4\x6F\xEE\xA7\xA8\x25\xEE\x51\x61\x8D\x47'+
            '\x57\xCF\x82\x46\x42\xD3\x01\x62\x15\x41\x52\xF8\x4E\x71\x3A\x4A\x56\xAD\x3B\xAC\x71\x46\xE6\xF0\xE1\x35\x65\x4E\xE7\x4D\x78\xE8\xB6\xC7\xF5\x63\xD4\x70\x62\x17'+
            '\xE9\xEB\x39\xC6\xF3\x0B\x59\x99\xBD\xFA\x30\x5C\x3E\xE5\x50\xB9\xD6\x0A\x1B\xAE\x68\xFD\x04\x12\x87\xD7\x35\x88\x86\xF7\x68\x62\x3E\x3C\x4C\xC4\x21\xA2\x2A\x70'+
            '\xF9\x2E\xB9\x1C\x3A\xFC\xE9\x27\x7F\x18\xCE\xA7\x7F\xF8\xF4\xD3\xDF\x7F\x02\x0E\xAF\x6B\x84\xB5\xF3\x16\xD2\x48\xEC\xAC\x62\xE2\x12\x09\xAA\x20\x2F\x98\x63\x24'+
            '\xA3\xF1\x9B\xF9\xFD\x27\x87\x0F\x35\x3A\x1D\x74\x94\xCB\x35\xC7\x7B\x2C\xE1\xD9\x20\xE2\x14\x81\xCA\x5B\xAD\xB8\xED\xD9\xC5\xE9\x70\x94\x38\xCB\x1A\x56\x1F\x3A'+
            '\x74\xE8\xB0\x16\xB0\xAA\xAC\xCC\xE9\xB8\x41\x2C\x5C\x5E\x6F\xFB\x39\xD1\x48\x80\x08\x38\x79\xD4\x4B\x2E\x37\xB3\xCC\xAC\x59\x98\x68\x0E\xA5\xA4\xC4\xE9\x98\x45'+
            '\xAF\xDE\x54\xC6\x16\xE7\x62\x4E\x29\x89\x10\x01\x27\x8F\xB6\x7A\x5D\x9C\x99\x9B\x58\xC7\x84\xEB\x56\xBC\xEC\x2A\xF7\xB6\x1E\x3B\x99\xE0\x07\x55\x08\x09\x12\x01'+
            '\x3D\x6F\x1D\xF3\x02\xD6\x09\x42\x7B\x5E\xEF\xC1\x63\xED\xE7\x2E\x17\x42\xE2\x44\x88\xDE\x9E\xF6\xF6\xF6\x23\xAD\xAD\xDE\x56\x72\x42\xDD\xDA\xDA\xFE\xD6\xC9\x73'+
            '\xED\xC0\x24\x56\xE4\x8F\x48\x4A\x24\xD9\x48\x89\x24\x1B\x29\x91\x64\x23\x25\x92\x6C\xA4\x44\x92\x8D\x94\x48\xB2\x91\x12\x49\x2E\xFA\xFA\xFE\x0F\x42\x19\x3A\x3C'+
            '\xBD\x09\x8B\xFF\x00\x00\x00\x00\x49\x45\x4E\x44\xAE\x42\x60\x82';

            // 16x16 pixels image created with gimp
            //var jpegData = "\xff\xd8\xff\xe0\x00\x10\x4a\x46\x49\x46\x00\x01\x01\x01\x00\x48\x00\x48\x00\x00\xff\xfe\x00\x13\x43\x72\x65\x61\x74\x65\x64\x20\x77\x69\x74\x68\x20\x47\x49\x4d\x50\xff\xdb\x00\x43\x00\x10\x0b\x0c\x0e\x0c\x0a\x10\x0e\x0d\x0e\x12\x11\x10\x13\x18\x28\x1a\x18\x16\x16\x18\x31\x23\x25\x1d\x28\x3a\x33\x3d\x3c\x39\x33\x38\x37\x40\x48\x5c\x4e\x40\x44\x57\x45\x37\x38\x50\x6d\x51\x57\x5f\x62\x67\x68\x67\x3e\x4d\x71\x79\x70\x64\x78\x5c\x65\x67\x63\xff\xdb\x00\x43\x01\x11\x12\x12\x18\x15\x18\x2f\x1a\x1a\x2f\x63\x42\x38\x42\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\x63\xff\xc2\x00\x11\x08\x00\x10\x00\x10\x03\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x16\x00\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x05\xff\xc4\x00\x14\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x10\x03\x10\x00\x00\x01\xd8\x00\xa7\xff\xc4\x00\x17\x10\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x21\x01\x41\xff\xda\x00\x08\x01\x01\x00\x01\x05\x02\x8e\x36\xbf\xff\xc4\x00\x14\x11\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x20\xff\xda\x00\x08\x01\x03\x01\x01\x3f\x01\x1f\xff\xc4\x00\x14\x11\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x20\xff\xda\x00\x08\x01\x02\x01\x01\x3f\x01\x1f\xff\xc4\x00\x15\x10\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x20\x21\xff\xda\x00\x08\x01\x01\x00\x06\x3f\x02\xa3\xff\xc4\x00\x1b\x10\x00\x02\x02\x03\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x11\x00\x21\x31\x41\x51\x71\xff\xda\x00\x08\x01\x01\x00\x01\x3f\x21\xb3\x24\xae\x1a\x6b\x6f\x73\x1a\x39\xe4\x31\xea\x7f\xff\xda\x00\x0c\x03\x01\x00\x02\x00\x03\x00\x00\x00\x10\x82\x4f\xff\xc4\x00\x14\x11\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x20\xff\xda\x00\x08\x01\x03\x01\x01\x3f\x10\x1f\xff\xc4\x00\x14\x11\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x20\xff\xda\x00\x08\x01\x02\x01\x01\x3f\x10\x1f\xff\xc4\x00\x19\x10\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x11\x00\x21\x31\x61\xff\xda\x00\x08\x01\x01\x00\x01\x3f\x10\x0a\xc0\x10\x47\xee\x90\x1e\x49\xd7\x97\x71\xd5\x63\x65\x61\x60\x31\x39\x1d\xff\xd9";
            var byteArray = new Uint8Array(pngData.length);
            for (var i = 0; i < pngData.length; i++) {
                byteArray[i] = pngData.charCodeAt(i) & 0xff;
            }
            var fromBlob = new Blob([byteArray], {type: 'image/png', endings: "transparent"});
            self.srvFileStorage.writeFile(fromBlob, filePath, createPicture, onWriteFailure);
        }
        return deferred.promise;
    };

    function checkErrorData(responseData) {
        if (a4p.isUndefined(responseData)) {
            return {error:'htmlMsgSynchronizationServerPb', log:'Received no data'};
        }
        var responseLog = responseData['responseLog'];
        if (a4p.isUndefined(responseLog)) responseLog = responseData['log'];

        var maintenance = responseData['maintenance'];
        if (a4p.isDefined(maintenance) && (maintenance != null) && (maintenance.length > 0)) {
            return {maintenance:maintenance, log:'Server is in maintenance status ' + maintenance + ' : ' + responseLog};
        }

        var responseRedirect = responseData['responseRedirect'];
        if (a4p.isDefined(responseRedirect) && (responseRedirect != null) && (responseRedirect.length > 0)) {
            return {redirect:responseRedirect, log:'Received a redirect for ' + responseRedirect + ' : ' + responseLog};
        }

        var errorCode = responseData['error'];
        if (a4p.isDefined(errorCode) && (errorCode != '')) {
            return {error:errorCode, log:'Received error code ' + errorCode + ' : ' + (responseLog||a4pDumpData(responseData, 1))};
        }

        var responseOk = responseData['responseOK'];
        if (a4p.isUndefined(responseOk) || !responseOk) {
            return {error:'htmlMsgSynchronizationServerPb', log:'Received no OK : ' + (responseLog||a4pDumpData(responseData, 1))};
        }
        return false;
    }

    function checkMetaData(self, data) {
        var metaData = data['metaData'];
        if (a4p.isDefinedAndNotNull(metaData)) {
            if (a4p.isDefinedAndNotNull(metaData.licence)) {
                self.srvConfig.setLicence(metaData.licence);
            }
            if (a4p.isDefinedAndNotNull(metaData.possibleCrms)) {
                self.srvConfig.setPossibleCrms(metaData.possibleCrms);
            }
            if (a4p.isDefinedAndNotNull(metaData.config)) {
                self.srvConfig.setConfig(metaData.config);
            }
        }
    }

    /**
     * Add a full map of new objects in srvData.
     *
     * For each object : create a new dbid, set its type, calculates some fields if undefined
     * Links must refer objects already inserted in data service or already in this map.
     * For each link : update with the dbid of previously inserted objects
     *
     * @param {object} self. Data service itself.
     * @param {object} userId. User id for each CRM.
     * @param {Array} fullmap. This map is enriched with the new fields
     * @param {Number} requestTimestamp. Javascript timestamp (in ms) of the start of the request.
     */
    function addFullMap(self, userId, fullmap, requestTimestamp) {
        a4p.InternalLog.log('srvData', 'addFullMap : userId=' + a4pDumpData(self.userId, 2)
            + ' userObject=' + a4pDumpData(self.userObject, 2));
        var index = {};// temporary index of all objects via crm id
        var i, j, k, key, dbid, type, item, linkedItem;

        //console.log('fullmap = ' + a4pDumpData(fullmap, 6));

        // TODO : remove objects having links to objects in other CRM not yet opened

        // Id (dbid) generation and Indexation of objects
        if (fullmap.objects) {
            for (var i = 0; i < fullmap.objects.length; i++) {
                item = fullmap.objects[i];
                // Remove old dbid in link fields coming from c4p CRM because they are no more up to date
                deleteOldDbLinkIds(item);
                for (var mergeIdx = 0; mergeIdx < item.crmObjects.length; mergeIdx++) {
                    var object = item.crmObjects[mergeIdx].data;
                    var crm = item.crmObjects[mergeIdx].crmId.crm;
                    var id = item.crmObjects[mergeIdx].crmId.id;
                    object.a4p_type = item.a4p_type;
                    if (a4p.isUndefinedOrNull(item.id)) {
                        if (a4p.isDefined(self.index[crm]) && a4p.isDefined(self.index[crm][id])) {
                            var oldItem = self.index[crm][id];
                            item.id = oldItem.id.dbid;
                            object.id = {dbid:oldItem.id.dbid};
                        } else {
                            dbid = item.a4p_type + '-' + a4p.nextUid();
                            object.id = {dbid:dbid};
                        }
                    } else {
                        object.id = {dbid:item.id};
                    }
                    object.id[crm+'_id'] = id;
                    if (a4p.isUndefined(index[crm])) {
                        index[crm] = {};
                    }
                    index[crm][id] = object;
                }
            }
            self.srvLocalStorage.set('Data-Uid', a4p.getUid());
            // Reformat link attributes and Add these new dbid in all links between objects
            for (var i = 0; i < fullmap.objects.length; i++) {
                item = fullmap.objects[i];
                //updateLinkIds(index, undefined, item);
                updateLinkIds(self.index, index, item);
            }
        }

        // Find User email if needed
        var login = self.srvSecurity.getA4pLogin();
        if (a4p.isEmptyOrFalse(login)) {
            login = 'demo@apps4pro.com';
        }

        // BEWARE : keep userId.c4p_id and userId.sf_id which have been set just before this call
        var deleteCrm = [];
        var deleteIndex = {};
        // if CRM must be removed => memorize all old objects from this old CRM
        for (var crm in self.index) {
            if (!self.index.hasOwnProperty(crm)) continue;
            if (crm == 'db') continue;
            if (crm != 'ios') {
                deleteCrm.push(crm);
            }
            deleteIndex[crm] = {};
            for (var id in self.index[crm]) {
                if (!self.index[crm].hasOwnProperty(id)) continue;
                var object = self.index[crm][id];
                deleteIndex[crm][object.id.dbid] = true;
            }
        }

        for (var oldCrmKeyId in self.userId) {
            if (oldCrmKeyId == 'dbid') continue;
            if (!self.userId.hasOwnProperty(oldCrmKeyId)) continue;
            var crm = oldCrmKeyId.substr(0, oldCrmKeyId.length - 3);// oldCrmKeyId=='sf_id' gives crm=='sf'
            if (a4p.isUndefinedOrNull(userId[oldCrmKeyId])) {
                if (crm == 'ios') {
                    // Local CRM => keep all old objects from this local CRM
                } else {
                    delete self.userId[oldCrmKeyId];
                }
            } else if (self.userId[oldCrmKeyId] == userId[oldCrmKeyId]) {
                // Same CRM User
            } else {
                // Change of CRM User
                self.userId[oldCrmKeyId] = userId[oldCrmKeyId];
            }
        }
        for (var newCrmKeyId in userId) {
            if (newCrmKeyId == 'dbid') continue;
            if (!userId.hasOwnProperty(newCrmKeyId)) continue;
            var crm = newCrmKeyId.substr(0, newCrmKeyId.length - 3);// newCrmKeyId=='sf_id' gives crm=='sf'
            if (a4p.isUndefinedOrNull(self.userId[newCrmKeyId])) {
                // CRM added => add the new objects from this CRM
                self.userId[newCrmKeyId] = userId[newCrmKeyId];
            }
        }
        // Find 'User' Contact
        var userFound = false;
        if (a4p.isDefined(self.userId.sf_id) && a4p.isDefined(index['sf'][self.userId.sf_id])) {
            var object = index['sf'][self.userId.sf_id];
            if (object.a4p_type == 'Contact') {
                self.userObject = object;
                self.userId.dbid = object.id.dbid;
                if (a4p.isDefined(deleteIndex['sf']) && a4p.isDefined(deleteIndex['sf'][object.id.dbid])) {
                    // No more delete this old object
                    delete deleteIndex['sf'][object.id.dbid];
                }
                userFound = true;
            }
        }
        if (!userFound && a4p.isDefined(self.userId.c4p_id) && a4p.isDefined(index['c4p'][self.userId.c4p_id])) {
            var object = index['c4p'][self.userId.c4p_id];
            if (object.a4p_type == 'Contact') {
                self.userObject = object;
                self.userId.dbid = object.id.dbid;
                if (a4p.isDefined(deleteIndex['c4p']) && a4p.isDefined(deleteIndex['c4p'][object.id.dbid])) {
                    // No more delete this old object
                    delete deleteIndex['c4p'][object.id.dbid];
                }
                userFound = true;
            }
        }
        if (!userFound) {
            if (fullmap.objects) {
                for (var i = 0; i < fullmap.objects.length; i++) {
                    item = fullmap.objects[i];
                    if ((item.a4p_type != 'Contact')) continue;
                    for (var mergeIdx = 0; mergeIdx < item.crmObjects.length; mergeIdx++) {
                        var crm = item.crmObjects[mergeIdx].crmId.crm;
                        var id = item.crmObjects[mergeIdx].crmId.id;
                        var object = index[crm][id];
                        // TODO : merge User from SF and User from C4P CRMs
                        if ((crm == 'c4p') && (object.email == login)) {
                            self.userObject = object;
                            self.userId.dbid = object.id.dbid;
                            self.userId.c4p_id = object.id.c4p_id;
                            if (a4p.isDefined(deleteIndex['c4p']) && a4p.isDefined(deleteIndex['c4p'][object.id.dbid])) {
                                // No more delete this old object
                                delete deleteIndex['c4p'][object.id.dbid];
                            }
                            userFound = true;
                            // TODO :  find a way to inform c4p Server that its User c4p_id is userId.c4p_id
                        }
                    }
                }
            }
        }
        if (!userFound) {
            if (a4p.isDefined(self.index.db[self.userId.dbid])) {
                self.srvLog.logWarning(false, 'NO object in FullMap matches userId'
                    + (a4p.isDefined(self.userId.sf_id)?' SF_ID='+self.userId.sf_id:'')
                    + (a4p.isDefined(self.userId.c4p_id)?' C4P_ID='+self.userId.c4p_id:'')
                    + ' => Update a Contact.');
                self.userObject = self.index.db[self.userId.dbid];
                self.userObject.email = login;
                self.userObject.contact_type = 'User';
                // erase other fields (from previous connexion)
                self.userObject.salutation = '';
                self.userObject.first_name = 'User';
                self.userObject.last_name = '';
                self.userObject.title = '';
                self.userObject.account_id = {};
                self.userObject.phone_work = '';
                self.userObject.phone_mobile = '';
                self.userObject.phone_fax = '';
                self.userObject.phone_house = '';
                self.userObject.phone_other = '';
                self.userObject.email_home = '';
                self.userObject.email_list = '';
                self.userObject.email_other = '';
                self.userObject.primary_address_street = '';
                self.userObject.primary_address_city = '';
                self.userObject.primary_address_zipcode = '';
                self.userObject.primary_address_state = '';
                self.userObject.primary_address_country = '';
                self.userObject.alt_address_street = '';
                self.userObject.alt_address_city = '';
                self.userObject.alt_address_zipcode = '';
                self.userObject.alt_address_state = '';
                self.userObject.alt_address_country = '';
                self.userObject.description = '';
                self.userObject.manager_id = {};
                self.userObject.assigned_contact_id = {};
                self.userObject.birthday = '';
                self.userObject.department = '';
                self.userObject.assistant_name = '';
                self.userObject.assistant_phone = '';
                self.userObject.lead_source = '';
            } else {
                // Create User
                self.srvLog.logWarning(false, 'NO object in FullMap matches userId'
                    + (a4p.isDefined(self.userId.sf_id)?' SF_ID='+self.userId.sf_id:'')
                    + (a4p.isDefined(self.userId.c4p_id)?' C4P_ID='+self.userId.c4p_id:'')
                    + ' => Create a Contact.');
                self.userId.dbid = login;
                self.userObject = {id:{dbid:login}, email:login, contact_type:'User', first_name:'User'};
            }
            var sepIdx = login.indexOf('@');
            if (sepIdx >= 0) {
                self.userObject.last_name = login.substr(0, sepIdx);
            } else {
                self.userObject.last_name = login;
            }
            if (a4p.isDefined(self.userId.sf_id)) {
                self.userObject.id.sf_id = self.userId.sf_id;
            }
            if (a4p.isDefined(deleteIndex['sf']) && a4p.isDefined(deleteIndex['sf'][self.userId.dbid])) {
                // No more delete this old object
                delete deleteIndex['sf'][self.userId.dbid];
            }
            if (a4p.isDefined(self.userId.c4p_id)) {
                self.userObject.id.c4p_id = self.userId.c4p_id;
            }
            if (a4p.isDefined(deleteIndex['c4p']) && a4p.isDefined(deleteIndex['c4p'][self.userId.dbid])) {
                // No more delete this old object
                delete deleteIndex['c4p'][self.userId.dbid];
            }
            if (a4p.isDefined(self.index.db[self.userId.dbid])) {
                self.setAndSaveObject(self.userObject);
            } else {
                self.userObject = self.createObject('Contact', self.userObject);
                self.addAndSaveObject(self.userObject);
            }
            self.userId.dbid = self.userObject.id.dbid;
        }
        self.srvLocalStorage.set('Data-userId', self.userId);
        self.srvLocalStorage.set('Data-userObject', self.userObject);
        a4p.InternalLog.log('srvData', 'downloadFullMap : userId=' + a4pDumpData(self.userId, 2)
            + ' userObject=' + a4pDumpData(self.userObject, 2));

        // Add objects/joins in data service
        if (fullmap.objects) {
            for (var i = 0; i < fullmap.objects.length; i++) {
                item = fullmap.objects[i];
                for (var mergeIdx = 0; mergeIdx < item.crmObjects.length; mergeIdx++) {
                    var crm = item.crmObjects[mergeIdx].crmId.crm;
                    var id = item.crmObjects[mergeIdx].crmId.id;
                    var object = index[crm][id];
                    if (a4p.isDefined(self.index[crm]) && a4p.isDefined(self.index[crm][id])) {
                        // Replace old object by new object (keep none of old attributes, it is NOT an update)
                        /*
                        var oldItem = self.index[crm][id];
                        for (var key in object) {
                            if (key == 'id') continue;
                            if (!object.hasOwnProperty(key)) continue;
                            oldItem[key] = object[key];
                        }
                        self.setObject(oldItem, true);
                        */
                        self.setObject(object, true);
                        if (a4p.isDefined(deleteIndex[crm]) && a4p.isDefined(deleteIndex[crm][object.id.dbid])) {
                            // No more delete this old object
                            delete deleteIndex[crm][object.id.dbid];
                        }
                    } else {
                        // Create new object
                        self.addObject(object, true);
                    }
                }
            }
        }
        // Delete old objects not yet updated (except ios CRM)
        for (var i = 0, n = deleteCrm.length; i < n; i++) {
            var crm = deleteCrm[i];
            for (var dbid in deleteIndex[crm]) {
                if (!deleteIndex[crm].hasOwnProperty(dbid)) continue;
                self.removeObject(dbid, true);
            }
        }

        // Find 'Favorites' Facet AFTER deletes just before
        delete self.favoritesObject;
        if (fullmap.objects) {
            for (var i = 0; i < fullmap.objects.length; i++) {
                item = fullmap.objects[i];
                if ((item.a4p_type != 'Facet')) continue;
                for (var mergeIdx = 0; mergeIdx < item.crmObjects.length; mergeIdx++) {
                    var crm = item.crmObjects[mergeIdx].crmId.crm;
                    var id = item.crmObjects[mergeIdx].crmId.id;
                    var object = index[crm][id];
                    if (object.name == self.srvLocale.translations.htmlFavorites) {
                        self.favoritesObject = object;
                        break;
                    }
                }
                if (a4p.isDefined(self.favoritesObject)) break;
            }
        }
        if (a4p.isUndefined(self.favoritesObject)) {
            self.favoritesObject = self.createObject('Facet', {prefix: '', name: self.srvLocale.translations.htmlFavorites});
            self.addObject(self.favoritesObject);
            self.linkToItem(self.favoritesObject.a4p_type, 'owner', [self.favoritesObject], self.userObject);
            self.addObjectToSave(self.favoritesObject.a4p_type, self.favoritesObject.id.dbid);
        }
        self.srvLocalStorage.set('Data-favoritesObject', self.favoritesObject);

        // Memorize timestamp of the start of the request
        self.lastRefreshMindMap = Math.floor(requestTimestamp/1000);
        self.srvLocalStorage.set('Data-lastRefreshMindMap', self.lastRefreshMindMap);
    }

    function deleteOldDbLinkIds(item) {
        for (var mergeIdx = 0; mergeIdx < item.crmObjects.length; mergeIdx++) {
            var object = item.crmObjects[mergeIdx].data;
            var crm = item.crmObjects[mergeIdx].crmId.crm;
            var type = item.a4p_type;
            var objDesc = c4p.Model.a4p_types[type];
            for (var j=0; j<objDesc.linkFields.length; j++) {
                var linkModel = objDesc.linkFields[j];
                var key = linkModel.key;
                if (a4p.isTrueOrNonEmpty(object[key])) {
                    var isArrayField = a4p.isDefined(c4p.Model.objectArrays[type][key]);
                    // BEWARE : links from C4P CRM are already in {c4p_id:*, dbid:*, sf_id:*} structure because they links on other CRMs also
                    if (!isArrayField) {
                        if (crm == 'c4p') {
                            // Structure C4P is the same as A4P : {dbid:id, c4p_id:id, sf_id:id}
                            // BEWARE : delete the old dbid value which is no more up to date
                            delete object[key].dbid;
                        }
                    } else {
                        for (var valueIdx = 0, valueNb = object[key].length; valueIdx < valueNb; valueIdx++) {
                            if (crm == 'c4p') {
                                delete object[key][valueIdx].dbid;
                            }
                        }
                    }
                }
            }
        }
    }

    function updateDbid(index1, index2, field, crm, id) {
        if (a4p.isDefined(index1) && a4p.isDefined(index1[crm])) {
            var object = index1[crm][id];
            if (a4p.isDefined(object)) {
                field.dbid = object.id.dbid;
            } else if (a4p.isDefined(index2) && a4p.isDefined(index2[crm])) {
                object = index2[crm][id];
                if (a4p.isDefined(object)) {
                    field.dbid = object.id.dbid;
                }
            }
        }
    }

    function updateLinkIds(index1, index2, item) {
        for (var mergeIdx = 0; mergeIdx < item.crmObjects.length; mergeIdx++) {
            var object = item.crmObjects[mergeIdx].data;
            var crm = item.crmObjects[mergeIdx].crmId.crm;
            var type = item.a4p_type;
            var objDesc = c4p.Model.a4p_types[type];
            for (var j=0; j<objDesc.linkFields.length; j++) {
                var linkModel = objDesc.linkFields[j];
                var key = linkModel.key;
                if (a4p.isTrueOrNonEmpty(object[key])) {
                    var isArrayField = a4p.isDefined(c4p.Model.objectArrays[type][key]);
                    var linkId, linkedItem;
                    if (!isArrayField) {
                        if (crm == 'c4p') {
                            // Structure C4P is the same as A4P : {dbid:id, c4p_id:id, sf_id:id}
                            linkId = object[key].c4p_id;
                            if (a4p.isTrueOrNonEmpty(linkId)) {
                                updateDbid(index1, index2, object[key], crm, linkId);
                            }
                            // Try other CRMs links (they exist in C4P CRM)
                            linkId = object[key].sf_id;
                            if (a4p.isTrueOrNonEmpty(linkId)) {
                                updateDbid(index1, index2, object[key], 'sf', linkId);
                            }
                            linkId = object[key].ios_id;
                            if (a4p.isTrueOrNonEmpty(linkId)) {
                                updateDbid(index1, index2, object[key], 'ios', linkId);
                            }
                        } else {
                            // Structure SF and other CRM is simply id value
                            // Structure of SF and other CRM must be converted into {dbid:id, c4p_id:id, sf_id:id}
                            linkId = object[key];
                            object[key] = {};
                            if (a4p.isTrueOrNonEmpty(linkId)) {
                                object[key][crm+'_id'] = linkId;
                                updateDbid(index1, index2, object[key], crm, linkId);
                            }
                        }
                    } else {
                        for (var valueIdx = 0, valueNb = object[key].length; valueIdx < valueNb; valueIdx++) {
                            if (crm == 'c4p') {
                                // Structure C4P is the same as A4P : {dbid:id, c4p_id:id, sf_id:id}
                                linkId = object[key][valueIdx].c4p_id;
                                if (a4p.isTrueOrNonEmpty(linkId)) {
                                    updateDbid(index1, index2, object[key][valueIdx], crm, linkId);
                                }
                                // Try other CRMs links (they exist in C4P CRM)
                                linkId = object[key][valueIdx].sf_id;
                                if (a4p.isTrueOrNonEmpty(linkId)) {
                                    updateDbid(index1, index2, object[key][valueIdx], 'sf', linkId);
                                }
                                linkId = object[key][valueIdx].ios_id;
                                if (a4p.isTrueOrNonEmpty(linkId)) {
                                    updateDbid(index1, index2, object[key][valueIdx], 'ios', linkId);
                                }
                            } else {
                                // Structure SF and other CRM is simply id value
                                // Structure of SF and other CRM must be converted into {dbid:id, c4p_id:id, sf_id:id}
                                linkId = object[key][valueIdx];
                                object[key][valueIdx] = {};
                                if (a4p.isTrueOrNonEmpty(linkId)) {
                                    object[key][valueIdx][crm+'_id'] = linkId;
                                    updateDbid(index1, index2, object[key][valueIdx], crm, linkId);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Update the map of objects in srvData.
     *
     * For each new object : create a new dbid, set its type, calculates some fields if undefined.
     * For each updated object : updates fields and calculates some fields if undefined.
     * For each deleted object : delete object (and item if all objects are deleted).
     * Links must refer objects already inserted in data service or already in this map.
     *
     * @param {object} self. Data service itself.
     * @param {Array} refreshMap. This map is enriched with the new fields
     * @param {Number} requestTimestamp. Javascript timestamp (in ms) of the start of the request.
     */
    function updFullMap(self, refreshMap, requestTimestamp) {
        a4p.InternalLog.log('srvData', 'updFullMap');
        var index = {sf:{}, c4p:{}};// temporary index of all objects via crm id
        var i, j, k, key, dbid, type, item, object, linkedItem;

        if (refreshMap.updates) {
            // Add dbid or id generation
            for (i = 0; i < refreshMap.updates.length; i++) {
                item = refreshMap.updates[i];
                for (var mergeIdx = 0; mergeIdx < item.crmObjects.length; mergeIdx++) {
                    var object = item.crmObjects[mergeIdx].data;
                    var crm = item.crmObjects[mergeIdx].crmId.crm;
                    var id = item.crmObjects[mergeIdx].crmId.id;
                    var oldItem = self.index[crm][id];
                    if (a4p.isDefined(oldItem)) {
                        item.id = oldItem.id.dbid;
                        object.id = {dbid:oldItem.id.dbid};
                        object.id[crm+'_id'] = id;
                    } else {
                        dbid = item.a4p_type + '-' + a4p.nextUid();
                        object.id = {dbid:dbid};
                        object.id[crm+'_id'] = id;
                        index[crm][id] = object;
                    }
                }
            }
            self.srvLocalStorage.set('Data-Uid', a4p.getUid());
            // Add dbid in all links between already existant objects
            for (i = 0; i < refreshMap.updates.length; i++) {
                item = refreshMap.updates[i];
                // Remove old dbid in link fields coming from c4p CRM because they are no more up to date
                deleteOldDbLinkIds(item);
                updateLinkIds(self.index, index, item);
            }
            // Add objects/joins in data service
            for (i = 0; i < refreshMap.updates.length; i++) {
                item = refreshMap.updates[i];
                for (var mergeIdx = 0; mergeIdx < item.crmObjects.length; mergeIdx++) {
                    var object = item.crmObjects[mergeIdx].data;
                    var crm = item.crmObjects[mergeIdx].crmId.crm;
                    var id = item.crmObjects[mergeIdx].crmId.id;
                    type = item.a4p_type;

                    var oldItem = self.index[crm][id];
                    if (a4p.isDefined(oldItem)) {
                        // Update oldItem from object attributes
                        for (var key in object) {
                            if (key == 'id') continue;
                            if (!object.hasOwnProperty(key)) continue;
                            oldItem[key] = object[key];
                        }
                        self.setObject(oldItem, true);
                    } else {
                        object.a4p_type = type;
                        self.addObject(object, true);
                    }
                }
            }
        }
        if (refreshMap.deletes) {
            // Remove deleted objects/joins from data service
            for (i = 0; i < refreshMap.deletes.length; i++) {
                item = refreshMap.deletes[i];
                for (var mergeIdx = 0; mergeIdx < item.crmObjects.length; mergeIdx++) {
                    var object = item.crmObjects[mergeIdx].data;
                    var crm = item.crmObjects[mergeIdx].crmId.crm;
                    var id = item.crmObjects[mergeIdx].crmId.id;

                    var oldItem = self.index[crm][id];
                    if (a4p.isDefined(oldItem)) {
                        self.removeObject(oldItem.id.dbid, true);
                    }
                }
            }
        }

        // Memorize timestamp fields as now - 5 minutes
        self.lastRefreshMindMap = Math.floor(requestTimestamp/1000);
        self.srvLocalStorage.set('Data-lastRefreshMindMap', self.lastRefreshMindMap);
    }

    function saveObject(self, type, dbid) {
        var fromObject = self.originalDbIndex[dbid];
        var toObject = self.getObject(dbid);
        var diffResult = diffObject(fromObject, toObject);
        // BEWARE : note, feed and email attributes of Document object are not checked into diffObject() =>
        if (diffResult == null) {
            // no change
            if (a4p.isDefined(toObject)) {
                if (toObject.c4p_synchro.creating == c4p.Synchro.QUEUE) {
                    toObject.c4p_synchro.creating = c4p.Synchro.NONE;
                }
                if (toObject.c4p_synchro.writing == c4p.Synchro.QUEUE) {
                    toObject.c4p_synchro.writing = c4p.Synchro.NONE;
                }
                if (toObject.c4p_synchro.deleting == c4p.Synchro.QUEUE) {
                    toObject.c4p_synchro.deleting = c4p.Synchro.NONE;
                }
                if (type == 'Document') {
                    if (a4p.isDefined(toObject.feed) && toObject.feed) {
                        if (self.srvConfig.hasActiveRemoteCrm() && sendSharing(self, toObject)) {
                            self.srvLocalStorage.set('Data-'+type, self.currentItems[type]);
                            return true;
                        } else {
                            // TODO : NO remote CRM enabled => do it at next CRM list change
                            // do no delete toObject.feed;
                            toObject.c4p_synchro.sharing = c4p.Synchro.NONE;
                            toObject.toSaveWhenCrm = true;
                            self.srvLocalStorage.set('Data-'+type, self.currentItems[type]);
                            return false;
                        }
                	}
                }
                self.srvLocalStorage.set('Data-'+type, self.currentItems[type]);
            }
            return false;
        } else if (diffResult == 'new') {
            // new
            var changed = false;
            if (a4p.isDefined(toObject.email) && toObject.email.editable) {
                toObject.email.editable = false;
                changed = true;
            }
            if (changed) {
                self.srvLocalStorage.set('Data-'+toObject.a4p_type, self.currentItems[toObject.a4p_type]);
            }
            if (type == 'Document') {
                if (a4p.isTrueOrNonEmpty(toObject.feed)) {
                    if (self.srvConfig.hasActiveRemoteCrm() && sendSharing(self, toObject)) {
                        return true;
                    } else {
                        // TODO : NO remote CRM enabled => do it at next CRM list change
                        // do no delete toObject.feed;
                        toObject.c4p_synchro.sharing = c4p.Synchro.NONE;
                        toObject.toSaveWhenCrm = true;
                        self.srvLocalStorage.set('Data-'+type, self.currentItems[type]);
                        return false;
                    }
                } else if (a4p.isTrueOrNonEmpty(toObject.email)) {
                    sendEmail(self, toObject);
                    return true;
               	}
            }
            if (self.srvConfig.hasActiveRemoteCrm() && sendCreation(self, toObject)) {
                return true;
            } else {
                // TODO : NO remote CRM enabled (or available for this type of object) => do it at next CRM list change
                toObject.c4p_synchro.creating = c4p.Synchro.NONE;
                toObject.c4p_synchro.writing = c4p.Synchro.NONE;// Needed because some object setted but not yet created arrives here
                toObject.toSaveWhenCrm = true;
                self.srvLocalStorage.set('Data-'+type, self.currentItems[type]);
                return false;
            }
        } else if (diffResult == 'delete') {
            // delete
            if (self.srvConfig.hasActiveRemoteCrm() && sendDeletion(self, fromObject, toObject)) {
                return true;
            } else {
                if (a4p.isDefined(toObject)) {
                    // TODO : NO remote CRM enabled (or available for this type of object) => do it at next CRM list change
                    toObject.c4p_synchro.deleting = c4p.Synchro.NONE;// useless because object is deleted immediatly
                    toObject.toSaveWhenCrm = true;// useless because object is deleted immediatly
                    // Reproduce most source code of deletedObject(self, dbid, askedDeleted, deleted, isOriginal)
                    for (var oldCrmKeyId in toObject.id) {
                        if (oldCrmKeyId == 'dbid') continue;
                        if (!toObject.id.hasOwnProperty(oldCrmKeyId)) continue;
                        var crm = oldCrmKeyId.substr(0, oldCrmKeyId.length - 3);// oldCrmKeyId=='sf_id' gives crm=='sf'
                        var id = toObject.id[oldCrmKeyId];
                        delete self.index[crm][id];
                    }
                    var deletedItems = removeObjectFromList(self.currentItems[type], dbid);
                    delete self.index.db[dbid];
                    self.nbObjects--;
                    self.srvLocalStorage.set('Data-'+type, self.currentItems[type]);
                    triggerUpdate(self, 'remove', type, dbid);
                    unlinkLinkedObjects(self, dbid);
                }
                return false;
            }
        } else {
            // update
            var changed = false;
            if ((toObject.a4p_type == 'Document') && a4p.isDefined(toObject.email) && toObject.email.editable) {
                toObject.email.editable = false;
                changed = true;
            }
            if (changed) {
                self.srvLocalStorage.set('Data-'+toObject.a4p_type, self.currentItems[toObject.a4p_type]);
            }
            if (type == 'Document') {
                if (a4p.isTrueOrNonEmpty(toObject.feed)) {
                    if (self.srvConfig.hasActiveRemoteCrm() && sendSharing(self, toObject)) {
                        return true;
                    } else {
                        // TODO : NO remote CRM enabled => do it at next CRM list change
                        // do no delete toObject.feed;
                        toObject.c4p_synchro.sharing = c4p.Synchro.NONE;
                        toObject.toSaveWhenCrm = true;
                        self.srvLocalStorage.set('Data-'+type, self.currentItems[type]);
                        return false;
                    }
            	} else if (a4p.isTrueOrNonEmpty(toObject.email)) {
                    sendEmail(self, toObject);
                    return true;
            	}
            }
            if (self.srvConfig.hasActiveRemoteCrm() && sendUpdate(self, toObject, diffResult)) {
                return true;
            } else {
                // TODO : NO remote CRM enabled (or available for this type of object) => do it at next CRM list change
                toObject.c4p_synchro.writing = c4p.Synchro.NONE;
                toObject.toSaveWhenCrm = true;
                self.srvLocalStorage.set('Data-'+type, self.currentItems[type]);
                return false;
            }
        }
    }

    function sendEmail(self, object) {
    	var email = object.email;
        var event = self.getObject(object.parent_id.dbid);

        var emails = [];

        for(var i = 0; i < email.emailsInput.length; i++){
        	emails.push(email.emailsInput[i].email);
        }

        for (var i = 0; i < email.contacts.length; i++) {
        	var contact = self.getObject(email.contacts[i].dbid);
            emails.push(contact.email);
        }

        var askedCrms = self.srvConfig.getActiveCrms();

        // TODO : object_id can be NULL if no PDF email to create in CRMs
        var params = {
            askedCrms : askedCrms,
            mail_object : email.subject,
            mail_body : email.body,
            //c4pToken : self.srvSecurity.getHttpRequestToken(), // set by srvSynchro
            object_id : event.id,// Must be an Event id
            emails : emails,
            files : []
        };

        var requestCtx = {
            type:'Email',
            title:'Send Email body for ' + event.a4p_type + ' ' + self.srvConfig.getItemName(event),
            dbid:object.id.dbid
        };

        // Upon ack answer we will save in original only current fields, not those modified afterward
        self.savingObject = {
            type:'Document',
            dbid:object.id.dbid,
            action:'create',
            fields:angular.copy(object)
        };
        self.srvLocalStorage.set('Data-savingObject', self.savingObject);

        if (self.isDemo) {
            var createdIds = [];
            for (var i = 0; i < askedCrms.length; i++) {
                createdIds.push({
                    crm:askedCrms[i],
                    id:'demo'+askedCrms[i].toUpperCase()+object.id.dbid
                });
            }
            var answerId = {dbid:object.id.dbid};
            if (isValueInList(self.srvConfig.getActiveCrms(), 'sf')) {
                answerId.sf_id = 'demoSF'+object.id.dbid;
            }
            onEmailSuccess(self, requestCtx, {
                responseOK:true,
                id:answerId,
                responseStatus:'Create email success.',
                askedCrms:askedCrms,
                created:createdIds,
                errors:[],
                log:'SendEmail done.',
                nbSent:1

            });
        } else {
            for (var i = 0; i < email.documents.length; i++) {
                var document = self.getObject(email.documents[i].dbid);
                if (email.emailType == 'share') {
                    params.files.push({name : document.name, uid : document.id.dbid, id: document.id});
                }
                else {
                    var fileName = document.name;
                    var fileUid = document.id.dbid;
                    params.files.push({name : fileName, uid : fileUid});
                    self.srvSynchro.addFileRequest('data',
                        {type: 'Attachment', title: 'Send Email attachment ' + self.srvConfig.getItemName(document) + ' for ' + event.a4p_type + ' ' + self.srvConfig.getItemName(event)},
                        self.srvConfig.c4pUrlUploadFile,
                        'POST',
                        {
                            type : 'Document',
                            id : document.id.dbid,
                            created : [{crm:'sf', id:''}],
                            askedCrms:askedCrms,
                            'uploadFileInCrm': false,
                            'shareFileInCrm': false,
                            'fileName': fileName,
                            'fileUid': fileUid,
                            'object_id': params.object_id // Must be an Event id
                            //'c4pToken': params.c4pToken // set by srvSynchro
                        },
                        document.filePath,
                        {'Content-Type': 'application/x-www-form-urlencoded'},
                        {
                            fileKey: 'file',
                            fileName: document.name
                        }
                    );
                }
            }

            self.srvSynchro.addRequest('data',
                requestCtx,
                self.srvConfig.c4pUrlSendEmail,
                'POST',
                params,
                {'Content-Type': 'application/x-www-form-urlencoded'}
            );
        }
        return true;
    }

    Service.prototype.sendICal = function(object) {
        var self = this;
        var ical = object;

        var emails = [];

        for(var i = 0; i < ical.emailsInput.length; i++){
            emails.push(ical.emailsInput[i].email);
        }

        for (var i = 0; i < ical.contacts.length; i++) {
            var contact = self.getObject(ical.contacts[i].dbid);
            emails.push(contact.email);
        }

        var params = {
            title: ical.title,
            description: ical.description,
            emails: emails,
            startDate: ical.startDate / 1000,
            endDate: ical.endDate / 1000,
            organizer: ical.organizer,
            location: ical.location
        };

        var requestCtx = {
            type: 'ICal',
            title:'Send ICal' + ical.title,
            dbid:''
        };

        if(self.isDemo) {
            var answerId = {dbid:object.id.dbid};
            onEmailSuccess(self, requestCtx, {
                responseOK:true,
                id:answerId,
                responseStatus:'Create ical success.',
                errors:[],
                log:'SendICal done.',
                nbSent:1

            });
        } else {
            self.srvSynchro.addRequest('data',
                requestCtx,
                self.srvConfig.c4pUrlSendICal,
                'POST',
                params,
                {'Content-Type': 'application/x-www-form-urlencoded'}
            );
        }

        return true;
    };

    function sendCreation(self, object) {
        var requestCtx = {
            type:'Create',
            title:'Create ' + object.a4p_type + ' ' + self.srvConfig.getItemName(object),
            dbid:object.id.dbid
        };
        var askedCrms = self.srvConfig.getActiveCrms();
        var created = [];
        /* ccn_future
        for (var mergeIdx = 0; mergeIdx < object.crmObjects.length; mergeIdx++) {
            var object = object.crmObjects[mergeIdx];
            if (!object.editable) continue;
            if (object.deleted) {
                created.push({crm:object.crmId.crm, id:object.crmId.id});
            }
        }
        */
        // TODO : enable later for all CRMs
        if (isValueInList(self.a4pTypesInC4PFirst, object.a4p_type)) {
            // In order : in C4P and SF
            if (isValueInList(askedCrms, 'c4p')) created.push({crm:'c4p',id:object.id.c4p_id});
            if (isValueInList(askedCrms, 'sf')) created.push({crm:'sf',id:object.id.sf_id});
        } else if (isValueInList(self.a4pTypesForSF, object.a4p_type)) {
            // In order : in SF or C4P
            if (isValueInList(askedCrms, 'sf')) created.push({crm:'sf',id:object.id.sf_id});
            else if (isValueInList(askedCrms, 'c4p')) created.push({crm:'c4p',id:object.id.c4p_id});
        } else {
            // In C4P
            if (isValueInList(askedCrms, 'c4p')) created.push({crm: 'c4p', id: object.id.c4p_id});
        }

        if (created.length <= 0) {
            return false;
        }

        // Upon ack answer we will save in original only current fields, not those modified afterward
        self.savingObject = {
            type:object.a4p_type,
            dbid:object.id.dbid,
            action:'create',
            fields:angular.copy(object)
        };
        self.srvLocalStorage.set('Data-savingObject', self.savingObject);

        if (self.isDemo) {
            var answerCreated = {crm:created[0].crm, tmpId:created[0].id};
            if (isValueInList(self.srvConfig.getActiveCrms(), 'sf')) {
                answerCreated.id = 'demoSF'+object.id.dbid;
            }
            onCreateSuccess(self, requestCtx, {
                id:object.id.dbid,
                type:object.a4p_type,
                askedCreated:created,
                created:[answerCreated],
                errors:[]
            });
        } else {
            var params;
            if (a4p.isDefined(c4p.Model.files[object.a4p_type])) {
                // Document
                var loadFields = c4p.Model.files[object.a4p_type];
                params = {
                    type : object.a4p_type,
                    id : object.id.dbid,
                    created : created,
                    askedCrms:askedCrms,
                    'uploadFileInCrm':true,
                    'shareFileInCrm':false,
                    'fileName':object[loadFields.fileName],
                    'fileUid':object.id.dbid,
                    'object_id':object[loadFields.parent] // Must be an Event id
                    //'c4pToken':self.srvSecurity.getHttpRequestToken() // set by srvSynchro
                };
                var options = {
                    fileKey:'file',
                    fileName:object[loadFields.fileName]
                };
                self.srvSynchro.addFileRequest('data',
                    requestCtx,
                    self.srvConfig.c4pUrlUploadFile,
                    'POST',
                    params,
                    object[loadFields.filePath],
                    {'Content-Type':'application/x-www-form-urlencoded'},
                    options
                );
            } else {
                // Contact, Account, Event, Task, Opportunity, Note, Report
                params = {
                    type : object.a4p_type,
                    id : object.id.dbid,
                    created : created,
                    fields : object,
                    askedCrms:askedCrms
                    //c4pToken : self.srvSecurity.getHttpRequestToken() // set by srvSynchro
                };
                if (object.a4p_type == 'Attachee') {
                    var objDesc = c4p.Model.a4p_types[object.a4p_type];
                    var attachedObject = self.getObject(object[objDesc.attached].dbid);
                    params.fields.attachedName = self.srvConfig.getItemName(attachedObject);
                    var attacheeObject = self.getObject(object[objDesc.attachee].dbid);
                    params.fields.attacheeName = self.srvConfig.getItemName(attacheeObject);
                } else if (object.a4p_type == 'Report') {
                    var i, nb;
                    params.contacts = [];
                    params.accounts = [];
                    for (i = 0, nb = object['contact_ids'].length; i < nb; i++) {
                        var contact = self.getObject(object['contact_ids'][i].dbid);
                        params.contacts.push(contact);
                        if (a4p.isDefined(contact.account_id)) {
                            var account = self.getObject(contact.account_id.dbid);
                            params.accounts.push(account);
                        } else {
                            //params.accounts.push({});
                        }
                    }
                    params.documents = [];
                    var imgType = ['jpg', 'png'];
                    for (i = 0, nb = object['document_ids'].length; i < nb; i++) {
                        var document = self.getObject(object['document_ids'][i].dbid);
                        params.documents.push(document);
                        /* CCN : A lot of data sent to only create a downgrade version of Report in SF
                        if (imgType.indexOf(document.extension) != -1) {
                            self.srvSynchro.addFileRequest('data',
                                {type: 'Attachment', title: 'Send Report attachment ' + self.srvConfig.getItemName(document)},
                                self.srvConfig.c4pUrlUploadFile,
                                'POST',
                                {
                                    type : 'Document',
                                    id : document.id.dbid,
                                    created : [{crm:'sf', id:''}],
                                    askedCrms:askedCrms,
                                    'uploadFileInCrm': false,
                                    'shareFileInCrm': false,
                                    'fileName': document.name,
                                    'fileUid': document.id.dbid,
                                    'object_id': document.parent_id.id
                                    //'c4pToken': params.c4pToken // set by srvSynchro
                                },
                                document.filePath,
                                {'Content-Type': 'application/x-www-form-urlencoded'},
                                {
                                    fileKey: 'file',
                                    fileName: document.name
                                }
                            );
                        }
                        */
                    }
                }
                self.srvSynchro.addRequest('data',
                    requestCtx,
                    self.srvConfig.c4pUrlSfCreate,
                    'POST',
                    params,
                    {'Content-Type':'application/x-www-form-urlencoded'}
                );
            }
        }
        return true;
    }

    function sendDeletion(self, fromObject, toObject) {
        var requestCtx = {
            type:'Delete',
            title:'Delete ' + fromObject.a4p_type + ' ' + self.srvConfig.getItemName(fromObject),
            dbid:fromObject.id.dbid
        };
        var askedCrms = self.srvConfig.getActiveCrms();
        var deleted = [];
        /* ccn_future
        for (var mergeIdx = 0; mergeIdx < toObject.crmObjects.length; mergeIdx++) {
            var object = toObject.crmObjects[mergeIdx];
            if (!toObject.editable) continue;
            if (object.deleted) {
                deleted.push({crm:object.crmId.crm, id:object.crmId.id});
            }
        }
        */
        // TODO : enable later for all CRMs
        if (isValueInList(self.a4pTypesInC4PFirst, fromObject.a4p_type)) {
            // In order : in C4P and SF
            if (isValueInList(askedCrms, 'c4p')) deleted.push({crm:'c4p',id:fromObject.id.c4p_id});
            if (isValueInList(askedCrms, 'sf')) deleted.push({crm:'sf',id:fromObject.id.sf_id});
        } else if (isValueInList(self.a4pTypesForSF, fromObject.a4p_type)) {
            // In order : in SF or C4P
            if (isValueInList(askedCrms, 'sf')) deleted.push({crm:'sf',id:fromObject.id.sf_id});
            else if (isValueInList(askedCrms, 'c4p')) deleted.push({crm:'c4p',id:fromObject.id.c4p_id});
        } else {
            // In C4P
            if (isValueInList(askedCrms, 'c4p')) deleted.push({crm: 'c4p', id: fromObject.id.c4p_id});
        }

        if (deleted.length <= 0) {
            return false;
        }

        var params = {
            type : fromObject.a4p_type,
            id : fromObject.id.dbid,
            deleted : deleted,
            askedCrms:askedCrms
            //c4pToken : self.srvSecurity.getHttpRequestToken() // set by srvSynchro
        };
        // Upon ack answer we will save in original only current fields, not those modified afterward
        self.savingObject = {
            type:fromObject.a4p_type,
            dbid:fromObject.id.dbid,
            action:'delete',
            fields:angular.copy(fromObject)
        };
        self.srvLocalStorage.set('Data-savingObject', self.savingObject);
        if (self.isDemo) {
            onDeleteSuccess(self, requestCtx, {
                id:fromObject.id.dbid,
                type:fromObject.a4p_type,
                askedDeleted:deleted,
                deleted:deleted,
                errors:[]
            });
        } else {
            self.srvSynchro.addRequest('data',
                requestCtx,
                self.srvConfig.c4pUrlSfDelete,
                'POST',
                params,
                {'Content-Type':'application/x-www-form-urlencoded'}
            );
        }
        return true;
    }

    function sendUpdate(self, object, diffResult) {
        //if (a4p.isUndefined(object)) {//TODO ... }
        var requestCtx = {
            type:'Update',
            title:'Update ' + object.a4p_type + ' ' + self.srvConfig.getItemName(object),
            dbid:object.id.dbid
        };
        var askedCrms = self.srvConfig.getActiveCrms();
        var updated = [];
        /* ccn_future
        for (var mergeIdx = 0; mergeIdx < object.crmObjects.length; mergeIdx++) {
            var object = object.crmObjects[mergeIdx];
            if (!object.editable) continue;
            if (object.deleted) {
                updated.push({crm:object.crmId.crm, id:object.crmId.id});
            }
        }
        */
        // TODO : enable later for all CRMs
        if (isValueInList(self.a4pTypesInC4PFirst, object.a4p_type)) {
            // In order : in C4P and SF
            if (isValueInList(askedCrms, 'c4p')) updated.push({crm:'c4p',id:object.id.c4p_id});
            if (isValueInList(askedCrms, 'sf')) updated.push({crm:'sf',id:object.id.sf_id});
        } else if (isValueInList(self.a4pTypesForSF, object.a4p_type)) {
            // In order : in SF or C4P
            if (isValueInList(askedCrms, 'sf')) updated.push({crm:'sf',id:object.id.sf_id});
            else if (isValueInList(askedCrms, 'c4p')) updated.push({crm:'c4p',id:object.id.c4p_id});
        } else {
            // In C4P
            if (isValueInList(askedCrms, 'c4p')) updated.push({crm: 'c4p', id: object.id.c4p_id});
        }

        if (updated.length <= 0) {
            return false;
        }

        // Upon ack answer we will save in original only current fields, not those modified afterward
        self.savingObject = {
            type:object.a4p_type,
            dbid:object.id.dbid,
            action:'update',
            fields:angular.copy(object)
        };
        self.srvLocalStorage.set('Data-savingObject', self.savingObject);

        // TODO : update meta data or content for a file ?
        // TODO : updating file content not yet implemented
        if (self.isDemo) {
            onUpdateSuccess(self, requestCtx, {
                id:object.id.dbid,
                type:object.a4p_type,
                askedUpdated:updated,
                updated:updated,
                errors:[]
            });
        } else {
            var len, i, key, updatedFields = {};
            // Set all ids
            updatedFields.id = object.id;
            // Set updated attributes
            for (i = 0, len = diffResult.length; i < len; i++) {
                key = diffResult[i];
                updatedFields[key] = object[key];
            }
            var params = {
                id : object.id.dbid,
                type : object.a4p_type,
                updated : updated,
                object : object,
                fields : updatedFields,
                askedCrms:askedCrms
                //c4pToken : self.srvSecurity.getHttpRequestToken() // set by srvSynchro
            };
            if (object.a4p_type == 'Report') {
                params.contacts = [];
                params.accounts = [];
                for (i = 0; i < object['contact_ids'].length; i++) {
                    var contact = self.getObject(object['contact_ids'][i].dbid);
                    params.contacts.push(contact);
                    if (a4p.isDefined(contact.account_id)) {
                        var account = self.getObject(contact.account_id.dbid);
                        params.accounts.push(account);
                    } else {
                        params.accounts.push({});
                    }
                }
                params.documents = [];
                var imgType = ['jpg', 'png'];
                for (i = 0; i < object['document_ids'].length; i++) {
                    var document = self.getObject(object['document_ids'][i].dbid);
                    params.documents.push(document);
                    /* CCN : A lot of data sent to only create a downgrade version of Report in SF
                    if (imgType.indexOf(document.extension) != -1) {
                        self.srvSynchro.addFileRequest('data',
                            {type: 'Attachment', title: 'Send Report attachment ' + self.srvConfig.getItemName(document)},
                            self.srvConfig.c4pUrlUploadFile,
                            'POST',
                            {
                                type : 'Document',
                                id : document.id.dbid,
                                created : [{crm:'sf', id:''}],
                                askedCrms:askedCrms,
                                'uploadFileInCrm': false,
                                'shareFileInCrm': false,
                                'fileName': document.name,
                                'fileUid': document.id.dbid,
                                'object_id': document.parent_id.id
                                //'c4pToken': params.c4pToken // set by srvSynchro
                            },
                            document.filePath,
                            {'Content-Type': 'application/x-www-form-urlencoded'},
                            {
                                fileKey: 'file',
                                fileName: document.name
                            }
                        );
                    }
                    */
                }
            }
            self.srvSynchro.addRequest('data',
                requestCtx,
                self.srvConfig.c4pUrlSfUpdate,
                'POST',
                params,
                {'Content-Type':'application/x-www-form-urlencoded'}
            );
        }
        return true;
    }

    function sendSharing(self, object) {
        if (!isValueInList(self.srvConfig.getActiveCrms(), 'sf')) {
            return false;
        }

        var feed = object.feed;

        var params = {
            file:{id : object.id},// Must be a Document id
            body:feed.body,
            title:feed.title
            //c4pToken:self.srvSecurity.getHttpRequestToken() // set by srvSynchro
        };

        var requestCtx = {
            type:'Share',
            title:'Share Document ' + self.srvConfig.getItemName(object),
            dbid:object.id.dbid
        };

        // Upon ack answer we will save in original only current fields, not those modified afterward
        self.savingObject = {
            type:'Document',
            dbid:object.id.dbid,
            action:'share',
            fields:angular.copy(object)
        };
        self.srvLocalStorage.set('Data-savingObject', self.savingObject);

        if (self.isDemo) {
            var answerId = {};
            if (isValueInList(self.srvConfig.getActiveCrms(), 'sf')) {
                answerId.sf_id = 'feedSF'+object.id.dbid;
            }
            onShareSuccess(self, requestCtx, {
                log:'Document shared.',
                id:answerId
            });
        } else {
            self.srvSynchro.addRequest('data',
                requestCtx,
                self.srvConfig.c4pUrlShareDoc,
                'POST',
                params,
                {'Content-Type': 'application/x-www-form-urlencoded'}
            );
        }
        return true;
    }

    // Helper functions to list linked objects via {item: toObject, linkNames: [linkName]}

    Service.prototype.getRemoteObjects = function (fromObject, toType, acceptedLinkNames) {
        var index = {};
        var typedObjects = [];
        var fromType = fromObject.a4p_type;
        var objDesc = c4p.Model.a4p_types[fromType];

        // N+1 Objects

        this.addDirectObjects(fromObject, toType, acceptedLinkNames, typedObjects, index);

        // N+2 Objects

        for (var viaTypeIdx = 0; viaTypeIdx < c4p.Model.attachTypes.length; viaTypeIdx++) {
            var viaType = c4p.Model.attachTypes[viaTypeIdx];
            var viaDesc = c4p.Model.a4p_types[viaType];
            var attachedField = viaDesc.attached;
            var attacheeField = viaDesc.attachee;

            // Via attached side

            var linkOtherModel = viaDesc.linkDescs[attachedField];
            if (acceptedLinkNames[linkOtherModel.many]) {

                // Via ONE link side : N+2 Objects

                for (var fromFieldIdx = 0, nb1 = objDesc.linkFields.length; fromFieldIdx < nb1; fromFieldIdx++) {
                    var linkModel = objDesc.linkFields[fromFieldIdx];
                    var fromField = linkModel.key;
                    var linkName = linkModel.one;
                    if (!acceptedLinkNames[linkName]) continue;
                    this.addFromTypedLinkedRemoteObjectInList(fromObject, fromField, linkName, viaType, toType, attachedField, attacheeField, typedObjects, index);
                }

                // Via MANY link side : N+2 Objects

                this.addGlobalTypedLinkedRemoteObjectInList(fromObject, linkOtherModel.many, viaType, toType, attachedField, attacheeField, typedObjects, index);
            }

            // Via attachee side

            var linkOtherModel = viaDesc.linkDescs[attacheeField];
            if (acceptedLinkNames[linkOtherModel.many]) {

                // Via ONE link side : N+2 Objects

                for (var fromFieldIdx = 0, nb2 = objDesc.linkFields.length; fromFieldIdx < nb2; fromFieldIdx++) {
                    var linkModel = objDesc.linkFields[fromFieldIdx];
                    var fromField = linkModel.key;
                    var linkName = linkModel.one;
                    if (!acceptedLinkNames[linkName]) continue;
                    this.addFromTypedLinkedRemoteObjectInList(fromObject, fromField, linkName, viaType, toType, attacheeField, attachedField, typedObjects, index);
                }

                // Via MANY link side : N+2 Objects

                this.addGlobalTypedLinkedRemoteObjectInList(fromObject, linkOtherModel.many, viaType, toType, attacheeField, attachedField, typedObjects, index);
            }

        }

        return typedObjects;
    };

    Service.prototype.addDirectObjects = function (fromObject, toType, acceptedLinkNames, typedObjects, index) {
        var fromType = fromObject.a4p_type;
        var objDesc = c4p.Model.a4p_types[fromType];

        // Via ONE link side : N+1 Objects

        for (var fromFieldIdx = 0, nb = objDesc.linkFields.length; fromFieldIdx < nb; fromFieldIdx++) {
            var linkModel = objDesc.linkFields[fromFieldIdx];
            var fromField = linkModel.key;
            var linkName = linkModel.one;
            if (!acceptedLinkNames[linkName]) continue;
            this.addFromLinkedTypedDirectObjectInList(fromObject, fromField, linkName, toType, typedObjects, index);
        }

        // Via MANY link side : N+1 Objects

        objDesc = c4p.Model.a4p_types[toType];
        for (var fromOtherFieldIdx = 0, otherNb = objDesc.linkFields.length; fromOtherFieldIdx < otherNb; fromOtherFieldIdx++) {
            var linkOtherModel = objDesc.linkFields[fromOtherFieldIdx];
            var fromOtherField = linkOtherModel.key;
            if (!acceptedLinkNames[linkOtherModel.many]) continue;
            this.addGlobalLinkedDirectObjectInList(fromObject, linkOtherModel.many, toType, fromOtherField, typedObjects, index)
        }

        return typedObjects;
    };

    Service.prototype.addGlobalTypedLinkedRemoteObjectInList = function (fromObject, linkName, viaType, toType, toAttach1Field, toAttach2Field, typedObjects, index) {
        for (var viaObjectIdx=0; viaObjectIdx < this.currentItems[viaType].length; viaObjectIdx++) {
            var viaObject = this.currentItems[viaType][viaObjectIdx];
            if (a4p.isDefined(viaObject)) {
                this.addTypedLinkedRemoteObjectInList(fromObject, linkName, viaObject, toType, toAttach1Field, toAttach2Field, typedObjects, index)
            }
        }
    };

    Service.prototype.addFromTypedLinkedRemoteObjectInList = function (fromObject, fromField, linkName, viaType, toType, toAttach1Field, toAttach2Field, typedObjects, index) {
        var isArrayField = a4p.isDefined(c4p.Model.objectArrays[fromObject.a4p_type][fromField]);
        if (isArrayField) {
            for (var valueIdx = 0, valueNb = fromObject[fromField].length; valueIdx < valueNb; valueIdx++) {
                if (fromObject[fromField][valueIdx]) {
                    var viaObject = this.index.db[fromObject[fromField][valueIdx].dbid];
                    if (a4p.isDefined(viaObject) && (viaObject.a4p_type == viaType)) {
                        this.addTypedLinkedRemoteObjectInList(fromObject, linkName, viaObject, toType, toAttach1Field, toAttach2Field, typedObjects, index);
                    }
                    break;
                }
            }
        } else {
            if (fromObject[fromField]) {
                var viaObject = this.index.db[fromObject[fromField].dbid];
                if (a4p.isDefined(viaObject) && (viaObject.a4p_type == viaType)) {
                    this.addTypedLinkedRemoteObjectInList(fromObject, linkName, viaObject, toType, toAttach1Field, toAttach2Field, typedObjects, index);
                }
            }
        }
    };

    Service.prototype.addTypedLinkedRemoteObjectInList = function (fromObject, linkName, viaObject, toType, toAttach1Field, toAttach2Field, typedObjects, index) {
        var isArrayField = a4p.isDefined(c4p.Model.objectArrays[viaObject.a4p_type][toAttach1Field]);
        if (isArrayField) {
            for (var valueIdx = 0, valueNb = viaObject[toAttach1Field].length; valueIdx < valueNb; valueIdx++) {
                if (viaObject[toAttach1Field][valueIdx].dbid == fromObject.id.dbid) {
                    this.addTypedLinkObjectInList(linkName, viaObject, toAttach2Field, toType, typedObjects, index);
                }
            }
        } else {
            if (viaObject[toAttach1Field].dbid == fromObject.id.dbid) {
                this.addTypedLinkObjectInList(linkName, viaObject, toAttach2Field, toType, typedObjects, index);
            }
        }
    };

    Service.prototype.addFromLinkedTypedDirectObjectInList = function (fromObject, fromField, linkName, toType, typedObjects, index) {
        var isArray = a4p.isDefined(c4p.Model.objectArrays[fromObject.a4p_type][fromField]);
        var linkId = fromObject[fromField];
        if (a4p.isTrueOrNonEmpty(linkId)) {
            if (isArray) {
                for (var i = 0, nb = linkId.length; i < nb; i++) {
                    if (linkId[i]) {
                        this.addTypedIdObjectInList(linkName, toType, linkId[i].dbid, typedObjects, index);
                    }
                }
            } else {
                this.addTypedIdObjectInList(linkName, toType, linkId.dbid, typedObjects, index);
            }
        }
    };

    Service.prototype.addTypedLinkObjectInList = function (linkName, fromObject, fromField, toType, typedObjects, index) {
        var isArray = a4p.isDefined(c4p.Model.objectArrays[fromObject.a4p_type][fromField]);
        var linkId = fromObject[fromField];
        if (a4p.isTrueOrNonEmpty(linkId)) {
            if (isArray) {
                for (var i = 0, nb = linkId.length; i < nb; i++) {
                    if (a4p.isTrueOrNonEmpty(linkId[i])) {
                        this.addTypedIdObjectInList(linkName, toType, linkId[i].dbid, typedObjects, index);
                    }
                }
            } else {
                this.addTypedIdObjectInList(linkName, toType, linkId.dbid, typedObjects, index);
            }
        }
    };

    Service.prototype.addGlobalLinkedDirectObjectInList = function (fromObject, linkName, toType, toField, typedObjects, index) {
        for (var toObjectIdx = 0; toObjectIdx < this.currentItems[toType].length; toObjectIdx++) {
            var toObject = this.currentItems[toType][toObjectIdx];
            if (a4p.isDefined(toObject)) {
                this.addLinkedDirectObjectInList(fromObject, linkName, toObject, toField, typedObjects, index)
            }
        }
    };

    Service.prototype.addLinkedDirectObjectInList = function (fromObject, linkName, toObject, toField, typedObjects, index) {
        var isArrayField = a4p.isDefined(c4p.Model.objectArrays[toObject.a4p_type][toField]);
        if (isArrayField) {
            for (var valueIdx = 0, valueNb = toObject[toField].length; valueIdx < valueNb; valueIdx++) {
                if (toObject[toField][valueIdx].dbid == fromObject.id.dbid) {
                    this.addLinkName(linkName, toObject, typedObjects, index);
                    break;
                }
            }
        } else {
            if (toObject[toField].dbid == fromObject.id.dbid) {
                this.addLinkName(linkName, toObject, typedObjects, index);
            }
        }
    };

    Service.prototype.addTypedIdObjectInList = function (linkName, toType, toId, typedObjects, index) {
        var toObject = this.index.db[toId];
        if (toObject && (toObject.a4p_type == toType)) {
            this.addLinkName(linkName, toObject, typedObjects, index);
        }
    };

    Service.prototype.addLinkName = function (linkName, toObject, typedObjects, index) {
        if (a4p.isTrueOrNonEmpty(toObject)) {
            var toId = toObject.id.dbid;
            var toType = toObject.a4p_type;
            var link = index[toId];
            if (a4p.isUndefined(link)) {
                link = {item: toObject, linkNames: [linkName]};
                index[toId] = link;
                typedObjects.push(link);
            } else {
                addValueToList(link.linkNames, linkName);
            }
        }
    };

    // Helper functions to list linked objects

    /**
     * Return list of items of type toType directly linked (N+1) to fromObject via its link linkName.
     * Then, attach type items Attendees, Attachees and Plannees are also inserted.
     *
     * @param fromObject
     * @param linkName
     * @param toType
     * @returns {Array}
     */
    Service.prototype.getTypedDirectLinks = function (fromObject, linkName, toType) {
        var index = {};
        var toObjects = [];
        var fromType = fromObject.a4p_type;
        var objDesc = c4p.Model.a4p_types[fromType];

        // Via ONE link side : N+1 Objects

        for (var fromFieldIdx = 0; fromFieldIdx < objDesc.linkFields.length; fromFieldIdx++) {
            var linkModel = objDesc.linkFields[fromFieldIdx];
            var fromField = linkModel.key;
            if (linkModel.one != linkName) continue;
            this.addTypedLinkInList(fromObject, fromField, toType, toObjects, index);
        }

        // Via MANY link side : N+1 Objects

        objDesc = c4p.Model.a4p_types[toType];
        for (var fromOtherFieldIdx = 0; fromOtherFieldIdx < objDesc.linkFields.length; fromOtherFieldIdx++) {
            var linkOtherModel = objDesc.linkFields[fromOtherFieldIdx];
            var toField = linkOtherModel.key;
            if (linkOtherModel.many != linkName) continue;
            if (!isValueInList(linkOtherModel.types, fromType)) continue;
            // Add each item toObject of type toType which has fromObject in toObject[toField].
            this.addGlobalLinkedDirectLinkInList(fromObject, toType, toField, toObjects, index)
        }

        return toObjects;
    };

    /**
     * Return list of items of type toType directly linked (N+1) to fromObject via its link linkName
     * or items of type toType indirectly linked (N+2) via attach type items directly linked to fromObject via its link linkName.
     * Then, attach type items Attendees, Attachees and Plannees are also inserted.
     *
     * @param fromObject
     * @param linkName
     * @param toType
     * @returns {Array}
     */
    Service.prototype.getTypedRemoteLinks = function (fromObject, linkName, toType) {
        var index = {};
        var toObjects = [];
        var fromType = fromObject.a4p_type;
        var objDesc = c4p.Model.a4p_types[fromType];

        // N+1 Objects

        toObjects = this.getTypedDirectLinks(fromObject, linkName, toType);

        // N+2 Objects

        for (var viaTypeIdx = 0; viaTypeIdx < c4p.Model.attachTypes.length; viaTypeIdx++) {
            var viaType = c4p.Model.attachTypes[viaTypeIdx];
            var viaDesc = c4p.Model.a4p_types[viaType];
            var attachedField = viaDesc.attached;
            var attacheeField = viaDesc.attachee;

            // Via attached side

            var linkOtherModel = viaDesc.linkDescs[attachedField];
            if (linkOtherModel.many == linkName) {

                // Via ONE link side : N+2 Objects

                for (var fromFieldIdx = 0; fromFieldIdx < objDesc.linkFields.length; fromFieldIdx++) {
                    var linkModel = objDesc.linkFields[fromFieldIdx];
                    var fromField = linkModel.key;
                    if (linkModel.one != linkName) continue;
                    this.addFromTypedLinkedRemoteLinkInList(fromObject, fromField, viaType, toType, attachedField, attacheeField, toObjects, index);
                }

                // Via MANY link side : N+2 Objects

                this.addGlobalTypedLinkedRemoteLinkInList(fromObject, viaType, toType, attachedField, attacheeField, toObjects, index)
            }

            // Via attachee side

            var linkOtherModel = viaDesc.linkDescs[attacheeField];
            if (linkOtherModel.many == linkName) {

                // Via ONE link side : N+2 Objects

                for (var fromFieldIdx = 0; fromFieldIdx < objDesc.linkFields.length; fromFieldIdx++) {
                    var linkModel = objDesc.linkFields[fromFieldIdx];
                    var fromField = linkModel.key;
                    if (linkModel.one != linkName) continue;
                    this.addFromTypedLinkedRemoteLinkInList(fromObject, fromField, viaType, toType, attacheeField, attachedField, toObjects, index);
                }

                // Via MANY link side : N+2 Objects

                this.addGlobalTypedLinkedRemoteLinkInList(fromObject, viaType, toType, attacheeField, attachedField, toObjects, index)
            }

        }

        return toObjects;
    };

    /**
     * Return list of object type items directly linked (N+1) to fromObject via its link linkName.
     * Then, attach type items Attendees, Attachees and Plannees are not inserted.
     *
     * @param fromObject
     * @param linkName
     * @returns {Array}
     */
    Service.prototype.getDirectLinks = function (fromObject, linkName) {
        var index = {};
        var toObjects = [];
        var fromType = fromObject.a4p_type;
        var objDesc = c4p.Model.a4p_types[fromType];

        // Via ONE link side : N+1 Objects

        for (var fromFieldIdx = 0; fromFieldIdx < objDesc.linkFields.length; fromFieldIdx++) {
            var linkModel = objDesc.linkFields[fromFieldIdx];
            var fromField = linkModel.key;
            if (linkModel.one != linkName) continue;
            this.addLinkInList(fromObject, fromField, toObjects, index);
        }

        // Via MANY link side : N+1 Objects

        // Use c4p.Model.allTypes if you want to see Attendees and Attachees
        for (var toTypeIdx = 0; toTypeIdx < c4p.Model.objectTypes.length; toTypeIdx++) {
            var toType = c4p.Model.objectTypes[toTypeIdx];
            objDesc = c4p.Model.a4p_types[toType];
            for (var fromOtherFieldIdx = 0; fromOtherFieldIdx < objDesc.linkFields.length; fromOtherFieldIdx++) {
                var linkOtherModel = objDesc.linkFields[fromOtherFieldIdx];
                var toField = linkOtherModel.key;
                if (linkOtherModel.many != linkName) continue;
                if (!isValueInList(linkOtherModel.types, fromType)) continue;
                // Add each item toObject of type toType which has fromObject in toObject[toField].
                this.addGlobalLinkedDirectLinkInList(fromObject, toType, toField, toObjects, index)
            }
        }

        return toObjects;
    };

    /**
     * Return list of object type items directly linked (N+1) to fromObject via its link linkName
     * or object type items indirectly linked (N+2) via attach type items directly linked to fromObject via its link linkName.
     * Then, attach type items Attendees, Attachees and Plannees are not inserted.
     *
     * @param fromObject
     * @param linkName
     * @returns {Array}
     */
    Service.prototype.getRemoteLinks = function (fromObject, linkName) {
        var index = {};
        var toObjects = [];
        var fromType = fromObject.a4p_type;
        var objDesc = c4p.Model.a4p_types[fromType];

        // Via ONE link side : N+1 or N+2 Objects

        for (var fromFieldIdx = 0; fromFieldIdx < objDesc.linkFields.length; fromFieldIdx++) {
            var linkModel = objDesc.linkFields[fromFieldIdx];
            var fromField = linkModel.key;
            if (linkModel.one != linkName) continue;
            var isArray = a4p.isDefined(c4p.Model.objectArrays[fromObject.a4p_type][fromField]);
            var linkId = fromObject[fromField];
            if (a4p.isTrueOrNonEmpty(linkId)) {
                if (isArray) {
                    for (var i = 0, nb = linkId.length; i < nb; i++) {
                        if (a4p.isTrueOrNonEmpty(linkId[i])) {
                            var toId = linkId[i].dbid;
                            var toObject = this.index.db[toId];
                            if (a4p.isDefined(toObject)) {
                                var toType = toObject.a4p_type;
                                // Use c4p.Model.allTypes if you want to see Attendees and Attachees
                                if (isValueInList(c4p.Model.objectTypes, toType)) {
                                    // N+1 Objects (attach type items Attendees, Attachees and Plannees are not inserted)
                                    this.addIdInList(toId, toObjects, index)
                                } else if (isValueInList(c4p.Model.attachTypes, toType)) {
                                    // N+2 Objects (attach type items Attendees, Attachees and Plannees are not inserted)
                                    // Add any N+2 item linked via linkName link to N+1 attach type item toObject.
                                    this.addAnyLinkedRemoteLinkInList(fromObject, linkName, toObject, toObjects, index);
                                }
                            }
                        }
                    }
                } else {
                    var toId = linkId.dbid;
                    var toObject = this.index.db[toId];
                    if (a4p.isDefined(toObject)) {
                        var toType = toObject.a4p_type;
                        // Use c4p.Model.allTypes if you want to see Attendees and Attachees
                        if (isValueInList(c4p.Model.objectTypes, toType)) {
                            // N+1 Objects (attach type items Attendees, Attachees and Plannees are not inserted)
                            this.addIdInList(toId, toObjects, index)
                        } else if (isValueInList(c4p.Model.attachTypes, toType)) {
                            // N+2 Objects (attach type items Attendees, Attachees and Plannees are not inserted)
                            // Add any N+2 item linked via linkName link to N+1 attach type item toObject.
                            this.addAnyLinkedRemoteLinkInList(fromObject, linkName, toObject, toObjects, index);
                        }
                    }
                }
            }
        }

        // Via MANY link side : N+1 Objects (attach type items Attendees, Attachees and Plannees are not inserted)

        for (var toTypeIdx = 0; toTypeIdx < c4p.Model.objectTypes.length; toTypeIdx++) {
            var toType = c4p.Model.objectTypes[toTypeIdx];
            objDesc = c4p.Model.a4p_types[toType];
            for (var fromOtherFieldIdx = 0, nb = objDesc.linkFields.length; fromOtherFieldIdx < nb; fromOtherFieldIdx++) {
                var linkOtherModel = objDesc.linkFields[fromOtherFieldIdx];
                var toField = linkOtherModel.key;
                if (linkOtherModel.many != linkName) continue;
                if (!isValueInList(linkOtherModel.types, fromType)) continue;
                // Add each item toObject of type toType which has fromObject in toObject[toField].
                this.addGlobalLinkedDirectLinkInList(fromObject, toType, toField, toObjects, index)
            }
        }

        // Via MANY link side : N+2 Objects (attach type items Attendees, Attachees and Plannees are not inserted)

        for (var viaTypeIdx = 0; viaTypeIdx < c4p.Model.attachTypes.length; viaTypeIdx++) {
            var viaType = c4p.Model.attachTypes[viaTypeIdx];
            var viaDesc = c4p.Model.a4p_types[viaType];
            var attachedField = viaDesc.attached;
            var attacheeField = viaDesc.attachee;

            // Via attached side

            var linkOtherModel = viaDesc.linkDescs[attachedField];
            if (linkOtherModel.many == linkName) {
                // Add any item identified in viaObject[attacheeField]
                // for each attach type item viaObject of type viaType which has fromObject in viaObject[attachedField].
                this.addGlobalLinkedRemoteLinkInList(fromObject, viaType, attachedField, attacheeField, toObjects, index)
            }

            // Via attachee side

            linkOtherModel = viaDesc.linkDescs[attacheeField];
            if (linkOtherModel.many == linkName) {
                // Add any item identified in viaObject[attachedField]
                // for each attach type item viaObject of type viaType which has fromObject in viaObject[attacheeField].
                this.addGlobalLinkedRemoteLinkInList(fromObject, viaType, attacheeField, attachedField, toObjects, index)
            }
        }

        return toObjects;
    };

    /**
     * For each item toObject of type toType which has fromObject in toObject[toField],
     * add toObject into list & index.
     *
     * @param fromObject
     * @param toType
     * @param toField
     * @param list Result list in which chosen item(s) is(are) inserted.
     * @param index Result index of list items.
     */
    Service.prototype.addGlobalLinkedDirectLinkInList = function (fromObject, toType, toField, list, index) {
        for (var toObjectIdx = 0; toObjectIdx < this.currentItems[toType].length; toObjectIdx++) {
            var toObject = this.currentItems[toType][toObjectIdx];
            if (a4p.isDefined(toObject)) {
                this.addLinkedDirectLinkInList(fromObject, toObject, toField, list, index)
            }
        }
    };

    /**
     * If item toObject has fromObject in toObject[toField],
     * add toObject into list & index.
     *
     * @param fromObject
     * @param toObject
     * @param toField
     * @param list Result list in which chosen item(s) is(are) inserted.
     * @param index Result index of list items.
     */
    Service.prototype.addLinkedDirectLinkInList = function (fromObject, toObject, toField, list, index) {
        var isArrayField = a4p.isDefined(c4p.Model.objectArrays[toObject.a4p_type][toField]);
        if (isArrayField) {
            for (var valueIdx = 0, valueNb = toObject[toField].length; valueIdx < valueNb; valueIdx++) {
                if (toObject[toField][valueIdx].dbid == fromObject.id.dbid) {
                    this.addObjectInList(toObject, list, index);
                    break;
                }
            }
        } else {
            if (toObject[toField].dbid == fromObject.id.dbid) {
                this.addObjectInList(toObject, list, index);
            }
        }
    };

    /**
     * Add the item toObject into list & index.
     *
     * @param toObject Item to be inserted into list.
     * @param list Result list in which chosen item is inserted.
     * @param index Result index of list items.
     */
    Service.prototype.addObjectInList = function (toObject, list, index) {
        if (a4p.isUndefined(index[toObject.id.dbid])) {
            index[toObject.id.dbid] = toObject;
            list.push(toObject);
        }
    };

    /**
     * For each attach type item viaObject identified in fromObject[fromField] of type viaType which has fromObject in viaObject[toAttach1Field],
     * add any item identified in viaObject[toAttach2Field] and of type toType into list & index.
     *
     * @param fromObject
     * @param fromField
     * @param viaType Type required for each viaObject item.
     * @param toType Type required for this item to be inserted into list.
     * @param toAttach1Field
     * @param toAttach2Field
     * @param list Result list in which chosen item(s) is(are) inserted.
     * @param index Result index of list items.
     */
    Service.prototype.addFromTypedLinkedRemoteLinkInList = function (fromObject, fromField, viaType, toType, toAttach1Field, toAttach2Field, list, index) {
        var isArrayField = a4p.isDefined(c4p.Model.objectArrays[fromObject.a4p_type][fromField]);
        if (isArrayField) {
            for (var valueIdx = 0, valueNb = fromObject[fromField].length; valueIdx < valueNb; valueIdx++) {
                if (fromObject[fromField][valueIdx]) {
                    var viaObject = this.index.db[fromObject[fromField][valueIdx].dbid];
                    if (a4p.isDefined(viaObject) && (viaObject.a4p_type == viaType)) {
                        this.addTypedLinkedRemoteLinkInList(fromObject, viaObject, toType, toAttach1Field, toAttach2Field, list, index);
                    }
                    break;
                }
            }
        } else {
            if (fromObject[fromField]) {
                var viaObject = this.index.db[fromObject[fromField].dbid];
                if (a4p.isDefined(viaObject) && (viaObject.a4p_type == viaType)) {
                    this.addTypedLinkedRemoteLinkInList(fromObject, viaObject, toType, toAttach1Field, toAttach2Field, list, index);
                }
            }
        }
    };

    /**
     * For each attach type item viaObject of type viaType which has fromObject in viaObject[toAttach1Field],
     * add any item identified in viaObject[toAttach2Field] and of type toType into list & index.
     *
     * @param fromObject
     * @param viaType Type required for each viaObject item.
     * @param toType Type required for this item to be inserted into list.
     * @param toAttach1Field
     * @param toAttach2Field
     * @param list Result list in which chosen item(s) is(are) inserted.
     * @param index Result index of list items.
     */
    Service.prototype.addGlobalTypedLinkedRemoteLinkInList = function (fromObject, viaType, toType, toAttach1Field, toAttach2Field, list, index) {
        for (var viaObjectIdx = 0; viaObjectIdx < this.currentItems[viaType].length; viaObjectIdx++) {
            var viaObject = this.currentItems[viaType][viaObjectIdx];
            if (a4p.isDefined(viaObject)) {
                this.addTypedLinkedRemoteLinkInList(fromObject, viaObject, toType, toAttach1Field, toAttach2Field, list, index)
            }
        }
    };

    /**
     * If attach type item viaObject has fromObject in viaObject[toAttach1Field],
     * add any item identified in viaObject[toAttach2Field] and of type toType into list & index.
     *
     * @param fromObject
     * @param viaObject
     * @param toType Type required for this item to be inserted into list.
     * @param toAttach1Field
     * @param toAttach2Field
     * @param list Result list in which chosen item(s) is(are) inserted.
     * @param index Result index of list items.
     */
    Service.prototype.addTypedLinkedRemoteLinkInList = function (fromObject, viaObject, toType, toAttach1Field, toAttach2Field, list, index) {
        var isArrayField = a4p.isDefined(c4p.Model.objectArrays[viaObject.a4p_type][toAttach1Field]);
        if (isArrayField) {
            for (var valueIdx = 0, valueNb = viaObject[toAttach1Field].length; valueIdx < valueNb; valueIdx++) {
                if (viaObject[toAttach1Field][valueIdx].dbid == fromObject.id.dbid) {
                    this.addTypedLinkInList(viaObject, toAttach2Field, toType, list, index);
                }
            }
        } else {
            if (viaObject[toAttach1Field].dbid == fromObject.id.dbid) {
                this.addTypedLinkInList(viaObject, toAttach2Field, toType, list, index);
            }
        }
    };

    /**
     * Add any item identified in fromObject[fromField] and of type toType into list & index.
     *
     * @param fromObject
     * @param fromField
     * @param toType Type required for this item to be inserted into list.
     * @param list Result list in which chosen item(s) is(are) inserted.
     * @param index Result index of list items.
     */
    Service.prototype.addTypedLinkInList = function (fromObject, fromField, toType, list, index) {
        var isArray = a4p.isDefined(c4p.Model.objectArrays[fromObject.a4p_type][fromField]);
        var linkId = fromObject[fromField];
        if (a4p.isTrueOrNonEmpty(linkId)) {
            if (isArray) {
                for (var i = 0, nb = linkId.length; i < nb; i++) {
                    if (a4p.isTrueOrNonEmpty(linkId[i])) {
                        this.addTypedIdInList(toType, linkId[i].dbid, list, index);
                    }
                }
            } else {
                this.addTypedIdInList(toType, linkId.dbid, list, index);
            }
        }
    };

    /**
     * Add the item identified by toId and of type toType into list & index.
     *
     * @param toType Type required for this item to be inserted into list.
     * @param toId Id required for this item to be inserted into list.
     * @param list Result list in which chosen item is inserted.
     * @param index Result index of list items.
     */
    Service.prototype.addTypedIdInList = function (toType, toId, list, index) {
        var toObject = this.index.db[toId];
        if (a4p.isDefined(toObject) && a4p.isUndefined(index[toId]) && (toObject.a4p_type == toType)) {
            index[toId] = toObject;
            list.push(toObject);
        }
    };

    /**
     * Add any N+2 item linked via linkName link to N+1 attach type item viaObject.
     *
     * @param fromObject
     * @param linkName Name of 'many' side link of attach type item viaObject
     * @param viaObject
     * @param list Result list in which chosen item(s) is(are) inserted.
     * @param index Result index of list items.
     */
    Service.prototype.addAnyLinkedRemoteLinkInList = function (fromObject, linkName, viaObject, list, index) {
        var viaType = viaObject.a4p_type;
        var objDesc = c4p.Model.a4p_types[viaType];
        var attachedField = objDesc.attached;
        var attacheeField = objDesc.attachee;
        // Via attached side
        if (objDesc.linkDescs[attachedField].many == linkName) {
            this.addLinkedRemoteLinkInList(fromObject, viaObject, attachedField, attacheeField, list, index);
        }
        // Via attachee side
        if (objDesc.linkDescs[attacheeField].many == linkName) {
            this.addLinkedRemoteLinkInList(fromObject, viaObject, attacheeField, attachedField, list, index);
        }
    };

    /**
     * For each attach type item viaObject of type viaType which has fromObject in viaObject[toAttach1Field],
     * add any item identified in viaObject[toAttach2Field] into list & index.
     *
     * @param fromObject
     * @param viaType Type required for each viaObject item.
     * @param toAttach1Field
     * @param toAttach2Field
     * @param list Result list in which chosen item(s) is(are) inserted.
     * @param index Result index of list items.
     */
    Service.prototype.addGlobalLinkedRemoteLinkInList = function (fromObject, viaType, toAttach1Field, toAttach2Field, list, index) {
        for (var viaObjectIdx = 0; viaObjectIdx < this.currentItems[viaType].length; viaObjectIdx++) {
            var viaObject = this.currentItems[viaType][viaObjectIdx];
            if (a4p.isDefined(viaObject)) {
                this.addLinkedRemoteLinkInList(fromObject, viaObject, toAttach1Field, toAttach2Field, list, index)
            }
        }
    };

    /**
     * If attach type item viaObject has fromObject in viaObject[toAttach1Field],
     * add any item identified in viaObject[toAttach2Field] into list & index.
     *
     * @param fromObject
     * @param viaObject
     * @param toAttach1Field
     * @param toAttach2Field
     * @param list Result list in which chosen item(s) is(are) inserted.
     * @param index Result index of list items.
     */
    Service.prototype.addLinkedRemoteLinkInList = function (fromObject, viaObject, toAttach1Field, toAttach2Field, list, index) {
        var isArrayField = a4p.isDefined(c4p.Model.objectArrays[viaObject.a4p_type][toAttach1Field]);
        if (isArrayField) {
            for (var valueIdx = 0, valueNb = viaObject[toAttach1Field].length; valueIdx < valueNb; valueIdx++) {
                if (viaObject[toAttach1Field][valueIdx].dbid == fromObject.id.dbid) {
                    this.addLinkInList(viaObject, toAttach2Field, list, index);
                    break;
                }
            }
        } else {
            if (viaObject[toAttach1Field].dbid == fromObject.id.dbid) {
                this.addLinkInList(viaObject, toAttach2Field, list, index);
            }
        }
    };

    /**
     * Add any item identified in fromObject[fromField] into list & index.
     *
     * @param fromObject
     * @param fromField
     * @param list Result list in which chosen item(s) is(are) inserted.
     * @param index Result index of list items.
     */
    Service.prototype.addLinkInList = function (fromObject, fromField, list, index) {
        var isArray = a4p.isDefined(c4p.Model.objectArrays[fromObject.a4p_type][fromField]);
        var linkId = fromObject[fromField];
        if (a4p.isTrueOrNonEmpty(linkId)) {
            if (isArray) {
                for (var i = 0, nb = linkId.length; i < nb; i++) {
                    if (a4p.isTrueOrNonEmpty(linkId[i])) {
                        this.addIdInList(linkId[i].dbid, list, index);
                    }
                }
            } else {
                this.addIdInList(linkId.dbid, list, index);
            }
        }
    };

    /**
     * Add the item identified by toId into list & index.
     *
     * @param toId Id required for this item to be inserted into list.
     * @param list Result list in which chosen item is inserted.
     * @param index Result index of list items.
     */
    Service.prototype.addIdInList = function (toId, list, index) {
        var toObject = this.index.db[toId];
        if (a4p.isDefined(toObject) && a4p.isUndefined(index[toId])) {
            index[toId] = toObject;
            list.push(toObject);
        }
    };

    // Get relations between objects

    /**
     *
     * @param fromObject
     * @param toObject
     * @returns boolean
     */
    Service.prototype.hasAnyLinkTo = function (fromObject, toObject) {
        // Special cases not referenced into c4p.Model.a4p_types[fromObject.a4p_type].linkDescs
        if ((fromObject.a4p_type == 'Event')) {
            if (!!this.getAttachment('Attendee', toObject, fromObject)) return true;
            if (!!this.getAttachment('Attachee', toObject, fromObject)) return true;
        } else if ((fromObject.a4p_type == 'Contact')) {
            if (!!this.getAttachment('Attendee', fromObject, toObject)) return true;
        } else if ((fromObject.a4p_type == 'Document')) {
            if (!!this.getAttachment('Attachee', fromObject, toObject)) return true;
        }
        // Common cases
        for (var fromFieldIdx=0; fromFieldIdx<c4p.Model.a4p_types[fromObject.a4p_type].linkFields.length; fromFieldIdx++) {
            var linkModel = c4p.Model.a4p_types[fromObject.a4p_type].linkFields[fromFieldIdx];
            var fromField = linkModel.key;
            for (var toTypeIdx=0; toTypeIdx<linkModel.types.length; toTypeIdx++) {
                if (linkModel.types[toTypeIdx] == toObject.a4p_type) {
                    if (this.isItemLinkedToObject(fromObject, fromField, toObject)) return true;
                }
            }
        }
        for (var fromFieldIdx=0; fromFieldIdx<c4p.Model.a4p_types[toObject.a4p_type].linkFields.length; fromFieldIdx++) {
            var linkModel = c4p.Model.a4p_types[toObject.a4p_type].linkFields[fromFieldIdx];
            var fromField = linkModel.key;
            for (var toTypeIdx=0; toTypeIdx<linkModel.types.length; toTypeIdx++) {
                if (linkModel.types[toTypeIdx] == fromObject.a4p_type) {
                    if (this.isItemLinkedToObject(toObject, fromField, fromObject)) return true;
                }
            }
        }
        return false;
    };

    /**
     * Return an array of objects directly linked to the object passed in argument.
     * For each object, you will have the object AND a list of existing links.
     *
     * @param fromObject Object to use as root
     * @return {Array} Return an array of objects directly linked to the object passed in argument.
     */
    Service.prototype.getLinkedObjects = function (fromObject) {
        var result = [];
        if (a4p.isUndefined(fromObject)) {
            return result;
        }
        var index = {};
        var dbid = fromObject.id.dbid;
        var fromType = fromObject.a4p_type;

        // Via MANY link side : N+1 Objects

        // Use c4p.Model.allTypes if you want to see Attendees and Attachees
        for (var otherTypeIdx=0; otherTypeIdx<c4p.Model.objectTypes.length; otherTypeIdx++) {
            var fromOtherType = c4p.Model.objectTypes[otherTypeIdx];
            var objDesc = c4p.Model.a4p_types[fromOtherType];
            for (var otherObjectIdx=0; otherObjectIdx < this.currentItems[fromOtherType].length; otherObjectIdx++) {
                var otherObject = this.currentItems[fromOtherType][otherObjectIdx];
                var otherId = otherObject.id.dbid;
                for (var fromOtherFieldIdx=0; fromOtherFieldIdx<objDesc.linkFields.length; fromOtherFieldIdx++) {
                    var linkOtherModel = objDesc.linkFields[fromOtherFieldIdx];
                    var fromOtherField = linkOtherModel.key;
                    var isArrayField = a4p.isDefined(c4p.Model.objectArrays[fromOtherType][fromOtherField]);
                    var fromOtherLinkName = linkOtherModel.many;
                    if (isArrayField) {
                        for (var valueIdx = 0, valueNb = otherObject[fromOtherField].length; valueIdx < valueNb; valueIdx++) {
                            if (otherObject[fromOtherField][valueIdx].dbid == dbid) {
                                addLinkedObject(this, result, index, fromOtherLinkName, otherId);
                                break;
                            }
                        }
                    } else {
                        if (otherObject[fromOtherField].dbid == dbid) {
                            addLinkedObject(this, result, index, fromOtherLinkName, otherId);
                        }
                    }
                }
            }
        }

        // Via MANY link side : N+2 Objects

        for (var otherTypeIdx=0; otherTypeIdx<c4p.Model.attachTypes.length; otherTypeIdx++) {
            var fromOtherType = c4p.Model.attachTypes[otherTypeIdx];
            var objDesc = c4p.Model.a4p_types[fromOtherType];
            var nbLink = objDesc.linkFields.length;
            for (var otherObjectIdx=0; otherObjectIdx < this.currentItems[fromOtherType].length; otherObjectIdx++) {
                var otherObject = this.currentItems[fromOtherType][otherObjectIdx];
                var otherId = otherObject.id.dbid;
                for (var fromOtherFieldIdx=0; fromOtherFieldIdx<nbLink; fromOtherFieldIdx++) {
                    var linkOtherModel = objDesc.linkFields[fromOtherFieldIdx];
                    var fromOtherField = linkOtherModel.key;
                    var isArrayField = a4p.isDefined(c4p.Model.objectArrays[fromOtherType][fromOtherField]);
                    var fromOtherLinkName = linkOtherModel.many;
                    if (isArrayField) {
                        for (var valueIdx = 0, valueNb = otherObject[fromOtherField].length; valueIdx < valueNb; valueIdx++) {
                            if (otherObject[fromOtherField][valueIdx].dbid == dbid) {
                                // Point on N+2 object directly instead of this N+1 object (Take the first linkName different from fromOtherField)
                                for (var otherFieldIdx=0; otherFieldIdx<nbLink; otherFieldIdx++) {
                                    var otherModel = objDesc.linkFields[otherFieldIdx];
                                    var otherField = otherModel.key;
                                    if (otherField != fromOtherField) {
                                        var toNp2Id = otherObject[otherField].dbid;
                                        addLinkedObject(this, result, index, fromOtherLinkName, toNp2Id);
                                    }
                                }
                                break;
                            }
                        }
                    } else {
                        if (otherObject[fromOtherField].dbid == dbid) {
                            // Point on N+2 object directly instead of this N+1 object (Take the first linkName different from fromOtherField)
                            for (var otherFieldIdx=0; otherFieldIdx<nbLink; otherFieldIdx++) {
                                var otherModel = objDesc.linkFields[otherFieldIdx];
                                var otherField = otherModel.key;
                                if (otherField != fromOtherField) {
                                    var toNp2Id = otherObject[otherField].dbid;
                                    addLinkedObject(this, result, index, fromOtherLinkName, toNp2Id);
                                }
                            }
                        }
                    }
                }
            }
        }
        return result;
    };

    function addLinkedObject(self, result, index, linkName, dbid) {
        var toObject = self.index.db[dbid];
        if (a4p.isDefined(toObject)) {
            var link = index[dbid];
            if (a4p.isUndefined(link)) {
                link = {item:toObject, linkNames:[]};
                index[dbid] = link;
                result.push(link);
            }
            addValueToList(link.linkNames, linkName);
        }
    }

    /**
     * Remove links of objects directly linked to the object passed in argument.
     * For each object updated, an update will be sent as if setObject() has been called.
     * For each object removed, a remove will be sent as if removeObject() has been called.
     *
     * @param self
     * @param dbid Id of object to use as root
     * @param isOriginal
     */
    function unlinkLinkedObjects(self, dbid, isOriginal) {
        // Via MANY link side
        for (var otherTypeIdx=0; otherTypeIdx<c4p.Model.allTypes.length; otherTypeIdx++) {
            var fromOtherType = c4p.Model.allTypes[otherTypeIdx];
            var objDesc = c4p.Model.a4p_types[fromOtherType];
            for (var otherObjectIdx=0; otherObjectIdx < self.currentItems[fromOtherType].length; otherObjectIdx++) {
                var otherObject = self.currentItems[fromOtherType][otherObjectIdx];
                var otherId = otherObject.id.dbid;
                for (var fromOtherFieldIdx=0; fromOtherFieldIdx<objDesc.linkFields.length; fromOtherFieldIdx++) {
                    var linkOtherModel = objDesc.linkFields[fromOtherFieldIdx];
                    var fromOtherField = linkOtherModel.key;
                    var isArrayField = a4p.isDefined(c4p.Model.objectArrays[fromOtherType][fromOtherField]);
                    if (isArrayField) {
                        for (var valueIdx = 0, valueNb = otherObject[fromOtherField].length; valueIdx < valueNb; valueIdx++) {
                            if (otherObject[fromOtherField][valueIdx].dbid == dbid) {
                                otherObject[fromOtherField].splice(valueIdx, 1);
                                if ((otherObject[fromOtherField].length <= 0) && (linkOtherModel.cascadeDelete == 'many')) {
                                    self.removeObject(otherId, isOriginal);
                                } else {
                                    self.setObject(otherObject, isOriginal);
                                }
                                if (!isOriginal) self.addObjectToSave(fromOtherType, otherId);
                                break;
                            }
                        }
                    } else {
                        if (otherObject[fromOtherField].dbid == dbid) {
                            otherObject[fromOtherField] = {};
                            if (linkOtherModel.cascadeDelete == 'many') {
                                self.removeObject(otherId, isOriginal);
                            } else {
                                self.setObject(otherObject, isOriginal);
                            }
                            if (!isOriginal) self.addObjectToSave(fromOtherType, otherId);
                        }
                    }
                }
            }
        }
    }

    /**
     * Return the action to do to update locally edited object into server's CRM.
     * Return null if this object is the same as its original (from last fullmap).
     * Return the string 'new' if this object has been locally created.
     * Return the string 'delete' if this object has been locally deleted.
     * Return the array of fields modified if this object has been locally updated.
     *
     * @param fromObject Original object
     * @param toObject Final object
     * @return {null|string|Array} Return null, 'new', 'delete' or the fields modified.
     */
    function diffObject(fromObject, toObject) {
        if (a4p.isDefined(toObject)) {
            if ((toObject.c4p_synchro.deleting == c4p.Synchro.NEW)
                || (toObject.c4p_synchro.deleting == c4p.Synchro.QUEUE)) {
                // Object deleted
                return 'delete';
            } else if (a4p.isDefinedAndNotNull(fromObject)) {
                // Check for field updates
                var type = fromObject.a4p_type;
                var updated = false;
                var updates = [];
                var objDesc = c4p.Model.a4p_types[type];
                for (var fieldIdx = 0, len = objDesc.fields.length; fieldIdx < len; fieldIdx++) {
                    var fieldName = objDesc.fields[fieldIdx];
                    var isArrayField = a4p.isDefined(c4p.Model.objectArrays[type][fieldName]);
                    if (isArrayField) {
                        if (toObject[fieldName].length != fromObject[fieldName].length) {
                            updated = true;
                            updates.push(fieldName);
                        } else {
                            for (var valueIdx = 0, valueNb = toObject[fieldName].length; valueIdx < valueNb; valueIdx++) {
                                if (diffField(type, fieldName, fromObject[fieldName][valueIdx], toObject[fieldName][valueIdx])) {
                                    updated = true;
                                    updates.push(fieldName);
                                    break;
                                }
                            }
                        }
                    } else {
                        if (diffField(type, fieldName, fromObject[fieldName], toObject[fieldName])) {
                            updated = true;
                            updates.push(fieldName);
                        }
                    }
                }
                if (updated) {
                    return updates;
                } else {
                    return null;
                }
            } else {
                // Object created
                return 'new';
            }
        } else {
            if (a4p.isDefinedAndNotNull(fromObject)) {
                // Object deleted
                return 'delete';
            } else {
                // Nothing
                return null;
            }
        }
    }

    function diffField(a4p_type, fieldname, fromField, toField) {
        if (a4p.isDefined(c4p.Model.a4p_types[a4p_type].linkDescs[fieldname])) {
            var isArrayField = a4p.isDefined(c4p.Model.objectArrays[a4p_type][fieldname]);
            if (!isArrayField) {
                if (toField.dbid != fromField.dbid) {
                    return true;
                }
            } else {
                if (toField.length != fromField.length) {
                    return true;
                }
                for (var valueIdx = 0, valueNb = toField.length; valueIdx < valueNb; valueIdx++) {
                    if (toField[valueIdx].dbid != fromField[valueIdx].dbid) {
                        return true;
                    }
                }
            }
        } else if (toField instanceof Object) {
            for (var k in toField) {
                if (!toField.hasOwnProperty(k)) continue;
                if (toField[k] != fromField[k]) {
                    return true;
                }
            }
        } else {
            if (toField != fromField) {
                return true;
            }
        }
        return false;
    }

    Service.prototype.setThumbNail = function(object) {
        var type = object.a4p_type.toLowerCase();
        if ((type == 'account') || (type == 'contact') || (type == 'document') || (type == 'event')
            || (type == 'opportunity') || (type == 'picture') || (type == 'add')){
            object.thumb_url = 'l4p/img/default_thumb_' + type + '.png';
        } else if (type == 'lead') {
            object.thumb_url = 'l4p/img/default_thumb_opportunity.png';
        } else if (type == 'note') {
            object.thumb_url = 'l4p/img/default_thumb_document.png';
        } else if (type == 'report') {
            object.thumb_url = 'l4p/img/default_thumb_document.png';
        } else if (object.extension == 'doc') {
            object.thumb_url = 'l4p/img/default_logo_doc.png';
        } else if (object.extension == 'pdf') {
            object.thumb_url = 'l4p/img/default_logo_pdf.png';
        } else if (object.extension == 'txt') {
            object.thumb_url = 'l4p/img/default_logo_txt.png';
        } else if (object.extension == 'avi') {
            object.thumb_url = 'l4p/img/default_logo_avi.png';
        } else if (object.extension == 'css') {
            object.thumb_url = 'l4p/img/default_logo_CSS.png';
        } else if (object.extension == 'fla') {
            object.thumb_url = 'l4p/img/default_logo_fla.png';
        } else if (object.extension == 'htm') {
            object.thumb_url = 'l4p/img/default_logo_htm.png';
        } else if (object.extension == 'jpg') {
	        object.thumb_url = 'l4p/img/default_logo_jpg.png';
        } else if (object.extension == 'mov') {
            object.thumb_url = 'l4p/img/default_logo_mov.png';
        } else if (object.extension == 'mp3') {
            object.thumb_url = 'l4p/img/default_logo_mp3.png';
        } else if (object.extension == 'mp4') {
            object.thumb_url = 'l4p/img/default_logo_mp4.png';
        } else if (object.extension == 'png') {
        	object.thumb_url = 'l4p/img/default_logo_png.png';
        } else if (object.extension == 'ppt') {
            object.thumb_url = 'l4p/img/default_logo_ppt.png';
        } else if (object.extension == 'swf') {
            object.thumb_url = 'l4p/img/default_logo_swf.png';
        } else if (object.extension == 'wav') {
            object.thumb_url = 'l4p/img/default_logo_wav.png';
        } else if (object.extension == 'xls') {
            object.thumb_url = 'l4p/img/default_logo_xls.png';
        } else if (object.extension == 'xsl') {
            object.thumb_url = 'l4p/img/default_logo_xsl.png';
        } else {
            object.thumb_url = 'l4p/img/default_logo_unknown.png';
        }
    };

    Service.prototype.setDefaultFields = function(object) {
        // Set undefined fields to a default value
        var objDesc = c4p.Model.a4p_types[object.a4p_type];
        for (var i = 0, len = objDesc.fields.length; i < len; i++) {
            var key = objDesc.fields[i];
            if (a4p.isDefined(object[key])) continue;
            var isArrayField = a4p.isDefined(c4p.Model.objectArrays[object.a4p_type][key]);
            if (isArrayField) {
                object[key] = [];
            } else if (a4p.isDefined(objDesc.linkDescs[key])) {
                object[key] = {};
            } else {
                object[key] = '';
                // Set attribute to default value
                if (a4p.isDefined(objDesc.editObjectFields)
                    && a4p.isDefined(objDesc.editObjectFields[key])) {
                    var fieldEditModel = objDesc.editObjectFields[key];
                    // WARNING : (0 != '') is FALSE
                    if (a4p.isDefined(fieldEditModel.defaultValue)
                        && (fieldEditModel.defaultValue !== '')) {
                    	var translated = this.srvLocale.translations[fieldEditModel.defaultValue];

                    	if(translated != undefined) object[key] = translated;
                    	else object[key] = fieldEditModel.defaultValue;
                    } else if (a4p.isDefined(fieldEditModel.defaultSetter)) {
                        var values = [];

                        if (a4p.isDefined(fieldEditModel.defaultSetterParam)) {
                        	values.push(this.srvLocale);
                        	values.push(fieldEditModel.defaultSetterParam);
                        }
                        object[key] = c4p.Model[fieldEditModel.defaultSetter].apply(c4p.Model, values);
                    }
                }
            }
        }
    };

    Service.prototype.convertFields = function(object) {
        var objDesc = c4p.Model.a4p_types[object.a4p_type];
        for (var i = 0, len = objDesc.fields.length; i < len; i++) {
            var key = objDesc.fields[i];
            if (a4p.isDefined(objDesc.editObjectFields)
                && a4p.isDefined(objDesc.editObjectFields[key])) {
                var fieldEditModel = objDesc.editObjectFields[key];
                var isArrayField = a4p.isDefined(c4p.Model.objectArrays[object.a4p_type][key]);
                if (isArrayField) {
                    var newField = [];
                    for (var valueIdx = 0, valueNb = object[key].length; valueIdx < valueNb; valueIdx++) {
                        newField.push(convertField(fieldEditModel, object[key][valueIdx]));
                    }
                    object[key] = newField;
                } else {
                    object[key] = convertField(fieldEditModel, object[key]);
                }
            }
        }
    };

    function convertField(fieldEditModel, value) {
        if ((fieldEditModel.type == 'number')
            || (fieldEditModel.type == 'probability')
            || (fieldEditModel.type == 'currency')) {
            if ((typeof(value) == 'string')) {
                return parseInt(value, 10);
            } else {
                return value;
            }
        } else if (fieldEditModel.type == 'boolean') {
            if ((typeof(value) == 'string')) {
                return !((value.length == 0)
                    || (value.toLowerCase() == '0')
                    || (value.toLowerCase() == 'no')
                    || (value.toLowerCase() == 'null')
                    || (value.toLowerCase() == 'false'));
            } else if ((typeof(value) == 'number')) {
                return !(value == 0);
            } else {
                return (value ? true : false);
            }
        } else if ((fieldEditModel.type == 'time')
            || (fieldEditModel.type == 'datetime')) {
            if (typeof(value) == 'undefined') {
                return '';
            } else if ((typeof(value) == 'string') && (value === 'false')) {
                return '';
            } else {
                return a4pDateFormat(a4pDateParse(value));
            }
        } else if ((fieldEditModel.type == 'date')) {
            if (typeof(value) == 'undefined') {
                return '';
            } else if ((typeof(value) == 'string') && (value === 'false')) {
                return '';
            } else if (typeof(value) != 'string') {
                return '';
            } else {
                return a4pDateFormat(a4pDateParse(value));
            }
        } else if (fieldEditModel.type == 'rating') {
            var rating = {};
            if (typeof(value) == 'undefined') {
                return {code:'Feeling', name:'Feeling', type:'star', value: 0}
            } else if (typeof(value) == 'string') {
                rating = a4p.Json.string2Object(value);
                if ((rating.type != 'star') && (rating.type != 'check')) {
                    rating.type = 'star';
                }
                if (!rating.name) {
                    rating.name = 'Feeling';
                    rating.code = 'Feeling';
                }
                if (typeof(rating.value) == 'undefined') {
                    rating.value = 0;
                }
                return rating;
            } else {
                rating = {};
                if ((value.type != 'star') && (value.type != 'check')) {
                    rating.type = 'star';
                } else {
                    rating.type = value.type;
                }
                if (!value.name) {
                    rating.name = 'Feeling';
                    rating.code = 'Feeling';
                } else {
                    rating.name = value.name;
                    rating.code = value.code || value.name;
                }
                if (!value.value) {
                    rating.value = 0;
                } else {
                    rating.value = value.value;
                }
                return rating;
            }
        } else {// tel, mail, textarea, url or ''
            if (typeof(value) == 'undefined') {
                return '';
            } else if (typeof(value) != 'string') {
                return value.toString();
            } else {
                return value;
            }
        }
        // TODO : conversions into date, datetime => use long type in internal datas
    }

    Service.prototype.setCalculatedFields = function(object) {
        // Calculate fields in order given by c4p.Model.calculateObjectFields (some ones depend upon some previous ones)
        var objDesc = c4p.Model.a4p_types[object.a4p_type];
        if (a4p.isDefined(objDesc.calculateObjectFields)) {
            var calculations = objDesc.calculateObjectFields;
            for (var i = 0, len = calculations.length; i < len; i++) {
                var calculation = calculations[i];
                var fieldName = calculation.key;
                var values = [];
                for (var j = 0, len2 = calculation.fields.length; j < len2; j++) {
                    values.push(object[calculation.fields[j]]);
                }
                if (calculation.force || a4p.isUndefined(object[fieldName]) || (object[fieldName] == '')) {
                    object[fieldName] = c4p.Model[calculation.getter].apply(c4p.Model, values);
                }
            }
        }

        // Update object
        this.setThumbNail(object);

        // Document patch
        if (object.a4p_type == 'Document') {
            //object.fileUrl = scope.urlClientBase + '/' + object.filePath;
            if (this.isDemo) {
                if ((typeof object.url != 'undefined') && (object.url.substr(0, 4) != "http") && (object.url.substr(0, 4) != "file")) {
                    // WE must add prefix for demo files stored in client pages
                    // we do not change pictures : (object.url.substr(0, 4) != "file")
                    // we do not change downloaded files : (object.url.substr(0, 4) != "http")
                    var location = document.location.href;//location.href;//location.href == requested, document.location == real
                    var idx = location.lastIndexOf('/');
                    var urlClientBase = location.substr(0, idx);
                    // In Android, urlClientBase == "file:///android_asset/www"
                    // In chrome, urlClientBase == "https://127.0.0.1/c4p_html_ang/www"
                    object.url = urlClientBase + '/' + object.url;
                    object.fileUrl = object.url;
                    // In demo mode, documents are already in client files => object.filePath forced to have url=object.fileUrl
                }
            }
            // Example for filePath == /a4p/c4p/doc/sf/Document-039.jpg :
            // In demo mode : thumb_url = https://127.0.0.1/c4p_html_ang/tests/unit/img/samples/docs/demo_test_img.jpg
            // In real mode : thumb_url = /a4p/c4p/doc/sf/Document-039.jpg : fileUrl will be forced to '' before download in addObjectToDownload()
            a4p.InternalLog.log('srvData', 'Document ' + object.filePath + ' has url=' + object.url + ' and fileUrl=' + object.fileUrl);

            if (c4p.Model.isImage(object.extension)) {
                object.thumb_url = object.fileUrl;
                a4p.InternalLog.log('srvData', 'Image ' + object.filePath + ' has thumb_url=' + object.thumb_url);
            }
        }

        // Event patch
        /*
        if (object.a4p_type == 'Event') {
            if (a4p.isUndefined(object.editionStatus)) {
                // TODO : copy previous editionStatus from old object ?
                object.editionStatus = {editable:false};
            }
        }
        */
    };

    function sendFirstObjectToSave(self) {
        var sentRequest = false;
        if (a4p.isDefined(self.savingObject.dbid)) {
            sentRequest = saveObject(self, self.savingObject.type, self.savingObject.dbid);
            if (sentRequest) return;
            // No more change in this object => save next object
            self.savingObject = {};
            self.srvLocalStorage.set('Data-savingObject', self.savingObject);
        }
        while ((sentRequest == false) && (self.objectsToSave.length > 0)) {
            var removedObject = self.objectsToSave.shift();
            self.srvLocalStorage.set('Data-objectsToSave', self.objectsToSave);
            sentRequest = saveObject(self, removedObject.type, removedObject.dbid);
        }
        if (sentRequest == false) {
            // No change => reset self.savingObject object
            self.savingObject = {};
            self.srvLocalStorage.set('Data-savingObject', self.savingObject);
        }
    }

    function sendNextObjectToSave(self) {
        self.savingObject = {};
        self.srvLocalStorage.set('Data-savingObject', self.savingObject);
        // Send object to save ONLY after ALL downloads are done (because new object can link on document not yet downloaded)
        if (self.objectsToDownload.length == 0) {
            sendFirstObjectToSave(self);
        }
    }

    function getFirstObjectToDownload(self) {
        if (self.objectsToDownload.length > 0) {
            var sentRequest = false;
            while ((sentRequest == false) && (self.objectsToDownload.length > 0)) {
                sentRequest = downloadObject(self, self.objectsToDownload[0].dbid);
            }
            return sentRequest;
        }
        return false;
    }

    function getNextObjectToDownload(self, dbid) {
        if ((self.objectsToDownload.length > 0) && (self.objectsToDownload[0].dbid == dbid)) {
            removeObjectToDownload(self, self.objectsToDownload[0].dbid);
            // Send object to save ONLY after ALL downloads are done (because new object can link on document not yet downloaded)
            if (!getFirstObjectToDownload(self)) {
                sendFirstObjectToSave(self);
            }
        }
    }

    function updateLinkedObjects(self, type, dbid, idKey, idValue) {
        // 1-N relations (taken from N-1 relations of other objects)
        for (var typeIdx=0; typeIdx<c4p.Model.allTypes.length; typeIdx++) {
            var fromOtherType = c4p.Model.allTypes[typeIdx];
            var objDesc = c4p.Model.a4p_types[fromOtherType];
            for (var fromFieldIdx=0; fromFieldIdx<objDesc.linkFields.length; fromFieldIdx++) {
                var linkModel = objDesc.linkFields[fromFieldIdx];
                var fromField = linkModel.key;
                var isArrayField = a4p.isDefined(c4p.Model.objectArrays[fromOtherType][fromField]);
                for (var toTypeIdx=0; toTypeIdx<linkModel.types.length; toTypeIdx++) {
                    var toType = linkModel.types[toTypeIdx];
                    if (toType == type) {
                        for (var objectIdx=0; objectIdx < self.currentItems[fromOtherType].length; objectIdx++) {
                            var linkField = self.currentItems[fromOtherType][objectIdx][fromField];
                            if (isArrayField) {
                                for (var valueIdx = 0, valueNb = linkField.length; valueIdx < valueNb; valueIdx++) {
                                    if (linkField[valueIdx].dbid == dbid) {
                                        linkField[valueIdx][idKey] = idValue;
                                    }
                                }
                            } else {
                                if (linkField.dbid == dbid) {
                                    linkField[idKey] = idValue;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Copy ID and CRM fields only (not other internal fields)
     *
     * @param object
     * @return {*}
     */
    function copyObject(object) {
        if (a4p.isDefined(object)) {
            // Set all object ids
            var i, len, fieldname, copyObject = {a4p_type:object.a4p_type};
            copyObject.id = {};
            for (var k in object.id) {
                if (!object.id.hasOwnProperty(k)) continue;
                copyObject.id[k] = object.id[k];
            }
            var objDesc = c4p.Model.a4p_types[object.a4p_type];
            for (i = 0, len = objDesc.fields.length; i < len; i++) {
                fieldname = objDesc.fields[i];
                var isArrayField = a4p.isDefined(c4p.Model.objectArrays[object.a4p_type][fieldname]);
                if (isArrayField) {
                    copyObject[fieldname] = [];
                    for (var valueIdx = 0, valueNb = object[fieldname].length; valueIdx < valueNb; valueIdx++) {
                        copyObject[fieldname].push(copyField(object.a4p_type, fieldname, object[fieldname][valueIdx]));
                    }
                } else {
                    copyObject[fieldname] = copyField(object.a4p_type, fieldname, object[fieldname]);
                }
            }
            // Add some other fields which are not registered in c4p.Model.a4p_types[].fields
            //copyObject.thumb_url = object.thumb_url;
            return copyObject;
        }
        return undefined;
    }

    function copyField(a4p_type, fieldname, fromField) {
        if (a4p.isDefined(c4p.Model.a4p_types[a4p_type].linkDescs[fieldname]) || (fromField instanceof Object)) {
            var copyField = {};
            for (var k in fromField) {
                if (!fromField.hasOwnProperty(k)) continue;
                copyField[k] = fromField[k];
            }
            return copyField;
        } else {
            return fromField;
        }
    }

    function createdObject(self, itemId, askedCreated, created) {
        // askedCreated and created are not here if it is an uploadFile without uploadFileInCrm parameter
        var object = self.index.db[itemId];
        if (a4p.isDefinedAndNotNull(created)) {
            for (var i = 0, nb = created.length; i < nb; i++) {
                var crm = created[i].crm;
                var id = created[i].id;
                object.id[crm + '_id'] = id;
                if (created[i].tmpId) {
                    delete self.index[crm][created[i].tmpId];
                }
                self.index[crm][id] = object;
                self.savingObject.fields.id[crm + '_id'] = id;
                updateLinkedObjects(self, object.a4p_type, itemId, crm + '_id', id);
            }
        }
        /* ccn_future
        var created = responseData['created'];
        var item = self.index.db[createdId];
        if (a4p.isDefined(item)) {
            for (var i = 0, nb = created.length; i < nb; i++) {
                var newId = created[i];
                var mergeIdx, object;
                for (mergeIdx = item.crmObjects.length - 1; mergeIdx >= 0; mergeIdx--) {
                    object = item.crmObjects[mergeIdx];
                    if ((object.crmId.crm == newId.crm) && (object.crmId.id == newId.tmpId)) {
                        // Indexe new ID and remove old ID
                        object.crmId.id = newId.id;
                        self.index[newId.crm][newId.id] = item;
                        delete self.index[newId.crm][newId.tmpId];
                        break;
                    }
                }
                for (mergeIdx = self.savingObject.crmObjects.length - 1; mergeIdx >= 0; mergeIdx--) {
                    object = self.savingObject.crmObjects[mergeIdx];
                    if ((object.crmId.crm == newId.crm) && (object.crmId.id == newId.tmpId)) {
                        object.crmId.id = newId.id;
                        break;
                    }
                }
            }
            // Update creating synchro status
            item.c4p_synchro.creating = c4p.Synchro.NONE;
            self.srvLocalStorage.set('Data-'+item.a4p_type, self.currentItems[item.a4p_type]);
        } else {
            // Object has been deleted during the request
        }
        */
        //if (askedCreated.length >= created.length) {
            // We save in original only fields valued at the request moment, not those modified afterward
            // DO NOT download file body because WE have created it by ourselves
            addOriginalObject(self, self.savingObject.fields, false);
        //}
        self.srvLocalStorage.set('Data-'+object.a4p_type, self.currentItems[object.a4p_type]);
        // Redo save of object to update or delete it if needed
        self.addObjectToSave(object.a4p_type, itemId);
    }

    function updatedObject(self, itemId, askedUpdated, updated) {
        var object = self.index.db[itemId];
        for (var i = 0, nb = updated.length; i < nb; i++) {
            var crm = updated[i].crm;
            var id = updated[i].id;
        }
        //if (askedUpdated.length >= updated.length) {
            // We save in original only fields valued at the request moment, not those modified afterward
            // DO NOT download file body because WE have updated it by ourselves
            setOriginalObject(self, self.savingObject.fields, false);
        //}
        self.srvLocalStorage.set('Data-'+object.a4p_type, self.currentItems[object.a4p_type]);
        // Redo save of object to update or delete it if needed
        self.addObjectToSave(object.a4p_type, object.id.dbid);
    }

    function deletedObject(self, itemId, askedDeleted, deleted, isOriginal) {
        var object = self.index.db[itemId];
        for (var i = 0, nb = deleted.length; i < nb; i++) {
            var crm = deleted[i].crm;
            var id = deleted[i].id;
            delete self.index[crm][id];
        }
        if (askedDeleted.length >= deleted.length) {
            var deletedItems = removeObjectFromList(self.currentItems[object.a4p_type], itemId);
            delete self.index.db[itemId];
            self.nbObjects--;
        }
        /* ccn_future
        for (var i = 0, nb = deleted.length; i < nb; i++) {
            var crm = deleted[i].crm;
            var id = deleted[i].id;
            for (var oldMergeIdx = oldItem.crmObjects.length - 1; oldMergeIdx >= 0; oldMergeIdx--) {
                var oldObject = oldItem.crmObjects[oldMergeIdx];
                if ((oldObject.crmId.crm == crm) && (oldObject.crmId.id == id)) {
                    // Accept deletion only for original Object (fullMap/refreshMap) or owned by user
                    if (!oldObject.editable) break;
                    // BEWARE :
                    // self.index[object.crmId.crm][object.crmId.id] can disappear upon splitting (reversing a merging)
                    // when adding new before updating old => we have moved the index on the new object
                    if (self.index[oldObject.crmId.crm][oldObject.crmId.id]) {
                        if (self.index[oldObject.crmId.crm][oldObject.crmId.id].id == oldItem.id) {
                            delete self.index[oldObject.crmId.crm][oldObject.crmId.id];
                        }
                    }
                    oldItem.crmObjects.splice(oldMergeIdx, 1);
                    break;
                }
            }
        }
        if (oldItem.crmObjects.length == 0) {
            removeIdFromList(self.currentItems[oldItem.a4p_type], oldItem.id);
            delete self.index.db[oldItem.id];
            self.nbObjects--;
            self.srvLocalStorage.set('Data-'+oldItem.a4p_type, self.currentItems[oldItem.a4p_type]);
            removeOriginalObject(self, itemId);
            triggerUpdate(self, 'remove', oldItem.a4p_type, oldItem.id);
        } else {
            self.srvLocalStorage.set('Data-'+oldItem.a4p_type, self.currentItems[oldItem.a4p_type]);
            triggerUpdate(self, 'set', oldItem.a4p_type, oldItem.id);
        }
        */
        self.srvLocalStorage.set('Data-'+object.a4p_type, self.currentItems[object.a4p_type]);
        removeOriginalObject(self, itemId);
        triggerUpdate(self, 'remove', object.a4p_type, object.id.dbid);
        unlinkLinkedObjects(self, itemId, isOriginal);
/*
        if (a4p.isDefined(c4p.Model.files[object.a4p_type])) {
            var oldObject = deletedItems[0];
            var onRemoveSuccess = function() {
                var msg = 'File ' + oldObject.filePath + ' successfully removed from file storage';
                self.srvLog.logSuccess(self.srvConfig.c4pConfig.exposeFileStorage,
                    self.srvLocale.translations.htmlMsgRemoveFileOK, msg);
            };
            var onRemoveFailure = function(message) {
                var msg = 'Removing file ' + oldObject.filePath + ' from file storage failure : ' + message;
                self.srvLog.logInfo(self.srvConfig.c4pConfig.exposeFileStorage,
                    self.srvLocale.translations.htmlMsgRemoveFilePb, msg);
            };
            self.srvFileStorage.deleteFile(oldObject.filePath,
                onRemoveSuccess,
                onRemoveFailure);
            // Until the end of this future, file will be accessible (still at old place)
        }
*/
    }

    function addOriginalObject(self, object, downloadFile) {
        var copy = copyObject(object);
        if (a4p.isDefined(copy)) {
            self.originalDbIndex[object.id.dbid] = copy;
            self.originalItems[copy.a4p_type].push(copy);
            self.srvLocalStorage.set('Data-Original'+copy.a4p_type, self.originalItems[copy.a4p_type]);
        }
        // Launch download of object if file type
        if (a4p.isDefined(c4p.Model.files[object.a4p_type])
            && (a4p.isDefined(object.id.sf_id) || a4p.isDefined(object.id.c4p_id))
            && downloadFile) {
            addObjectToDownload(self, object.a4p_type, object.id.dbid);
        }
    }

    /**
     * Internal update of original data without triggering downloads or uploads
     *
     * @param self
     * @param object
     * @param fields
     */
    function updateOriginalObject(self, object, fields) {
        var original = self.originalDbIndex[object.id.dbid];
        if (a4p.isDefined(original)) {
            var objDesc = c4p.Model.a4p_types[object.a4p_type];
            for (var i = 0, len = objDesc.fields.length; i < len; i++) {
                var fieldname = objDesc.fields[i];
                if (a4p.isDefined(fields[fieldname])) {
                    var isArrayField = a4p.isDefined(c4p.Model.objectArrays[object.a4p_type][fieldname]);
                    if (isArrayField) {
                        original[fieldname] = [];
                        for (var valueIdx = 0, valueNb = fields[fieldname].length; valueIdx < valueNb; valueIdx++) {
                            original[fieldname].push(copyField(object.a4p_type, fieldname, fields[fieldname][valueIdx]));
                        }
                    } else {
                        original[fieldname] = copyField(object.a4p_type, fieldname, fields[fieldname]);
                    }
                }
            }
            self.srvLocalStorage.set('Data-Original'+object.a4p_type, self.originalItems[object.a4p_type]);
        }
    }

    function setOriginalObject(self, object, downloadFile) {
        var copy = copyObject(object);
        if (a4p.isDefined(copy)) {
            self.originalDbIndex[object.id.dbid] = copy;
            if (replaceObjectFromList(self.originalItems[copy.a4p_type], object.id.dbid, copy) !== false) {
                self.srvLocalStorage.set('Data-Original'+copy.a4p_type, self.originalItems[copy.a4p_type]);
            }
        }
        // Launch download of object if file type
        if (a4p.isDefined(c4p.Model.files[object.a4p_type])
            && (a4p.isDefined(object.id.sf_id) || a4p.isDefined(object.id.c4p_id))
            && downloadFile) {
            addObjectToDownload(self, object.a4p_type, object.id.dbid);
        }
    }

    function removeOriginalObject(self, dbid) {
        var object = self.originalDbIndex[dbid];
        if (a4p.isDefined(object)) {
            delete self.originalDbIndex[dbid];
            if (removeObjectFromList(self.originalItems[object.a4p_type], dbid) !== false) {
                self.srvLocalStorage.set('Data-Original'+object.a4p_type, self.originalItems[object.a4p_type]);
            }
        }
    }

    function addObjectToDownload(self, type, dbid) {
        var delayedDownload = true;
        if (self.objectsToDownload.length == 0) {
            // we do not need to wait any object to save to finish its current request
            delayedDownload = false;
        }
        if (getLinkFromList(self.objectsToDownload, dbid) !== false) return false;

        // Update reading synchro status
        var object = self.getObject(dbid);
        // Patch Document
        if (object.a4p_type == 'Document') {
            // Before downloading it, we reset fileUrl to force ctrlNavigation a direct link upon our C4P server
            object.fileUrl = '';
            a4p.InternalLog.log('srvData', "Document " + object.filePath + " has before download an empty fileUrl");
            if (c4p.Model.isImage(object.extension)) {
                object.thumb_url = object.fileUrl;
                a4p.InternalLog.log('srvData', "Image " + object.filePath + " has before download an empty thumb_url");
            }
        }
        // TODO : treat any previous downloading not yet finished
        object.c4p_synchro.reading = c4p.Synchro.QUEUE;
        self.srvLocalStorage.set('Data-'+object.a4p_type, self.currentItems[object.a4p_type]);

        self.objectsToDownload.push({'type':type, 'dbid':dbid});
        self.srvLocalStorage.set('Data-objectsToDownload', self.objectsToDownload);
        if (!delayedDownload) {
            if (!getFirstObjectToDownload(self)) {
                sendFirstObjectToSave(self);
            }
        }
        return true;
    }

    function removeObjectToDownload(self, dbid) {
        if (removeLinkFromList(self.objectsToDownload, dbid) !== false) {
            self.srvLocalStorage.set('Data-objectsToDownload', self.objectsToDownload);
            return true;
        }
        return false;
    }

    function downloadObject(self, dbid) {
        var object = self.getObject(dbid);
        if (a4p.isDefined(object)) {
            var loadFields = c4p.Model.files[object.a4p_type];
            if (a4p.isDefined(object.id.sf_id)) {
                self.srvSynchro.addFileRequest('data',
                    {type:'Download', title:'Download ' + object.a4p_type + ' ' + self.srvConfig.getItemName(object), dbid:object.id.dbid},
                    self.srvConfig.c4pUrlDownload
                        +'?type='+encodeURIComponent(object.a4p_type)
                        +'&dbid='+encodeURIComponent(dbid)
                        +'&sf_id='+encodeURIComponent(object.id.sf_id)
                        +'&mimetype='+encodeURIComponent(object.mimetype),
                    //    +'&c4pToken='+encodeURIComponent(self.srvSecurity.getHttpRequestToken()), // set by srvSynchro
                    'GET',
                    null,
                    object[loadFields.filePath],
                    null,
                    null
                );
                return true;
            } else if (a4p.isDefined(object.id.c4p_id)) {
                self.srvSynchro.addFileRequest('data',
                    {type:'Download', title:'Download ' + object.a4p_type + ' ' + self.srvConfig.getItemName(object), dbid:object.id.dbid},
                    self.srvConfig.c4pUrlDownload
                        +'?type='+encodeURIComponent(object.a4p_type)
                        +'&dbid='+encodeURIComponent(dbid)
                        +'&c4p_id='+encodeURIComponent(object.id.c4p_id)
                        +'&mimetype='+encodeURIComponent(object.mimetype),
                    //    +'&c4pToken='+encodeURIComponent(self.srvSecurity.getHttpRequestToken()), // set by srvSynchro
                    'GET',
                    null,
                    object[loadFields.filePath],
                    null,
                    null
                );
                return true;
            } else {
                removeObjectToDownload(self, dbid);
                return false;
            }
        } else {
            removeObjectToDownload(self, dbid);
            return false;
        }
    }

    return Service;
})();
