// ==UserScript==
// @name         Add playsinline, Auto Play/Pause, Toggle Controls, and Popup Menu with Blob Download (jQuery Version)
// @namespace    http://tampermonkey.net/
// @version      4.80
// @description  Add playsinline to all videos, control play/pause based on visibility, toggle controls, and show a popup menu synchronized with the video controller and improved Blob Download.
// @match        *://*/*
// @updateURL    https://raw.githubusercontent.com/chanha0406/InjectScripts/master/AddPlaysinline.user.js
// @downloadURL  https://raw.githubusercontent.com/chanha0406/InjectScripts/master/AddPlaysinline.user.js
// @run-at       document-start
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(function () {
    'use strict';

    const excludedPlayPauseClasses = ['jwplayer', 'auto_media'];
    const excludedInlineClasses = ['jwplayer', 'auto_media'];
    const excludedPopupClasses = ['auto_media'];

    const addPlaysInline = (video) => {
        if (!$(video).attr('playsinline')) {
            $(video).attr('playsinline', 'true');
            $(video).attr('webkit-playsinline', 'true');
        }
    };

    const setupControlToggle = (video, updatePopupPosition) => {
        let NextControls = !video.controls;

        $(video).off('click').on('click.controlToggle', (event) => {
            const videoRect = video.getBoundingClientRect();
            const controlAreaY = videoRect.bottom - 40;

            if (event.clientY < controlAreaY) {
                video.controls = NextControls;
                NextControls = !NextControls;
                updatePopupPosition();
            }
        });

        $(video).on('pause', () => {
            video.controls = true;
            NextControls = false;
            updatePopupPosition();
        });

        $(video).on('play', () => {
            video.controls = false;
            NextControls = true;
            updatePopupPosition();
        });
    };


  const monitorEvents = (video, updatePopupPosition) => {
      const observer = new MutationObserver(() => {
          const events = $._data(video, 'events');
          if (!events || !events.click || !events.click.some(e => e.namespace === 'controlToggle')) {
            $(video).off('click').on('click.controlToggle', (event) => {
                const videoRect = video.getBoundingClientRect();
                const controlAreaY = videoRect.bottom - 40;

                if (event.clientY < controlAreaY) {
                    video.controls = NextControls;
                    NextControls = !NextControls;
                    updatePopupPosition();
                }
            });
          }
      });
      observer.observe(video, { attributes: true });
  };


    const getFileNameFromURL = (url) => {
        try {
            return decodeURIComponent(url.split('/').pop().split('?')[0]) || 'video.mp4';
        } catch (e) {
            return 'video.mp4';
        }
    };

    const createPopupMenu = (video) => {
        let popupId = $(video).data('popup-id');
        let $popup;

        if (!popupId) {
            popupId = `popup-${Math.random().toString(36).substr(2, 9)}`;
            $(video).data('popup-id', popupId);

            $popup = $('<div></div>', {
                id: popupId,
                css: {
                    position: 'absolute',
                    zIndex: 9999,
                    background: 'white',
                    border: '1px solid #ccc',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    padding: '10px',
                    borderRadius: '8px',
                    display: 'none',
                },
            });

            const $copyButton = $('<button>Copy URL</button>').css({ marginRight: '10px', cursor: 'pointer' }).on('click', async () => {
                const videoURL = video.currentSrc || video.src;
                try {
                    await navigator.clipboard.writeText(videoURL);
                    alert('Video URL copied to clipboard: ' + videoURL);
                } catch (error) {
                    console.error('Failed to copy URL:', error);
                    alert('Failed to copy URL. Please try again.');
                }
            });

            const $openButton = $('<button>Open</button>').css({ marginRight: '10px', cursor: 'pointer' }).on('click', () => {
                const videoURL = video.currentSrc || video.src;
                window.open(videoURL, '_blank');
            });

            const $blobDownloadButton = $('<button>Blob Download</button>').css({ cursor: 'pointer' }).on('click', async () => {
                const videoURL = video.currentSrc || video.src;
                const fileName = getFileNameFromURL(videoURL);

                try {
                    const response = await fetch(videoURL, { mode: 'cors' });

                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }

                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);

                    const link = $('<a></a>').attr({ href: url, download: fileName }).appendTo('body');
                    link[0].click();
                    link.remove();
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

            $popup.append($copyButton, $openButton, $blobDownloadButton).appendTo('body');
        } else {
            $popup = $(`#${popupId}`);
        }

        return $popup;
    };

    const addPopupWithControls = (video) => {
        const $popup = createPopupMenu(video);

        const updatePopupPosition = () => {
            const rect = video.getBoundingClientRect();
            $popup.css({
                left: `${rect.left + window.scrollX}px`,
                top: `${rect.bottom + window.scrollY + 5}px`,
                display: video.controls ? 'block' : 'none',
            });
        };

        setupControlToggle(video, updatePopupPosition);
        monitorEvents(video, updatePopupPosition);

    };

    const addVisibilityPlayPause = (video) => {
        if ($(video).attr('autoplay')) {
            $(video).removeAttr('autoplay');
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                        if (video.paused) {
                            video.play();
                        }
                    } else {
                        if (!video.paused) {
                            video.pause();
                        }
                    }
                });
            },
            { threshold: [0.3] }
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

        $(video).on('loadeddata canplay', onVideoLoad);
    };

    const processVideos = () => {
        $('video').each((_, video) => {
            if (!$(video).data('popup-id')) {
                if (!excludedPopupClasses.some((className) => $(video).closest(`.${className}`).length)) {
                    addPopupWithControls(video);
                }

                if (!excludedInlineClasses.some((className) => $(video).closest(`.${className}`).length)) {
                    addPlaysInline(video);
                }

                if (!excludedPlayPauseClasses.some((className) => $(video).closest(`.${className}`).length)) {
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
