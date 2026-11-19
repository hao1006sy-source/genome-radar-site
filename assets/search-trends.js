(function (global) {
  'use strict';
  var COLORS = ['#315f42', '#8a9b58', '#b37b43', '#4c7c83', '#8c6e8a', '#a2a96d'];
  var SPECIES = [
    ['玉米', 'maize', 'corn', 'zea mays'], ['水稻', 'rice', 'oryza sativa'], ['小麦', 'wheat', 'triticum aestivum'],
    ['大豆', 'soybean', 'glycine max'], ['油菜', 'rapeseed', 'canola', 'brassica napus'], ['番茄', 'tomato', 'solanum lycopersicum']
  ];
  var METHODS = [
    ['GWAS', /\bgwas\b|genome[- ]wide association/i], ['QTL', /\bqtl\b/i], ['Hi-C', /\bhi[- ]?c\b|chromosome conformation/i],
    ['RNA-seq', /rna[- ]?seq|transcriptom/i], ['单细胞', /single[- ]cell|single cell|scrna|sc\s*eqtl/i],
    ['长读长测序', /long[- ]read|nanopore|pacbio|hifi sequencing/i], ['泛基因组', /pangenome|pan[- ]genome/i],
    ['CRISPR', /crispr|cas9/i], ['表观组学', /methylation|epigenom|atac[- ]?seq|chip[- ]?seq/i],
    ['基因组预测', /genomic prediction|genomic selection/i], ['TWAS', /\btwas\b|transcriptome[- ]wide association/i],
    ['单倍型解析', /haplotype[- ]resolved/i], ['空间转录组', /spatial transcriptom/i]
  ];
  var TECH_TERMS = ['结构变异', '稀有变异', '转座子', '基因组组装', '单倍型', '图泛基因组', '种质资源', '遗传多样性', '农艺性状', '基因表达', '调控网络', '染色质', '甲基化', '抗病性', '胁迫响应', '开花期', '杂交设计', '分子育种', '基因家族', '候选基因', 'eQTL', 'SNP', 'SV', 'HiFi', '着丝粒', '端粒到端粒'];
  var GENERIC_KEYWORDS = Object.create(null);
  ['变异与关联', '方法与工具', '泛基因组', '泛基因组与组装', '组装与注释', '表观与调控', '进化与比较', '单细胞与空间'].forEach(function (x) { GENERIC_KEYWORDS[clean(x)] = true; });
  var JOURNAL_ALIASES = {
    'nature genetics': 'Nat Genet', 'nat genet': 'Nat Genet', 'nature plants': 'Nat Plants', 'nat plants': 'Nat Plants',
    'the plant journal': 'Plant J', 'plant journal': 'Plant J', 'plant j': 'Plant J', 'the plant cell': 'Plant Cell', 'plant cell': 'Plant Cell',
    'genome biology': 'Genome Biol', 'genome biol': 'Genome Biol', 'science advances': 'Sci Adv', 'sci adv': 'Sci Adv',
    'nature communications': 'Nat Commun', 'nat commun': 'Nat Commun', 'molecular plant': 'Mol Plant', 'mol plant': 'Mol Plant',
    'plant biotechnology journal': 'Plant Biotechnol J', 'plant biotechnol j': 'Plant Biotechnol J',
    'journal of integrative plant biology': 'J Integr Plant Biol', 'j integr plant biol': 'J Integr Plant Biol',
    'plant physiology': 'Plant Physiol', 'plant physiol': 'Plant Physiol', 'plant cell and environment': 'Plant Cell Environ', 'plant cell environ': 'Plant Cell Environ',
    'cell genomics': 'Cell Genom', 'cell genom': 'Cell Genom', 'nucleic acids research': 'Nucleic Acids Res', 'nucleic acids res': 'Nucleic Acids Res',
    'plant communications': 'Plant Commun', 'plant commun': 'Plant Commun', 'briefings in bioinformatics': 'Brief Bioinform', 'brief bioinform': 'Brief Bioinform',
    'nature biotechnology': 'Nat Biotechnol', 'nat biotechnol': 'Nat Biotechnol', 'nature methods': 'Nat Methods', 'nat methods': 'Nat Methods',
    'molecular biology and evolution': 'Mol Biol Evol', 'mol biol evol': 'Mol Biol Evol', 'genome research': 'Genome Res', 'genome res': 'Genome Res',
    'new phytologist': 'New Phytol', 'new phytol': 'New Phytol', 'bioinformatics': 'Bioinformatics', 'science': 'Science', 'cell': 'Cell', 'nature': 'Nature'
  };
  var state = { articles: [], rows: [], range: 4, radar: false };
  function el(tag, cls, text) { var node = document.createElement(tag); if (cls) node.className = cls; if (text != null) node.textContent = text; return node; }
  function clean(value) { return String(value || '').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, ' ').trim(); }
  function aliases(list, text) { var normalized = clean(text); return list.find(function (group) { return group.some(function (item) { return normalized.indexOf(clean(item)) >= 0; }); }) || null; }
  function matchedMethods(text) { return METHODS.filter(function (entry) { return entry[1].test(text); }).map(function (entry) { return entry[0]; }); }
  function itemIssue(item) { return String(item.issue || item.issue_date || ''); }
  function matchingSpecies(text) { var normalized = clean(text); return SPECIES.filter(function (group) { return group.some(function (item) { return normalized.indexOf(clean(item)) >= 0; }); }); }
  function getIssues(rows) { var set = Object.create(null); rows.forEach(function (item) { var issue = itemIssue(item); if (issue) set[issue] = item.issue_week || issue; }); return Object.keys(set).sort(); }
  function directionRows(rows) { var counts = Object.create(null); rows.forEach(function (item) { var seen = Object.create(null); (item.research_direction || []).forEach(function (direction) { var name = String(direction || '').trim(); if (name && !seen[name]) { seen[name] = true; counts[name] = (counts[name] || 0) + 1; } }); }); return counts; }
  function buildChart(rows, range) {
    var wrap = document.getElementById('trend-chart-wrap'); if (!wrap) return;
    var issues = getIssues(rows); if (range !== 'all') issues = issues.slice(-Number(range));
    var scoped = rows.filter(function (item) { return issues.indexOf(itemIssue(item)) >= 0; });
    var totals = directionRows(scoped), dirs = Object.keys(totals).sort(function (a, b) { return totals[b] - totals[a] || a.localeCompare(b, 'zh-CN'); }).slice(0, 5);
    wrap.textContent = '';
    if (!dirs.length || !issues.length) { wrap.appendChild(el('p', 'trend-keyword-empty', '当前范围内暂无研究方向统计。')); return scoped; }
    var max = 1; dirs.forEach(function (dir) { issues.forEach(function (issue) { var count = directionRows(scoped.filter(function (item) { return itemIssue(item) === issue; }))[dir] || 0; max = Math.max(max, count); }); });
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 640 230'); svg.setAttribute('class', 'trend-chart'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', '按周报期次统计的研究方向入选文献数量');
    var title = document.createElementNS(svg.namespaceURI, 'title'); title.textContent = '本站精选文献中各研究方向的期次分布'; svg.appendChild(title);
    var left = 38, top = 16, width = 585, height = 174;
    for (var tick = 0; tick < 4; tick++) { var y = top + height - tick * (height / 3); var line = document.createElementNS(svg.namespaceURI, 'line'); line.setAttribute('x1', left); line.setAttribute('x2', left + width); line.setAttribute('y1', y); line.setAttribute('y2', y); line.setAttribute('class', 'gridline'); svg.appendChild(line); var label = document.createElementNS(svg.namespaceURI, 'text'); label.setAttribute('x', 3); label.setAttribute('y', y + 3); label.textContent = String(Math.round(max * tick / 3)); svg.appendChild(label); }
    var issueLabelMap = Object.create(null); scoped.forEach(function (item) { issueLabelMap[itemIssue(item)] = item.issue_week || itemIssue(item); });
    var perIssue = issues.map(function (issue) { return directionRows(scoped.filter(function (item) { return itemIssue(item) === issue; })); });
    dirs.forEach(function (dir, index) {
      var points = issues.map(function (_, i) { var x = left + (issues.length === 1 ? width / 2 : i * width / (issues.length - 1)); var value = perIssue[i][dir] || 0; var y = top + height - value / max * height; return { x: x, y: y, value: value, issue: issues[i] }; });
      var poly = document.createElementNS(svg.namespaceURI, 'polyline'); poly.setAttribute('points', points.map(function (p) { return p.x + ',' + p.y; }).join(' ')); poly.setAttribute('fill', 'none'); poly.setAttribute('stroke', COLORS[index % COLORS.length]); poly.setAttribute('stroke-width', '2.2'); poly.setAttribute('stroke-linecap', 'round'); poly.setAttribute('stroke-linejoin', 'round'); svg.appendChild(poly);
      points.forEach(function (p) { var dot = document.createElementNS(svg.namespaceURI, 'circle'); dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y); dot.setAttribute('r', '3.3'); dot.setAttribute('fill', COLORS[index % COLORS.length]); var tip = document.createElementNS(svg.namespaceURI, 'title'); tip.textContent = issueLabelMap[p.issue] + ' · ' + dir + ' · ' + p.value + ' 篇'; dot.appendChild(tip); svg.appendChild(dot); });
    });
    issues.forEach(function (issue, i) { if (issues.length > 8 && i % 2) return; var x = left + (issues.length === 1 ? width / 2 : i * width / (issues.length - 1)); var label = document.createElementNS(svg.namespaceURI, 'text'); label.setAttribute('x', x); label.setAttribute('y', 211); label.setAttribute('text-anchor', 'middle'); label.textContent = issueLabelMap[issue] || issue; svg.appendChild(label); });
    wrap.appendChild(svg);
    var legend = document.getElementById('trend-legend'); legend.textContent = '';
    dirs.forEach(function (dir, index) { var button = el('button', '', dir + ' · ' + totals[dir]); button.type = 'button'; button.style.setProperty('--trend-color', COLORS[index % COLORS.length]); button.addEventListener('click', function () { global.dispatchEvent(new CustomEvent('gr:trend-topic', { detail: { topic: dir } })); }); legend.appendChild(button); });
    return scoped;
  }
  function canonicalJournal(name) { var value = String(name || '').trim(); return JOURNAL_ALIASES[clean(value)] || value || '未标注'; }
  function renderJournals(rows) {
    var host = document.getElementById('trend-journals'); if (!host) return; host.textContent = '';
    var map = Object.create(null); rows.forEach(function (item) { var name = canonicalJournal(item.journal); map[name] = (map[name] || 0) + 1; });
    var total = rows.length, entries = Object.keys(map).sort(function (a, b) { return map[b] - map[a] || a.localeCompare(b, 'zh-CN'); }).slice(0, 9);
    entries.forEach(function (name) { var row = el('div', 'trend-journal-row'), label = el('button', 'trend-journal-label', name), count = el('span', 'trend-journal-count', map[name] + ' 篇 · ' + (total ? Math.round(map[name] / total * 100) : 0) + '%'), bar = el('span', 'trend-journal-bar'), fill = document.createElement('i'); label.type = 'button'; label.setAttribute('aria-label', '搜索期刊 ' + name); label.addEventListener('click', function () { global.dispatchEvent(new CustomEvent('gr:trend-query', { detail: { query: name } })); }); fill.style.width = (total ? map[name] / total * 100 : 0) + '%'; bar.appendChild(fill); row.append(label, count, bar); host.appendChild(row); });
    if (!entries.length) host.appendChild(el('p', 'trend-keyword-empty', '当前筛选范围内暂无期刊数据。'));
  }
  function renderKeywords(rows) {
    var host = document.getElementById('trend-keywords'), focusHost = document.getElementById('trend-focus-terms'); if (!host) return; host.textContent = '';
    var counts = Object.create(null), labels = Object.create(null);
    rows.forEach(function (item) {
      var full = [item.title_zh, item.title_en, item.summary, item.abstract, item.keywords].map(function (x) { return Array.isArray(x) ? x.join(' ') : x || ''; }).join(' ');
      var seen = Object.create(null);
      function add(key, type) { var normalized = clean(key); if (!normalized || seen[normalized]) return; seen[normalized] = true; counts[key] = (counts[key] || 0) + 1; labels[key] = type; }
      matchingSpecies(full).forEach(function (group) { add(group[0], '物种'); });
      matchedMethods(full).forEach(function (method) { add(method, '方法'); });
      TECH_TERMS.forEach(function (term) { if (full.toLocaleLowerCase().indexOf(term.toLocaleLowerCase()) >= 0) add(term, '技术'); });
      var explicit = Object.create(null);
      (item.keywords || []).concat(item.research_direction || []).forEach(function (word) {
        var key = String(word || '').trim(), normalized = clean(key);
        if (key && !GENERIC_KEYWORDS[normalized] && key.length <= 30) explicit[key] = true;
      });
      Object.keys(explicit).forEach(function (key) { add(key, '主题'); });
    });
    var terms = Object.keys(counts).filter(function (word) { return counts[word] > 1; }).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b, 'zh-CN'); }).slice(0, 24);
    terms.forEach(function (word) { var b = el('button', '', (labels[word] ? labels[word] + ' · ' : '') + word + ' · ' + counts[word]); b.type = 'button'; b.addEventListener('click', function () { global.dispatchEvent(new CustomEvent('gr:trend-query', { detail: { query: word } })); }); host.appendChild(b); });
    if (!terms.length) host.appendChild(el('p', 'trend-keyword-empty', '当前范围内暂无重复关键词。'));
    if (focusHost) {
      focusHost.textContent = '';
      var focus = global.GenomeRadarTerms ? global.GenomeRadarTerms.load() : [];
      focus.forEach(function (word) { var button = el('button', '', word); button.type = 'button'; button.addEventListener('click', function () { global.dispatchEvent(new CustomEvent('gr:trend-query', { detail: { query: word } })); }); focusHost.appendChild(button); });
      focusHost.hidden = !focus.length;
    }
    var radar = document.getElementById('trend-radar-label');
    if (radar) radar.hidden = !(global.GenomeRadarTerms && global.GenomeRadarTerms.load().length);
  }
  function render(indexArticles, filteredRows) {
    var details = document.getElementById('trend-panel'); if (!details) return;
    state.articles = Array.isArray(indexArticles) ? indexArticles : [];
    state.rows = Array.isArray(filteredRows) ? filteredRows : state.articles;
    var select = document.getElementById('trend-range'); if (select) state.range = select.value;
    var radar = document.getElementById('trend-radar-only'); state.radar = !!(radar && radar.checked);
    var scopeRows = state.rows;
    if (state.radar && global.GenomeRadarTerms) scopeRows = scopeRows.filter(function (item) { return global.GenomeRadarTerms.matchesArticle(item); });
    var issues = getIssues(state.articles), scopedIssues = state.range === 'all' ? issues : issues.slice(-Number(state.range));
    scopeRows = scopeRows.filter(function (item) { return scopedIssues.indexOf(itemIssue(item)) >= 0; });
    var count = document.getElementById('trend-count'); if (count) count.textContent = scopeRows.length + ' 篇';
    renderJournals(scopeRows); renderKeywords(scopeRows); buildChart(scopeRows, 'all');
  }
  function initControls() {
    var range = document.getElementById('trend-range'), radar = document.getElementById('trend-radar-only');
    if (range) range.addEventListener('change', function () { render(state.articles, state.rows); });
    if (radar) radar.addEventListener('change', function () { render(state.articles, state.rows); });
  }
  global.GenomeRadarTrends = { render: render };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initControls, { once: true }); else initControls();
})(window);
