/*
 * MediaUpload.cs
 *
 * Description: Class to upload media files (as binary data) to a server via HTTP PUT request.
 * 
 * Documentation:
 * - server API must be listening to HTTP PUT requests
 * - server API setup as URL with two additional parameters: SERVER_PUT_URL/:directory/:filename
 *      - directory on server corresponds with dynamic creation of session ID in Unity application (based on System.DataTime.UTCNow).
 *      - filename has to include the file extension, e.g., .png, .wav
 * - example media capture and upload implemented for (1) in-game screenshot (as .png), (2) audio recording from default microphone (as .wav; via fork of SavWav.cs script)
 * - easy extension for further media / file / data types based on own use-cases and requirements (as long as conversion to binary data is possible)
 * - for example usage, refer to MediaUploadDemo.cs script
 * 
 * Supported Unity version: 2019.2.17f1 Personal (tested)
 *
 * Author: Nico Reski
 * Web: https://reski.nicoversity.com
 * Twitter: @nicoversity
 * GitHub: https://github.com/nicoversity
 * 
 */

using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;

/// <summary>
/// Class to assist with uploading media files (as binary data) to a web server.
/// </summary>
public class MediaUpload : MonoBehaviour
{
    [Header("Server Configuration")]
    public bool cnfgSrvr_isAllowedToConnect = true;         // flag to indicated whether or not a connection to the server is allowed to be established; default = true
    public string cnfgSrvr_uploadURL;                       // server API endpoint that is requested to upload the (binary) data to
    public string cnfgSrvr_sessionNameTimeFormat;           // a string describing a custom date and time format in order to dynamically generate an appropriate session name; default: yyyy-MM-dd_HH-mm-ss; further reading via [ https://docs.microsoft.com/en-us/dotnet/standard/base-types/custom-date-and-time-format-strings ]

    [Header("Microphone Recording Configuration")]
    public bool isCurrentlyRecordingFromMicrohone = false;  // flag indicating whether (true) or not (false) audio is currently being recording from the microphone
    public int cnfgMrcphn_recordingLimitInSeconds = 30;     // (in seconds) maximum amount of time for audio recording
    public int cnfgMrcphn_frequency = 44100;                // frequency value for audio recording
    private AudioClip microphoneRecordedAudioClip;          // helper value for temporary storage of recorded audio

    // private properties
    private bool isInitialized = false;                     // flag indicating whether or not the MediaUpload component has been initialized
    private string sessionID;                               // string representing the current session id


    #region SETUP

    /// <summary>
    /// Instantiation and dynamic reference setup.
    /// </summary>
    /// <returns>Bool value representing whether (true) or not (false) the MediaUpload component was successfully initialized.</returns>
    public bool init()
    {
        // check if everything is configured and initialized
        if (cnfgSrvr_uploadURL != null)
        {
            if (cnfgSrvr_sessionNameTimeFormat != null)
            {
                // init session ID (for currently run Unity application) based on UTC now and formatted according to configuration
                sessionID = System.DateTime.UtcNow.ToString(cnfgSrvr_sessionNameTimeFormat);

                if (sessionID != null)
                {
                    // turn initialization flag to true
                    isInitialized = true;
                }
            }
        }

        return isInitialized;
    }

    #endregion


    #region MEDIA_CAPTURE

    /// <summary>
    /// Function to take an in-game screenshot (based on the main camera) with a specified name, and initiate its upload to a server.
    /// </summary>
    /// <param name="filename">Filename of the screenshot as to be sent to the server (must include file extension).</param>
    public void takeScreenshotWithNameAndUpload(string filename)
    {
        // construct url for server upload
        string url = prepareServerPutRequestURLForFilename(filename);

        // take a screenshot and convert it to binary data, and initiate upload to server
        // ScreenCapture documentation: [ https://docs.unity3d.com/ScriptReference/ScreenCapture.CaptureScreenshot.html ]
        initUploadBinaryDataToServer(url, ScreenCapture.CaptureScreenshotAsTexture().EncodeToPNG());
    }

    /// <summary>
    /// Function to trigger an audio recording using the default microphone with a specified name, and initiate its upload to a server.
    /// </summary>
    /// <param name="filename">Filename of the audio file as to be sent to the server (must include file extension).</param>
    public void triggerMicrophoneRecordingWithNameAndUpload(string filename)
    {
        // an new audio recording is about to start
        if (isCurrentlyRecordingFromMicrohone == false)
        {
            // start a new recording with the default microphone
            microphoneRecordedAudioClip = Microphone.Start(null, false, cnfgMrcphn_recordingLimitInSeconds, cnfgMrcphn_frequency);
        }

        // the current audio recording is finished
        else
        {
            // end recording
            Microphone.End(null);

            // construct url for server upload
            string url = prepareServerPutRequestURLForFilename(filename);

            // create byte array from recorded AudioClip (via edited SavWav.cs script; see script itself for further reference and documentation), and initiate upload to server
            uint length;
            initUploadBinaryDataToServer(url, SavWav.GetWav(microphoneRecordedAudioClip, out length, true));
        }

        // reverse current recording state
        isCurrentlyRecordingFromMicrohone = !isCurrentlyRecordingFromMicrohone;
    }

    #endregion


    #region SERVER_UPLOAD

    /// <summary>
    /// Method to return the prepared server URL for the HTTP PUT request.
    /// </summary>
    /// <param name="filename">Name of the file that will be uploaded to the server.</param>
    /// <returns>String representing the final server url including all required parameters.</returns>
    private string prepareServerPutRequestURLForFilename(string filename)
    {
        // server url composition:
        // 1. general server url listening for HTTP PUT requests
        // 2. additional required parameters for API call = /:directoryOnServer /:filename
        return cnfgSrvr_uploadURL + "/" + sessionID + "/" + filename;
    }

    /// <summary>
    /// Method to trigger the upload of binary data to a server.
    /// </summary>
    /// <param name="url">String representing the server url the data is uploaded to.</param>
    /// <param name="binData">Byte Array that contains the binary data.</param>
    public void initUploadBinaryDataToServer(string url, byte[] binData)
    {
        // trigger upload if configuration allows it
        if (cnfgSrvr_isAllowedToConnect)
        {
            // start coroutine that handles the data upload to the server
            StartCoroutine(UploadBinaryDataToServer(url, binData));
        }
        else
            Debug.LogError("[MediaUpload] initUploadBinaryDataToServer called with cnfgSrvr_isAllowedToConnect = " + cnfgSrvr_isAllowedToConnect);
    }

    /// <summary>
    /// Function to perform the upload of binary data to a server.
    /// </summary>
    /// <param name="url">String representing the server url the data is uploaded to.</param>
    /// <param name="binData">Byte Array that contains the binary data.</param>
    /// <returns>UnityWebRequest that contains information about the data upload.</returns>
    private IEnumerator UploadBinaryDataToServer(string url, byte[] binData)
    {
        // UnityWebRequest documentation: [ https://docs.unity3d.com/Manual/UnityWebRequest-UploadingRawData.html ]

        // set up HTTP PUT request to the server
        UnityWebRequest wwwPutRequest = UnityWebRequest.Put(url, binData);

        // send request and wait for response
        yield return wwwPutRequest.SendWebRequest();

        // server was not reachable or other error message from server received
        if (wwwPutRequest.isNetworkError || wwwPutRequest.isHttpError)
        {
            // print error message to
            Debug.LogError("[MediaUpload] UploadBinaryDataToServer with ERROR = " + wwwPutRequest.error);

            // OPTIONAL: implement further error handling routines
        }
        // web request was successful
        else
        {
            Debug.Log("[MediaUpload] UploadBinaryDataToServer success");

            // OPTIONAL: implement further success handling routines
        }
    }

    #endregion
}
