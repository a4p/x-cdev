'use strict';

var SrvNav = (function() {

    var acceptedLinkNamesMap = {
        'manager':true,
        'managed':true,
        'parent':true,
        'child':true,
        'accounter':true,
        'accounted':true,
        'faceter':true,
        'faceted':true,
        'affecter':true,
        'affected':true,
        'mail_to':true,
        'mailed_from':true,
        'join_to':true,
        'joined_from':true,
        'attended':true,
        'attendee':true,
        'attached':true,
        'attachee':true,
        'leader':true,
        'led':true,

        'owner':false,
        'owned':false,
        'creator':false,
        'created':false,
        'modifier':false,
        'modified':false
    };

    function Service(exceptionHandlerService, srvData, srvLocale, srvConfig) {
        this.exceptionHandler = exceptionHandlerService;

        this.srvData = srvData;
        this.srvLocale = srvLocale;
        this.srvConfig = srvConfig;
    	this.item = null;
        this.current = null;
        this.history = [];
        this.holdItem = null;
        this.attacheeDocuments = [];
        this.attendeeContacts = [];
        this.attendees = [];
        this.childDocuments = [];
        this.childNotes = [];
        this.childReports = [];
        this.imageRelatedList = [];
        this.itemRelatedList = {};// For each object type gives a list of {item:toObject, linkNames:[linkName]}
        this.itemRelatedGroupList = [];
        this.itemRelatedGroupMap = {};
        this.itemRelatedGroup = null;

        this.callbackHandle = 0;
        this.callbacksUpdate = [];

        var self = this;
        this.srvData.addListenerOnUpdate(function (callbackId, action, type, id) {
            if ((action == 'clear') || (action == 'init')) {
                self.clearHistory();
            } else if ((action == 'add') || (action == 'set')) {
                var object = srvData.getObject(id);
                if (self.item) {
                    if (self.item.id.dbid == id) {
                        self.item = object;
                        self.current = {
                            page:self.current.page,
                            slide:self.current.slide,
                            itemName:srvConfig.getItemName(self.item),
                            itemIcon:c4p.Model.getItemIcon(self.item),
                            type:self.item.a4p_type,
                            id:self.item.id.dbid,
                            pageHistory:self.current.pageHistory
                        };
                    }
                    if (self.updateLinks()) {
                        triggerUpdate(self, 'update');
                    }
                }
            } else if (action == 'remove') {
                self.removeFromHistory('', '', id);
                if ((self.current != null) && (self.current.id == id)) {
                    self.current = null;
                    self.item = null;
                    self.attacheeDocuments = [];
                    self.attendeeContacts = [];
                    self.attendees = [];
                    self.childDocuments = [];
                    self.childNotes = [];
                    self.childReports = [];
                    self.imageRelatedList = [];
                    self.itemRelatedList = {};
                    self.itemRelatedGroupList = [];
                    self.itemRelatedGroupMap = {};
                    self.itemRelatedGroup = null;
                    if (self.history.length > 0) {
                        // Remove at index 0
                        var back = self.history.shift();
                        if (back != null) {
                            if (back.id) {
                                self.goto(back.page, back.slide, self.srvData.getObject(back.id));
                            } else {
                                self.goto(back.page, back.slide);
                            }
                        }
                    }
                }
                if (self.updateLinks()) {
                    triggerUpdate(self, 'update');
                }
            }
        });
    }

    /**
     * Do not put current page in history (forgot it)
     * and shift back in history for 1+index positions (removing all intermediate pages from history)
     *
     * @param index Number from 0. If undefined, then we keep same object but go back in pages about this item (Detail/Meeting/Timeline)
     * @returns {*}
     */
    Service.prototype.backInHistory = function(index) {
        if (a4p.isUndefined(index) && (this.current != null) && (this.current.pageHistory.length > 0)) {
            var backPage = this.current.pageHistory[0];
            this.current.pageHistory.splice(0, 1);// Remove at index 0
            this.goto(backPage.page, backPage.slide, this.srvData.getObject(this.current.id));
            return this.current;
        }
        if (this.history.length > index) {
            this.item = null;
            this.current = null;
            this.attacheeDocuments = [];
            this.attendeeContacts = [];
            this.attendees = [];
            this.childDocuments = [];
            this.childNotes = [];
            this.childReports = [];
            this.imageRelatedList = [];
            this.itemRelatedList = {};
            this.itemRelatedGroupList = [];
            this.itemRelatedGroupMap = {};
            this.itemRelatedGroup = null;
            this.holdStopItem();
    		var back = this.history[index];
            this.history.splice(0, 1+index);// Remove at indexes 0, 1, ..., index
            if (back.id) {
                this.goto(back.page, back.slide, this.srvData.getObject(back.id));
            } else {
                this.goto(back.page, back.slide);
            }
            return back;
    	} else if (this.current != null) {
            this.history = [];
            this.item = null;
            this.current = null;
            this.attacheeDocuments = [];
            this.attendeeContacts = [];
            this.attendees = [];
            this.childDocuments = [];
            this.childNotes = [];
            this.childReports = [];
            this.imageRelatedList = [];
            this.itemRelatedList = {};
            this.itemRelatedGroupList = [];
            this.itemRelatedGroupMap = {};
            this.itemRelatedGroup = null;
            this.holdStopItem();
            triggerUpdate(this, 'clear');
            return null;
    	} else {
            return null;
        }
    };

    /**
     * Put current page in history (save it)
     * and goto back in history for 1+index positions (keeping all intermediate pages in history)
     *
     * @param index
     * @returns {*}
     */
    Service.prototype.gotoInHistory = function(index) {
        if (a4p.isUndefined(index)) index = 0;
    	if (this.history.length > index) {
            this.holdStopItem();
    		var back = this.history[index];
            if (back.id) {
                this.goto(back.page, back.slide, this.srvData.getObject(back.id));
            } else {
                this.goto(back.page, back.slide);
            }
            return back;
    	} else {
            return null;
        }
    };

    Service.prototype.lastInHistoryWithType = function(type) {
        // We search back in history for object with given type
        if (this.current != null) {
            if (this.current.type == type) {
                return this.current;
           	}
        }
        for (var i = 0; i < this.history.length; i++){
       		var back = this.history[i];
           	if (back.type == type) {
                return back;
           	}
        }
        return null;
    };

    Service.prototype.goto = function(page, slide, item) {
        // this.item = this.srvData.getObject(id);

        // Save old current (move it in history)
        if (this.current != null) {
            if (item) {
                if (this.current.id != item.id.dbid) {
                    // BEWARE : you most COPY this.current (because this.current can be set to null later)
                    var current = {
                        page: this.current.page,
                        slide: this.current.slide,
                        itemName: this.current.itemName,
                        itemIcon: this.current.itemIcon,
                        type: this.current.type,
                        id: this.current.id,
                        pageHistory:this.current.pageHistory
                    };
                    this.removeFromHistory(current.page, current.slide, current.id);// Remove it if already exists in history because it will be pushed at index 0
                    this.history.unshift(current);// Insert at index 0
                } else if ((this.current.page != page) || (this.current.slide != slide)) {
                    for (var i = this.current.pageHistory.length - 1; i >= 0; i--){
                   		var backPage = this.current.pageHistory[i];
                        if ((backPage.page == this.current.page) && (backPage.slide == this.current.slide)) {
                            this.current.pageHistory.splice(i, 1);// Remove at index i
                       	}
                    }
                    this.current.pageHistory.unshift({page:this.current.page, slide:this.current.slide});// Insert at index 0
                } else {
                    // NO change
                    return;
                }
            } else {
                if (a4p.isDefined(this.current.id) || (this.current.page != page) || (this.current.slide != slide)) {
                    // BEWARE : you most COPY this.current (because this.current can be set to null later)
                    var current = {
                        page: this.current.page,
                        slide: this.current.slide,
                        itemName: this.current.itemName,
                        itemIcon: this.current.itemIcon,
                        type: this.current.type,
                        id: this.current.id,
                        pageHistory:this.current.pageHistory
                    };
                    this.removeFromHistory(current.page, current.slide, current.id);// Remove it if already exists in history because it will be pushed at index 0
                    this.history.unshift(current);// Insert at index 0
                } else {
                    // NO change
                    return;
                }
            }
        }

        // Set new current (to be saved later in history)
        // Do not yet remove this from history in case we go back
        this.item = item || null;
        if (this.item) {
            if (this.current && (this.current.id == item.id.dbid)) {
                if ((this.current.page != page) || (this.current.slide != slide)) {
                    for (var i = this.current.pageHistory.length - 1; i >= 0; i--) {
                        var backPage = this.current.pageHistory[i];
                        if ((backPage.page == page) && (backPage.slide == slide)) {
                            this.current.pageHistory.splice(i, 1);// Remove at index i
                        }
                    }
                    this.current.page = page;
                    this.current.slide = slide;
                }
                this.current.itemName = this.srvConfig.getItemName(this.item);
                this.current.itemIcon = c4p.Model.getItemIcon(this.item);
                this.current.type = this.item.a4p_type;
            } else {
                this.current = {
                    page:page,
                    slide:slide,
                    itemName:this.srvConfig.getItemName(this.item),
                    itemIcon:c4p.Model.getItemIcon(this.item),
                    type:this.item.a4p_type,
                    id:this.item.id.dbid,
                    pageHistory:[]
                };
            }
            this.updateLinks();
        } else {
            this.current = {
                page:page,
                slide:slide,
                itemName:'',
                itemIcon:'',
                type:'',
                id:'',
                pageHistory:[]
            };
            this.attacheeDocuments = [];
            this.attendeeContacts = [];
            this.attendees = [];
            this.childDocuments = [];
            this.childNotes = [];
            this.childReports = [];
            this.imageRelatedList = [];
            this.itemRelatedList = {};
            this.itemRelatedGroupList = [];
            this.itemRelatedGroupMap = {};
            this.itemRelatedGroup = null;
        }
        this.holdStopItem();
        this.removeFromHistory(this.current.page, this.current.slide, this.current.id);// Remove it if already exists in history because it is in current
        triggerUpdate(this, 'goto', page, slide, this.current.id);
    };

    Service.prototype.clearHistory = function() {
        if ((this.item != null) || (this.history.length > 0)) {
            this.item = null;
            this.current = null;
            this.history = [];
            this.attacheeDocuments = [];
            this.attendeeContacts = [];
            this.attendees = [];
            this.childDocuments = [];
            this.childNotes = [];
            this.childReports = [];
            this.imageRelatedList = [];
            this.itemRelatedList = {};
            this.itemRelatedGroupList = [];
            this.itemRelatedGroupMap = {};
            this.itemRelatedGroup = null;
            this.holdStopItem();
            triggerUpdate(this, 'clear');
        }
    };

    Service.prototype.removeFromHistory = function(page, slide, id) {
        if (a4p.isDefined(id) && (id != '')) {
            for (var i = this.history.length - 1; i >= 0; i--){
           		var back = this.history[i];
               	if (back.id == id) {
                    this.history.splice(i, 1);// Remove at index i
               	}
            }
        } else {
            for (var i = this.history.length - 1; i >= 0; i--){
           		var back = this.history[i];
               	if ((a4p.isUndefined(back.id) || (back.id == '')) && (back.page == page) && (back.slide == slide)) {
                    this.history.splice(i, 1);// Remove at index i
               	}
            }
        }
    };

    Service.prototype.holdStartItem = function(holdItem) {
        this.holdItem = holdItem;
        triggerUpdate(this, 'holdStart');
    };

    Service.prototype.holdStopItem = function() {
        if (this.holdItem) {
            this.holdItem = null;
            triggerUpdate(this, 'holdStop');
        }
    };

    /**
     * Add a callback function which will be called each time srvNav change its current/item.
     * Callback function will be called with 2 or 5 arguments : handle, action, page, slide, id.
     * the first argument 'handle' is the listen handle of this callback (needed to cancel listener).
     * the second argument 'action' can be 'clear' or 'goto'
     * the third argument 'page' is defined only for action 'goto' and gives the page
     * the fourth argument 'slide' is defined only for action 'goto' and gives the slide
     * the fifth argument 'id' is defined only for action 'goto' and gives the object id.dbid
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

    Service.prototype.updateLinks = function () {
        var change = false;
        if (!this.item) {
            if (this.attacheeDocuments.length || this.attendeeContacts.length
                || this.attendees.length || this.childDocuments.length
                || this.childNotes.length || this.childReports.length
                || this.itemRelatedGroupList.length || (this.itemRelatedGroup != null)) change = true;
            this.attacheeDocuments = [];
            this.attendeeContacts = [];
            this.attendees = [];
            this.childDocuments = [];
            this.childNotes = [];
            this.childReports = [];
            this.imageRelatedList = [];
            this.itemRelatedList = {};
            this.itemRelatedGroupList = [];
            this.itemRelatedGroupMap = {};
            this.itemRelatedGroup = null;
            return change;
        }

        var attacheeDocuments = this.srvData.getTypedRemoteLinks(this.item, 'attachee', 'Document');
        var attendeeContacts = this.srvData.getTypedRemoteLinks(this.item, 'attendee', 'Contact');
        var attendees = this.srvData.getTypedDirectLinks(this.item, 'attendee', 'Attendee');
        var childDocuments = this.srvData.getTypedDirectLinks(this.item, 'child', 'Document');
        var childNotes = this.srvData.getTypedDirectLinks(this.item, 'child', 'Note');
        var childReports = this.srvData.getTypedDirectLinks(this.item, 'child', 'Report');

        //this.itemRelatedList = this.srvData.getLinkedObjects(this.item);
        //$scope.itemRelatedList = c4pItemHasOnlyOneLinkWithTypeFilter($scope.itemRelatedList,
        //    ['owner','owned','leader','led','creator','created','modifier','modified']);
        // => Keep following relations : 'manager','managed', 'parent','child', 'accounter','accounted',
        // 'faceter','faceted',  'mail_to','mailed_from', 'join_to','joined_from', 'slave','master'

        var imageRelatedList = [];
        var itemRelatedList = {};
        var itemRelatedGroupList = [];
        var itemRelatedGroupMap = {};
        var itemRelatedGroup = this.itemRelatedGroup;
        // Use c4p.Model.allTypes if you want to see Attendees and Attachees
        for (var relatedIdx=0; relatedIdx<c4p.Model.objectTypes.length; relatedIdx++) {
            var relatedType = c4p.Model.objectTypes[relatedIdx];
            // TODO : getRemoteObjects should modify preexistant list and return true/false
            itemRelatedList[relatedType] = this.srvData.getRemoteObjects(this.item, relatedType, acceptedLinkNamesMap);
            var oldGroup = this.itemRelatedGroupMap[relatedType];
            var group = {
                type: relatedType,
                colorType: c4p.Model.a4p_types[relatedType].colorType,
                name: this.srvLocale.translations.htmlTitle[relatedType],
                icon: c4p.Model.getTypeIcon(relatedType),
                size: itemRelatedList[relatedType].length,
                show: false
            };
            // Use attributes from old group
            if(a4p.isDefinedAndNotNull(oldGroup)) {
                group.show = oldGroup.show;
            }

            if (a4p.isUndefinedOrNull(oldGroup)
                || (oldGroup.colorType != group.colorType)
                || (oldGroup.name != group.name)
                || (oldGroup.icon != group.icon)
                || (oldGroup.size != group.size)) {
                change = true;
            // Update currently opened group
                if (itemRelatedGroup && (itemRelatedGroup.type == relatedType)) {
                    if (group.size == 0) {
                            itemRelatedGroup = null;
                    } else {
                            itemRelatedGroup = group;
                    }
                }
                if (group.size) {
                    itemRelatedGroupMap[relatedType] = group;
                    itemRelatedGroupList.push(group);
                }
            } else {
                // we keep oldGroup
                if (oldGroup.size) {
                    itemRelatedGroupMap[relatedType] = oldGroup;
                    itemRelatedGroupList.push(oldGroup);
                }
            }
        }

        for(var imgIdx = 0, nbDoc = itemRelatedList['Document'].length; imgIdx < nbDoc; imgIdx++) {
            if(c4p.Model.isImage(itemRelatedList['Document'][imgIdx].item.extension)) {
                imageRelatedList.push(itemRelatedList['Document'][imgIdx].item);
            }
        }

        // To go faster, we only compare array sizes
        if (!change && (attacheeDocuments.length != this.attacheeDocuments.length)) change = true;
        if (!change && (attendeeContacts.length != this.attendeeContacts.length)) change = true;
        if (!change && (attendees.length != this.attendees.length)) change = true;
        if (!change && (childDocuments.length != this.childDocuments.length)) change = true;
        if (!change && (childNotes.length != this.childNotes.length)) change = true;
        if (!change && (childReports.length != this.childReports.length)) change = true;
        if (!change && (itemRelatedGroupList.length != this.itemRelatedGroupList.length)) change = true;

        this.attacheeDocuments = attacheeDocuments;
        this.attendeeContacts = attendeeContacts;
        this.attendees = attendees;
        this.childDocuments = childDocuments;
        this.childNotes = childNotes;
        this.childReports = childReports;

        this.imageRelatedList = imageRelatedList;
        this.itemRelatedList = itemRelatedList;
        this.itemRelatedGroupList = itemRelatedGroupList;
        this.itemRelatedGroupMap = itemRelatedGroupMap;
        this.itemRelatedGroup = itemRelatedGroup;

        return change;
    };

    function triggerUpdate(self, action, page, slide, id) {
        var callbacks = self.callbacksUpdate.slice(0);// Copy to be independant of updates
        for (var idx = 0, max = callbacks.length; idx < max; idx++) {
            try {
                callbacks[idx].callback(callbacks[idx].id, action, page, slide, id);
            } catch (e) {
                self.exceptionHandler(e, "srvNav.callbacksUpdate#" + idx);
            }
        }
    }

    return Service;
})();
