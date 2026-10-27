/*!
 * Edutools - trang quản trị
 * Bản quyền thuộc về Thầy Tiến - GV Trường THPT Bỉm Sơn- Thanh Hóa
 */
(function () {
  'use strict';

  var E = window.EduTools;
  var esc = E.esc;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var S = { data: null, view: 'overview', tq: '', tcat: '', from: '' };
  var NAV = [
    { id: 'overview', label: 'Tổng quan', icon: '🏠' },
    { id: 'tools', label: 'Công cụ', icon: '🧰' },
    { id: 'cats', label: 'Danh mục', icon: '🗂️' },
    { id: 'news', label: 'Thông báo', icon: '📣' },
    { id: 'site', label: 'Thông tin trang', icon: '🏫' },
    { id: 'publish', label: 'Xuất bản và sao lưu', icon: '🚀' },
    { id: 'security', label: 'Bảo mật', icon: '🔒' }
  ];
  var EMOJIS = ['📚', '🎯', '🔬', '🧮', '🧪', '🌍', '🎨', '🎵', '💻', '🗣️', '✍️', '🤝', '🧠', '📝', '🏃', '🎬'];
  var fails = 0, lockUntil = 0;

  E.initTheme();

  /* ======================= Tiện ích giao diện ======================= */
  function toast(msg, type) {
    var el = document.createElement('div');
    el.className = 'toast ' + (type || 'ok');
    el.textContent = msg;
    var box = $('#toasts');
    while (box.children.length >= 3) box.removeChild(box.firstChild);
    box.appendChild(el);
    setTimeout(function () {
      el.classList.add('out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
    }, type === 'err' ? 7000 : 3200);
  }

  function updateState() {
    var p = $('#statePill');
    if (E.isDirty()) { p.className = 'pill warn'; p.textContent = 'Có thay đổi chưa xuất bản'; }
    else { p.className = 'pill ok'; p.textContent = 'Không có thay đổi chờ xuất bản'; }
  }

  function save(msg) {
    var ok = E.saveDraft(S.data);
    if (!ok) {
      toast('Không lưu được vào trình duyệt, có thể vì bộ nhớ đầy do ảnh nặng. Hãy dùng ảnh nhỏ hơn hoặc dán link ảnh, rồi xuất bản ngay.', 'err');
    } else if (msg) {
      toast(msg);
    }
    updateState();
    return ok;
  }

  function applyBrand() {
    var s = S.data.site;
    $('#aName').textContent = s.name;
    var logo = E.safeImg(s.logoImage);
    $('#aMark').innerHTML = logo ? '<img src="' + esc(logo) + '" alt="">' : esc(s.logoEmoji || '✏️');
  }

  function catById(id) {
    return S.data.categories.filter(function (c) { return c.id === id; })[0] || null;
  }
  function findTool(id) { return S.data.tools.filter(function (t) { return t.id === id; })[0] || null; }
  function findNews(id) { return S.data.announcements.filter(function (n) { return n.id === id; })[0] || null; }
  function toolCount(catId) { return S.data.tools.filter(function (t) { return t.categoryId === catId; }).length; }

  function confirmBox(o) {
    return new Promise(function (resolve) {
      var d = $('#dlgConfirm');
      d.innerHTML = '<form method="dialog" class="dlg-form">' +
        '<h2 class="dlg-title" id="cfTitle">' + esc(o.title) + '</h2>' +
        '<p>' + esc(o.message) + '</p>' +
        '<div class="dlg-actions">' +
        '<button type="submit" value="cancel" class="btn btn-ghost" autofocus>Hủy</button>' +
        '<button type="submit" value="ok" class="btn ' + (o.danger ? 'btn-solid-danger' : 'btn-primary') + '">' + esc(o.ok || 'Đồng ý') + '</button>' +
        '</div></form>';
      d.setAttribute('aria-labelledby', 'cfTitle');
      d.returnValue = '';
      d.onclose = function () { d.onclose = null; resolve(d.returnValue === 'ok'); };
      if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    });
  }

  function closeDlg() {
    var d = $('#dlg');
    if (typeof d.close === 'function') d.close(); else d.removeAttribute('open');
  }

  function formErr(root, msg) {
    var el = $('[data-err]', root);
    if (!el) return;
    if (msg) { el.textContent = msg; el.hidden = false; el.scrollIntoView({ block: 'nearest' }); }
    else { el.hidden = true; el.textContent = ''; }
  }

  /* Hộp thoại biểu mẫu: onSubmit trả về chuỗi lỗi, hoặc rỗng nếu thành công */
  function openForm(title, bodyHtml, onSubmit, onOpen) {
    var d = $('#dlg');
    d.innerHTML = '<form class="dlg-form" novalidate>' +
      '<div class="dlg-head"><h2 class="dlg-title" id="dlgTitle">' + esc(title) + '</h2>' +
      '<button type="button" class="icon-btn" data-dclose aria-label="Đóng">✕</button></div>' +
      '<div class="dlg-body">' + bodyHtml + '</div>' +
      '<p class="form-error" data-err role="alert" hidden></p>' +
      '<div class="dlg-actions"><button type="button" class="btn btn-ghost" data-dclose>Hủy</button>' +
      '<button type="submit" class="btn btn-primary">Lưu</button></div></form>';
    d.setAttribute('aria-labelledby', 'dlgTitle');
    var form = $('form', d);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = onSubmit(form);
      if (err) formErr(form, err); else closeDlg();
    });
    $$('[data-dclose]', d).forEach(function (b) { b.addEventListener('click', closeDlg); });
    form.addEventListener('input', function () { formErr(form, ''); });
    if (onOpen) onOpen(d);
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    var first = $('input:not([type=hidden]):not([type=file]):not([type=checkbox]), textarea', form);
    if (first) first.focus();
  }

  function v(form, name) { return form.elements[name] ? String(form.elements[name].value) : ''; }
  function checked(form, name) { return !!(form.elements[name] && form.elements[name].checked); }

  /* ----- Ô chọn ảnh dùng chung ----- */
  function imgEditorHtml(p, label, hint, isLogo) {
    return '<div class="field"><span class="label">' + label + '</span>' +
      '<div class="img-edit"><div class="img-prev' + (isLogo ? ' logo' : '') + '" id="' + p + 'Prev"></div>' +
      '<div class="img-ctl"><input type="file" id="' + p + 'File" accept="image/*" hidden>' +
      '<div class="row-btns"><button type="button" class="btn btn-ghost btn-sm" id="' + p + 'Pick">Chọn ảnh từ máy</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="' + p + 'Clear">Bỏ ảnh</button></div>' +
      '<input class="input" id="' + p + 'Url" placeholder="Hoặc dán link ảnh (https://...)" inputmode="url" aria-label="Link ảnh"></div></div>' +
      '<span class="hint">' + hint + '</span></div>';
  }

  function bindImgEditor(root, p, get, set, readOpts) {
    var prev = $('#' + p + 'Prev', root), file = $('#' + p + 'File', root), url = $('#' + p + 'Url', root);
    function paint() {
      var s = E.safeImg(get());
      prev.innerHTML = s ? '<img src="' + esc(s) + '" alt="Ảnh xem trước">' : 'Chưa có ảnh';
      var im = $('img', prev);
      if (im) im.addEventListener('error', function () { prev.textContent = 'Không tải được ảnh từ link này'; });
    }
    url.value = /^data:/i.test(get()) ? '' : get();
    paint();
    $('#' + p + 'Pick', root).addEventListener('click', function () { file.click(); });
    $('#' + p + 'Clear', root).addEventListener('click', function () { set(''); url.value = ''; paint(); });
    url.addEventListener('input', function () { set(E.normalizeUrl(url.value.trim())); });
    url.addEventListener('change', paint);
    file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      file.value = '';
      if (!f) return;
      prev.textContent = 'Đang xử lý ảnh…';
      E.readImage(f, readOpts).then(function (d) { set(d); url.value = ''; paint(); })
        .catch(function (err) { toast(err.message, 'err'); paint(); });
    });
  }

  /* ======================= Đăng nhập ======================= */
  function showLogin() {
    $('#app').hidden = true;
    $('#login').hidden = false;
    $('#pw').value = '';
    $('#pw').focus();
  }

  function loginErr(msg) {
    var el = $('#loginErr');
    el.textContent = msg; el.hidden = !msg;
  }

  function enter() {
    $('#login').hidden = true;
    $('#app').hidden = false;
    $('#view').innerHTML = '<p class="a-lead">Đang tải dữ liệu…</p>';
    E.loadForAdmin().then(function (r) {
      S.data = r.data; S.from = r.from;
      var h = location.hash.replace('#', '');
      if (NAV.some(function (n) { return n.id === h; })) S.view = h;
      applyBrand(); updateState(); render();
    });
  }

  /* ======================= Điều hướng ======================= */
  function go(view) {
    S.view = view;
    try { history.replaceState(null, '', '#' + view); } catch (e) { /* bỏ qua */ }
    render();
    window.scrollTo(0, 0);
    $('#view').focus({ preventScroll: true });
  }

  function renderNav() {
    $('#nav').innerHTML = NAV.map(function (n) {
      return '<button type="button" data-act="go" data-to="' + n.id + '"' + (S.view === n.id ? ' aria-current="page"' : '') + '>' +
        '<span aria-hidden="true">' + n.icon + '</span>' + esc(n.label) + '</button>';
    }).join('');
  }

  function render() {
    renderNav();
    var views = { overview: vOverview, tools: vTools, cats: vCats, news: vNews, site: vSite, publish: vPublish, security: vSecurity };
    var after = { tools: afterTools, site: afterSite };
    $('#view').innerHTML = (views[S.view] || vOverview)();
    if (after[S.view]) after[S.view]();
  }

  function head(title, lead, actionHtml) {
    return '<div class="a-head"><div><h1 class="a-h1">' + esc(title) + '</h1>' +
      (lead ? '<p class="a-lead">' + esc(lead) + '</p>' : '') + '</div>' + (actionHtml || '') + '</div>';
  }

  function emptyList(title, text, btn) {
    return '<div class="empty-list"><strong>' + esc(title) + '</strong>' + esc(text) + (btn ? '<div class="btn-row" style="justify-content:center">' + btn + '</div>' : '') + '</div>';
  }

  /* ======================= Tổng quan ======================= */
  function vOverview() {
    var d = S.data, cfg = E.getAdminCfg();
    var shown = d.tools.filter(function (t) { return t.visible; }).length;
    var h = head('Tổng quan', 'Quản lý công cụ, hình ảnh, liên kết và thông báo hiển thị trên trang Edutools.');
    if (!cfg.changed) {
      h += '<div class="notice warn"><strong>Hãy đổi mật khẩu mặc định.</strong> Mật khẩu hiện tại là “' + esc(E.DEFAULT_PASSWORD) + '”, ai biết cũng vào được trang này.<br>' +
        '<button type="button" class="btn btn-primary btn-sm" data-act="go" data-to="security">Đổi mật khẩu</button></div>';
    }
    if (S.from === 'default') {
      h += '<div class="notice info">Trang đang dùng dữ liệu mẫu. Bạn có thể sửa, xóa từng mục, hoặc bắt đầu với danh sách trống ở mục “Xuất bản và sao lưu”.</div>';
    }
    h += '<div class="stats">' +
      '<div class="stat"><b>' + d.tools.length + '</b><span>Công cụ</span></div>' +
      '<div class="stat"><b>' + shown + '</b><span>Đang hiển thị</span></div>' +
      '<div class="stat"><b>' + d.categories.length + '</b><span>Danh mục</span></div>' +
      '<div class="stat"><b>' + d.announcements.length + '</b><span>Thông báo</span></div></div>';
    h += '<div class="panel"><h2>Ba bước để cập nhật trang</h2>' +
      '<ol class="steps">' +
      '<li>Thêm hoặc sửa công cụ ở mục <b>Công cụ</b>. Bấm Lưu là xong, thay đổi được giữ lại trong trình duyệt này dưới dạng bản nháp.</li>' +
      '<li>Bấm <b>Xem thử trang chủ</b> để kiểm tra bản nháp trông thế nào.</li>' +
      '<li>Bấm <b>Xuất bản</b> để mọi người cùng thấy thay đổi.</li></ol>' +
      '<div class="btn-row"><button type="button" class="btn btn-primary" data-act="tool-add">Thêm công cụ</button>' +
      '<button type="button" class="btn btn-ghost" data-act="preview">Xem thử trang chủ</button>' +
      '<button type="button" class="btn btn-ghost" data-act="go" data-to="publish">Đến mục xuất bản</button></div></div>';
    return h;
  }

  /* ======================= Công cụ ======================= */
  function vTools() {
    var opts = '<option value="">Tất cả danh mục</option>' + S.data.categories.map(function (c) {
      return '<option value="' + esc(c.id) + '"' + (S.tcat === c.id ? ' selected' : '') + '>' + esc(c.icon + ' ' + c.name) + '</option>';
    }).join('') + '<option value="__none"' + (S.tcat === '__none' ? ' selected' : '') + '>Chưa phân nhóm</option>';
    return head('Công cụ', 'Thêm đường link, ảnh minh họa và mô tả cho từng công cụ.',
        '<button type="button" class="btn btn-primary" data-act="tool-add">Thêm công cụ</button>') +
      '<div class="filters"><label class="sr-only" for="tq">Tìm công cụ</label>' +
      '<input class="input" id="tq" type="search" placeholder="Tìm theo tên, link hoặc từ khóa" value="' + esc(S.tq) + '">' +
      '<label class="sr-only" for="tc">Lọc theo danh mục</label><select class="select" id="tc">' + opts + '</select></div>' +
      '<ul class="list" id="toolList"></ul>';
  }

  function filteredTools() {
    var q = E.fold(S.tq.trim());
    return S.data.tools.filter(function (t) {
      if (S.tcat === '__none') { if (catById(t.categoryId)) return false; }
      else if (S.tcat && t.categoryId !== S.tcat) return false;
      if (!q) return true;
      return E.fold([t.title, t.desc, t.url, t.tags.join(' ')].join(' ')).indexOf(q) > -1;
    });
  }

  function toolRow(t, i, n) {
    var c = catById(t.categoryId) || { icon: '🧩', name: 'Chưa phân nhóm', color: '#55607f' };
    var img = E.safeImg(t.image), u = E.safeUrl(t.url);
    var idA = ' data-id="' + esc(t.id) + '"';
    return '<li class="row' + (t.visible ? '' : ' is-off') + '"' + idA + ' style="--c:' + esc(c.color) + '">' +
      '<div class="thumb">' + (img ? '<img src="' + esc(img) + '" alt="" loading="lazy">' : '<span aria-hidden="true">' + esc(c.icon) + '</span>') + '</div>' +
      '<div class="row-main"><div class="row-title">' + esc(t.title) +
      (t.featured ? '<span class="flag">⭐ Nổi bật</span>' : '') +
      (t.visible ? '' : '<span class="flag off">Đang ẩn</span>') +
      '<span class="flag cat">' + esc(c.icon + ' ' + c.name) + '</span></div>' +
      '<div class="row-sub">' + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(t.url) + '</a>' : 'Chưa có liên kết') + '</div></div>' +
      '<div class="row-actions">' +
      '<button type="button" class="mini" data-act="tool-up"' + idA + ' aria-label="Chuyển “' + esc(t.title) + '” lên trên"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
      '<button type="button" class="mini" data-act="tool-down"' + idA + ' aria-label="Chuyển “' + esc(t.title) + '” xuống dưới"' + (i === n - 1 ? ' disabled' : '') + '>↓</button>' +
      '<button type="button" class="mini" data-act="tool-edit"' + idA + '>Sửa</button>' +
      '<button type="button" class="mini" data-act="tool-dup"' + idA + '>Nhân đôi</button>' +
      '<button type="button" class="mini danger" data-act="tool-del"' + idA + '>Xóa</button></div></li>';
  }

  function renderToolList() {
    var ul = $('#toolList');
    if (!ul) return;
    if (!S.data.tools.length) {
      ul.innerHTML = '<li>' + emptyList('Chưa có công cụ nào', 'Bấm “Thêm công cụ” để đưa đường link đầu tiên lên trang.',
        '<button type="button" class="btn btn-primary" data-act="tool-add">Thêm công cụ</button>') + '</li>';
      return;
    }
    var list = filteredTools();
    if (!list.length) {
      ul.innerHTML = '<li>' + emptyList('Không có công cụ nào khớp', 'Thử gõ từ khóa ngắn hơn hoặc chọn “Tất cả danh mục”.') + '</li>';
      return;
    }
    ul.innerHTML = list.map(function (t, i) { return toolRow(t, i, list.length); }).join('');
  }

  function afterTools() {
    renderToolList();
    $('#tq').addEventListener('input', function (e) { S.tq = e.target.value; renderToolList(); });
    $('#tc').addEventListener('change', function (e) { S.tcat = e.target.value; renderToolList(); });
  }

  function rowBtn(id, act) {
    return $$('[data-act="' + act + '"]', $('#view')).filter(function (b) { return b.getAttribute('data-id') === id; })[0];
  }

  function moveItem(arr, list, id, dir) {
    var i = -1;
    list.forEach(function (x, k) { if (x.id === id) i = k; });
    var j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return false;
    var a = arr.indexOf(list[i]), b = arr.indexOf(list[j]);
    var tmp = arr[a]; arr[a] = arr[b]; arr[b] = tmp;
    return true;
  }

  function editTool(id) {
    var t = id ? findTool(id) : null;
    var cur = t || { title: '', url: '', desc: '', categoryId: (S.data.categories[0] || {}).id || '', tags: [], guide: '', image: '', featured: false, visible: true, newTab: true };
    var img = cur.image || '';
    var catOpts = S.data.categories.map(function (c) {
      return '<option value="' + esc(c.id) + '"' + (c.id === cur.categoryId ? ' selected' : '') + '>' + esc(c.icon + ' ' + c.name) + '</option>';
    }).join('') + '<option value=""' + (catById(cur.categoryId) ? '' : ' selected') + '>Chưa phân nhóm</option>';

    var body =
      '<div class="field"><label for="f-title">Tên công cụ (bắt buộc)</label>' +
      '<input class="input" id="f-title" name="title" maxlength="120" value="' + esc(cur.title) + '"></div>' +
      '<div class="field"><label for="f-url">Liên kết (bắt buộc)</label>' +
      '<input class="input" id="f-url" name="url" inputmode="url" placeholder="https://..." value="' + esc(cur.url) + '">' +
      '<span class="hint">Dán địa chỉ trang web hoặc ứng dụng. Có thể dùng đường dẫn trong cùng trang, ví dụ sodiem/index.html.</span></div>' +
      '<div class="form-grid two">' +
      '<div class="field"><label for="f-cat">Danh mục</label><select class="select" id="f-cat" name="categoryId">' + catOpts + '</select></div>' +
      '<div class="field"><label for="f-tags">Từ khóa</label><input class="input" id="f-tags" name="tags" placeholder="Toán, hình học, đồ thị" value="' + esc(cur.tags.join(', ')) + '">' +
      '<span class="hint">Cách nhau bằng dấu phẩy, giúp tìm kiếm nhanh hơn.</span></div></div>' +
      '<div class="field"><label for="f-desc">Mô tả ngắn</label><textarea class="textarea" id="f-desc" name="desc" rows="3" maxlength="600">' + esc(cur.desc) + '</textarea></div>' +
      '<div class="field"><label for="f-guide">Hướng dẫn sử dụng (không bắt buộc)</label>' +
      '<textarea class="textarea" id="f-guide" name="guide" rows="4" maxlength="4000" placeholder="Mỗi bước một dòng">' + esc(cur.guide) + '</textarea></div>' +
      imgEditorHtml('ti', 'Ảnh minh họa', 'Ảnh chọn từ máy sẽ tự thu nhỏ còn tối đa 800 px để trang tải nhanh. Nếu để trống, trang chủ hiện biểu tượng của danh mục.', false) +
      '<div class="checks">' +
      '<label class="check"><input type="checkbox" name="featured"' + (cur.featured ? ' checked' : '') + '> Đánh dấu nổi bật</label>' +
      '<label class="check"><input type="checkbox" name="visible"' + (cur.visible ? ' checked' : '') + '> Hiển thị trên trang chủ</label>' +
      '<label class="check"><input type="checkbox" name="newTab"' + (cur.newTab ? ' checked' : '') + '> Mở trong tab mới</label></div>';

    openForm(t ? 'Sửa công cụ' : 'Thêm công cụ', body, function (form) {
      var title = v(form, 'title').trim();
      if (!title) return 'Hãy nhập tên công cụ.';
      var url = E.normalizeUrl(v(form, 'url'));
      if (!url) return 'Hãy nhập liên kết của công cụ.';
      if (!E.safeUrl(url) || !(/^(https?:|mailto:|tel:)/i.test(url) || /[./]/.test(url))) {
        return 'Liên kết chưa hợp lệ. Hãy nhập địa chỉ bắt đầu bằng https://';
      }
      var image = String(img || '').trim();
      if (image && !E.safeImg(image)) return 'Link ảnh chưa hợp lệ. Hãy dán địa chỉ bắt đầu bằng https:// hoặc chọn ảnh từ máy.';
      var fields = {
        title: title, url: url, desc: v(form, 'desc').trim(), guide: v(form, 'guide').trim(), image: image,
        categoryId: v(form, 'categoryId'),
        tags: v(form, 'tags').split(',').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 12),
        featured: checked(form, 'featured'), visible: checked(form, 'visible'), newTab: checked(form, 'newTab')
      };
      if (t) Object.assign(t, fields);
      else S.data.tools.push(Object.assign({ id: E.uid('t'), createdAt: new Date().toISOString() }, fields));
      save(t ? 'Đã lưu thay đổi.' : 'Đã thêm công cụ.');
      render();
      return '';
    }, function (d) {
      bindImgEditor(d, 'ti', function () { return img; }, function (x) { img = x; }, { maxW: 800, quality: 0.8, type: 'image/jpeg' });
    });
  }

  function dupTool(id) {
    var t = findTool(id);
    if (!t) return;
    var copy = Object.assign({}, t, { id: E.uid('t'), title: t.title + ' (bản sao)', tags: t.tags.slice(), createdAt: new Date().toISOString() });
    S.data.tools.splice(S.data.tools.indexOf(t) + 1, 0, copy);
    save('Đã nhân đôi công cụ.');
    render();
  }

  function delTool(id) {
    var t = findTool(id);
    if (!t) return;
    confirmBox({ title: 'Xóa công cụ?', message: 'Công cụ “' + t.title + '” sẽ bị xóa khỏi bản nháp. Nếu chỉ muốn tạm ẩn, hãy bỏ chọn “Hiển thị trên trang chủ” khi sửa.', ok: 'Xóa công cụ', danger: true })
      .then(function (ok) {
        if (!ok) return;
        S.data.tools.splice(S.data.tools.indexOf(t), 1);
        save('Đã xóa công cụ.');
        render();
      });
  }

  /* ======================= Danh mục ======================= */
  function vCats() {
    var cats = S.data.categories;
    var h = head('Danh mục', 'Nhóm các công cụ lại để người xem dễ tìm. Mỗi danh mục có biểu tượng và màu riêng.',
      '<button type="button" class="btn btn-primary" data-act="cat-add">Thêm danh mục</button>');
    if (!cats.length) return h + emptyList('Chưa có danh mục nào', 'Hãy tạo danh mục đầu tiên, ví dụ “Toán và khoa học”.', '<button type="button" class="btn btn-primary" data-act="cat-add">Thêm danh mục</button>');
    h += '<ul class="list">' + cats.map(function (c, i) {
      var idA = ' data-id="' + esc(c.id) + '"', n = toolCount(c.id);
      return '<li class="row" style="--c:' + esc(c.color) + '"><div class="thumb" aria-hidden="true">' + esc(c.icon) + '</div>' +
        '<div class="row-main"><div class="row-title">' + esc(c.name) + '</div><div class="row-sub">' + n + ' công cụ</div></div>' +
        '<div class="row-actions">' +
        '<button type="button" class="mini" data-act="cat-up"' + idA + ' aria-label="Chuyển “' + esc(c.name) + '” lên trên"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
        '<button type="button" class="mini" data-act="cat-down"' + idA + ' aria-label="Chuyển “' + esc(c.name) + '” xuống dưới"' + (i === cats.length - 1 ? ' disabled' : '') + '>↓</button>' +
        '<button type="button" class="mini" data-act="cat-edit"' + idA + '>Sửa</button>' +
        '<button type="button" class="mini danger" data-act="cat-del"' + idA + '>Xóa</button></div></li>';
    }).join('') + '</ul>';
    return h;
  }

  function editCat(id) {
    var c = id ? catById(id) : null;
    var cur = c || { name: '', icon: '📚', color: E.COLORS[S.data.categories.length % E.COLORS.length] };
    var palette = E.COLORS.slice();
    if (palette.indexOf(cur.color) < 0) palette.push(cur.color);
    var body =
      '<div class="field"><label for="c-name">Tên danh mục (bắt buộc)</label><input class="input" id="c-name" name="name" maxlength="80" value="' + esc(cur.name) + '"></div>' +
      '<div class="field"><label for="c-icon">Biểu tượng</label><input class="input" id="c-icon" name="icon" maxlength="8" value="' + esc(cur.icon) + '" style="max-width:120px">' +
      '<div class="emoji-pick" role="group" aria-label="Chọn nhanh biểu tượng">' + EMOJIS.map(function (e) {
        return '<button type="button" data-emoji="' + e + '" aria-label="Dùng biểu tượng ' + e + '">' + e + '</button>';
      }).join('') + '</div></div>' +
      '<div class="field"><span class="label">Màu</span><div class="swatches" role="radiogroup" aria-label="Chọn màu danh mục">' + palette.map(function (col, i) {
        return '<label style="--c:' + esc(col) + '"><input type="radio" name="color" value="' + esc(col) + '"' + (col === cur.color ? ' checked' : '') + ' aria-label="Màu ' + (i + 1) + '"><span></span></label>';
      }).join('') + '</div></div>';
    openForm(c ? 'Sửa danh mục' : 'Thêm danh mục', body, function (form) {
      var name = v(form, 'name').trim();
      if (!name) return 'Hãy nhập tên danh mục.';
      var fields = { name: name, icon: v(form, 'icon').trim() || '📁', color: v(form, 'color') || cur.color };
      if (c) Object.assign(c, fields); else S.data.categories.push(Object.assign({ id: E.uid('c') }, fields));
      save(c ? 'Đã lưu danh mục.' : 'Đã thêm danh mục.');
      render();
      return '';
    }, function (d) {
      $$('[data-emoji]', d).forEach(function (b) {
        b.addEventListener('click', function () { $('#c-icon', d).value = b.getAttribute('data-emoji'); });
      });
    });
  }

  function delCat(id) {
    var c = catById(id);
    if (!c) return;
    var n = toolCount(id);
    confirmBox({
      title: 'Xóa danh mục?',
      message: 'Danh mục “' + c.name + '” sẽ bị xóa.' + (n ? ' ' + n + ' công cụ trong danh mục này sẽ chuyển sang nhóm “Khác”.' : ''),
      ok: 'Xóa danh mục', danger: true
    }).then(function (ok) {
      if (!ok) return;
      S.data.tools.forEach(function (t) { if (t.categoryId === id) t.categoryId = ''; });
      S.data.categories.splice(S.data.categories.indexOf(c), 1);
      save('Đã xóa danh mục.');
      render();
    });
  }

  /* ======================= Thông báo ======================= */
  function vNews() {
    var list = S.data.announcements;
    var h = head('Thông báo', 'Tin ngắn hiện ở đầu trang chủ dưới dạng giấy ghi chú. Thông báo ghim sẽ luôn nằm trước.',
      '<button type="button" class="btn btn-primary" data-act="news-add">Thêm thông báo</button>');
    if (!list.length) return h + emptyList('Chưa có thông báo nào', 'Thông báo hữu ích để báo công cụ mới, lịch bảo trì hoặc lời nhắn cho học sinh.', '<button type="button" class="btn btn-primary" data-act="news-add">Thêm thông báo</button>');
    h += '<ul class="list">' + list.map(function (n) {
      var idA = ' data-id="' + esc(n.id) + '"';
      return '<li class="row' + (n.visible ? '' : ' is-off') + '"><div class="thumb" aria-hidden="true">' + (n.pinned ? '📌' : '📣') + '</div>' +
        '<div class="row-main"><div class="row-title">' + esc(n.title) + (n.pinned ? '<span class="flag">Ghim</span>' : '') + (n.visible ? '' : '<span class="flag off">Đang ẩn</span>') + '</div>' +
        '<div class="row-sub">' + esc((n.date ? E.fmtDate(n.date) + ' - ' : '') + (n.content || '').replace(/\s+/g, ' ')) + '</div></div>' +
        '<div class="row-actions"><button type="button" class="mini" data-act="news-edit"' + idA + '>Sửa</button>' +
        '<button type="button" class="mini danger" data-act="news-del"' + idA + '>Xóa</button></div></li>';
    }).join('') + '</ul>';
    return h;
  }

  function editNews(id) {
    var n = id ? findNews(id) : null;
    var cur = n || { title: '', content: '', date: E.today(), link: '', pinned: false, visible: true };
    var body =
      '<div class="field"><label for="n-title">Tiêu đề (bắt buộc)</label><input class="input" id="n-title" name="title" maxlength="160" value="' + esc(cur.title) + '"></div>' +
      '<div class="field"><label for="n-content">Nội dung</label><textarea class="textarea" id="n-content" name="content" rows="4" maxlength="2000">' + esc(cur.content) + '</textarea></div>' +
      '<div class="form-grid two"><div class="field"><label for="n-date">Ngày đăng</label><input class="input" id="n-date" name="date" type="date" value="' + esc(cur.date) + '"></div>' +
      '<div class="field"><label for="n-link">Liên kết kèm theo (không bắt buộc)</label><input class="input" id="n-link" name="link" inputmode="url" placeholder="https://..." value="' + esc(cur.link) + '"></div></div>' +
      '<div class="checks"><label class="check"><input type="checkbox" name="pinned"' + (cur.pinned ? ' checked' : '') + '> Ghim lên đầu</label>' +
      '<label class="check"><input type="checkbox" name="visible"' + (cur.visible ? ' checked' : '') + '> Hiển thị trên trang chủ</label></div>';
    openForm(n ? 'Sửa thông báo' : 'Thêm thông báo', body, function (form) {
      var title = v(form, 'title').trim();
      if (!title) return 'Hãy nhập tiêu đề thông báo.';
      var link = E.normalizeUrl(v(form, 'link'));
      if (link && !E.safeUrl(link)) return 'Liên kết chưa hợp lệ. Hãy nhập địa chỉ bắt đầu bằng https://';
      var fields = { title: title, content: v(form, 'content').trim(), date: v(form, 'date'), link: link, pinned: checked(form, 'pinned'), visible: checked(form, 'visible') };
      if (n) Object.assign(n, fields); else S.data.announcements.unshift(Object.assign({ id: E.uid('n') }, fields));
      save(n ? 'Đã lưu thông báo.' : 'Đã thêm thông báo.');
      render();
      return '';
    });
  }

  function delNews(id) {
    var n = findNews(id);
    if (!n) return;
    confirmBox({ title: 'Xóa thông báo?', message: 'Thông báo “' + n.title + '” sẽ bị xóa khỏi bản nháp.', ok: 'Xóa thông báo', danger: true }).then(function (ok) {
      if (!ok) return;
      S.data.announcements.splice(S.data.announcements.indexOf(n), 1);
      save('Đã xóa thông báo.');
      render();
    });
  }

  /* ======================= Thông tin trang ======================= */
  var logoState = '';

  function vSite() {
    var s = S.data.site;
    logoState = s.logoImage || '';
    function f(name, label, val, hint, type) {
      return '<div class="field"><label for="s-' + name + '">' + label + '</label><input class="input" id="s-' + name + '" name="' + name + '" ' + (type ? 'type="' + type + '" ' : '') + 'value="' + esc(val) + '">' + (hint ? '<span class="hint">' + hint + '</span>' : '') + '</div>';
    }
    return head('Thông tin trang', 'Tên trang, lời giới thiệu, logo và cách liên hệ hiển thị trên trang chủ.') +
      '<form class="panel" id="siteForm" novalidate><div class="form-grid">' +
      '<div class="form-grid two">' + f('name', 'Tên trang (bắt buộc)', s.name) + f('slogan', 'Khẩu hiệu ngắn', s.slogan) + '</div>' +
      f('heroTitle', 'Tiêu đề lớn ở đầu trang', s.heroTitle) +
      '<div class="field"><label for="s-heroText">Dòng giới thiệu dưới tiêu đề</label><textarea class="textarea" id="s-heroText" name="heroText" rows="2">' + esc(s.heroText) + '</textarea></div>' +
      '<div class="form-grid two">' + f('logoEmoji', 'Biểu tượng logo (khi không dùng ảnh)', s.logoEmoji, 'Một emoji, ví dụ ✏️ hoặc 📚.') + '</div>' +
      imgEditorHtml('lg', 'Ảnh logo (không bắt buộc)', 'Nếu có ảnh logo, trang sẽ dùng ảnh thay cho biểu tượng. Ảnh tự thu nhỏ còn 256 px.', true) +
      '<div class="field"><label for="s-about">Giới thiệu về trang</label><textarea class="textarea" id="s-about" name="about" rows="5">' + esc(s.about) + '</textarea><span class="hint">Xuống dòng để tách đoạn.</span></div>' +
      '<div class="form-grid two">' + f('contactEmail', 'Email liên hệ', s.contactEmail, '', 'email') + f('contactZalo', 'Zalo (số điện thoại hoặc link)', s.contactZalo) + '</div>' +
      f('contactFacebook', 'Facebook (link)', s.contactFacebook) +
      f('footerNote', 'Dòng ghi chú thêm ở chân trang', s.footerNote, 'Không bắt buộc.') +
      '</div><p class="form-error" data-err role="alert" hidden style="margin-top:14px"></p>' +
      '<div class="btn-row"><button type="submit" class="btn btn-primary">Lưu thông tin trang</button></div>' +
      '<p class="copy-note">Dòng bản quyền ở chân trang được cố định: ' + esc(E.COPYRIGHT) + '</p></form>';
  }

  function afterSite() {
    bindImgEditor($('#view'), 'lg', function () { return logoState; }, function (x) { logoState = x; }, { maxW: 256, quality: 0.92, type: 'image/png' });
  }

  function submitSite(form) {
    var name = v(form, 'name').trim();
    if (!name) return formErr(form, 'Hãy nhập tên trang.');
    var email = v(form, 'contactEmail').trim();
    if (email && !/^[^\s@<>"']+@[^\s@<>"']+$/.test(email)) return formErr(form, 'Email liên hệ chưa đúng định dạng.');
    var logo = String(logoState || '').trim();
    if (logo && !E.safeImg(logo)) return formErr(form, 'Link ảnh logo chưa hợp lệ.');
    var fb = v(form, 'contactFacebook').trim();
    if (fb && !E.safeUrl(E.normalizeUrl(fb))) return formErr(form, 'Link Facebook chưa hợp lệ.');
    formErr(form, '');
    Object.assign(S.data.site, {
      name: name, slogan: v(form, 'slogan').trim(), heroTitle: v(form, 'heroTitle').trim(), heroText: v(form, 'heroText').trim(),
      logoEmoji: v(form, 'logoEmoji').trim() || '✏️', logoImage: logo, about: v(form, 'about').trim(),
      contactEmail: email, contactZalo: v(form, 'contactZalo').trim(), contactFacebook: fb, footerNote: v(form, 'footerNote').trim()
    });
    save('Đã lưu thông tin trang.');
    applyBrand();
  }

  /* ======================= Xuất bản và sao lưu ======================= */
  function guessRepo() {
    var host = location.hostname, out = { owner: '', repo: '' };
    if (/\.github\.io$/i.test(host)) {
      out.owner = host.split('.')[0];
      var seg = location.pathname.split('/').filter(Boolean)[0];
      out.repo = !seg || /\.html?$/i.test(seg) ? host : seg;
    }
    return out;
  }

  function ghCfg() {
    var c = {};
    try { c = JSON.parse(E.store.get(E.KEYS.github) || '{}') || {}; } catch (e) { c = {}; }
    var g = guessRepo();
    return { owner: c.owner || g.owner, repo: c.repo || g.repo, branch: c.branch || 'main', path: c.path || 'data.json', token: c.token || '' };
  }

  function dataJson() { return JSON.stringify(S.data, null, 2); }

  function vPublish() {
    var c = ghCfg();
    var bytes = new Blob([dataJson()]).size;
    var kb = bytes < 1024 * 1024 ? Math.round(bytes / 1024) + ' KB' : (bytes / 1048576).toFixed(1) + ' MB';
    function f(name, label, val, extra) {
      return '<div class="field"><label for="g-' + name + '">' + label + '</label><input class="input" id="g-' + name + '" name="' + name + '" value="' + esc(val) + '" ' + (extra || '') + '></div>';
    }
    return head('Xuất bản và sao lưu', 'Đưa thay đổi lên trang để mọi người cùng thấy, hoặc lưu bản sao dữ liệu về máy.') +
      '<div class="notice ' + (E.isDirty() ? 'warn' : 'ok') + '">' + (E.isDirty() ? 'Bạn có thay đổi chưa xuất bản. Dung lượng dữ liệu hiện tại: ' + kb + '.' : 'Không có thay đổi nào đang chờ xuất bản. Dung lượng dữ liệu: ' + kb + '.') +
      (bytes > 3 * 1048576 ? '<br><strong>Dữ liệu khá nặng.</strong> Nên dùng ảnh nhỏ hơn hoặc dán link ảnh để trang tải nhanh.' : '') + '</div>' +

      '<form class="panel" id="ghForm" novalidate><h2>Cách 1. Đăng thẳng lên GitHub (khuyên dùng)</h2>' +
      '<p>Dữ liệu được ghi vào tệp data.json trong kho GitHub của trang. Sau khoảng 1 đến 2 phút, trang chủ tự cập nhật.</p>' +
      '<div class="form-grid two">' + f('owner', 'Tên tài khoản GitHub', c.owner, 'autocomplete="off"') + f('repo', 'Tên kho (repository)', c.repo, 'autocomplete="off"') +
      f('branch', 'Nhánh', c.branch, 'autocomplete="off"') + f('path', 'Đường dẫn tệp dữ liệu', c.path, 'autocomplete="off"') +
      '<div class="field span-2"><label for="g-token">Token truy cập GitHub</label><input class="input" id="g-token" name="token" type="password" autocomplete="off" value="' + esc(c.token) + '">' +
      '<span class="hint">Token chỉ được lưu trong trình duyệt này, không nằm trong dữ liệu trang.</span></div></div>' +
      '<details class="how"><summary>Cách tạo token (làm một lần)</summary><ol>' +
      '<li>Vào GitHub, mở Settings, chọn Developer settings, rồi Personal access tokens, chọn Fine-grained tokens.</li>' +
      '<li>Bấm Generate new token. Ở mục Repository access, chọn Only select repositories và chọn kho của trang.</li>' +
      '<li>Ở mục Permissions, đặt <b>Contents</b> thành <b>Read and write</b>, rồi tạo token và dán vào ô trên.</li></ol></details>' +
      '<div class="btn-row"><button type="submit" class="btn btn-primary" id="ghGo">Xuất bản lên GitHub</button>' +
      '<button type="button" class="btn btn-ghost" data-act="gh-save">Chỉ lưu cài đặt</button></div>' +
      '<p class="status" id="ghStatus" role="status"></p></form>' +

      '<div class="panel"><h2>Cách 2. Tải về rồi tự tải lên</h2>' +
      '<p>Dùng khi trang đặt ở nơi khác. Tải tệp data.json, rồi tải lên thay tệp data.json cũ trong thư mục gốc của trang.</p>' +
      '<div class="btn-row"><button type="button" class="btn btn-primary" data-act="download">Tải data.json về máy</button>' +
      '<button type="button" class="btn btn-ghost" data-act="import-pick">Nạp dữ liệu từ tệp data.json</button>' +
      '<input type="file" id="importFile" accept="application/json,.json" hidden></div></div>' +

      '<div class="panel"><h2>Dữ liệu</h2><p>Các thao tác dưới đây chỉ thay đổi bản nháp trong trình duyệt này. Chỉ khi xuất bản, trang chủ mới thay đổi.</p>' +
      '<div class="btn-row"><button type="button" class="btn btn-ghost" data-act="discard">Lấy lại bản đang xuất bản</button>' +
      '<button type="button" class="btn btn-danger" data-act="clear">Bắt đầu với danh sách trống</button>' +
      '<button type="button" class="btn btn-ghost" data-act="sample">Khôi phục dữ liệu mẫu</button></div></div>';
  }

  function readGh(form) {
    return { owner: v(form, 'owner').trim(), repo: v(form, 'repo').trim(), branch: v(form, 'branch').trim() || 'main', path: v(form, 'path').trim().replace(/^\/+/, '') || 'data.json', token: v(form, 'token').trim() };
  }

  function toBase64(str) {
    var bytes = new TextEncoder().encode(str), bin = '', chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    return btoa(bin);
  }

  function ghError(status) {
    var m = {
      401: 'Token không đúng hoặc đã hết hạn. Hãy tạo token mới.',
      403: 'Token chưa có quyền ghi. Hãy đặt quyền Contents là Read and write cho kho này.',
      404: 'Không tìm thấy kho hoặc nhánh. Kiểm tra lại tên tài khoản, tên kho, nhánh và quyền của token.',
      409: 'Có xung đột phiên bản. Hãy bấm xuất bản lần nữa.',
      422: 'GitHub từ chối dữ liệu. Kiểm tra lại tên nhánh và đường dẫn tệp.'
    };
    var err = new Error(m[status] || 'GitHub báo lỗi (mã ' + status + '). Hãy thử lại sau.');
    err.friendly = true;
    return err;
  }

  function ghPublish(cfg, text) {
    var url = 'https://api.github.com/repos/' + encodeURIComponent(cfg.owner) + '/' + encodeURIComponent(cfg.repo) + '/contents/' + cfg.path.split('/').map(encodeURIComponent).join('/');
    var headers = { 'Authorization': 'Bearer ' + cfg.token, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    return fetch(url + '?ref=' + encodeURIComponent(cfg.branch), { headers: headers }).then(function (r) {
      if (r.status === 200) return r.json().then(function (j) { return j.sha; });
      if (r.status === 404) return null;
      throw ghError(r.status);
    }).then(function (sha) {
      var body = { message: 'Cập nhật dữ liệu Edutools', content: toBase64(text), branch: cfg.branch };
      if (sha) body.sha = sha;
      return fetch(url, { method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, headers), body: JSON.stringify(body) });
    }).then(function (r) {
      if (!(r.status === 200 || r.status === 201)) throw ghError(r.status);
    }, function (err) {
      if (err && err.friendly) throw err;
      throw new Error('Không kết nối được tới GitHub. Hãy kiểm tra mạng rồi thử lại.');
    });
  }

  function submitGh(form) {
    var cfg = readGh(form), st = $('#ghStatus');
    st.className = 'status';
    if (!cfg.owner || !cfg.repo || !cfg.token) {
      st.className = 'status form-error'; st.textContent = 'Hãy nhập đủ tên tài khoản, tên kho và token.'; return;
    }
    E.store.set(E.KEYS.github, JSON.stringify(cfg));
    var btn = $('#ghGo');
    btn.disabled = true; st.textContent = 'Đang gửi dữ liệu lên GitHub…';
    S.data.updatedAt = new Date().toISOString();
    ghPublish(cfg, dataJson()).then(function () {
      E.saveDraft(S.data); E.setDirty(false); updateState();
      st.className = 'status notice ok';
      st.textContent = 'Đã xuất bản. Trang chủ sẽ cập nhật sau khoảng 1 đến 2 phút.';
      toast('Đã xuất bản lên GitHub.');
      btn.disabled = false;
    }).catch(function (err) {
      st.className = 'status form-error'; st.textContent = err.message; btn.disabled = false;
    });
  }

  function download() {
    S.data.updatedAt = new Date().toISOString();
    var blob = new Blob([dataJson()], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'data.json';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    E.saveDraft(S.data); E.setDirty(false); updateState();
    toast('Đã tải data.json. Hãy tải tệp này lên thay tệp cũ trong thư mục gốc của trang.');
  }

  function importFile(file) {
    if (!file) return;
    var fr = new FileReader();
    fr.onerror = function () { toast('Không đọc được tệp.', 'err'); };
    fr.onload = function () {
      var parsed;
      try { parsed = JSON.parse(fr.result); } catch (e) { toast('Tệp không phải là JSON hợp lệ.', 'err'); return; }
      if (!parsed || typeof parsed !== 'object' || (!parsed.tools && !parsed.site && !parsed.categories)) {
        toast('Tệp này không giống dữ liệu Edutools.', 'err'); return;
      }
      var d = E.normalize(parsed);
      confirmBox({ title: 'Nạp dữ liệu từ tệp?', message: 'Tệp có ' + d.tools.length + ' công cụ, ' + d.categories.length + ' danh mục, ' + d.announcements.length + ' thông báo. Dữ liệu hiện tại trong bản nháp sẽ được thay thế.', ok: 'Nạp dữ liệu' })
        .then(function (ok) {
          if (!ok) return;
          S.data = d; S.from = 'draft';
          save('Đã nạp dữ liệu từ tệp.'); applyBrand(); render();
        });
    };
    fr.readAsText(file);
  }

  function replaceData(d, msg) {
    S.data = d; S.from = 'draft';
    save(msg); applyBrand(); render();
  }

  /* ======================= Bảo mật ======================= */
  function vSecurity() {
    var cfg = E.getAdminCfg();
    function f(name, label, ac) {
      return '<div class="field"><label for="p-' + name + '">' + label + '</label><input class="input" id="p-' + name + '" name="' + name + '" type="password" autocomplete="' + ac + '"></div>';
    }
    return head('Bảo mật', 'Đổi mật khẩu vào trang quản trị.') +
      (cfg.changed ? '' : '<div class="notice warn">Bạn đang dùng mật khẩu mặc định “' + esc(E.DEFAULT_PASSWORD) + '”. Hãy đổi ngay.</div>') +
      '<form class="panel" id="pwForm" novalidate><div class="form-grid" style="max-width:420px">' +
      f('cur', 'Mật khẩu hiện tại', 'current-password') + f('n1', 'Mật khẩu mới (ít nhất 6 ký tự)', 'new-password') + f('n2', 'Nhập lại mật khẩu mới', 'new-password') +
      '</div><p class="form-error" data-err role="alert" hidden style="margin-top:14px"></p>' +
      '<div class="btn-row"><button type="submit" class="btn btn-primary">Đổi mật khẩu</button></div></form>' +
      '<div class="panel"><h2>Lưu ý về an toàn</h2>' +
      '<p>Mật khẩu này chỉ che trang quản trị trên từng trình duyệt, vì trang chạy hoàn toàn trên máy người dùng. Người ngoài không thể sửa trang công khai chỉ bằng mật khẩu này, vì việc xuất bản cần token GitHub hoặc quyền tải tệp lên nơi lưu trữ trang. Hãy giữ kín token và không dùng máy chung để lưu token.</p></div>';
  }

  function submitPw(form) {
    var cur = v(form, 'cur'), n1 = v(form, 'n1'), n2 = v(form, 'n2');
    if (!E.checkPassword(cur)) return formErr(form, 'Mật khẩu hiện tại chưa đúng.');
    if (n1.length < 6) return formErr(form, 'Mật khẩu mới cần ít nhất 6 ký tự.');
    if (n1 !== n2) return formErr(form, 'Hai lần nhập mật khẩu mới chưa giống nhau.');
    if (!E.setPassword(n1)) return formErr(form, 'Không lưu được mật khẩu vào trình duyệt.');
    toast('Đã đổi mật khẩu.');
    render();
  }

  /* ======================= Sự kiện chung ======================= */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.getAttribute('data-act'), id = b.getAttribute('data-id');
    switch (act) {
      case 'go': go(b.getAttribute('data-to')); break;
      case 'preview': window.open('index.html?preview=1', '_blank'); break;
      case 'tool-add': editTool(null); break;
      case 'tool-edit': editTool(id); break;
      case 'tool-dup': dupTool(id); break;
      case 'tool-del': delTool(id); break;
      case 'tool-up': case 'tool-down':
        if (moveItem(S.data.tools, filteredTools(), id, act === 'tool-up' ? -1 : 1)) {
          save(); renderToolList();
          var nb = rowBtn(id, act); if (nb && !nb.disabled) nb.focus(); else { nb = rowBtn(id, 'tool-edit'); if (nb) nb.focus(); }
        }
        break;
      case 'cat-add': editCat(null); break;
      case 'cat-edit': editCat(id); break;
      case 'cat-del': delCat(id); break;
      case 'cat-up': case 'cat-down':
        if (moveItem(S.data.categories, S.data.categories, id, act === 'cat-up' ? -1 : 1)) {
          save(); render();
          var cb = rowBtn(id, act); if (cb && !cb.disabled) cb.focus(); else { cb = rowBtn(id, 'cat-edit'); if (cb) cb.focus(); }
        }
        break;
      case 'news-add': editNews(null); break;
      case 'news-edit': editNews(id); break;
      case 'news-del': delNews(id); break;
      case 'gh-save':
        E.store.set(E.KEYS.github, JSON.stringify(readGh($('#ghForm')))); toast('Đã lưu cài đặt GitHub trên trình duyệt này.'); break;
      case 'download': download(); render(); break;
      case 'import-pick': $('#importFile').click(); break;
      case 'discard':
        confirmBox({ title: 'Lấy lại bản đang xuất bản?', message: 'Bản nháp hiện tại sẽ bị bỏ, dữ liệu được lấy lại từ tệp data.json đang có trên trang.', ok: 'Lấy lại bản đã xuất bản', danger: true }).then(function (ok) {
          if (!ok) return;
          E.fetchPublished().then(function (d) {
            E.clearDraft(); S.data = d; S.from = 'site'; applyBrand(); updateState(); render(); toast('Đã lấy lại bản đang xuất bản.');
          }).catch(function () { toast('Không đọc được data.json trên trang. Hãy mở trang qua địa chỉ web thay vì mở tệp trực tiếp.', 'err'); });
        });
        break;
      case 'clear':
        confirmBox({ title: 'Bắt đầu với danh sách trống?', message: 'Toàn bộ công cụ, danh mục và thông báo sẽ bị xóa khỏi bản nháp. Thông tin trang được giữ nguyên.', ok: 'Xóa tất cả', danger: true }).then(function (ok) {
          if (!ok) return;
          S.data.tools = []; S.data.categories = []; S.data.announcements = [];
          S.from = 'draft'; save('Đã xóa hết dữ liệu mẫu.'); render();
        });
        break;
      case 'sample':
        confirmBox({ title: 'Khôi phục dữ liệu mẫu?', message: 'Bản nháp hiện tại sẽ được thay bằng bộ dữ liệu mẫu ban đầu.', ok: 'Khôi phục', danger: true }).then(function (ok) {
          if (ok) replaceData(E.normalize(E.defaultData()), 'Đã khôi phục dữ liệu mẫu.');
        });
        break;
    }
  });

  document.addEventListener('input', function (e) {
    var f = e.target.form;
    if (f && (f.id === 'siteForm' || f.id === 'pwForm')) formErr(f, '');
  });

  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.id === 'siteForm') { e.preventDefault(); submitSite(f); }
    else if (f.id === 'ghForm') { e.preventDefault(); submitGh(f); }
    else if (f.id === 'pwForm') { e.preventDefault(); submitPw(f); }
  });

  document.addEventListener('change', function (e) {
    if (e.target.id === 'importFile') { importFile(e.target.files && e.target.files[0]); e.target.value = ''; }
  });

  /* Đóng hộp thoại khi bấm ra ngoài */
  ['#dlg', '#dlgConfirm'].forEach(function (sel) {
    var d = $(sel);
    d.addEventListener('mousedown', function (e) { d._down = e.target === d; });
    d.addEventListener('click', function (e) {
      if (e.target === d && d._down) { if (sel === '#dlg') closeDlg(); else d.close(); }
    });
  });

  /* ======================= Khởi động ======================= */
  $('#loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var now = Date.now();
    if (now < lockUntil) { loginErr('Bạn đã nhập sai nhiều lần. Hãy đợi ' + Math.ceil((lockUntil - now) / 1000) + ' giây rồi thử lại.'); return; }
    if (E.checkPassword($('#pw').value)) {
      fails = 0; loginErr(''); E.login(); enter();
    } else {
      fails++;
      if (fails >= 5) { lockUntil = Date.now() + 30000; fails = 0; loginErr('Sai mật khẩu 5 lần. Hãy đợi 30 giây rồi thử lại.'); }
      else loginErr('Mật khẩu chưa đúng. Hãy thử lại.');
      $('#pw').select();
    }
  });

  $('#pwToggle').addEventListener('click', function () {
    var inp = $('#pw'), show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    this.textContent = show ? 'Ẩn' : 'Hiện';
    this.setAttribute('aria-pressed', String(show));
  });

  $('#previewBtn').addEventListener('click', function () { window.open('index.html?preview=1', '_blank'); });
  $('#goPublish').addEventListener('click', function () { go('publish'); });
  $('#logoutBtn').addEventListener('click', function () { E.logout(); S.data = null; showLogin(); });

  var themeBtn = $('#themeBtn');
  function syncTheme() { themeBtn.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'; }
  themeBtn.addEventListener('click', function () { E.toggleTheme(); syncTheme(); });
  syncTheme();

  window.addEventListener('hashchange', function () {
    var h = location.hash.replace('#', '');
    if (S.data && h !== S.view && NAV.some(function (n) { return n.id === h; })) { S.view = h; render(); }
  });

  if (E.isLoggedIn()) enter(); else showLogin();
})();
