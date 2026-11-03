var CodeIn = (function () {
  "use strict";
  var N = 6;
  var GAP = /[\s\u200b-\u200d\u2060\ufeff\u00ad\-\u2010-\u2015\u2212\ufe63\uff0d]/g;
  var INVIS;
  try { INVIS = new RegExp("[\\p{Cf}\\u034f\\u115f\\u1160\\u3164\\uffa0\\ufe00-\\ufe0f\\u{e0100}-\\u{e01ef}]", "gu"); } catch (e) { INVIS = /[\u00ad\u0600-\u0605\u061c\u06dd\u070f\u0890\u0891\u08e2\u180e\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u206f\u034f\u115f\u1160\u3164\uffa0\ufe00-\ufe0f\ufeff\ufff9-\ufffb]|\udb40[\udc00-\udfff]/g; }

  function norm(raw) {
    var s = String(raw == null ? "" : raw);
    try { if (s.normalize) s = s.normalize("NFKC"); } catch (e) { }
    return s.replace(INVIS, "").replace(GAP, "");
  }

  function decode(raw) {
    var s = norm(raw), digits = s.replace(/[^0-9]/g, ""), junk = s.replace(/[0-9]/g, "");
    var res = { raw: String(raw == null ? "" : raw), s: digits, n: digits.length, junk: junk, code: "", hint: "" };
    if (!junk && digits.length === N) res.code = digits;
    res.hint = hintOf(res);
    return res;
  }

  function hintOf(res) {
    if (!res.s && !res.junk) return "";
    if (res.junk) return /[A-Za-z]/.test(res.junk) ? "這裡要打 LINE 回給你的 6 位數驗證碼，不是代號（代號是要貼進 LINE 的）" : "驗證碼只有數字，請看 LINE 卡片上那一組 6 位數";
    if (res.n > N) return "多打了，驗證碼只有 " + N + " 個數字";
    if (res.n < N) return "還差 " + (N - res.n) + " 個數字";
    return "確認跟 LINE 卡片上的一樣，再按「登入」";
  }

  var MID = 0;
  function mount(host, opt) {
    opt = opt || {};
    var d = host.ownerDocument || document;
    function el(tag, cls, txt) { var x = d.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; }
    var box = el("form", "cdbox"), inp = el("input", "cdin"), hint = el("div", "cdh"), go = el("button", "cdgo", "登入");
    box.setAttribute("novalidate", "novalidate");
    inp.type = "text"; inp.setAttribute("inputmode", "numeric"); inp.setAttribute("pattern", "[0-9]*"); inp.setAttribute("autocomplete", "one-time-code");
    inp.setAttribute("autocapitalize", "off"); inp.setAttribute("autocorrect", "off"); inp.setAttribute("spellcheck", "false"); inp.setAttribute("enterkeyhint", "go");
    inp.setAttribute("maxlength", "24");
    inp.setAttribute("aria-label", "驗證碼（6 位數）"); inp.placeholder = "LINE 給你的 6 位數";
    var hid = "cdh" + (++MID); hint.id = hid; hint.setAttribute("aria-live", "polite"); inp.setAttribute("aria-describedby", hid);
    go.type = "button"; go.disabled = true;
    box.appendChild(inp); box.appendChild(hint); box.appendChild(go); host.appendChild(box);
    var last = null;
    function render() {
      var r = decode(inp.value); last = r;
      hint.textContent = r.hint;
      go.disabled = !r.code || !!(opt.busy && opt.busy());
      if (opt.onChange) opt.onChange(r);
    }
    function fire() { if (last && last.code && !(opt.busy && opt.busy()) && opt.onGo) opt.onGo(last.code, last); }
    ["input", "compositionstart", "compositionupdate", "compositionend", "keyup", "change", "paste"].forEach(function (ev) {
      inp.addEventListener(ev, function () { if (ev === "paste") setTimeout(render, 0); else render(); });
    });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); render(); fire(); } });
    box.addEventListener("submit", function (e) { e.preventDefault(); render(); fire(); });
    go.addEventListener("click", function () { render(); fire(); });
    render();
    return { input: inp, box: box, hint: hint, button: go, render: render, result: function () { return last; }, clear: function () { inp.value = ""; render(); }, focus: function (o) { try { inp.focus(o); } catch (e) { try { inp.focus(); } catch (e2) { } } }, setBusy: function () { render(); } };
  }

  return { decode: decode, norm: norm, mount: mount, size: N };
})();
var KB = (function () {
  "use strict";
  var RESERVED = /^(F5|F6|F10|F11|F12|Ctrl\+F5|Shift\+F5|Ctrl\+F4|Alt\+F4|Tab|Shift\+Tab|Enter|Shift\+Enter|Space|Shift\+Space|Backspace|Delete|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Home|End|PageUp|PageDown|Alt\+ArrowLeft|Alt\+ArrowRight|(Ctrl|Meta)\+(Shift\+)?[ACFLNPQRSTUVWXYZ]|(Ctrl|Meta)\+(Shift\+)?(Tab|[0-9])|Ctrl\+Shift\+[IJC]|Meta\+Alt\+[IJCU]|Alt\+(Shift\+)?F|Alt\+D|Alt\+Home)$/;
  var NAMES = { ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→", Escape: "Esc", Meta: "⌘", Space: "空白鍵", PageUp: "PgUp", PageDown: "PgDn" };
  function combo(e) {
    var k = e.key || "", c = e.code || "", base;
    if (/^(Shift|Control|Alt|Meta|OS|AltGraph|CapsLock|Dead|Process|Unidentified|Fn|FnLock|NumLock|ScrollLock)$/.test(k)) return "";
    if (/^F([1-9]|1[0-2])$/.test(k)) base = k;
    else if (/^Key[A-Z]$/.test(c)) base = c.slice(3);
    else if (/^Digit[0-9]$/.test(c)) base = c.slice(5);
    else if (/^(Arrow(Up|Down|Left|Right)|Escape|Enter|Tab|Backspace|Delete|Home|End|PageUp|PageDown|Insert)$/.test(k)) base = k;
    else if (k === " ") base = "Space";
    else if (k.length === 1) base = k;
    else return "";
    var sym = base.length === 1 && !/^[A-Z0-9]$/.test(base), m = [];
    if (e.ctrlKey) m.push("Ctrl");
    if (e.altKey) m.push("Alt");
    if (e.shiftKey && !sym) m.push("Shift");
    if (e.metaKey) m.push("Meta");
    return m.concat([base]).join("+");
  }
  function show(cb) {
    if (!cb) return "（沒有）";
    return cb.split("+").map(function (p) { return NAMES[p] || p; }).join(" + ").replace(/^Alt \+ /, "Alt + ");
  }
  function typeOk(cb) { return /(^|\+)F([1-9]|1[0-2])$/.test(cb) || /^(Ctrl|Alt|Meta)\+/.test(cb) || /(^|\+)Escape$/.test(cb); }
  function typing(t) {
    if (!t || t.nodeType !== 1) return false;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return !/^(checkbox|radio|button|submit|range|file|color)$/i.test(t.type || "");
    return !!t.isContentEditable;
  }
  function vis(el) {
    if (!el || el.disabled) return false;
    if (el.closest && el.closest("[hidden]")) return false;
    var r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    return !!(r && (r.width > 0 || r.height > 0));
  }
  function el(tag, a, kids) {
    var x = document.createElement(tag);
    Object.keys(a || {}).forEach(function (k) { if (a[k] === null || a[k] === undefined) return; if (k === "text") x.textContent = a[k]; else if (k.slice(0, 2) === "on") x[k] = a[k]; else x.setAttribute(k, a[k]); });
    (kids || []).forEach(function (c) { if (c) x.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return x;
  }
  var CSS = ".kbov{position:fixed;inset:0;z-index:2147483000;background:rgba(15,25,30,.45);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}" +
    ".kbdlg{background:var(--kb-bg,#fff);color:var(--kb-ink,#1F2A2E);border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.28);width:min(620px,100%);max-height:min(86vh,760px);display:flex;flex-direction:column;font-size:14.5px;line-height:1.5}" +
    ".kbdlg h3{margin:0;padding:14px 18px 6px;font-size:18px}.kbdlg .kbn{padding:0 18px 8px;color:#5F6B72;font-size:13px}" +
    ".kbdlg .kbl{overflow:auto;padding:0 18px 8px;flex:1 1 auto;min-height:0}.kbdlg .kbg{margin:10px 0 4px;font-weight:800;font-size:13px;color:#2B6F5E}" +
    ".kbdlg .kbr{display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid #E6ECEA}.kbdlg .kbr>.kbt{flex:1 1 auto;min-width:0}" +
    ".kbdlg kbd{display:inline-block;min-width:3.2em;text-align:center;padding:3px 8px;border:1px solid #B9C7C2;border-bottom-width:3px;border-radius:7px;background:#F6FAF8;font:600 13px/1.4 ui-monospace,Menlo,Consolas,monospace;color:#1F2A2E;white-space:nowrap}" +
    ".kbdlg kbd.none{color:#98A3A0;border-style:dashed}.kbdlg kbd.wait{background:#FFF4CC;border-color:#E0B100}" +
    ".kbdlg button{font:inherit;font-size:13px;padding:4px 10px;border-radius:8px;border:1px solid #C8D3CF;background:#fff;color:#1F2A2E;cursor:pointer}.kbdlg button:hover{background:#F1F6F4}.kbdlg button:disabled{opacity:.4;cursor:default;background:#fff}" +
    ".kbdlg button.pri{background:#1B7F5C;border-color:#1B7F5C;color:#fff}.kbdlg .kbm{padding:6px 18px;font-size:13px;min-height:1.5em;color:#8A4B00}" +
    ".kbdlg .kbb{display:flex;gap:8px;justify-content:flex-end;padding:10px 18px 14px;border-top:1px solid #E6ECEA;flex-wrap:wrap}.kbdlg .kbb .sp{flex:1}" +
    "@media (max-width:480px){.kbdlg .kbr{flex-wrap:wrap}.kbdlg .kbr>.kbt{flex-basis:100%}}";
  function make(cfg) {
    var K = { cfg: cfg, map: {}, cap: null, ov: null };
    var acts = cfg.acts;
    function byId(id) { for (var i = 0; i < acts.length; i++) if (acts[i].id === id) return acts[i]; return null; }
    function load() {
      var o = {};
      try { o = JSON.parse(localStorage.getItem(cfg.store) || "{}") || {}; } catch (e) { o = {}; }
      K.map = {};
      acts.forEach(function (a) { K.map[a.id] = Object.prototype.hasOwnProperty.call(o, a.id) && typeof o[a.id] === "string" && !RESERVED.test(o[a.id]) ? o[a.id] : a.def; });
    }
    function save() {
      var o = {};
      acts.forEach(function (a) { if (K.map[a.id] !== a.def) o[a.id] = K.map[a.id]; });
      try { if (Object.keys(o).length) localStorage.setItem(cfg.store, JSON.stringify(o)); else localStorage.removeItem(cfg.store); } catch (e) {  }
      tips();
    }
    function overlap(a, b) { return a.sc === b.sc || a.sc === "all" || b.sc === "all"; }
    function clash(a, cb) { for (var i = 0; i < acts.length; i++) { var b = acts[i]; if (b !== a && cb && K.map[b.id] === cb && overlap(a, b)) return b; } return null; }
    function blocked() {
      if (K.ov) return true;
      var m = document.querySelector("[aria-modal='true']");
      if (m && vis(m)) return true;
      return cfg.blocked ? !!cfg.blocked() : false;
    }
    function scopeOk(a) { return a.sc === "all" || !cfg.scopeNow || cfg.scopeNow() === a.sc; }
    function onKey(e) {
      if (K.cap) return;
      if (e.isComposing || e.keyCode === 229 || e.defaultPrevented) return;
      if (cfg.on && !cfg.on()) return;
      var cb = combo(e);
      if (!cb) return;
      var hit = acts.filter(function (a) { return K.map[a.id] === cb && scopeOk(a); });
      if (!hit.length) return;
      if (typing(e.target) && !typeOk(cb)) return;
      var a = hit[0];
      if (a.id !== "help" && blocked()) return;
      if (a.ok && !a.ok()) { if (/^F([1-9]|1[0-2])$/.test(cb)) e.preventDefault(); return; }
      e.preventDefault(); e.stopPropagation();
      if (e.repeat) return;
      try { a.run(); } catch (x) { if (cfg.toast) cfg.toast("快速鍵沒做成：" + (x && x.message || x)); }
    }
    var tipT = 0;
    function tips() {
      acts.forEach(function (a) {
        if (!a.sel) return;
        var cb = K.map[a.id];
        Array.prototype.forEach.call(document.querySelectorAll(a.sel), function (b) {
          var t0 = b.getAttribute("data-kbt0");
          if (t0 === null) { t0 = b.getAttribute("title") || ""; b.setAttribute("data-kbt0", t0); }
          var want = cb ? (t0 ? t0 + "　" : "") + "（快速鍵 " + show(cb) + "）" : t0;
          if (b.getAttribute("title") !== want) { if (want) b.setAttribute("title", want); else b.removeAttribute("title"); }
          if (cb) b.setAttribute("aria-keyshortcuts", cb.replace(/Ctrl/, "Control")); else b.removeAttribute("aria-keyshortcuts");
        });
      });
    }
    function tipsSoon() { clearTimeout(tipT); tipT = setTimeout(tips, 250); }
    function open() {
      if (K.ov) return;
      if (!document.getElementById("kbcss")) document.head.appendChild(el("style", { id: "kbcss", text: CSS }));
      var msg = el("div", { class: "kbm", role: "status", "aria-live": "polite" });
      var list = el("div", { class: "kbl" });
      var dlg = el("div", { class: "kbdlg", role: "document" }, [
        el("h3", { text: "⌨ 快速鍵" + (cfg.title ? "（" + cfg.title + "）" : "") }),
        el("div", { class: "kbn", text: "按「改」再按想要的鍵就換好了（記在這台電腦的這個瀏覽器）。F1～F12、Ctrl／Alt 開頭的鍵：打字的時候也能用；只有一個字的鍵（例如 /）：打字的時候不作用。" }),
        list, msg,
        el("div", { class: "kbb" }, [
          el("button", { type: "button", class: "kbreset", text: "全部還原成預設", onclick: function () { acts.forEach(function (a) { K.map[a.id] = a.def; }); save(); paint(); say("已經全部還原成預設"); } }),
          el("span", { class: "sp" }),
          el("button", { type: "button", class: "pri kbclose", text: "關閉", onclick: close })
        ])
      ]);
      var ov = el("div", { class: "kbov", role: "dialog", "aria-modal": "true", "aria-label": "快速鍵" }, [dlg]);
      ov.addEventListener("mousedown", function (e) { if (e.target === ov) close(); });
      function say(s) { msg.textContent = s || ""; }
      function paint() {
        list.innerHTML = "";
        var grp = null;
        acts.forEach(function (a) {
          if (a.hide && a.hide()) return;
          if (a.grp !== grp) { grp = a.grp; list.appendChild(el("div", { class: "kbg", text: grp })); }
          var cb = K.map[a.id], waiting = K.cap && K.cap.a === a;
          list.appendChild(el("div", { class: "kbr", "data-kb": a.id }, [
            el("span", { class: "kbt", text: a.label }),
            el("kbd", { class: waiting ? "wait" : cb ? "" : "none", text: waiting ? "請按新的鍵…" : show(cb) }),
            el("button", { type: "button", class: "kbch", text: waiting ? "取消" : "改", onclick: function () { if (waiting) { K.cap = null; say(""); } else { K.cap = { a: a }; say("按下要給「" + a.label + "」的鍵（Esc＝取消）"); } paint(); } }),
            el("button", { type: "button", class: "kbno", text: "不要", disabled: cb ? null : "disabled", onclick: function () { K.map[a.id] = ""; K.cap = null; save(); paint(); say("「" + a.label + "」不用快速鍵了"); } }),
            el("button", { type: "button", class: "kbdef", text: "預設", disabled: cb === a.def ? "disabled" : null, title: "預設：" + show(a.def), onclick: function () { var o = clash(a, a.def); if (o) K.map[o.id] = ""; K.map[a.id] = a.def; K.cap = null; save(); paint(); say("「" + a.label + "」改回 " + show(a.def) + (o ? "（「" + o.label + "」原本也用這個鍵，先拿掉了）" : "")); } })
          ]));
        });
      }
      function capKey(e) {
        if (!K.cap) { if (e.key === "Escape") { e.preventDefault(); close(); } return; }
        if (e.isComposing || e.keyCode === 229) return;
        var cb = combo(e);
        if (!cb) return;
        e.preventDefault(); e.stopPropagation();
        var a = K.cap.a;
        if (cb === "Escape" && a.def !== "Escape") { K.cap = null; say("沒有改"); paint(); return; }
        if (RESERVED.test(cb)) { say("「" + show(cb) + "」瀏覽器自己要用（重新整理、複製、上一頁…），請換一個（例如 F2、F4、F8、Alt+字母）"); return; }
        var o = clash(a, cb);
        K.map[a.id] = cb;
        if (o) K.map[o.id] = "";
        K.cap = null; save(); paint();
        say("「" + a.label + "」＝ " + show(cb) + (o ? "（「" + o.label + "」原本用這個鍵，已經拿掉，要的話再幫它設一個）" : "") + (typeOk(cb) ? "" : "。這個鍵打字的時候不作用"));
      }
      K.ov = ov; K.capKey = capKey;
      document.addEventListener("keydown", capKey, true);
      paint();
      document.body.appendChild(ov);
      try { dlg.querySelector(".kbclose").focus(); } catch (e) {  }
      K.paint = paint;
    }
    function close() {
      if (!K.ov) return;
      document.removeEventListener("keydown", K.capKey, true);
      K.ov.remove(); K.ov = null; K.cap = null;
    }
    load();
    document.addEventListener("keydown", onKey, true);
    try { new MutationObserver(tipsSoon).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {  }
    tipsSoon();
    K.open = open; K.close = close; K.key = function (id) { return K.map[id] || ""; }; K.show = show; K.reload = function () { load(); tips(); };
    return K;
  }
  return { make: make, combo: combo, show: show, typeOk: typeOk, RESERVED: RESERVED, vis: vis };
})();
(function(){
  var $ = function(id){ return document.getElementById(id); };
  if (window.top !== window.self) { try { document.documentElement.innerHTML = ""; } catch (e) {} return; }
  (function(){ var qs=location.search||""; if(!/[?&](x|app|dev|lst)=/.test(qs)) return;
    var p=new URLSearchParams(qs), f=[]; ["x","app","dev","lst"].forEach(function(k){ if(p.get(k)) f.push(k+"="+encodeURIComponent(p.get(k))); });
    try{ history.replaceState(null,"",location.pathname+"#"+f.join("&")); }catch(e){ location.replace(location.pathname+"#"+f.join("&")); } })();
  function hashParams(){ var o={}; String(location.hash||"").replace(/^#/,"").split("&").forEach(function(kv){ var i=kv.indexOf("="); if(i>0){ try{ o[decodeURIComponent(kv.slice(0,i))]=decodeURIComponent(kv.slice(i+1)); }catch(e){} } }); return o; }
  var HP=hashParams(), X=HP.x||"", T=HP.dev||HP.app||"", FROMSAVED=false, SESS=0;
  var TK=/^[0-9a-z]{6,11}\.[0-9a-f]{24}$/.test(HP.k||"")&&HP.app?HP.k:"";
  function keyLoad(){ try{ var o=JSON.parse(localStorage.getItem("bk")||"null"); if (o&&/^[A-Za-z0-9_-]{20,120}$/.test(String(o.x||""))&&/^[0-9a-f]{32}$/.test(String(o.t||""))) return o; }catch(e){} return null; }
  var XRE=/^[A-Za-z0-9_-]{20,120}$/;
  function bxLoad(){ try{ var v=localStorage.getItem("bx"); if (XRE.test(v||"")) return v; }catch(e){} return ""; }
  function bxSave(){ try{ if (XRE.test(X||"")) localStorage.setItem("bx", X); }catch(e){} }
  function keySave(){ if (!XRE.test(X||"") || !/^[0-9a-f]{32}$/.test(T||"")) return; try{ localStorage.setItem("bk", JSON.stringify({x:X, t:T})); }catch(e){} bxSave(); }
  function keyDrop(){ try{ localStorage.removeItem("bk"); }catch(e){} }
  var CFGX=""; try{ if (typeof window.BUYAO_X==="string" && XRE.test(window.BUYAO_X)) CFGX=window.BUYAO_X; }catch(e){}
  if (!T && !HP.lst){ var SK=keyLoad(); if (SK && (!X || SK.x===X) && (!CFGX || SK.x===CFGX)){ X=SK.x; T=SK.t; HP.app=T; FROMSAVED=true; } }
  if (!X && !T && !HP.lst){ X=CFGX||bxLoad(); }
  function keyOk(){ var o=keyLoad(); return !!(o && o.x===X && o.t===T); }
  var PREVK=null;
  function keyRestore(){
    if (FROMSAVED || !PREVK || PREVK.x!==X || PREVK.t===T){ PREVK=null; return false; }
    var pk=PREVK; PREVK=null;
    try{ localStorage.setItem("bk", JSON.stringify(pk)); }catch(e){}
    resetSession(); X=pk.x; T=pk.t; HP.app=T; HP.dev=""; FROMSAVED=true;
    return true;
  }
  function keyEarly(){
    if (FROMSAVED || !T || HP.lst || !XRE.test(X||"") || !/^[0-9a-f]{32}$/.test(T)) return;
    var old=keyLoad(); PREVK=(old && old.x===X && old.t!==T)?old:null;
    keySave(); hideKey();
  }
  function hideKey(){ try{ if (!HP.lst && /(^|[#&])(x|app|dev)=/.test(location.hash||"") && keyOk()) history.replaceState(null,"",location.pathname); }catch(e){} }
  var q=$("q"), out=$("out"), hint=$("hint"), nobox=$("nobox");
  var ZOOM_BASE=1.25, ZOOM_FOLLOW=1, ZOOM_MAX=1.25;
  function fitZoom(){
    var w=window.innerWidth||document.documentElement.clientWidth||0, z=1;
    if (w>=760){ z=ZOOM_BASE*(1+ZOOM_FOLLOW*(w-1280)/1280); z=Math.min(ZOOM_MAX, Math.max(0.8, z)); }
    document.documentElement.style.setProperty("--z", String(Math.round(z*1000)/1000));
  }
  fitZoom();
  var CARD_MIN=0.65, FIT_W=0, FIT_T=0, FIT_S=[], COARSE=false;
  for (var fk=0; fk<=17; fk++) FIT_S.push(Math.round((1-0.02*fk)*100)/100);
  FIT_S.push(CARD_MIN);
  try{ COARSE=!!(window.matchMedia&&window.matchMedia("(pointer:coarse)").matches); }catch(e){}
  function fitCard(){
    var c=document.getElementById("card"); if(!c) return;
    c.style.removeProperty("--cz");
    var w=window.innerWidth||document.documentElement.clientWidth||0; FIT_W=w; if (w<760) return;
    var se=document.getElementById("same"), sd=se?se.style.display:"", de=document.documentElement, y=window.pageYOffset||0;
    function put(i){ if (i) c.style.setProperty("--cz", String(FIT_S[i])); else c.style.removeProperty("--cz"); }
    function fits(i){ put(i); return de.scrollHeight<=de.clientHeight; }
    if (se) se.style.display="none";
    if (!fits(0)){
      var lo=0, hi=FIT_S.length-1, mid;
      while (hi-lo>1){ mid=(lo+hi)>>1; if (fits(mid)) hi=mid; else lo=mid; }
      put(hi);
    }
    if (se) se.style.display=sd;
    if (y) window.scrollTo(0,y);
  }
  window.addEventListener("resize", function(){
    fitZoom();
    clearTimeout(FIT_T);
    FIT_T=setTimeout(function(){ if (COARSE&&(window.innerWidth||0)===FIT_W) return; fitCard(); }, 80);
  });
  try{ if (window.innerWidth<480) q.placeholder="輸入藥名或 CODE，再按「搜尋」"; }catch(e){}
  var DEV=false, SPOT={}, FULL={}, HOME=null, TAB="錠", SORT="name", NCAT=0;
  var NICON={"停止供貨":"⛔","改包裝通知":"📦","製廠缺貨":"🏭","換廠":"🔁","給慢箋":"📄","其他":"📌"};
  var HINT0='<span>點左上 logo 回首頁</span> <span>🎤 用講的</span> <span>📷 拍包裝</span>';
  var ICON={"錠":"data:image/png;base64,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","水":"data:image/png;base64,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"};
  try{ ["錠","水"].forEach(function(k){ var m=/^data:([^;,]+);base64,([A-Za-z0-9+\/=]+)$/.exec(ICON[k]); if(!m) return; var b=atob(m[2]), u=new Uint8Array(b.length), i; for(i=0;i<b.length;i++) u[i]=b.charCodeAt(i); ICON[k]=URL.createObjectURL(new Blob([u],{type:m[1]})); }); }catch(e){}
  try{ TAB=localStorage.getItem("bt")||"錠"; SORT=localStorage.getItem("bs")||"name"; }catch(e){}

  var API="", LIVE=false, SYNC_T=null, DKX="", FPX="", BOUND=false;
  function noKey(){ return !T && (LIVE || !(MOCK && MOCK.appInfo)); }
  var DK=(function(){ var k=""; try{ k=localStorage.getItem("bdk")||""; }catch(e){ k=""; }
    if (/^[0-9a-f]{32}$/.test(k)) return k;
    try{ var a=new Uint8Array(16); crypto.getRandomValues(a); k=Array.prototype.map.call(a,function(x){ return ("0"+x.toString(16)).slice(-2); }).join(""); localStorage.setItem("bdk",k); if(localStorage.getItem("bdk")!==k) k=""; }catch(e){ k=""; }
    return k; })();
  function post(fn, a, bg, ms){
    var ctl=(ms&&window.AbortController)?new AbortController():null, tm=0;
    if (ctl) tm=setTimeout(function(){ try{ ctl.abort(); }catch(e){} }, ms);
    var bd={v:1, fn:fn, t:T, dk:DKX, fp:FPX, a:a}; if (TK) bd.k=TK;
    var o={method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify(bd),
      credentials:"omit", cache:"no-store", referrerPolicy:"no-referrer", redirect:"follow", keepalive:!!bg};
    if (ctl) o.signal=ctl.signal;
    return fetch(API, o)
      .then(function(r){ if(!r.ok) throw new Error("HTTP "+r.status); return r.json().catch(function(){ throw new Error("後端回的不是補藥神器的格式"); }); })
      .then(function(j){ clearTimeout(tm); if (j&&j.ok===1&&bd.k&&TK===bd.k) TK=""; return j; }, function(e){ clearTimeout(tm); throw (e&&e.name==="AbortError")?new Error("等太久沒回應"):e; });
  }
  var SAFE={appInfo:1, appHome:1, appSearch:1, appSame:1, appPhoto:1, appVoice:1, appEditInfo:1, appAll:1, appMoveInfo:1, appMoveList:1};
  var TRIES=3, WAITS=[700,1600], LIMIT_MS=40000, LIMIT_PHOTO=90000;
  function snip(j){ var s=""; try{ s=JSON.stringify(j); }catch(e){} return String(s===undefined?"":s).replace(/\s+/g," ").slice(0,60); }
  function call(fn, args, ok, bad, opt){
    if (!LIVE){ setTimeout(function(){ MOCK[fn].apply(null, args.concat([ok, bad])); }, 260); return; }
    opt=opt||{};
    var sid=SESS;
    var fail=bad||function(e){ setHint("❌ "+(e&&e.message||e), true); };
    var tries=SAFE[fn]?TRIES:1, n=0, t0=Date.now();
    function again(){ setTimeout(go, WAITS[n-1]||1600); }
    function go(){
      if (sid!==SESS) return;
      n++;
      var a=(opt.args?opt.args(n):args).slice(1);
      if (n>1&&opt.retrying) opt.retrying(n);
      post(fn, a, false, SAFE[fn]?(fn==="appPhoto"?LIMIT_PHOTO:LIMIT_MS):0).then(function(j){
        if (sid!==SESS) return;
        if (NET.off && navigator.onLine!==false){ if (j && j.ok===1) netOk(); else netReset(); }
        if (!j || j.ok!==1){
          var code=j&&typeof j.code==="string"?j.code:"", msg=j&&typeof j.err==="string"?j.err:"";
          if (!msg&&!code&&n<tries){ again(); return; }
          if (!msg) msg="後端沒有回應"+(code?"":"（收到的不是補藥神器的格式："+snip(j)+(n>1?"；已自動再試 "+(n-1)+" 次":"")+"）");
          if (code==="tok"||code==="bind"||code==="down"||code==="moved"||code==="dev"){ stop(msg, code, j.need); return; }
          fail(new Error(msg)); return;
        }
        var res=j.r;
        if (res && res.sync){ syncSoon(); offAllSoon(4000, true); }
        ok(res);
      }, function(err){
        if (sid!==SESS) return;
        if (n<tries){ again(); return; }
        var why=String(err&&err.message||err||"?"), sec=Math.max(1,Math.round((Date.now()-t0)/1000));
        var e=new Error("連不上後端（"+why+(n>1?"；已自動再試 "+(n-1)+" 次、共 "+sec+" 秒":"")+"），網路好了再試一次");
        e.net=true; e.tech=why+"；試了 "+n+" 次、共 "+sec+" 秒";
        if (!/等太久/.test(why) || navigator.onLine===false) netOff();
        fail(e);
      });
    }
    go();
  }
  function syncNow(){ if(!SYNC_T) return; clearTimeout(SYNC_T); SYNC_T=null; post("appSync", [], true).catch(function(){}); }
  function syncSoon(){ clearTimeout(SYNC_T); SYNC_T=setTimeout(syncNow, 1500); }
  document.addEventListener("visibilitychange", function(){ if(document.visibilityState==="hidden") syncNow(); });
  window.addEventListener("pagehide", syncNow);
  function resetSession(){
    SESS++;
    T=""; HP.app=""; HP.dev=""; FROMSAVED=false; DEV=false; HOME=null; LAST=null; CARD=null; UPD=false; BOUND=false; FULL={}; SAME={};
    offMemDrop();
    var h=$("home"); h.classList.remove("dev"); var dt=h.querySelector(".devtag"); if (dt) dt.parentNode.removeChild(dt);
    q.value="";
  }
  function stop(msg, code, need){
    SESS++;
    netReset();
    if (code==="tok"||code==="bind"||code==="dev"){ UPD=false; homeDrop(); }
    if (code==="bind" && need){ bindForm(msg); return; }
    if (code==="tok"){ var sk=keyLoad(); if (!sk || (sk.x===X && (FROMSAVED || sk.t===T))) keyDrop(); if (sk && sk.x===X) bxSave(); }
    if ((code==="tok" || code==="dev") && keyRestore()){ NET.msg="ℹ️ 這條連結的鑰匙已經失效（過期、重發過，或在別台開過），改用這台原本記住的登入。"; start(); return; }
    PREVK=null;
    if (code==="tok" && canCode()){ resetSession(); codeForm(msg+"\n可以回 LINE 按「🌐 補藥神器網頁」再開，或用代號登入："); return; }
    if (code==="dev"){ var sk2=keyLoad(); if (sk2 && sk2.x===X && sk2.t===T) keyDrop(); if (canCode()){ resetSession(); codeForm(msg); return; } }
    out.innerHTML='<div class="empty"><b>'+esc(msg).replace(/\n/g,"<br>")+'</b>'+(code==="tok"?"回 LINE 按下面那排的「🌐 補藥神器網頁」再開一次。"+(FROMSAVED?"<br>開過一次，主畫面的圖示就會換成新的連結。":""):"")
      +(code==="down"||code==="moved"?'<div><button type="button" class="retry" data-go="reload">🔄 重新載入</button></div>':"")+'</div>';
    setHint(""); $("sf").hidden=true; $("inst").hidden=true;
  }
  function homeFail(msg){
    if (HOME) return;
    var n=$("nlist"), a=$("alist");
    if (n) n.innerHTML='<div class="none">沒有載入成功</div>';
    if (a) a.innerHTML='<div class="none">'+esc(msg||"載入失敗")+'<br><button type="button" class="retry" data-go="reload">🔄 重新載入</button></div>';
  }
  function canCode(){ return !!(X && XRE.test(X) && DKX && window.fetch && window.CodeIn && CodeIn.mount); }
  function strOf(){ for (var i=0;i<arguments.length;i++){ var a=arguments[i]; if (typeof a==="string" && a) return a.slice(0,300); } return ""; }
  function devLabel(){
    var u=navigator.userAgent||"";
    var b=/Edg\//.test(u)?"Edge":/OPR\//.test(u)?"Opera":/Firefox\/|FxiOS/.test(u)?"Firefox":/CriOS|Chrome\//.test(u)?"Chrome":/Safari\//.test(u)?"Safari":"瀏覽器";
    var o=/Windows/.test(u)?"Windows":/iPhone|iPad|iPod/.test(u)?"iOS":/Android/.test(u)?"Android":/Mac OS X|Macintosh/.test(u)?"macOS":/Linux/.test(u)?"Linux":"";
    if (o==="macOS" && (navigator.maxTouchPoints||0)>1) o="iPadOS";
    return o?b+" / "+o:b;
  }
  var CODE_MIN=5;
  var AUTO_MAX=2;
  var AN_RE=/^[A-HJ-NP-Za-kmnp-z2-9]{9}$/;
  var NUM_RE=/^\d{6}$/;
  var PAIR=null, PSEQ=0, PTM=0, PBUSY=false, PCM=null, PNOTE="", AUTO=0, PFOC=false, ROLE="";
  var PAUTO_MORE="（超過會自動換新的代號）", PAUTO_LAST="（超過要按「重新取得代號」）";
  var NOTE_AUTO="⌛ 超過 "+CODE_MIN+" 分鐘沒有登入，已經自動換成新的代號。把下面這組新的代號再傳給 LINE 補藥神器就好。";
  var NOTE_FAIL="⌛ 超過 "+CODE_MIN+" 分鐘沒有登入，原來的代號已經不能用了。";
  var MSG_BAD="❌ 驗證碼不對，再輸入一次。（要照 LINE 卡片上現在這一張；不確定就按「重新取得代號」換新的一組）";
  function codeOk(c, dev){ return (dev?NUM_RE:AN_RE).test(String(c||"")); }
  function pairSave(){ try{ if (PAIR && !PAIR.dead) sessionStorage.setItem("bpair", JSON.stringify({x:PAIR.x, code:PAIR.code, sec:PAIR.sec, ex:PAIR.ex, dev:PAIR.dev?1:0})); else sessionStorage.removeItem("bpair"); }catch(e){} }
  function pairLoad(){
    var now=Date.now();
    if (PAIR && !PAIR.dead && PAIR.x===X && PAIR.ex>now+3000) return PAIR;
    try{
      var o=JSON.parse(sessionStorage.getItem("bpair")||"null");
      if (o && o.x===X && codeOk(o.code, !!o.dev) && /^[0-9a-f]{32}$/.test(String(o.sec||"")) && +o.ex>0){
        var p={x:X, code:String(o.code), sec:String(o.sec), ex:+o.ex, dev:!!o.dev};
        if (p.ex>now+3000 && p.ex<=now+900000) return p;
        p.stale=1; return p;
      }
    }catch(e){}
    return null;
  }
  function fmtMS(s){ return Math.floor(s/60)+":"+("0"+(s%60)).slice(-2); }
  function pairTick(){
    var el=$("pcd");
    if (!el || !PAIR || PAIR.dead){ if (PTM){ clearInterval(PTM); PTM=0; } return; }
    var s=Math.ceil((PAIR.ex-Date.now())/1000);
    if (s<=0){ pairExpire(); return; }
    el.textContent=fmtMS(s); el.className=s<=20?"low":"";
    var pa=$("pauto"); if (pa) pa.textContent=AUTO>=AUTO_MAX?PAUTO_LAST:PAUTO_MORE;
  }
  function pairExpire(){
    if (PBUSY || document.visibilityState==="hidden") return;
    if (AUTO>=AUTO_MAX){ pairGone("這組代號已經過期（"+CODE_MIN+" 分鐘）", "⌛ 代號過期了"); return; }
    AUTO++; pairStart(NOTE_AUTO);
  }
  document.addEventListener("visibilitychange", function(){ if (document.visibilityState==="visible"){ AUTO=0; pairTick(); } });
  function roleUi(){ var b=$("cdrole"); if (b) b.textContent=ROLE==="dev"?"← 回藥師登入":"開發者登入"; }
  function roleTag(){ return ROLE==="dev"?'<div class="prole">🛠 開發者登入</div>':""; }
  function pairHtml(why, big, btn, extra){
    return '<div class="pst" role="status">'+esc(why).replace(/\n/g,"<br>")+'</div><div class="pcode gone">'+esc(big)+'</div>'
      +(extra?'<div class="pst">'+esc(extra).replace(/\n/g,"<br>")+'</div>':"")
      +(btn?'<button type="button" class="pbtn" data-go="pair">'+esc(btn)+'</button>':"");
  }
  function renderPair(st, why, big, extra){
    var el=$("pair"), wrap=$("cdwrap"); if (!el || !wrap) return;
    var note=PNOTE?'<div class="pnote" role="status">'+esc(st==="err"?NOTE_FAIL:PNOTE)+'</div>':"";
    if (st==="live" && PAIR && !PAIR.dead){
      var c=PAIR.code, dev=!!PAIR.dev, shown=dev?c.slice(0,3)+" "+c.slice(3):c;
      el.innerHTML=roleTag()+note+'<div class="pst" role="status">① 打開 LINE 補藥神器（一對一，不是群組），把這組<b>'+(dev?"開發者代號":"代號")+'</b>'+(dev?"打":"貼")+'進去</div>'
        +'<div class="pcode'+(dev?" num":"")+'" id="pcode" role="img" aria-label="'+(dev?"開發者代號 ":"代號 ")+c.split("").join(" ")+'">'+shown+'</div>'
        +'<button type="button" class="pcopy" id="pcopy" data-go="copy">複製代號</button>'
        +'<div class="pmeta">'+(dev?"":"英文大小寫都可以<br>")+'請在 <b id="pcd"></b> 內完成登入<span id="pauto"></span><br>這台：'+esc(devLabel())+'　·　<button type="button" class="plink" data-go="pair">重新取得代號</button></div>';
      wrap.hidden=false; PFOC=false;
      if (PTM) clearInterval(PTM);
      pairTick(); if (PAIR && !PAIR.dead) PTM=setInterval(pairTick, 1000);
      return;
    }
    if (PTM){ clearInterval(PTM); PTM=0; }
    wrap.hidden=true;
    if (PCM) PCM.clear();
    var m=$("cdm"); if (m){ m.className="bindm"; m.textContent=""; }
    var hadFoc=PFOC || el.contains(document.activeElement);
    if (st==="load") el.innerHTML=roleTag()+note+pairHtml("① 正在向後端要代號…", "⏳", "", extra||"");
    else if (st==="err") el.innerHTML=roleTag()+note+pairHtml("① 沒拿到代號", why||"沒拿到代號，再試一次", "再試一次", extra||"");
    else el.innerHTML=roleTag()+pairHtml("① "+(why||"這組代號已經不能用了"), big||"請重新取得代號", "重新取得代號", extra||"");
    if (hadFoc && st!=="load"){ PFOC=false; var nb=el.querySelector(".pbtn"); if (nb) try{ nb.focus({preventScroll:true}); }catch(x){} }
  }
  function pairGone(why, big, extra){
    if (PAIR) PAIR.dead=1;
    PNOTE="";
    pairSave();
    renderPair("gone", why, big, extra);
  }
  function copyOld(c){
    var ta=null, ok=false, was=document.activeElement;
    try{
      ta=document.createElement("textarea"); ta.value=c; ta.setAttribute("readonly",""); ta.style.cssText="position:fixed;top:0;left:0;width:1px;height:1px;opacity:0";
      document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0,c.length);
      ok=!!(document.execCommand && document.execCommand("copy"));
    }catch(e){ ok=false; }
    try{ if (ta && ta.parentNode) ta.parentNode.removeChild(ta); }catch(e){}
    try{ if (was && was.focus) was.focus({preventScroll:true}); }catch(e){}
    return ok;
  }
  function pairCopy(){
    var b=$("pcopy"), c=PAIR&&!PAIR.dead?PAIR.code:""; if (!b || !c) return;
    var show=function(ok){ b.textContent=ok?"已複製 ✓":"複製不了，請長按上面的代號"; setTimeout(function(){ var x=$("pcopy"); if (x) x.textContent="複製代號"; }, 2200); };
    try{ if (navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(c).then(function(){ show(true); }, function(){ show(copyOld(c)); }); return; } }catch(e){}
    show(copyOld(c));
  }
  var CODE_WAIT=75000, CODE_SLOW=6000, CODE_AGAIN=1500;
  var SLOW_START="後端剛睡醒的時候要等 30 秒左右，請先別關掉這個畫面。";
  var SLOW_LOGIN="確認中…後端剛睡醒的時候要等 30 秒左右，請先別關掉、也不用再按。";
  function postCode(fn, a, slow, alive){
    var t0=Date.now(), n=0, st=0;
    function fin(){ if (st){ clearTimeout(st); st=0; } }
    if (slow) st=setTimeout(function(){ st=0; slow(); }, CODE_SLOW);
    function go(){
      n++;
      return post(fn, a, false, CODE_WAIT).then(function(j){ fin(); return j; }, function(e){
        var m=String(e&&e.message||e||"?");
        if (n<2 && !/等太久/.test(m) && (!alive || alive())) return new Promise(function(res){ setTimeout(res, CODE_AGAIN); }).then(function(){ return (!alive || alive()) ? go() : Promise.reject(e); });
        fin();
        var er=new Error(m); er.tech=m+"；試了 "+n+" 次、共 "+Math.max(1,Math.round((Date.now()-t0)/1000))+" 秒"; throw er;
      });
    }
    return go();
  }
  function techOf(e){ return e&&e.tech?"（原因："+String(e.tech).slice(0,120)+"）":""; }
  function pairStart(note, role){
    if (PBUSY) return;
    if (role==="dev" || role==="") ROLE=role;
    var my=++PSEQ, dev=ROLE==="dev", old=PAIR&&PAIR.sec?PAIR.sec:"", t0=Date.now();
    if (typeof note!=="string") AUTO=0;
    PNOTE=typeof note==="string"?note:"";
    PAIR=null; pairSave();
    roleUi();
    renderPair("load");
    postCode("appCodeStart",[devLabel(), old, ROLE], function(){ if (my===PSEQ && !PAIR && $("pair")) renderPair("load", "", "", SLOW_START); }, function(){ return my===PSEQ && !!$("pair"); }).then(function(j){
      if (my!==PSEQ || !$("pair")) return;
      var r=j&&j.ok===1?j.r:null;
      if (r&&r.ok&&codeOk(r.code, dev)&&/^[0-9a-f]{32}$/.test(String(r.sec||""))){
        PAIR={x:X, code:String(r.code), sec:String(r.sec), ex:t0+Math.max(30,Math.min(900,+r.ttl||CODE_MIN*60))*1000, dev:dev};
        netReset();
        pairSave(); renderPair("live"); if (PCM) PCM.focus({preventScroll:true}); return;
      }
      renderPair("err", strOf(r&&r.err, j&&j.err)||"沒拿到代號，再試一次");
    }, function(e){
      if (my!==PSEQ || !$("pair")) return;
      var slowE=e&&/等太久/.test(String(e.message));
      if (!slowE) netOff();
      renderPair("err", slowE?"等太久沒有回應，再試一次":"連不上後端，網路好了再試一次", "", slowE?"（等了 "+Math.round(CODE_WAIT/1000)+" 秒後端都沒回；多半是剛睡醒，再按一次通常就好了）":techOf(e));
    });
  }
  function pairFail(r, j){
    var em=strOf(r&&r.err, j&&j.err), m=$("cdm"), say=function(t, wait){ m.className=wait?"bindm wait":"bindm"; m.textContent=t; };
    if (r&&r.dead){ pairGone("這組代號已經用不了了", "🔒 請重新取得代號", "重新取得後，再把新的代號傳給 LINE 補藥神器，拿新的驗證碼。"); return; }
    if (r&&r.gone){
      if (r.full) pairGone("驗證碼對了，但這台登不進去", "🔒 開發者版名額滿了", em.replace(/^🔒\s*/,""));
      else if (PAIR && !PAIR.dead && PAIR.ex-Date.now()<=8000) pairStart(NOTE_AUTO);
      else pairGone("這組代號已經不能用了（過期、用掉了，或已經作廢）", "⌛ 請重新取得代號", "");
      return;
    }
    if (r&&r.wait){ say("⏳ LINE 還沒收到這組代號。到 LINE 補藥神器"+(PAIR&&PAIR.dev?"打 ":"貼上 ")+(PAIR?PAIR.code:"畫面上的代號")+"，拿到驗證碼再回來輸入。", true); return; }
    if (r&&r.bad){ say(MSG_BAD); PCM.clear(); PCM.focus(); return; }
    say((em.indexOf("🔒")===0?"":"❌ ")+(em||"沒登入成功，再試一次"));
  }
  function codeForm(msg){
    LIVE=true; API="https://script.google.com/macros/s/"+X+"/exec";
    swReg(); if (navigator.onLine===false) netOff();
    out.innerHTML='<div class="empty codebox"><div class="cdhead"><b>'+esc(msg||"🔐 登入補藥神器").replace(/\n/g,"<br>")+'</b></div>'
      +'<div class="cdgrid"><div class="pairbx" id="pair"></div>'
      +'<div id="cdwrap" hidden><div class="pst2">② LINE 會回你 6 位數的<b>驗證碼</b>，打在這裡</div><div id="cdhost"></div><span class="bindm" id="cdm" role="status"></span></div></div>'
      +'<small>代號和驗證碼都只能在這個網頁用，換別的瀏覽器打沒用。<br>代號出現後 '+CODE_MIN+' 分鐘內要完成登入，超過了這裡會自己換一組新的代號；驗證碼只能用一次，不要傳給任何人。</small>'
      +'<div class="cdrole"><button type="button" class="plink" id="cdrole" data-go="role">開發者登入</button></div></div>';
    setHint(""); $("sf").hidden=true; $("inst").hidden=true;
    PBUSY=false; PSEQ++; if (PTM){ clearInterval(PTM); PTM=0; }
    PNOTE=""; AUTO=0;
    var cm=null, msgEl=$("cdm");
    var SIXMSG=false, MSG_SAME="這裡要打 LINE 回給你的 6 位數驗證碼，不是上面的開發者代號（開發者代號是要打進 LINE 的）。";
    cm=PCM=CodeIn.mount($("cdhost"),{
      busy:function(){ return PBUSY; },
      onGo:function(code){
        if (PBUSY) return;
        var P=PAIR;
        AUTO=0;
        if (!P || P.dead){ pairGone("這組代號已經不能用了", "⌛ 代號過期了"); return; }
        if (P.ex<=Date.now()){ pairStart(NOTE_AUTO); return; }
        if (P.dev && code===P.code){ SIXMSG=true; msgEl.className="bindm wait"; msgEl.textContent=MSG_SAME; return; }
        PBUSY=true; cm.setBusy(); cm.input.readOnly=true; msgEl.className="bindm wait"; msgEl.textContent="確認中…";
        var done=function(){ PBUSY=false; cm.input.readOnly=false; msgEl.className="bindm"; cm.setBusy(); };
        postCode("appCodeLogin",[P.sec, code, devLabel()], function(){ if (PBUSY && P===PAIR && $("pair")){ msgEl.className="bindm wait"; msgEl.textContent=SLOW_LOGIN; } }, function(){ return P===PAIR && !!$("pair"); }).then(function(j){
          done();
          var r=j&&j.ok===1?j.r:null;
          if (r&&r.ok&&/^[0-9a-f]{32}$/.test(String(r.t||""))){ msgEl.textContent=""; PAIR=null; pairSave(); PSEQ++; loginOk(r); return; }
          if (P!==PAIR || !$("pair")) return;
          pairFail(r, j);
        }, function(e){
          done();
          if (P!==PAIR || !$("pair")) return;
          msgEl.textContent=e&&/等太久/.test(String(e.message))?"❌ 等太久沒有回應（等了 "+Math.round(CODE_WAIT/1000)+" 秒）。再試一次；若說「代號已經不能用」，是第一次其實已經用掉了——按「重新取得代號」重來。":"❌ 連不上後端，網路好了再試一次"+techOf(e);
        });
      }
    });
    cm.input.addEventListener("input", function(){
      AUTO=0;
      var v=CodeIn.decode(cm.input.value).code;
      if (v && PAIR && !PAIR.dead && PAIR.dev && v===PAIR.code){ msgEl.className="bindm wait"; msgEl.textContent=MSG_SAME; SIXMSG=true; }
      else if (SIXMSG){ SIXMSG=false; msgEl.className="bindm"; msgEl.textContent=""; }
    });
    var p=pairLoad();
    ROLE=p&&p.dev?"dev":"";
    roleUi();
    if (p && p.stale){ PAIR=p; pairStart(NOTE_AUTO); }
    else if (p){ PAIR=p; renderPair("live"); cm.focus({preventScroll:true}); }
    else pairStart();
  }
  function loginOk(r){
    PNOTE="";
    resetSession();
    T=String(r.t); HP.app=T; HP.dev=""; FROMSAVED=false; DEV=!!r.dev;
    offClearAll();
    keySave();
    out.innerHTML=""; $("sf").hidden=false;
    BOUND=!!r.dev;
    start();
  }
  function logoutAsk(){
    note({h:"登出這台？", p:(DEV?"這台會從開發者版的綁定名單拿掉（名額還回去）。":"這台會把登入忘掉。")+"\n之後要再用：直接打網址會出現代號，照畫面上的步驟登入；或從 LINE 的「🌐 補藥神器網頁」按鈕開。", go:"登出", x:"取消"},
      function(v){ if (v==="go") logoutDo(); });
  }
  function logoutDo(){
    var wasDev=DEV, done=false;
    function fin(sent, released){
      if (done) return; done=true;
      keyDrop(); homeDrop(); bxSave();
      resetSession();
      try{ if (/(^|[#&])(x|app|dev)=/.test(location.hash||"")) history.replaceState(null,"",location.pathname); }catch(e){}
      var m="✅ 已登出這台。"+(wasDev&&(!sent||released===false)?"\n（開發者名額可能沒能還回去："+(sent?"後端正忙":"連不上後端")+"。回 LINE 打「開發者網頁 重發」可以全部清掉重來）":"");
      if (canCode()) codeForm(m+"\n要再用：照下面的步驟拿代號、到 LINE 換驗證碼，或從 LINE 的「🌐 補藥神器網頁」按鈕開。");
      else { out.innerHTML='<div class="empty"><b>'+esc(m).replace(/\n/g,"<br>")+'</b>要再用：回 LINE 按下面那排的「🌐 補藥神器網頁」開。</div>'; setHint(""); $("sf").hidden=true; $("inst").hidden=true; }
    }
    if (wasDev && LIVE){
      var tm=setTimeout(function(){ fin(false); }, 6000);
      post("appLogout",[]).then(function(j){ clearTimeout(tm); var r=j&&j.ok===1&&j.r; fin(!!(r&&r.ok), r&&r.released); }, function(){ clearTimeout(tm); fin(false); });
    } else fin(true);
  }
  function bindForm(msg){
    out.innerHTML='<div class="empty bindbox"><b>'+esc(msg).replace(/\n/g,"<br>")+'</b>'
      +'<form class="bindf" id="bindf" autocomplete="off"><input id="bindc" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="6 位數碼" aria-label="綁定碼"><button type="submit" id="bindb">綁定</button></form>'
      +'<span class="bindm" id="bindm" role="status"></span>'
      +'<small>碼 10 分鐘內有效、只能用一次；錯 5 次鎖 1 小時；最多綁 3 處。<br>這組碼只打在這裡，不要傳給任何人。</small></div>';
    setHint(""); $("sf").hidden=true;
    var inp=$("bindc"); try{ inp.focus(); }catch(e){}
    $("bindf").onsubmit=function(e){
      e.preventDefault();
      var c=String(inp.value||"").replace(/\D/g,"");
      if (!/^\d{6}$/.test(c)){ $("bindm").textContent="請輸入 6 位數字"; return; }
      $("bindb").disabled=true; $("bindm").textContent="確認中…";
      post("appBind",[c]).then(function(j){
        $("bindb").disabled=false;
        var r=j&&j.ok===1?j.r:null;
        if (r&&r.ok){ out.innerHTML=""; $("sf").hidden=false; BOUND=true; setHint("✅ 這台綁好了"); start(); return; }
        $("bindm").textContent="❌ "+((r&&r.err)||(j&&j.err)||"沒綁成功，再試一次");
        inp.value=""; try{ inp.focus(); }catch(x){}
      }, function(){ $("bindb").disabled=false; $("bindm").textContent="❌ 連不上後端，網路好了再試一次"; });
    };
  }
  function hex(buf){ return Array.prototype.map.call(new Uint8Array(buf),function(x){ return ("0"+x.toString(16)).slice(-2); }).join(""); }
  function fpSrc(){
    var n=window.navigator||{}, tz="";
    try{ tz=Intl.DateTimeFormat().resolvedOptions().timeZone||""; }catch(e){ tz=""; }
    return ["fp1", String(n.userAgent||"").replace(/\d+/g,""), n.platform||"", (n.languages&&n.languages.join)?n.languages.join(","):(n.language||""), tz, n.hardwareConcurrency||0, n.deviceMemory||0, n.maxTouchPoints||0].join("|");
  }
  function gate(cb){
    var later=function(v){ setTimeout(function(){ cb(v); }, 0); };
    if (HP.lst && !T) { later("oldlst"); return; }
    if (!X && !T) { later("none"); return; }
    if (!XRE.test(X) || (T && !/^[0-9a-f]{32}$/.test(T))) { later("bad"); return; }
    if (!window.fetch) { later("old"); return; }
    if (!DK || !(window.crypto&&crypto.subtle&&window.TextEncoder)) { later(T?"ok":"nodk"); return; }
    var te=new TextEncoder(), fpP=crypto.subtle.digest("SHA-256", te.encode(fpSrc())).then(function(b){ return hex(b).slice(0,16); }, function(){ return ""; });
    Promise.all([crypto.subtle.digest("SHA-256", te.encode(DK+"|"+X)), fpP]).then(function(b){ DKX=hex(b[0]).slice(0,32); FPX=b[1]||""; cb(T?"ok":"code"); }, function(){ cb(T?"ok":"nodk"); });
  }
  var GATE_MSG={
    none:"🌐 請從 LINE 按下面那排的「🌐 補藥神器網頁」開這個網頁。\n（想直接打網址、用代號登入：這個瀏覽器要先從 LINE 的「🌐 補藥神器網頁」開過一次（或由開發者在 GitHub 放好 cfg.js，LINE 打「開發者網頁 設定」有步驟），之後直接打網址，畫面上就會出現代號。\n主畫面的圖示也要先從 LINE 開過一次，之後才能直接開。）",
    nodk:"🔒 這個瀏覽器沒辦法記住這台裝置（可能是無痕模式、關掉了網站資料，或瀏覽器太舊），沒辦法用代號登入。\n請用一般模式開（或換 Chrome、Safari 最新版），或從 LINE 的「🌐 補藥神器網頁」按鈕開。",
    oldlst:"📋 清單校對的連結換新了。\n回 LINE 打「清單校對」，再按「📤 多張上傳」或「📋 待審清單」。",
    bad:"這條連結不完整。\n回 LINE 按下面那排的「🌐 補藥神器網頁」再開一次。",
    old:"這個瀏覽器太舊，開不了補藥神器。請改用最新的 Chrome 或 Safari。"
  };

  document.addEventListener("error", function(e){ var t=e.target; if(!t||t.tagName!=="IMG") return;
    if (t.hasAttribute("data-rm")){ if (t.parentNode) t.parentNode.removeChild(t); return; }
    if (t.hasAttribute("data-off")) offImgFix(t);
  }, true);
  function esc(s){ return String(s===null||s===undefined?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
  var nbKeep=false;
  function nbHide(){ if (nobox) nobox.hidden=true; }
  if (nobox && window.MutationObserver) new MutationObserver(function(){ if (!nbKeep) nbHide(); }).observe(out,{childList:true});
  function noBox(on){ if (!nobox) return; nobox.hidden=!on; nbKeep=!!on; if (on){ setTimeout(function(){ nbKeep=false; },0); window.scrollTo({top:0}); } }
  function setHint(s, bad, busy){ nbHide(); if(s===HINT0) hint.innerHTML=s+(window.innerWidth>=700?' <span>拖照片進來或 Ctrl+V 貼上也能辨識</span>':''); else hint.textContent=s||""; hint.className="hint"+(bad?" bad":"")+(busy?" busy":""); }
  function kindOf(r){ if(r.kind==="水"||r.kind==="錠") return r.kind; var f=String(r.form||""), l=String(r.location||""); return (/水|液|漿|滴|注射|針/.test(f)||/^\s*水/.test(l))?"水":"錠"; }
  function num(x){ return +x||0; }
  function thumbHtml(r){
    var th=r.thumb||(r.photo?String(r.photo).replace(/([?&]sz=w)\d+/,"$1320"):"");
    return '<span class="ph"><img class="ki" src="'+ICON[kindOf(r)]+'" alt="">'+(th?'<img class="pi" src="'+esc(th)+'" loading="lazy" alt="" data-rm="">':'')+'</span>';
  }
  var PH_KEYS=["qty"];
  function isPh(r){ return !!(r&&r.qty); }
  function noPh(r){ var c={}, k; for (k in r) if (Object.prototype.hasOwnProperty.call(r,k) && PH_KEYS.indexOf(k)<0) c[k]=r[k]; return c; }
  function photoHas(res, code){ return (res.rows||[]).some(function(x){ return x.code===code; }) || (res.asks||[]).some(function(a){ return (a.rows||[]).some(function(x){ return x.code===code; }); }); }
  function keepPh(from, to){ PH_KEYS.forEach(function(k){ if(from&&from[k]) to[k]=from[k]; }); return to; }
  function swapRow(nr){
    if (!LAST) return;
    var fix=function(list){ for (var i=0;list&&i<list.length;i++) if (list[i].code===nr.code) list[i]=keepPh(list[i], noPh(nr)); };
    fix(LAST.rows);
    if (LAST.photo){ if (LAST.photo.rows!==LAST.rows) fix(LAST.photo.rows); (LAST.photo.asks||[]).forEach(function(a){ fix(a.rows); }); }
  }
  function rowHtml(r, extra){
    var k=kindOf(r);
    return '<button type="button" class="row" data-code="'+esc(r.code)+'"'+(isPh(r)?' data-ph="1"':'')+'>'+thumbHtml(r)
      +'<span class="n"><b>'+esc(r.brand)+'</b><span class="z">'+esc(r.chName||"")+(r.qty?'　×'+esc(r.qty):'')+'</span>'+(extra||'')
      +'<span class="k"><img src="'+ICON[k]+'" alt="">'+esc(k)+'<span class="c mono">'+esc(r.code)+'</span></span></span>'
      +'<span class="l">'+esc(r.location||"")+'</span></button>';
  }
  var SAME={};
  var FAMFOLD=true; try{ FAMFOLD=localStorage.getItem("bfam")!=="0"; }catch(x){}
  var SAME_SEC=[["dose","💊 同成分不同劑量"],["form","🔁 同成分不同劑型"],["brand","🏷 同成分同劑量"]];
  function sameHtml(res){
    var secs=[];
    SAME_SEC.forEach(function(sec){ var list=res[sec[0]]||[]; if(list.length) secs.push({title:sec[1], rows:list}); });
    (res.combo||[]).forEach(function(g){ secs.push({title:"➕ "+g.name+" 的成分", rows:g.rows}); });
    (res.part||[]).forEach(function(g){ secs.push({title:"🧩 "+g.name+" 的成分", rows:g.rows}); });
    var h='', total=0;
    secs.forEach(function(sec){ total+=num(sec.rows.length); });
    if (!total) return '';
    h+='<button type="button" class="kg same" data-fam="1" aria-expanded="'+(!FAMFOLD)+'"><img src="'+ICON["錠"]+'" alt="">藥品家族<b>'+total+' 個品項</b><span class="fold">'+(FAMFOLD?'▸ 打開':'▾ 收起')+'</span></button>';
    secs.forEach(function(sec){
      h+='<div class="sub">'+esc(sec.title)+'<b>'+num(sec.rows.length)+' 個品項</b></div>';
      if (!FAMFOLD) sec.rows.forEach(function(x){ h+=rowHtml(x, x.formLabel?'<i class="fl">'+esc(x.formLabel)+'</i>':''); });
    });
    return '<div class="list samebox">'+h+'</div>';
  }
  function homeBtn(){ return '<div class="actions"><button type="button" class="quiet" data-go="home">🏠 首頁</button></div>'; }

  function homeShell(){
    var h='<section class="sec"><div class="sh"><b>📢 公告</b><span id="ncount"></span></div><div class="tabs wrap" role="tablist" id="ntabs"></div><div class="list" id="nlist"><div class="none">載入中…</div></div></section>';
    h+='<section class="sec"><div class="sh"><b>💊 所有藥品</b><span id="acount"></span></div>'
      +'<div class="tabs" role="tablist"><button type="button" role="tab" data-tab="錠" aria-selected="'+(TAB==="錠")+'"><img src="'+ICON["錠"]+'" alt="">錠<small id="c錠"></small></button>'
      +'<button type="button" role="tab" data-tab="水" aria-selected="'+(TAB==="水")+'"><img src="'+ICON["水"]+'" alt="">水<small id="c水"></small></button></div>'
      +'<div class="sortrow">排序<button type="button" data-sort="name" aria-pressed="'+(SORT==="name")+'">藥名</button><button type="button" data-sort="loc" aria-pressed="'+(SORT==="loc")+'">位置</button></div>'
      +'<div class="list" id="alist"><div class="none">載入中…</div></div></section>';
    if (LIVE) h+='<div class="lo"><button type="button" data-go="logout">登出這台</button></div>';
    out.innerHTML=h;
    window.scrollTo({top:0});
  }
  function renderHome(){
    homeShell();
    if (HOME) fillHome(HOME); else call("appHome",[T],function(res){ if(!res||res.err){ var em=String(res&&typeof res.err==="string"&&res.err||"首頁載入失敗"); setHint("❌ "+em, true); homeFail(em); return; } HOME=res; homeSave(res); if($("nlist")) fillHome(res); },
      function(e){ var em=String(e&&e.message||e||"連不上後端"); setHint("❌ "+em, true); homeFail(em); });
  }
  function fillHome(d){
    var n=0, groups=d.notices||[];
    groups.forEach(function(g){ n+=num(g.rows&&g.rows.length); });
    if (n){
      if (!(NCAT>=0 && NCAT<groups.length)) NCAT=0;
      $("ntabs").innerHTML=groups.map(function(g,gi){ return '<button type="button" role="tab" data-ncat="'+gi+'" aria-selected="'+(gi===NCAT)+'">'+(Object.prototype.hasOwnProperty.call(NICON,g.name)?NICON[g.name]:"📌")+' '+esc(g.name)+'<small>'+num(g.rows.length)+'</small></button>'; }).join("");
      fillNotice(groups);
    } else {
      $("ntabs").hidden=true;
      $("nlist").innerHTML='<div class="none">目前沒有藥品通知</div>';
    }
    $("ncount").textContent = n ? n+" 個品項" : "";
    var all=d.drugs||[], cnt={"錠":0,"水":0};
    all.forEach(function(r){ cnt[kindOf(r)]++; });
    $("acount").textContent = all.length+" 個品項"+(UPD?"・更新中…":"");
    $("c錠").textContent=cnt["錠"]; $("c水").textContent=cnt["水"];
    fillAll(all);
  }
  function fillNotice(groups){
    var g=groups[NCAT]; if(!g) return;
    var h=""; g.rows.forEach(function(r){ h+=rowHtml(r, r.memo?'<i>'+esc(r.memo)+'</i>':''); });
    $("nlist").innerHTML=h||'<div class="none">這一類沒有藥</div>';
  }
  function fillAll(all){
    var rows=all.filter(function(r){ return kindOf(r)===TAB; });
    var cmp=function(a,b){ return String(a||"").localeCompare(String(b||""),"zh-Hant",{numeric:true,sensitivity:"base"}); };
    rows.sort(SORT==="loc" ? function(a,b){ return cmp(a.location,b.location)||cmp(a.brand,b.brand); } : function(a,b){ return cmp(a.brand,b.brand); });
    var h=""; rows.forEach(function(r){ h+=rowHtml(r); });
    $("alist").innerHTML = h || '<div class="none">這一類還沒有藥</div>';
  }

  var LAST=null;
  var CARD=null;
  function renderList(rows, title, extra, loc){
    if (LAST && rows===LAST.rows){ if(title===undefined) title=LAST.title; if(extra===undefined) extra=LAST.extra; if(loc===undefined) loc=LAST.loc; }
    LAST={rows:rows, title:title, extra:extra, loc:loc};
    var h='<div class="list"><div class="h">'+esc(title||("找到 "+rows.length+" 個品項，點一個看卡片"))+'</div>'+(extra||'');
    if (loc){
      var tab=rows.filter(function(r){ return kindOf(r)!=="水"; }), water=rows.filter(function(r){ return kindOf(r)==="水"; });
      [["錠","錠劑類",tab],["水","水劑類",water]].forEach(function(g){
        if (!g[2].length) return;
        h+='<div class="kg"><img src="'+ICON[g[0]]+'" alt="">'+g[1]+'<b>'+g[2].length+' 個品項</b></div>';
        g[2].forEach(function(r){ FULL[r.code]=r; h+=rowHtml(r); });
      });
    } else rows.forEach(function(r){ FULL[r.code]=r; h+=rowHtml(r); });
    out.innerHTML=h+'</div>'+homeBtn();
    window.scrollTo({top:0});
  }
  function renderGuess(kw, guess){
    var h='<div class="list"><div class="h">沒有「'+esc(kw)+'」，你是不是要找：</div>';
    guess.forEach(function(r){ h+=rowHtml(r); });
    out.innerHTML=h+'</div>'+homeBtn();
    window.scrollTo({top:0});
  }
  function renderPhoto(res){
    var rows=res.rows||[], asks=res.asks||[], read=res.read||[];
    var chips='';
    if (read.length){ chips='<div class="chips">'+read.map(function(x){ return '<span class="'+(x.none?"no":"ok")+'">'+esc(x.shown)+(x.qty?' ×'+esc(x.qty):'')+'</span>'; }).join('')+'</div>'; }
    if (rows.length===1 && !asks.length && !res.via){ renderCard(rows[0], null); return; }
    LAST={rows:rows, photo:res};
    var h='', mine={};
    if (rows.length || read.length || !asks.length){
      h='<div class="list"><div class="h">📷 讀到 '+num(read.length)+' 行，查到 '+num(rows.length)+' 個品項'+(res.via?'（'+esc(res.via)+'）':'')+'</div>'+chips;
      rows.forEach(function(r){ FULL[r.code]=r; mine[r.code]=1; h+=rowHtml(r); });
      if (!rows.length && !asks.length) h+='<div class="none">沒有對到院內的藥。拍清楚一點（字面朝上、光線夠）再試，或直接打字查。</div>';
      h+='</div>';
    }
    asks.forEach(function(a){
      h+='<div class="list"><div class="g">❓ 「'+esc(a.name)+'」沒對到，可能是：</div>';
      a.rows.forEach(function(r){ if(!mine[r.code]) FULL[r.code]=r; h+=rowHtml(r); });
      h+='</div>';
    });
    out.innerHTML=h+homeBtn();
    window.scrollTo({top:0});
  }
  var PIN2='<svg class="pinsvg" viewBox="0 0 24 30" role="img" aria-label="位置" focusable="false"><path d="M12 0C5.4 0 0 5.3 0 11.8 0 20.4 12 30 12 30s12-9.6 12-18.2C24 5.3 18.6 0 12 0z" fill="#E5403A"/><circle cx="12" cy="11.8" r="6.8" fill="#fff"/><g transform="rotate(-45 12 11.8)"><rect x="6.6" y="8.6" width="10.8" height="6.4" rx="3.2" fill="#fff" stroke="#E5403A" stroke-width="1.3"/><path d="M6.6 11.8a3.2 3.2 0 0 1 3.2-3.2H12v6.4H9.8a3.2 3.2 0 0 1-3.2-3.2z" fill="#E5403A"/></g></svg>';
  function renderCard(r, backTo){
    FULL[r.code]=r; CARD={r:r, back:backTo};
    var spot = SPOT[r.code] || (r.spots&&r.spots.length ? r.spots[0].name : "");
    var mapUrl = r.map||"";
    if (r.spots&&r.spots.length){ r.spots.forEach(function(s){ if(s.name===spot&&s.map) mapUrl=s.map; }); }
    var refOk = /^https?:\/\//i.test(String(r.ref||""));
    var h='<article class="card" id="card" data-code="'+esc(r.code)+'">';
    h+='<div class="head"><div class="t"><div class="code mono">'+esc(r.code)+(r.qty?' <span class="qty">×'+esc(r.qty)+'</span>':'')+'</div><div class="brand">'+esc(r.brand)+'</div>'
      +(r.chName?'<div class="zh">'+esc(r.chName)+'</div>':'')+(r.generic?'<div class="gen">'+esc(r.generic)+'</div>':'')+'</div>'
      +'<div class="side">'+(refOk?'<a class="icon" href="'+esc(r.ref)+'" target="_blank" rel="noopener noreferrer" title="點圖院內藥物查詢" aria-label="點圖院內藥物查詢">':'<div class="icon" title="'+esc(r.form||"")+'">')
      +'<img src="'+ICON[kindOf(r)]+'" alt="'+esc(kindOf(r))+'">'+(refOk?'</a>':'</div>')
      +'</div>';
    if (r.notice){
      h+='<div class="box notice"><span class="k" role="img" aria-label="公告">⚠️</span><span class="v">'+esc(r.notice)+'</span>';
      var zt=(r.zones&&r.zones.length)?'<table class="zones"><caption>📍 各區位置</caption>'+r.zones.map(function(z){ return '<tr><th>'+esc(z.name)+'</th><td>'+esc(z.pos)+'</td></tr>'; }).join("")+'</table>':'';
      var np=r.npic?'<img class="npic" src="'+esc(String(r.npic).replace(/([?&]sz=w)\d+/,"$1400"))+'" alt="公告照片" data-big="'+esc(r.npic)+'" data-off="ph">':'';
      if (zt||np) h+='<div class="nrow">'+(zt||(np?'<span class="sp"></span>':''))+np+'</div>';
      h+='</div>';
    }
    h+='</div>';
    var left='', hasNote=!!(r.pair||r.note||r.old||r.abbr);
    if (r.pair) left+='<div class="box pair"><span class="k">⚠️ 注意</span><span class="v">'+esc(r.pair)+'</span></div>';
    if (r.note) left+='<div class="kv"><span class="k">適應症</span><span class="v">'+esc(r.note)+'</span></div>';
    if (r.old)  left+='<div class="kv"><span class="k">曾用藥品</span><span class="v">'+esc(r.old)+'</span></div>';
    if (r.abbr) left+='<div class="kv"><span class="k">縮寫</span><span class="v">'+esc(r.abbr)+'</span></div>';
    var pn='', hf=!!r.feat, hp=!!r.photo;
    if (hf) pn+='<div class="box feat"><span class="k">🔍 藥品特徵</span><span class="v">'+esc(r.feat)+'</span></div>';
    if (hasNote||hp) pn+='<div class="grid2'+(hp?'':' nophoto')+'"><div class="pinfo">'+left+'</div>'
      +(hp?'<img class="photo" src="'+esc(r.photo)+'" alt="藥品照片" data-big="'+esc(r.photo)+'" data-off="ph">':'')+'</div>';
    var ga = hp ? (hf&&hasNote ? "'f i p'" : hf ? "'f p'" : hasNote ? "'i p'" : "'p'") : (hf&&hasNote ? "'f i'" : hf ? "'f'" : "'i'");
    var gc = hp&&!hf&&!hasNote ? 'auto' : hp ? (hf&&hasNote ? 'minmax(0,1.1fr) minmax(0,1fr) auto' : 'minmax(0,1fr) auto') : (hf&&hasNote ? 'minmax(0,1.1fr) minmax(0,1fr)' : 'minmax(0,1fr)');
    var sp='';
    if (r.spots&&r.spots.length>1){
      sp='<div class="spots">'+r.spots.map(function(s){ return '<button type="button" data-spot="'+esc(s.name)+'" aria-pressed="'+(s.name===spot)+'">'+esc(s.name)+'</button>'; }).join("")+'</div>';
    }
    var lr='<div class="locrow"><div class="lleft"><div class="loc"><span class="pin">'+PIN2+'</span><span class="t">'+esc(r.location||"—")+'</span></div>'+sp+'</div>'
      +(mapUrl?'<img class="map" src="'+esc(mapUrl)+'" alt="平面圖" data-big="'+esc(r.mapBig||mapUrl)+'" data-off="map">':'')+'</div>';
    h+='<div class="cbody">'+(pn?'<div class="pnl'+(hp&&!hf&&!hasNote?' solo':'')+'" style="--ga:'+ga+';--gc:'+gc+'">'+pn+'</div>':'')+lr+'</div>';
    var acts=[];
    if (backTo&&(backTo.length>1||(LAST&&LAST.photo&&LAST.rows===backTo))) acts.push('<button type="button" class="quiet" id="back">← 回清單</button>');
    if (DEV) acts.push('<button type="button" class="edit" id="edit">✏️ 修改</button>','<button type="button" class="edit" id="mvbtn">📍 改位置</button>');
    if (acts.length) h+='<div class="actions">'+acts.join("")+'</div>';
    h+='<div id="same">'+(SAME[r.code]?sameHtml(SAME[r.code]):'')+'</div>';
    h+='</article>';
    out.innerHTML=h;
    Array.prototype.forEach.call(out.querySelectorAll("img[data-big]"),function(im){ im.onclick=function(){ $("lbimg").src=im.dataset.big; $("lb").hidden=false; }; });
    Array.prototype.forEach.call(out.querySelectorAll(".spots button"),function(b){ b.onclick=function(){ SPOT[r.code]=b.dataset.spot; renderCard(r, backTo); }; });
    if ($("back")) $("back").onclick=function(){ if (LAST&&LAST.photo&&LAST.rows===backTo) renderPhoto(LAST.photo); else renderList(backTo); };
    if (!SAME[r.code] && !NET.off) call("appSame",[T, r.code],function(res){ if(!res||res.err) return; SAME[r.code]=res; var el=$("same"); if(el&&out.contains(el)&&el.closest("article")&&el.closest("article").getAttribute("data-code")===String(r.code)) el.innerHTML=sameHtml(res); }, function(){});
    if ($("edit")) $("edit").onclick=function(){ renderEdit(r, backTo); };
    if ($("mvbtn")) $("mvbtn").onclick=function(){ renderMove(r, backTo); };
    fitCard();
    window.scrollTo({top:0});
  }
  function openCode(code, ph){
    var r=FULL[code]; if (r && !ph && isPh(r)) r=noPh(r);
    var back = LAST&&LAST.photo ? (photoHas(LAST.photo, code)?LAST.rows:null) : (LAST&&LAST.rows&&LAST.rows.length>1&&LAST.rows.some(function(x){return x.code===code;})?LAST.rows:null);
    if (r) renderCard(r, back); else search(code);
  }
  out.addEventListener("click", function(e){
    var b=e.target.closest ? e.target.closest("button") : null; if(!b) return;
    if (b.dataset.code){ openCode(b.dataset.code, b.hasAttribute("data-ph")); return; }
    if (b.hasAttribute("data-fam")){ FAMFOLD=!FAMFOLD; try{localStorage.setItem("bfam",FAMFOLD?"1":"0");}catch(x){} var fe=$("same"), fa=fe&&fe.closest("article"), fc=fa&&fa.getAttribute("data-code"); if (fe&&SAME[fc]) fe.innerHTML=sameHtml(SAME[fc]); return; }
    if (b.dataset.go==="home"){ renderHome(); return; }
    if (b.dataset.go==="logout"){ logoutAsk(); return; }
    if (b.dataset.go==="reload"){ try{ location.reload(); }catch(x){} return; }
    if (b.dataset.go==="pair"){ PFOC=true; pairStart(); return; }
    if (b.dataset.go==="copy"){ pairCopy(); return; }
    if (b.dataset.go==="role"){ pairStart(undefined, ROLE==="dev"?"":"dev"); return; }
    if (b.dataset.ncat!==undefined){ NCAT=+b.dataset.ncat; Array.prototype.forEach.call(out.querySelectorAll("[data-ncat]"),function(t){ t.setAttribute("aria-selected", +t.dataset.ncat===NCAT); }); if(HOME) fillNotice(HOME.notices||[]); return; }
    if (b.dataset.tab){ TAB=b.dataset.tab; try{localStorage.setItem("bt",TAB);}catch(x){} Array.prototype.forEach.call(out.querySelectorAll("[data-tab]"),function(t){ t.setAttribute("aria-selected", t.dataset.tab===TAB); }); if(HOME) fillAll(HOME.drugs||[]); return; }
    if (b.dataset.sort){ SORT=b.dataset.sort; try{localStorage.setItem("bs",SORT);}catch(x){} Array.prototype.forEach.call(out.querySelectorAll("[data-sort]"),function(t){ t.setAttribute("aria-pressed", t.dataset.sort===SORT); }); if(HOME) fillAll(HOME.drugs||[]); return; }
  });
  $("home").onclick=function(){ if (noKey()) return; q.value=""; setHint(HINT0); renderHome(); };

  var EF=[
    {k:"brand", c:"A", l:"商品名"},
    {k:"zh",    c:"B", l:"中文"},
    {k:"loc",   c:"C", l:"小藥庫位置", cap:1},
    {k:"form",  l:"劑型", list:1},
    {k:"gen",   c:"E", l:"學名", ta:1, nl:1},
    {k:"ref",   l:"藥品查詢參考網站", url:1, hint:"貼院內網站那一頁的整串網址（http:// 或 https:// 開頭）；卡片右上角的劑型圖會連過去"},
    {k:"feat",  c:"D", l:"藥品特徵", ta:1, nl:1},
    {k:"note",  l:"適應症", ta:1, nl:1},
    {k:"pair",  l:"注意", ta:1, nl:1},
    {k:"old",   c:"I", l:"曾用藥品", ta:1, nl:1, hint:"一行一個（卡片上就一行一個），或用「、」分開"},
    {k:"pic",   l:"📷 換照片", pic:1},
    {k:"photo", c:"F", l:"藥品外觀（照片網址）", url:1, hint:"通常不用手動改——上面「換照片」存好會自動填"},
    {k:"nk",    c:"G", l:"公告類別", nk:1},
    {k:"nm",    c:"H", l:"公告補充說明", ta:1, nl:1},
    {k:"npic",  l:"📷 公告照片", npic:1},
    {k:"zones", l:"📍 各區位置（公告框裡的表格）", zones:1},
    {k:"map",   l:"🗺 平面圖", map:1},
    {k:"abbr",  c:"J", l:"縮寫", hint:"多個用逗號分開，例如 HCTZ, HCT；清空＝全部拿掉"}
  ];
  var NK={"":"（沒有公告）","1":"1 停止供貨","2":"2 改包裝通知","3":"3 製廠缺貨","4":"4 換廠","5":"5 給慢箋"};
  var ZONES=[["z1","成錠"],["z2","兒錠"],["z3","兒水"],["z4","急診"],["z5","UD1"],["z6","UD2"]];
  var FORMS=["錠劑","膠囊","口服液","糖漿","懸液","眼藥水","滴劑","噴劑","藥膏","乳膏","貼片","栓劑","注射液","粉劑","顆粒","外用液"];
  function mapOpts(m){
    var cur=m&&m.now||"", h='';
    var opt=function(v,l){ return '<option value="'+esc(v)+'"'+(v===cur?" selected":"")+'>'+esc(l)+'</option>'; };
    h+=opt("","自動判斷（跟著小藥庫位置走）")+opt("公藥","沒有平面圖（公藥那種）");
    h+='<optgroup label="棧板">'+opt("棧左","棧左")+opt("棧中","棧中")+opt("棧右","棧右")+'</optgroup>';
    var n=m&&m.names||{};
    [["錠櫃",n.tab],["水櫃",n.water],["其他",n.other],["雲端資料夾裡的圖",n.drive]].forEach(function(g){
      if(!g[1]||!g[1].length) return;
      h+='<optgroup label="'+esc(g[0])+'">'+g[1].map(function(x){ return opt(x,x); }).join("")+'</optgroup>';
    });
    if (cur && h.indexOf('value="'+esc(cur)+'"')<0) h+=opt(cur,cur+"（現在設的）");
    return h;
  }
  function renderEdit(r, backTo){
    if (NET.off){ setHint("📴 離線中：修改要有網路，網路好了再改", true); return; }
    out.innerHTML='<article class="card"><div class="head"><div class="t"><div class="code mono">'+esc(r.code)+'</div><div class="brand">'+esc(r.brand)+'</div></div></div><div class="edit"><div class="t">✏️ 讀現在的內容…</div></div></article>';
    window.scrollTo({top:0});
    call("appEditInfo",[T, r.code],function(info){
      if (!info || info.err){ setHint("❌ "+(info&&info.err||"讀不到現在的內容"), true); renderCard(r, backTo); return; }
      buildEdit(r, backTo, info);
    });
  }
  function buildEdit(r, backTo, info){
    var v=info.vals||{}, h='<article class="card"><div class="head"><div class="t"><div class="code mono">'+esc(r.code)+'</div><div class="brand">'+esc(r.brand)+'</div></div></div>';
    h+='<div class="edit"><div class="t">✏️ 跟 LINE 的 ✏️ 改 同樣 16 欄：直接改下面的框，按「存」就寫進試算表。照片選好會直接存進雲端（不用按「存」）。學名、藥品特徵、適應症、注意、曾用藥品、公告補充說明可以多行：按 Enter 換行，卡片上就跳行。</div>';
    EF.forEach(function(f){
      var k=f.k, cur=v[k]===undefined||v[k]===null?"":String(v[k]);
      h+='<div class="f"><label for="e_'+k+'">'+(f.c?'<b>'+f.c+'</b>':'')+esc(f.l)+'</label>';
      if (f.pic){
        h+='<div class="picrow drop" id="e_picdrop" data-zone="photo" tabindex="0"><span class="ph big"><img class="ki" src="'+ICON[kindOf(r)]+'" alt="">'+(r.thumb||r.photo?'<img class="pi" id="e_picimg" src="'+esc(r.thumb||r.photo)+'" alt="" data-rm="">':'')+'</span>'
          +'<span class="dz"><button type="button" class="quiet" id="e_picbtn">📷 拍照或選照片</button><small>或把照片拖到這一格、點一下這格再 Ctrl+V 貼上</small></span><input type="file" id="e_picfile" accept="image/*" hidden></div>'
          +'<span class="was" id="e_picmsg">存進雲端照片資料夾（檔名 '+esc(r.code)+'.jpeg），舊的會移到「舊照片」，卡片馬上換新照片</span></div>';
        return;
      }
      if (f.npic){
        var np=v.npic||"";
        h+='<div class="picrow drop" id="e_npicdrop" data-zone="npic" tabindex="0"><span class="ph big" id="e_npicph">'+(np?'<img class="pi" id="e_npicimg" src="'+esc(String(np).replace(/([?&]sz=w)\d+/,"$1120"))+'" alt="" data-rm="">':'<span class="none">沒有</span>')+'</span>'
          +'<span class="dz"><span class="dzb"><button type="button" id="e_npicbtn">📷 拍照或選照片</button>'+(np?'<button type="button" id="e_npicdel">🗑 移除</button>':'')+'</span><small>或把照片拖到這一格、點一下這格再 Ctrl+V 貼上</small></span><input type="file" id="e_npicfile" accept="image/*" hidden></div>'
          +'<span class="was" id="e_npicmsg">顯示在藥品卡片的公告框裡（例如新包裝的外盒）；選好直接存進雲端「公告照片」，公告移除時一起拿掉</span></div>';
        return;
      }
      if (f.zones){
        h+='<div class="zgrid">'+ZONES.map(function(z){ var zv=v[z[0]]||""; return '<label class="zc"><span>'+esc(z[1])+'</span><input id="e_'+z[0]+'" value="'+esc(zv)+'" autocapitalize="characters" placeholder="（沒放）"></label>'; }).join("")+'</div>'
          +'<span class="was">成錠、兒錠、兒水、急診、UD1、UD2 各區的位置；有填的區才會出現在公告框的表格（有公告的藥才顯示）</span></div>';
        return;
      }
      if (f.map){
        var m=info.map||{}, now=m.now||"", nowText=!now?"自動判斷":(now==="公藥"?"沒有平面圖":now);
        h+='<select id="e_map">'+mapOpts(m)+'</select><span class="was">原本：'+esc(nowText)+'　設完全院立刻生效</span></div>';
        return;
      }
      if (f.nk){
        h+='<select id="e_'+k+'">'+Object.keys(NK).map(function(n){ return '<option value="'+n+'"'+(cur===n?" selected":"")+'>'+esc(NK[n])+'</option>'; }).join("")+'</select>';
      } else if (f.ta){
        h+='<textarea id="e_'+k+'">'+esc(cur)+'</textarea>';
      } else if (f.list){
        h+='<input id="e_'+k+'" value="'+esc(cur)+'" list="l_'+k+'"><datalist id="l_'+k+'">'+FORMS.map(function(x){ return '<option value="'+esc(x)+'">'; }).join("")+'</datalist>';
      } else {
        h+='<input id="e_'+k+'" value="'+esc(cur)+'"'+(f.cap?' autocapitalize="characters"':'')+(f.url?' inputmode="url"':'')+'>';
        if (k==="loc") h+='<button type="button" class="mvgo2" id="e_locpick">📍 選位置（櫃、全部的位置、看平面圖）</button><div class="mvp e-locp" id="e_locp" hidden></div>';
      }
      h+='<span class="was">'+(f.nl?'按 Enter 換行＝卡片上跳行　':'')+(f.hint?esc(f.hint)+'　':'')+'原本：'+(cur?esc((cur.length>60?cur.slice(0,60)+"…":cur).replace(/\n/g," ⏎ ")):"（空的）")+'</span></div>';
    });
    h+='<div class="actions"><button type="button" class="quiet" id="ecancel">取消</button><button type="button" class="pri" id="esave">💾 存</button></div></div></article>';
    h=h.replace('<div class="edit">','<div class="edit"><button type="button" class="mvgo" id="e_mv">📍 改位置（公藥區的格子、小藥庫位置）→ 選格子、選櫃→選層，比打字不容易出錯</button>');
    out.innerHTML=h;
    $("ecancel").onclick=function(){ renderCard(r, backTo); };
    $("e_mv").onclick=function(){ renderMove(r, backTo); };
    $("e_locpick").onclick=function(){
      var bx=$("e_locp"), bt=this;
      if (!bx.hidden){ bx.hidden=true; return; }
      bt.disabled=true; bt.textContent="📍 讀全部的位置…";
      call("appMoveInfo",[T, r.code],function(info){
        bt.disabled=false; bt.textContent="📍 選位置（櫃、全部的位置、看平面圖）";
        if (!info||info.err){ setHint("❌ "+(info&&info.err||"讀不到位置"), true); return; }
        bx.hidden=false;
        mvLocPicker(bx, info, function(v){ var el=$("e_loc"), key=mvLocKey(v), nm=key; (info.locs||[]).concat([].concat.apply([], (info.places||[]).map(function(g){ return g.l; }))).forEach(function(x){ if (mvLocKey(x.loc)===key) nm=x.loc; }); el.value=nm; bx.hidden=true; setHint("📍 選好了「"+nm+"」：按「💾 存」才會寫進去"); try{ el.focus(); }catch(e){} });
      }, function(e){ bt.disabled=false; bt.textContent="📍 選位置（櫃、全部的位置、看平面圖）"; var m=String(e&&e.message||e); setHint("❌ "+(/看不懂的請求/.test(m)?"網頁專案（Apps Script）的 01、02 還沒換成第 63 批以後":m), true); });
    };
    $("e_picbtn").onclick=function(){ $("e_picfile").click(); };
    $("e_picfile").onchange=function(e){ var file=e.target.files&&e.target.files[0]; e.target.value=""; if(file) uploadPic(file); };
    function uploadPic(file){
      if (!file||!/^image\//.test(file.type||"")) { setHint("❌ 這不是照片檔", true); return; }
      $("e_picbtn").disabled=true; $("e_picmsg").textContent="📷 讀照片…";
      shrink(file,function(b64,mime,kb){
        $("e_picmsg").textContent="📷 存進雲端（"+kb+" KB）…";
        call("appPic",[T, r.code, b64, mime],function(res){
          $("e_picbtn").disabled=false;
          if (!res || res.err){ $("e_picmsg").textContent="❌ "+(res&&res.err||"沒存成"); setHint("❌ "+(res&&res.err||"照片沒存成"), true); return; }
          $("e_picmsg").textContent="✅ 換好了（雲端 "+(res.name||"")+(res.moved&&res.moved.length?"；舊的移到「舊照片」":"")+"）新照片要幾秒鐘才會出現";
          if (res.url){ var im=$("e_picimg"); var th=String(res.url).replace(/([?&]sz=w)\d+/,"$1120"); if(im) im.src=th; else { var ph=$("e_picbtn").parentNode.querySelector(".ph"); if(ph) ph.insertAdjacentHTML("beforeend",'<img class="pi" id="e_picimg" src="'+esc(th)+'" alt="" data-rm="">'); } r.photo=res.url; r.thumb=th; if($("e_photo")) $("e_photo").value=res.url; v.photo=res.url; }
          if (res.row){ keepPh(r, res.row); FULL[res.row.code]=res.row; r=res.row; swapRow(res.row); }
          HOME=null; homeDrop();
          setHint("✅ "+r.code+" 照片換好了");
        });
      });
    }
    var npicDel=false;
    $("e_npicbtn").onclick=function(){ $("e_npicfile").click(); };
    if ($("e_npicdel")) $("e_npicdel").onclick=function(){ npicDel=!npicDel; this.textContent=npicDel?"↩ 不移除":"🗑 移除"; $("e_npicmsg").textContent=npicDel?"按「存」就把公告照片拿掉":"顯示在藥品卡片的公告框裡"; };
    $("e_npicfile").onchange=function(e){ var file=e.target.files&&e.target.files[0]; e.target.value=""; if(file) uploadNpic(file); };
    function uploadNpic(file){
      if (!file||!/^image\//.test(file.type||"")) { setHint("❌ 這不是照片檔", true); return; }
      $("e_npicbtn").disabled=true; $("e_npicmsg").textContent="📷 讀照片…";
      shrink(file,function(b64,mime,kb){
        $("e_npicmsg").textContent="📷 存進雲端（"+kb+" KB）…";
        call("appPic",[T, r.code, b64, mime, "npic"],function(res){
          $("e_npicbtn").disabled=false;
          if (!res || res.err){ $("e_npicmsg").textContent="❌ "+(res&&res.err||"沒存成"); setHint("❌ "+(res&&res.err||"公告照片沒存成"), true); return; }
          npicDel=false; $("e_npicmsg").textContent="✅ 公告照片換好了（雲端 公告照片／"+(res.name||"")+"）"+(v.nk?"":"　⚠️ 這品項藥品還沒掛公告，掛上才會顯示");
          if (res.url){ var th=String(res.url).replace(/([?&]sz=w)\d+/,"$1120"); $("e_npicph").innerHTML='<img class="pi" id="e_npicimg" src="'+esc(th)+'" alt="" data-rm="">'; v.npic=res.url; }
          if (res.row){ keepPh(r, res.row); FULL[res.row.code]=res.row; r=res.row; swapRow(res.row); }
          HOME=null; homeDrop();
        });
      });
    }
    EDIT_ZONE={photo:uploadPic, npic:uploadNpic, active:"photo"};
    [$("e_picdrop"), $("e_npicdrop")].forEach(function(z){
      if (!z) return;
      z.addEventListener("click", function(){ EDIT_ZONE.active=z.dataset.zone; markZone(); });
      z.addEventListener("focus", function(){ EDIT_ZONE.active=z.dataset.zone; markZone(); });
      z.addEventListener("dragover", function(e){ e.preventDefault(); e.stopPropagation(); z.classList.add("over"); });
      z.addEventListener("dragleave", function(){ z.classList.remove("over"); });
      z.addEventListener("drop", function(e){ e.preventDefault(); e.stopPropagation(); z.classList.remove("over"); var f=dropFile(e); if (f){ EDIT_ZONE.active=z.dataset.zone; markZone(); EDIT_ZONE[z.dataset.zone](f); } });
    });
    function markZone(){ [$("e_picdrop"), $("e_npicdrop")].forEach(function(z){ if(z) z.classList.toggle("active", z.dataset.zone===EDIT_ZONE.active); }); }
    markZone();
    $("esave").onclick=function(){
      var ch={};
      EF.forEach(function(f){ if(f.pic||f.map||f.npic||f.zones) return; var k=f.k, el=$("e_"+k); if(!el) return; var val=el.value; var cur=v[k]===undefined||v[k]===null?"":String(v[k]); if(k==="loc") val=val.toUpperCase(); if(val!==cur) ch[k]=val; });
      ZONES.forEach(function(z){ var el=$("e_"+z[0]); if(!el) return; var val=el.value.trim(), cur=(v[z[0]]||"").toString(); if(val!==cur) ch[z[0]]=val; });
      if (npicDel) ch.npic="";
      var mapNow=(info.map&&info.map.now)||"", mapSel=$("e_map")?$("e_map").value:mapNow; if(mapSel!==mapNow) ch.map=mapSel;
      if (!Object.keys(ch).length){ setHint("沒有改任何東西"); renderCard(r, backTo); return; }
      if (ch.ref && !/^https?:\/\/\S+$/i.test(ch.ref)){ setHint("❌ 藥品查詢參考網站：要以 http:// 或 https:// 開頭、中間不能有空格", true); $("e_ref").focus(); return; }
      $("esave").disabled=true; setHint("寫進試算表…", false, true);
      call("appEdit",[T, r.code, ch],function(res){
        if (!res || res.err){ setHint("❌ "+(res&&res.err||"寫入失敗"), true); $("esave").disabled=false; return; }
        var done=res.done||[], errs=res.errs||[];
        if (errs.length) setHint((done.length?"✅ 改好 "+done.join("、")+"；":"")+"⚠️ 沒改成："+errs.join("；"), true);
        else setHint("✅ 改好 "+done.length+" 項（"+done.join("、")+"），已寫進試算表"+(res.undo?"　↩️ 改錯了：LINE 打「復原 "+res.undo+"」":""));
        var nr=res.row?res.row:r; if(res.row){ keepPh(r, nr); FULL[nr.code]=nr; swapRow(nr); }
        HOME=null; homeDrop();
        renderCard(nr, backTo);
      });
    };
    window.scrollTo({top:0});
  }
  var MV_CABS="ABCDEFGHIJKLMNOPQRST".split(""), MV_ZH=["棧左","棧中","棧右"];
  function mvLabel(c){ return c ? c.label : ""; }
  function renderMove(r, backTo, done){
    if (NET.off){ setHint("📴 離線中：改位置要有網路，網路好了再改", true); return; }
    out.innerHTML='<article class="card"><div class="head"><div class="t"><div class="code mono">'+esc(r.code)+'</div><div class="brand">'+esc(r.brand)+'</div></div></div><div class="edit"><div class="t">📍 讀現在的位置…</div></div></article>';
    window.scrollTo({top:0});
    call("appMoveInfo",[T, r.code],function(info){
      if (!info || info.err){ setHint("❌ "+(info&&info.err||"讀不到現在的位置"), true); renderCard(r, backTo); return; }
      buildMove(r, backTo, info, done);
    }, function(e){ var m=String(e&&e.message||e); setHint("❌ "+(/看不懂的請求/.test(m)?"網頁專案（Apps Script）的 01、02 還沒換成第 63 批，「📍 改位置」先不能用":m), true); renderCard(r, backTo); });
  }
  function buildMove(r, backTo, info, done){
    var cells=info.cells||[], mine=cells.filter(function(c){ return c.codes.indexOf(r.code)>=0; });
    var h='<article class="card"><div class="head"><div class="t"><div class="code mono">'+esc(r.code)+'</div><div class="brand">'+esc(r.brand)+'</div>'+(r.chName?'<div class="zh">'+esc(r.chName)+'</div>':'')+'</div></div>';
    h+='<div class="edit mvp">';
    if (done) h+='<div class="mvdone" id="mv_done"><div>'+done.html+'</div>'+(done.undo?'<button type="button" id="mv_undo">↩️ 復原</button>':'')+'</div>';
    h+='<div class="t">📍 改位置：每一次都先給您看「改前 → 改後」，按「確定」才改</div>';
    h+='<section class="mvs"><h3>小藥庫位置（試算表）</h3><div class="mvnow"><span>現在</span><b id="mv_locnow">'+esc(info.loc||"（空的）")+'</b></div>';
    h+='<div id="mv_lp"></div><div id="mv_lconf"></div></section>';
    var mp=info.map;
    if (mp) h+='<section class="mvs"><h3>平面圖（開發者設定）</h3><div class="mvcellrow"><b>'+esc(mp.spots&&mp.spots.length?"照公藥區的格子（"+mp.spots.join("、")+"）":mp.none?"沒有平面圖（開發者設的）":mp.now?mp.now+"（開發者設的）":"自動（跟著小藥庫位置走）")+'</b><button type="button" id="mv_map">🗺 改平面圖</button></div></section>';
    h+='<section class="mvs"><h3>公藥區的格子（平面圖上的位置）</h3>';
    if (!info.cellOk) h+='<p class="mvnote">這支藥的 CODE 不是 5 位數字，平面圖的檔名認不得（公藥區的格子不能從這裡改）</p>';
    else if (info.cellErr) h+='<p class="mvnote">⚠️ '+esc(info.cellErr)+'</p>';
    else {
      h+=mine.length?mine.map(function(c){ return '<div class="mvcellrow"><b>'+esc(c.label)+'</b><button type="button" class="pri" data-mvswap="'+esc(c.id)+'">換掉</button><button type="button" class="warn" data-mvdel="'+esc(c.id)+'">拿掉</button></div>'; }).join(""):'<p class="mvnote">還沒有放在公藥區的任何一格</p>';
      h+='<div class="mvbar"><button type="button" id="mv_add">＋加一格</button></div>';
    }
    h+='<div id="mv_cp"></div><div id="mv_cconf"></div></section>';
    h+='<section class="mvs"><h3>📦 很多支一起搬</h3><p class="mvnote">選一格，或打一個小藥庫位置 → 勾要搬的 → 選搬到哪</p>';
    h+='<div class="mvchips">'+cells.map(function(c){ return '<button type="button" data-mvbsrc="'+esc(c.id)+'">'+esc(c.label)+'</button>'; }).join("")+'</div>';
    h+='<div class="mvtype"><input id="mv_bloc" placeholder="小藥庫位置，例：C2、水A1、棧左" autocapitalize="characters"><button type="button" id="mv_bgo">列出來</button></div>';
    h+='<div id="mv_b"></div></section>';
    h+='<div class="actions"><button type="button" class="quiet" id="mv_back">← 回卡片</button></div></div></article>';
    out.innerHTML=h;
    $("mv_back").onclick=function(){ renderCard(FULL[r.code]||r, backTo); };
    if ($("mv_map")) $("mv_map").onclick=function(){ renderEdit(FULL[r.code]||r, backTo); setTimeout(function(){ var m=$("e_map"); if (m) try{ m.scrollIntoView({block:"center"}); m.focus(); }catch(e){} }, 1500); };
    if (done && done.undo) $("mv_undo").onclick=function(){ this.disabled=true; done.undo(); };
    mvLocPicker($("mv_lp"), info, function(loc){ mvLocConfirm($("mv_lconf"), [{code:r.code, old:info.loc||"", brand:r.brand}], loc, info, function(res){ mvAfter(r, backTo, res, "loc"); }); });
    function pickCell(op, fromId){
      var pool=cells.filter(function(c){ return c.id!==fromId && c.codes.indexOf(r.code)<0; });
      mvGallery($("mv_cp"), pool, (op==="a"?"＋ "+r.code+" 要多放哪一格？":"換到哪一格？")+"（已經有 "+r.code+" 的格子不列出來）", function(to){ cellConfirm(fromId, to.id); });
    }
    function cellConfirm(fromId, toId){
      var from=cells.filter(function(c){ return c.id===fromId; })[0], to=cells.filter(function(c){ return c.id===toId; })[0];
      var bef=mine.map(mvLabel), aft=mine.map(mvLabel).filter(function(x){ return !from || x!==from.label; });
      if (to && aft.indexOf(to.label)<0) aft.push(to.label);
      var how=[]; if (from) how.push("「"+from.label+"」的檔名拿掉 "+r.code); if (to) how.push("「"+to.label+"」的檔名加上 "+r.code);
      mvConfirm($("mv_cconf"), r.code+"　公藥區的格子", [[bef.join("、")||"（沒有放在公藥區）", aft.join("、")||"（沒有放在公藥區）"]], "雲端硬碟會這樣改："+how.join("；"), "", function(btn){
        call("appMove",[T, {kind:"cell", codes:[r.code], from:fromId||"", to:toId||""}],function(res){ if(!res||res.err){ btn.disabled=false; setHint("❌ 沒有改："+(res&&res.err||"?"), true); return; } mvAfter(r, backTo, res, "cell"); }, function(e){ btn.disabled=false; setHint("❌ "+(e&&e.message||e), true); });
      });
    }
    Array.prototype.forEach.call(out.querySelectorAll("[data-mvswap]"),function(b){ b.onclick=function(){ pickCell("s", b.dataset.mvswap); }; });
    Array.prototype.forEach.call(out.querySelectorAll("[data-mvdel]"),function(b){ b.onclick=function(){ $("mv_cp").innerHTML=""; cellConfirm(b.dataset.mvdel, ""); }; });
    if ($("mv_add")) $("mv_add").onclick=function(){ pickCell("a", ""); };
    function bList(kind, val){
      $("mv_b").innerHTML='<p class="mvnote">讀這裡的藥…</p>';
      call("appMoveList",[T, kind, val],function(res){
        if (!res||res.err){ $("mv_b").innerHTML='<p class="mvnote">❌ '+esc(res&&res.err||"讀不到")+'</p>'; return; }
        var rows=res.rows||[];
        if (!rows.length){ $("mv_b").innerHTML='<p class="mvnote">「'+esc(res.title)+'」現在沒有藥</p>'; return; }
        var hh='<div class="mvbt"><b>'+esc(res.title)+'</b>：勾要搬的</div><div class="mvlist">'+rows.map(function(x,i){ return '<label class="mvck"><input type="checkbox" data-mvi="'+i+'"><span class="mono">'+esc(x.code)+'</span><span>'+esc(x.brand||x.chName||"")+'</span><span class="mvl">'+esc(x.loc||"")+'</span></label>'; }).join("")+'</div>';
        hh+='<div class="mvbar"><button type="button" id="mv_ball">全選</button><button type="button" id="mv_bnone">全不選</button><button type="button" class="pri" id="mv_bnext">下一步：搬到哪（<span id="mv_bn">0</span> 支）</button></div><div id="mv_bt"></div><div id="mv_bconf"></div>';
        $("mv_b").innerHTML=hh;
        var boxes=Array.prototype.slice.call($("mv_b").querySelectorAll("[data-mvi]"));
        function sel(){ return boxes.filter(function(b){ return b.checked; }).map(function(b){ return rows[+b.dataset.mvi]; }); }
        function upd(){ $("mv_bn").textContent=sel().length; $("mv_bt").innerHTML=""; $("mv_bconf").innerHTML=""; }
        boxes.forEach(function(b){ b.onchange=upd; });
        $("mv_ball").onclick=function(){ boxes.forEach(function(b){ b.checked=true; }); upd(); };
        $("mv_bnone").onclick=function(){ boxes.forEach(function(b){ b.checked=false; }); upd(); };
        $("mv_bnext").onclick=function(){
          var s=sel(); if (!s.length){ setHint("還沒有勾任何一支", true); return; }
          var codes=s.map(function(x){ return x.code; });
          if (kind==="c"){
            var from=cells.filter(function(c){ return c.id===val; })[0];
            mvGallery($("mv_bt"), cells.filter(function(c){ return c.id!==val; }), "這 "+s.length+" 支從「"+(from?from.label:"")+"」搬到哪一格？", function(to){
              var had=codes.filter(function(c){ return to.codes.indexOf(c)>=0; });
              mvConfirm($("mv_bconf"), "這 "+s.length+" 支："+codes.join("、"), [[from?from.label:"", to.label]], "雲端硬碟會這樣改：「"+(from?from.label:"")+"」的檔名拿掉這幾個代碼；「"+to.label+"」的檔名加上"+(had.length?"（"+had.join("、")+" 本來就在，只從舊的那一格拿掉）":""), "", function(btn){
                call("appMove",[T, {kind:"cell", codes:codes, from:val, to:to.id}],function(res2){ if(!res2||res2.err){ btn.disabled=false; setHint("❌ 沒有改："+(res2&&res2.err||"?"), true); return; } mvAfter(r, backTo, res2, "cell", codes); }, function(e){ btn.disabled=false; setHint("❌ "+(e&&e.message||e), true); });
              });
            });
          } else {
            $("mv_bt").innerHTML='<div class="mvbt">搬到小藥庫哪裡？</div><div id="mv_blp"></div>';
            mvLocPicker($("mv_blp"), info, function(loc){ mvLocConfirm($("mv_bconf"), s.map(function(x){ return {code:x.code, old:x.loc, brand:x.brand}; }), loc, info, function(res2){ mvAfter(r, backTo, res2, "loc", codes); }); });
          }
        };
      });
    }
    Array.prototype.forEach.call(out.querySelectorAll("[data-mvbsrc]"),function(b){ b.onclick=function(){ Array.prototype.forEach.call(out.querySelectorAll("[data-mvbsrc]"),function(x){ x.setAttribute("aria-pressed", x===b); }); bList("c", b.dataset.mvbsrc); }; });
    $("mv_bgo").onclick=function(){ var v=$("mv_bloc").value.trim(); if(!v){ $("mv_bloc").focus(); return; } bList("l", v); };
    $("mv_bloc").onkeydown=function(e){ if (e.key==="Enter"){ e.preventDefault(); $("mv_bgo").click(); } };
    window.scrollTo({top:0});
  }
  function mvLocPicker(box, info, pick){
    var locs=info.locs||[], has={}; locs.forEach(function(x){ has[x.loc]=x.n; });
    var pls=info.places||[];
    var h='<div class="mvstep">① 選櫃</div><div class="mvgrid c5">'+MV_CABS.map(function(c){ return '<button type="button" data-cab="'+c+'">'+c+'</button>'; }).join("")+'</div>'
      +'<div class="mvgrid c2"><button type="button" data-cab="水">💧 水櫃</button>'+(pls.length?'':'<button type="button" data-cab="中">棧板、水棧、其他</button>')+'</div>'
      +'<div class="mvstep" data-l2 hidden></div><div class="mvgrid c5" data-lay hidden></div>'
      +(pls.length?'<div class="mvgrp" data-pls>'+pls.map(function(g){ return '<div class="mvstep">'+esc(g.g)+'</div><div class="mvgrid c3">'+g.l.map(function(x){ return '<button type="button" data-pl="'+esc(x.loc)+'">'+esc(x.loc)+(has[x.loc]?'<small>'+has[x.loc]+' 支</small>':'')+'</button>'; }).join("")+'</div>'; }).join("")+'</div>':'')
      +'<div class="mvbar"><button type="button" class="pri" data-own>✍️ 自己填入</button></div>'
      +'<div class="mvtype" data-ownbox'+(pls.length?' hidden':'')+'><input placeholder="打位置：C2、水A1、棧板C區" autocapitalize="characters" data-lin><button type="button" data-lgo>看改前 → 改後</button></div>';
    box.innerHTML=h;
    var l2=box.querySelector("[data-l2]"), lay=box.querySelector("[data-lay]"), lin=box.querySelector("[data-lin]");
    function layers(pre){
      var o=["1","2","3","4","5"].map(function(n){ return pre+n; });
      locs.forEach(function(x){ var k=String(x.loc).toUpperCase(); if (k.indexOf(pre)===0 && o.indexOf(x.loc)<0 && !/^[A-Z]/.test(k.slice(pre.length)) && k.length>pre.length && o.length<20) o.push(x.loc); });
      return o;
    }
    function bt(v){ return '<button type="button" data-v="'+esc(v.v)+'"'+(v.next?' data-next="1"':'')+'>'+esc(v.l)+(has[v.v]?'<small>'+has[v.v]+' 支</small>':'')+'</button>'; }
    function show(title, list, cls, groups){
      l2.textContent=title; l2.hidden=false; lay.hidden=false; lay.className=groups?"mvgrp":"mvgrid "+(cls||"c5");
      lay.innerHTML=groups?groups.map(function(g){ return '<div class="mvstep">'+esc(g.g)+'</div><div class="mvgrid c3">'+g.l.map(function(x){ return bt({v:x.loc, l:x.loc}); }).join("")+'</div>'; }).join(""):list.map(bt).join("");
      Array.prototype.forEach.call(lay.querySelectorAll("button"),function(b){ b.onclick=function(){ if (b.dataset.next) { cab(b.dataset.v); return; } Array.prototype.forEach.call(lay.querySelectorAll("button"),function(x){ x.setAttribute("aria-pressed", x===b); }); pick(b.dataset.v); }; });
    }
    function cab(c){
      Array.prototype.forEach.call(box.querySelectorAll("[data-cab]"),function(x){ x.setAttribute("aria-pressed", x.dataset.cab===c || (c.length===2&&c.charAt(0)==="水"&&x.dataset.cab==="水")); });
      if (c==="水"){
        var seen={}; (info.water||[]).forEach(function(x){ seen[x]=1; }); locs.forEach(function(x){ var m=/^水([A-Z])/.exec(String(x.loc).toUpperCase()); if(m) seen[m[1]]=1; });
        var ws=MV_CABS.filter(function(x){ return seen[x]; }); if(!ws.length) ws=MV_CABS;
        show("💧 水櫃：哪一櫃？", ws.map(function(x){ return {v:"水"+x, l:"水"+x, next:1}; }));
        return;
      }
      if (c==="中"){
        if (info.places&&info.places.length){ show("棧板、水棧、其他（全部的位置）", null, "", info.places); return; }
        var zh=MV_ZH.slice(); locs.forEach(function(x){ if(!/^水?[A-Z]/i.test(x.loc) && zh.indexOf(x.loc)<0) zh.push(x.loc); });
        show("棧板、水棧、其他", zh.map(function(x){ return {v:x, l:x}; }), "c3");
        return;
      }
      show("② "+c+" 櫃：第幾層？", layers(c).map(function(x){ return {v:x, l:x}; }));
    }
    Array.prototype.forEach.call(box.querySelectorAll("[data-cab]"),function(b){ b.onclick=function(){ cab(b.dataset.cab); }; });
    Array.prototype.forEach.call(box.querySelectorAll("[data-pl]"),function(b){ b.onclick=function(){ Array.prototype.forEach.call(box.querySelectorAll("[data-pl],[data-lay] button"),function(x){ x.setAttribute("aria-pressed", x===b); }); pick(b.dataset.pl); }; });
    mvPrevOn(box, info);
    box.querySelector("[data-own]").onclick=function(){ var ob=box.querySelector("[data-ownbox]"); ob.hidden=false; try{ lin.focus(); }catch(e){} };
    box.querySelector("[data-lgo]").onclick=function(){ var v=lin.value.trim(); if(!v){ lin.focus(); return; } pick(v); };
    lin.onkeydown=function(e){ if (e.key==="Enter"){ e.preventDefault(); box.querySelector("[data-lgo]").click(); } };
  }
  var MVPV=null, MVPV_SC=0;
  function mvPrevKey(b){
    var v=b.dataset.pl||b.dataset.v||(b.dataset.cab&&/^[A-Z]$/.test(b.dataset.cab)?b.dataset.cab:"")||"";
    var m=/^(水?[A-Z])\d/.exec(v); return m?m[1]:v;
  }
  function mvPrevHide(){ if (MVPV) MVPV.hidden=true; }
  function mvPrevShow(b, info){
    var k=mvPrevKey(b), u=info.pmap&&info.pmap[k];
    if (!u){ mvPrevHide(); return; }
    if (!MVPV){ MVPV=document.createElement("div"); MVPV.className="mvpv"; MVPV.setAttribute("aria-hidden","true"); MVPV.innerHTML='<img alt=""><b></b>'; document.body.appendChild(MVPV); }
    var im=MVPV.querySelector("img"); if (im.getAttribute("src")!==u) im.src=u;
    MVPV.querySelector("b").textContent=k+" 的平面圖";
    MVPV.hidden=false; MVPV._b=b; MVPV._i=info;
    var r=b.getBoundingClientRect(), W=Math.min(340, innerWidth-24), H=W*0.75+30;
    var z=parseFloat(getComputedStyle(document.body).zoom)||1;
    MVPV.style.width=(W/z)+"px";
    var x=r.right+10; if (x+W>innerWidth-8) x=r.left-W-10; if (x<8) x=Math.max(8, Math.min(innerWidth-W-8, r.left+r.width/2-W/2));
    var y=r.top+r.height/2-H/2; if (x>=r.left-W-10 && x<=r.right && (r.left-W-10<8 && r.right+10+W>innerWidth-8)) y=r.top-H-10<8?r.bottom+10:r.top-H-10;
    y=Math.max(8, Math.min(innerHeight-H-8, y));
    MVPV.style.left=(x/z)+"px"; MVPV.style.top=(y/z)+"px";
  }
  function mvPrevOn(box, info){
    if (!info.pmap) return;
    var btn=function(e){ var b=e.target&&e.target.closest?e.target.closest("button"):null; return b&&box.contains(b)&&(b.dataset.pl||b.dataset.v||b.dataset.cab)?b:null; };
    box.addEventListener("mouseover", function(e){ var b=btn(e); if (b) mvPrevShow(b, info); });
    box.addEventListener("mouseout", function(e){ var b=btn(e); if (b && !(e.relatedTarget&&b.contains(e.relatedTarget))) mvPrevHide(); });
    box.addEventListener("focusin", function(e){ var b=btn(e); if (b) mvPrevShow(b, info); });
    box.addEventListener("focusout", mvPrevHide);
    var tm=null, held=false;
    box.addEventListener("touchstart", function(e){ var b=btn(e); held=false; clearTimeout(tm); if (!b) return; tm=setTimeout(function(){ held=true; mvPrevShow(b, info); }, 450); }, { passive:true });
    box.addEventListener("touchmove", function(){ clearTimeout(tm); }, { passive:true });
    box.addEventListener("touchend", function(e){ clearTimeout(tm); if (held){ mvPrevHide(); e.preventDefault(); held=false; } });
    box.addEventListener("contextmenu", function(e){ if (btn(e)) e.preventDefault(); });
    if (!MVPV_SC){ MVPV_SC=1; window.addEventListener("scroll", function(){ if (MVPV && !MVPV.hidden){ if (MVPV._b && MVPV._b.isConnected) mvPrevShow(MVPV._b, MVPV._i); else mvPrevHide(); } }, { passive:true }); }
  }
  function mvLocKey(v){ return String(v||"").replace(/[！-～]/g,function(ch){ return String.fromCharCode(ch.charCodeAt(0)-65248); }).toUpperCase().replace(/\s+/g,""); }
  function mvLocConfirm(box, items, raw, info, done){
    var key=mvLocKey(raw);
    if (!key || key.length>20 || /\|/.test(key)){ setHint("❌ 位置不能是空的、最多 20 個字、不能有「|」", true); return; }
    if (/^\d{4,6}$/.test(key)){ setHint("❌ 「"+key+"」看起來是 CODE，不是位置", true); return; }
    var hit=(info.locs||[]).filter(function(x){ return mvLocKey(x.loc)===key; })[0], pl=null;
    if (!hit) (info.places||[]).forEach(function(g){ g.l.forEach(function(x){ if (!pl && mvLocKey(x.loc)===key) pl=x; }); });
    var loc=hit?hit.loc:pl?pl.loc:key;
    var todo=items.filter(function(x){ return mvLocKey(x.old)!==key; });
    if (!todo.length){ setHint(items.length===1?items[0].code+" 本來就是「"+loc+"」，不用改 👍":"勾的都已經是「"+loc+"」了"); box.innerHTML=""; return; }
    var pairs=todo.map(function(x){ return [x.old||"（空的）", loc, x.code]; });
    var warn=hit?"「"+loc+"」現在有 "+hit.n+" 支藥":pl?"「"+loc+"」是平面圖上的位置（現在還沒有藥放這裡）":"⚠️ 試算表裡還沒有別的藥放「"+loc+"」：確定是這個位置嗎？（打錯字就重選）";
    mvConfirm(box, todo.length===1?todo[0].code+"　小藥庫位置":"這 "+todo.length+" 支的小藥庫位置", pairs, warn, hit||pl?"":"warn", function(btn){
      call("appMove",[T, {kind:"loc", items:todo.map(function(x){ return {code:x.code, old:x.old||""}; }), to:loc, allowNew:!hit}],function(res){
        if (!res||res.err||res.confirm){ btn.disabled=false; setHint("❌ 沒有改："+(res&&res.err||"請再確認一次"), true); return; }
        done(res);
      }, function(e){ btn.disabled=false; setHint("❌ "+(e&&e.message||e), true); });
    });
  }
  function mvConfirm(box, title, pairs, note, noteCls, ok){
    var h='<div class="mvconf" role="group" aria-label="請確認"><div class="mvct">請確認 📍 '+esc(title)+'</div>';
    if (pairs.length===1) h+='<div class="mvba"><span class="b">改前：'+esc(pairs[0][0])+'</span><span class="a">改後：'+esc(pairs[0][1])+'</span></div>';
    else h+='<div class="mvba">'+pairs.slice(0,30).map(function(p){ return '<span class="row">'+(p[2]?'<span class="mono">'+esc(p[2])+'</span>　':'')+esc(p[0])+' → <b>'+esc(p[1])+'</b></span>'; }).join("")+(pairs.length>30?'<span class="row">…還有 '+(pairs.length-30)+' 支</span>':'')+'</div>';
    if (note) h+='<p class="mvnote '+(noteCls||"")+'">'+esc(note)+'</p>';
    h+='<div class="mvbar"><button type="button" class="quiet" data-no>取消</button><button type="button" class="pri" data-ok>✅ 確定</button></div></div>';
    box.innerHTML=h;
    box.querySelector("[data-no]").onclick=function(){ box.innerHTML=""; };
    box.querySelector("[data-ok]").onclick=function(){ this.disabled=true; setHint("改…", false, true); ok(this); };
    try{ box.scrollIntoView({block:"nearest", behavior:"smooth"}); }catch(e){}
  }
  function mvGallery(box, pool, title, pick){
    if (!pool.length){ box.innerHTML='<p class="mvnote">沒有別的格子可以選</p>'; return; }
    box.innerHTML='<div class="mvbt">'+esc(title)+'</div><div class="mvgal" tabindex="0" aria-label="平面圖，左右滑">'+pool.map(function(c){ return '<figure class="mvcell"><img src="'+esc(c.thumb)+'" alt="'+esc(c.label)+' 的平面圖" loading="lazy"><figcaption><b>'+esc(c.label)+'</b><small>現在 '+c.codes.length+' 支藥</small></figcaption><button type="button" class="pri" data-pick="'+esc(c.id)+'">放這一格</button></figure>'; }).join("")+'</div><p class="mvnote">往左滑看全部 '+pool.length+' 格</p>';
    Array.prototype.forEach.call(box.querySelectorAll("[data-pick]"),function(b){ b.onclick=function(){
      Array.prototype.forEach.call(box.querySelectorAll(".mvcell"),function(x){ x.classList.toggle("on", x.contains(b)); });
      pick(pool.filter(function(c){ return c.id===b.dataset.pick; })[0]);
    }; });
    try{ box.scrollIntoView({block:"nearest", behavior:"smooth"}); }catch(e){}
  }
  function mvAfter(r, backTo, res, kind, codes){
    (res.rows||[]).forEach(function(nr){ keepPh(FULL[nr.code]||nr, nr); FULL[nr.code]=nr; swapRow(nr); });
    HOME=null; homeDrop();
    var nr=FULL[r.code]||r, html, undo=null;
    if (kind==="cell"){
      html='✅ 改好了（雲端硬碟的檔名已經讀回來確認過）<br>'+esc((codes&&codes.length>1?codes.length+" 支":r.code))+'　公藥區：'+esc((res.from||"")+(res.from&&res.to?" → ":"")+(res.to||"")+(res.from&&!res.to?"（拿掉了）":"")+(!res.from&&res.to?"（多放一格）":""));
      undo=function(){ call("appMoveUndo",[T, res.ops],function(u){ if(!u||u.err){ setHint("❌ 沒有復原："+(u&&u.err||"?"), true); return; } setHint("↩️ 復原好了"+(u.skip&&u.skip.length?"（"+u.skip.join("、")+" 後來又被改過，沒有動）":"")); mvReload(nr, backTo, {html:"↩️ 復原好了：公藥區的格子改回原來的"}); }); };
    } else {
      var d=res.done||[];
      html='✅ 改好了（試算表已經讀回來確認過）<br>'+d.slice(0,20).map(function(x){ return esc(x.code)+'　'+esc(x.before||"（空的）")+' → <b>'+esc(x.after)+'</b>'; }).join("<br>")+(res.skip&&res.skip.length?'<br><small>沒動的：'+esc(res.skip.join("；"))+'</small>':'')+(res.undo?'<br><small>LINE 也可以打「復原 '+esc(res.undo)+'」</small>':'');
      undo=function(){
        var groups={}; d.forEach(function(x){ (groups[x.before]=groups[x.before]||[]).push({code:x.code, old:x.after}); });
        var keys=Object.keys(groups), i=0, bad=[];
        (function next(){
          if (i>=keys.length){ if(bad.length) setHint("⚠️ 有幾支沒復原："+bad.join("；"), true); else setHint("↩️ 復原好了"); mvReload(nr, backTo, {html:"↩️ 復原好了：小藥庫位置改回原來的"}); return; }
          var k=keys[i++];
          if (!k){ bad.push(groups[k].map(function(x){ return x.code; }).join("、")+"（原本是空的，請用 ✏️ 修改清掉）"); next(); return; }
          call("appMove",[T, {kind:"loc", items:groups[k], to:k, allowNew:true}],function(u){ if(!u||u.err) bad.push(u&&u.err||"?"); else (u.rows||[]).forEach(function(x){ FULL[x.code]=x; swapRow(x); }); next(); }, function(e){ bad.push(String(e&&e.message||e)); next(); });
        })();
      };
    }
    setHint(kind==="cell"?"✅ 公藥區的格子改好了":"✅ 小藥庫位置改好了");
    mvReload(nr, backTo, {html:html, undo:undo});
  }
  function mvReload(r, backTo, done){ renderMove(r, backTo, done); }

  function show(res, label, kw){
    if (!res || res.err){ setHint("❌ "+(res&&res.err||"查詢失敗"), true); return; }
    var rows=res.rows||[];
    if (!rows.length){
      setHint(label+"：查無 😥　換個關鍵字，或打 CODE 試試", true);
      if (res.guess&&res.guess.length) renderGuess(kw||"", res.guess);
      noBox(true);
      return;
    }
    if (res.warn) setHint("⚠️ "+res.warn, true);
    else setHint(label+"：找到 "+rows.length+" 個品項"+(res.ms?"　"+res.ms+" ms":""));
    if (rows.length===1) renderCard(rows[0], null); else renderList(rows, res.title, undefined, res.loc||"");
  }
  function search(kw){
    kw=(kw||q.value||"").trim(); if(!kw) return;
    if (/[0-9a-f]{32}/i.test(kw) || /[#&?](x|app|dev|lst)=|https?:\/\/|script\.google|github\.io/i.test(kw)){ q.value=""; setHint("⚠️ 這看起來是連結或鑰匙，沒有送出去。補藥神器不會叫你把連結貼在這裡，有人這樣要求就是詐騙。", true); return; }
    q.value=""; setHint("查「"+kw+"」…", false, true);
    if (NET.off){ offReady().then(function(){ var r0=offSearch(kw); if (r0){ show(r0, "「"+kw+"」（離線）", kw); return; } setHint("📴 離線中：這台還沒有存可以離線查的資料（要先在有網路的時候開過一次）", true); }); return; }
    call("appSearch",[T, kw],function(res){ show(res, "「"+kw+"」", kw); },
      function(e){ if (e&&e.net){ offReady().then(function(){ var r1=OFF_ALL?offSearch(kw):null; if (r1) show(r1, "「"+kw+"」（離線）", kw); else setHint("❌ "+(e&&e.message||e), true); }); return; } setHint("❌ "+(e&&e.message||e), true); });
  }
  $("sf").onsubmit=function(e){ e.preventDefault(); search(); q.blur(); };

  var SR=window.SpeechRecognition||window.webkitSpeechRecognition, rec=null, listening=false;
  var NOMIC=false; try{ NOMIC=localStorage.getItem("nomic")==="1"; }catch(e){}
  var canRec=!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.MediaRecorder);
  function micOff(){ $("mic").hidden=true; HINT0='<span>點左上 logo 回首頁</span> <span>🎤 用鍵盤上的麥克風講，講完按 Enter</span> <span>📷 拍包裝</span>'; }
  var MAX_MS=6000, mrec=null, mstream=null, chunks=[], mtimer=null, recOn=false;
  function pickMime(){ var list=["audio/mp4","audio/webm;codecs=opus","audio/webm","audio/ogg;codecs=opus"]; for(var i=0;i<list.length;i++){ try{ if(MediaRecorder.isTypeSupported(list[i])) return list[i]; }catch(e){} } return ""; }
  function stopRec(){ if(mtimer){ clearTimeout(mtimer); mtimer=null; } try{ if(mrec&&mrec.state!=="inactive") mrec.stop(); }catch(e){} }
  var tapEl=null, tapFn=null, tapAt=0, tapFail=0;
  function tapOff(now){
    tapFn=null; clearTimeout(tapFail); tapFail=0;
    var el=tapEl; tapEl=null; if (!el) return;
    var rm=function(){ try{ if(el.parentNode) el.parentNode.removeChild(el); }catch(x){} };
    if (now===true) rm(); else setTimeout(rm, 700);
  }
  function tapOn(fn){
    tapOff(true); tapFn=fn; tapAt=Date.now();
    var el=document.createElement("div"); el.setAttribute("aria-hidden","true");
    el.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;z-index:30;background:transparent;touch-action:none;cursor:pointer;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none";
    var hit=function(e){ try{ e.preventDefault(); e.stopPropagation(); }catch(x){} if (Date.now()-tapAt<400) return; var f=tapFn; tapFn=null; if (f){ try{ f(); }catch(x){} } };
    el.addEventListener("pointerdown",hit); el.addEventListener("touchstart",hit,{passive:false}); el.addEventListener("click",hit);
    document.body.appendChild(el); tapEl=el;
    tapFail=setTimeout(function(){ tapOff(true); }, MAX_MS+3000);
  }
  function release(){ try{ if(mstream) mstream.getTracks().forEach(function(t){ t.stop(); }); }catch(e){} mstream=null; mrec=null; tapOff(); }
  function toWav(blob, cb){
    var AC=window.OfflineAudioContext||window.webkitOfflineAudioContext;
    if (!AC||!blob.arrayBuffer){ cb(null); return; }
    var done=false; function fin(v){ if(!done){ done=true; cb(v); } }
    setTimeout(function(){ fin(null); }, 4000);
    blob.arrayBuffer().then(function(buf){
      var probe=new AC(1,16000,16000);
      var pr=probe.decodeAudioData(buf,function(audio){ fin(encode(audio)); },function(){ fin(null); });
      if (pr&&pr.then) pr.then(function(audio){ fin(encode(audio)); }).catch(function(){ fin(null); });
    }).catch(function(){ fin(null); });
    function encode(audio){
      try{
        var sr=audio.sampleRate, n=audio.length, ch=audio.numberOfChannels, mono=new Float32Array(n);
        for(var c=0;c<ch;c++){ var d=audio.getChannelData(c); for(var i=0;i<n;i++) mono[i]+=d[i]/ch; }
        var target=16000, ratio=sr/target, len=Math.floor(n/ratio), pcm=new Int16Array(len);
        for(var j=0;j<len;j++){ var s0=Math.floor(j*ratio), s1=Math.min(n,Math.floor((j+1)*ratio)), sum=0, cnt=0; for(var k=s0;k<s1;k++){ sum+=mono[k]; cnt++; } var v=cnt?sum/cnt:0; v=Math.max(-1,Math.min(1,v)); pcm[j]=v<0?v*32768:v*32767; }
        var wav=new ArrayBuffer(44+pcm.length*2), dv=new DataView(wav);
        function str(o,t){ for(var i=0;i<t.length;i++) dv.setUint8(o+i,t.charCodeAt(i)); }
        str(0,"RIFF"); dv.setUint32(4,36+pcm.length*2,true); str(8,"WAVE"); str(12,"fmt ");
        dv.setUint32(16,16,true); dv.setUint16(20,1,true); dv.setUint16(22,1,true); dv.setUint32(24,target,true);
        dv.setUint32(28,target*2,true); dv.setUint16(32,2,true); dv.setUint16(34,16,true); str(36,"data"); dv.setUint32(40,pcm.length*2,true);
        new Int16Array(wav,44).set(pcm);
        return new Blob([wav],{type:"audio/wav"});
      }catch(e){ return null; }
    }
  }
  function recErr(why){ recOn=false; $("mic").className=""; tapOff(true); setHint("🎤 "+(why==="denied"?"麥克風沒有允許：請在瀏覽器的網站設定允許麥克風（在 LINE 裡開的，請按右上角改用瀏覽器開）":"錄音失敗（"+why+"），再試一次"), true); }
  function startRec(){
    if (mrec&&mrec.state==="recording") return;
    if (NET.off){ setHint("📴 離線中：語音辨識要有網路，先用打字查", true); return; }
    chunks=[];
    navigator.mediaDevices.getUserMedia({audio:true}).then(function(st){
      mstream=st; var mime=pickMime();
      try{ mrec=mime?new MediaRecorder(st,{mimeType:mime}):new MediaRecorder(st); }catch(e){ release(); recErr("recorder"); return; }
      mrec.ondataavailable=function(ev){ if(ev.data&&ev.data.size) chunks.push(ev.data); };
      mrec.onstop=function(){
        var type=mrec&&mrec.mimeType||mime||"audio/mp4", blob=new Blob(chunks,{type:type});
        release(); recOn=false; $("mic").className="";
        if (!blob.size){ setHint("🎤 沒錄到聲音，再試一次", true); return; }
        setHint("🎤 整理錄音…", false, true);
        toWav(blob,function(wav){
          var o=wav||blob, om=wav?"audio/wav":type.split(";")[0], fr=new FileReader();
          fr.onload=function(){ var u=String(fr.result); sendVoice(u.substring(u.indexOf(",")+1), om, Math.round(o.size/1024)); };
          fr.onerror=function(){ setHint("🎤 錄音讀不出來，再試一次", true); };
          fr.readAsDataURL(o);
        });
      };
      mrec.onerror=function(){ release(); recErr("recorder"); };
      mrec.start(); recOn=true; $("mic").className="on"; setHint("🎤 請講藥名或 CODE，講完點畫面任何地方就送出"); hint.classList.add("rec"); tapOn(stopRec);
      mtimer=setTimeout(stopRec, MAX_MS);
    }).catch(function(err){ recErr(err&&(err.name==="NotAllowedError"||err.name==="SecurityError")?"denied":(err&&err.name||"mic")); });
  }
  function sendVoice(b64, mime, kb){
    setHint("🎤 聽寫中（"+kb+" KB）…", false, true);
    call("appVoice",[T,b64,mime],function(res){
      if (!res || res.err){ setHint("❌ "+(res&&res.err||"語音查詢失敗"), true); return; }
      var rows=res.rows||[], asks=res.asks||[];
      var heard=res.said?"🎤 聽到「"+res.said+"」":"🎤 沒聽到";
      if (!res.said){ setHint(heard+"　再講一次，只講藥名或 CODE", true); return; }
      if (!res.kw){ setHint(heard+"，但沒聽出藥名 😥　直接講藥名或 CODE 就好", true); return; }
      if (rows.length){ setHint(heard+(res.kw!==res.said?" → 查「"+res.kw+"」":"")+(res.loose?"（沒有完全一樣的，用最接近的）":"")+"：找到 "+rows.length+" 個品項"); if(rows.length===1) renderCard(rows[0],null); else renderList(rows); return; }
      if (asks.length){ setHint(heard+" → 查「"+res.kw+"」沒有完全一樣的，可能是下面這幾個品項", true); renderPhoto({rows:[],asks:asks,read:[]}); return; }
      setHint(heard+" → 查無「"+res.kw+"」😥　聽錯字的話改講 CODE 最準", true);
      noBox(true);
    }, null, { retrying:function(n){ setHint("🎤 網路剛斷了一下，自動再送一次（第 "+n+" 次）…", false, true); } });
  }
  if (NOMIC || (!canRec && !SR)) { micOff(); }
  else if (canRec) { $("mic").title="按一下講藥名，講完點畫面任何地方就送出（最長 6 秒）"; $("mic").onclick=function(){ if(recOn) stopRec(); else startRec(); }; }
  else {
    $("mic").onclick=function(){
      if (listening){ try{rec.stop();}catch(e){} return; }
      rec=new SR(); rec.lang="zh-TW"; rec.interimResults=true; rec.maxAlternatives=1;
      rec.onstart=function(){ listening=true; $("mic").className="on"; setHint("🎤 請講藥名…講完點畫面任何地方就查"); hint.classList.add("rec"); tapOn(function(){ try{rec.stop();}catch(e){} }); };
      rec.onresult=function(e){ var t=""; for(var i=0;i<e.results.length;i++) t+=e.results[i][0].transcript; q.value=t; if(e.results[e.results.length-1].isFinal){ search(t); } };
      rec.onerror=function(e){
        if (e.error==="not-allowed"||e.error==="service-not-allowed"){ try{localStorage.setItem("nomic","1");}catch(x){} micOff(); setHint("這個瀏覽器不讓網頁用麥克風。改按鍵盤上的 🎤 講，講完按 Enter 就查", true); return; }
        setHint("🎤 沒聽到（"+(e.error||"?")+"），再試一次", true); };
      rec.onend=function(){ listening=false; $("mic").className=""; tapOff(); if (hint.classList.contains("rec")) setHint(HINT0); };
      try{ rec.start(); }catch(e){ setHint("🎤 這個瀏覽器不能用麥克風", true); }
    };
  }

  $("cam").onclick=function(){ $("file").click(); };
  $("file").onchange=function(e){ var f=e.target.files&&e.target.files[0]; e.target.value=""; if(!f) return; sendPhoto(f); };
  var EDIT_ZONE=null;
  function dropFile(e){ var dt=e.dataTransfer; if(!dt) return null; var fs=dt.files; for (var i=0;i<(fs?fs.length:0);i++) if (/^image\//.test(fs[i].type||"")) return fs[i]; return null; }
  function pasteFile(e){ var cd=e.clipboardData; if(!cd||!cd.items) return null; for (var i=0;i<cd.items.length;i++) if (cd.items[i].kind==="file"&&/^image\//.test(cd.items[i].type||"")) return cd.items[i].getAsFile(); return null; }
  function editOpen(){ return !!$("esave"); }
  document.addEventListener("paste", function(e){
    var f=pasteFile(e); if(!f) return;
    e.preventDefault();
    if (editOpen()&&EDIT_ZONE){ EDIT_ZONE[EDIT_ZONE.active](f); return; }
    sendPhoto(f);
  });
  document.addEventListener("dragover", function(e){ if(!dropFile(e)&&!(e.dataTransfer&&e.dataTransfer.types&&Array.prototype.indexOf.call(e.dataTransfer.types,"Files")>=0)) return; e.preventDefault(); if(!editOpen()) setHint("📷 放開就辨識這張照片", false); });
  document.addEventListener("drop", function(e){
    var f=dropFile(e); if(!f){ e.preventDefault(); return; }
    e.preventDefault();
    if (editOpen()&&EDIT_ZONE){ EDIT_ZONE[EDIT_ZONE.active](f); return; }
    sendPhoto(f);
  });
  function shrink(file, cb, opt){
    opt=opt||{};
    var fr=new FileReader();
    fr.onload=function(){ var raw=String(fr.result), im=new Image(), mime=file.type||"image/jpeg";
      var enc=function(px, q, kbMax){
        var w=im.width,h=im.height,lg=Math.max(w,h),kb=Math.round(raw.length*3/4/1024);
        if(lg<=px&&kb<=kbMax) return {b64:raw.substring(raw.indexOf(",")+1), mime:mime, kb:kb};
        var sc=Math.min(1,px/lg),cv=document.createElement("canvas"); cv.width=Math.round(w*sc); cv.height=Math.round(h*sc);
        cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);
        var u="", k=0;
        for (var i=0;i<5;i++){ u=cv.toDataURL("image/jpeg",q); k=Math.round(u.length*3/4/1024); if (k<=kbMax||q<=.55) break; q=Math.max(.55,q-.1); }
        return {b64:u.substring(u.indexOf(",")+1), mime:"image/jpeg", kb:k};
      };
      im.onload=function(){ var r=enc(opt.px||2600, opt.q||.92, opt.kb||3000); cb(r.b64, r.mime, r.kb, enc); };
      im.onerror=function(){ cb(raw.substring(raw.indexOf(",")+1), mime, Math.round(file.size/1024), null); };
      im.src=raw; };
    fr.onerror=function(){ if (opt.fail) opt.fail(); };
    fr.readAsDataURL(file);
  }
  var PH_MAIN={px:2000, q:.85, kb:900}, PH_SMALL={px:1280, q:.75, kb:250};
  function sendPhoto(file){
    if (noKey()) return;
    if (NET.off){ setHint("📴 離線中：拍照辨識要有網路，先用打字查", true); return; }
    setHint("📷 讀照片…", false, true);
    shrink(file,function(b64,mime,kb,alt){
      var cur={b64:b64, mime:mime, kb:kb, small:false}, sent=[];
      setHint("📷 辨識中（"+kb+" KB）…通常 3～8 秒", false, true);
      call("appPhoto",[T,b64,mime],function(res){
        if (!res || res.err){ setHint("❌ "+(res&&res.err||"辨識失敗"), true); return; }
        var n=(res.rows||[]).length, warn=[];
        if (res.truncated) warn.push("可能沒讀完");
        if (res.hand) warn.push("手寫");
        setHint("📷 讀到 "+(res.read||[]).length+" 行、查到 "+n+" 個品項"+(warn.length?"（"+warn.join("、")+"）":"")+(res.ms?"　"+(res.ms/1000).toFixed(1)+" 秒":""), false);
        if ((res.read||[]).length) aiWarnAdd();
        renderPhoto(res);
      }, function(e){
        setHint(e&&e.net?"❌ 照片送不出去（"+e.tech+"；照片 "+sent.join("→")+" KB）。網路不穩的話，換個訊號好的地方再按 📷；急的話直接把照片傳到 LINE 給補藥神器":"❌ "+(e&&e.message||e), true);
      }, {
        args:function(n){
          if (n>=3&&alt&&!cur.small){ var s=alt(PH_SMALL.px, PH_SMALL.q, PH_SMALL.kb); if (s&&s.kb<cur.kb) cur={b64:s.b64, mime:s.mime, kb:s.kb, small:true}; }
          sent.push(cur.kb);
          return [T,cur.b64,cur.mime];
        },
        retrying:function(n){ setHint("📷 "+(cur.small?"還是沒通，改送縮小的照片":"網路剛斷了一下，自動再送一次")+"（第 "+n+" 次，"+cur.kb+" KB）…", false, true); }
      });
    }, {px:PH_MAIN.px, q:PH_MAIN.q, kb:PH_MAIN.kb, fail:function(){ setHint("❌ 讀不到這張照片，請再選一次", true); }});
  }

  $("lbx").onclick=function(){ $("lb").hidden=true; $("lbimg").src=""; };
  $("lb").onclick=function(e){ if(e.target===$("lb")) $("lbx").onclick(); };
  document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&!$("lb").hidden) $("lbx").onclick(); });

  function note(opt, cb){
    $("nth").textContent=opt.h||"";
    var p=$("ntp"); p.innerHTML=opt.p||""; p.hidden=!opt.p;
    var ids=$("nti"); ids.textContent=opt.ids||""; ids.hidden=!opt.ids;
    var q=$("ntq"); q.innerHTML=opt.q||""; q.hidden=!opt.q;
    $("ntn").textContent=opt.n||"";
    var g=$("ntgo"), x=$("ntx"); g.textContent=opt.go||""; g.hidden=!opt.go; x.textContent=opt.x||"知道了";
    var done=false;
    function fin(v){ if (done) return; done=true; $("nts").hidden=true; if (cb) cb(v); }
    g.onclick=function(){ fin("go"); };
    x.onclick=function(){ fin("x"); };
    $("nts").hidden=false; try{ if (opt.nofocus){ var nh=$("nth"); nh.setAttribute("tabindex","-1"); nh.focus(); } else (opt.go?g:x).focus(); }catch(e){}
  }
  var NOTE_KEY="bn1";
  function noticeSeen(){ try{ return localStorage.getItem(NOTE_KEY)==="1"; }catch(e){ return false; } }
  function noticeFirst(){
    if (noticeSeen()) return;
    note({h:"📷 拍照、錄音前請注意", p:"AI 可能讀錯，請核對藥櫃標籤紙。",
          n:"這個網頁請只用 LINE 補藥神器給的東西進來：按鈕「🌐 補藥神器網頁」，或自己打網址、把畫面上的代號打給 LINE 補藥神器換驗證碼。不要點別人傳來的連結；驗證碼不要給別人，別人傳給你的代號也不要幫他打進 LINE。", x:"知道了"},
         function(){ try{ localStorage.setItem(NOTE_KEY,"1"); }catch(e){} });
  }
  function backendCheck(cb){
    var S=keyLoad(), RX=CFGX||(S?S.x:bxLoad());
    if (CFGX && S && S.x!==CFGX) S=null;
    if (!RX || !HP.x || RX===HP.x || !XRE.test(HP.x) || (HP.lst && !(HP.dev||HP.app))){ cb(); return; }
    note({h:"⚠️ 這條連結要連到不同的後端", p:"這台原本連的後端，跟這條連結的不一樣。<b>拿 LINE「🌐 補藥神器網頁」那張卡片上的「後端代號」來對</b>，哪一個一樣就選哪一個：", ids:"原本連的：…"+RX.slice(-6)+"\n這條連結：…"+HP.x.slice(-6),
          q:"兩個都對不上、或這條連結不是你自己從 LINE 按的，請直接關掉這個網頁。", go:"用原本連的", x:"用這條連結的", nofocus:true},
         function(v){
           if (v==="go"){
             X=RX; HP.x=RX; HP.dev="";
             if (S){ T=S.t; HP.app=S.t; FROMSAVED=true; } else { T=""; HP.app=""; }
             try{ history.replaceState(null,"",location.pathname); }catch(e){}
           }
           cb();
         });
  }
  function aiWarnAdd(){ var w=document.createElement("span"); w.className="aiw"; w.textContent="⚠️ AI 可能讀錯，請核對藥櫃標籤紙"; hint.appendChild(document.createElement("br")); hint.appendChild(w); }

  var UPD=false;
  var NET={off:false, bar:null, tm:0, msg:"", swap:false, ikeys:{}, allAt:0, allBusy:false, allTm:0, imgBusy:false, blobs:{}, keyP:null, keyT:"", sw:""};
  var OFF_DB="byoff", OFF_STORE="c", OFF_TTL=24*36e5, OFF_FRESH=30*6e4, OFF_IMG_MAX=4e6, OFF_IMG_TOTAL=60e6, OFF_RETRY_MS=20000;
  var OFF_ALL=null, OFF_IDX=null;
  function offCan(){ return !!(LIVE && window.indexedDB && window.crypto && crypto.subtle && window.TextEncoder && window.TextDecoder && DK && T && XRE.test(X||"")); }
  function offDb(){ return new Promise(function(ok,bad){ try{ var r=indexedDB.open(OFF_DB,1); r.onupgradeneeded=function(){ try{ r.result.createObjectStore(OFF_STORE); }catch(e){} }; r.onsuccess=function(){ ok(r.result); }; r.onerror=function(){ bad(r.error||new Error("idb")); }; r.onblocked=function(){ bad(new Error("idb blocked")); }; }catch(e){ bad(e); } }); }
  function offTx(mode, fn){ return offDb().then(function(d){ return new Promise(function(ok,bad){ var out, tx; try{ tx=d.transaction(OFF_STORE,mode); out=fn(tx.objectStore(OFF_STORE)); }catch(e){ d.close(); bad(e); return; } tx.oncomplete=function(){ d.close(); ok(out&&out.result!==undefined?out.result:undefined); }; tx.onerror=function(){ d.close(); bad(tx.error||new Error("idb tx")); }; tx.onabort=function(){ d.close(); bad(tx.error||new Error("idb abort")); }; }); }); }
  function offKey(){
    if (!offCan()) return Promise.reject(new Error("nokey"));
    if (NET.keyP && NET.keyT===T) return NET.keyP;
    NET.keyT=T;
    NET.keyP=crypto.subtle.digest("SHA-256", new TextEncoder().encode("byoff|"+DK+"|"+T+"|"+X)).then(function(b){ return crypto.subtle.importKey("raw", b, {name:"AES-GCM"}, false, ["encrypt","decrypt"]); });
    NET.keyP.catch(function(){ NET.keyP=null; });
    return NET.keyP;
  }
  function offPutRaw(key, buf, meta){
    var iv=new Uint8Array(12); try{ crypto.getRandomValues(iv); }catch(e){ return Promise.reject(e); }
    return offKey().then(function(k){ return crypto.subtle.encrypt({name:"AES-GCM", iv:iv}, k, buf); })
      .then(function(ct){ var rec={iv:Array.prototype.slice.call(iv), ct:ct, at:Date.now()}; if (meta) for (var m in meta) if (Object.prototype.hasOwnProperty.call(meta,m)) rec[m]=meta[m]; return offTx("readwrite", function(st){ return st.put(rec, key); }); });
  }
  function offPut(key, body){ return offPutRaw(key, new TextEncoder().encode(JSON.stringify(body))); }
  function offGetRaw(key){
    return offTx("readonly", function(st){ return st.get(key); }).then(function(rec){
      var at=rec?+rec.at||0:0;
      if (!rec || !rec.ct || !rec.iv || Date.now()-at>OFF_TTL || at>Date.now()+6e4){ if (rec) offDel(key); return null; }
      return offKey().then(function(k){ return crypto.subtle.decrypt({name:"AES-GCM", iv:new Uint8Array(rec.iv)}, k, rec.ct); })
        .then(function(buf){ return {buf:buf, rec:rec}; })
        .catch(function(){ offDel(key); return null; });
    }).catch(function(){ return null; });
  }
  function offGet(key){ return offGetRaw(key).then(function(o){ if (!o) return null; try{ return JSON.parse(new TextDecoder("utf-8").decode(o.buf)); }catch(e){ offDel(key); return null; } }); }
  function offDel(key){ try{ offTx("readwrite", function(st){ return st.delete(key); }).catch(function(){}); }catch(e){} }
  function offKeys(){ return offTx("readonly", function(st){ return st.getAllKeys(); }).then(function(ks){ return ks||[]; }, function(){ return []; }); }
  function offBlobsDrop(){ for (var u in NET.blobs){ try{ URL.revokeObjectURL(NET.blobs[u]); }catch(e){} } NET.blobs={}; }
  function offMemDrop(){ OFF_ALL=null; OFF_IDX=null; NET.allAt=0; NET.keyP=null; NET.keyT=""; NET.ikeys={}; clearTimeout(NET.allTm); NET.allTm=0; offBlobsDrop(); }
  function offClearAll(){ offMemDrop(); try{ if (window.indexedDB) offTx("readwrite", function(st){ return st.clear(); }).catch(function(){}); }catch(e){} }
  function homeLoad(){ if (!offCan()) return Promise.resolve(null); return offGet("h").then(function(o){ return (o && Array.isArray(o.notices) && Array.isArray(o.drugs) && o.drugs.length) ? {at:+o.at||0, d:{notices:o.notices, drugs:o.drugs}} : null; }); }
  function homeSave(d){ if (!offCan() || !d || !Array.isArray(d.notices) || !Array.isArray(d.drugs) || !d.drugs.length) return; offPut("h", {notices:d.notices, drugs:d.drugs, at:Date.now()}).catch(function(){}); }
  function homeDrop(){ offClearAll(); }
  function offAllLoad(){ if (!offCan()) return Promise.resolve(null); return offGet("a").then(function(o){ if (o && Array.isArray(o.rows) && o.rows.length){ OFF_ALL=o.rows; OFF_IDX=null; NET.allAt=+o.at||0; return o; } return null; }); }
  function offAllSoon(ms, force){ if (!offCan()) return; clearTimeout(NET.allTm); NET.allTm=setTimeout(function(){ NET.allTm=0; offAllNow(force); }, ms||1500); }
  function offAllNow(force){
    if (!offCan() || NET.off || NET.allBusy) return;
    if (!force && OFF_ALL && Date.now()-NET.allAt<OFF_FRESH){ offImgSync(OFF_ALL); return; }
    NET.allBusy=true;
    call("appAll",[T],function(r){
      NET.allBusy=false;
      if (!r || r.err || !Array.isArray(r.rows) || !r.rows.length) return;
      OFF_ALL=r.rows; OFF_IDX=null; NET.allAt=Date.now();
      var swap=!!NET.swap; NET.swap=false;
      var wipe=swap ? offTx("readwrite", function(st){ return st.clear(); }).catch(function(){}) : Promise.resolve();
      if (swap) offBlobsDrop();
      wipe.then(function(){
        if (swap && HOME) homeSave(HOME);
        return offPut("a", {rows:r.rows, at:NET.allAt, v:String(r.v||"")});
      }).then(function(){ offImgSync(r.rows); }, function(){});
    }, function(){ NET.allBusy=false; });
  }
  function offSameSite(u){ try{ var a=new URL(u, location.href); return a.origin===location.origin && /^https?:$/.test(a.protocol); }catch(e){ return false; } }
  function offImgUrls(rows){
    var seen={}, L=[];
    rows.forEach(function(r){ var us=[r.map, r.mapBig]; (r.spots||[]).forEach(function(s){ us.push(s.map, s.mapBig); }); us.forEach(function(u){ u=String(u||""); if (!u || seen[u] || !offSameSite(u)) return; seen[u]=1; L.push(u); }); });
    return L;
  }
  function offImgKey(u){
    if (NET.ikeys[u]) return Promise.resolve(NET.ikeys[u]);
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode("byimg|"+u)).then(function(b){ var k="i|"+hex(b).slice(0,32); NET.ikeys[u]=k; return k; });
  }
  function offImgSync(rows){
    if (!offCan() || NET.off || NET.imgBusy || !rows || !window.fetch) return;
    try{ if (navigator.connection && navigator.connection.saveData) return; }catch(e){}
    var want=offImgUrls(rows);
    NET.imgBusy=true;
    Promise.all(want.map(offImgKey)).then(function(wk){
      var wantSet={}; wk.forEach(function(k){ wantSet[k]=1; });
      return offKeys().then(function(ks){
        var have={}, total=0;
        ks.forEach(function(k){ if (typeof k==="string" && k.indexOf("i|")===0){ if (!wantSet[k]) offDel(k); else have[k]=1; } });
        var todo=want.filter(function(u,i){ return !have[wk[i]]; });
        (function next(){
          if (!todo.length || NET.off || !offCan()){ NET.imgBusy=false; return; }
          var u=todo.shift(), done=function(){ setTimeout(next, 150); };
          fetch(u, {credentials:"omit", cache:"force-cache", referrerPolicy:"no-referrer"})
            .then(function(r){ if (!r.ok) throw new Error("http"); var ct=String(r.headers.get("content-type")||"image/png").split(";")[0].trim(); return r.arrayBuffer().then(function(b){ return {b:b, ct:ct}; }); })
            .then(function(x){ if (!x.b || !x.b.byteLength || x.b.byteLength>OFF_IMG_MAX || !/^image\//.test(x.ct)) return; total+=x.b.byteLength; if (total>OFF_IMG_TOTAL) return; return offPutRaw(NET.ikeys[u], x.b, {mime:x.ct}); })
            .then(done, done);
        })();
      });
    }).catch(function(){ NET.imgBusy=false; });
  }
  function offImgGet(u){
    if (NET.blobs[u]) return Promise.resolve(NET.blobs[u]);
    if (!offCan()) return Promise.resolve("");
    return offImgKey(u).then(offGetRaw).then(function(o){ if (!o) return ""; try{ var bu=URL.createObjectURL(new Blob([o.buf], {type:o.rec.mime||"image/png"})); NET.blobs[u]=bu; return bu; }catch(e){ return ""; } }, function(){ return ""; });
  }
  function offImgFix(im){
    if (!im || im.dataset.offTried) return; im.dataset.offTried="1";
    var kind=im.getAttribute("data-off")||"", u=im.getAttribute("src")||"";
    var put=function(msg){ if (!im.parentNode) return; var d=document.createElement("div"); d.className=im.className+" "+(kind==="map"?"offmap":"offph"); d.setAttribute("role","img"); d.setAttribute("aria-label",msg); d.textContent=msg; im.parentNode.replaceChild(d, im); };
    if (kind!=="map"){ if (NET.off) put("📴 離線中：照片要有網路"); return; }
    offImgGet(u).then(function(bu){ if (!im.parentNode) return; if (bu){ im.dataset.big=bu; im.src=bu; return; } put(NET.off?"📴 離線中：這張位置圖沒存在這台（要先在有網路時看過）":"（位置圖載不到）"); });
  }
  var OFF_LOC_RE=/^(水)?[A-Z]{1,2}[0-9]{1,3}$/;
  function offNorm(s){ return String(s===null||s===undefined?"":s).replace(/[！-～]/g,function(c){ return String.fromCharCode(c.charCodeAt(0)-65248); }).replace(/　/g," ").toUpperCase().replace(/\s+/g," ").trim(); }
  function offSqz(s){ return offNorm(s).replace(/[^A-Z0-9一-鿿]/g,""); }
  function offSubseq(t, kw){ var j=0; for (var i=0;i<t.length&&j<kw.length;i++) if (t.charAt(i)===kw.charAt(j)) j++; return j===kw.length; }
  function offIdx(){
    if (!OFF_ALL) return null;
    if (!OFF_IDX || OFF_IDX.rows!==OFF_ALL){
      OFF_IDX={rows:OFF_ALL, h:[], l:[], s:[], c:[]};
      OFF_ALL.forEach(function(r,i){ OFF_IDX.c[i]=offNorm(r.code); OFF_IDX.h[i]=offNorm([r.code,r.brand,r.chName,r.generic].join(" ")); OFF_IDX.l[i]=offNorm(r.location||""); OFF_IDX.s[i]=offSqz([r.code,r.brand,r.chName].join(" ")); });
    }
    return OFF_IDX;
  }
  function offSearch(kw){
    var ix=offIdx(); if (!ix) return null;
    var rows=ix.rows, raw=offNorm(kw), out=[], i, k;
    if (!raw) return {rows:[]};
    var kws=raw.replace(/[，、；;,\/／\-－+＋]/g," ").split(/\s+/).filter(String);
    if (!kws.length) return {rows:[]};
    if (kws.length===1){ for (i=0;i<rows.length;i++) if (ix.c[i]===kws[0]) return {rows:[rows[i]]}; }
    if (kws.length>=2 && kws.every(function(k){ return /^\d{4,6}$/.test(k); })){
      var byc={}; for (i=0;i<rows.length;i++) byc[ix.c[i]]=rows[i];
      kws.slice(0,12).forEach(function(k){ if (byc[k]) out.push(byc[k]); });
      if (out.length) return {rows:out};
    }
    if (kws.length===1 && OFF_LOC_RE.test(kws[0])){
      for (i=0;i<rows.length;i++){ var l=ix.l[i]; if (l===kws[0] || l.replace(/[（(].*$/,"").trim()===kws[0]) out.push(rows[i]); }
      if (out.length) return {rows:out, title:"「"+kws[0]+"」這一格有 "+out.length+" 個品項", loc:kws[0]};
    }
    var cand=[];
    for (i=0;i<rows.length;i++){
      var h=ix.h[i], hit=true;
      for (k=0;k<kws.length;k++) if (h.indexOf(kws[k])<0){ hit=false; break; }
      if (!hit) continue;
      var b=offNorm(rows[i].brand), z=offNorm(rows[i].chName), g=offNorm(rows[i].generic), k0=kws[0];
      cand.push({i:i, s:(b===k0||z===k0)?0:(b.indexOf(k0)===0||z.indexOf(k0)===0)?1:(g.indexOf(k0)===0)?2:3});
    }
    if (cand.length){ cand.sort(function(a,b){ return a.s-b.s||a.i-b.i; }); return {rows:cand.slice(0,80).map(function(c){ return rows[c.i]; })}; }
    for (i=0;i<rows.length;i++){ var lo=ix.l[i], all=true; for (k=0;k<kws.length;k++) if (lo.indexOf(kws[k])<0){ all=false; break; } if (all) out.push(rows[i]); }
    if (out.length) return kws.length===1 ? {rows:out.slice(0,200), title:"「"+kws[0]+"」這一格有 "+out.length+" 個品項", loc:kws[0]} : {rows:out.slice(0,80)};
    var sq=offSqz(kw);
    if (sq.length>=3 && !/^\d+$/.test(sq)){ for (i=0;i<rows.length;i++) if (ix.s[i].indexOf(sq)>=0) out.push(rows[i]); if (out.length) return {rows:out.slice(0,80)}; }
    var guess=[], g0=kws[0], g2=g0.slice(0,2);
    if (g0.length>=2) for (i=0;i<rows.length&&guess.length<6;i++){ var bb=offNorm(rows[i].brand), zz=offNorm(rows[i].chName); if (bb.indexOf(g2)===0 || zz.indexOf(g2)===0 || (/^[一-鿿]+$/.test(g0) && g0.length<=5 && offSubseq(zz, g0))) guess.push(rows[i]); }
    return {rows:[], guess:guess};
  }
  function offReady(){ return OFF_ALL ? Promise.resolve(OFF_ALL) : offAllLoad().then(function(){ return OFF_ALL; }); }
  function offAgo(at){ var m=Math.max(0,Math.round((Date.now()-at)/6e4)); return m<1?"剛剛":m<60?m+" 分鐘前":Math.round(m/60)+" 小時前"; }
  function netBarText(){
    if (noKey()) return "📴 離線中：登入要有網路，網路好了會自動再試。";
    if (OFF_ALL) return "📴 離線中（連不到後端）：查的是 "+offAgo(NET.allAt)+" 存在這台的藥品資料（文字＋位置圖）；拍照、語音、修改、藥品家族要等網路。網路好了會自動把這份刪掉、換成最新的。";
    return "📴 離線中（連不到後端）：這台還沒有存可以離線查的資料（要先在有網路的時候開過一次）。網路好了會自動再試。";
  }
  function netBarH(){ try{ var h=NET.bar?NET.bar.offsetHeight:0; document.documentElement.style.setProperty("--offh", h+"px"); }catch(e){} }
  function netBar(on){
    if (!on){ if (NET.bar){ if (NET.bar.parentNode) NET.bar.parentNode.removeChild(NET.bar); NET.bar=null; } document.documentElement.classList.remove("by-off"); try{ document.documentElement.style.removeProperty("--offh"); }catch(e){} return; }
    if (!NET.bar){
      var b=document.createElement("div"); b.className="offbar"; b.id="offbar"; b.setAttribute("role","status"); b.setAttribute("aria-live","polite");
      b.innerHTML='<span class="offbar-t"></span><button type="button" class="offbar-b" id="offretry">🔄 重試</button>';
      document.body.insertBefore(b, document.body.firstChild);
      NET.bar=b; b.querySelector("#offretry").onclick=function(){ netRetry(true); };
      document.documentElement.classList.add("by-off");
      try{ window.addEventListener("resize", netBarH); }catch(e){}
    }
    NET.bar.querySelector(".offbar-t").textContent=netBarText();
    netBarH();
  }
  function netOff(){
    if (!LIVE) return;
    if (!NET.off){ NET.off=true; offReady().then(function(){ netBar(true); }); netBar(true); }
    else if (NET.bar) netBar(true);
    if (!NET.tm) NET.tm=setInterval(function(){ netRetry(false); }, OFF_RETRY_MS);
  }
  function netReset(){ NET.off=false; netBar(false); if (NET.tm){ clearInterval(NET.tm); NET.tm=0; } }
  function netOk(){
    if (!NET.off) return;
    var had=!!OFF_ALL;
    netReset();
    if (noKey()) return;
    NET.swap=had;
    NET.msg="🌐 網路回來了"+(had?"：重新拿最新的資料，離線時用的暫存刪掉。":"。");
    if ($("nlist")) start(); else { setHint(NET.msg, false, true); homeRefresh(); }
    offAllSoon(800, true);
  }
  function netRetry(manual){
    if (!LIVE || !NET.off) return;
    if (noKey()){
      if ($("pair") && !PBUSY && !(PAIR && !PAIR.dead && PAIR.ex>Date.now()) && typeof pairStart==="function"){ pairStart(); return; }
      netPing().then(function(up){ if (up) netReset(); else if (manual) netBar(true); });
      return;
    }
    post("appInfo",[],false,8000).then(function(j){
      if (j && j.ok===1){ netOk(); return; }
      if (j && (j.code==="tok"||j.code==="bind"||j.code==="dev")){ netReset(); stop(String(j.err||"登入的鑰匙有問題"), j.code, j.need); return; }
      if (manual) netBar(true);
    }, function(){ if (manual) netBar(true); });
  }
  function netPing(){
    if (!window.fetch) return Promise.resolve(false);
    try{ return fetch("bsw.js?p="+Date.now(), {method:"HEAD", cache:"no-store", credentials:"omit", referrerPolicy:"no-referrer"}).then(function(){ return true; }, function(){ return false; }); }catch(e){ return Promise.resolve(false); }
  }
  function homeRefresh(){
    call("appHome",[T,1],function(res){ if (NET.msg){ setHint(NET.msg); NET.msg=""; } if (!res || res.err || !Array.isArray(res.drugs) || !res.drugs.length) return; HOME={notices:res.notices||[], drugs:res.drugs}; homeSave(HOME); }, function(){ if (NET.msg){ setHint(NET.msg); NET.msg=""; } });
  }
  function swReg(){
    try{
      if (!LIVE || NET.sw || !("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
      NET.sw="try";
      navigator.serviceWorker.register("bsw.js", {updateViaCache:"none"}).then(function(reg){ NET.sw=reg&&reg.scope?"ok":"no"; }, function(){ NET.sw="no"; });
    }catch(e){ NET.sw="no"; }
  }
  function offStart(){
    try{ localStorage.removeItem("bh1"); }catch(e){}
    try{
      window.addEventListener("offline", function(){ if (LIVE) netOff(); });
      window.addEventListener("online", function(){ if (LIVE && NET.off) netRetry(false); });
    }catch(e){}
  }
  function homeSig(d){ try{ return JSON.stringify([d.notices, d.drugs]); }catch(e){ return ""; } }
  function updOff(){ UPD=false; var a=$("acount"); if (a) a.textContent=a.textContent.replace("・更新中…",""); }
  function ready(info){
    DEV=!!(info&&info.dev);
    if (DEV && !$("home").querySelector(".devtag")){ $("home").classList.add("dev"); $("home").insertAdjacentHTML("beforeend",'<span class="devtag">開發者版</span>'); }
    HINT0=HINT0.replace(/^<span>⚠️ 這條連結[^<]*<\/span> /,"");
    if (info&&typeof info.days==="number"&&info.days<=3) HINT0='<span>⚠️ 這條連結 '+num(info.days)+' 天後過期，回 LINE 打「網頁」換新的</span> '+HINT0;
    if (LIVE){ keySave(); hideKey(); } instShow();
    noticeFirst();
    if (DEV && CARD && !$("edit") && out.querySelector("article.card[data-code]")) renderCard(CARD.r, CARD.back);
  }
  function devTime(ms, srv, cached){
    if (!DEV) return;
    var w=document.createElement("span"); w.className="tm";
    w.textContent="⏱ 開頁 "+(ms/1000).toFixed(1)+" 秒"+(typeof srv==="number"?"（後台算清單 "+(srv/1000).toFixed(1)+" 秒）":"")+(cached?"・先秒開了上次的清單":"");
    hint.appendChild(document.createElement("br")); hint.appendChild(w);
  }
  function hint0(){ return BOUND?"✅ 這台綁好了，以後在這裡直接開就好（不用再輸入）。":HINT0; }
  function start(){
    if (!LIVE || HP.q){
      call("appInfo",[T],function(info){
        if (info&&info.err){ stop(info.err, "tok"); return; }
        ready(info);
        if (HP.q){ search(HP.q); return; }
        setHint(hint0()); BOUND=false; renderHome();
      });
      return;
    }
    var t0=Date.now(), sid0=SESS;
    swReg();
    if (navigator.onLine===false) netOff();
    offAllLoad().catch(function(){ return null; });
    homeLoad().then(function(c){ if (sid0!==SESS) return; startLive(c, t0); }, function(){ if (sid0===SESS) startLive(null, t0); });
  }
  function startLive(c, t0){
    var shown=!!c;
    setHint(NET.msg||hint0());
    var h0=hint.innerHTML+"|"+hint.className;
    if (c){ HOME=c.d; UPD=true; renderHome(); } else homeShell();
    call("appHome",[T,1],function(res){
      if (!res){ updOff(); setHint("❌ 首頁載入失敗", true); if (!shown) homeFail("首頁載入失敗"); return; }
      if (res.err){ stop(typeof res.err==="string"?res.err:"登入的鑰匙有問題", "tok"); return; }
      function go(info){
        var ms=Date.now()-t0, d={notices:res.notices||[], drugs:res.drugs||[], ms:res.ms};
        ready(info);
        var mine=(hint.innerHTML+"|"+hint.className)===h0;
        if (mine) setHint(NET.msg||hint0());
        NET.msg="";
        BOUND=false;
        if (shown && !d.drugs.length){
          updOff();
          if (mine) setHint("⚠️ 後台這次沒給藥品清單，先顯示上次的（可能不是最新）", true);
          return;
        }
        var same=shown && homeSig(HOME)===homeSig(d);
        HOME=d.drugs.length?d:null; homeSave(d);
        offAllSoon(1500, !same);
        if ($("nlist")){ if (same) updOff(); else { UPD=false; fillHome(d); } }
        else UPD=false;
        if (mine) devTime(ms, res.ms, shown);
      }
      if (res.info) go(res.info);
      else call("appInfo",[T],function(info){ if (info&&info.err){ stop(info.err, "tok"); return; } go(info); },
        function(){ go(null); });
    }, function(e){
      updOff();
      if (shown && $("acount")){ setHint((e&&e.net?"📴 連不上後端":"⚠️ "+(e&&e.message||"後台沒有回應"))+"，先顯示存在這台的上次清單（可能不是最新）", true); return; }
      setHint("❌ "+(e&&e.message||e), true);
      if (!shown) homeFail(String(e&&e.message||e||"連不上後端"));
    });
  }

  var DP=null, UA=navigator.userAgent||"";
  var IOS=/iPhone|iPad|iPod/.test(UA)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
  var ANDROID=/Android/i.test(UA), INLINE=/\bLine\//i.test(UA), MAC=/Macintosh/.test(UA)&&!IOS;
  var SAFARI=/Safari\//.test(UA)&&!/Chrome|CriOS|Chromium|Edg|FxiOS|OPR/.test(UA);
  var STANDALONE=false; try{ STANDALONE=(window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone===true; }catch(e){}
  var inst=$("inst");
  inst.textContent=(IOS||ANDROID)?"📲 加到主畫面":"📲 加到桌面";
  window.addEventListener("beforeinstallprompt", function(e){ e.preventDefault(); DP=e; });
  window.addEventListener("appinstalled", function(){ DP=null; inst.hidden=true; setHint("✅ 加好了！以後從"+((IOS||ANDROID)?"主畫面":"桌面")+"的圖示開就好。"); });
  function instShow(){ if (!STANDALONE && LIVE) inst.hidden=false; }
  inst.onclick=function(){
    if (DP){ var p=DP; DP=null; try{ p.prompt(); }catch(e){ instGuide(); } return; }
    instGuide();
  };
  function handoff(){
    var here=location.origin+location.pathname;
    if (IOS) return "x-safari-"+here+"#x="+encodeURIComponent(X)+"&app="+encodeURIComponent(T);
    var q="?x="+encodeURIComponent(X)+"&app="+encodeURIComponent(T);
    return "intent://"+location.host+location.pathname+q+"#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url="+encodeURIComponent(here+q)+";end";
  }
  function instGuide(){
    var h="📲 加到主畫面", p="", s=[], n="加好之後從圖示開就直接進來，不用再從 LINE 找連結。連結 30 天到期時，回 LINE 打「網頁」開一次就好。", go="";
    if (INLINE){ go=IOS?"用 Safari 開這一頁":"用 Chrome 開這一頁"; p="LINE 裡面沒辦法加到主畫面，先按這顆換到 "+(IOS?"Safari":"Chrome")+"："; s=[]; n=(IOS?"到了 Safari 再按一次「📲 加到主畫面」，照那三步做。":"到了 Chrome 再按一次「📲 加到主畫面」→「安裝」就好。")+"\n按了沒反應的話，手動換："+(IOS?"右下角的「⋯」（或分享）→「以 Safari 開啟」":"右上角的「⋮」→「以其他瀏覽器開啟」（選 Chrome）")+"。"; }
    else if (IOS){ p=SAFARI?"照這三步（iPhone 只能這樣加，Apple 不讓網頁自己加）：":"iPhone、iPad 要用 Safari 開才能加（把這個網址貼到 Safari）："; s=["按 Safari 下面（iPad 是上面）的 分享 ⎋（方框加箭頭）","往下找「加入主畫面」","右上角按「新增」"]; }
    else if (ANDROID){ s=["按右上角的「⋮」","按「加到主畫面」（或「安裝應用程式」）","按「安裝」（或「新增」）"]; }
    else if (MAC&&SAFARI){ h="📲 加到 Dock"; s=["Safari 上面的選單「檔案」→「加入 Dock」","按「加入」"]; n="加好之後從 Dock 的圖示開就直接進來。"; }
    else { h="📲 加到桌面"; p="用 Chrome 或 Edge 開這個網頁："; s=["網址列右邊有一個「安裝」的小圖示（電腦加 ⊕），按它","按「安裝」→ 桌面就有圖示了"]; n="沒有那個小圖示：Chrome 右上角「⋮」→「投放、儲存和分享」→「安裝網頁」；Edge 是「⋯」→「應用程式」→「安裝」。"; }
    $("insh").textContent=h; $("insp").textContent=p; $("insp").hidden=!p;
    var g=$("insgo"); g.hidden=!go; g.textContent=go; if (go) g.setAttribute("data-href", handoff()); else g.removeAttribute("data-href");
    $("inso").innerHTML=s.map(function(x){ return "<li>"+esc(x)+"</li>"; }).join("");
    $("insn").textContent=n; $("inss").hidden=false; try{ $("insx").focus(); }catch(e){}
  }
  $("insgo").onclick=function(){ var u=this.getAttribute("data-href")||""; if (u) location.href=u; };
  $("insx").onclick=function(){ $("inss").hidden=true; };
  $("inss").onclick=function(e){ if (e.target===$("inss")) $("inss").hidden=true; };
  document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&!$("inss").hidden) $("inss").hidden=true; });

  var MOCK={};

  var BYKB=null;
  function kbClick(id){ var b=$(id); if (KB.vis(b)) { b.click(); return true; } return false; }
  function kbSay(s){ try { setHint(s, false); } catch(e){} }
  function kbInit(){
    if (BYKB) return;
    BYKB=KB.make({ store:"bykb1", title:"補藥神器", toast:kbSay,
      on:function(){ return KB.vis($("q")); },
      blocked:function(){ return !$("lb").hidden || !$("inss").hidden || !$("nts").hidden; },
      acts:[
        { id:"save", grp:"✏️ 修改（開發者）", sc:"all", label:"💾 存", def:"F4", sel:"#esave", hide:function(){ return !DEV; }, ok:function(){ return KB.vis($("esave")); }, run:function(){ kbClick("esave"); } },
        { id:"cancel", grp:"✏️ 修改（開發者）", sc:"all", label:"取消（不存）", def:"Escape", sel:"#ecancel", hide:function(){ return !DEV; }, ok:function(){ return KB.vis($("ecancel")); }, run:function(){ kbClick("ecancel"); } },
        { id:"edit", grp:"藥品卡片（開發者）", sc:"all", label:"✏️ 修改", def:"Alt+E", sel:"#edit", hide:function(){ return !DEV; }, ok:function(){ return KB.vis($("edit")); }, run:function(){ kbClick("edit"); } },
        { id:"move", grp:"藥品卡片（開發者）", sc:"all", label:"📍 改位置", def:"Alt+L", sel:"#mvbtn", hide:function(){ return !DEV; }, ok:function(){ return KB.vis($("mvbtn")); }, run:function(){ kbClick("mvbtn"); } },
        { id:"q", grp:"查藥", sc:"all", label:"到查詢框（打 CODE、藥名）", def:"F2", sel:"#q", run:function(){ var q=$("q"); try { q.focus(); q.select(); window.scrollTo(0,0); } catch(e){} } },
        { id:"mic", grp:"查藥", sc:"all", label:"🎤 用講的查", def:"Alt+V", sel:"#mic", run:function(){ if (!kbClick("mic")) kbSay("這台不能用語音"); } },
        { id:"cam", grp:"查藥", sc:"all", label:"📷 拍照／選照片查", def:"Alt+C", sel:"#cam", run:function(){ kbClick("cam"); } },
        { id:"back", grp:"查藥", sc:"all", label:"← 回清單", def:"Alt+B", sel:"#back", ok:function(){ return KB.vis($("back")); }, run:function(){ kbClick("back"); } },
        { id:"home", grp:"查藥", sc:"all", label:"回首頁", def:"Alt+H", sel:"#home", run:function(){ kbClick("home"); } },
        { id:"help", grp:"每一頁", sc:"all", label:"⌨ 快速鍵一覽（在這裡改）", def:"F1", sel:"#kbopen", run:function(){ BYKB.open(); } }
      ] });
    var kb=$("kbopen"); if (kb) kb.onclick=function(){ BYKB.open(); };
  }
  kbInit();
  offStart();
  backendCheck(function(){
    gate(function(g){
      if (g==="ok"){ LIVE=true; API="https://script.google.com/macros/s/"+X+"/exec"; keyEarly(); start(); return; }
      if (g==="code"){ codeForm(); return; }
      if (g==="none" && MOCK && MOCK.appInfo){ $("demo").hidden=false; start(); return; }
      stop(GATE_MSG[g]||GATE_MSG.bad, g);
    });
  });
})();
