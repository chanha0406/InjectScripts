// ==UserScript==
// @name         Add playsinline, Auto Play/Pause, Toggle Controls, and Popup Menu with Blob Download (Vanilla JS Version)
// @namespace    http://tampermonkey.net/
// @version      5.6
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
                }, 500);
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
            video.addEventListener('mouseleave', hidePopup);
        } else {
            popup = document.getElementById(popupId);
        }

        return popup;
    };

const setupAutoPlayPause = (video) => {
    if (!exclusionClasses.playPause.some(className => video.closest(`.${className}`))) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    video.play();
                    video.controls = false; // 🎯 자동 재생 시 컨트롤 숨김
                } else {
                    video.pause();
                    video.controls = true; // 🎯 정지 시 컨트롤 다시 표시
                }
            });
        }, { threshold: 0.5 });

        observer.observe(video);

        // 🎯 마우스를 올리거나 터치하면 컨트롤 다시 표시
        video.addEventListener('mouseenter', () => video.controls = true);
        video.addEventListener('mouseleave', () => {
            if (!video.paused) video.controls = false; // 재생 중일 때만 숨김
        });
        video.addEventListener('touchstart', () => video.controls = true);
    }
};

    const processVideos = () => {
        document.querySelectorAll('video').forEach((video) => {
            if (video.dataset.processed) return;

            // 팝업 메뉴 추가 (popup 제외 클래스 적용)
            if (!exclusionClasses.popup.some(className => video.closest(`.${className}`))) {
                createPopupMenu(video);
            }

            // playsinline 속성 적용 (inline 제외 클래스 적용)
            if (!exclusionClasses.inline.some(className => video.closest(`.${className}`))) {
                if (!video.hasAttribute('playsinline')) {
                    video.setAttribute('playsinline', 'true');
                    video.setAttribute('webkit-playsinline', 'true');
                }
            }

            // 자동 재생 및 정지 기능 적용
            setupAutoPlayPause(video);

            // 중복 적용 방지 플래그 추가
            video.dataset.processed = "true";
        });
    };

    processVideos();

    const observer = new MutationObserver(() => {
        processVideos();
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();