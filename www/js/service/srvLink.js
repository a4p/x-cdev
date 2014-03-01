'use strict';

var SrvLink = (function() {

    function Service(srvData, srvNav, srvLocale) {
        this.srvData = srvData;
        this.srvNav = srvNav;
        this.srvLocale = srvLocale;
    }

    /**
     *
     * @param fromType
     * @param fromLink Name of link (one or many) on from side (its not the attribute name of object, but it is associated with it)
     * @param fromObject
     * @param toObject
     * @returns {*}
     */
    Service.prototype.hasNamedLinkTo = function (fromType, fromLink, fromObject, toObject) {
        // Special cases not referenced into c4p.Model.a4p_types[fromType].linkDescs
        if (fromObject.a4p_type != fromType) return false;
        if ((fromType == 'Event') && (fromLink == 'attended')) {//TODO: invalid directions
            return !!this.srvData.getAttachment('Attendee', toObject, fromObject);
        } else if ((fromType == 'Event') && (fromLink == 'attendee')) {
            return !!this.srvData.getAttachment('Attendee', toObject, fromObject);
        } else if ((fromType == 'Event') && (fromLink == 'attachee')) {
            return !!this.srvData.getAttachment('Attachee', toObject, fromObject);
        } else if ((fromType == 'Contact') && (fromLink == 'attendee')) {//TODO: invalid directions
            return !!this.srvData.getAttachment('Attendee', fromObject, toObject);
        } else if ((fromType == 'Contact') && (fromLink == 'attended')) {
            return !!this.srvData.getAttachment('Attendee', fromObject, toObject);
        } else if ((fromType == 'Document') && (fromLink == 'attached')) {
            return !!this.srvData.getAttachment('Attachee', fromObject, toObject);
        } else {
            return !!this.srvData.hasDirectNamedLinkTo(fromType, fromLink, fromObject, toObject);
        }
    };

    /**
     *
     * @param fromLink Name of link (one or many) on from side (its not the attribute name of object, but it is associated with it)
     * @param fromObject
     * @param toType
     * @param toObjects
     */
    Service.prototype.linkItemToObjects = function (fromLink, fromObject, toType, toObjects) {
        if (toObjects.length <= 0) return;
        // Special cases not referenced into c4p.Model.a4p_types[fromObject.a4p_type].linkDescs
        if ((toType == 'Contact') && (fromLink == 'attended')) {//TODO: invalid directions
            for (var i = 0, nb = toObjects.length; i < nb; i++) {
                this.srvData.newAndSaveAttachment('Attendee', toObjects[i], fromObject);
            }
        } else if ((toType == 'Contact') && (fromLink == 'attendee')) {
            for (var i = 0, nb = toObjects.length; i < nb; i++) {
                this.srvData.newAndSaveAttachment('Attendee', toObjects[i], fromObject);
            }
        } else if ((toType == 'Event') && (fromLink == 'attendee')) {//TODO: invalid directions
            for (var i = 0, nb = toObjects.length; i < nb; i++) {
                this.srvData.newAndSaveAttachment('Attendee', fromObject, toObjects[i]);
            }
        } else if ((toType == 'Event') && (fromLink == 'attended')) {
            for (var i = 0, nb = toObjects.length; i < nb; i++) {
                this.srvData.newAndSaveAttachment('Attendee', fromObject, toObjects[i]);
            }
        } else if ((toType == 'Document') && (fromLink == 'attachee')) {
            for (var i = 0, nb = toObjects.length; i < nb; i++) {
                this.srvData.newAndSaveAttachment('Attachee', toObjects[i], fromObject);
            }
        } else if ((toType == 'Event') && (fromLink == 'attached')) {
            for (var i = 0, nb = toObjects.length; i < nb; i++) {
                this.srvData.newAndSaveAttachment('Attachee', fromObject, toObjects[i]);
            }
        } else if ((toType == 'Document') && (fromLink == 'child')) {
            // Copy Document
            this.srvData.linkAllDocumentsToItem(toObjects, fromObject);
        } else if ((fromObject.a4p_type == 'Document') && (fromLink == 'parent')) {
            // Copy Document
            this.srvData.linkDocumentToAllObjects(fromObject, toObjects);
        } else {
            this.srvData.linkToObjects(fromLink, fromObject, toType, toObjects);
        }
    };

    /**
     *
     * @param fromType
     * @param fromLink Name of link (one or many) on from side (its not the attribute name of object, but it is associated with it)
     * @param fromObjects
     * @param toObject
     */
    Service.prototype.linkObjectsToItem = function (fromType, fromLink, fromObjects, toObject) {
        if (fromObjects.length <= 0) return;
        // Special cases not referenced into c4p.Model.a4p_types[fromType].linkDescs
        if (fromLink == 'attended') {
            if (fromType == 'Contact') {
                for (var i = 0, nb = fromObjects.length; i < nb; i++) {
                    this.srvData.newAndSaveAttachment('Attendee', fromObjects[i], toObject);
                }
            } else { //TODO: invalid directions
                for (var i = 0, nb = fromObjects.length; i < nb; i++) {
                    this.srvData.newAndSaveAttachment('Attendee', toObject, fromObjects[i]);
                }
            }
        } else if (fromLink == 'attendee') {
            if (fromType == 'Contact') { //TODO: invalid directions
                for (var i = 0, nb = fromObjects.length; i < nb; i++) {
                    this.srvData.newAndSaveAttachment('Attendee', fromObjects[i], toObject);
                }
            } else {
                for (var i = 0, nb = fromObjects.length; i < nb; i++) {
                    this.srvData.newAndSaveAttachment('Attendee', toObject, fromObjects[i]);
                }
            }
        } else if (fromLink == 'attachee') {
            for (var i = 0, nb = fromObjects.length; i < nb; i++) {
                this.srvData.newAndSaveAttachment('Attachee', toObject, fromObjects[i]);
            }
        } else if (fromLink == 'attached') {
            for (var i = 0, nb = fromObjects.length; i < nb; i++) {
                this.srvData.newAndSaveAttachment('Attachee', fromObjects[i], toObject);
            }
        } else if ((toObject.a4p_type == 'Document') && (fromLink == 'child')) {
            // Copy Document
            this.srvData.linkDocumentToAllObjects(toObject, fromObjects);
        } else if ((fromType == 'Document') && (fromLink == 'parent')) {
            // Copy Document
            this.srvData.linkAllDocumentsToItem(fromObjects, toObject);
        } else {
            this.srvData.linkToItem(fromType, fromLink, fromObjects, toObject);
        }
    };

    /**
     *
     * @param fromType
     * @param fromLink Name of link (one or many) on from side (its not the attribute name of object, but it is associated with it)
     * @param fromObjects
     * @param toObject
     */
    Service.prototype.unlinkObjectsFromItem = function (fromType, fromLink, fromObjects, toObject) {
        // Special cases not referenced into c4p.Model.a4p_types[fromType].linkDescs
        if (fromLink == 'attended') {
            if (fromType == 'Contact') {
                for (var i = 0, nb = fromObjects.length; i < nb; i++) {
                    this.srvData.delAndSaveAttachment('Attendee', fromObjects[i], toObject);
                }
            } else {//TODO: invalid directions
                for (var i = 0, nb = fromObjects.length; i < nb; i++) {
                    this.srvData.delAndSaveAttachment('Attendee', toObject, fromObjects[i]);
                }
            }
        } else if (fromLink == 'attendee') {
            if (fromType == 'Contact') {//TODO: invalid directions
                for (var i = 0, nb = fromObjects.length; i < nb; i++) {
                    this.srvData.delAndSaveAttachment('Attendee', fromObjects[i], toObject);
                }
            } else {
                for (var i = 0, nb = fromObjects.length; i < nb; i++) {
                    this.srvData.delAndSaveAttachment('Attendee', toObject, fromObjects[i]);
                }
            }
        } else if (fromLink == 'attached') {
            for (var i = 0, nb = fromObjects.length; i < nb; i++) {
                this.srvData.delAndSaveAttachment('Attachee', fromObjects[i], toObject);
            }
        } else if (fromLink == 'attachee') {
            for (var i = 0, nb = fromObjects.length; i < nb; i++) {
                this.srvData.delAndSaveAttachment('Attachee', toObject, fromObjects[i]);
            }
        } else {
            this.srvData.unlinkFromItem(fromType, fromLink, fromObjects, toObject);
        }
    };

    return Service;
})();
