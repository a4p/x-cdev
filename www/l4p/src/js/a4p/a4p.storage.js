'use strict';

/*
Pour recopier un fichier externe au navigateur dans le localStorage ou le fileStorage, il faut passer par <input type="file"/>
Exemple :

<!--<input id="file" type="file" multiple />-->
<!-- multiple does not work on Android -->
<input id="file" type="file" />
<div id="prev"></div>

<script>
var fileInput = document.querySelector('#file');
var prev = document.querySelector('#prev');

fileInput.onchange = function() {

    var files = this.files;
    var filesLen = files.length;
    var allowedTypes = ['png', 'jpg', 'jpeg', 'gif']

    for (var i = 0 ; i < filesLen ; i++) {
        var reader = new FileReader();
        // Lecture du contenu de fichier
        reader.onload = function() {
            alert('Contenu du fichier "' + fileInput.files[i].name + '" :\n\n' + reader.result);
        };
        reader.readAsText(files[i]);

        // Previsualisation de fichier image
        var fileNames = files[i].name.split('.');
        var fileExt = fileNames[fileNames.length - 1];
        if (allowedTypes.indexOf(fileExt) != -1) {
            var reader = new FileReader();
            reader.onload = function() {
                var imgElement = document.createElement('img');
                imgElement.style.maxWidth = '150px';
                imgElement.style.maxHeight = '150px';
                imgElement.src = this.result;
                prev.appendChild(imgElement);
            };
            reader.readAsDataURL(files[i]);
        }
    }
};
</script>

 */

// Create a new module
/*angular.module("a4p", [
    "a4p.all",
    "a4p.file",
    "a4p.analytics",
    "a4p.storage",
    "a4p.stringFormat",
    "a4p.base64",
    "a4p.json",
    "a4p.xml",
    "a4p.fileDownloader",
    "a4p.fileUploader",
    "a4p.taskReceiver",
    "a4p.taskSender",
    "a4p.sense"
]);*/

// Create a new module
//var a4pStorageModule = angular.module('a4p.storage', ['a4p.xml', 'a4p.json']);

/**
 * localStorage service provides an interface to manage in memory data repository.
 * @param {object} storageService The object window.localStorage or an equivalent object which implements it.
 */
/*a4pStorageModule.factory('localStorage', ['a4pXml', 'a4pJson', function(a4pXml, a4pJson) {
    var LocalStorage = function(storageService) {
        storageService = storageService || window.localStorage;
    };
    return LocalStorage;
}]);*/

// Namespace a4p
var a4p;
if (!a4p) a4p = {};

/**
 * Memory storage (used mainly for tests).
 * Usage : a4p.LocalStorageFactory(new a4p.MemoryStorage());
 */
a4p.MemoryStorage = (function () {
    function Storage() {
        this.keyes = [];
        this.set = {};
        this.length = 0;
    }
    Storage.prototype.clear = function () {
        this.keyes = [];
        this.set = {};
        this.length = 0;
    };
    Storage.prototype.key = function (idx) {
        return this.keyes[idx];
    };
    Storage.prototype.getItem = function (key) {
        if (a4p.isUndefined(this.set[key])) return null;
        return this.set[key];
    };
    Storage.prototype.setItem = function (key, value) {
        this.set[key] = value;
        for (var i = 0; i < this.keyes.length; i++) {
            if (this.keyes[i] == key) return;
        }
        this.keyes.push(key);
        this.length = this.keyes.length;
    };
    Storage.prototype.removeItem = function (key) {
        delete this.set[key];
        for (var i = 0; i < this.keyes.length; i++) {
            if (this.keyes[i] == key) {
                this.keyes.splice(i, 1);
                this.length = this.keyes.length;
            }
        }
    };
    return Storage;
})();

/**
 * localStorage class factory
 * Usage : var LocalStorage = a4p.LocalStorageFactory(window.localStorage); // to create a new class
 * Usage : var localStorageService = new LocalStorage(); // to create a new instance
 */
a4p.LocalStorageFactory = function (storageService) {

    var storage = storageService || window.localStorage;
    if (!storage) {
        throw new Error("a4p.LocalStorageFactory needs a storageService!");
    }

    // Constructor
    function LocalStorage() {
        this.version = "0.1";
        if (!a4p.Xml) {
            throw new Error("a4p.Xml needs to be loaded before a4p.LocalStorage!");
        }
        if (!a4p.Json) {
            throw new Error("a4p.Json needs to be loaded before a4p.LocalStorage!");
        }
        if (!a4p.Xml.isXml || !a4p.Xml.xml2String || !a4p.Xml.string2Xml) {
            throw new Error("a4p.Xml with isXml(), xml2String() and string2Xml() needs to be loaded before a4p.LocalStorage!");
        }
        if (!a4p.Json.object2String || !a4p.Json.string2Object) {
            throw new Error("a4p.Json with object2String() and string2Object() needs to be loaded before a4p.LocalStorage!");
        }
    }

    // Public API

    /**
     * Sets a key's value.
     *
     * @param {String} key - Key to set. If this value is not set or not
     *              a string an exception is raised.
     * @param {Mixed} value - Value to set. This can be any value that is JSON
     *              compatible (Numbers, Strings, Objects etc.).
     * @returns the stored value which is a container of user value.
     */
    LocalStorage.prototype.set = function (key, value) {
        checkKey(key);
        // clone the object before saving to storage
        var t = typeof(value);
        if (t == "undefined")
            value = 'null';
        else if (value == null)
            value = 'null';
        else if (a4p.Xml.isXml(value))
            value = a4p.Json.object2String({xml:a4p.Xml.xml2String(value)});
        else if (t == "string")
            value = a4p.Json.object2String({string:value});
        else if (t == "number")
            value = a4p.Json.object2String({number:value});
        else if (t == "boolean")
            value = a4p.Json.object2String({ bool : value });
        else if (t == "object")
            value = a4p.Json.object2String( { json : value } );
        else {
            // reject and do not insert
            // if (typeof value == "function") for example
            throw new TypeError('Value type ' + t + ' is invalid. It must be null, undefined, xml, string, number, boolean or object');
        }
        storage.setItem(key, value);
        return value;
    };

    /**
     * Looks up a key in cache
     *
     * @param {String} key - Key to look up.
     * @param {mixed} def - Default value to return, if key didn't exist.
     * @returns the key value, default value or <null>
     */
    LocalStorage.prototype.get = function (key, def) {
        checkKey(key);
        var item = storage.getItem(key);
        if (item != null) {
            if (item == 'null') {
                return null;
            }
            var value = a4p.Json.string2Object(item)
            if ('xml' in value) {
                return a4p.Xml.string2Xml(value.xml);
            } else if ('string' in value) {
                return value.string;
            } else if ('number' in value) {
                return value.number.valueOf();
            } else if ('bool' in value) {
                return value.bool.valueOf();
            } else {
                return value.json;
            }
        }
        return a4p.isUndefined(def) ? null : def;
    };

    /**
     * Deletes a key from cache.
     *
     * @param {String} key - Key to delete.
     * @returns true if key existed or false if it didn't
     */
    LocalStorage.prototype.remove = function (key) {
        checkKey(key);
        var existed = (storage.getItem(key) != null);
        storage.removeItem(key);
        return existed;
    };

    /**
     * Deletes everything in cache.
     *
     * @return true
     */
    LocalStorage.prototype.clear = function () {
        var existed = (storage.length > 0);
        storage.clear();
        return existed;
    };

    /**
     * How much space in bytes does the storage take?
     *
     * @returns Number
     */
    LocalStorage.prototype.size = function () {
        return storage.length;
    };

    /**
     * Call function f on the specified context for each element of the storage
     * from index 0 to index length-1.
     * WARNING : You should not modify the storage during the loop !!!
     *
     * @param {Function} f - Function to call on every item.
     * @param {Object} context - Context (this for example).
     * @returns Number of items in storage
     */
    LocalStorage.prototype.foreach = function (f, context) {
        var n = storage.length;
        for (var i = 0; i < n; i++) {
            var key = storage.key(i);
            var value = this.get(key);
            if (context) {
                // f is an instance method on instance context
                f.call(context, value);
            } else {
                // f is a function or class method
                f(value);
            }
        }
        return n;
    };

    // Private API
    // helper functions and variables hidden within this function scope

    function checkKey(key) {
        if (!key || (typeof key != "string")) {
            throw new TypeError('Key type must be string');
        }
        return true;
    }

    // The public API for this module is the constructor function.
    // We need to export that function from this private namespace so that
    // it can be used on the outside.
    return LocalStorage;
};

a4p.FileStorage = (function () {
    // Constructor
    function FileStorage($q, $rootScope) {
        this.version = "0.1";
        this.q = $q;
        this.rootScope = $rootScope;
        this.grantedBytes = 0;
        this.fs = null;
        this.urlPrefix = '';
        this.storageType = null;

        this.initDone = false;
        this.initPromises = [];
        this.initTimer = null;
    }

    // Public API

    function initEnd(self) {
        a4p.safeApply(self.rootScope, function() {
            for (var i= 0; i < self.initPromises.length; i++) {
                self.initTrigger(self.initPromises[i]);
            }
            self.initDone = true;
            self.initPromises = [];
            self.initTimer = null;
        });
    }

    function launchEnd(self) {
        if (self.initTimer == null) {
            self.initTimer = setTimeout(function() { initEnd(self); }, 100);
        }
    }

    function tryQuota(self, grantBytes) {
        try {
            var fctOnSuccess = function (fs) {
                a4p.InternalLog.log('a4p.FileStorage', 'opened file system ' + fs.name);
                self.fs = fs;
                self.urlPrefix = '';
                var pattern = /^(https?)_([^_]+)_(\d+):Persistent$/;
                if (pattern.test(fs.name)) {
                    var name = fs.name;
                    name = name.replace(pattern, "$1://$2:$3");// remove ':Persistent' and '_'
                    name = name.replace(/^(.*):0$/, "$1");// remove ':0'
                    // Specific to Chrome where window.webkitResolveLocalFileSystemURI does not exist
                    // get URL from URI by prefixing fullPath with urlPrefix
                    self.urlPrefix = 'filesystem:' + name + '/persistent';
                }
                a4p.InternalLog.log('a4p.FileStorage', 'urlPrefix = ' + self.urlPrefix);
                self.initTrigger = function(deferred) { deferred.resolve(); };
                launchEnd(self);
            };
            var fctOnFailure = function (fileError) {
                if (fileError.code == FileError.QUOTA_EXCEEDED_ERR) {
                    setTimeout(function() { tryQuota(self, grantBytes/2); }, 100);
                } else {
                    var message = "requestFileSystem failure : " + errorMessage(fileError);
                    self.initTrigger = function(deferred) { deferred.reject(message); };
                    launchEnd(self);
                }
            };
            var requestFs = function(grantedBytes) {
                try {
                    if (a4p.isDefined(window.requestFileSystem)) {
                        window.requestFileSystem(self.storageType, grantedBytes, fctOnSuccess, fctOnFailure);
                    } else {
                        window.webkitRequestFileSystem(self.storageType, grantedBytes, fctOnSuccess, fctOnFailure);
                    }
                } catch (e) {
                    var message = e.message;
                    self.initTrigger = function(deferred) { deferred.reject(message); };
                    launchEnd(self);
                }
            };

            if (a4p.isDefined(window.webkitPersistentStorage)) {
                // In Chrome 27+
                if (a4p.isDefined(window.webkitPersistentStorage.requestQuota)) {
                    window.webkitPersistentStorage.requestQuota(grantBytes, function (grantedBytes) {
                        self.grantedBytes = grantedBytes;
                        requestFs(grantedBytes);
                    }, function (fileError) {
                        if (fileError.code == FileError.QUOTA_EXCEEDED_ERR) {
                            setTimeout(function() { tryQuota(self, grantBytes/2); }, 100);
                        } else {
                            var message = "requestQuota failure : " + errorMessage(fileError);
                            self.initTrigger = function(deferred) { deferred.reject(message); };
                            launchEnd(self);
                        }
                    });
                } else {
                    requestFs(grantBytes);
                }
            } else if (a4p.isDefined(window.webkitStorageInfo)) {
                // In Chrome 13
                if (a4p.isDefined(window.webkitStorageInfo.requestQuota)) {
                    window.webkitStorageInfo.requestQuota(self.storageType, grantBytes, function (grantedBytes) {
                        self.grantedBytes = grantedBytes;
                        requestFs(grantedBytes);
                    }, function (fileError) {
                        if (fileError.code == FileError.QUOTA_EXCEEDED_ERR) {
                            setTimeout(function() { tryQuota(self, grantBytes/2); }, 100);
                        } else {
                            var message = "requestQuota failure : " + errorMessage(fileError);
                            self.initTrigger = function(deferred) { deferred.reject(message); };
                            launchEnd(self);
                        }
                    });
                } else {
                    requestFs(grantBytes);
                }
            } else {
                requestFs(grantBytes);
            }
        } catch (e) {
            var message = e.message;
            self.initTrigger = function(deferred) { deferred.reject(message); };
            launchEnd(self);
        }
    }

    FileStorage.prototype.init = function () {
        var deferred = this.q.defer();
        this.initPromises.push(deferred);
        if (this.initDone) {
            // Init already finished
            launchEnd(this);
        } else if (this.initPromises.length == 1) {
            // Init not yet started
            this.initPromises.push(deferred);
            if (a4p.isUndefinedOrNull(LocalFileSystem)) {
                this.storageType = window.PERSISTENT;
            } else {
                this.storageType = LocalFileSystem.PERSISTENT;
            }
            if (!window.File || !window.FileReader || !window.Blob) {
                var message = "window.File, window.FileReader and window.Blob need to be loaded before a4p.FileStorage!";
                this.initTrigger = function(deferred) { deferred.reject(message); };
                launchEnd(this);
            } else if (a4p.isUndefined(window.requestFileSystem) && a4p.isUndefined(window.webkitRequestFileSystem)) {
                var message = "window.requestFileSystem() or window.webkitRequestFileSystem() required by a4p.FileStorage!";
                this.initTrigger = function(deferred) { deferred.reject(message); };
                launchEnd(this);
            } else if (a4p.isUndefined(window.resolveLocalFileSystemURL) &&
                a4p.isUndefined(window.webkitResolveLocalFileSystemURL) &&
                a4p.isUndefined(window.resolveLocalFileSystemURI) &&
                a4p.isUndefined(window.webkitResolveLocalFileSystemURI)) {
                var message = "window.resolveLocalFileSystemURI or equivalent required by a4p.FileStorage!";
                this.initTrigger = function(deferred) { deferred.reject(message); };
                launchEnd(this);
            } else {
                var grantBytes = 4 * 1024 * 1024 * 1024;
                var self = this;
                setTimeout(function() { tryQuota(self, grantBytes); }, 100);
            }
        } else {
            // Init already started but not yet finished
        }
        return deferred.promise;
    };

    /**
     * Get granted space.
     *
     * @param {Int} storageType - LocalFileSystem.TEMPORARY or LocalFileSystem.PERSISTENT or window.TEMPORARY or window.PERSISTENT value.
     * @param {Function} onSuccess - Callback function with long long argument giving grantedQuotaInBytes or 0 if not available.
     * @returns true.
     */
    /* getGrantedBytes() and getUsedBytes() are not yet ready
     FileStorage.getGrantedBytes = function (storageType, onSuccess) {
     // In Chrome 13
            if ((a4p.isUndefinedOrNull(storageType)) {
                if (a4p.isUndefinedOrNull(LocalFileSystem)) {
                    storageType = window.PERSISTENT;
                } else {
                    storageType = LocalFileSystem.PERSISTENT;
                }
            }
     if (a4p.isUndefined(window.webkitStorageInfo)) {
     if (a4p.isUndefined(window.webkitStorageInfo.queryUsageAndQuota)) {
     window.webkitStorageInfo.queryUsageAndQuota(storageType,
     function (currentUsageInBytes) {
     },
     function (grantedQuotaInBytes) {
     onSuccess(grantedQuotaInBytes);
     });
     return true;
     }
     }
     onSuccess(0);
     return true;
     };
     */

    /**
     * Get used space.
     *
     * @param {Int} storageType - LocalFileSystem.TEMPORARY or LocalFileSystem.PERSISTENT or window.TEMPORARY or window.PERSISTENT value.
     * @param {Function} onSuccess - Callback function with long long argument giving currentUsageInBytes or 0 if not available.
     * @returns true.
     */
    /* getGrantedBytes() and getUsedBytes() are not yet ready
     FileStorage.getUsedBytes = function (storageType, onSuccess) {
     // In Chrome 13
            if (a4p.isUndefinedOrNull(storageType)) {
                if (a4p.isUndefinedOrNull(LocalFileSystem)) {
                    storageType = window.PERSISTENT;
                } else {
                    storageType = LocalFileSystem.PERSISTENT;
                }
            }
     if (a4p.isDefined(window.webkitStorageInfo)) {
     if (a4p.isDefined(window.webkitStorageInfo.queryUsageAndQuota)) {
     window.webkitStorageInfo.queryUsageAndQuota(storageType,
     function (currentUsageInBytes) {
     onSuccess(currentUsageInBytes);
     },
     function (grantedQuotaInBytes) {
     });
     return true;
     }
     }
     onSuccess(0);
     return true;
     };
     */

    /**
     * Create a directory in root directory.
     *
     * @param {String} dirPath - Directory path (relative or absolute). All directories in path will be created.
     * @param {Function} onSuccess - Called with dirEntry argument if success.
     * @param {Function} onFailure - Called with error message argument if failure.
     */
    FileStorage.prototype.createDir = function (dirPath, onSuccess, onFailure) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        var self = this;
        var names = dirPath.split('/');
        var max = names.length;
        var dirs = [];
        for (var i = 0; i < max; i++) {
            if ((names[i] != '.') && (names[i] != '')) {
                dirs.push(names[i]);
            }
        }
        var dirOptions = {create:true, exclusive:false};
        getDirEntry(this.fs.root, dirOptions, dirs,
            function (dirEntry) {
                if (onSuccess) {
                    onSuccess(dirEntry);
                }
            }, onFailure);

    };

    /**
     * Get a directory in root directory.
     * Will get nothing if directory does not already exist.
     *
     * @param {String} dirPath - Directory path (relative or absolute). Its direct parent directory must already exist.
     * @param {Function} onSuccess - Called with dirEntry argument if success.
     * @param {Function} onFailure - Called with error message argument if failure.
     */
    FileStorage.prototype.getDir = function (dirPath, onSuccess, onFailure) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        var names = dirPath.split('/');
        var max = names.length;
        var dirs = [];
        for (var i = 0; i < max; i++) {
            if ((names[i] != '.') && (names[i] != '')) {
                dirs.push(names[i]);
            }
        }
        var dirOptions = {create:false, exclusive:false};
        getDirEntry(this.fs.root, dirOptions, dirs, onSuccess, onFailure);
    };

    /**
     * Read the content of a directory.
     * Will get nothing if directory does not already exist.
     *
     * @param {String} dirPath - Directory path (relative or absolute). Its parent directories must already exist.
     * @param {Function} onSuccess - Called with dirNames and fileNames sorted Array arguments if success.
     * @param {Function} onFailure - Called with error message argument if failure.
     */
    FileStorage.prototype.readDirectory = function (dirPath, onSuccess, onFailure) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        var names = dirPath.split('/');
        var max = names.length;
        var dirs = [];
        for (var i = 0; i < max; i++) {
            if ((names[i] != '.') && (names[i] != '')) {
                dirs.push(names[i]);
            }
        }
        var dirOptions = {create:false, exclusive:false};
        var dirContentReader = function (dirEntry) {
            var dirReader = dirEntry.createReader();
            var fileEntries = [];
            var dirEntries = [];
            // There is no guarantee that all entries are read in ony one call to readEntries()
            // call readEntries() until no more results are returned
            var readEntries = function () {
                dirReader.readEntries(function (results) {
                    if (!results.length) {
                        // All entries have been read
                        if (onSuccess) {
                            dirEntries.sort();
                            fileEntries.sort();
                            onSuccess(dirEntries, fileEntries);
                        }
                    } else {
                        // New entries to add
                        var max = results.length;
                        for (var i = 0; i < max; i++) {
                            if (results[i].isFile) {
                                //fileEntries.push(results[i].fullPath);
                                fileEntries.push(results[i].name);
                            } else {
                                //dirEntries.push(results[i].fullPath);
                                dirEntries.push(results[i].name);
                            }
                        }
                        readEntries();
                    }
                }, function (fileError) {
                    if (onFailure) {
                        onFailure("readEntries from " + dirEntry.fullPath + " failure : " + errorMessage(fileError));
                    }
                });
            };
            // Start to read entries
            readEntries();
        };
        getDirEntry(this.fs.root, dirOptions, dirs, dirContentReader, onFailure);
    };

    /**
     * Read the content of a directory and all its subdirectories.
     * Will get nothing if directory does not already exist.
     *
     * @param {String} dirPath - Directory path (relative or absolute). Its parent directories must already exist.
     * @param {Function} onSuccess - Called with fileFullPaths sorted Array argument if success.
     * @param {Function} onFailure - Called with error message argument if failure.
     */
    FileStorage.prototype.readFullDirectory = function (dirPath, onSuccess, onFailure) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        var names = dirPath.split('/');
        var max = names.length;
        var dirs = [];
        for (var i = 0; i < max; i++) {
            if ((names[i] != '.') && (names[i] != '')) {
                dirs.push(names[i]);
            }
        }
        var dirOptions = {create:false, exclusive:false};
        var dirEntries = [];
        var fileEntries = [];
        var dirContentReader = function (dirEntry) {
            a4p.InternalLog.log('a4p.FileStorage', 'Reading dir ' + dirEntry.fullPath);
            var dirReader = dirEntry.createReader();
            // There is no guarantee that all entries are read in ony one call to readEntries()
            // call readEntries() until no more results are returned
            var readEntries = function () {
                dirReader.readEntries(function (results) {
                    if (!results.length) {
                        // All entries of this dirEntry have been read
                        if (dirEntries.length <= 0) {
                            // All entries of all dirEntries have been read
                            if (onSuccess) {
                                fileEntries.sort();
                                onSuccess(fileEntries);
                            }
                        } else {
                            dirContentReader(dirEntries.shift());
                        }
                    } else {
                        // New entries to add
                        var max = results.length;
                        for (var i = 0; i < max; i++) {
                            if (results[i].isFile) {
                                fileEntries.push(results[i].fullPath);
                            } else {
                                dirEntries.push(results[i]);
                            }
                        }
                        readEntries();
                    }
                }, function (fileError) {
                    if (onFailure) {
                        onFailure("readEntries from " + dirEntry.fullPath + " failure : " + errorMessage(fileError));
                    }
                });
            };
            // Start to read entries
            readEntries();
        };
        getDirEntry(this.fs.root, dirOptions, dirs, dirContentReader, onFailure);
    };

    FileStorage.prototype.deleteDir = function (dirPath, onSuccess, onFailure) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        var names = dirPath.split('/');
        var max = names.length;
        var dirs = [];
        for (var i = 0; i < max; i++) {
            if ((names[i] != '.') && (names[i] != '')) {
                dirs.push(names[i]);
            }
        }
        var dirOptions = {create:false, exclusive:false};
        getDirEntry(this.fs.root, dirOptions, dirs,
            function (dirEntry) {
                dirEntry.remove(function () {
                    if (onSuccess) {
                        onSuccess();
                    }
                }, function (fileError) {
                    if (onFailure) {
                        onFailure("remove " + dirEntry.fullPath + " failure : " + errorMessage(fileError));
                    }
                });
            }, function(message) {
                // Ignore error if dir unknown. It is also a success
                if (onSuccess) {
                    onSuccess();
                }
            });
    };

    FileStorage.prototype.deleteFullDir = function (dirPath, onSuccess, onFailure) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        var names = dirPath.split('/');
        var max = names.length;
        var dirs = [];
        for (var i = 0; i < max; i++) {
            if ((names[i] != '.') && (names[i] != '')) {
                dirs.push(names[i]);
            }
        }
        var dirOptions = {create:false, exclusive:false};
        getDirEntry(this.fs.root, dirOptions, dirs,
            function (dirEntry) {
                dirEntry.removeRecursively(function () {
                    if (onSuccess) {
                        onSuccess();
                    }
                }, function (fileError) {
                    if (onFailure) {
                        onFailure("removeRecursively " + dirEntry.fullPath + " failure : " + errorMessage(fileError));
                    }
                });
            }, function (message) {
                // Ignore error if dir unknown. It is also a success
                if (onSuccess) {
                    onSuccess();
                }
            });
    };

    /**
     * Get a fileEntry from its URL.
     * Will get nothing if file does not already exist.
     *
     * @param {String} fileUrl - File URL.
     * @param {Function} onSuccess - Called with fileEntry argument if success.
     * @param {Function} onFailure - Called with error message argument if failure.
     */
    FileStorage.prototype.getFileFromUrl = function (fileUrl, onSuccess, onFailure) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        if (a4p.isDefined(window.resolveLocalFileSystemURL)) {
            window.resolveLocalFileSystemURL(fileUrl, function (fileEntry) {
                    if (onSuccess) {
                        onSuccess(fileEntry);
                    }
                },
                function (fileError) {
                    if (onFailure) {
                        onFailure("resolveLocalFileSystemURL " + fileUrl + " failure : " + errorMessage(fileError));
                    }
                });
        } else if (a4p.isDefined(window.webkitResolveLocalFileSystemURL)) {
            window.webkitResolveLocalFileSystemURL(fileUrl, function (fileEntry) {
                    if (onSuccess) {
                        onSuccess(fileEntry);
                    }
                },
                function (fileError) {
                    if (onFailure) {
                        onFailure("webkitResolveLocalFileSystemURL " + fileUrl + " failure : " + errorMessage(fileError));
                    }
                });
        } else {
            // In Cordova window.webkitResolveLocalFileSystemURL does not exist
            this.getFileFromUri(fileUrl, onSuccess, onFailure);
        }
    };

    /**
     * Get a fileEntry from its URI.
     * Will get nothing if file does not already exist.
     *
     * @param {String} fileUri - File URI.
     * @param {Function} onSuccess - Called with fileEntry argument if success.
     * @param {Function} onFailure - Called with error message argument if failure.
     */
    FileStorage.prototype.getFileFromUri = function (fileUri, onSuccess, onFailure) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        if (a4p.isDefined(window.resolveLocalFileSystemURI)) {
            window.resolveLocalFileSystemURI(fileUri, function (fileEntry) {
                    if (onSuccess) {
                        onSuccess(fileEntry);
                    }
                },
                function (fileError) {
                    if (onFailure) {
                        onFailure("resolveLocalFileSystemURI " + fileUri + " failure : " + errorMessage(fileError));
                    }
                });
        } else if (a4p.isDefined(window.webkitResolveLocalFileSystemURI)) {
            window.webkitResolveLocalFileSystemURI(fileUri, function (fileEntry) {
                    if (onSuccess) {
                        onSuccess(fileEntry);
                    }
                },
                function (fileError) {
                    if (onFailure) {
                        onFailure("webkitResolveLocalFileSystemURI " + fileUri + " failure : " + errorMessage(fileError));
                    }
                });
        } else {
            // In Chrome window.webkitResolveLocalFileSystemURI does not exist
            this.getFileFromUrl(self.urlPrefix + fileUri, onSuccess, onFailure);
        }
    };

    /**
     * Get a URL from its filePath.
     * Will get nothing if file does not already exist.
     *
     * @param {String} filePath - File path.
     * @param {Function} onSuccess - Called with fileURL argument if success.
     * @param {Function} onFailure - Called with error message argument if failure.
     */
    FileStorage.prototype.getUrlFromFile = function (filePath, onSuccess, onFailure) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        getFileEntry(this.fs.root, filePath, {create:false, exclusive:false},
            function (fileEntry) {
                if (onSuccess) {
                    onSuccess(fileEntry.toURL());
                }
            }, onFailure);
    };

    /**
     * Get a URI from its filePath.
     * Will get nothing if file does not already exist.
     *
     * @param {String} filePath - File path.
     * @param {Function} onSuccess - Called with fileURI argument if success.
     * @param {Function} onFailure - Called with error message argument if failure.
     */
    FileStorage.prototype.getUriFromFile = function (filePath, onSuccess, onFailure) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        getFileEntry(this.fs.root, filePath, {create:false, exclusive:false},
            function (fileEntry) {
                if (onSuccess) {
                    onSuccess(fileEntry.toURI());
                }
            }, onFailure);
    };

    /**
     * Get a modification time from its filePath.
     * Will get nothing if file does not already exist.
     *
     * @param {String} filePath - File URL.
     * @param {Function} onSuccess - Called with Date object argument if success.
     * @param {Function} onFailure - Called with error message argument if failure.
     */
    FileStorage.prototype.getModificationTimeFromFile = function (filePath, onSuccess, onFailure) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        getFileEntry(this.fs.root, filePath, {create:false, exclusive:false},
            function (fileEntry) {
                fileEntry.getMetadata(
                    function (metadata) {
                        if (onSuccess) {
                            onSuccess(metadata.modificationTime);
                        }
                    },
                    function (fileError) {
                        if (onFailure) {
                            onFailure("getMetadata " + fileEntry.fullPath + " failure : " + errorMessage(fileError));
                        }
                    });
            }, onFailure);
    };

    /**
     * Get a file in root directory.
     * Will get nothing if file does not already exist.
     *
     * @param {String} filePath - File path (relative or absolute). Its direct parent directory must already exist.
     * @param {Function} onSuccess - Called with fileEntry argument if success.
     * @param {Function} onFailure - Called with error message argument if failure.
     */
    FileStorage.prototype.getFile = function (filePath, onSuccess, onFailure) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        getFileEntry(this.fs.root, filePath, {create:false, exclusive:false}, onSuccess, onFailure);
    };

    /**
     * Creates a new file in root directory.
     * Will create file if file does not already exist. Will fail if file already exist.
     *
     * @param {String} filePath - File path (relative or absolute). Its direct parent directory must already exist.
     * @param {Function} onSuccess - Called with fileEntry argument if success.
     * @param {Function} onFailure - Called with error message argument if failure.
     */
    FileStorage.prototype.newFile = function (filePath, onSuccess, onFailure) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        getFileEntry(this.fs.root, filePath, {create:true, exclusive:true}, onSuccess, onFailure);
    };

    /**
     * Get a existant file or create a new file in root directory.
     * Will create file if file does not already exist. Will reuse the same file if file already exist.
     *
     * @param {String} filePath - File path (relative or absolute). Its direct parent directory must already exist.
     * @param {Function} onSuccess - Called with fileEntry argument if success.
     * @param {Function} onFailure - Called with error message argument if failure.
     */
    FileStorage.prototype.getOrNewFile = function (filePath, onSuccess, onFailure) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        getFileEntry(this.fs.root, filePath, {create:true, exclusive:false}, onSuccess, onFailure);
    };

    /**
     * Read the content of a file in root directory.
     * Will get nothing if file does not already exist.
     *
     * @param {String} filePath - File path (relative or absolute). Its direct parent directory must already exist.
     * @param {Function} onSuccess - Called with text argument if success.
     * @param {Function} onFailure - Called with error message argument if failure.
     */
    FileStorage.prototype.readFileAsDataURL = function (filePath, onSuccess, onFailure) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        getFileEntry(this.fs.root, filePath, {create:false, exclusive:false},
            function (fileEntry) {
                fileEntry.file(function (file) {
                    var reader = new FileReader();
                    if (onSuccess) {
                        reader.onload = function (evt) {
                            onSuccess(evt.target.result);
                        };
                    }
                    if (onFailure) {
                        reader.onerror = function (fileError) {
                            onFailure("readAsDataURL " + file.fullPath + " failure : " + errorMessage(fileError));
                        };
                    }
                    reader.readAsDataURL(file);
                }, function (fileError) {
                    if (onFailure) {
                        onFailure("file " + file.fullPath + " failure : " + errorMessage(fileError));
                    }
                });
            }, onFailure);
    };
    FileStorage.prototype.readFileAsText = function (filePath, onSuccess, onFailure, onProgress, from, length) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        getFileEntry(this.fs.root, filePath, {create:false, exclusive:false},
            function (fileEntry) {
                fileEntry.file(function (file) {
                    var reader = new FileReader();
                    //var blob = createBlobToReadByChunks(file, reader, onSuccess, onFailure, onProgress, from, length);
                    //reader.readAsText(blob);// use 'UTF-8' encoding
                    if (onSuccess) {
                        reader.onload = function (evt) {
                            onSuccess(evt.target.result);
                        };
                    }
                    if (onFailure) {
                        reader.onerror = function (fileError) {
                            onFailure("readAsText " + file.fullPath + " failure : " + errorMessage(fileError));
                        };
                    }
                    reader.readAsText(file);
                }, function (fileError) {
                    if (onFailure) {
                        onFailure("file " + file.fullPath + " failure : " + errorMessage(fileError));
                    }
                });
            }, onFailure);
    };

    // Not yet implemented in Cordova
    FileStorage.prototype.readFileAsArrayBuffer = function (filePath, onSuccess, onFailure, onProgress, from, length) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        getFileEntry(this.fs.root, filePath, {create:false, exclusive:false},
            function (fileEntry) {
                fileEntry.file(function (file) {
                    var reader = new FileReader();
                    //var blob = createBlobToReadByChunks(file, reader, onSuccess, onFailure, onProgress, from, length);
                    //reader.readAsArrayBuffer(blob);
                    if (onSuccess) {
                        reader.onload = function (evt) {
                            onSuccess(evt.target.result);
                        };
                    }
                    if (onFailure) {
                        reader.onerror = function (fileError) {
                            onFailure("readAsText " + file.fullPath + " failure : " + errorMessage(fileError));
                        };
                    }
                    reader.readAsArrayBuffer(file);
                }, function (fileError) {
                    if (onFailure) {
                        onFailure("file " + file.fullPath + " failure : " + errorMessage(fileError));
                    }
                });
            }, onFailure);
    };

    // Not yet implemented in Cordova
    FileStorage.prototype.readFileAsBinaryString = function (filePath, onSuccess, onFailure, onProgress, from, length) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        getFileEntry(this.fs.root, filePath, {create:false, exclusive:false},
            function (fileEntry) {
                fileEntry.file(function (file) {
                    var reader = new FileReader();
                    //var blob = createBlobToReadByChunks(file, reader, onSuccess, onFailure, onProgress, from, length);
                    //reader.readAsBinaryString(blob);
                    if (onSuccess) {
                        reader.onload = function (evt) {
                            onSuccess(evt.target.result);
                        };
                    }
                    if (onFailure) {
                        reader.onerror = function (fileError) {
                            onFailure("readAsText " + file.fullPath + " failure : " + errorMessage(fileError));
                        };
                    }
                    reader.readAsBinaryString(file);
                }, function (fileError) {
                    if (onFailure) {
                        onFailure("file " + file.fullPath + " failure : " + errorMessage(fileError));
                    }
                });
            }, onFailure);
    };

    FileStorage.prototype.writeFile = function (fromBlob, toFilePath, onSuccess, onFailure) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        getFileEntry(this.fs.root, toFilePath, {create:true, exclusive:false},
            function (fileEntry) {
                fileEntry.createWriter(function (fileWriter) {
                    // WARNING : can not do truncate() + write() at the same time
                    fileWriter.onwriteend = function (evt) {
                        fileWriter.onwriteend = null;
                        if (onSuccess) {
                            fileWriter.onwrite = function (evt) {
                                onSuccess(fileEntry);
                            };
                        }
                        if (onFailure) {
                            fileWriter.onerror = function (fileError) {
                                onFailure("write or truncate " + fileEntry.fullPath + " failure : " + errorMessage(fileError));
                            };
                        }
                        fileWriter.write(fromBlob);
                    }
                    fileWriter.truncate(0);// Required if new text is shorter than previous text
                }, function (fileError) {
                    if (onFailure) {
                        onFailure("createWriter " + fileEntry.fullPath + " failure : " + errorMessage(fileError));
                    }
                });
            }, onFailure);
    };

    FileStorage.prototype.appendFile = function (fromBlob, toFilePath, onSuccess, onFailure) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        getFileEntry(this.fs.root, toFilePath, {create:true, exclusive:false},
            function (fileEntry) {
                fileEntry.createWriter(function (fileWriter) {
                    if (onSuccess) {
                        fileWriter.onwrite = function (e) {
                            onSuccess(fileEntry);
                        };
                    }
                    if (onFailure) {
                        fileWriter.onerror = function (fileError) {
                            onFailure("write or seek " + fileEntry.fullPath + " failure : " + errorMessage(fileError));
                        };
                    }
                    // can do seek() + write() at the same time
                    fileWriter.seek(fileWriter.length);
                    fileWriter.write(fromBlob);
                }, function (fileError) {
                    if (onFailure) {
                        onFailure("createWriter " + fileEntry.fullPath + " failure : " + errorMessage(fileError));
                    }
                });
            }, onFailure);
    };

    FileStorage.prototype.deleteFile = function (filePath, onSuccess, onFailure) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        getFileEntry(this.fs.root, filePath, {create:false, exclusive:false},
            function (fileEntry) {
                fileEntry.remove(function () {
                    if (onSuccess) {
                        onSuccess();
                    }
                }, function (fileError) {
                    if (onFailure) {
                        onFailure("remove " + fileEntry.fullPath + " failure : " + errorMessage(fileError));
                    }
                });
            }, function (message) {
                // Ignore error if file unknown. It is also a success
                if (onSuccess) {
                    onSuccess();
                }
            });
    };

    FileStorage.prototype.copyFile = function (fromFilePath, toFilePath, onSuccess, onFailure) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        var self = this;
        var names = toFilePath.split('/');
        var max = names.length - 1;
        var fileName = names[max];
        var dirs = [];
        for (var i = 0; i < max; i++) {
            if ((names[i] != '.') && (names[i] != '')) {
                dirs.push(names[i]);
            }
        }
        var dirOptions = {create:true, exclusive:false};
        getDirEntry(this.fs.root, dirOptions, dirs,
            function (dirEntry) {
                getFileEntry(self.fs.root, fromFilePath, {create:false, exclusive:false},
                    function (fileEntry) {
                        fileEntry.copyTo(dirEntry, fileName, function (toFileEntry) {
                            if (onSuccess) {
                                onSuccess(toFileEntry);
                            }
                        }, function (fileError) {
                            if (onFailure) {
                                onFailure("copy " + fileEntry.fullPath + " to " + dirEntry.fullPath + "/" + fileName + " failure : " + errorMessage(fileError));
                            }
                        });
                    }, onFailure);
            }, onFailure);

    };

    FileStorage.prototype.moveFile = function (fromFilePath, toFilePath, onSuccess, onFailure) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        var self = this;
        var names = toFilePath.split('/');
        var max = names.length - 1;
        var fileName = names[max];
        var dirs = [];
        for (var i = 0; i < max; i++) {
            if ((names[i] != '.') && (names[i] != '')) {
                dirs.push(names[i]);
            }
        }
        var dirOptions = {create:true, exclusive:false};
        getDirEntry(this.fs.root, dirOptions, dirs,
            function (dirEntry) {
                getFileEntry(self.fs.root, fromFilePath, {create:false, exclusive:false},
                    function (fileEntry) {
                        fileEntry.moveTo(dirEntry, fileName, function (toFileEntry) {
                            if (onSuccess) {
                                onSuccess(toFileEntry);
                            }
                        }, function (fileError) {
                            if (onFailure) {
                                onFailure("move " + fileEntry.fullPath + " to " + dirEntry.fullPath + "/" + fileName + " failure : " + errorMessage(fileError));
                            }
                        });
                    }, onFailure);
            }, onFailure);

    };

    FileStorage.prototype.moveFileEntry = function (fromFileEntry, toFilePath, onSuccess, onFailure) {
        if (!this.fs) {
            throw new Error("a4p.FileStorage is not yet initialized with its file system.");
        }
        var self = this;
        var names = toFilePath.split('/');
        var max = names.length - 1;
        var fileName = names[max];
        var dirs = [];
        for (var i = 0; i < max; i++) {
            if ((names[i] != '.') && (names[i] != '')) {
                dirs.push(names[i]);
            }
        }
        var dirOptions = {create:true, exclusive:false};
        getDirEntry(this.fs.root, dirOptions, dirs,
            function (dirEntry) {
    			fromFileEntry.moveTo(dirEntry, fileName, function (toFileEntry) {
                        if (onSuccess) {
                            onSuccess(toFileEntry);
                        }
                    }, function (fileError) {
                        if (onFailure) {
                            onFailure("move " + fileEntry.fullPath + " to " + dirEntry.fullPath + "/" + fileName + " failure : " + errorMessage(fileError));
                        }
                    });
            }, onFailure);

    };

    // Private API
    // helper functions and variables hidden within this function scope

    function errorMessage(fileError) {
        var msg = '';
        switch (fileError.code) {
            case FileError.NOT_FOUND_ERR:
                msg = 'File not found';
                break;
            case FileError.SECURITY_ERR:
                // You may need the --allow-file-access-from-files flag
                // if you're debugging your app from file://.
                msg = 'Security error';
                break;
            case FileError.ABORT_ERR:
                msg = 'Aborted';
                break;
            case FileError.NOT_READABLE_ERR:
                msg = 'File not readable';
                break;
            case FileError.ENCODING_ERR:
                msg = 'Encoding error';
                break;
            case FileError.NO_MODIFICATION_ALLOWED_ERR:
                msg = 'File not modifiable';
                break;
            case FileError.INVALID_STATE_ERR:
                msg = 'Invalid state';
                break;
            case FileError.SYNTAX_ERR:
                msg = 'Syntax error';
                break;
            case FileError.INVALID_MODIFICATION_ERR:
                msg = 'Invalid modification';
                break;
            case FileError.QUOTA_EXCEEDED_ERR:
                // You may need the --allow-file-access-from-files flag
                // if you're debugging your app from file://.
                msg = 'Quota exceeded';
                break;
            case FileError.TYPE_MISMATCH_ERR:
                msg = 'Type mismatch';
                break;
            case FileError.PATH_EXISTS_ERR:
                msg = 'File already exists';
                break;
            default:
                msg = 'Unknown FileError code (code= ' + fileError.code + ', type=' + typeof(fileError) + ')';
                break;
        };
        return msg;
    }

    function getDirEntry(dirEntry, dirOptions, dirs, onSuccess, onFailure) {
        if (dirs.length <= 0) {
            if (onSuccess) {
                onSuccess(dirEntry);
            }
        } else {
            var dirName = dirs[0];
            dirs = dirs.slice(1);
            dirEntry.getDirectory(dirName, dirOptions,
                function (dirEntry) {
                    if (dirs.length) {
                        getDirEntry(dirEntry, dirOptions, dirs, onSuccess, onFailure);
                    } else if (onSuccess) {
                        if (onSuccess) {
                            onSuccess(dirEntry);
                        }
                    }
                }, function (fileError) {
                    if (onFailure) {
                        onFailure("getDirectory " + dirName + " from " + dirEntry.fullPath + " failure : " + errorMessage(fileError));
                    }
                });
        }
    }

    function getFileEntry(rootEntry, filePath, fileOptions, onSuccess, onFailure) {
        var names = filePath.split('/');
        var max = names.length - 1;
        var fileName = names[max];
        var dirs = [];
        for (var i = 0; i < max; i++) {
            if ((names[i] != '.') && (names[i] != '')) {
                dirs.push(names[i]);
            }
        }
        var dirOptions;
        if (fileOptions.create) {
            dirOptions = {create:true, exclusive:false};
        } else {
            dirOptions = {create:false, exclusive:false};
        }
        getDirEntry(rootEntry, dirOptions, dirs,
            function (dirEntry) {
                dirEntry.getFile(fileName, fileOptions,
                    function (fileEntry) {
                        if (onSuccess) {
                            onSuccess(fileEntry);
                        }
                    }, function (fileError) {
                        if (onFailure) {
                            onFailure("getFile " + fileName + " from " + dirEntry.fullPath + " failure : " + errorMessage(fileError));
                        }
                    });
            }, onFailure);
    }

    function createBlobToReadByChunks(file, reader, onSuccess, onFailure, onProgress, from, length) {
        var start = parseInt(from) || 0;
        var stop = parseInt(length) || (file.size - start);
        if (onProgress) {
            reader.onloadstart = function (evt) {
                onProgress(0, stop - start);
            };
            reader.onprogress = function (evt) {
                if (evt.lengthComputable) {
                    //var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
                    onProgress(evt.loaded, evt.total);
                }
            };
            if (onSuccess) {
                reader.onloadend = function (evt) {
                    if (evt.target.readyState == FileReader.DONE) {
                        onProgress(stop - start, stop - start);
                        onSuccess(evt.target.result);
                    }
                };
            } else {
                reader.onloadend = function (evt) {
                    if (evt.target.readyState == FileReader.DONE) {
                        onProgress(stop - start, stop - start);
                    }
                };
            }
        } else if (onSuccess) {
            reader.onloadend = function (evt) {
                if (evt.target.readyState == FileReader.DONE) {
                    onSuccess(evt.target.result);
                }
            };
        }
        if (onFailure) {
            reader.onerror = function (fileError) {
                onFailure("FileReader " + file.fullPath + " failure : " + errorMessage(fileError));
            };
            reader.onabort = function (evt) {
                onFailure('Aborted by user');
            };
        }
        var blob = file.slice(start, stop);
        return blob;
    }

    // The public API for this module is the constructor function.
    // We need to export that function from this private namespace so that
    // it can be used on the outside.
    return FileStorage;
})(); // Invoke the function immediately to create this class.

// An auxiliary constructor for the FileStorage class.
a4p.PredefinedFileStorage = (function () {
    // Constructor
    function PredefinedFileStorage(fileSystem, grantedBytes) {
        this.version = "0.1";
        this.fs = fileSystem;
        this.grantedBytes = grantedBytes;
    }

    // Set the prototype so that PredefinedFileStorage creates instances of FileStorage
    PredefinedFileStorage.prototype = a4p.FileStorage.prototype;

    // The public API for this module is the constructor function.
    // We need to export that function from this private namespace so that
    // it can be used on the outside.
    return PredefinedFileStorage;
})(); // Invoke the function immediately to create this class.
