// 藥戰手冊網站：離線用的快取（第 84 批改寫成好讀的寫法，功能跟以前一樣）
// 只處理「這個網站自己的檔案」；別的網址一律不管。
"use strict";

var HB_VERSION = "24fed83064";
var HB_CACHE_NAME = "hb-" + HB_VERSION;
var HB_ASSET_FILES = ["hb.css?v=" + HB_VERSION, "hb3d.js?v=" + HB_VERSION, "hb.js?v=" + HB_VERSION];
var HB_PAGE_FILES = ["hb.html", "index.html"];
var HB_SETTING_FILES = ["cfg.js"];
var HB_LATER_FILES = ["hbpdf.js", "hbcmap.js"];
var HB_SITE_ROOT = self.registration.scope;

function hbFullUrl(name) {
  return new URL(name, HB_SITE_ROOT).href;
}

function hbSaveCopy(request, response) {
  try {
    var copy = response.clone();
    caches.open(HB_CACHE_NAME).then(function (box) { return box.put(request, copy); }).catch(function () {});
  } catch (err) {}
}

function hbWithTimeLimit(promise, ms) {
  return new Promise(function (resolve, reject) {
    var timer = setTimeout(function () { reject(new Error("timeout")); }, ms);
    promise.then(function (r) { clearTimeout(timer); resolve(r); }, function (e) { clearTimeout(timer); reject(e); });
  });
}

function hbFromCache(request, fallbackName) {
  return caches.open(HB_CACHE_NAME).then(function (box) {
    return box.match(request, { ignoreSearch: true }).then(function (found) {
      if (found) return found;
      return fallbackName ? box.match(hbFullUrl(fallbackName)) : null;
    });
  });
}

// 網路優先：拿得到就用新的（順便存一份），拿不到才用存著的
function hbNetworkFirst(request, ms, fallbackName) {
  return hbWithTimeLimit(fetch(request), ms).then(function (response) {
    if (response && response.ok) hbSaveCopy(request, response);
    return response;
  }).catch(function () {
    return hbFromCache(request, fallbackName).then(function (found) { return found || Response.error(); });
  });
}

// 存的優先：程式檔（網址有版本號，內容不會變）
function hbCacheFirst(request) {
  return hbFromCache(request).then(function (found) {
    if (found) return found;
    return fetch(request).then(function (response) {
      if (response && response.ok) hbSaveCopy(request, response);
      return response;
    });
  });
}

self.addEventListener("install", function (event) {
  var all = HB_ASSET_FILES.concat(HB_PAGE_FILES, HB_SETTING_FILES);
  event.waitUntil(caches.open(HB_CACHE_NAME).then(function (box) {
    return Promise.all(all.map(function (name) { return box.add(hbFullUrl(name)).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

// 換新版本：把舊版本的快取清掉
self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (names) {
    return Promise.all(names.filter(function (n) { return n.indexOf("hb-") === 0 && n !== HB_CACHE_NAME; }).map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;
  var url = request.url.split("#")[0];
  if (url.indexOf(HB_SITE_ROOT) !== 0) return;
  var path = url.slice(HB_SITE_ROOT.length), name = path.split("?")[0];
  if (request.mode === "navigate") {
    if (name === "hb.html" || name === "index.html") event.respondWith(hbNetworkFirst(request, 4000));
    else if (name === "") event.respondWith(hbNetworkFirst(request, 4000, "index.html"));
    return;
  }
  if (HB_ASSET_FILES.indexOf(path) >= 0 || HB_LATER_FILES.indexOf(name) >= 0) { event.respondWith(hbCacheFirst(request)); return; }
  if (HB_SETTING_FILES.indexOf(name) >= 0) { event.respondWith(hbNetworkFirst(request, 3000)); return; }
});
