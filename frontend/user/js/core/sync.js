/* Account data comes from MySQL on every page. This module keeps only an in-memory view. */
var Sync = (function () {
  var MAP = { hom_nay_an_gi_favorites:'favorites', hom_nay_an_gi_health_profile:'healthProfile',
    hom_nay_an_gi_health_log:'healthLog', hom_nay_an_gi_food_history:'foodHistory',
    hom_nay_an_gi_weekly_plan:'weeklyPlan', hom_nay_an_gi_group:'group' };
  var state = window.APP_STATE || {}, pending = {}, chains = {}, timers = {}, revisions = {}, inFlight = {};
  function call(action, params, keepalive) {
    var body = JSON.stringify(params || {});
    return fetch('../../backend/api/user/index.php?action=' + action, {
      method:'POST', credentials:'same-origin', headers:{ 'Content-Type':'application/json' }, body:body,
      keepalive:!!keepalive && new Blob([body]).size < 60000,
    }).then(function (r) { return r.json().then(function (b) {
      if (!r.ok || b.error) throw new Error(b.error || 'Không lưu được dữ liệu'); return b.data;
    }); });
  }
  function active() { return !!window.APP_USER; }
  function send(key) {
    clearTimeout(timers[key]);
    if (!Object.prototype.hasOwnProperty.call(pending, key)) return chains[key] || Promise.resolve();
    var value = pending[key], revision = revisions[key]; delete pending[key]; inFlight[key] = true;
    chains[key] = (chains[key] || Promise.resolve()).catch(function () {}).then(function () {
      return call('state.save', { key:key, value:value }, true);
    }).catch(function (error) {
      if (revisions[key] === revision && !Object.prototype.hasOwnProperty.call(pending, key)) pending[key] = value;
      window.dispatchEvent(new CustomEvent('state-save-error', { detail:error.message })); throw error;
    });
    var task = chains[key];
    task.then(function () { if (chains[key] === task) delete inFlight[key]; }, function () { if (chains[key] === task) delete inFlight[key]; });
    return task;
  }
  var storage = {
    getItem:function (name) { var key = MAP[name]; return key && state[key] != null ? JSON.stringify(state[key]) : null; },
    setItem:function (name, raw) {
      var key = MAP[name]; if (!key || !active()) throw new Error('Bạn cần đăng nhập để lưu dữ liệu');
      var value = JSON.parse(raw); state[key] = value; pending[key] = value; revisions[key] = (revisions[key] || 0) + 1;
      clearTimeout(timers[key]); timers[key] = setTimeout(function () { send(key).catch(function () {}); }, 150);
    },
    removeItem:function (name) { this.setItem(name, 'null'); },
  };
  function flush() {
    var keys = Object.keys(pending).concat(Object.keys(chains)).filter(function (k,i,all) { return all.indexOf(k) === i; });
    return Promise.all(keys.map(send));
  }
  function pull() { return call('state.get').then(function (data) { state = data; }); }
  function clearLocal() { state = {}; pending = {}; Object.keys(timers).forEach(function (k) { clearTimeout(timers[k]); }); }
  window.addEventListener('pagehide', function () { flush().catch(function () {}); });
  window.addEventListener('online', function () { flush().catch(function () {}); });
  function unsaved() { return Object.keys(pending).length || Object.keys(inFlight).length; }
  window.addEventListener('beforeunload', function (e) { if (unsaved()) { e.preventDefault(); e.returnValue = ''; } });
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link || !unsaved() || link.target === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    var url = new URL(link.href, location.href);
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
    e.preventDefault(); flush().then(function () { location.href = url.href; }).catch(function () {});
  });
  window.addEventListener('state-save-error', function (e) {
    if (typeof showToast === 'function') showToast('error', e.detail + '. Thay đổi chưa lưu; hãy giữ trang mở và thử lại khi có mạng.');
  });
  return { storage:storage, pull:pull, flush:flush, clearLocal:clearLocal, active:active };
})();
