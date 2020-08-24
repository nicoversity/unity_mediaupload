# Unity - MediaUpload

The purpose of this project is to provide a simple workflow of (1) capturing media from within an Unity3D application, and (2) upload it as binary data via HTTP to a server. This repository includes all Unity3D source code, as well as a simple server API implementation based on Node.js.

## Features

### MediaUpload.cs (Unity3D)

The `MediaUpload.cs` script can be attached to a `GameObject` as a `Component`, featuring:

- configuration to a server backend
- implementation of transferring binary data (as `byte []`) to a server using the `UnityWebRequest` class as `HTTT PUT` request
- implementation of capturing a in-engine screenshots (from a Scene's main camera)
- implementation of capturing an audio recording from the default microphone
- dynamic session management to organize uploaded files based on date/time via `System.DateTime.UtcNow`

### unitymediaupload.js (Node.js)

The `unitymediaupload.js` script provides a simple server API, featuring:

- listening for `HTTP PUT` requests in order to receive files as binary data, and store it on the server (`.png` and `.wav` file types implemented)
- listening for `HTTP GET` requests to provide certain quality-of-life functions in order to access uploaded media files stored on the server
- dynamic session management based on directory creation on the server

## Dependencies

This project has been built using the following specifications:

* [Unity3D](https://unity.com) 2019.2.17f1 Personal (OS X release)
* [Node.js](https://nodejs.org/en/) 4.2.6 (Linux release, running on Ubuntu)

*Note:* Generally, Unity source code should work also within their Windows counterparts. Please check out the above stated dependencies for troubleshooting.

### Resources

Additional resources used to create this project have been accessed as follows:

* [SavWav](https://gist.github.com/R-WebsterNoble/70614880b0d3940d3b2b741fbbb311a2) script forked *by* R-WebsterNoble, based on [original implementation](http://forum.unity3d.com/threads/119295-Writing-AudioListener.GetOutputData-to-wav-problem?p=806734&viewfull=1#post806734) *by* Gregorio Zanon's script
* customization for `System.DateTime.UtcNow` in C# *via* [docs.microsoft.com](https://docs.microsoft.com/en-us/dotnet/standard/base-types/custom-date-and-time-format-strings)
* `ScreenCapture` API in Unity3D via [docs.unity3d.com](https://docs.unity3d.com/ScriptReference/ScreenCapture.CaptureScreenshot.html)
* `UnityWebRequest` API in Unity3D via [docs.unity3d.com](https://docs.unity3d.com/Manual/UnityWebRequest-UploadingRawData.html )

## How to use

#### Import assets to Unity3D project

In order to add the features provided by this project to your Unity3D project, I recommend to add the assets by simply importing the pre-compiled `nicoversity-unity_mediaupload.unitypackage`. Alternatively, the repository directory `unity_src` features the already exported contents of the `.unitypackage`, which can be manually added to a Unity3D project. While the `MediaUpload.cs` script contains the main implementation, an additional `MediaUploadDemo.cs` script illustrates the example usage of the `MediaUpload.cs` implementation in practice.

#### MediaUpload.cs script

The following code snippet outlines an example of typical usage of the `MediaUpload.cs` script. Please also refer to the included `MediaUploadDemo.cs` script for another example. All source code files are extensively documented, further assisting to understand the scripts' contents.

```cs
// create and attach a new component of type MediaUpload to this GameObject
MediaUpload mu = this.gameObject.AddComponent<MediaUpload>();

// configure MediaUpload component
mu.cnfgSrvr_uploadURL = "https://USER_SERVER_URL:USER_PORT/umu/uploadbinarydata";
mu.cnfgSrvr_sessionNameTimeFormat = "yyyy-MM-dd_HH-mm-ss";
//mu.cnfgSrvr_isAllowedToConnect = false;

// initialize MediaUpload component
bool muIsInitialized = mu.init();

// once initialized, media can be captured at runtime
mu.takeScreenshotWithNameAndUpload("screenshot.png");
mu.triggerMicrophoneRecordingWithNameAndUpload("microphone.wav");	// first call: start audio recording
mu.triggerMicrophoneRecordingWithNameAndUpload("microphone.wav");	// second call: stop audio recording and initiate upload
```

#### Node.js server documentation

The main functionalities for this project are implemented within the `routes/unitymediaupload.js` script. By default, all uploaded media files are stored within the `data/unity_uploaded_media_files/` directory. Additionally, all other Node.js related files (see `nodejs_src` directory of this repository) provide a simple functioning server. All source code files are extensively documented, further assisting to understand the scripts' contents.

#### Node.js server setup and configuration

1. Configuration in `bin/www`
	* edit `hostname` and `port` in lines 32/33
	* setup `http` or `https` access for server (see lines 26/27, 39-43, and 48/49)

2. Configuration in `routes/unitymediaupload.js`
	* edit `USER_GROUP_ID` in line 28 (uploaded files will be owned by this user)
	* edit `SERVER_FILE_ACCESS_GET_URL` preset based on server name, port, and route in line 35

3. Install npm modules (required dependencies listed in `package.json`)
	* run command: `npm install`

4. Start and run server
	* run command: `node ./bin/www`

#### Node.js server API

By default, the server route to the `unitymediaupload.js` listeners are setup as `/umu` within the `app.js` script.

**HTTP PUT**

1. Upload file to server
	* call: `SERVER_URL:PORT/umu/uploadbinarydata/:directory/:filename`

**HTTP GET**

1. List all directories
	* call: `SERVER_URL:PORT/umu/listalldirectories`
	* example response: `{"status":"ok","status_code":200,"directories":["2020-08-24_09-24-40","2020-08-24_10-48-22"]}`

2. Get links to file contents of the latest directory
	* call: `SERVER_URL:PORT/umu/getlatestmediafiles`
	* example response: `{"status":"ok","status_code":200,"directory":"2020-08-24_10-48-22","files":["SERVER_URL:PORT/umu/getfile/2020-08-24_10-48-22/microphone.wav","SERVER_URL:PORT/umu/getfile/2020-08-24_10-48-22/screenshot.png"]}`

3. Get links to file contents of a specified directory
	* call: `SERVER_URL:PORT/umu/getmediafilesfordirectory/:directory`
	* example response: `{"status":"ok","status_code":200,"directory":"2020-08-24_09-24-40","files":["SERVER_URL:PORT/umu/getfile/2020-08-24_09-24-40/microphone.wav","SERVER_URL:PORT/umu/getfile/2020-08-24_09-24-40/screenshot.png"]}`

4. Access a specific file on the server
	* call: `SERVER_URL:PORT/umu/getfile/:directory/:filename`
 
## License
MIT License, see [LICENSE.md](LICENSE.md)
