
/**
* File functions
**/

var gFileSystem 		= null;

function normalizedPath(dirPath, fileName, fileExtension) {
    var filePath = dirPath;
    if (filePath.charAt(filePath.length - 1) == '/') {
        if (fileName.charAt(0) == '/') {
            filePath = filePath.substring(0, filePath.length - 1) + fileName + '.' + fileExtension;
        } else {
            filePath = filePath + fileName + '.' + fileExtension;
        }
    } else {
        if (fileName.charAt(0) == '/') {
            filePath = filePath + fileName + '.' + fileExtension;
        } else {
            filePath = filePath + '/' + fileName + '.' + fileExtension;
        }
    }
    return filePath;
}

function transferErrorMessage(fileTransferError) {
    var msg = '';
    switch (fileTransferError.code) {
        case FileTransferError.FILE_NOT_FOUND_ERR:
            msg = 'File not found';
            break;
        case FileTransferError.CONNECTION_ERR:
            msg = 'Connection error';
            break;
        case FileTransferError.INVALID_URL_ERR:
            msg = 'Invalid URL error';
            break;
        default:
            msg = 'Unknown FileTransferError code (code= ' + fileTransferError.code + ', type=' + typeof(fileTransferError) + ')';
            break;
    }
    return msg;
}

var fileErrorHandler = function (e) {
	  var msg = 'Unknown Error - '+e.code;
    a4p.InternalLog.log('fileErrorHandler',e.code);

	  if (e.source) {
		  switch (e.code) {
			case FileTransferError.FILE_NOT_FOUND_ERR:
			      msg = 'FILE_NOT_FOUND_ERR';
			      break;
		    case FileTransferError.INVALID_URL_ERR:
			      msg = 'INVALID_URL_ERR';
			      break;
		    case FileTransferError.CONNECTION_ERR:
			      msg = 'CONNECTION_ERR';
			      break;
		  }
	  }
	  else {

		  switch (e.code) {
		    case FileError.QUOTA_EXCEEDED_ERR:
		      msg = 'QUOTA_EXCEEDED_ERR';
		      break;
		    case FileError.NOT_FOUND_ERR:
		      msg = 'NOT_FOUND_ERR';
		      break;
		    case FileError.SECURITY_ERR:
		      msg = 'SECURITY_ERR';
		      break;
		    case FileError.INVALID_MODIFICATION_ERR:
		      msg = 'INVALID_MODIFICATION_ERR';
		      break;
		    case FileError.INVALID_STATE_ERR:
				  msg = 'INVALID_STATE_ERR';
				  break;
		    case FileError.NO_MODIFICATION_ALLOWED_ERR:
				  msg = 'NO_MODIFICATION_ALLOWED_ERR';
				  break;
		    case FileError.SYNTAX_ERR:
				  msg = 'SYNTAX_ERR';
				  break;
		    case FileError.TYPE_MISMATCH_ERR:
				  msg = 'TYPE_MISMATCH_ERR';
				  break;
		    case FileError.PATH_EXISTS_ERR:
				  msg = 'PATH_EXISTS_ERR';
				  break;
		  };
	  }

	  if (e.source) msg = msg+' error source ' + e.source;
	  if (e.target) msg = msg+' error target ' + e.target;
	  if (e.description) msg = msg+' error description ' + e.description;

    a4p.InternalLog.log('fileErrorHandler','File Error: ' + msg);
	  onFillCompleted(false);
    a4p.InternalLog.log('fileErrorHandler','onFillCompleted : false');
};


//showFileInFS
function showFileInFS(fileRelPath, fileName, fileExtension) {

    a4p.InternalLog.log('showFileInFS',fileRelPath +'  Name:'+ fileName+'  Extension:'+ fileExtension);

	try {

		var localPath = gFileSystem.root.fullPath;
		if (device.platform === "Android" && localPath.indexOf("file://") === 0) {
            localPath = localPath.substring(7);
        }

		var fullPath =  localPath + fileRelPath+ fileName;
        a4p.InternalLog.log('showFileInFS','get file : '+fullPath);

		openChildBrowser(fullPath,fileExtension);
	}
	catch(e) {
		fileErrorHandler(e);
	}
};

//getFileSystem
function getFileSystem(success,arg1,arg2,arg3) {

	if(gFileSystem) {

        a4p.InternalLog.log('getFileSystem','allready did : launch');
		return success(arg1,arg2,arg3);
	}
	else if (window.requestFileSystem) {


		try {
            a4p.InternalLog.log('getFileSystem','window.requestFileSystem');
			window.requestFileSystem(	LocalFileSystem.PERSISTENT
					,10*1024*1024
					,function(fs) {
                    a4p.InternalLog.log('getFileSystem','get FileSystem');
				gFileSystem = fs;
				return success(arg1,arg2,arg3);
			}
			,fileErrorHandler);

		}
		catch(e) {
			fileErrorHandler(e);
		}
	}
	else {
        a4p.InternalLog.log('getFileSystem','Impossible to use file, No FileSystem !');
	}
};
