(function (global) {
  'use strict';
  var KEY = 'gr_last_read_v1', DISMISSED = 'gr_last_read_dismissed_v1';
  function read(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } }
  function write(value) { try { localStorage.setItem(KEY, JSON.stringify(value)); return true; } catch (_) { return false; } }
  function issueInfo() {
    var match = location.pathname.match(/(?:^|\/)(\d{4}-\d{2}-\d{2})\/index\.html$/);
    if (!match) return null;
    return { issue: match[1], week: (document.querySelector('.issue-tag') || {}).textContent || '' };
  }
  function articleNumber() {
    var n = parseInt(new URLSearchParams(location.search).get('article') || '0', 10);
    return Number.isFinite(n) && n >= 1 && n <= 20 ? n : 0;
  }
  function saveCurrent(force) {
    var info = issueInfo(), number = articleNumber();
    if (!info || !number) return;
    var page = document.querySelectorAll('#deck .article-page')[number - 1];
    if (!page) return;
    var title = page.querySelector('.t-zh');
    if (!title) return;
    var old = read(KEY), stamp = Date.now();
    if (!force && old && old.issue === info.issue && old.articleNumber === number && stamp - old.updatedAt < 15000) return;
    write({ issue: info.issue, week: info.week.trim(), articleNumber: number, title: title.textContent.replace(/关注词命中/g, '').trim(),
      href: info.issue + '/index.html?article=' + number, updatedAt: stamp });
  }
  function initReader() {
    var info = issueInfo();
    if (!info) return;
    var lastSaved = '';
    function sync(force) {
      var n = articleNumber();
      if (!n) return;
      var key = info.issue + ':' + n;
      if (force || key !== lastSaved) { lastSaved = key; saveCurrent(true); }
      else saveCurrent(false);
    }
    sync(true);
    global.setInterval(function () { if (!document.documentElement.classList.contains('flow')) sync(false); }, 1600);
    global.addEventListener('pagehide', function () { sync(true); });
    global.addEventListener('popstate', function () { global.setTimeout(function () { sync(true); }, 0); });
    global.addEventListener('hashchange', function () { sync(true); });
    var pages = Array.prototype.slice.call(document.querySelectorAll('#deck .article-page'));
    if ('IntersectionObserver' in global && pages.length) {
      var visible = new Map(), timer = 0;
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { visible.set(entry.target, entry.intersectionRatio); });
        if (!document.documentElement.classList.contains('flow')) return;
        clearTimeout(timer);
        timer = global.setTimeout(function () {
          var best = pages.map(function (page, index) { return { page: page, index: index + 1, ratio: visible.get(page) || 0 }; })
            .sort(function (a, b) { return b.ratio - a.ratio; })[0];
          if (!best || best.ratio < .12) return;
          var url = new URL(location.href); url.searchParams.set('article', String(best.index));
          history.replaceState(history.state, '', url.pathname + url.search + url.hash);
          var key = info.issue + ':' + best.index;
          if (key !== lastSaved) { lastSaved = key; saveCurrent(true); }
        }, 420);
      }, { threshold: [.12, .25, .45, .65, .85] });
      pages.forEach(function (page) { observer.observe(page); });
    }
  }
  function initHome() {
    var host = document.getElementById('continue-reading');
    if (!host) return;
    var label = host.querySelector('[data-resume-label]'), link = host.querySelector('[data-resume-link]'), close = host.querySelector('[data-resume-close]');
    function render() {
      var saved = read(KEY), dismissed = Number(localStorage.getItem(DISMISSED) || 0);
      var href = saved && /^\d{4}-\d{2}-\d{2}\/index\.html\?article=(?:[1-9]|1\d|20)$/.test(saved.href || '') ? saved.href : '';
      if (!saved || !href || saved.updatedAt <= dismissed || !saved.title) { host.hidden = true; return; }
      label.textContent = '上次读到：' + (saved.week || saved.issue) + ' · 第 ' + saved.articleNumber + ' 篇《' + saved.title + '》';
      link.href = href; host.hidden = false;
    }
    close.addEventListener('click', function () { var saved = read(KEY); try { localStorage.setItem(DISMISSED, String(saved && saved.updatedAt || Date.now())); } catch (_) {} host.hidden = true; });
    global.addEventListener('storage', function (event) { if (event.key === KEY || event.key === DISMISSED) render(); });
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { initReader(); initHome(); }, { once: true });
  else { initReader(); initHome(); }
})(window);
