/*
 * MediaUploadDemo.cs
 *
 * Description: Class to demonstrate example usage of the MediaUpload.cs script.
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

public class MediaUploadDemo : MonoBehaviour
{
    // private properties
    private MediaUpload mu;         // reference to Media Upload component, attached dynamically at runtime


    #region UNITY_EVENT_FUNCTIONS

    /// <summary>
    /// General Start routine.
    /// </summary>
    void Start()
    {
        // attach a new component of type MediaUpload to this GameObject
        mu = this.gameObject.AddComponent<MediaUpload>();

        // configure MediaUpload component
        mu.cnfgSrvr_uploadURL = "https://USER_SERVER_URL:USER_PORT/umu/uploadbinarydata";
        mu.cnfgSrvr_sessionNameTimeFormat = "yyyy-MM-dd_HH-mm-ss";
        //mu.cnfgSrvr_isAllowedToConnect = false;

        // initialize MediaUpload component
        bool muIsInitialized = mu.init();
    }

    /// <summary>
    /// General Update routine.
    /// </summary>
    void Update()
    {
        // EXAMPLE MEDIA CAPTURE VIA KEYBOARD INPUT
        //
         
        // take a screenshot
        if (Input.GetKeyDown(KeyCode.S))
        {
            mu.takeScreenshotWithNameAndUpload("screenshot.png");
            Debug.Log("[MediaUploadDemo] Keyboard S -- Screenshot take and server upload initiated.");
        }

        // trigger an audio recording from default microphone
        if (Input.GetKeyDown(KeyCode.A))
        {
            mu.triggerMicrophoneRecordingWithNameAndUpload("microphone.wav");
            Debug.Log("[MediaUploadDemo] Keyboard A -- Audio recording from default microphone triggered.");
        }
    }

    #endregion
}
