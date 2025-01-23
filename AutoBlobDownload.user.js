// ==UserScript==
// @name         Auto Blob Download for Specific URLs
// @namespace    http://tampermonkey.net/
// @version      2.1
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
        const url = new URL(window.location.href); // Use URL object for easier parsing
        const pathname = url.pathname; // Get the path excluding query
        const searchParams = url.searchParams; // Get query parameters

        // Check if the path contains a video extension and 'download' exists in query parameters
        if (videoExtensions.test(pathname)) {
            function removeClassesFromVideo(video) {
                video.classList.remove('media-document', 'iphone');
            }
        
            // 페이지에서 이미 로드된 video 요소들에서 클래스를 제거
            const initialVideos = document.querySelectorAll('video');
            initialVideos.forEach(removeClassesFromVideo);
        
            // MutationObserver로 새로운 video 요소가 추가되었을 때 클래스 제거
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    // 새로 추가된 video 요소들에 대해
                    mutation.addedNodes.forEach((node) => {
                        if (node.tagName === 'VIDEO') {
                            removeClassesFromVideo(node);
                        }
                    });
                });
            });
        
            // MutationObserver 설정
            observer.observe(document.body, {
                childList: true,  // 자식 노드가 추가되거나 삭제될 때
                subtree: true,    // 하위 요소도 감시
            });

            if (searchParams.has('download')) {
                const fileName = pathname.split('/').pop(); // Extract file name from path
    
                console.log(fileName);
    
                fetch(url.href)
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
        }
    };

    // Execute the function on script load
    checkAndDownloadBlob();

})();