'use strict';

// Namespace a4p
var a4p;
if (!a4p) a4p = {};

a4p.TaskSender = (function()
{
    // Constructor
    function TaskSender(senderName, http, localStorage)
    {
        this.version = "0.1";
        // Unique name of this instance == key to find all its data in Local and File storages
        this.senderName = senderName;
        this.http = http;
        if (localStorage) {
            this.localStorage = localStorage;
        } else {
            var LocalStorage = a4p.LocalStorageFactory(window.localStorage);
            this.localStorage = new LocalStorage();// 5 Mo
        }

        // Restore tasks not yet sent from local storage
        this.todoTasks = this.localStorage.get('TaskSender-'+senderName+'-todoTasks', {});
        this.sentTasks = this.localStorage.get('TaskSender-'+senderName+'-sentTasks', {});
        this.ackTasks = this.localStorage.get('TaskSender-'+senderName+'-ackTasks', {});
        this.waitingDone = {};
        this.defs = {};
        this.synchronizing = {};
    }

    // Public API

    /**
     * Clear task list (use it only if you know what you are doing).
     *
     * @param {String} fifoName - Name of task list to synchronize with server.
     */
    TaskSender.prototype.clearTaskList = function (fifoName) {
        fifoName = fifoName || '';
        //return;
        var def = this.defs[fifoName];
        if (def) {
            this.waitingDone[fifoName] = false;
            this.todoTasks[fifoName] = [];
            this.localStorage.set('TaskSender-'+this.senderName+'-todoTasks', this.todoTasks);
            this.sentTasks[fifoName] = [];
            this.localStorage.set('TaskSender-'+this.senderName+'-sentTasks', this.sentTasks);
            this.ackTasks[fifoName] = [];
            this.localStorage.set('TaskSender-'+this.senderName+'-ackTasks', this.ackTasks);
        } else {
            throw new Error("TaskSender.clearTaskList() called on undefined task list '" + fifoName + "'.");
        }
    }

    /**
     * Define a client task.
     *
     * The onAck is called with 2 arguments (id, ack attributes of the task acknowledged by the server)
     * for eack acknowledged task received from server upon synchronization.
     * Only one onAck callback is called at a time (upon the oldest acknowledged task received).
     * This onAck callback is called again on next task only after the current onAck callback has run.
     *
     * @param {String} fifoName - Name of task list to synchronize with server.
     * @param {function} onAck - Callback to call with 2 arguments (id, ack attributes of the task).
     */
    TaskSender.prototype.defineTaskList = function (fifoName, serverUrl, onAck) {
        fifoName = fifoName || '';
        var def;
        if (this.defs[fifoName]) {
            def = this.defs[fifoName];
            def.serverUrl = serverUrl;
            def.onAck = onAck;
        } else {
            def = {
                'serverUrl':serverUrl,
                'onAck':onAck
            };
            this.defs[fifoName] = def;
        }
        if (!this.todoTasks[fifoName]) {
            this.todoTasks[fifoName] = [];
        }
        if (!this.sentTasks[fifoName]) {
            this.sentTasks[fifoName] = [];
        }
        if (!this.waitingDone[fifoName]) {
            this.waitingDone[fifoName] = false;
        }
        if (this.ackTasks[fifoName]) {
            nextAck(this, fifoName);
        } else {
            this.ackTasks[fifoName] = [];
        }
        this.synchronizing[fifoName] = false;
    }

    /**
     * Instruct a new server task, which will be sent to server during next synchronize().
     *
     * @param {String} fifoName - Name of task list to synchronize with server.
     * @param {String} id - Id of the task which must be returned by server in its acknowledgment.
     * @param {String} action - Action of the task.
     * @param {any} data - Data send along with the task to the server.
     */
    // Called by user for each task executed via a callback onAction to instruct TaskSender to launch next task
    TaskSender.prototype.todoTask = function (fifoName, id, action, data) {
        fifoName = fifoName || '';
        var def = this.defs[fifoName];
        if (def) {
            action = action || '';
            data = data || null;
            var todoTasks = this.todoTasks[fifoName];
            var nb = todoTasks.length;
            for (var i = 0; i < nb; i++) {
                if (id == todoTasks[i].id) {
                    throw new Error("TaskSender.todoTask() called on already defined todo task '" + id + "'.");
                }
            }
            todoTasks.push({'id':id, 'action':action, 'data':data});
            this.localStorage.set('TaskSender-'+this.senderName+'-todoTasks', this.todoTasks);
        } else {
            throw new Error("TaskSender.todoTask() called on undefined task list '" + fifoName + "'.");
        }
    }

    /**
     * Get client tasks from a server url.
     *
     * @param {String} fifoName - Name of task list to synchronize with server.
     * @param {function} onSuccess - Callback to call if synchronization is a success. It is called before onAction callback of tasks defined in defineTaskList().
     * @param {function} onFailure - Callback to call with a message as argument if synchronization is a failure.
     */
    TaskSender.prototype.synchronize = function (fifoName, onSuccess, onFailure) {
        fifoName = fifoName || '';
        var def = this.defs[fifoName];
        var self = this;
        if (def && !self.synchronizing[fifoName]) {
            var oldTodo = [];
            var todoTasks = self.todoTasks[fifoName];
            var nb = todoTasks.length;
            for (var i = 0; i < nb; i++) {
                oldTodo.push(todoTasks[i].id);
            }
            var oldNb = oldTodo.length;
            var onSuccessFct = function (data, status, headers, config) {
                self.synchronizing[fifoName] = false;
                var def = self.defs[fifoName];
                // Move todo tasks transmitted during this http request into sent tasks
                var todoTasks = self.todoTasks[fifoName];
                var sentTasks = self.sentTasks[fifoName];
                for (var i = 0; i < oldNb; i++) {
                    var id = oldTodo[i];
                    var idxRemove = 0;
                    var nb = todoTasks.length;
                    var found = false;
                    for (idxRemove = 0; idxRemove < nb; idxRemove++) {
                        if (id == todoTasks[idxRemove].id) {
                            found = true;
                            break;
                        }
                    }
                    if (found) {
                        sentTasks.push(todoTasks[idxRemove].id);
                        todoTasks.splice(idxRemove, 1);
                    } else {
                        // unknown sent task
                        a4p.ErrorLog.log('a4p.TaskSender', "Unknown sent server task id='" + id + "'");
                    }
                }
                //self.todoTasks[fifoName] = todoTasks;
                self.localStorage.set('TaskSender-' + self.senderName + '-todoTasks', self.todoTasks);
                // Move sent tasks acknowledged by this http answer into ack tasks
                var ackTasks = self.ackTasks[fifoName];
                var nb = data.length;
                for (var i = 0; i < nb; i++) {
                    var task = data[i];
                    // task.id == unique id from server to ack task
                    // task.ack is acknowledgment result
                    var found = false;
                    var nb = sentTasks.length;
                    var idxRemove = 0;
                    for (idxRemove = 0; idxRemove < nb; idxRemove++) {
                        if (task.id == sentTasks[idxRemove]) {
                            found = true;
                            break;
                        }
                    }
                    if (found) {
                        ackTasks.push({'id':task.id, 'ack':task.ack});
                        sentTasks.splice(idxRemove, 1);
                    } else {
                        // unknown ack task
                        a4p.ErrorLog.log('a4p.TaskSender', "Unknown ack server task id='" + task.id + "' ack='" + task.ack + "'");
                    }
                }
                self.localStorage.set('TaskSender-' + self.senderName + '-sentTasks', self.sentTasks);
                self.localStorage.set('TaskSender-' + self.senderName + '-ackTasks', self.ackTasks);
                onSuccess();
                if (!self.waitingDone[fifoName]) {
                    nextAck(self, fifoName);
                }
            };
            var onFailureFct = function (data, status, headers, config) {
                self.synchronizing[fifoName] = false;
                onFailure('status=' + status + ' ' + (data || "Request failed"));
            }
            self.synchronizing[fifoName] = true;
            this.http.post(def.serverUrl, todoTasks).success(onSuccessFct).error(onFailureFct);
        } else {
            throw new Error("TaskSender.synchronize() called on undefined task list '" + fifoName + "'.");
        }
    };

    /**
     * Instruct end of one task.
     * It should be called for each onAck callback of tasks defined in defineTaskList().
     *
     * @param {String} fifoName - Name of task list to synchronize with server.
     */
    // Called by user for each task executed via a callback onAck to instruct TaskSender to launch next ack task
    TaskSender.prototype.doneTask = function (fifoName) {
        fifoName = fifoName || '';
        var def = this.defs[fifoName];
        if (def && this.waitingDone[fifoName]) {
            this.waitingDone[fifoName] = false;
            var ackTasks = this.ackTasks[fifoName];
            var task = ackTasks.shift();
            this.localStorage.set('TaskSender-'+this.senderName+'-ackTasks', this.ackTasks);
            nextAck(this, fifoName);
        } else {
            throw new Error("TaskSender.doneTask() called on undefined task list '" + fifoName + "'.");
        }
    }

    TaskSender.prototype.nbTaskTodo = function (fifoName) {
        fifoName = fifoName || '';
        var todoTasks = this.todoTasks[fifoName];
        return todoTasks ? todoTasks.length : 0;
    }

    TaskSender.prototype.nbTaskSent = function (fifoName) {
        fifoName = fifoName || '';
        var sentTasks = this.sentTasks[fifoName];
        return sentTasks ? sentTasks.length : 0;
    }

    TaskSender.prototype.nbTaskAck = function (fifoName) {
        fifoName = fifoName || '';
        var ackTasks = this.ackTasks[fifoName];
        return ackTasks ? ackTasks.length : 0;
    }

    // Private API
    // helper functions and variables hidden within this function scope

    function nextAck(self, fifoName) {
        var ackTasks = self.ackTasks[fifoName];
        var nbTask = ackTasks.length;
        if (nbTask > 0) {
            var def = self.defs[fifoName];
            var task = ackTasks[0];
            self.waitingDone[fifoName] = true;
            def.onAck(task.id, task.ack);
        }
    }

    // The public API for this module is the constructor function.
    // We need to export that function from this private namespace so that
    // it can be used on the outside.
    return TaskSender;
})(); // Invoke the function immediately to create this class.
