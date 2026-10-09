/* pages/cai-dat.js — Cài đặt hệ thống: thông tin chung, tài khoản quản trị, bảo mật, thông báo, sao lưu, xoá dữ liệu demo. */
(function () {
  'use strict';
  var D = window.Dom;
  var ROLE = { super: ['Super admin', 'b-green'], moderator: ['Điều hành viên', 'b-orange'] };
  var S = null, dirty = false;

  function get(path) { var p = path.split('.'); return S[p[0]][p[1]]; }
  function setv(path, v) { var p = path.split('.'); S[p[0]][p[1]] = v; }

  function renderAdmins() {
    D.$('#adminSub').textContent = S.admins.length + ' tài khoản có quyền quản trị';
    D.$('#adminList').innerHTML = S.admins.map(function (a) {
      var r = ROLE[a.role] || ROLE.moderator, isSuper = a.role === 'super';
      return '<div class="admin-row"><span class="avatar ' + D.colorClass(a.email) + '">' + D.initial(a.name) + '</span><div class="admin-info"><b>' + D.esc(a.name) + '</b><small>' + D.esc(a.email) + '</small></div>' +
        '<span class="badge ' + r[1] + '">' + r[0] + '</span>' +
        '<button class="icon-action" type="button" data-edit="' + a.id + '" aria-label="Sửa ' + D.esc(a.name) + '">' + D.icon('edit') + '</button>' +
        '<button class="icon-action is-danger" type="button" data-del="' + a.id + '"' + (isSuper ? ' disabled title="Không thể xoá Super admin"' : '') + ' aria-label="Xoá ' + D.esc(a.name) + '">' + D.icon('trash') + '</button></div>';
    }).join('');
  }

  function fill() {
    D.$$('[data-set]').forEach(function (el) { var v = get(el.dataset.set); if (el.type === 'checkbox') el.checked = !!v; else el.value = v; });
    D.$('#bkLast').textContent = S.backup.last; D.$('#bkFreq').textContent = S.backup.freq; renderAdmins();
  }

  function collect() { D.$$('[data-set]').forEach(function (el) { setv(el.dataset.set, el.type === 'checkbox' ? el.checked : el.value.trim()); }); }

  function save() {
    collect();
    if (!S.general.platformName) { window.Toast.error('Chưa thể lưu', 'Tên nền tảng không được để trống.'); D.$('#sName').focus(); return; }
    if (!/^\S+@\S+\.\S+$/.test(S.general.contactEmail)) { window.Toast.error('Chưa thể lưu', 'Email liên hệ không hợp lệ.'); D.$('#sMail').focus(); return; }
    window.Api.call('settings.save', { settings: { general: S.general, admins: S.admins, notify: S.notify, security: S.security } }).then(function (result) { S = result; fill(); dirty = false; window.Toast.success('Đã lưu cài đặt', 'Các thay đổi đã được áp dụng.'); });
  }

  function adminForm(a) {
    window.Modal.form({
      title: a ? 'Sửa quản trị viên' : 'Mời quản trị viên mới', submitText: a ? 'Lưu' : 'Gửi lời mời',
      html: '<div class="field"><label>Họ tên <span class="req">*</span></label><input class="input" name="name" value="' + D.esc(a ? a.name : '') + '"></div>' +
        '<div class="field"><label>Email <span class="req">*</span></label><input class="input" type="email" name="email" value="' + D.esc(a ? a.email : '') + '"></div>' +
        '<div class="field"><label>Vai trò</label><div class="select"><select name="role"><option value="moderator"' + (a && a.role === 'moderator' ? ' selected' : '') + '>Điều hành viên</option><option value="super"' + (a && a.role === 'super' ? ' selected' : '') + '>Super admin</option></select>' + D.icon('chev') + '</div></div>' +
        (a ? '' : '<div class="field"><label>Mật khẩu</label><input class="input" type="password" name="password" minlength="8" required autocomplete="new-password"></div>') +
        '<span class="field-error" data-modal-err hidden></span>',
      onSubmit: function (f) {
        var name = f.name.value.trim(), email = f.email.value.trim(), e = f.querySelector('[data-modal-err]');
        if (!name || !/^\S+@\S+\.\S+$/.test(email)) { e.textContent = 'Vui lòng nhập họ tên và email hợp lệ.'; e.hidden = false; return false; }
        if (S.admins.some(function (x) { return x.email === email && (!a || x.id !== a.id); })) { e.textContent = 'Email này đã là quản trị viên.'; e.hidden = false; return false; }
        if (a) { a.name = name; a.email = email; a.role = f.role.value; }
        else { if (f.password.value.length < 8) { e.textContent = 'Mật khẩu cần ít nhất 8 ký tự.'; e.hidden = false; return false; } S.admins.push({ id: Date.now(), name: name, email: email, role: f.role.value, password:f.password.value }); }
        renderAdmins(); dirty = true; window.Toast.info(a ? 'Đã cập nhật' : 'Đã thêm quản trị viên', 'Bấm “Lưu thay đổi” để lưu vào hệ thống.');
      },
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    window.Api.call('settings.get').then(function (s) { S = s; fill(); });
    D.$('#saveBtn').addEventListener('click', save);
    D.on(document.body, 'input', '[data-set]', function () { dirty = true; });
    D.on(document.body, 'change', '[data-set]', function () { dirty = true; });
    D.$('#inviteBtn').addEventListener('click', function () { adminForm(null); });
    D.on(D.$('#adminList'), 'click', '[data-edit]', function () { var id = +this.dataset.edit; adminForm(S.admins.filter(function (x) { return x.id === id; })[0]); });
    D.on(D.$('#adminList'), 'click', '[data-del]', function () {
      var id = +this.dataset.del, a = S.admins.filter(function (x) { return x.id === id; })[0];
      window.Modal.confirm({ title: 'Xoá quản trị viên?', text: a.name + ' (' + a.email + ') sẽ mất quyền truy cập bảng quản trị.', confirmText: 'Xoá' }).then(function (ok) { if (ok) { S.admins = S.admins.filter(function (x) { return x.id !== id; }); renderAdmins(); dirty = true; } });
    });
    D.$('#backupBtn').addEventListener('click', function () {
      window.Api.call('settings.backup').then(function (b) { S.backup = b; D.$('#bkLast').textContent = b.last; window.Toast.success('Đã sao lưu', 'Bản sao lưu dữ liệu vừa được tạo.'); });
    });
    window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  });
})();
