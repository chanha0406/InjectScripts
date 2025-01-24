// ==UserScript==
// @name         Add playsinline, Auto Play/Pause, Toggle Controls, and Popup Menu with Blob Download (Vanilla JS Version)
// @namespace    http://tampermonkey.net/
// @version      5.1
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

    const exclusionClasses = {
        playPause: ['jwplayer', 'auto_media'],
        inline: ['jwplayer', 'auto_media'],
        popup: ['auto_media']
    };

    const handleControlToggleClick = (video, event, nextControls, updatePopupPosition) => {
        const videoRect = video.getBoundingClientRect();
        const controlAreaY = videoRect.bottom - 40;

        if (event.clientY < controlAreaY) {
            video.controls = nextControls;
            updatePopupPosition();
            return !nextControls;
        }
        return nextControls;
    };

    const handleControlTogglePause = (video) => {
        video.controls = true;
        return false;
    };

    const handleControlTogglePlay = (video) => {
        video.controls = false;
        return true;
    };

    const setupControlToggle = (video, updatePopupPosition) => {
        let nextControls = !video.controls;

        video.addEventListener('click', (event) => {
            nextControls = handleControlToggleClick(video, event, nextControls, updatePopupPosition);
        });

        video.addEventListener('pause', () => {
            nextControls = handleControlTogglePause(video);
        });

        video.addEventListener('play', () => {
            nextControls = handleControlTogglePlay(video);
        });
    };

    const getFileNameFromURL = (url) => {
        try {
            return decodeURIComponent(url.split('/').pop().split('?')[0]) || 'video.mp4';
        } catch (e) {
            return 'video.mp4';
        }
    };

    const createButton = (text, style, onClick) => {
        const button = document.createElement('button');
        button.textContent = text;
        Object.assign(button.style, style);
        button.addEventListener('click', onClick);
        return button;
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

            const copyButton = createButton('🔗', { marginRight: '10px', cursor: 'pointer' }, async () => {
                const videoURL = video.currentSrc || video.src;
                try {
                    await navigator.clipboard.writeText(videoURL);
                    alert('Video URL copied to clipboard: ' + videoURL);
                } catch (error) {
                    console.error('Failed to copy URL:', error);
                    alert('Failed to copy URL. Please try again.');
                }
            });

            const openButton = createButton('🌐', { marginRight: '10px', cursor: 'pointer' }, () => {
                const videoURL = video.currentSrc || video.src;
                window.open(videoURL, '_blank');
            });

            const blobDownloadButton = createButton('📥', { cursor: 'pointer' }, async () => {
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

    class VisibilityHandler {
        constructor(video) {
            this.video = video;
            this.observer = new IntersectionObserver(this.handleVisibilityChange.bind(this), { threshold: [0.4, 0.6] });
            this.init();
        }

        init() {
            if (this.video.hasAttribute('autoplay')) {
                this.video.removeAttribute('autoplay');
            }

            this.observer.observe(this.video);

            this.video.addEventListener('loadeddata', this.handleVideoLoad.bind(this));
            this.video.addEventListener('canplay', this.handleVideoLoad.bind(this));
        }

        handleVisibilityChange(entries) {
            entries.forEach((entry) => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
                    this.video.play();
                } else {
                    this.video.pause();
                }
            });
        }

        handleVideoLoad() {
            const rect = this.video.getBoundingClientRect();
            const isVisible =
                rect.top < window.innerHeight &&
                rect.bottom > 0 &&
                rect.left < window.innerWidth &&
                rect.right > 0;

            if (!isVisible && !this.video.paused) {
                this.video.pause();
            }
        }
    }

    class MutationHandler {
        constructor(callback) {
            this.callback = callback;
            this.observer = new MutationObserver(this.callback);
            this.init();
        }

        init() {
            this.observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    const processVideos = () => {
        document.querySelectorAll('video').forEach((video) => {
            if (!video.dataset.popupId) {
                if (!exclusionClasses.popup.some((className) => video.closest(`.${className}`))) {
                    const blobReg = /^blob:/i;
                    if (!blobReg.test(video.currentSrc) && !blobReg.test(video.src)) {
                        addPopupWithControls(video);
                    }
                }

                if (!exclusionClasses.inline.some((className) => video.closest(`.${className}`))) {
                    if (!video.hasAttribute('playsinline')) {
                        video.setAttribute('playsinline', 'true');
                        video.setAttribute('webkit-playsinline', 'true');
                    }
                }

                if (!exclusionClasses.playPause.some((className) => video.closest(`.${className}`))) {
                    new VisibilityHandler(video);
                }
            }
        });
    };

    processVideos();

    new MutationHandler(processVideos);
})();
