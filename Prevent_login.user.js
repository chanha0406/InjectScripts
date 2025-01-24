// ==UserScript==
// @name         Inline comment
// @version      1.9
// @description  Inline comment image, video + Add button in video.
// @match        https://m.fmkorea.com/*
// @match        https://www.fmkorea.com/*
// @grant        none
// @run-at  document-end
// @updateURL https://raw.githubusercontent.com/chanha0406/InjectScripts/master/Prevent_login.user.js
// @downloadURL https://raw.githubusercontent.com/chanha0406/InjectScripts/master/Prevent_login.user.js
// ==/UserScript==

(function () {
    'use strict';

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            window.is_logged_variable='true'

            if (mutation.type === 'childList' || mutation.type === 'subtree') {

                //본문 비디오 다운로드 링크 연결
                // 모든 mejs__inner 요소 찾기
                const videoContainers = document.querySelectorAll('.mejs__inner');

                videoContainers.forEach(container => {
                    // 각 비디오 요소 찾기
                    const videoElement = container.querySelector('video');
                    // 비디오 URL 추출
                    const videoUrl = videoElement ? videoElement.getAttribute('src') : null;

                    // 다운로드 버튼 찾기
                    const downloadButton = container.querySelector('.mejs__button.mejs__download-file');

                    // 버튼에 'downloading' 클래스가 없다면 처리
                    if (downloadButton && !downloadButton.classList.contains('downloading')) {
                        // 다운로드 버튼에 'downloading' 클래스 추가
                        downloadButton.classList.add('downloading');

                        // 애니메이션을 비활성화하기 위해 스타일 직접 적용
                        downloadButton.style.animation = 'none'; // 애니메이션 중지
                        downloadButton.style.transition = 'none'; // 트랜지션 중지 (필요한 경우)

                        // 기존 이벤트 제거 (다운로드 버튼 클릭 이벤트 초기화)
                        const cloneButton = downloadButton.cloneNode(true);
                        downloadButton.parentNode.replaceChild(cloneButton, downloadButton);

                        if (cloneButton && videoUrl) {
                            cloneButton.addEventListener('click', function (event) {
                                event.preventDefault();
                                // 비디오 URL을 Blob으로 처리하여 다운로드 트리거
                                fetch(videoUrl)
                                .then(response => response.blob())  // 비디오 URL로부터 Blob 객체 생성
                                .then(blob => {
                                    const link = document.createElement('a');
                                    const url = URL.createObjectURL(blob);  // Blob URL 생성
                                    link.href = url;
                                    link.download = videoUrl.split('/').pop(); // 파일명은 URL의 마지막 부분을 사용
                                    document.body.appendChild(link); // 링크를 body에 추가해야 정상적으로 동작
                                    link.click();  // 다운로드 시작
                                    document.body.removeChild(link); // 다운로드 후 링크 제거
                                    URL.revokeObjectURL(url);  // Blob URL 해제
                                })
                                .catch(error => {
                                    console.error('Download failed:', error);
                                });
                            });
                        }

                        // PIP 버튼 추가
                        if (videoUrl) {
                            // PIP 버튼 만들기
                            const pipButton = document.createElement('button');
                            pipButton.textContent = '🖼️';
                            pipButton.classList.add('mejs__button', 'mejs__open-file');
                            pipButton.style.cursor = 'pointer';
                            pipButton.style.backgroundColor = 'transparent';  // 배경 투명
                            pipButton.style.border = 'none';  // 테두리 제거
                            pipButton.style.fontSize = '16px';  // 폰트 크기 조정
                            pipButton.style.textAlign = 'center';  // 텍스트 정렬
                            pipButton.style.padding = '0px'; 
                            
                            let isPIP = false;
                            pipButton.addEventListener('click', function (event) {
                                event.preventDefault();
                                if (!isPIP) {
                                    videoElement.requestPictureInPicture();
                                    videoElement.play();
                                    isPIP = true;
                                }
                                else {
                                    document.exitPictureInPicture();
                                    isPIP = false;
                                }
                            });

                            // 다운로드 버튼 옆에 PIP 버튼 추가
                            if (cloneButton) {
                                cloneButton.parentNode.insertBefore(pipButton, cloneButton.nextSibling);
                            }

                            const copyButton = document.createElement('button');
                            copyButton.textContent = '🔗';
                            copyButton.classList.add('mejs__button', 'mejs__open-file');
                            copyButton.style.cursor = 'pointer';
                            copyButton.style.backgroundColor = 'transparent';  // 배경 투명
                            copyButton.style.border = 'none';  // 테두리 제거
                            copyButton.style.fontSize = '16px';  // 폰트 크기 조정
                            copyButton.style.textAlign = 'center';  // 텍스트 정렬
                            copyButton.style.padding = '0px'; 

                            copyButton.onclick = async () => {
                                try {
                                    await navigator.clipboard.writeText(videoUrl);
                                    alert('Video URL copied to clipboard: ' + videoUrl);
                                } catch (error) {
                                    console.error('Failed to copy URL:', error);
                                    alert('Failed to copy URL. Please try again.');
                                }
                            };

                            // 다운로드 버튼 옆에 PIP 버튼 추가
                            if (cloneButton) {
                                cloneButton.parentNode.insertBefore(copyButton, cloneButton.nextSibling);
                            }
                        }
                    }
                });

                // 댓글 요소에서 링크를 처리
                document.querySelectorAll('[id^="comment"]').forEach((commentElement) => {
                    // 이미지 링크 처리
                    const imageLinks = commentElement.querySelectorAll('a[href*=".jpg"]:not(:has(img)), \
                                                                         a[href*=".png"]:not(:has(img)), \
                                                                         a[href*=".gif"]:not(:has(img)), \
                                                                         a[href*=".jpeg"]:not(:has(img)), \
                                                                         a[href*=".webp"]:not(:has(img)), \
                                                                         a[href*="format=jpg"]:not(:has(img)), \
                                                                         a[href*="format=jpeg"]:not(:has(img))');

                    imageLinks.forEach((link) => {
                        const imageUrl = link.href;
                        const img = document.createElement('img');
                        img.src = imageUrl;
                        img.alt = link.textContent || 'Embedded image';

                        if (link.className) {
                            img.className = link.className;
                        }

                        img.style.maxWidth = '100%';
                        img.style.height = 'auto';

                        link.parentNode.replaceChild(img, link);
                    });

                    // 비디오 링크 처리
                    const videoLinks = commentElement.querySelectorAll('a[href*=".mp4"]:not(:has(video)), \
                                                                         a[href*=".mov"]:not(:has(video))');

                    videoLinks.forEach((link) => {
                        const videoUrl = link.href;
                        const video = document.createElement('video');
                        video.src = videoUrl;
                        video.controls = true; // 재생 컨트롤 활성화
                        video.style.maxWidth = '100%';
                        video.style.height = 'auto';

                        if (link.className) {
                            video.className = link.className;
                        }

                        link.parentNode.replaceChild(video, link);
                    });
                });

                // 특정 클래스의 요소 제거 및 속성 처리
                const elementsToRemove = [
                    '.level',
                    '.fm_vote',
                    '.logo',
                    '.hd>.h1',
                ];

                elementsToRemove.forEach((selector) => {
                    document.querySelectorAll(selector).forEach((element) => {
                        element.remove();
                        //console.log(`${selector} 요소 제거`);
                    });
                });

                // '포텐' 텍스트 변경
                document.querySelectorAll('*').forEach((element) => {
                    element.childNodes.forEach((node) => {
                        if (node.nodeType === 3 && node.textContent.includes('포텐')) {
                            node.textContent = node.textContent.replace(/포텐/g, '추천');
                            //console.log("'포텐'을 '추천'으로 변경");
                        }
                    });
                });

                console.log("노드 및 속성 수정 완료");
            }
        });
    });

    // MutationObserver 설정
    observer.observe(document.body, {
        childList: true, // 자식 노드 추가/삭제 감지
        subtree: true,   // 하위 노드 감지
    });
})();


