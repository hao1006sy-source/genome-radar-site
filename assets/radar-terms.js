(function (global) {
  'use strict';
  var KEY = 'gr_radar_terms_v1';
  var ALIASES = [
    ['玉米', 'maize', 'corn', 'zea mays'],
    ['水稻', 'rice', 'oryza sativa'],
    ['小麦', 'wheat', 'triticum aestivum'],
    ['大豆', 'soybean', 'soy', 'glycine max'],
    ['油菜', 'rapeseed', 'canola', 'brassica napus'],
    ['泛基因组', 'pangenome', 'pan-genome', 'pan genome'],
    ['全基因组关联分析', 'gwas', 'genome-wide association study', 'genome wide association'],
    ['单细胞', 'single-cell', 'single cell', 'scRNA-seq', 'scrna seq'],
    ['结构变异', 'structural variation', 'structural variants', 'SV'],
    ['转录组', 'transcriptome', 'RNA-seq', 'rna seq'],
    ['基因编辑', 'gene editing', 'CRISPR']
  ];
  function normalize(s) { return String(s || '').normalize ? String(s || '').normalize('NFKC').toLocaleLowerCase().trim() : String(s || '').toLocaleLowerCase().trim(); }
  function load() {
    try {
      var value = JSON.parse(global.localStorage.getItem(KEY) || '[]');
      if (!Array.isArray(value)) return [];
      var seen = Object.create(null);
      return value.map(function (x) { return typeof x === 'string' ? x.trim() : ''; }).filter(function (x) {
        var k = normalize(x); if (!k || seen[k]) return false; seen[k] = true; return true;
      }).slice(0, 80);
    } catch (_) { return []; }
  }
  function save(values) {
    var list = [], seen = Object.create(null);
    (Array.isArray(values) ? values : []).forEach(function (value) {
      var text = String(value || '').trim().slice(0, 100), key = normalize(text);
      if (text && !seen[key]) { seen[key] = true; list.push(text); }
    });
    try { global.localStorage.setItem(KEY, JSON.stringify(list.slice(0, 80))); }
    catch (_) { return false; }
    global.dispatchEvent(new CustomEvent('gr:terms-changed', { detail: { terms: list } }));
    return true;
  }
  function expand(term) {
    var t = normalize(term).replace(/[-_]+/g, ' ');
    for (var i = 0; i < ALIASES.length; i++) {
      if (ALIASES[i].some(function (alias) { return normalize(alias).replace(/[-_]+/g, ' ') === t; })) return ALIASES[i];
    }
    return [term];
  }
  function contains(text, term) {
    var raw = String(text || '').normalize ? String(text || '').normalize('NFKC') : String(text || '');
    var candidate = String(term || '').trim();
    if (!candidate) return false;
    if (/[\u3400-\u9fff]/.test(candidate)) return raw.toLocaleLowerCase().indexOf(candidate.toLocaleLowerCase()) >= 0;
    var escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    var boundaryStart = /^[\p{L}\p{N}]/u.test(candidate), boundaryEnd = /[\p{L}\p{N}]$/u.test(candidate);
    var re;
    try { re = new RegExp((boundaryStart ? '\\b' : '') + escaped + (boundaryEnd ? '\\b' : ''), 'iu'); }
    catch (_) { return raw.toLocaleLowerCase().indexOf(candidate.toLocaleLowerCase()) >= 0; }
    return re.test(raw);
  }
  function matchesText(text, terms) {
    var list = Array.isArray(terms) ? terms : load();
    if (!list.length) return false;
    var source = String(text || '');
    return list.some(function (term) { return expand(term).some(function (alias) { return contains(source, alias); }); });
  }
  function articleText(item) {
    return [item.title_zh, item.title_en, item.journal, item.summary, item.abstract,
      item.research_direction, item.keywords, item.doi, item.issue_week].map(function (value) {
      return Array.isArray(value) ? value.join(' ') : (value || '');
    }).join(' ');
  }
  function matchesArticle(item, terms) { return matchesText(articleText(item), terms); }
  function uniqueCount(rows, terms) {
    var ids = Object.create(null);
    (rows || []).forEach(function (row) { var id = row.id || row.article_url || row.doi; if (id && matchesArticle(row, terms)) ids[id] = true; });
    return Object.keys(ids).length;
  }
  global.GenomeRadarTerms = { key: KEY, load: load, save: save, expand: expand, matchesText: matchesText, matchesArticle: matchesArticle, uniqueCount: uniqueCount };

  function make(tag, cls, text) { var el = document.createElement(tag); if (cls) el.className = cls; if (text != null) el.textContent = text; return el; }
  function initDialog() {
    var dialog = document.getElementById('radar-terms-dialog');
    var open = document.querySelector('[data-radar-terms-open]');
    if (!dialog || !open || !dialog.showModal) return;
    var list = dialog.querySelector('[data-radar-terms-list]'), add = dialog.querySelector('[data-radar-add]'), close = dialog.querySelector('[data-radar-close]'), status = dialog.querySelector('[data-radar-status]');
    function render(values) {
      list.textContent = '';
      values.forEach(function (value, index) {
        var row = make('div', 'radar-term-row'), input = make('input');
        input.type = 'text'; input.maxLength = 100; input.value = value; input.setAttribute('aria-label', '关注词 ' + (index + 1));
        var remove = make('button', 'radar-term-remove', '删除'); remove.type = 'button'; remove.setAttribute('aria-label', '删除关注词：' + value);
        remove.addEventListener('click', function () { var next = load(); next.splice(index, 1); save(next); render(next); });
        input.addEventListener('change', function () { var next = load(); next[index] = input.value.trim(); save(next); status.textContent = '已保存到当前浏览器。'; });
        row.append(input, remove); list.appendChild(row);
      });
    }
    open.addEventListener('click', function () { render(load()); status.textContent = ''; dialog.showModal(); });
    add.addEventListener('click', function () { var next = load(); next.push(''); render(next); var fields = list.querySelectorAll('input'); if (fields.length) fields[fields.length - 1].focus(); });
    close.addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('close', function () {
      var values = Array.prototype.map.call(list.querySelectorAll('input'), function (input) { return input.value.trim(); }).filter(Boolean);
      save(values);
    });
  }
  function initHome() {
    var latest = document.querySelector('.latest-card'), note = document.getElementById('latest-radar-count');
    function update() {
      var terms = load();
      if (!terms.length) { if (note) note.hidden = true; return; }
      if (note) note.hidden = false;
      fetch('assets/search-index.json').then(function (r) { return r.json(); }).then(function (index) {
        if (!latest || !note || !index.articles) return;
        var issue = latest.getAttribute('href').split('/')[0];
        var rows = index.articles.filter(function (item) { return item.issue === issue; });
        note.textContent = '本期命中 ' + uniqueCount(rows, terms) + ' 篇关注';
        note.hidden = false;
      }).catch(function () { if (note) note.hidden = true; });
    }
    global.addEventListener('gr:terms-changed', update); update();
  }
  function initIssue() {
    var panel = document.getElementById('toc'), rows = Array.prototype.slice.call(document.querySelectorAll('.toc-row[data-i]'));
    if (!panel || !rows.length) return;
    var search = document.getElementById('tocSearch'), host = search && search.closest('.toc-search');
    if (!host) return;
    var filter = make('button', 'radar-only-toggle', '只看关注词命中');
    filter.type = 'button'; filter.hidden = !load().length; filter.setAttribute('aria-pressed', 'false');
    host.appendChild(filter);
    var only = false;
    var tocGroups = Array.prototype.slice.call(panel.querySelectorAll('.toc-group'));
    var tocCount = document.getElementById('tocCount'), tocEmpty = document.getElementById('tocEmpty'), previewOpen = document.getElementById('tocPreviewOpen');
    function update() {
      var terms = load(); filter.hidden = !terms.length;
      var matched = 0;
      var queryTerms = search ? search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean) : [];
      rows.forEach(function (row) {
        var hit = matchesText((row.getAttribute('data-search') || '') + ' ' + (row.getAttribute('data-lead') || ''), terms);
        var title = row.querySelector('.t');
        var badge = title && title.querySelector('.radar-hit');
        if (hit && title && !badge) { badge = make('span', 'radar-hit', '关注'); title.appendChild(badge); }
        if (!hit && badge) badge.remove();
        row.dataset.radarHit = hit ? '1' : '0';
        var hay = (row.getAttribute('data-search') || '').toLocaleLowerCase();
        var queryMatch = queryTerms.every(function (term) { return hay.indexOf(term) >= 0; });
        row.parentElement.hidden = !(queryMatch && (!only || hit));
        if (hit) matched++;
      });
      var visible = 0;
      tocGroups.forEach(function (group) {
        var members = Array.prototype.slice.call(group.querySelectorAll('.toc-item'));
        var count = members.filter(function (item) { return !item.hidden; }).length;
        group.hidden = count === 0;
        var countLabel = group.querySelector('[data-group-count]');
        if (countLabel) countLabel.textContent = '共 ' + count + ' 篇';
        visible += count;
      });
      if (tocCount) tocCount.textContent = visible + ' / ' + rows.length + ' 篇';
      if (tocEmpty) tocEmpty.hidden = visible > 0;
      if (previewOpen) previewOpen.disabled = visible === 0;
      filter.hidden = !terms.length;
      filter.setAttribute('aria-pressed', only ? 'true' : 'false');
      filter.textContent = only ? '显示全部文章' : '只看关注词命中';
      var selected = panel.querySelector('.toc-row.is-current');
      if (selected && selected.parentElement.hidden) {
        var firstVisible = rows.find(function (row) { return !row.parentElement.hidden; });
        if (firstVisible) firstVisible.click();
      }
      var articlePages = Array.prototype.slice.call(document.querySelectorAll('.article-page'));
      articlePages.forEach(function (page, index) {
        var hit = rows[index] && rows[index].dataset.radarHit === '1';
        var heading = page.querySelector('.t-zh');
        var marker = heading && heading.querySelector('.radar-hit');
        if (hit && heading && !marker) heading.appendChild(make('span', 'radar-hit', '关注词命中'));
        if (!hit && marker) marker.remove();
        page.dataset.radarHit = hit ? '1' : '0';
      });
      panel.dataset.radarMatches = String(matched);
    }
    filter.addEventListener('click', function () { only = !only; update(); });
    if (search) search.addEventListener('input', update);
    global.addEventListener('gr:terms-changed', update); update();
  }
  function boot() { initDialog(); initHome(); initIssue(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})(window);
