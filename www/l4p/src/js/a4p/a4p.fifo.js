
/**
* @fileOverview Fifo functions
*
**/


'use strict';

//Namespace a4p
var a4p;
if (!a4p) a4p = {};

//function to encode objects to JSON strings
var json_encode = $.toJSON || Object.toJSON || (window.JSON && (JSON.encode || JSON.stringify));

//function to decode objects from JSON strings
var json_decode = $.evalJSON || (window.JSON && (JSON.decode || JSON.parse)) || function(str){
 return String(str).evalJSON();
};


a4p.Fifo = (function(){

	function Fifo(uid) {
		if (a4p.isUndefined(uid)) uid = 'xxx';

		this.mSQLFifoName = 'a4p.'+uid+'.sql';
		this.mJSFuncFifoName = 'a4p.'+uid+'.js.function';
		this.mJSArgsFifoName = 'a4p.'+uid+'.js.params';
		this.mMsgFifoName = 'a4p.'+uid+'.msg';
		this.mMailFifoName = 'a4p.'+uid+'.mail';
		this.mPb = false;

	}


	Fifo.prototype.clear = function() {

		var bok = true;
        a4p.InternalLog.log('fifoClear');

		//window.localStorage.setItem('config_JS_Fifo','');
		//window.localStorage.setItem('a4p.c4p.fifo.js.function','');
		//window.localStorage.setItem('a4p.c4p.fifo.js.params','');

		//$.jStorage.deleteKey(this.mSQLFifoName);
		//$.jStorage.deleteKey(this.mJSFuncFifoName);
		//$.jStorage.deleteKey(this.mJSArgsFifoName);

		// ?
		$.jStorage.set(this.mSQLFifoName,'');
		$.jStorage.set(this.mJSFuncFifoName,'');
		$.jStorage.set(this.mJSArgsFifoName,'');
		$.jStorage.set(this.mMailFifoName,'');

		//var msgs = this.getErrors(true);
		//var msgs_ = msgs.splice(0,10);
		$.jStorage.set(this.mMsgFifoName,'');//$.jStorage.set(this.mMsgFifoName,msgs_);

		return bok;
	};


	Fifo.prototype.getFuncFifoName = function() {
		return this.mJSFuncFifoName;
	};
	Fifo.prototype.getArgsFifoName = function() {
		return this.mJSArgsFifoName;
	};


	Fifo.prototype.getSQL = function(bRemoveAfter) {

		//var bok = true;

		//var fifo = window.localStorage.getItem('config_JS_Fifo');
		var fifo = $.jStorage.get(this.mSQLFifoName);

        a4p.InternalLog.log('fifoGetSQL',fifo);

		if(bRemoveAfter)
			$.jStorage.set(this.mSQLFifoName,'');
		if(fifo==null)
			return '';
		return fifo;

	};

	Fifo.prototype.addSQL = function(sql) {

		var bok = true;
        a4p.InternalLog.log('fifoAddSQL',sql);

		if (a4p.isUndefined(sql) || (sql.length === 0) || !sql)
			return false;

		var fifo = this.getSQL();
		fifo += sql;
		//window.localStorage.setItem('config_JS_Fifo', fifo);

		$.jStorage.set(this.mSQLFifoName, fifo);

		return bok;

	};

	//var fifoUnwrapFunction = function(fn, context, params) {
	//    return function() {
	  //  	return context[fn](params);
	    	//fn.apply(context);
	    	//context[func].apply(this, args);
	    	//eval(fn);
	  //  };
	//};

	Fifo.prototype.getArray = function(fifoName) {

		var fifo = $.jStorage.get(fifoName);

		if (fifo.length === 0)
			fifo = new Array();
		//var json = new Array();

		//try {
		//	json = json_decode(fifoJSON);
		//}
		//catch(err){
			//json = "{}";
		//}

		return fifo;
	};



	Fifo.prototype.callJS = function(bRemoveAfter, success) {

		var count = 0;
		var anyPb = false;
        a4p.InternalLog.log('fifoCallJS',bRemoveAfter);

		var funcs = this.getArray(this.mJSFuncFifoName);
		var args = this.getArray(this.mJSArgsFifoName);

		var funcsAfter = funcs.slice(0);
		var argsAfter = args.slice(0);

		//var fifoFunction = JSON.parse(fifoFunctionJSON);
		//var fifoParams = JSON.parse(fifoParamsJSON);//decodeURIComponent(JSON.parse(fifoParamsJSON));

		//var funqueue = [];
		for (var i in funcs) {
            if (!funcs.hasOwnProperty(i)) continue;
            var func = json_decode(funcs[i]);
            var arg = json_decode(args[i]);
            //var f = this[func](arg);

            a4p.InternalLog.log('fifoCallJS','func:'+func+' args:'+arg);
            var bok = (function(){
                        try{
                            var ok = window[func](arg); //TODO MLE bad context
                            if (ok == false)
                                return false;
                        }
                        catch(e) {
                            a4p.InternalLog.log('fifoCallJS','Pb : '+e.message);
                            return false;
                        }
                        return true;
                    })();
            //funqueue.push(f);

          // If func ok - remove from fifo
            //if (!bok) break;
            if (!bok) {
                setMessage('pb_fifo','func:'+func+' args:'+arg); //TODO to remove from class
                anyPb = true;
            }

            if (bRemoveAfter) {
                    funcsAfter.splice(0,1);
                    argsAfter.splice(0,1);
            }
            count += 1;
		}

		// Remove and execute all items in the array
		//while (funqueue.length > 0 && bok) {
		//	bok = (funqueue.shift())();
		//}


		$.jStorage.set(this.mJSFuncFifoName,funcsAfter);
		$.jStorage.set(this.mJSArgsFifoName,argsAfter);


		// if all ok - success
		if (count == funcs.length && success)
			(success)();

		if (count > 0)
			this.mPb = anyPb;

		//return fifo;
		//config_JS_Fifo
		//$render .= "\n window.localStorage.setItem('config_JS_Fifo', ''+window.localStorage.getItem('config_JS_Fifo') + \"".$req_str.";\");";
		//...
		//var storedNames=JSON.parse(localStorage['names']);

		return count;
	};


	Fifo.prototype.addJS = function(fn, params, forceDuplicate) {

        a4p.InternalLog.log('fifoAddJS','fn:'+fn+' p:'+params);

	    if (typeof fn === 'function') {
            a4p.ErrorLog.log('fifoAddJS','ERROR not a function name');
	   		return false;
	   	}

		var funcs = this.getArray(this.mJSFuncFifoName);
		var args = this.getArray(this.mJSArgsFifoName);

		var funcsCount = funcs.length;
		var argsCount = args.length;

		var fifoFunction = fn;


		//if (typeof fn === 'function')
		//if (!typeof fn === 'function')
			//fifoFunction = fn.toString();//fn.name;
			//fifoFunction = fn;
		//var fifoParams = el;//$.param(params);

		if (a4p.isUndefined(params) || !params || params == null)
			params = "";

	    var testStorage_elm = document.createElement('a4pFifo');
	    testStorage_elm.setAttribute('Params', json_encode(params));
	    var elArgs = testStorage_elm.getAttribute('Params');

	    testStorage_elm.setAttribute('Func', json_encode(fifoFunction));
	    var elFunc = testStorage_elm.getAttribute('Func');
	    //testStorage_elm.save("mleStroage");

	    //$.jStorage.set('mleTest',elArgs);

		//JSON.stringify(
		//var recursiveEncoded = $.param(myObject);
		//var recursiveDecoded = decodeURIComponent($.param(myObject));
	    forceDuplicate = (a4p.isDefined(forceDuplicate) && (forceDuplicate == true));

	    var insert = true;
	    if (!forceDuplicate) {
	        for (var i=0; i<funcsCount && i<argsCount; i++) {
	            if ((funcs[i] === elFunc) && (args[i] === elArgs)) {
	                insert = false;
	            }
	        }
	    }
		if (insert) {
            a4p.InternalLog.log('fifoAddJS','INSERT elFunc:'+elFunc+' elArgs:'+elArgs);
			funcs[funcsCount] = elFunc;
			args[argsCount] = elArgs;
	        $.jStorage.set(this.mJSFuncFifoName,funcs);
	       	$.jStorage.set(this.mJSArgsFifoName,args);
	        return true;
		} else {
            a4p.InternalLog.log('fifoAddJS', 'IGNORED because already inserted in fifo');
	        return false;
	    }
	};



	Fifo.prototype.launch = function() {


        a4p.InternalLog.log('fifoLaunch');

		//if (!navigator.onLine)
		if (!checkConnection())
		{

            a4p.InternalLog.log('fifoLaunch','Offline');
			a4pSpinner.setOffline();
			return;
		}

		if(!gYouCanUpdate){

			setMessage('pb_limite_refresh');
            a4p.InternalLog.log('fifoLaunch','You can\'t update twice in 5 minutes');
			return;
		}
		//var bok = fifoAddJS('fillDB');
		//bok = fifoAddJS(fillDB,{});



		// spinner is turning
		a4pSpinner.setOffline(false);
		a4pSpinner.run();


		var count = this.callJS(true,function(){});

		// no JS : stop spinner
		if (count == 0) {
			//onFillCompleted(false);
			a4pSpinner.done(this.mPb);
		}


		/*$(someElement).queue(dothis).queue(dothat);

		function dothis(next) {
		    // do something
		    someCallback( function() {
		        next();
		    });
		}

		function dothat(next) {
		    // do more
		    next();
		}


		setTimeout(fifoLaunch,300);*/

		return count;

	};

	Fifo.prototype.getErrors = function(bRemoveAfter) {

		//a4p.InternalLog.log('fifoGetErrors');
		var msgs = this.getArray(this.mMsgFifoName);

		if (bRemoveAfter && bRemoveAfter == true) {
			$.jStorage.set(this.mMsgFifoName,'');
		}

		return msgs;
	};

	Fifo.prototype.addError = function(msg) {

		var msgs = this.getErrors();
		var date = new Date(); //DateJS

		var msgEl = {
				text : msg,
				date : date.toString('dd-MM-yy HH:mm:ss')
		};

		var testStorage_elm = document.createElement('Msg');
		testStorage_elm.setAttribute('Msg',json_encode(msgEl));
		var el = testStorage_elm.getAttribute('Msg');

		msgs[msgs.length] = el;

		$.jStorage.set(this.mMsgFifoName,msgs);

		return true;
	};


	Fifo.prototype.addMail = function() {

		var bok = true;
        a4p.InternalLog.log('fifoAddMail');

		var mails = this.getArray(this.mMailFifoName);
		mails[mails.length] = '';
		$.jStorage.set(this.mMailFifoName,mails);

		return bok;
	};


	Fifo.prototype.getMailCount = function(bErase) {

		var mails = this.getArray(this.mMailFifoName);
		var count = mails.length;

        a4p.InternalLog.log('fifoGetMailCount',count);

		if (bErase && bErase == true) {

            a4p.InternalLog.log('fifoGetMailCount','erase');
			$.jStorage.set(this.mMailFifoName,'');
		}

		return count;
	};

	return Fifo;
})();



var a4pFifo = new a4p.Fifo('a4p');

//TODO CCN refactor



