/*!
 * Edutools - trang chủ
 * Bản quyền thuộc về Thầy Tiến - GV Trường THPT Bỉm Sơn- Thanh Hóa
 */
(function () {
  'use strict';

  var E = window.EduTools;
  var esc = E.esc;
  var $ = function (s) { return document.querySelector(s); };
  var preview = /[?&]preview=1(&|$)/.test(location.search);
  var OTHER = '__other';
  var FALLBACK_CAT = { id: OTHER, name: 'Khác', icon: '🧩', color: '#55607f' };

  var S = { data: null, q: '', cat: 'all', sort: 'order', cats: {} };

  E.initTheme();

  /* ---------- Tiện ích hiển thị ---------- */
  function catOf(t) { return S.cats[t.categoryId] || FALLBACK_CAT; }

  function mediaInner(t, c, withAlt) {
    var img = E.safeImg(t.image);
    if (img) return '<img src="' + esc(img) + '" alt="' + (withAlt ? esc(t.title) : '') + '" loading="lazy" decoding="async">';
    return '<div class="media-ph" aria-hidden="true">' + esc(c.icon) + '</div>';
  }

  function openButton(t) {
    var u = E.safeUrl(t.url);
    if (!u) return '<span class="btn btn-primary" aria-disabled="true">Chưa có liên kết</span>';
    return '<a class="btn btn-primary" href="' + esc(u) + '"' +
      (t.newTab ? ' target="_blank" rel="noopener noreferrer"' : '') + '>Mở công cụ' +
      (t.newTab ? '<span class="sr-only"> (mở trong tab mới)</span>' : '') + '</a>';
  }

  function tagsHtml(t) {
    if (!t.tags.length) return '';
    return '<p class="tags">' + t.tags.map(function (x) { return '<span>#' + esc(x) + '</span>'; }).join('') + '</p>';
  }

  function cardHtml(t) {
    var c = catOf(t);
    return '<li><article class="card" style="--c:' + esc(c.color) + '">' +
      '<span class="tab"><span aria-hidden="true">' + esc(c.icon) + '</span>' + esc(c.name) + '</span>' +
      (t.featured ? '<span class="tape">Nổi bật</span>' : '') +
      '<button type="button" class="media" data-detail="' + esc(t.id) + '" aria-label="Xem chi tiết: ' + esc(t.title) + '">' +
      mediaInner(t, c, false) + '</button>' +
      '<div class="card-body">' +
      '<h3 class="card-title">' + esc(t.title) + '</h3>' +
      (t.desc ? '<p class="card-desc">' + esc(t.desc) + '</p>' : '') +
      tagsHtml(t) +
      '<div class="card-actions">' + openButton(t) +
      '<button type="button" class="btn btn-ghost" data-detail="' + esc(t.id) + '">Chi tiết</button></div>' +
      '</div></article></li>';
  }

  /* ---------- Lọc, sắp xếp ---------- */
  function visibleTools() { return S.data.tools.filter(function (t) { return t.visible; }); }

  function catKey(t) { return S.cats[t.categoryId] ? t.categoryId : OTHER; }

  function filtered() {
    var words = E.fold(S.q.trim()).split(/\s+/).filter(Boolean);
    var list = visibleTools().filter(function (t) {
      if (S.cat === 'featured') { if (!t.featured) return false; }
      else if (S.cat !== 'all' && catKey(t) !== S.cat) return false;
      if (!words.length) return true;
      return words.every(function (w) { return t._s.indexOf(w) > -1; });
    });
    if (S.sort === 'new') {
      list = list.slice().sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
    } else if (S.sort === 'az') {
      list = list.slice().sort(function (a, b) { return a.title.localeCompare(b.title, 'vi'); });
    }
    return list;
  }

  /* ---------- Vẽ giao diện ---------- */
  function renderChips() {
    var tools = visibleTools();
    var counts = {}, featured = 0;
    tools.forEach(function (t) {
      var k = catKey(t);
      counts[k] = (counts[k] || 0) + 1;
      if (t.featured) featured++;
    });
    var items = [{ key: 'all', label: 'Tất cả', icon: '', n: tools.length }];
    if (featured) items.push({ key: 'featured', label: 'Nổi bật', icon: '⭐', n: featured });
    S.data.categories.forEach(function (c) {
      if (counts[c.id]) items.push({ key: c.id, label: c.name, icon: c.icon, n: counts[c.id] });
    });
    if (counts[OTHER]) items.push({ key: OTHER, label: 'Khác', icon: '🧩', n: counts[OTHER] });
    if (!items.some(function (i) { return i.key === S.cat; })) S.cat = 'all';

    $('#chips').innerHTML = items.map(function (i) {
      return '<button type="button" class="chip" data-cat="' + esc(i.key) + '" aria-pressed="' + (S.cat === i.key) + '">' +
        (i.icon ? '<span aria-hidden="true">' + esc(i.icon) + '</span>' : '') + esc(i.label) +
        '<span class="count">' + i.n + '</span></button>';
    }).join('');
    $('#chips').parentNode.hidden = tools.length === 0;
  }

  function renderGrid() {
    var list = filtered();
    var total = visibleTools().length;
    var grid = $('#grid');

    if (!total) {
      grid.innerHTML = '<li class="empty" style="grid-column:1/-1"><strong>Chưa có công cụ nào</strong>Danh sách đang được cập nhật. Mời thầy cô quay lại sau.</li>';
    } else if (!list.length) {
      grid.innerHTML = '<li class="empty" style="grid-column:1/-1"><strong>Không có công cụ nào khớp</strong>' +
        'Thử gõ từ khóa ngắn hơn hoặc chọn nhóm khác.<br><button type="button" class="btn btn-primary" data-reset>Xem tất cả công cụ</button></li>';
    } else {
      grid.innerHTML = list.map(cardHtml).join('');
    }

    var filteredOn = S.q.trim() || S.cat !== 'all';
    $('#resultNote').textContent = total && filteredOn ? 'Đang hiển thị ' + list.length + ' trong ' + total + ' công cụ' : '';

    var meta = $('#heroMeta');
    if (S.q.trim()) {
      meta.innerHTML = list.length
        ? 'Tìm thấy ' + list.length + ' công cụ. <a href="#congcu">Xem kết quả</a>'
        : 'Chưa thấy công cụ nào khớp với từ khóa này.';
    } else {
      var groups = {};
      visibleTools().forEach(function (t) { groups[catKey(t)] = 1; });
      var g = Object.keys(groups).length;
      meta.textContent = total ? 'Hiện có ' + total + ' công cụ trong ' + g + ' nhóm.' : '';
    }
  }

  function sortedNews() {
    var list = S.data.announcements.filter(function (n) { return n.visible; });
    list.sort(function (x, y) {
      if (x.pinned !== y.pinned) return x.pinned ? -1 : 1;
      return x.date < y.date ? 1 : x.date > y.date ? -1 : 0;
    });
    return list.slice(0, 12);
  }

  function updateArrows() {
    var r = $('#notes'), prev = $('#newsPrev'), next = $('#newsNext');
    var max = r.scrollWidth - r.clientWidth;
    prev.hidden = max <= 4 || r.scrollLeft <= 4;
    next.hidden = max <= 4 || r.scrollLeft >= max - 4;
  }

  function renderNotes() {
    var list = sortedNews();
    $('#thongbao').hidden = !list.length;
    $('#navNews').hidden = !list.length;
    $('#notes').innerHTML = list.map(function (n) {
      return '<button type="button" class="note" role="listitem" data-news="' + esc(n.id) + '">' +
        '<span class="note-head"><span class="note-title">' + (n.pinned ? '<span aria-hidden="true">📌 </span>' : '') + esc(n.title) + '</span>' +
        (n.date ? '<span class="note-date">' + esc(E.fmtDate(n.date)) + '</span>' : '') + '</span>' +
        (n.content ? '<span class="note-text">' + esc(n.content.replace(/\s+/g, ' ')) + '</span>' : '') + '</button>';
    }).join('');
    updateArrows();
  }

  function contactList(site) {
    var out = [];
    var mail = site.contactEmail.trim();
    if (/^[^\s@<>"']+@[^\s@<>"']+$/.test(mail)) out.push({ label: 'Gửi thư', icon: '✉️', href: 'mailto:' + mail });
    var z = site.contactZalo.trim();
    if (z) {
      var zh = /^[\d\s.+]+$/.test(z) ? 'https://zalo.me/' + z.replace(/\D/g, '') : E.safeUrl(E.normalizeUrl(z));
      if (zh) out.push({ label: 'Nhắn Zalo', icon: '💬', href: zh });
    }
    var fb = E.safeUrl(E.normalizeUrl(site.contactFacebook.trim()));
    if (fb) out.push({ label: 'Facebook', icon: '👍', href: fb });
    return out;
  }

  function renderSite() {
    var s = S.data.site;
    document.title = s.name + (s.slogan ? ' - ' + s.slogan : '');
    $('#brandName').textContent = s.name;
    $('#brandSlogan').textContent = s.slogan;
    $('#brandSlogan').hidden = !s.slogan;
    var logo = E.safeImg(s.logoImage);
    $('#brandMark').innerHTML = logo ? '<img src="' + esc(logo) + '" alt="">' : esc(s.logoEmoji || '✏️');
    $('#heroTitle').textContent = s.heroTitle || s.name;
    $('#heroText').textContent = s.heroText;
    $('#heroText').hidden = !s.heroText;
    $('#aboutName').textContent = s.name;
    $('#aboutText').textContent = s.about;

    var links = contactList(s);
    $('#contact').hidden = !links.length;
    $('#contactLinks').innerHTML = links.map(function (l) {
      var ext = /^https?:/i.test(l.href);
      return '<a class="chalk-btn" href="' + esc(l.href) + '"' + (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
        '<span aria-hidden="true">' + l.icon + '</span>' + esc(l.label) + '</a>';
    }).join('');

    $('#copyright').textContent = E.COPYRIGHT;
    var note = $('#footerNote');
    note.textContent = s.footerNote;
    note.hidden = !s.footerNote;
  }

  /* ---------- Cửa sổ thông báo ---------- */
  function openNews(id) {
    var n = S.data.announcements.filter(function (x) { return x.id === id; })[0];
    if (!n) return;
    var link = E.safeUrl(n.link);
    var dlg = $('#sheet');
    dlg.classList.add('narrow');
    dlg.style.removeProperty('--c');
    dlg.innerHTML = '<div class="sheet-body">' +
      '<button type="button" class="icon-btn sheet-close" data-close aria-label="Đóng cửa sổ">✕</button>' +
      '<h2 id="sheetTitle">' + (n.pinned ? '<span aria-hidden="true">📌 </span>' : '') + esc(n.title) + '</h2>' +
      (n.date ? '<p class="sheet-date">' + esc(E.fmtDate(n.date)) + '</p>' : '') +
      (n.content ? '<p class="sheet-news">' + esc(n.content) + '</p>' : '') +
      '<div class="sheet-actions">' +
      (link ? '<a class="btn btn-primary" href="' + esc(link) + '" target="_blank" rel="noopener noreferrer">Xem thêm<span class="sr-only"> (mở trong tab mới)</span></a>' : '') +
      '<button type="button" class="btn btn-ghost" data-close>Đóng</button></div></div>';
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  }

  /* ---------- Cửa sổ chi tiết ---------- */
  function openDetail(id) {
    var t = S.data.tools.filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    var c = catOf(t);
    var dlg = $('#sheet');
    dlg.classList.remove('narrow');
    dlg.style.setProperty('--c', c.color);
    dlg.innerHTML = '<div class="sheet-grid">' +
      '<div class="sheet-media">' + mediaInner(t, c, true) + '</div>' +
      '<div class="sheet-body">' +
      '<button type="button" class="icon-btn sheet-close" data-close aria-label="Đóng cửa sổ">✕</button>' +
      '<span class="sheet-cat"><span aria-hidden="true">' + esc(c.icon) + '</span>' + esc(c.name) + '</span>' +
      '<h2 id="sheetTitle">' + esc(t.title) + '</h2>' +
      (t.desc ? '<p>' + esc(t.desc) + '</p>' : '') +
      (t.guide ? '<div><h3>Hướng dẫn nhanh</h3><div class="sheet-guide">' + esc(t.guide) + '</div></div>' : '') +
      tagsHtml(t) +
      '<div class="sheet-actions">' + openButton(t) + '<button type="button" class="btn btn-ghost" data-close>Đóng</button></div>' +
      '</div></div>';
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  }

  function closeDetail() {
    var dlg = $('#sheet');
    if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
  }

  /* ---------- Sự kiện ---------- */
  function bind() {
    var timer;
    $('#q').addEventListener('input', function (e) {
      clearTimeout(timer);
      var v = e.target.value;
      timer = setTimeout(function () { S.q = v; renderGrid(); }, 120);
    });
    $('#searchForm').addEventListener('submit', function (e) {
      e.preventDefault();
      S.q = $('#q').value;
      renderGrid();
      $('#congcu').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('#chips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-cat]');
      if (!b) return;
      S.cat = b.getAttribute('data-cat');
      renderChips(); renderGrid();
    });
    $('#sort').addEventListener('change', function (e) { S.sort = e.target.value; renderGrid(); });
    var row = $('#notes');
    row.addEventListener('click', function (e) {
      var b = e.target.closest('[data-news]');
      if (b) openNews(b.getAttribute('data-news'));
    });
    row.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    window.addEventListener('load', updateArrows);
    function slide(dir) {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      row.scrollBy({ left: dir * row.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
    }
    $('#newsPrev').addEventListener('click', function () { slide(-1); });
    $('#newsNext').addEventListener('click', function () { slide(1); });
    $('#grid').addEventListener('click', function (e) {
      var d = e.target.closest('[data-detail]');
      if (d) { openDetail(d.getAttribute('data-detail')); return; }
      if (e.target.closest('[data-reset]')) {
        S.q = ''; S.cat = 'all'; $('#q').value = '';
        renderChips(); renderGrid();
      }
    });
    var dlg = $('#sheet');
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('[data-close]')) closeDetail();
    });
    var themeBtn = $('#themeBtn');
    function syncThemeBtn() { themeBtn.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'; }
    themeBtn.addEventListener('click', function () { E.toggleTheme(); syncThemeBtn(); });
    syncThemeBtn();
  }

  function boot(data) {
    S.data = data;
    S.cats = {};
    data.categories.forEach(function (c) { S.cats[c.id] = c; });
    data.tools.forEach(function (t) {
      t._s = E.fold([t.title, t.desc, t.tags.join(' '), catOf(t).name].join(' '));
    });
    renderSite();
    renderNotes();
    renderChips();
    renderGrid();
    bind();

    if (preview) {
      var bar = document.createElement('div');
      bar.className = 'preview-bar';
      bar.innerHTML = '<span>Đang xem bản nháp, chưa xuất bản</span><a href="admin.html">Về trang quản trị</a>';
      document.body.appendChild(bar);
    }
  }

  E.loadForSite(preview).then(boot);
})();
