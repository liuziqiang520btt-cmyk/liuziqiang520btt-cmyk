/* ============================================================
 * Clarity —— 主题交互
 * 无框架、无依赖。所有功能都在失败时优雅降级。
 * ============================================================ */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var STORE_KEY = 'clarity-theme';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function readStore(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function writeStore(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* 隐私模式忽略 */ }
  }

  /* ==========================================================
   * 1. 外观切换（明 / 暗）
   * ========================================================== */
  (function appearance() {
    function current() {
      return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }
    function apply(theme) {
      root.setAttribute('data-theme', theme);
      var meta = doc.querySelector('meta[name="theme-color"]:not([media])');
      if (!meta) {
        meta = doc.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        doc.head.appendChild(meta);
      }
      meta.setAttribute('content', theme === 'dark' ? '#000000' : '#ffffff');
      // 通知其他模块（如评论）跟随换肤
      doc.dispatchEvent(new CustomEvent('clarity:theme', { detail: { theme: theme } }));
    }

    var toggle = doc.getElementById('themeToggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var next = current() === 'dark' ? 'light' : 'dark';
        apply(next);
        writeStore(STORE_KEY, next);
      });
    }

    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var sync = function () {
        if (readStore(STORE_KEY)) return;
        var pref = root.getAttribute('data-theme-default') || 'auto';
        if (pref === 'auto') apply(mq.matches ? 'dark' : 'light');
      };
      if (mq.addEventListener) mq.addEventListener('change', sync);
      else if (mq.addListener) mq.addListener(sync);
    }
  })();

  /* ==========================================================
   * 2. 移动端菜单
   * ========================================================== */
  (function mobileMenu() {
    var btn = doc.getElementById('menuToggle');
    var panel = doc.getElementById('navMobile');
    if (!btn || !panel) return;

    function setOpen(open) {
      panel.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    btn.addEventListener('click', function () {
      setOpen(!panel.classList.contains('open'));
    });
    panel.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setOpen(false);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  })();

  /* ==========================================================
   * 3. 阅读进度条
   * ========================================================== */
  (function progress() {
    var bar = doc.getElementById('progress');
    if (!bar) return;
    var ticking = false;

    function update() {
      ticking = false;
      var max = doc.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? window.scrollY / max : 0;
      bar.style.width = Math.min(100, Math.max(0, ratio * 100)) + '%';
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  })();

  /* ==========================================================
   * 4. 目录当前节高亮
   * ========================================================== */
  (function tocHighlight() {
    var toc = doc.querySelector('.toc');
    if (!toc || !('IntersectionObserver' in window)) return;

    var links = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
    if (!links.length) return;

    var map = {};
    var headings = [];
    links.forEach(function (link) {
      var id = decodeURIComponent(link.getAttribute('href').slice(1));
      var el = doc.getElementById(id);
      if (el) {
        map[id] = link;
        headings.push(el);
      }
    });
    if (!headings.length) return;

    var visible = {};

    function refresh() {
      var best = null;
      headings.forEach(function (h) {
        if (visible[h.id]) {
          if (!best || h.offsetTop < best.offsetTop) best = h;
        }
      });
      if (!best) {
        // 还没进入任何标题：选中最后一个已经滚过的
        var passed = null;
        headings.forEach(function (h) {
          if (h.getBoundingClientRect().top < 120) passed = h;
        });
        best = passed;
      }
      links.forEach(function (l) { l.classList.remove('on'); });
      if (best && map[best.id]) map[best.id].classList.add('on');
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible[entry.target.id] = true;
        else delete visible[entry.target.id];
      });
      refresh();
    }, { rootMargin: '-80px 0px -70% 0px', threshold: 0 });

    headings.forEach(function (h) { observer.observe(h); });
    refresh();
  })();

  /* ==========================================================
   * 5. 代码块：语言标签 + 一键复制
   * ========================================================== */
  (function codeBlocks() {
    var LABELS = {
      js: 'JavaScript', javascript: 'JavaScript', ts: 'TypeScript', typescript: 'TypeScript',
      jsx: 'JSX', tsx: 'TSX', sh: 'Shell', shell: 'Shell', bash: 'Bash', zsh: 'Zsh',
      ps1: 'PowerShell', powershell: 'PowerShell', sql: 'SQL', plsql: 'PL/SQL',
      yml: 'YAML', yaml: 'YAML', json: 'JSON', toml: 'TOML', ini: 'INI',
      py: 'Python', python: 'Python', rb: 'Ruby', go: 'Go', rs: 'Rust', java: 'Java',
      c: 'C', cpp: 'C++', cs: 'C#', php: 'PHP', kt: 'Kotlin', swift: 'Swift',
      html: 'HTML', xml: 'XML', css: 'CSS', scss: 'SCSS', less: 'Less', styl: 'Stylus',
      md: 'Markdown', markdown: 'Markdown', diff: 'Diff', patch: 'Diff',
      dockerfile: 'Dockerfile', nginx: 'Nginx', plaintext: 'Text', text: 'Text', plain: 'Text'
    };
    var copyLabel = root.getAttribute('data-copy') || '复制';
    var copiedLabel = root.getAttribute('data-copied') || '已复制';

    function legacyCopy(text) {
      return new Promise(function (resolve, reject) {
        var ta = doc.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        ta.style.opacity = '0';
        doc.body.appendChild(ta);
        ta.select();
        try {
          var ok = doc.execCommand('copy');
          doc.body.removeChild(ta);
          ok ? resolve() : reject(new Error('copy failed'));
        } catch (err) {
          doc.body.removeChild(ta);
          reject(err);
        }
      });
    }

    function copyText(text) {
      // 优先用异步剪贴板 API，失败（失焦 / 无权限 / 非安全上下文）时回退到 execCommand
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
      }
      return legacyCopy(text);
    }

    Array.prototype.slice.call(doc.querySelectorAll('figure.highlight')).forEach(function (fig) {
      var classes = Array.prototype.slice.call(fig.classList).filter(function (c) {
        return c !== 'highlight' && c !== 'hljs';
      });
      var lang = classes.length ? classes[0].toLowerCase() : '';
      var label = LABELS[lang] || (lang ? lang.toUpperCase() : 'Code');

      var bar = doc.createElement('div');
      bar.className = 'code-bar';

      var name = doc.createElement('span');
      name.textContent = label;
      bar.appendChild(name);

      var btn = doc.createElement('button');
      btn.type = 'button';
      btn.className = 'cp';
      btn.textContent = copyLabel;
      btn.setAttribute('aria-label', copyLabel + ' ' + label + ' 代码');

      btn.addEventListener('click', function () {
        var pre = fig.querySelector('.code pre') || fig.querySelector('pre');
        var text = pre ? pre.textContent : '';
        copyText(text).then(function () {
          btn.textContent = copiedLabel;
          window.setTimeout(function () { btn.textContent = copyLabel; }, 1600);
        }).catch(function () {
          btn.textContent = '×';
          window.setTimeout(function () { btn.textContent = copyLabel; }, 1600);
        });
      });

      bar.appendChild(btn);
      fig.insertBefore(bar, fig.firstChild);
    });
  })();

  /* ==========================================================
   * 6. 宽表格横向滚动容器
   * ========================================================== */
  (function tables() {
    Array.prototype.slice.call(doc.querySelectorAll('.article table')).forEach(function (table) {
      // Hexo 的 highlight 也用 <table> 排版，别把代码块也包进去
      if (table.closest('figure.highlight')) return;
      if (table.parentElement && table.parentElement.classList.contains('table-wrap')) return;
      var wrap = doc.createElement('div');
      wrap.className = 'table-wrap';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  })();

  /* ==========================================================
   * 7. 图片灯箱
   * ========================================================== */
  (function lightbox() {
    var images = Array.prototype.slice.call(doc.querySelectorAll('.article img')).filter(function (img) {
      return !img.closest('a') && !img.classList.contains('no-zoom');
    });
    if (!images.length) return;

    var box = doc.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-hidden', 'true');

    var img = doc.createElement('img');
    img.alt = '';
    box.appendChild(img);

    var close = doc.createElement('button');
    close.type = 'button';
    close.className = 'lb-close';
    close.setAttribute('aria-label', '关闭');
    close.textContent = '×';
    box.appendChild(close);

    var lastFocus = null;

    function open(src, alt) {
      lastFocus = doc.activeElement;
      img.src = src;
      img.alt = alt || '';
      box.classList.add('open');
      box.setAttribute('aria-hidden', 'false');
      doc.body.style.overflow = 'hidden';
      close.focus();
    }
    function shut() {
      box.classList.remove('open');
      box.setAttribute('aria-hidden', 'true');
      img.removeAttribute('src');
      doc.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    box.addEventListener('click', shut);
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.classList.contains('open')) shut();
    });

    images.forEach(function (source, i) {
      source.setAttribute('loading', i === 0 ? 'eager' : 'lazy');
      source.setAttribute('decoding', 'async');
      if (!source.hasAttribute('alt')) source.setAttribute('alt', '');
      source.addEventListener('click', function () {
        open(source.currentSrc || source.src, source.alt);
      });
    });

    doc.body.appendChild(box);
  })();

  /* ==========================================================
   * 8. 滚动进入动效
   * ========================================================== */
  (function reveal() {
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    var selectors = '.section-head, .featured, .item, .tl-group, .term-card, .author-card, .post-nav, .hero .wrap, .error-page .wrap';
    var targets = Array.prototype.slice.call(doc.querySelectorAll(selectors));
    if (!targets.length) return;

    root.setAttribute('data-motion', 'on');

    targets.forEach(function (el) {
      el.classList.add('reveal');
      // 同一个列表内做轻微错峰
      var siblings = el.parentElement ? Array.prototype.slice.call(el.parentElement.children) : [];
      var index = siblings.indexOf(el);
      if (index > 0 && index < 8) {
        el.style.transitionDelay = (index * 45) + 'ms';
      }
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });

    targets.forEach(function (el) { observer.observe(el); });

    // 兜底 1：把加载后就已在视口内的元素补上（保留滚动进入的观感）
    function sweepInView() {
      targets.forEach(function (el) {
        if (el.classList.contains('in')) return;
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
      });
    }
    window.setTimeout(sweepInView, 900);
    window.addEventListener('load', function () { window.setTimeout(sweepInView, 300); });

    // 兜底 2：6 秒后无论如何全部显示，保证内容绝不会一直不可见
    window.setTimeout(function () {
      targets.forEach(function (el) { el.classList.add('in'); });
    }, 6000);
  })();

  /* ==========================================================
   * 9. 文档页年份分段控件
   * ========================================================== */
  (function archiveFilter() {
    var seg = doc.getElementById('archiveSeg');
    var timeline = doc.getElementById('archiveTl');
    if (!seg || !timeline) return;

    var buttons = Array.prototype.slice.call(seg.querySelectorAll('button'));
    var groups = Array.prototype.slice.call(timeline.querySelectorAll('.tl-group'));

    seg.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('button') : null;
      if (!btn) return;
      var year = btn.getAttribute('data-year');
      buttons.forEach(function (b) { b.classList.toggle('on', b === btn); });
      groups.forEach(function (g) {
        var show = year === 'all' || g.getAttribute('data-year') === year;
        g.classList.toggle('hidden', !show);
      });
      try {
        history.replaceState(null, '', year === 'all' ? location.pathname : location.pathname + '#' + year);
      } catch (err) { /* ignore */ }
    });
  })();

  /* ==========================================================
   * 10. 锚点平滑滚动（尊重系统"减少动态效果"）
   * ========================================================== */
  (function anchorScroll() {
    if (reduceMotion) return;
    root.style.scrollBehavior = 'smooth';

    function headingsOffset() {
      return (doc.querySelector('.nav') ? 60 : 12);
    }

    doc.addEventListener('click', function (e) {
      var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!link) return;
      var hash = link.getAttribute('href');
      if (!hash || hash === '#') return;
      var target = doc.getElementById(decodeURIComponent(hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - headingsOffset();
      window.scrollTo({ top: top, behavior: 'smooth' });
      try { history.replaceState(null, '', hash); } catch (err) { /* ignore */ }
    });
  })();

  /* ==========================================================
   * 11. 首屏封面：导航栏转透明 / 视差 / 底部提示
   * ========================================================== */
  (function cover() {
    var coverEl = doc.getElementById('cover');
    if (!coverEl) return;

    var bg = coverEl.querySelector('.cover-bg');
    var inner = coverEl.querySelector('.cover-inner');
    var hint = doc.getElementById('coverScroll');
    var ticking = false;

    // 背景比页面慢 16%，前景文字比页面快 6%，形成纵深
    var BG_FACTOR = 0.16;
    var INNER_FACTOR = 0.06;

    function sync() {
      ticking = false;
      var y = window.scrollY;
      var h = coverEl.offsetHeight;

      root.classList.toggle('is-over-cover', y < h - 64);
      root.classList.toggle('is-past-cover', y >= h - 64);

      if (reduceMotion || !bg || y > h + 80) return;

      bg.style.transform = 'translate3d(0,' + (y * BG_FACTOR).toFixed(2) + 'px,0)';
      if (inner) {
        inner.style.transform = 'translate3d(0,' + (-y * INNER_FACTOR).toFixed(2) + 'px,0)';
        inner.style.opacity = Math.max(0, 1 - (y / h) * 1.25).toFixed(3);
      }
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(sync);
    }

    if (hint) {
      hint.addEventListener('click', function () {
        window.scrollTo({
          top: coverEl.offsetTop + coverEl.offsetHeight - 56,
          behavior: reduceMotion ? 'auto' : 'smooth'
        });
      });
    }

    sync();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  })();

  /* ==========================================================
   * 12. 目录抽屉
   * ========================================================== */
  (function tocDrawer() {
    var toggle = doc.getElementById('tocToggle');
    var drawer = doc.getElementById('tocDrawer');
    var backdrop = doc.getElementById('tocBackdrop');
    var closeBtn = doc.getElementById('tocClose');
    if (!toggle || !drawer || !backdrop) return;

    var CLOSE_MS = 400;

    function isOpen() {
      return root.classList.contains('toc-open');
    }

    function open() {
      if (isOpen()) return;
      backdrop.hidden = false;
      void backdrop.offsetWidth; // 强制一次重排，保证过渡生效
      root.classList.add('toc-open');
      drawer.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      doc.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }

    function close(restoreFocus) {
      if (!isOpen()) return;
      root.classList.remove('toc-open');
      drawer.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      doc.body.style.overflow = '';
      window.setTimeout(function () {
        if (!isOpen()) backdrop.hidden = true;
      }, CLOSE_MS);
      if (restoreFocus) toggle.focus();
    }

    toggle.addEventListener('click', function () {
      if (isOpen()) close(true); else open();
    });
    if (closeBtn) closeBtn.addEventListener('click', function () { close(true); });
    backdrop.addEventListener('click', function () { close(true); });

    // 点了目录里的锚点就收起抽屉（平滑滚动交给 anchorScroll）
    drawer.addEventListener('click', function (e) {
      var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (link) close(false);
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) close(true);
    });
  })();

  /* ==========================================================
   * 8. 关于页分栏（自我介绍 / 研究动态）
   * 互斥显示：同一时刻只有一栏可见
   * ========================================================== */
  (function aboutTabs() {
    var tabs = Array.prototype.slice.call(doc.querySelectorAll('.about-tab'));
    if (!tabs.length) return;

    var panes = Array.prototype.slice.call(doc.querySelectorAll('.about-pane'));
    if (!panes.length) return;

    function activate(name) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-pane') === name;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panes.forEach(function (p) {
        var on = p.getAttribute('data-pane') === name;
        p.classList.toggle('is-active', on);
        // hidden 和 is-active 一起管，避免两者打架
        if (on) { p.removeAttribute('hidden'); } else { p.setAttribute('hidden', ''); }
      });
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        var name = t.getAttribute('data-pane');
        activate(name);
        try { history.replaceState(null, '', '#' + name); } catch (e) { /* 忽略 */ }
      });
    });

    // 允许用 #intro / #research 直达某一栏
    var hash = (location.hash || '').replace('#', '');
    var known = panes.some(function (p) { return p.getAttribute('data-pane') === hash; });
    if (hash && known) activate(hash);
  })();
})();
