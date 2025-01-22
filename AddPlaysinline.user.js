// ==UserScript==
// @name         Add playsinline, Auto Play/Pause, Toggle Controls, and Long Press Options
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Add playsinline to all videos, control play/pause based on visibility, toggle controls, and show a menu to copy or download video URL on long press with filename parsing.
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

    // Function to toggle controls on specific clicks
    const setupControlToggle = (video) => {
        // Track whether the controls are currently visible
        let controlsVisible = true;

        // Show controls when paused
        video.addEventListener('pause', () => {
            video.controls = true; // Show controls on pause
            controlsVisible = true;
            console.log('Controls shown on pause:', video);
        });

        // Hide controls when playing
        video.addEventListener('play', () => {
            video.controls = false; // Hide controls on play
            controlsVisible = false;
            console.log('Controls hidden on play:', video);
        });

        // Toggle controls on click outside the control bar
        video.addEventListener('click', (event) => {
            const videoRect = video.getBoundingClientRect();
            const controlAreaY = videoRect.bottom - 40; // Assume control bar is at the bottom 40px

            // Check if the click is outside the control area
            if (event.clientY < controlAreaY) {
                controlsVisible = !controlsVisible;
                video.controls = controlsVisible;
                console.log(controlsVisible ? 'Controls shown' : 'Controls hidden', video);
            }
        });
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

        // Add "Download" button
        const downloadButton = document.createElement('button');
        downloadButton.textContent = 'Download';
        downloadButton.style.cursor = 'pointer';
        downloadButton.onclick = () => {
            const videoURL = video.currentSrc || video.src;
            const fileName = getFileNameFromURL(videoURL);
            const link = document.createElement('a');
            link.href = videoURL;
            link.download = fileName; // Use parsed filename
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            menu.style.display = 'none';
        };

        // Append buttons to menu
        menu.appendChild(copyButton);
        menu.appendChild(downloadButton);

        // Append menu to document
        document.body.appendChild(menu);

        return menu;
    };

    // Function to handle long press and show the menu
    const handleLongPress = (video) => {
        video.addEventListener('contextmenu', (event) => {
            event.preventDefault(); // Prevent default context menu
            const menu = createCustomMenu(video);
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
        });
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
            setupControlToggle(video); // Set up control toggle on play/pause and clicks
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