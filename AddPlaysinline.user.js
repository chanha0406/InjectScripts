// ==UserScript==
// @name         Add playsinline, Auto Play/Pause, Toggle Controls, and Popup Menu with Blob Download
// @namespace    http://tampermonkey.net/
// @version      3.3
// @description  Add playsinline to all videos, control play/pause based on visibility, toggle controls, and show a popup menu synchronized with the video controller and improved Blob Download.
// @match        *://*/*
// @grant        GM_setClipboard
// @updateURL    https://raw.githubusercontent.com/chanha0406/InjectScripts/master/AddPlaysinline.user.js
// @downloadURL  https://raw.githubusercontent.com/chanha0406/InjectScripts/master/AddPlaysinline.user.js
// ==/UserScript==

(function () {
    'use strict';

    const addPlaysInline = (video) => {
        if (!video.hasAttribute('playsinline')) {
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
        }
    };

    const setupControlToggle = (video, updatePopupPosition) => {
        let controlsVisible = true;

        video.addEventListener('pause', () => {
            video.controls = true;
            controlsVisible = true;
            updatePopupPosition();
        });

        video.addEventListener('play', () => {
            video.controls = false;
            controlsVisible = false;
            updatePopupPosition();
        });

        video.addEventListener('click', (event) => {
            const videoRect = video.getBoundingClientRect();
            const controlAreaY = videoRect.bottom - 40;

            if (event.clientY < controlAreaY) {
                controlsVisible = !controlsVisible;
                video.controls = controlsVisible;
                updatePopupPosition();
            }
        });
    };

    const getFileNameFromURL = (url) => {
        try {
            return decodeURIComponent(url.split('/').pop().split('?')[0]) || 'video.mp4';
        } catch (e) {
            return 'video.mp4';
        }
    };

    const createPopupMenu = (video) => {
        let popupId = video.getAttribute('data-popup-id');
        let popup;

        if (!popupId) {
            popupId = `popup-${Math.random().toString(36).substr(2, 9)}`;
            video.setAttribute('data-popup-id', popupId);

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

            const copyButton = document.createElement('button');
            copyButton.textContent = 'Copy URL';
            copyButton.style.marginRight = '10px';
            copyButton.style.cursor = 'pointer';
            copyButton.onclick = () => {
                const videoURL = video.currentSrc || video.src;
                GM_setClipboard(videoURL);
                alert('Video URL copied to clipboard: ' + videoURL);
            };

            const openButton = document.createElement('button');
            openButton.textContent = 'Open';
            openButton.style.marginRight = '10px';
            openButton.style.cursor = 'pointer';
            openButton.onclick = () => {
                const videoURL = video.currentSrc || video.src;
                window.open(videoURL, '_blank');
            };

            const blobDownloadButton = document.createElement('button');
            blobDownloadButton.textContent = 'Blob Download';
            blobDownloadButton.style.cursor = 'pointer';
            blobDownloadButton.onclick = async () => {
                const videoURL = video.currentSrc || video.src;
                const fileName = getFileNameFromURL(videoURL);

                try {
                    const response = await fetch(videoURL, { mode: 'cors' });

                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }

                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);

                    const link = document.createElement('a');
                    link.href = url;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('Blob Download failed:', error);
                    alert(`Failed to download video: ${error.message}`);
                }
            };

            popup.appendChild(copyButton);
            popup.appendChild(openButton);
            popup.appendChild(blobDownloadButton);
            document.body.appendChild(popup);
        } else {
            popup = document.querySelector(`#${popupId}`);
        }

        return popup;
    };

    const synchronizePopupWithControls = (video) => {
        const popup = createPopupMenu(video);

        const updatePopupPosition = () => {
            const rect = video.getBoundingClientRect();
            popup.style.left = `${rect.left + window.scrollX}px`;
            popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
            popup.style.display = video.controls ? 'block' : 'none';
        };

        setupControlToggle(video, updatePopupPosition);
    };

    const processVideos = () => {
        document.querySelectorAll('video').forEach((video) => {
            if (!video.getAttribute('data-popup-id')) {
                addPlaysInline(video);
                synchronizePopupWithControls(video);
                setupVisibilityObserver(video);
            }
        });
    };

    processVideos();

    const mutationObserver = new MutationObserver(() => {
        processVideos();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });
})();