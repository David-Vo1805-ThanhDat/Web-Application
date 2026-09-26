/* =========================================================
   effects.js — hiệu ứng khi cuộn trang, dành cho trang chủ
   Gồm:
     - Hiện dần từng thẻ khi cuộn tới (FX.stagger cho nội dung sinh bằng JS)
     - Thanh tiến độ cuộn trang
   Không có hiệu ứng theo chuột. Tôn trọng prefers-reduced-motion.
   Yêu cầu: <html class="fx"> được đặt sớm (xem đầu BODY của trang chủ).
   ========================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FX = (window.FX = {});

  /* ---------- 1. Hiện dần khi cuộn tới ---------- */
  var io = null;
  if ('IntersectionObserver' in window && !reduce) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  }

  function prepare(el, index) {
    if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', '');
    if (!el.style.getPropertyValue('--d')) {
      el.style.setProperty('--d', Math.min(index, 5) * 90 + 'ms');   // so le nhau 90ms
    }
    if (io) io.observe(el); else el.classList.add('is-in');
  }

  // Cho nội dung sinh bằng JS (vd. lưới món theo bữa): các con hiện lần lượt
  FX.stagger = function (container) {
    Array.prototype.forEach.call(container.children, prepare);
  };

  // Cho phần tử có sẵn data-reveal trong HTML: độ trễ tính theo thứ tự trong cùng cha
  (function initStatic() {
    var counts = new Map();
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      var parent = el.parentElement;
      var i = counts.get(parent) || 0;
      counts.set(parent, i + 1);
      prepare(el, i);
    });
  })();

  /* ---------- 2. Thanh tiến độ cuộn ---------- */
  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var scrollTick = false;
  function updateProgress() {
    scrollTick = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ')';
  }
  window.addEventListener('scroll', function () {
    if (!scrollTick) { scrollTick = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  updateProgress();
})();
