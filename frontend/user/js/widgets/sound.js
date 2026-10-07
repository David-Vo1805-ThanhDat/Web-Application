/* Web Audio effects. Sound preference is temporary for the current page. */
var WheelSound = (function () {
  var ctx = null, master = null, lastTick = 0;

  var soundOn = true;
  function enabled() { return soundOn; }
  function setEnabled(on) { soundOn = !!on; }

  // Tạo/đánh thức AudioContext (gọi trong lúc xử lý cú bấm). Trả null nếu đang tắt hoặc trình duyệt không hỗ trợ.
  function ensure() {
    if (!enabled()) return null;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      if (!ctx) { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination); }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { return null; }
    return ctx;
  }

  // Một nốt ngắn: tần số, thời điểm bắt đầu, độ dài, kiểu sóng, âm lượng đỉnh
  function tone(freq, when, dur, type, peak) {
    var osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(peak, when + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(g); g.connect(master);
    osc.start(when); osc.stop(when + dur + 0.03);
  }

  return {
    isEnabled: enabled,
    setEnabled: function (on) { setEnabled(on); if (on) ensure(); },
    unlock: function () { ensure(); },
    // Tiếng "tách" khi ô đi qua mũi tên; bỏ qua nếu quá dày (< 35 ms) để không thành tiếng rè
    tick: function () {
      var c = ensure(); if (!c) return;
      var now = c.currentTime;
      if (now - lastTick < 0.035) return;
      lastTick = now;
      tone(950 + Math.random() * 90, now, 0.05, 'triangle', 0.32);
      tone(1900, now, 0.025, 'square', 0.05);
    },
    // Tiếng "ting-ting" ngắn khi vòng quay dừng (hộp thoại kết quả sau đó còn có tiếng pháo giấy riêng)
    win: function () {
      var c = ensure(); if (!c) return;
      var now = c.currentTime;
      tone(784, now, 0.3, 'sine', 0.24);
      tone(1175, now + 0.11, 0.5, 'sine', 0.24);
    },
    // Nút loa bật/tắt đặt cạnh vòng quay (gắn vào phần tử bao quanh canvas)
    mountToggle: function (canvas) {
      var box = canvas.closest('.wheel-stage, .wheel-wrapper') || canvas.parentElement;
      if (!box || box.querySelector('.wheel-sound-btn')) return;
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'wheel-sound-btn';
      function paint() {
        var on = enabled();
        btn.setAttribute('aria-pressed', String(on));
        btn.setAttribute('aria-label', on ? 'Tắt âm thanh vòng quay' : 'Bật âm thanh vòng quay');
        btn.title = on ? 'Tắt âm thanh' : 'Bật âm thanh';
        btn.innerHTML = '<i class="bi ' + (on ? 'bi-volume-up-fill' : 'bi-volume-mute-fill') + '"></i>';
      }
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        setEnabled(!enabled()); paint();
        if (enabled()) { ensure(); if (ctx) tone(880, ctx.currentTime, 0.12, 'sine', 0.2); }   // nghe thử khi bật
      });
      paint(); box.appendChild(btn);
    },
  };
})();
