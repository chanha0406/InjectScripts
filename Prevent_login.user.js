// ==UserScript==
// @name         Prevent login script
// @version      2025-01-22
// @description  Remove login and logo + etc
// @match        https://m.fmkorea.com/*
// @match        https://www.fmkorea.com/*
// @grant        none
// @updateURL https://raw.githubusercontent.com/chanha0406/InjectScripts/refs/heads/master/Prevent_login.user.js
// @downloadURL https://raw.githubusercontent.com/chanha0406/InjectScripts/refs/heads/master/Prevent_login.user.js
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
                        const cloneButton = downloadButton.cloneNode(true); // 버튼 복제
                        downloadButton.parentNode.replaceChild(cloneButton, downloadButton); // 기존 버튼을 복제한 버튼으로 교체

                        // 다운로드 버튼 클릭 이벤트 리스너 추가
                        if (cloneButton && videoUrl) {
                            cloneButton.addEventListener('click', function(event) {
                                // 기본 동작 방지 (새 탭에서 열리는 것을 방지)
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

                // .bd_login 클래스 처리
                document.querySelectorAll('.bd_login').forEach((element) => {
                    let shouldReplace = false;

                    if (element.hasAttribute('onclick')) {
                        element.removeAttribute('onclick');
                        shouldReplace = true;
                    }

                    if (element.hasAttribute('href')) {
                        element.removeAttribute('href');
                        shouldReplace = true;
                    }

                    if (shouldReplace) {
                        element.replaceWith(element.cloneNode(true));
                        //console.log("bd_login 속성 제거 및 노드 교체");
                    }
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

            // 속성(attribute) 변경 처리
            if (mutation.type === 'attributes' && mutation.target.classList.contains('bd_login')) {
                let shouldReplace = false;

                if (mutation.target.hasAttribute('onclick')) {
                    mutation.target.removeAttribute('onclick');
                    shouldReplace = true;
                }

                if (mutation.target.hasAttribute('href')) {
                    mutation.target.removeAttribute('href');
                    shouldReplace = true;
                }

                if (shouldReplace) {
                    mutation.target.replaceWith(mutation.target.cloneNode(true));
                    //console.log("bd_login 속성 제거 및 노드 교체");
                }
            }
        });
    });

    // MutationObserver 설정
    observer.observe(document.body, {
        childList: true, // 자식 노드 추가/삭제 감지
        subtree: true,   // 하위 노드 감지
        attributes: true, // 속성 변경 감지
    });
})();


