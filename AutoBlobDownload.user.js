// ==UserScript==
// @name         Auto Blob Download for Specific URLs
// @namespace    http://tampermonkey.net/
// @version      1.0
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

    // Function to automatically download Blob if URL matches criteria
    const checkAndDownloadBlob = () => {
        const url = window.location.href;

        // Check if the URL contains a video extension and 'download' query
        if (videoExtensions.test(url) && url.includes('download')) {
            const fileName = url.split('/').pop().split('?')[0]; // Extract file name from URL

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
                    URL.revokeObjectURL(blobURL); // Revoke Blob URL
                })
                .catch((error) => {
                    console.error('Blob Download failed:', error);
                    alert(`Failed to download video: ${error.message}`);
                });
        }
    };

    // Execute the function on script load
    checkAndDownloadBlob();
})();