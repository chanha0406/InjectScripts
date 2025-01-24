// ==UserScript==
// @name         Auto Blob Download for Specific URLs
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  Automatically download video files with Blob when the URL contains specific extensions and the 'download' query.
// @match        *://*/*
// @grant        none
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/chanha0406/InjectScripts/master/AutoBlobDownload.user.js
// @downloadURL  https://raw.githubusercontent.com/chanha0406/InjectScripts/master/AutoBlobDownload.user.js
// ==/UserScript==

(function () {
    'use strict';

    const videoExtensions = /\.(mp4|webm|ogg)$/i; // Supported video extensions

    /**
     * Adjust video element to fit the screen.
     * @param {HTMLVideoElement} video - Video element to adjust.
     */
    const adjustVideoToScreen = (video) => {
        video.classList.remove('media-document', 'iPhone', 'video');
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'contain';
    };

    /**
     * Observe and adjust new video elements added to the page.
     */
    const observeNewVideos = () => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.tagName === 'VIDEO') {
                        adjustVideoToScreen(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    };

    /**
     * Download the Blob content of the video file.
     * @param {string} url - The URL to fetch the video.
     * @param {string} fileName - The file name to save.
     */
    const downloadBlob = (url, fileName) => {
        fetch(url)
            .then((response) => {
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                return response.blob();
            })
            .then((blob) => {
                const blobURL = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobURL;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(blobURL);
            })
            .catch((error) => {
                console.error('Blob Download failed:', error);
                alert(`Failed to download video: ${error.message}`);
            });
    };

    /**
     * Check the current URL and trigger actions if conditions are met.
     */
    const processCurrentURL = () => {
        const url = new URL(window.location.href);
        const pathname = url.pathname;
        const searchParams = url.searchParams;

        if (videoExtensions.test(pathname)) {
            document.querySelectorAll('video').forEach(adjustVideoToScreen);
            observeNewVideos();

            if (searchParams.has('download')) {
                const fileName = pathname.split('/').pop();
                downloadBlob(url.href, fileName);
            }
        }
    };

    // Execute the main function on script load
    processCurrentURL();
})();
