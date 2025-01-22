// ==UserScript==
// @name         Add playsinline, Auto Play/Pause, Toggle Controls, and Long Press Options with Blob Download
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Add playsinline to all videos, control play/pause based on visibility, toggle controls, and show a menu to copy, open, or blob-download video URL on long press.
// @match        *://*/*
// @grant        GM_setClipboard
// @updateURL    https://raw.githubusercontent.com/chanha0406/InjectScripts/master/AddPlaysinline.user.js
// @downloadURL  https://raw.githubusercontent.com/chanha0406/InjectScripts/master/AddPlaysinline.user.js
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

    // Function to parse filename from a URL
    const getFileNameFromURL = (url) => {
        try {
            return decodeURIComponent(url.split('/').pop().split('?')[0]); // Extract filename from URL
        } catch (e) {
            return 'video.mp4'; // Default fallback name
        }
    };

    // Function to create a custom menu for video options
    const createCustomMenu = (video) => {
        // Remove existing menu if any
        const existingMenu = document.querySelector('#custom-video-menu');
        if (existingMenu) existingMenu.remove();

        // Create menu container
        const menu = document.createElement('div');
        menu.id = 'custom-video-menu';
        menu.style.position = 'fixed';
        menu.style.zIndex = '9999';
        menu.style.background = 'white';
        menu.style.border = '1px solid #ccc';
        menu.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        menu.style.padding = '10px';
        menu.style.borderRadius = '8px';
        menu.style.display = 'none';

        // Add "Copy URL" button
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy URL';
        copyButton.style.marginRight = '10px';
        copyButton.style.cursor = 'pointer';
        copyButton.onclick = () => {
            const videoURL = video.currentSrc || video.src;
            GM_setClipboard(videoURL); // Copy to clipboard
            alert('Video URL copied to clipboard: ' + videoURL);
            menu.style.display = 'none';
        };

        // Add "Open" button
        const openButton = document.createElement('button');
        openButton.textContent = 'Open';
        openButton.style.marginRight = '10px';
        openButton.style.cursor = 'pointer';
        openButton.onclick = () => {
            const videoURL = video.currentSrc || video.src;
            window.open(videoURL, '_blank'); // Open video in a new tab
            menu.style.display = 'none';
        };

        // Add "Download via Blob" button
        const blobDownloadButton = document.createElement('button');
        blobDownloadButton.textContent = 'Blob Download';
        blobDownloadButton.style.cursor = 'pointer';
        blobDownloadButton.onclick = async () => {
            const videoURL = video.currentSrc || video.src;
            const fileName = getFileNameFromURL(videoURL);
            try {
                const response = await fetch(videoURL);
                const blob = await response.blob();
                const blobURL = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = blobURL;
                link.download = fileName; // Use parsed filename
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Revoke the object URL to release memory
                URL.revokeObjectURL(blobURL);
            } catch (error) {
                console.error('Failed to download video via Blob:', error);
            }
            menu.style.display = 'none';
        };

        // Append buttons to menu
        menu.appendChild(copyButton);
        menu.appendChild(openButton);
        menu.appendChild(blobDownloadButton);

        // Append menu to document
        document.body.appendChild(menu);

        return menu;
    };

    // Function to handle long press and show the menu
    const handleLongPress = (video) => {
        let timer;
        let menu;

        // Start long press detection on touchstart or mousedown
        const startPress = (event) => {
            timer = setTimeout(() => {
                event.preventDefault(); // Prevent default context menu
                if (!menu) {
                    menu = createCustomMenu(video);
                }
                menu.style.left = `${event.pageX}px`;
                menu.style.top = `${event.pageY}px`;
                menu.style.display = 'block';

                // Hide menu on click outside
                const hideMenu = (e) => {
                    if (!menu.contains(e.target)) {
                        menu.style.display = 'none';
                        document.removeEventListener('click', hideMenu);
                    }
                };
                document.addEventListener('click', hideMenu);
            }, 500); // 500ms for long press
        };

        // Cancel long press on touchend or mouseup
        const cancelPress = () => {
            clearTimeout(timer);
        };

        video.addEventListener('mousedown', startPress);
        video.addEventListener('touchstart', startPress);
        video.addEventListener('mouseup', cancelPress);
        video.addEventListener('touchend', cancelPress);
    };

    // Intersection Observer to control play/pause based on visibility
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const video = entry.target;

            if (entry.intersectionRatio > 0.3) {
                // Play video when 30% or more is visible
                if (video.paused) {
                    video.play();
                    console.log('Video playing: ', video);
                }
            } else {
                // Pause video when less than 30% is visible
                if (!video.paused) {
                    video.pause();
                    console.log('Video paused: ', video);
                }
            }
        });
    }, {
        threshold: 0.3 // Trigger when 30% of the video is visible
    });

    // Function to observe and process all video elements
    const processVideos = () => {
        document.querySelectorAll('video').forEach((video) => {
            addPlaysInline(video); // Add playsinline attribute
            handleLongPress(video); // Add long press functionality
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