'use strict';

// Namespace a4p
var a4p;
if (!a4p) a4p = {};

a4p.TaskReceiver = (function()
{
    // Constructor
    function TaskReceiver(receiverName, http, localStorage)
    {
        this.version = "0.1";
        // Unique name of this instance == key to find all its data in Local and File storages
        this.receiverName = receiverName;
        this.http = http;
        if (localStorage) {
            this.localStorage = localStorage;
        } else {
            var storage = a4p.LocalStorageFactory(window.localStorage);
            this.localStorage = new storage();// 5 Mo
        }
        // Restore tasks not yet done from local storage
        this.todoTasks = this.localStorage.get('TaskReceiver-'+receiverName+'-todoTasks', {});
        this.doneTasks = this.localStorage.get('TaskReceiver-'+receiverName+'-doneTasks', {});
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
    TaskReceiver.prototype.clearTaskList = function (fifoName) {
        fifoName = fifoName || '';
        //return;
        var def = this.defs[fifoName];
        if (def) {
            this.waitingDone[fifoName] = false;
            this.todoTasks[fifoName] = [];
            this.localStorage.set('TaskReceiver-'+this.receiverName+'-todoTasks', this.todoTasks);
            this.doneTasks[fifoName] = [];
            this.localStorage.set('TaskReceiver-'+this.receiverName+'-doneTasks', this.doneTasks);
        } else {
            throw new Error("TaskReceiver.clearTaskList() called on undefined task list '" + fifoName + "'.");
        }
    }

    /**
     * Define a client task.
     *
     * The onAction is called with 3 arguments (id, action and data attributes of the task given by the server)
     * for the oldest task received from server upon synchronization or reboot.
     * Only one onAction callback is called at a time (upon the oldest task received).
     * This onAction callback is called again on this same task only if the TaskReceiver is recreated (at the reboot of the application for example).
     * This onAction callback is called again on next task only after the current task has been acknowledged by doneTask().
     *
     * @param {String} fifoName - Name of task list to synchronize with server.
     * @param {function} onAction - Callback to call with 3 arguments (id, action and data attributes of the task).
     */
    TaskReceiver.prototype.defineTaskList = function (fifoName, serverUrl, onAction) {
        fifoName = fifoName || '';
        var def;
        if (this.defs[fifoName]) {
            def = this.defs[fifoName];
            def.serverUrl = serverUrl;
            def.onAction = onAction;
        } else {
            def = {
                'serverUrl':serverUrl,
                'onAction':onAction
            };
            this.defs[fifoName] = def;
        }
        if (!this.doneTasks[fifoName]) {
            this.doneTasks[fifoName] = [];
        }
        if (!this.waitingDone[fifoName]) {
            this.waitingDone[fifoName] = false;
        }
        if (this.todoTasks[fifoName]) {
            nextTodo(this, fifoName);
        } else {
            this.todoTasks[fifoName] = [];
        }
        this.synchronizing[fifoName] = false;
    }

    /**
     * Get client tasks from a server url.
     *
     * @param {String} fifoName - Name of task list to synchronize with server.
     * @param {function} onSuccess - Callback to call if synchronization is a success. It is called before onAction callback of tasks defined in defineTaskList().
     * @param {function} onFailure - Callback to call with a message as argument if synchronization is a failure.
     */
    TaskReceiver.prototype.synchronize = function (fifoName, onSuccess, onFailure) {
        fifoName = fifoName || '';
        var def = this.defs[fifoName];
        var self = this;
        if (def && !self.synchronizing[fifoName]) {
            var oldDone = [];
            var doneTasks = self.doneTasks[fifoName];
            var nb = doneTasks.length;
            for (var i = 0; i < nb; i++) {
                oldDone.push(doneTasks[i].id);
            }
            var oldNb = oldDone.length;
            var onSuccessFct = function (data, status, headers, config) {
                self.synchronizing[fifoName] = false;
                var def = self.defs[fifoName];
                var todoTasks = self.todoTasks[fifoName];
                var doneTasks = self.doneTasks[fifoName];
                var nb = data.length;
                for (var i = 0; i < nb; i++) {
                    var task = data[i];
                    // task.id == unique id from server to ack task
                    // task.action == 'clear', 'add' or 'remove'
                    // task.data is adapted to onAction() callbacks
                    todoTasks.push({'id':task.id, 'action':task.action, 'data':task.data});
                }
                self.localStorage.set('TaskReceiver-' + self.receiverName + '-todoTasks', self.todoTasks);
                // Remove old done, but keep new dones not transmitted during this http request
                for (var i = 0; i < oldNb; i++) {
                    var id = oldDone[i];
                    var idxRemove = 0;
                    var nb = doneTasks.length;
                    var found = false;
                    for (idxRemove = 0; idxRemove < nb; idxRemove++) {
                        if (id == doneTasks[idxRemove].id) {
                            found = true;
                            break;
                        }
                    }
                    if (found) {
                        doneTasks.splice(idxRemove, 1);
                    } else {
                        // unknown done task
                        a4p.ErrorLog.log('a4p.TaskReceiver',
                            "Unknown done client task id='" + id + "'. Have you cleared TaskReceiver before receiving the ack ?");
                    }
                }
                //self.doneTasks[fifoName] = doneTasks;
                self.localStorage.set('TaskReceiver-' + self.receiverName + '-doneTasks', self.doneTasks);
                onSuccess();
                if (!self.waitingDone[fifoName]) {
                    nextTodo(self, fifoName);
                }
            };
            var onFailureFct = function (data, status, headers, config) {
                self.synchronizing[fifoName] = false;
                onFailure('status=' + status + ' ' + (data || "Request failed"));
            }
            self.synchronizing[fifoName] = true;
            this.http.post(def.serverUrl, doneTasks).success(onSuccessFct).error(onFailureFct);
        } else {
            throw new Error("TaskReceiver.synchronize() called on undefined task list '" + fifoName + "'.");
        }
    };

    /**
     * Instruct end of one task.
     * It should be called for each onAction callback of tasks defined in defineTaskList().
     *
     * @param {String} fifoName - Name of task list to synchronize with server.
     * @param {any} ack - Data send along with the acknowledgment to the server.
     */
    // Called by user for each task executed via a callback onAction to instruct TaskReceiver to launch next task
    TaskReceiver.prototype.doneTask = function (fifoName, ack) {
        fifoName = fifoName || '';
        var def = this.defs[fifoName];
        if (def && this.waitingDone[fifoName]) {
            this.waitingDone[fifoName] = false;
            ack = ack || null;
            var todoTasks = this.todoTasks[fifoName];
            var task = todoTasks.shift();
            this.localStorage.set('TaskReceiver-'+this.receiverName+'-todoTasks', this.todoTasks);
            var doneTasks = this.doneTasks[fifoName];
            doneTasks.push({'id':task.id, 'ack':ack});
            this.localStorage.set('TaskReceiver-'+this.receiverName+'-doneTasks', this.doneTasks);
            nextTodo(this, fifoName);
        }
    }

    TaskReceiver.prototype.nbTaskTodo = function (fifoName) {
        fifoName = fifoName || '';
        var todoTasks = this.todoTasks[fifoName];
        return todoTasks ? todoTasks.length : 0;
    }

    TaskReceiver.prototype.nbTaskDone = function (fifoName) {
        fifoName = fifoName || '';
        var doneTasks = this.doneTasks[fifoName];
        return doneTasks ? doneTasks.length : 0;
    }

    // Private API
    // helper functions and variables hidden within this function scope

    function nextTodo(self, fifoName) {
        var todoTasks = self.todoTasks[fifoName];
        var nbTask = todoTasks.length;
        if (nbTask > 0) {
            var def = self.defs[fifoName];
            var task = todoTasks[0];
            self.waitingDone[fifoName] = true;
            def.onAction(task.id, task.action, task.data);
        }
    }

    // The public API for this module is the constructor function.
    // We need to export that function from this private namespace so that
    // it can be used on the outside.
    return TaskReceiver;
})(); // Invoke the function immediately to create this class.
