(function () {
  'use strict';

  var labels = [
    ['home', '首页', 'index.html'],
    ['topics', '研究专题', 'topics.html'],
    ['search', '文献搜索', 'search.html'],
    ['library', '我的文献库', 'library.html'],
    ['deep', '我的精读', 'deep-library.html']
  ];

  function makeSearch(prefix) {
    var form = document.createElement('form');
    form.className = 'gr-search-form';
    form.setAttribute('role', 'search');
    form.action = prefix + 'search.html';
    form.method = 'get';
    var label = document.createElement('label');
    label.className = 'gr-sr-only';
    label.htmlFor = 'gr-site-query';
    label.textContent = '搜索全站文献';
    var mark = document.createElement('span');
    mark.className = 'gr-search-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = '⌕';
    var input = document.createElement('input');
    input.id = 'gr-site-query';
    input.name = 'q';
    input.type = 'search';
    input.placeholder = '搜索标题、摘要或 DOI…';
    input.autocomplete = 'off';
    form.append(label, mark, input);
    return form;
  }

  function buildNav(container, prefix, current, weekly) {
    var nav = container.querySelector('nav');
    if (!nav) nav = document.createElement('nav');
    nav.className = 'gr-primary-nav' + (weekly ? ' gr-week-nav' : '');
    nav.setAttribute('aria-label', '主导航');
    nav.textContent = '';
    labels.forEach(function (entry) {
      var a = document.createElement('a');
      a.href = prefix + entry[2];
      a.textContent = entry[1];
      if (current === entry[0]) a.setAttribute('aria-current', 'page');
      nav.appendChild(a);
    });
    return nav;
  }

  function pageKey() {
    var path = location.pathname;
    if (/\/search\.html$/.test(path)) return 'search';
    if (/\/library\.html$/.test(path)) return 'library';
    if (/\/deep-library\.html$|\/deep-read\.html$/.test(path)) return 'deep';
    if (/\/index\.html$|\/$/.test(path) && !/^\/\d{4}-\d\d-\d\d\//.test(path)) return 'home';
    return '';
  }

  function initWeekly(header) {
    var tools = header.querySelector('.tools');
    var oldHome = tools && tools.querySelector('a[href="../index.html"]');
    var oldLibrary = tools && tools.querySelector('.library-nav');
    if (oldHome) oldHome.remove();
    if (oldLibrary) oldLibrary.remove();
    var nav = buildNav(header, '../', '', true);
    var wrap = document.createElement('div');
    wrap.className = 'gr-week-global';
    wrap.appendChild(nav);
    wrap.appendChild(makeSearch('../'));
    if (tools) header.insertBefore(wrap, tools);
  }

  function initPage(header) {
    var inner = header.querySelector('.header-inner, .gr-header-inner');
    if (!inner) {
      inner = document.createElement('div');
      inner.className = 'gr-header-inner';
      Array.prototype.slice.call(header.childNodes).forEach(function (node) {
        if (node.nodeType === 1 && node.classList.contains('search-status')) return;
        inner.appendChild(node);
      });
      header.insertBefore(inner, header.firstChild);
    }
    inner.classList.add('gr-header-inner');
    header.classList.add('gr-site-header');
    var nav = buildNav(inner, '', pageKey(), false);
    var form = inner.querySelector('form[role="search"], .search-form, .top-search, .gr-search-form');
    if (!form) form = makeSearch('');
    form.classList.add('gr-search-form');
    form.action = 'search.html';
    form.method = 'get';
    var input = form.querySelector('input[type="search"],input[name="q"]');
    if (input) {
      input.name = 'q';
      input.placeholder = '搜索标题、摘要或 DOI…';
      input.autocomplete = 'off';
    }
    var existingIcon = form.querySelector('svg');
    if (existingIcon && !form.querySelector('.gr-search-mark')) existingIcon.remove();
    if (!form.querySelector('.gr-search-mark')) {
      var mark = document.createElement('span');
      mark.className = 'gr-search-mark';
      mark.setAttribute('aria-hidden', 'true');
      mark.textContent = '⌕';
      form.insertBefore(mark, form.firstChild);
    }
    var label = form.querySelector('label');
    if (label && input) { label.classList.add('gr-sr-only'); label.htmlFor = input.id || 'gr-site-query'; }
    if (!inner.contains(nav)) inner.appendChild(nav);
    if (!inner.contains(form)) inner.appendChild(form);
  }

  function init() {
    var header = document.querySelector('header.topbar');
    if (header) initWeekly(header);
    else {
      header = document.querySelector('header.site-header, body > header');
      if (header) initPage(header);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
