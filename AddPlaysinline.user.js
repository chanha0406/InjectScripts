// ==UserScript==
// @name         Add playsinline, Auto Play/Pause, Toggle Controls, and Popup Menu with Blob Download (Vanilla JS Version)
// @namespace    http://tampermonkey.net/
// @version      5.0
// @description  Add playsinline to all videos, control play/pause based on visibility, toggle controls, and show a popup menu synchronized with the video controller and improved Blob Download.
// @match        *://*/*
// @updateURL    https://raw.githubusercontent.com/chanha0406/InjectScripts/master/AddPlaysinline.user.js
// @downloadURL  https://raw.githubusercontent.com/chanha0406/InjectScripts/master/AddPlaysinline.user.js
// @exclude      *://*.youtube.com/*
// @exclude      *://youtube.com/*
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const excludedPlayPauseClasses = ['jwplayer', 'auto_media'];
    const excludedInlineClasses = ['jwplayer', 'auto_media'];
    const excludedPopupClasses = ['auto_media'];

    const addPlaysInline = (video) => {
        if (!video.hasAttribute('playsinline')) {
            video.setAttribute('playsinline', 'true');
            video.setAttribute('webkit-playsinline', 'true');
        }
    };

    const setupControlToggle = (video, updatePopupPosition) => {
        let nextControls = !video.controls;

        video.addEventListener('click', (event) => {
            const videoRect = video.getBoundingClientRect();
            const controlAreaY = videoRect.bottom - 40;

            if (event.clientY < controlAreaY) {
                video.controls = nextControls;
                nextControls = !nextControls;
                updatePopupPosition();
            }
        });

        video.addEventListener('pause', () => {
            video.controls = true;
            nextControls = false;
        });

        video.addEventListener('play', () => {
            video.controls = false;
            nextControls = true;
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
        let popupId = video.dataset.popupId;
        let popup;

        if (!popupId) {
            popupId = `popup-${Math.random().toString(36).substr(2, 9)}`;
            video.dataset.popupId = popupId;

            popup = document.createElement('div');
            popup.id = popupId;
            Object.assign(popup.style, {
                position: 'absolute',
                zIndex: 9999,
                background: 'white',
                border: '1px solid #ccc',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                padding: '10px',
                borderRadius: '8px',
                display: 'none',
            });

            const copyButton = document.createElement('button');
            copyButton.textContent = '🔗';
            Object.assign(copyButton.style, { marginRight: '10px', cursor: 'pointer' });
            copyButton.addEventListener('click', async () => {
                const videoURL = video.currentSrc || video.src;
                try {
                    await navigator.clipboard.writeText(videoURL);
                    alert('Video URL copied to clipboard: ' + videoURL);
                } catch (error) {
                    console.error('Failed to copy URL:', error);
                    alert('Failed to copy URL. Please try again.');
                }
            });

            const openButton = document.createElement('button');
            openButton.textContent = '🌐';
            Object.assign(openButton.style, { marginRight: '10px', cursor: 'pointer' });
            openButton.addEventListener('click', () => {
                const videoURL = video.currentSrc || video.src;
                window.open(videoURL, '_blank');
            });

            const blobDownloadButton = document.createElement('button');
            blobDownloadButton.textContent = '📥';
            Object.assign(blobDownloadButton.style, { cursor: 'pointer' });
            blobDownloadButton.addEventListener('click', async () => {
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

                    const downloadURL = new URL(videoURL);
                    downloadURL.searchParams.set('download', 'true');

                    const newTab = window.open(downloadURL.href, '_blank');
                    if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
                        alert('팝업이 차단되었습니다. 다운로드를 현재 창에서 진행합니다.');
                        window.location.href = downloadURL.href;
                    }
                }
            });

            popup.appendChild(copyButton);
            popup.appendChild(openButton);
            popup.appendChild(blobDownloadButton);
            document.body.appendChild(popup);
        } else {
            popup = document.getElementById(popupId);
        }

        return popup;
    };

    const addPopupWithControls = (video) => {
        const popup = createPopupMenu(video);

        const updatePopupPosition = () => {
            const rect = video.getBoundingClientRect();
            popup.style.left = `${rect.left + window.scrollX}px`;
            popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
            popup.style.display = video.controls ? 'block' : 'none';
        };

        setupControlToggle(video, updatePopupPosition);
    };

    const addVisibilityPlayPause = (video) => {
        if (video.hasAttribute('autoplay')) {
            video.removeAttribute('autoplay');
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
                        video.play();
                    } else {
                        video.pause();
                    }
                });
            },
            { threshold: [0.4, 0.6] }
        );

        observer.observe(video);

        const onVideoLoad = () => {
            const rect = video.getBoundingClientRect();
            const isVisible =
                rect.top < window.innerHeight &&
                rect.bottom > 0 &&
                rect.left < window.innerWidth &&
                rect.right > 0;

            if (!isVisible && !video.paused) {
                video.pause();
            }
        };

        video.addEventListener('loadeddata', onVideoLoad);
        video.addEventListener('canplay', onVideoLoad);
    };

    const processVideos = () => {
        document.querySelectorAll('video').forEach((video) => {
            if (!video.dataset.popupId) {
                if (!excludedPopupClasses.some((className) => video.closest(`.${className}`))) {
                    const blobReg = /^blob:/i;
                    if (!blobReg.test(video.currentSrc) && !blobReg.test(video.src)) {
                        addPopupWithControls(video);
                    }
                }

                if (!excludedInlineClasses.some((className) => video.closest(`.${className}`))) {
                    addPlaysInline(video);
                }

                if (!excludedPlayPauseClasses.some((className) => video.closest(`.${className}`))) {
                    addVisibilityPlayPause(video);
                }
            }
        });
    };

    processVideos();

    const mutationObserver = new MutationObserver(() => {
        processVideos();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });
})();
