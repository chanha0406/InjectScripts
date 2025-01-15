// ==UserScript==
// @name         Prevent login script
// @version      1.0
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
            if (mutation.type === 'childList' || mutation.type === 'subtree') {
                // 댓글 요소에서 링크를 처리
                document.querySelectorAll('[id^="comment"]').forEach((commentElement) => {
                    // 이미지 링크 처리
                    const imageLinks = commentElement.querySelectorAll('a[href*=".jpg"]:not(:has(img)), \
                                                                         a[href*=".png"]:not(:has(img)), \
                                                                         a[href$=".gif"]:not(:has(img)), \
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
                    const videoLinks = commentElement.querySelectorAll('a[href$=".mp4"]:not(:has(video)), \
                                                                         a[href$=".mov"]:not(:has(video))');

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


