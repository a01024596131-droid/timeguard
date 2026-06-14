// ============================================================
//  service-worker.js  (백그라운드에서 도는 작은 일꾼)
//
//  이 파일은 일반 화면 코드와 따로, 브라우저 뒤편에서 돌아갑니다.
//  하는 일은 두 가지예요.
//   1) 앱 파일을 저장(캐시)해서 인터넷이 없어도 실행되게 함
//   2) 화면(index.html)이 보낸 신호를 받아 '알림'을 띄움
// ============================================================

const CACHE_NAME = "timeguard-v1";

// 앱이 처음 깔릴 때, 꼭 필요한 파일들을 미리 저장해 둡니다.
const FILES_TO_CACHE = [
  "./index.html",
  "./manifest.json",
];

// (1) 설치 단계: 위 파일들을 캐시에 저장
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// (2) 활성화 단계: 예전 캐시가 있으면 정리
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// (3) 파일 요청이 오면: 캐시에 있으면 그걸 주고, 없으면 인터넷에서 가져옴
//     → 덕분에 인터넷이 끊겨도 앱이 열립니다.
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// (4) 화면에서 "알림 띄워줘" 메시지를 보내면 여기서 실제 알림을 표시
//     → 화면(탭)이 잠깐 가려져 있어도 이 일꾼이 살아 있으면 알림이 떠요.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHOW_ALARM") {
    self.registration.showNotification("스마트 타임가드", {
      body: "스마트폰 사용 시간이 끝났습니다!",
      tag: "timeguard-end",
      vibrate: [600, 150, 600],
      requireInteraction: true, // 사용자가 누를 때까지 알림 유지
    });
  }
});

// (5) 알림을 누르면 앱 화면을 다시 켜줌
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("./index.html"));
});
