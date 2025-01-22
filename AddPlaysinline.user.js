// ==UserScript==
// @name         Add playsinline and Auto Play/Pause Videos
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Add playsinline to all videos and control play/pause based on visibility in the viewport.
// @match        *://*/*
// @grant        none
// @updateURL https://raw.githubusercontent.com/chanha0406/InjectScripts/master/AddPlaysinline.user.js
// @downloadURL https://raw.githubusercontent.com/chanha0406/InjectScripts/master/AddPlaysinline.user.js
// ==/UserScript==

(function () {
    'use strict';

    // Function to add playsinline attribute to all video elements
    const addPlaysInline = (video) => {
        if (!video.hasAttribute('playsinline')) {
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true'); // For older iOS compatibility
            console.log('Added playsinline to video:', video);
        }
    };

    // Function to hide controls during playback
    const hideControls = (video) => {
        video.addEventListener('play', () => {
            video.controls = false; // Hide controls
            console.log('Controls hidden for video:', video);
        });

        video.addEventListener('pause', () => {
            video.controls = true; // Show controls when paused
            console.log('Controls shown for video:', video);
        });
    };

    // Intersection Observer to control play/pause based on visibility
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const video = entry.target;

            if (entry.intersectionRatio > 0.3) {
                // Play video when 30% or more is visible
                video.play();
                console.log('Video playing: ', video);
            } else {
                // Pause video when less than 30% is visible
                video.pause();
                console.log('Video paused: ', video);
            }
        });
    }, {
        threshold: 0.3 // Trigger when 30% of the video is visible
    });

    // Function to observe and process all video elements
    const processVideos = () => {
        document.querySelectorAll('video').forEach((video) => {
            addPlaysInline(video); // Add playsinline attribute
            hideControls(video);  // Set up controls hiding
            observer.observe(video); // Observe for play/pause control
        });
    };

    // Initial processing of videos on page load
    processVideos();

    // MutationObserver to handle dynamically added video elements
    const mutationObserver = new MutationObserver(() => {
        processVideos();
    });

    // Start observing the document for dynamically added elements
    mutationObserver.observe(document.body, { childList: true, subtree: true });
})();