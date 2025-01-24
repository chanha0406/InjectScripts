// ==UserScript==
// @name         Inline comment
// @version      2.2
// @description  Inline comment image, video + Add button in video.
// @match        https://m.fmkorea.com/*
// @match        https://www.fmkorea.com/*
// @grant        none
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/chanha0406/InjectScripts/master/Prevent_login.user.js
// @downloadURL  https://raw.githubusercontent.com/chanha0406/InjectScripts/master/Prevent_login.user.js
// ==/UserScript==

(function () {
    'use strict';

    const observer = new MutationObserver(handleMutations);

    // MutationObserver 설정
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    // Observer disconnect를 위한 정리 함수
    function disconnectObserver() {
        observer.disconnect();
        console.log('Observer disconnected to prevent memory leaks.');
    }

    window.addEventListener('beforeunload', disconnectObserver);

    const CONFIG = {
        UNWANTED_SELECTORS: ['.level', '.fm_vote', '.logo', '.hd>.h1'],
        TEXT_REPLACEMENT_TARGET: ['p', 'span', 'div'] // Elements likely to contain text for replacement
    };

    /**
     * MutationObserver에서 호출되는 메인 핸들러
     */
    function handleMutations(mutations) {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'subtree') {
                handleVideoDownloadButtons();
                handleCommentLinks();
                removeUnwantedElements();
                replaceTextContent();
            }
        });
    }

    /**
     * 비디오 다운로드 및 PIP 버튼 추가
     */
    function handleVideoDownloadButtons() {
        const videoContainers = document.querySelectorAll('.mejs__inner');

        videoContainers.forEach(container => {
            const videoElement = container.querySelector('video');
            const videoUrl = videoElement?.getAttribute('src');
            const downloadButton = container.querySelector('.mejs__button.mejs__download-file');

            if (downloadButton && !downloadButton.classList.contains('downloading')) {
                prepareDownloadButton(downloadButton, videoUrl);
                addPipButton(container, videoElement);
                addCopyButton(container, videoUrl);
            }
        });
    }

    function prepareDownloadButton(button, videoUrl) {
        button.classList.add('downloading');
        button.style.animation = 'none';
        button.style.transition = 'none';

        const cloneButton = button.cloneNode(true);
        button.parentNode.replaceChild(cloneButton, button);

        if (cloneButton && videoUrl) {
            attachDownloadEvent(cloneButton, videoUrl);
        }
    }

    function attachDownloadEvent(button, videoUrl) {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            downloadVideo(videoUrl);
        });
    }

    function downloadVideo(videoUrl) {
        fetch(videoUrl)
            .then(response => response.blob())
            .then(blob => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = videoUrl.split('/').pop();
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            })
            .catch(error => console.error('Download failed:', error));
    }

    function addPipButton(container, videoElement) {
        if (!videoElement) return;

        const pipButton = createButton('🖼️');
        let isPIP = false;

        pipButton.addEventListener('click', () => {
            if (!isPIP) {
                videoElement.requestPictureInPicture();
                videoElement.play();
                isPIP = true;
            } else {
                document.exitPictureInPicture();
                isPIP = false;
            }
        });

        container.appendChild(pipButton);
    }

    function addCopyButton(container, videoUrl) {
        if (!videoUrl) return;

        const copyButton = createButton('🔗');

        copyButton.onclick = async () => {
            try {
                await navigator.clipboard.writeText(videoUrl);
                alert(`Video URL copied to clipboard: ${videoUrl}`);
            } catch (error) {
                console.error('Failed to copy URL:', error);
                alert('Failed to copy URL. Please try again.');
            }
        };

        container.appendChild(copyButton);
    }

    /**
     * 댓글 링크 처리 (이미지/비디오 포함)
     */
    function handleCommentLinks() {
        document.querySelectorAll('[id^="comment"]').forEach(commentElement => {
            replaceLinksWithImages(commentElement);
            replaceLinksWithVideos(commentElement);
        });
    }

    function replaceLinksWithImages(container) {
        const imageLinks = container.querySelectorAll('a[href*=".jpg"], a[href*=".png"], a[href*=".gif"], a[href*=".jpeg"], a[href*=".webp"]');

        imageLinks.forEach(link => {
            const img = document.createElement('img');
            img.src = link.href;
            img.alt = link.textContent || 'Embedded image';
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            link.parentNode.replaceChild(img, link);
        });
    }

    function replaceLinksWithVideos(container) {
        const videoLinks = container.querySelectorAll('a[href*=".mp4"], a[href*=".mov"]');

        videoLinks.forEach(link => {
            const video = document.createElement('video');
            video.src = link.href;
            video.controls = true;
            video.style.maxWidth = '100%';
            video.style.height = 'auto';
            link.parentNode.replaceChild(video, link);
        });
    }

    /**
     * 불필요한 요소 제거
     */
    function removeUnwantedElements() {
        CONFIG.UNWANTED_SELECTORS.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => element.remove());
        });
    }

    /**
     * 텍스트 내용 변경 (예: '포텐' → '추천')
     */
    function replaceTextContent() {
        CONFIG.TEXT_REPLACEMENT_TARGET.forEach(tag => {
            document.querySelectorAll(tag).forEach(element => {
                element.childNodes.forEach(node => {
                    if (node.nodeType === 3 && node.textContent.includes('포텐')) {
                        node.textContent = node.textContent.replace(/포텐/g, '추천');
                    }
                });
            });
        });
    }

    /**
     * 헬퍼 함수: 버튼 생성
     */
    function createButton(label, options = {}) {
        const button = document.createElement('button');
        button.textContent = label;
        button.classList.add('mejs__button');
        button.style.cursor = 'pointer';
        button.style.backgroundColor = 'transparent';
        button.style.border = 'none';
        button.style.fontSize = '16px';
        button.style.padding = '0px';

        // Apply additional styles and classes
        if (options.classes) {
            options.classes.forEach(cls => button.classList.add(cls));
        }

        if (options.styles) {
            Object.entries(options.styles).forEach(([key, value]) => {
                button.style[key] = value;
            });
        }

        return button;
    }
})();
