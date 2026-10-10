/* widgets/bg-music.js — Nhạc nền cho mọi trang người dùng (frontend/audio/nhac-nen.mp3), nạp ở scripts_block() của
   tools/build/generate.py.
   - Trình duyệt chặn tự phát nhạc có tiếng khi vừa mở trang → thử phát ngay; bị chặn thì phát ở lần bấm/chạm/gõ phím đầu tiên.
   - Nút tròn góc dưới bên trái để bật/tắt. Lựa chọn TẮT nhớ trong localStorage, vị trí đang nghe nhớ trong sessionStorage
     (chuyển trang thì phát tiếp từ chỗ cũ). Đây chỉ là tuỳ chọn giao diện, không phải dữ liệu tài khoản. */
(function () {
  'use strict';

  var SRC = '../audio/nhac-nen.mp3';
  var VOLUME = 0.3;
  var KEY_OFF = 'hnag_music_off';   // '1' = người dùng đã tắt nhạc
  var KEY_POS = 'hnag_music_pos';
  var KEY_AT = 'hnag_music_at';     // thời điểm (ms) ghi vị trí, để trang sau cộng bù thời gian chuyển trang
  var FADE_MS = 120;     // to lên rất nhanh khi bắt đầu phát (chỉ để loa không bị "bụp")

  function read(store, key) { try { return window[store].getItem(key); } catch (e) { return null; } }
  function write(store, key, value) {
    try { if (value === null) window[store].removeItem(key); else window[store].setItem(key, value); } catch (e) {}
  }

  var audio = new Audio(SRC);
  audio.loop = true;
  audio.volume = 0;
  audio.preload = 'auto';
  var off = read('localStorage', KEY_OFF) === '1';

  // Phát tiếp từ chỗ đang nghe ở trang trước, CỘNG thêm thời gian đã trôi qua lúc chuyển trang
  // (nghe như nhạc vẫn chạy, chỉ "mất sóng" thoáng qua, thay vì khựng rồi lặp lại đoạn cũ)
  var resumeAt = parseFloat(read('sessionStorage', KEY_POS));
  var savedAt = parseInt(read('sessionStorage', KEY_AT), 10);
  if (resumeAt > 0) {
    audio.addEventListener('loadedmetadata', function () {
      var gap = savedAt ? (Date.now() - savedAt) / 1000 : 0;
      if (gap > 0 && gap < 10) resumeAt += gap;          // quá 10 giây (vd. chờ bấm mới phát) thì thôi cộng bù
      audio.currentTime = resumeAt % audio.duration;      // nhạc lặp: quá cuối bài thì quay về đầu
    }, { once: true });
  }
  var lastSaved = 0;
  function savePosition() {
    if (audio.currentTime > 0) {
      write('sessionStorage', KEY_POS, audio.currentTime.toFixed(2));
      write('sessionStorage', KEY_AT, audio.paused ? null : String(Date.now()));   // đang dừng thì không cộng bù
    }
  }
  audio.addEventListener('timeupdate', function () {
    if (Math.abs(audio.currentTime - lastSaved) >= 2) { lastSaved = audio.currentTime; savePosition(); }
  });
  window.addEventListener('pagehide', savePosition);

  // Đổi âm lượng từ từ tới `target` trong `ms` mili-giây, xong thì gọi `done`
  var fadeTimer = null;
  function fadeTo(target, ms, done) {
    clearInterval(fadeTimer);
    var start = audio.volume, steps = Math.max(1, Math.round(ms / 25)), i = 0;
    fadeTimer = setInterval(function () {
      i += 1;
      audio.volume = Math.min(1, Math.max(0, start + (target - start) * (i / steps)));
      if (i >= steps) { clearInterval(fadeTimer); fadeTimer = null; if (done) done(); }
    }, 25);
  }



  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'music-toggle';

  function paint() {
    btn.innerHTML = '<i class="bi ' + (off ? 'bi-volume-mute-fill' : 'bi-music-note-beamed') + '" aria-hidden="true"></i>';
    btn.setAttribute('aria-pressed', String(!off));
    btn.setAttribute('aria-label', off ? 'Bật nhạc nền' : 'Tắt nhạc nền');
    btn.title = off ? 'Bật nhạc nền' : 'Tắt nhạc nền';
    btn.classList.toggle('is-off', off);
    btn.classList.toggle('is-playing', !audio.paused);
  }

  function tryPlay() {
    if (off || !audio.paused) return;
    var p = audio.play();
    if (p && p.catch) p.catch(function () { /* bị chặn: chờ người dùng tương tác */ });
  }

  // Lần tương tác đầu tiên trên trang (trừ chính nút nhạc) → phát
  var EVENTS = ['pointerdown', 'keydown', 'touchstart'];
  function onFirstInteraction(e) {
    if (e.target && e.target.closest && e.target.closest('.music-toggle')) return;
    tryPlay();
  }
  function listen(on) {
    EVENTS.forEach(function (name) {
      if (on) document.addEventListener(name, onFirstInteraction, { capture: true, passive: true });
      else document.removeEventListener(name, onFirstInteraction, { capture: true });
    });
  }

  audio.addEventListener('play', function () { listen(false); paint(); fadeTo(VOLUME, FADE_MS); });
  audio.addEventListener('pause', paint);

  btn.addEventListener('click', function () {
    off = !off;
    write('localStorage', KEY_OFF, off ? '1' : null);
    if (off) audio.pause(); else tryPlay();
    paint();
  });

  function mount() {
    document.body.appendChild(btn);
    paint();
    if (!off) { listen(true); tryPlay(); }
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
