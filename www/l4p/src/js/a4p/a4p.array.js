'use strict';

/**
 * Remove from list the last object having the same id.dbid attribute than dbid
 *
 * @param list Array of objects having id.dbid attribute comparable to dbid
 * @param dbid
 * @return {*} Array of deleted item or false
 */
function removeObjectFromList(list, dbid) {
    return removeSubKeyFromList(list, 'id', 'dbid', dbid);
}

/**
 * Replace in list the last object having the same id.dbid attribute
 *
 * @param list Array of objects having id.dbid attribute
 * @param dbid
 * @param object New object replacing the old one
 * @return {*} Array of replaced item or false
 */
function replaceObjectFromList(list, dbid, object) {
    return replaceSubKeyFromList(list, 'id', 'dbid', dbid, object);
}

/**
 * Add in list the argument object if none has the same id.dbid attribute
 *
 * @param list Array of objects having id.dbid attribute comparable to dbid
 * @param object New object to add
 * @return {boolean} True if added or false if already exists in list
 */
function addObjectToList(list, object) {
    return addSubKeyToList(list, 'id', 'dbid', object);
}

/**
 * Check if one object in list has the same id.dbid attribute as dbid and return it
 *
 * @param list Array of objects having id.dbid attribute comparable to dbid
 * @param dbid
 * @return {*} Object if exists or false if none exists in list
 */
function getObjectFromList(list, dbid) {
    return getSubKeyFromList(list, 'id', 'dbid', dbid);
}

/**
 * Remove from list the last object having the same dbid attribute as dbid
 *
 * @param list Array of objects having dbid attribute comparable to dbid
 * @param dbid
 * @return {*} Array of deleted item or false
 */
function removeLinkFromList(list, dbid) {
    return removeKeyFromList(list, 'dbid', dbid);
}

/**
 * Replace in list the last object having the same dbid attribute as dbid
 *
 * @param list Array of objects having dbid attribute comparable to dbid
 * @param dbid
 * @param object New object replacing the old one
 * @return {*} Array of replaced item or false
 */
function replaceLinkFromList(list, dbid, object) {
    return replaceKeyFromList(list, 'dbid', dbid, object);
}

/**
 * Add in list the argument object if none has the same dbid attribute as dbid
 *
 * @param list Array of objects having dbid attribute comparable to dbid
 * @param object New object to add
 * @return {boolean} True if added or false if already exists in list
 */
function addLinkToList(list, object) {
    return addKeyToList(list, 'dbid', object);
}

/**
 * Check if one object in list has the same dbid attribute as dbid and return it
 *
 * @param list Array of objects having dbid attribute comparable to dbid
 * @param dbid
 * @return {*} Object if exists or false if none exists in list
 */
function getLinkFromList(list, dbid) {
    return getKeyFromList(list, 'dbid', dbid);
}

/**
 * Remove from list the last object having the same id attribute as id
 *
 * @param list Array of objects having id attribute comparable to id
 * @param id
 * @return {*} Array of deleted item or false
 */
function removeIdFromList(list, id) {
    return removeKeyFromList(list, 'id', id);
}

/**
 * Replace in list the last object having the same id attribute as id
 *
 * @param list Array of objects having id attribute comparable to id
 * @param id
 * @param object New object replacing the old one
 * @return {*} Array of replaced item or false
 */
function replaceIdFromList(list, id, object) {
    return replaceKeyFromList(list, 'id', id, object);
}

/**
 * Add in list the argument object if none has the same id attribute as id
 *
 * @param list Array of objects having id attribute comparable to id
 * @param object New object to add
 * @return {boolean} True if added or false if already exists in list
 */
function addIdToList(list, object) {
    return addKeyToList(list, 'id', object);
}

/**
 * Check if one object in list has the same id attribute as id and return it
 *
 * @param list Array of objects having id attribute comparable to id
 * @param id
 * @return {*} Object if exists or false if none exists in list
 */
function getIdFromList(list, id) {
    return getKeyFromList(list, 'id', id);
}

/**
 * Remove from list the last object having the same key attribute as value
 *
 * @param list Array of objects having key attribute comparable to value
 * @param {string} key
 * @param value
 * @return {*} Array of deleted item or false
 */
function removeKeyFromList(list, key, value) {
	for (var i = list.length - 1; i >= 0; i--) {
		if (list[i][key] == value) {
            return list.splice(i, 1); // remove from array
		}
	}
    return false;
}

/**
 * Replace in list the last object having the same key attribute as value
 *
 * @param list Array of objects having key attribute comparable to value
 * @param {string} key
 * @param value
 * @param object New object replacing the old one
 * @return {*} Array of replaced item or false
 */
function replaceKeyFromList(list, key, value, object) {
	for (var i = list.length - 1; i >= 0; i--) {
		if (list[i][key] == value) {
            return list.splice(i, 1, object); // remove from array and replace by the new object
		}
	}
    return false;
}

/**
 * Add in list the argument object if none has the same key attribute
 *
 * @param list Array of objects having key attribute
 * @param {string} key
 * @param object New object to add
 * @return {boolean} True if added or false if already exists in list
 */
function addKeyToList(list, key, object) {
	for (var i = list.length - 1; i >= 0; i--) {
		if (list[i][key] == object[key]) {
            return false;
		}
	}
    list.push(object);
    return true;
}

/**
 * Check if one object in list has the same key attribute as value and return it
 *
 * @param list Array of objects having key attribute comparable to value
 * @param {string} key
 * @param value
 * @return {*} Object if exists or false if none exists in list
 */
function getKeyFromList(list, key, value) {
	for (var i = list.length - 1; i >= 0; i--) {
		if (list[i][key] == value) {
            return list[i];
		}
	}
    return false;
}

/**
 * Remove from list the last object having the same sub.key attribute as value
 *
 * @param list Array of objects having sub.key attribute comparable to value
 * @param {string} sub
 * @param {string} key
 * @param value
 * @return {*} Array of deleted item or false
 */
function removeSubKeyFromList(list, sub, key, value) {
	for (var i = list.length - 1; i >= 0; i--) {
		if (a4p.isDefined(list[i][sub]) && (list[i][sub][key] == value)) {
            return list.splice(i, 1); // remove from array
		}
	}
    return false;
}

/**
 * Replace in list the last object having the same sub.key attribute as value
 *
 * @param list Array of objects having sub.key attribute comparable to value
 * @param {string} sub
 * @param {string} key
 * @param value
 * @param object New object replacing the old one
 * @return {*} Array of replaced item or false
 */
function replaceSubKeyFromList(list, sub, key, value, object) {
	for (var i = list.length - 1; i >= 0; i--) {
		if (a4p.isDefined(list[i][sub]) && (list[i][sub][key] == value)) {
            return list.splice(i, 1, object); // remove from array and replace by the new object
		}
	}
    return false;
}

/**
 * Add in list the argument object if none has the same sub.key attribute
 *
 * @param list Array of objects having sub.key attribute
 * @param {string} sub
 * @param {string} key
 * @param object New object to add
 * @return {boolean} True if added or false if already exists in list
 */
function addSubKeyToList(list, sub, key, object) {
	for (var i = list.length - 1; i >= 0; i--) {
		if (a4p.isDefined(list[i][sub]) && (list[i][sub][key] == object[sub][key])) {
            return false;
		}
	}
    list.push(object);
    return true;
}

/**
 * Check if one object in list has the same sub.key attribute as value and return it
 *
 * @param list Array of objects having sub.key attribute comparable to value
 * @param {string} sub
 * @param {string} key
 * @param value
 * @return {*} Object if exists or false if none exists in list
 */
function getSubKeyFromList(list, sub, key, value) {
	for (var i = list.length - 1; i >= 0; i--) {
		if (a4p.isDefined(list[i][sub]) && (list[i][sub][key] == value)) {
            return list[i];
		}
	}
    return false;
}

/**
 * Remove from list the last object being equal to value
 *
 * @param list Array of objects comparable to value
 * @param value
 * @return {*} Array of deleted item or false
 */
function removeValueFromList(list, value) {
	for (var i = list.length - 1; i >= 0; i--) {
		if (list[i] == value) {
            return list.splice(i, 1); // remove from array
		}
	}
    return false;
}

/**
 * Replace in list the last object being equal to oldValue.
 * Beware, this can insert duplicates in the list !
 *
 * @param list Array of objects comparable to oldValue
 * @param oldValue
 * @param newValue New object replacing the old one
 * @return {*} Array of replaced item or false
 */
function replaceValueFromList(list, oldValue, newValue) {
	for (var i = list.length - 1; i >= 0; i--) {
		if (list[i] == oldValue) {
            return list.splice(i, 1, newValue); // remove from array and replace by the new object
		}
	}
    return false;
}

/**
 * Add in list the value if none equals value
 *
 * @param list Array of objects comparable to value
 * @param value New value to add
 * @return {boolean} True if added or false if already exists in list
 */
function addValueToList(list, value) {
	for (var i = list.length - 1; i >= 0; i--) {
		if (list[i] == value) {
            return false;
		}
	}
    list.push(value);
    return true;
}

/**
 * Check if one value in list has the same value
 *
 * @param list Array of objects comparable to value
 * @param value
 * @return {boolean} True if exists or false if none exists in list
 */
function isValueInList(list, value) {
	for (var i = list.length - 1; i >= 0; i--) {
		if (list[i] == value) {
            return true;
		}
	}
    return false;
}
