/* core/sync.js — Đồng bộ dữ liệu riêng của người dùng (yêu thích, hồ sơ sức khỏe, nhật ký, lịch sử món, thực đơn tuần, nhóm bạn)
   lên backend (backend/api/user). SERVER là nơi lưu chính; localStorage chỉ là bản sao để các trang đọc nhanh, đồng bộ.
   - Đăng nhập xong: Sync.pull() kéo dữ liệu từ server xuống localStorage (nếu server chưa có gì mà trình duyệt đang có dữ liệu
     từ trước thì đẩy lên server — chuyển dữ liệu cũ một lần).
   - Mỗi lần code trang ghi các khoá bên dưới vào localStorage, tự đẩy lên server sau ~0,3 giây (không cần sửa từng chỗ ghi).
   - Đăng xuất: xoá các khoá này khỏi trình duyệt để người dùng khác dùng chung máy không thấy.
   Chỉ hoạt động khi đã đăng nhập bằng backend thật (user.server === true); chưa đăng nhập thì không làm gì. */
var Sync = (function () {
  var API = '../../backend/api/user/index.php';
  // khoá localStorage → khoá phía server
  var MAP = {
    hom_nay_an_gi_favorites: 'favorites',
    hom_nay_an_gi_health_profile: 'healthProfile',
    hom_nay_an_gi_health_log: 'healthLog',
    hom_nay_an_gi_food_history: 'foodHistory',
    hom_nay_an_gi_weekly_plan: 'weeklyPlan',
    hom_nay_an_gi_group: 'group',
  };
  var rawSet = Storage.prototype.setItem, rawRemove = Storage.prototype.removeItem, rawGet = Storage.prototype.getItem;
  var pending = {}; // khoá local → { timer, value }

  function active() {
    var u = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    return !!(u && u.server);
  }

  function call(action, params, keepalive) {
    var body = JSON.stringify(params || {});
    return fetch(API + '?action=' + action, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: body,
      keepalive: !!keepalive && body.length < 60000, // cho phép gửi nốt khi vừa bấm chuyển trang
    }).then(function (res) {
      return res.json().then(function (b) { if (!res.ok || b.error) throw new Error(b.error || 'Lỗi máy chủ'); return b.data; });
    });
  }

  function send(localKey) {
    var p = pending[localKey]; if (!p) return Promise.resolve();
    clearTimeout(p.timer); delete pending[localKey];
    var value = null;
    if (p.value !== null) { try { value = JSON.parse(p.value); } catch (e) { return Promise.resolve(); } }
    return call('state.save', { key: MAP[localKey], value: value }, true).catch(function (e) { console.warn('[sync] không lưu được ' + MAP[localKey] + ':', e.message); });
  }

  function schedule(localKey, value) {
    if (pending[localKey]) clearTimeout(pending[localKey].timer);
    pending[localKey] = { value: value, timer: setTimeout(function () { send(localKey); }, 300) };
  }

  // Ghi vào localStorage như bình thường, rồi lên lịch đẩy lên server
  Storage.prototype.setItem = function (k, v) {
    rawSet.call(this, k, v);
    try { if (this === window.localStorage && MAP[k] && active()) schedule(k, String(v)); } catch (e) { /* không ảnh hưởng việc ghi */ }
  };
  Storage.prototype.removeItem = function (k) {
    rawRemove.call(this, k);
    try { if (this === window.localStorage && MAP[k] && active()) schedule(k, null); } catch (e) { /* không ảnh hưởng việc xoá */ }
  };

  // Kéo dữ liệu từ server xuống trình duyệt (gọi sau khi đăng nhập)
  function pull() {
    return call('state.get').then(function (state) {
      var pushes = [];
      Object.keys(MAP).forEach(function (localKey) {
        var key = MAP[localKey];
        if (key in state) {                          // server đã có (kể cả null = người dùng đã xoá)
          if (state[key] === null) rawRemove.call(localStorage, localKey);
          else rawSet.call(localStorage, localKey, JSON.stringify(state[key]));
        } else if (rawGet.call(localStorage, localKey) !== null) { // server chưa có gì: nhận dữ liệu cũ đang có ở trình duyệt
          schedule(localKey, rawGet.call(localStorage, localKey));
          pushes.push(send(localKey));
        }
      });
      return Promise.all(pushes);
    }).catch(function (e) { console.warn('[sync] không kéo được dữ liệu:', e.message); });
  }

  // Gửi ngay mọi thay đổi đang chờ (trước khi đăng xuất / chuyển trang)
  function flush() { return Promise.all(Object.keys(pending).map(send)); }

  // Xoá dữ liệu người dùng khỏi trình duyệt (khi đăng xuất)
  function clearLocal() { Object.keys(MAP).forEach(function (k) { rawRemove.call(localStorage, k); }); }

  window.addEventListener('pagehide', function () { flush(); });

  return { pull: pull, flush: flush, clearLocal: clearLocal, active: active };
})();
