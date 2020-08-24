/*
 * unitymediaupload.js (as part of UnityMediaUpload server)
 *
 * Description: Implementation of unitymediaupload.js route on the server.
 *
 * Documentation:
 * - upload binary data to server via HTTP PUT request
 * - file storage based on (sub-)directory management, for instance to represent different session of the uploading client (e.g., Unity application)
 * - configuration for user ownership of uploaded files
 * - quality-of-life HTTP GET API for convenient access / listing of available files on server
 *
 * Supported Node.js: 4.2.6 (tested)
 *
 * Author: Nico Reski
 * Web: https://reski.nicoversity.com
 * Twitter: @nicoversity
 * GitHub: https://github.com/nicoversity
 * 
 */

// overall express / router setup
var express = require('express');
const fs = require('fs');
var router = express.Router();

// user / group ID for ownership rewrite of uploaded files
// determine UID (Ubuntu): `id -u <username>`
var USER_GROUP_ID = 1001;

// directory path for uploaded files on server
var UNITY_UPLOADED_MEDIA_FILES_DIRECTORY = "data/unity_uploaded_media_files/";

// server API url (HTTP GET request) for requesting access to an uploaded file
// Note: This should correspond with the overall server configurations in app.js and /bin/www
var SERVER_FILE_ACCESS_GET_URL = "https://USER_SERVER_URL:USER_PORT/umu/getfile/";


// === SERVER UPLOAD API ===
//

// API CALL: upload binary data (file extension passed along within filename)
router.put('/uploadbinarydata/:directory/:filename', function(req, res) {
    
    // DEBUG
    //console.log("uploadbinary via HTTP PUT request")
    //console.log(req.params.directory);
    //console.log(req.params.filename);

    // extract directory and filename for data storage from API CALL (URL) parameters
    var directory = req.params.directory;
    var filename  = req.params.filename;     // NOTE: filename needs to include the file extension (e.g. .png)

    // prepare path to directory and file
    var directoryPathOnServer = UNITY_UPLOADED_MEDIA_FILES_DIRECTORY + directory;
    var filePathOnServer      = directoryPathOnServer + "/" + filename;

    // setup body for binary (raw) data as well as event calls
    req.rawBody = '';
    req.setEncoding('binary');

    // event listener: more data is incoming: append to already collected data
    req.on('data', function(chunk) { 
        req.rawBody += chunk;
    });

    // event listener: all data has been received
    req.on('end', function() {
        
        // check if directory already exists (and if not, create it)
        if (!fs.existsSync(directoryPathOnServer)){

        	// create directory
            fs.mkdirSync(directoryPathOnServer);

            // change directory ownership
            fs.chownSync(directoryPathOnServer, USER_GROUP_ID, USER_GROUP_ID);
        }

        // use file system to write binary data to file
        fs.appendFile(filePathOnServer, req.rawBody, 'binary', function (err)
        {
            // enable CORS (Server-Side Access Control)
            // documentation: [ https://developer.mozilla.org/en-US/docs/Web/HTTP/Server-Side_Access_Control ]
            // implementation apapted via: [ https://stackoverflow.com/a/7069902 ]
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            res.header('Access-Control-Allow-Headers', 'Content-Type');

            // check if there was an error writing to the file
            if (err) 
                res.status(500).send({ 'status' : 'error', 'status_code' : 500, 'code' : err.code, 'description' : 'Upload binary data from Unity was not successful.' } );
            // file was written successfully
            else
            {
            	// change file ownership:
            	// Ubuntu: determine UID -> `id -u <username>`
            	fs.chownSync(filePathOnServer, USER_GROUP_ID, USER_GROUP_ID);

            	// send response
                res.status(200).send({ 'status' : 'ok', 'status_code' : 200, 'description' : 'Upload binary data from Unity was successful.' } );
            }
        });
    });
});


// === SERVER FILE ACCESS API ===
//

// API CALL: receive information about all available directories
router.get('/listalldirectories', function(req, res) {

    // enable CORS (Server-Side Access Control)
    // documentation: [ https://developer.mozilla.org/en-US/docs/Web/HTTP/Server-Side_Access_Control ]
    // implementation apapted via: [ https://stackoverflow.com/a/7069902 ]
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    // check if uploaded media root directory exists
    if (fs.existsSync(UNITY_UPLOADED_MEDIA_FILES_DIRECTORY)){

    	// access directory
        fs.readdir(UNITY_UPLOADED_MEDIA_FILES_DIRECTORY, function(err, directories) {
             
            // collect information about all available (sub-)directories
            var directoryArray = [];
            for (var i=0; i<directories.length; i++) {
                directoryArray.push( directories[i] );
            }

            // send response
            res.status(200).send({ 'status' : 'ok', 'status_code' : 200, 'directories' : directoryArray });
        });
    }
    else
    {
        res.status(404).send({ 'status' : 'not found', 'status_code' : 404, 'description' : '' } );
    }
});

// API call: get information (access urls) to the content of the latest uploaded media directory
router.get('/getlatestmediafiles', function(req, res) {

    // enable CORS (Server-Side Access Control)
    // documentation: [ https://developer.mozilla.org/en-US/docs/Web/HTTP/Server-Side_Access_Control ]
    // implementation apapted via: [ https://stackoverflow.com/a/7069902 ]
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

	// check if uploaded media root directory exists
    if (fs.existsSync(UNITY_UPLOADED_MEDIA_FILES_DIRECTORY)){

    	// access directory
        fs.readdir(UNITY_UPLOADED_MEDIA_FILES_DIRECTORY, function(err, directories) {
       
            // get latest (== last directory)
            var latestDirectory = directories[directories.length - 1];

          	// access latest directory  
            fs.readdir(UNITY_UPLOADED_MEDIA_FILES_DIRECTORY + latestDirectory, function(err, files) {
             
             	// collect all content in the directory
                var fileArray = [];
                for (var i=0; i<files.length; i++) {
                    fileArray.push( SERVER_FILE_ACCESS_GET_URL + latestDirectory + "/" + files[i] );
                }

                // send response
                res.status(200).send({ 'status' : 'ok', 'status_code' : 200, 'directory' : latestDirectory, 'files' : fileArray });
            });
        });
    }
    else
    {
        res.status(404).send({ 'status' : 'not found', 'status_code' : 404, 'description' : '' } );
    }
});

// API call: get information (access urls) to the content of a specified directory
router.get('/getmediafilesfordirectory/:directory', function(req, res) {

    // enable CORS (Server-Side Access Control)
    // documentation: [ https://developer.mozilla.org/en-US/docs/Web/HTTP/Server-Side_Access_Control ]
    // implementation apapted via: [ https://stackoverflow.com/a/7069902 ]
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    // check if uploaded media root directory exists
    if (fs.existsSync(UNITY_UPLOADED_MEDIA_FILES_DIRECTORY + req.params.directory)){

        // access requested directory  
        fs.readdir(UNITY_UPLOADED_MEDIA_FILES_DIRECTORY + req.params.directory, function(err, files) {
         
            // collect all content in the directory
            var fileArray = [];
            for (var i=0; i<files.length; i++) {
                fileArray.push( SERVER_FILE_ACCESS_GET_URL + req.params.directory + "/" + files[i] );
            }

            // send response
            res.status(200).send({ 'status' : 'ok', 'status_code' : 200, 'directory' : req.params.directory, 'files' : fileArray });
        });
    }
    else
    {
        res.status(404).send({ 'status' : 'not found', 'status_code' : 404, 'description' : '' } );
    }
});

// API CALL: access a specific file on server and respond with it
// Note: file name parameter needs to include file extension (e.g. .png or .wav)
router.get('/getfile/:directory/:filename', function(req, res) {

    // enable CORS (Server-Side Access Control)
    // documentation: [ https://developer.mozilla.org/en-US/docs/Web/HTTP/Server-Side_Access_Control ]
    // implementation apapted via: [ https://stackoverflow.com/a/7069902 ]
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

	// check if file exists
    fs.stat(UNITY_UPLOADED_MEDIA_FILES_DIRECTORY + req.params.directory + "/" + req.params.filename, function(err, fileStat) {

        // error requesting / reading file occurred
        if (err) {
            res.status(400).send({ 'status' : 'error', 'status_code' : 400, 'code' : err.code, 'description' : 'Requested file does not exist on server.' } );
        }
        // no error = continue processing callback data
        else {
            // check if file exists and is readable
            if (fileStat.isFile())
            {
                // read file
                fs.readFile(UNITY_UPLOADED_MEDIA_FILES_DIRECTORY + req.params.directory + "/" + req.params.filename, function(err, data) {
                    
                    // if error occurred: response with 404 http status code
                    if (err) res.send(404);

                    // else: response with file

                    // determine file type for content-type encoding in response header
                    var fileType = req.params.filename.substring(req.params.filename.length-3, req.params.filename.length);
                    switch(fileType)
                    {
                        case "png":
                            //res.writeHead(200, {'Content-Type': 'image/png'});
                            res.header('Content-Type', 'image/png');
                            break;
                        case "wav":
                            //res.writeHead(200, {'Content-Type': 'audio/wav'});
                            res.header('Content-Type', 'audio/wav');
                            break;
                        default:
                        break;
                    }

                    // send response
                    res.end(data);
                });
            }
        }
    });
});

module.exports = router;
