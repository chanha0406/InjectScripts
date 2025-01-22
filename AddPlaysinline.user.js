// ==UserScript==
// @name         Add playsinline and Auto Play/Pause Videos
// @namespace    http://tampermonkey.net/
// @version      1.1
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

    // Intersection Observer to control play/pause based on visibility
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const video = entry.target;

            if (entry.isIntersecting) {
                video.play(); // Play video when it enters the viewport
                console.log('Video playing: ', video);
            } else {
                video.pause(); // Pause video when it leaves the viewport
                console.log('Video paused: ', video);
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of the video is visible
    });

    // Function to observe and process all video elements
    const processVideos = () => {
        document.querySelectorAll('video').forEach((video) => {
            addPlaysInline(video); // Add playsinline attribute
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