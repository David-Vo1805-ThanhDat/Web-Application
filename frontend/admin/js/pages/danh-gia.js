/* pages/danh-gia.js — Góp ý liên hệ (gửi từ form "Liên hệ & Góp ý" của web): xem, phản hồi, xuất CSV. */
(function () {
  'use strict';
  var D = window.Dom, F = window.Fmt;
  var STATUS = { new: ['Chưa phản hồi', 'b-amber'], replied: ['Đã phản hồi', 'b-green'] };
  var page = 1, items = [];

  function avatar(name, key) { return '<span class="avatar ' + D.colorClass(key) + '">' + D.initial(name) + '</span>'; }

  function card(f) {
    var st = STATUS[f.status];
    return '<article class="card review-card" data-id="' + f.id + '"><div class="review-head">' + avatar(f.name, f.email) +
      '<div class="review-who"><div class="review-name">' + D.esc(f.name) + '<span class="review-dish">· ' + D.esc(f.subjectLabel) + '</span></div>' +
      '<div class="review-meta"><span>' + D.esc(f.email) + '</span><span>· #' + f.id + ' · ' + F.ago(f.createdAt) + '</span></div></div><span class="badge ' + st[1] + '">' + st[0] + '</span></div>' +
      '<p class="review-text">' + D.esc(f.message).replace(/\n/g, '<br>') + '</p>' + (f.reply ? '<div class="review-reply"><b>Phản hồi:</b> ' + D.esc(f.reply) + '</div>' : '') +
      '<div class="review-actions"><button class="btn btn-approve" type="button" data-reply>' + D.icon('reply') + (f.reply ? 'Sửa phản hồi' : 'Phản hồi') + '</button>' +
      '<a class="btn btn-ghost" href="mailto:' + D.esc(f.email) + '">' + D.icon('mail') + 'Gửi email</a></div></article>';
  }

  function loadStats() {
    return window.Api.call('reviews.stats').then(function (s) {
      var replied = s.feedbackTotal - s.feedbackNew;
      D.$('[data-stat=total]').textContent = s.feedbackTotal; D.$('[data-note=total]').textContent = 'Từ form Liên hệ & Góp ý';
      D.$('[data-stat=new]').textContent = s.feedbackNew; D.$('[data-note=new]').textContent = s.feedbackNew ? 'Cần phản hồi sớm' : 'Đã xử lý hết';
      D.$('[data-stat=replied]').textContent = replied; D.$('[data-note=replied]').textContent = s.feedbackTotal ? Math.round(replied / s.feedbackTotal * 100) + '% tổng số' : '—';
      D.$('#sub').textContent = s.feedbackTotal + ' góp ý liên hệ · ' + s.feedbackNew + ' chưa phản hồi';
      var b = D.$('[data-count=feedbackNew]'); if (b) { b.textContent = s.feedbackNew; b.hidden = false; }
    });
  }

  function load() {
    return window.Api.call('feedback.list', { page: page, pageSize: 4 }).then(function (r) {
      items = r.items;
      var empty = r.total === 0; D.$('#listEmpty').hidden = !empty;
      D.$('#list').innerHTML = r.items.map(card).join('');
      D.$('#footInfo').textContent = empty ? '' : 'Hiển thị ' + ((r.page - 1) * r.pageSize + 1) + '–' + Math.min(r.page * r.pageSize, r.total) + ' trong tổng số ' + r.total + ' góp ý';
      window.Pagination.render(D.$('#pager'), { page: r.page, pages: r.pages, onChange: function (p) { page = p; load(); } });
      if (empty) D.$('#pager').innerHTML = '';
    });
  }

  function replyForm(item) {
    window.Modal.form({
      title: 'Phản hồi góp ý', submitText: 'Gửi phản hồi', size: 'md',
      html: '<div class="review-reply"><b>' + D.esc(item.name) + ':</b> ' + D.esc(item.message) + '</div>' +
        '<div class="field"><label>Nội dung phản hồi <span class="req">*</span></label><textarea class="textarea" name="text" rows="4" placeholder="Nhập phản hồi…">' + D.esc(item.reply || '') + '</textarea></div><span class="field-error" data-modal-err hidden></span>',
      onSubmit: function (f) {
        var t = f.text.value.trim();
        if (!t) { var e = f.querySelector('[data-modal-err]'); e.textContent = 'Vui lòng nhập nội dung phản hồi.'; e.hidden = false; return false; }
        return window.Api.call('feedback.reply', { id: item.id, text: t }).then(function () { window.Toast.success('Đã gửi phản hồi', 'Phản hồi đã được lưu.'); loadStats(); return load(); });
      },
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadStats(); load();
    D.on(D.$('#list'), 'click', '[data-reply]', function () {
      var id = +this.closest('.review-card').dataset.id;
      replyForm(items.filter(function (x) { return x.id === id; })[0]);
    });
    D.$('#exportBtn').addEventListener('click', function () {
      window.Api.call('feedback.list', { page: 1, pageSize: 5000 }).then(function (r) {
        var rows = [['ID', 'Họ tên', 'Email', 'Chủ đề', 'Nội dung', 'Trạng thái', 'Phản hồi']];
        r.items.forEach(function (x) { rows.push([x.id, x.name, x.email, x.subjectLabel, x.message, STATUS[x.status][0], x.reply || '']); });
        window.Download.csv('gop-y-' + new Date().toISOString().slice(0, 10) + '.csv', rows);
        window.Toast.success('Đã xuất dữ liệu', r.total + ' góp ý đã được tải xuống.');
      });
    });
  });
})();
