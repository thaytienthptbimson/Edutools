/*!
 * Edutools - lõi dữ liệu dùng chung cho trang chủ và trang quản trị.
 * Bản quyền thuộc về Thầy Tiến - GV Trường THPT Bỉm Sơn- Thanh Hóa
 */
(function (global) {
  'use strict';

  var COPYRIGHT = 'Bản quyền thuộc về Thầy Tiến - GV Trường THPT Bỉm Sơn- Thanh Hóa';
  var DEFAULT_PASSWORD = 'admin123';

  var KEYS = {
    draft: 'edutools_draft_v1',
    dirty: 'edutools_dirty_v1',
    admin: 'edutools_admin_v1',
    session: 'edutools_session_v1',
    github: 'edutools_github_v1',
    theme: 'edutools_theme'
  };

  /* Bảng màu danh mục (chữ trắng đều đạt độ tương phản >= 4.5) */
  var COLORS = ['#2f55c8', '#177a4f', '#b85a0a', '#c0306b', '#6a43bd', '#0a7683', '#c23a3a', '#8a6408'];

  var SITE_KEYS = ['name', 'slogan', 'heroTitle', 'heroText', 'logoEmoji', 'logoImage', 'about',
    'contactEmail', 'contactZalo', 'contactFacebook', 'footerNote'];

  /* ---------- Lưu trữ an toàn ---------- */
  function makeStore(getter) {
    return {
      get: function (k) { try { return getter().getItem(k); } catch (e) { return null; } },
      set: function (k, v) { try { getter().setItem(k, v); return true; } catch (e) { return false; } },
      del: function (k) { try { getter().removeItem(k); } catch (e) { /* bỏ qua */ } }
    };
  }
  var store = makeStore(function () { return global.localStorage; });
  var sess = makeStore(function () { return global.sessionStorage; });

  /* ---------- Tiện ích ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Chỉ cho phép http, https, mailto, tel hoặc đường dẫn tương đối */
  function safeUrl(u) {
    u = String(u == null ? '' : u).trim();
    if (!u) return '';
    if (/^(https?:\/\/|mailto:|tel:)/i.test(u)) return u;
    if (/^\/\//.test(u)) return '';
    if (/^[a-z][a-z0-9+.\-]*:/i.test(u)) return '';
    return u;
  }

  /* Ảnh: http, https, đường dẫn tương đối hoặc data:image/... */
  function safeImg(u) {
    u = String(u == null ? '' : u).trim();
    if (!u) return '';
    if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,/i.test(u)) return u;
    if (/^data:/i.test(u)) return '';
    return safeUrl(u);
  }

  /* Người dùng gõ "quizlet.com" thì tự thêm https:// */
  function normalizeUrl(u) {
    u = String(u == null ? '' : u).trim();
    if (!u) return '';
    if (/^(www\.)/i.test(u) ||
        /^[a-z0-9\-]+(\.[a-z0-9\-]+)*\.(com|vn|net|org|edu|io|app|me|dev|info|co|ai|gov)(\/.*)?$/i.test(u)) {
      return 'https://' + u;
    }
    return u;
  }

  function uid(prefix) {
    return (prefix || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function fmtDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
  }

  function today() {
    var d = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  /* Bỏ dấu tiếng Việt để tìm kiếm */
  function fold(s) {
    return String(s == null ? '' : s).toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd');
  }

  function str(v, max) {
    v = v == null ? '' : String(v);
    return max ? v.slice(0, max) : v;
  }

  /* ---------- SHA-256 thuần JS (dùng được cả khi mở bằng file://) ---------- */
  function sha256(message) {
    var utf8 = unescape(encodeURIComponent(message));
    var K = [], H = [], c = 2, i, j;
    function frac(x) { return ((x - Math.floor(x)) * 4294967296) | 0; }
    while (K.length < 64) {
      var prime = true;
      for (var d = 2; d * d <= c; d++) { if (c % d === 0) { prime = false; break; } }
      if (prime) {
        if (H.length < 8) H.push(frac(Math.pow(c, 1 / 2)));
        K.push(frac(Math.pow(c, 1 / 3)));
      }
      c++;
    }
    function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
    var bytes = [];
    for (i = 0; i < utf8.length; i++) bytes.push(utf8.charCodeAt(i));
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    var hi = Math.floor(bitLen / 4294967296), lo = bitLen >>> 0;
    for (i = 3; i >= 0; i--) bytes.push((hi >>> (i * 8)) & 255);
    for (i = 3; i >= 0; i--) bytes.push((lo >>> (i * 8)) & 255);
    var h = H.slice();
    for (var off = 0; off < bytes.length; off += 64) {
      var w = new Array(64);
      for (i = 0; i < 16; i++) {
        w[i] = (bytes[off + i * 4] << 24) | (bytes[off + i * 4 + 1] << 16) |
               (bytes[off + i * 4 + 2] << 8) | bytes[off + i * 4 + 3];
      }
      for (i = 16; i < 64; i++) {
        var s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        var s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      var a = h[0], b = h[1], cc = h[2], dd = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (i = 0; i < 64; i++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (hh + S1 + ch + K[i] + w[i]) | 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var maj = (a & b) ^ (a & cc) ^ (b & cc);
        var t2 = (S0 + maj) | 0;
        hh = g; g = f; f = e; e = (dd + t1) | 0; dd = cc; cc = b; b = a; a = (t1 + t2) | 0;
      }
      h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + cc) | 0; h[3] = (h[3] + dd) | 0;
      h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
    }
    var out = '';
    for (j = 0; j < 8; j++) out += ('00000000' + (h[j] >>> 0).toString(16)).slice(-8);
    return out;
  }

  /* ---------- Dữ liệu mẫu ---------- */
  function defaultData() {
    return {
      version: 1,
      updatedAt: '2026-10-27T00:00:00.000Z',
      site: {
        name: 'Edutools',
        slogan: 'Công cụ dạy và học',
        heroTitle: 'Kho công cụ cho việc dạy và học',
        heroText: 'Những công cụ trực tuyến thầy cô và học sinh dùng hằng ngày, gom về một chỗ. Bấm vào là mở.',
        logoEmoji: '✏️',
        logoImage: '',
        about: 'Edutools là nơi sưu tầm các công cụ, trang web và ứng dụng hữu ích cho giáo viên và học sinh.\nMỗi công cụ đều có mô tả ngắn và hướng dẫn nhanh để mở ra là dùng được ngay.\nCần thêm công cụ nào, thầy cô cứ liên hệ để được bổ sung.',
        contactEmail: '',
        contactZalo: '',
        contactFacebook: '',
        footerNote: ''
      },
      categories: [
        { id: 'kiem-tra', name: 'Trò chơi và kiểm tra', icon: '🎯', color: COLORS[3] },
        { id: 'toan-khoa-hoc', name: 'Toán và khoa học', icon: '🔬', color: COLORS[5] },
        { id: 'lop-hoc', name: 'Lớp học và cộng tác', icon: '🤝', color: COLORS[2] },
        { id: 'thiet-ke', name: 'Thiết kế và trình chiếu', icon: '🎨', color: COLORS[4] }
      ],
      tools: [
        {
          id: 't-kahoot', title: 'Kahoot!', categoryId: 'kiem-tra', url: 'https://kahoot.com',
          desc: 'Tạo trò chơi hỏi đáp trực tiếp, cả lớp cùng tham gia bằng điện thoại.',
          tags: ['trắc nghiệm', 'khởi động', 'trò chơi'], image: '', featured: true, visible: true, newTab: true,
          guide: '1. Tạo tài khoản giáo viên miễn phí.\n2. Soạn bộ câu hỏi hoặc chọn bộ có sẵn.\n3. Bấm Play và chiếu mã PIN lên màn hình.\n4. Học sinh vào kahoot.it, nhập mã PIN để chơi.',
          createdAt: '2026-10-01T08:00:00.000Z'
        },
        {
          id: 't-quizlet', title: 'Quizlet', categoryId: 'kiem-tra', url: 'https://quizlet.com',
          desc: 'Thẻ ghi nhớ và bài kiểm tra nhanh để học từ vựng, khái niệm.',
          tags: ['từ vựng', 'thẻ ghi nhớ', 'ôn tập'], image: '', featured: false, visible: true, newTab: true,
          guide: '', createdAt: '2026-10-02T08:00:00.000Z'
        },
        {
          id: 't-wordwall', title: 'Wordwall', categoryId: 'kiem-tra', url: 'https://wordwall.net',
          desc: 'Biến một bộ nội dung thành nhiều trò chơi và bài tập tương tác.',
          tags: ['trò chơi', 'bài tập', 'tương tác'], image: '', featured: true, visible: true, newTab: true,
          guide: '', createdAt: '2026-10-03T08:00:00.000Z'
        },
        {
          id: 't-geogebra', title: 'GeoGebra', categoryId: 'toan-khoa-hoc', url: 'https://www.geogebra.org',
          desc: 'Vẽ hình, đồ thị và khảo sát hàm số một cách trực quan.',
          tags: ['Toán', 'hình học', 'đồ thị'], image: '', featured: false, visible: true, newTab: true,
          guide: '', createdAt: '2026-10-04T08:00:00.000Z'
        },
        {
          id: 't-desmos', title: 'Desmos', categoryId: 'toan-khoa-hoc', url: 'https://www.desmos.com/calculator',
          desc: 'Máy tính đồ thị trực tuyến. Kéo thanh trượt để thấy đồ thị thay đổi ngay.',
          tags: ['Toán', 'hàm số'], image: '', featured: false, visible: true, newTab: true,
          guide: '', createdAt: '2026-10-05T08:00:00.000Z'
        },
        {
          id: 't-phet', title: 'PhET', categoryId: 'toan-khoa-hoc', url: 'https://phet.colorado.edu/vi/',
          desc: 'Mô phỏng Vật lí, Hóa học, Sinh học để học sinh tự làm thí nghiệm ảo.',
          tags: ['Vật lí', 'Hóa học', 'thí nghiệm'], image: '', featured: true, visible: true, newTab: true,
          guide: '', createdAt: '2026-10-06T08:00:00.000Z'
        },
        {
          id: 't-padlet', title: 'Padlet', categoryId: 'lop-hoc', url: 'https://padlet.com',
          desc: 'Bảng dán ghi chú chung, cả lớp cùng đóng góp ý kiến và tài liệu.',
          tags: ['thảo luận', 'nhóm', 'chia sẻ'], image: '', featured: false, visible: true, newTab: true,
          guide: '', createdAt: '2026-10-07T08:00:00.000Z'
        },
        {
          id: 't-canva', title: 'Canva cho giáo dục', categoryId: 'thiet-ke', url: 'https://www.canva.com/education/',
          desc: 'Thiết kế bài giảng, poster, infographic từ các mẫu có sẵn.',
          tags: ['bài giảng', 'poster', 'infographic'], image: '', featured: false, visible: true, newTab: true,
          guide: '', createdAt: '2026-10-08T08:00:00.000Z'
        }
      ],
      announcements: [
        {
          id: 'n-chao', title: 'Chào mừng đến với Edutools',
          content: 'Trang đang được bổ sung công cụ dần dần. Thầy cô cần công cụ nào, cứ liên hệ để được thêm vào.',
          date: '2026-10-27', link: '', pinned: true, visible: true
        }
      ]
    };
  }

  function emptyData() {
    var d = defaultData();
    d.categories = [];
    d.tools = [];
    d.announcements = [];
    return d;
  }

  /* ---------- Chuẩn hóa dữ liệu đọc từ file hoặc bản nháp ---------- */
  function normalize(d) {
    d = d && typeof d === 'object' ? d : {};
    var def = defaultData();
    var out = { version: 1, updatedAt: str(d.updatedAt) || new Date().toISOString() };

    out.site = {};
    var src = d.site && typeof d.site === 'object' ? d.site : {};
    SITE_KEYS.forEach(function (k) {
      out.site[k] = typeof src[k] === 'string' ? src[k] : (k in src ? '' : def.site[k]);
    });
    if (!out.site.name.trim()) out.site.name = def.site.name;

    out.categories = (Array.isArray(d.categories) ? d.categories : []).filter(function (c) {
      return c && typeof c === 'object' && str(c.name).trim();
    }).map(function (c) {
      return {
        id: str(c.id) || uid('c'),
        name: str(c.name, 80).trim(),
        icon: str(c.icon, 8) || '📁',
        color: /^#[0-9a-f]{6}$/i.test(c.color) ? c.color : COLORS[0]
      };
    });

    out.tools = (Array.isArray(d.tools) ? d.tools : []).filter(function (t) {
      return t && typeof t === 'object' && str(t.title).trim();
    }).map(function (t) {
      var tags = Array.isArray(t.tags) ? t.tags : String(t.tags || '').split(',');
      return {
        id: str(t.id) || uid('t'),
        title: str(t.title, 120).trim(),
        desc: str(t.desc, 600),
        url: str(t.url, 2000).trim(),
        image: str(t.image),
        categoryId: str(t.categoryId),
        tags: tags.map(function (x) { return str(x, 40).trim(); }).filter(Boolean).slice(0, 12),
        guide: str(t.guide, 4000),
        featured: !!t.featured,
        visible: t.visible !== false,
        newTab: t.newTab !== false,
        createdAt: str(t.createdAt) || new Date().toISOString()
      };
    });

    out.announcements = (Array.isArray(d.announcements) ? d.announcements : []).filter(function (n) {
      return n && typeof n === 'object' && str(n.title).trim();
    }).map(function (n) {
      return {
        id: str(n.id) || uid('n'),
        title: str(n.title, 160).trim(),
        content: str(n.content, 2000),
        date: str(n.date, 10),
        link: str(n.link, 2000).trim(),
        pinned: !!n.pinned,
        visible: n.visible !== false
      };
    });

    return out;
  }

  /* ---------- Nạp / lưu dữ liệu ---------- */
  function loadDraft() {
    var raw = store.get(KEYS.draft);
    if (!raw) return null;
    try { return normalize(JSON.parse(raw)); } catch (e) { return null; }
  }

  function saveDraft(data) {
    data.updatedAt = new Date().toISOString();
    var ok = store.set(KEYS.draft, JSON.stringify(data));
    if (ok) store.set(KEYS.dirty, '1');
    return ok;
  }

  function clearDraft() { store.del(KEYS.draft); store.del(KEYS.dirty); }
  function isDirty() { return store.get(KEYS.dirty) === '1'; }
  function setDirty(v) { if (v) store.set(KEYS.dirty, '1'); else store.del(KEYS.dirty); }

  function fetchPublished() {
    return fetch('data.json?v=' + Date.now(), { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(normalize);
  }

  /* Trang chủ: dữ liệu đã xuất bản. Nếu không đọc được (mở bằng file://) thì dùng bản nháp hoặc dữ liệu mẫu */
  function loadForSite(preview) {
    if (preview) {
      var dr = loadDraft();
      if (dr) return Promise.resolve(dr);
    }
    return fetchPublished().catch(function () {
      return loadDraft() || normalize(defaultData());
    });
  }

  function loadForAdmin() {
    var dr = loadDraft();
    if (dr) return Promise.resolve({ data: dr, from: 'draft' });
    return fetchPublished().then(function (d) { return { data: d, from: 'site' }; })
      .catch(function () { return { data: normalize(defaultData()), from: 'default' }; });
  }

  /* ---------- Đăng nhập quản trị ---------- */
  function hashPassword(p) { return sha256('edutools::' + p); }
  function getAdminCfg() {
    var raw = store.get(KEYS.admin);
    if (raw) {
      try { var c = JSON.parse(raw); if (c && c.hash) return c; } catch (e) { /* dùng mặc định */ }
    }
    return { hash: hashPassword(DEFAULT_PASSWORD), changed: false };
  }
  function checkPassword(p) { return hashPassword(p) === getAdminCfg().hash; }
  function setPassword(p) { return store.set(KEYS.admin, JSON.stringify({ hash: hashPassword(p), changed: true })); }
  function isLoggedIn() { return sess.get(KEYS.session) === '1'; }
  function login() { sess.set(KEYS.session, '1'); }
  function logout() { sess.del(KEYS.session); }

  /* ---------- Giao diện sáng / tối ---------- */
  function initTheme() {
    var t = store.get(KEYS.theme);
    if (!t) t = global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
  }
  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur);
    store.set(KEYS.theme, cur);
    return cur;
  }

  /* ---------- Đọc ảnh, tự thu nhỏ để file dữ liệu nhẹ ---------- */
  function readImage(file, opts) {
    opts = opts || {};
    var maxW = opts.maxW || 800, quality = opts.quality || 0.8, type = opts.type || 'image/jpeg';
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) { reject(new Error('Tệp được chọn không phải là ảnh.')); return; }
      var fr = new FileReader();
      fr.onerror = function () { reject(new Error('Không đọc được tệp ảnh.')); };
      fr.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('Không mở được ảnh này. Hãy thử ảnh JPG hoặc PNG.')); };
        img.onload = function () {
          var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
          if (!w || !h) { reject(new Error('Ảnh không có kích thước hợp lệ.')); return; }
          var scale = Math.min(1, maxW / w);
          var cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
          var canvas = document.createElement('canvas');
          canvas.width = cw; canvas.height = ch;
          var ctx = canvas.getContext('2d');
          if (type === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cw, ch); }
          ctx.drawImage(img, 0, 0, cw, ch);
          resolve(canvas.toDataURL(type, quality));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  global.EduTools = {
    COPYRIGHT: COPYRIGHT,
    DEFAULT_PASSWORD: DEFAULT_PASSWORD,
    COLORS: COLORS,
    KEYS: KEYS,
    store: store,
    esc: esc,
    safeUrl: safeUrl,
    safeImg: safeImg,
    normalizeUrl: normalizeUrl,
    uid: uid,
    clone: clone,
    fmtDate: fmtDate,
    today: today,
    fold: fold,
    sha256: sha256,
    defaultData: defaultData,
    emptyData: emptyData,
    normalize: normalize,
    loadDraft: loadDraft,
    saveDraft: saveDraft,
    clearDraft: clearDraft,
    isDirty: isDirty,
    setDirty: setDirty,
    fetchPublished: fetchPublished,
    loadForSite: loadForSite,
    loadForAdmin: loadForAdmin,
    checkPassword: checkPassword,
    setPassword: setPassword,
    getAdminCfg: getAdminCfg,
    isLoggedIn: isLoggedIn,
    login: login,
    logout: logout,
    initTheme: initTheme,
    toggleTheme: toggleTheme,
    readImage: readImage
  };
})(typeof window !== 'undefined' ? window : globalThis);
