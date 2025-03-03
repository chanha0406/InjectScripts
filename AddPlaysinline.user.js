// ==UserScript==
// @name         Add playsinline, Auto Play/Pause, Toggle Controls, and Popup Menu with Blob Download (Vanilla JS Version)
// @namespace    http://tampermonkey.net/
// @version      5.3
// @description  Add playsinline to all videos, control play/pause based on visibility, toggle controls, and show a popup menu synchronized with the video controller and improved Blob Download.
// @match        *://*/*
// @updateURL    https://raw.githubusercontent.com/chanha0406/InjectScripts/master/AddPlaysinline.user.js
// @downloadURL  https://raw.githubusercontent.com/chanha0406/InjectScripts/master/AddPlaysinline.user.js
// @exclude      *://*.youtube.com/*
// @exclude      *://youtube.com/*
// @exclude      *://cloud.*/*
// @exclude      *://*file.*/*
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const exclusionClasses = {
        playPause: ['jwplayer', 'auto_media'],
        inline: ['jwplayer', 'auto_media'],
        popup: ['auto_media']
    };

    const createButton = (icon, style, onClick) => {
        const button = document.createElement('button');
        button.innerHTML = icon;
        Object.assign(button.style, {
            padding: '5px',
            margin: '5px',
            border: 'none',
            cursor: 'pointer',
            background: 'transparent',
            fontSize: '18px',
            display: 'inline-block',
            ...style
        });
        button.addEventListener('click', onClick);
        return button;
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
                background: '#fff',
                border: '1px solid #ccc',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                padding: '5px',
                borderRadius: '8px',
                display: 'none',
                whiteSpace: 'nowrap',
                textAlign: 'center'
            });

            let hideTimeout;

            const updatePopupPosition = () => {
                const rect = video.getBoundingClientRect();
                popup.style.left = `${rect.left + window.scrollX}px`;
                popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
                popup.style.display = 'block';
            };

            const hidePopup = () => {
                hideTimeout = setTimeout(() => {
                    if (!popup.matches(':hover') && !video.matches(':hover')) {
                        popup.style.display = 'none';
                    }
                }, 1000);
            };

            popup.addEventListener('mouseenter', () => {
                clearTimeout(hideTimeout);
                popup.style.display = 'block';
            });

            popup.addEventListener('mouseleave', hidePopup);

            const copyButton = createButton('🔗', {}, async () => {
                const videoURL = video.currentSrc || video.src;
                await navigator.clipboard.writeText(videoURL);
                alert('비디오 URL이 복사되었습니다.');
            });

            const openButton = createButton('🌐', {}, () => {
                window.open(video.currentSrc || video.src, '_blank');
            });

            const blobDownloadButton = createButton('📥', {}, async () => {
                const videoURL = video.currentSrc || video.src;
                const fileName = getFileNameFromURL(videoURL);

                try {
                    const response = await fetch(videoURL, { mode: 'cors' });
                    if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);
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
                    alert('다운로드 실패. 직접 시도해 주세요.');
                }
            });

            popup.appendChild(copyButton);
            popup.appendChild(openButton);
            popup.appendChild(blobDownloadButton);
            document.body.appendChild(popup);

            video.addEventListener('mouseenter', updatePopupPosition);
            video.addEventListener('mouseleave', () => {
                hidePopup();
            });
        } else {
            popup = document.getElementById(popupId);
        }

        return popup;
    };

    const processVideos = () => {
        document.querySelectorAll('video').forEach((video) => {
            if (!video.dataset.popupId) {
                if (!exclusionClasses.popup.some((className) => video.closest(`.${className}`))) {
                    createPopupMenu(video);
                }

                if (!exclusionClasses.inline.some((className) => video.closest(`.${className}`))) {
                    if (!video.hasAttribute('playsinline')) {
                        video.setAttribute('playsinline', 'true');
                        video.setAttribute('webkit-playsinline', 'true');
                    }
                }
            }
        });
    };

    processVideos();

    const observer = new MutationObserver(() => {
        processVideos();
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
