/* share.js — 第 74 批：藥戰手冊「📱 加入藥戰手冊」的「📤 分享給好友」（LINE 的 LIFF：選擇傳送對象 → 送出一張卡片）。
   LINE 卡片上的按鍵帶來：i＝LIFF ID（放在藥戰手冊 Apps Script 的指令碼屬性 YZ_LIFF_ID，程式裡沒有寫）、u＝加好友的網址。
   送出去的卡片：上面一張圖（share-banner.png）、「💊 邀請你加入「藥戰手冊」」、「➕ 加入好友」、「📤 分享給好友」（可以再轉給別的同事）。不寫醫院的名字。 */
(function () {
  "use strict";
  var m = document.getElementById("m"), again = document.getElementById("again");
  var say = function (t) { m.textContent = t; };
  var q = new URLSearchParams(location.search || "");
  var st = q.get("liff.state");   // LINE 第一次開的時候，參數包在 liff.state 裡
  if (st) { try { new URLSearchParams(String(st).replace(/^[^?]*\?/, "")).forEach(function (v, k) { if (!q.get(k)) q.set(k, v); }); } catch (e) { /* 沒關係 */ } }
  var id = q.get("i") || "", u = q.get("u") || "";
  if (!/^\d{6,12}-[A-Za-z0-9]{6,12}$/.test(id) || !/^https:\/\/(line\.me\/R\/ti\/p\/|lin\.ee\/)[A-Za-z0-9@%._~\-\/]{1,80}$/.test(u)) { say("這個分享連結不完整，請回 LINE 再按一次「📤 分享給好友」。"); return; }
  if (!window.liff) { say("LINE 的分享功能載入失敗，等一下再試。"); return; }
  var base = location.href.replace(/[?#].*$/, "").replace(/[^\/]*$/, "");
  var me = "https://liff.line.me/" + id + "?i=" + encodeURIComponent(id) + "&u=" + encodeURIComponent(u);
  var card = { type: "flex", altText: "💊 邀請你加入「藥戰手冊」", contents: {
    type: "bubble", size: "mega",
    hero: { type: "image", url: base + "share-banner.png", size: "full", aspectRatio: "20:9", aspectMode: "cover" },
    body: { type: "box", layout: "vertical", spacing: "sm", paddingAll: "14px", contents: [
      { type: "text", text: "💊 邀請你加入「藥戰手冊」", weight: "bold", size: "md", color: "#13312F", wrap: true },
      { type: "text", text: "藥局同事用的 LINE 手冊：查藥、查流程、問卷。", size: "sm", color: "#334155", wrap: true },
      { type: "text", text: "加好友以後打員工編號＋姓名申請。", size: "xs", color: "#64748B", wrap: true }
    ] },
    footer: { type: "box", layout: "vertical", spacing: "sm", paddingAll: "10px", contents: [
      { type: "button", style: "primary", height: "sm", color: "#0E7C66", action: { type: "uri", label: "➕ 加入好友", uri: u } },
      { type: "button", style: "secondary", height: "sm", action: { type: "uri", label: "📤 分享給好友", uri: me } }
    ] }
  } };
  var pick = function () {
    again.hidden = true;
    say("請選要傳給誰…");
    liff.shareTargetPicker([card], { isMultiple: true }).then(function (res) {
      if (res) { say("✅ 已經分享出去了"); setTimeout(function () { try { if (liff.isInClient()) liff.closeWindow(); } catch (e) { /* 沒關係 */ } }, 900); }
      else { say("沒有分享（取消了）。"); again.hidden = false; }
    }, function (e) { say("沒辦法分享：" + String(e && e.message || e).slice(0, 80)); again.hidden = false; });
  };
  again.onclick = pick;
  liff.init({ liffId: id }).then(function () {
    if (!liff.isLoggedIn()) { liff.login({ redirectUri: location.href }); return; }
    if (!liff.isApiAvailable("shareTargetPicker")) { say("這個 LINE 不能用分享（請更新 LINE，或用手機的 LINE 按）。"); return; }
    pick();
  }, function (e) { say("沒辦法打開分享：" + String(e && e.message || e).slice(0, 80)); });
})();
