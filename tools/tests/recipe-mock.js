// Bản GIẢ LẬP của các API "phản hồi nấu thử công thức" theo đúng hợp đồng ở backend/HANDOFF.md (mục P0).
// Dùng để kiểm thử giao diện khi backend chưa làm xong. Chỉ chặn các hành động recipe.*; mọi hành động khác vẫn đi tới backend thật.
// Khi backend thật đã có, chạy test với REAL_API=1 để bỏ giả lập.
const json = (route, status, body) => route.fulfill({ status, contentType: 'application/json; charset=utf-8', body: JSON.stringify(body) });
const MISSING = { error: 'Hành động không tồn tại: recipe' };

// Số liệu mẫu cho 'pho-bo-ha-noi' (6 nguyên liệu): đủ số lượt; 'bun-bo-hue': chưa đủ lượt
function fixtures() {
  const ing = (index, total, ok, less, more) => ({ index, total, ok, less, more });
  return {
    'pho-bo-ha-noi': {
      foodId: 'pho-bo-ha-noi', cooks: 34, enough: true, fitRate: 79,
      ingredients: [ing(0, 30, 25, 3, 2), ing(1, 30, 24, 3, 3), ing(2, 28, 22, 4, 2), ing(3, 30, 12, 13, 5), ing(4, 30, 10, 2, 18), ing(5, 3, 3, 0, 0)],
      taste: { salty: { low: 2, ok: 18, high: 12 }, sweet: { low: 1, ok: 25, high: 2 }, spicy: { low: 5, ok: 15, high: 4 } },
      difficulty: { easy: 20, medium: 12, hard: 2 }, time: { faster: 3, same: 18, slower: 13 },
    },
    'bun-bo-hue': { foodId: 'bun-bo-hue', cooks: 3, enough: false },
  };
}

// options: { missing: true (backend chưa có hành động), statsError: true (trả 500) }
async function installRecipeMock(ctx, options = {}) {
  if (process.env.REAL_API) return null;
  const state = { stats: fixtures(), mine: {}, submissions: [], statsCalls: 0 };
  const action = (route) => new URL(route.request().url()).searchParams.get('action');

  await ctx.route(/\/backend\/api\/(public|user)\/index\.php\?action=recipe\./, async (route) => {
    const a = action(route);
    if (options.missing) return json(route, 404, MISSING);
    const body = route.request().postDataJSON() || {};
    if (a === 'recipe.stats') {
      state.statsCalls++;
      if (options.statsError) return json(route, 500, { error: 'Lỗi máy chủ, vui lòng thử lại' });
      return json(route, 200, { data: state.stats[body.foodId] || { foodId: body.foodId, cooks: 0, enough: false } });
    }
    if (a === 'recipe.mine') return json(route, 200, { data: state.mine[body.foodId] || null });
    if (a === 'recipe.submit') {
      if (typeof body.fit !== 'boolean') return json(route, 422, { error: 'Hãy cho biết món này có hợp khẩu vị của bạn không.' });
      state.submissions.push(body);
      const isNew = !state.mine[body.foodId];
      state.mine[body.foodId] = { ...body, updatedAt: Date.now() };
      const s = state.stats[body.foodId] || (state.stats[body.foodId] = { foodId: body.foodId, cooks: 0, enough: false });
      if (isNew) s.cooks++;
      return json(route, 200, { data: { ok: true, updatedAt: Date.now() } });
    }
    return json(route, 404, MISSING);
  });
  return state;
}

// Bản giả lập của các hành động admin recipe.quality.* (dùng cho admin-recipes.js)
function adminFixtures() {
  const item = (foodId, foodName, cooks, fitRate, status, topIssue) => ({ foodId, foodName, image: '', cooks, fitRate, status, topIssue });
  const items = [
    item('pho-bo-ha-noi', 'Phở Bò Hà Nội', 34, 79, 'review', { index: 3, name: 'Hành tây, hành tím nướng', kind: 'less', percent: 43 }),
    item('bun-bo-hue', 'Bún Bò Huế', 12, 92, 'ok', null),
    item('com-tam-suon-bi-cha', 'Cơm Tấm Sườn Bì Chả', 8, 55, 'review', { index: 1, name: 'Sườn cốt lết', kind: 'more', percent: 38 }),
    item('banh-mi-thit-nuong', 'Bánh Mì Thịt Nướng Giòn Rụm', 3, 100, 'low-data', null),
    item('lau-thai-chua-cay', 'Lẩu Thái Chua Cay', 0, null, 'low-data', null),
  ];
  return items;
}
async function installAdminRecipeMock(ctx, options = {}) {
  if (process.env.REAL_API) return null;
  const all = adminFixtures();
  const state = { calls: [] };
  await ctx.route(/\/backend\/api\/admin\/index\.php\?action=recipe\.quality\./, async (route) => {
    const a = new URL(route.request().url()).searchParams.get('action');
    const p = route.request().postDataJSON() || {};
    state.calls.push({ action: a, params: p });
    if (options.missing) return json(route, 404, MISSING);
    if (options.error) return json(route, 500, { error: 'Lỗi máy chủ, vui lòng thử lại' });
    if (a === 'recipe.quality.list') {
      let items = all.filter((x) => (!p.status || p.status === 'all' || x.status === p.status) && (!p.q || x.foodName.toLowerCase().includes(String(p.q).toLowerCase())));
      const size = p.pageSize || 8, total = items.length, pages = Math.max(1, Math.ceil(total / size)), page = Math.min(p.page || 1, pages);
      return json(route, 200, { data: { items: items.slice((page - 1) * size, page * size), total, page, pages, pageSize: size, summary: { totalCooks: 57, fitRate: 76, recipesToReview: all.filter((x) => x.status === 'review').length } } });
    }
    if (a === 'recipe.quality.get') {
      const f = all.find((x) => x.foodId === p.foodId);
      if (!f) return json(route, 404, { error: 'Không tìm thấy món ăn' });
      return json(route, 200, { data: {
        food: { id: f.foodId, name: f.foodName }, cooks: f.cooks, fitRate: f.fitRate, status: f.status,
        ingredients: [
          { index: 0, name: 'Bánh phở tươi', amount: '200g', total: 30, ok: 25, less: 3, more: 2 },
          { index: 3, name: 'Hành tây, hành tím nướng', amount: '2 củ', total: 30, ok: 12, less: 13, more: 5 },
          { index: 5, name: 'Hành lá, rau mùi', amount: 'Vừa đủ', total: 3, ok: 3, less: 0, more: 0 },
        ],
        taste: { salty: { low: 2, ok: 18, high: 12 }, sweet: { low: 1, ok: 25, high: 2 }, spicy: { low: 5, ok: 15, high: 4 } },
        difficulty: { easy: 20, medium: 12, hard: 2 }, time: { faster: 3, same: 18, slower: 13 },
        notes: [{ id: 12, userName: 'Nguyễn Văn An', portions: 2, fit: true, text: 'Nêm nhạt hơn thì ngon hơn', createdAt: Date.now() - 3600000 }, { id: 11, userName: 'Trần Thị Bích', portions: 1, fit: false, text: 'Hành tây: thay bằng hành tím', createdAt: Date.now() - 86400000 }],
      } });
    }
    return json(route, 404, MISSING);
  });
  return state;
}

module.exports = { installRecipeMock, installAdminRecipeMock };
