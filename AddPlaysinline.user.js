// ==UserScript==
// @name         Add playsinline, Auto Play/Pause, Toggle Controls, and Popup Menu with Blob Download
// @namespace    http://tampermonkey.net/
// @version      2.7
// @description  Add playsinline to all videos, control play/pause based on visibility, toggle controls, and show a popup menu synchronized with the video controller with improved Blob Download.
// @match        *://*/*
// @grant        GM_setClipboard
// @updateURL    https://raw.githubusercontent.com/chanha0406/InjectScripts/master/AddPlaysinline.user.js
// @downloadURL  https://raw.githubusercontent.com/chanha0406/InjectScripts/master/AddPlaysinline.user.js
// ==/UserScript==

(function () {
    'use strict';

    const processedVideos = new WeakSet(); // Track already processed videos

    // Function to add playsinline attribute to all video elements
    const addPlaysInline = (video) => {
        if (!video.hasAttribute('playsinline')) {
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true'); // For older iOS compatibility
            console.log('Added playsinline to video:', video);
        }
    };

    // Function to toggle controls on click
    const setupControlToggle = (video) => {
        let controlsVisible = true; // Track controls visibility

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
            return decodeURIComponent(url.split('/').pop().split('?')[0]) || 'video.mp4'; // Extract filename from URL
        } catch (e) {
            return 'video.mp4'; // Default fallback name
        }
    };

    // Function to create a custom popup menu for a video
    const createPopupMenu = (video) => {
        let popupId = video.getAttribute('data-popup-id'); // Check if popup ID already exists
        let popup;

        if (!popupId) {
            popupId = `popup-${Math.random().toString(36).substr(2, 9)}`; // Generate unique ID
            video.setAttribute('data-popup-id', popupId); // Attach popup ID to video as an attribute

            popup = document.createElement('div');
            popup.id = popupId;
            popup.style.position = 'absolute';
            popup.style.zIndex = '9999';
            popup.style.background = 'white';
            popup.style.border = '1px solid #ccc';
            popup.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            popup.style.padding = '10px';
            popup.style.borderRadius = '8px';
            popup.style.display = 'none';

            // Add "Copy URL" button
            const copyButton = document.createElement('button');
            copyButton.textContent = 'Copy URL';
            copyButton.style.marginRight = '10px';
            copyButton.style.cursor = 'pointer';
            copyButton.onclick = () => {
                const videoURL = video.currentSrc || video.src;
                GM_setClipboard(videoURL); // Copy to clipboard
                alert('Video URL copied to clipboard: ' + videoURL);
            };

            // Add "Open" button
            const openButton = document.createElement('button');
            openButton.textContent = 'Open';
            openButton.style.marginRight = '10px';
            openButton.style.cursor = 'pointer';
            openButton.onclick = () => {
                const videoURL = video.currentSrc || video.src;
                window.open(videoURL, '_blank'); // Open video in a new tab
            };

            // Add "Blob Download" button
            const blobDownloadButton = document.createElement('button');
            blobDownloadButton.textContent = 'Blob Download';
            blobDownloadButton.style.cursor = 'pointer';
            blobDownloadButton.onclick = () => {
                const videoURL = video.currentSrc || video.src;
                const fileName = getFileNameFromURL(videoURL);

                fetch(videoURL)
                    .then(response => response.blob()) // Fetch the video as Blob
                    .then(blob => {
                        const link = document.createElement('a');
                        const url = URL.createObjectURL(blob); // Create Blob URL
                        link.href = url;
                        link.download = fileName; // Use the extracted filename
                        document.body.appendChild(link); // Append link to body
                        link.click(); // Trigger the download
                        document.body.removeChild(link); // Remove the link element
                        URL.revokeObjectURL(url); // Revoke Blob URL
                    })
                    .catch(error => {
                        console.error('Download failed:', error);
                    });
            };

            // Append buttons to the popup
            popup.appendChild(copyButton);
            popup.appendChild(openButton);
            popup.appendChild(blobDownloadButton);

            // Add popup to the document
            document.body.appendChild(popup);
        } else {
            popup = document.querySelector(`#${popupId}`);
        }

        return popup;
    };

    // Function to synchronize the popup menu with video controls
    const synchronizePopupWithControls = (video) => {
        const popup = createPopupMenu(video);

        // Position and show/hide popup based on controls visibility
        const updatePopupPosition = () => {
            const rect = video.getBoundingClientRect();
            popup.style.left = `${rect.left + window.scrollX}px`;
            popup.style.top = `${rect.bottom + window.scrollY + 5}px`;

            // Show popup if controls are visible, hide otherwise
            popup.style.display = video.controls ? 'block' : 'none';
        };

        // Attach events to update popup position and visibility
        video.addEventListener('click', updatePopupPosition);
    };

    // Function to process and observe videos
    const processVideos = () => {
        document.querySelectorAll('video').forEach((video) => {
            if (!processedVideos.has(video)) {
                addPlaysInline(video); // Add playsinline attribute
                setupControlToggle(video); // Add click-to-toggle controls
                synchronizePopupWithControls(video); // Sync popup with controls
                processedVideos.add(video); // Mark video as processed
            }
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