// ==UserScript==
// @name         Add playsinline to all videos
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically add playsinline to all video elements
// @match        *://*/*
// @grant        none
// @updateURL https://raw.githubusercontent.com/chanha0406/InjectScripts/refs/heads/master/AddPlaysinline.user.js
// @downloadURL https://raw.githubusercontent.com/chanha0406/InjectScripts/refs/heads/master/AddPlaysinline.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Function to add playsinline attribute to all video elements
    function addPlaysInline() {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            if (!video.hasAttribute('playsinline')) {
                video.setAttribute('playsinline', 'true');
                video.setAttribute('webkit-playsinline', 'true'); // For older iOS compatibility
                console.log('Added playsinline to video:', video);
            }
        });
    }

    // Run on page load
    addPlaysInline();

    // Observe the DOM for dynamically added video elements
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeName === 'VIDEO') {
                        node.setAttribute('playsinline', 'true');
                        node.setAttribute('webkit-playsinline', 'true'); // For older iOS compatibility
                        console.log('Added playsinline to dynamically added video:', node);
                    }
                });
            }
        });
    });

    // Start observing the document
    observer.observe(document.body, { childList: true, subtree: true });
})();