(function (global) {
  'use strict';
  var SPECIES = [
    ['玉米', 'maize', 'corn', 'zea mays'], ['水稻', 'rice', 'oryza sativa'], ['小麦', 'wheat', 'triticum aestivum'],
    ['大豆', 'soybean', 'glycine max'], ['油菜', 'rapeseed', 'canola', 'brassica napus'], ['番茄', 'tomato', 'solanum lycopersicum']
  ];
  var METHOD_PATTERNS = [
    ['GWAS', /\bgwas\b|genome[- ]wide association/i], ['QTL', /\bqtl\b/i], ['Hi-C', /\bhi[- ]?c\b|chromosome conformation/i],
    ['RNA-seq', /rna[- ]?seq|transcriptom/i], ['单细胞', /single[- ]cell|single cell|scrna|sc\s*eqtl/i],
    ['长读长测序', /long[- ]read|nanopore|pacbio/i], ['泛基因组', /pangenome|pan[- ]genome/i],
    ['CRISPR', /crispr|cas9/i], ['表观组学', /methylation|epigenom|atac[- ]?seq/i], ['基因组预测', /genomic prediction|genomic selection/i]
  ];
  var GENERIC = /^(plant|plants|genome|genomics|gene|genes|study|analysis|approach|method|new|novel|data|基因|基因组|植物|研究|分析|方法|构建|鉴定|揭示|调控|应用|结果|表型|遗传|性状|不同|影响|特征|首次|相关|基于|研究中|本研究)$/i;
  var TOPIC_TERMS = ['稀有变异', '结构变异', '转座子', '基因组组装', '基因组预测', '杂交设计', '端粒到端粒', '单倍型', '单倍型解析', '泛基因组', '群体遗传', '遗传多样性', '遗传基础', '关联分析', '农艺性状', '数量性状', '种质资源', '基因表达', '表达调控', '调控网络', '抗病性', '胁迫响应', '开花期', '产量性状', '基因编辑', '分子育种', '染色质', '甲基化', '细胞类型', '空间转录组', '单细胞', '基因家族', '候选基因', '着丝粒', '基因型表现', '基因组选择', '遗传效应', '驯化历史', '驯化过程', '图形泛基因组', '长读长', '染色体结构'];
  var DIRECTIONS = Object.create(null);
  ['变异与关联', '方法与工具', '泛基因组', '泛基因组与组装', '组装与注释', '表观与调控', '进化与比较', '单细胞与空间'].forEach(function (value) { DIRECTIONS[clean(value)] = true; });
  var STOP = Object.create(null);
  ['基因', '因组', '植物', '作物', '玉米', '水稻', '小麦', '大豆', '油菜', '番茄', '研究', '分析', '方法', '结果', '发现', '揭示', '构建', '鉴定', '解析', '调控', '基于', '相关', '影响', '特征', '数据', '多种', '不同', '首次', '重要', '功能', '遗传', '表型', '单个', '多个', '进行', '通过', '细胞', 'gwas', 'qtl', 'hi-c', 'hi c', 'rna-seq', 'rna seq', 'single-cell', 'single cell', 'crispr', 'twas', 'pangenome', 'pan-genome', 'pan genome', 'soybean', 'maize', 'corn', 'zea', 'mays', 'rice', 'oryza', 'wheat', 'triticum', 'canola', 'rapeseed', 'brassica', 'tomato', 'solanum', 'show', 'using', 'based', 'study', 'studies', 'analysis', 'results', 'gene', 'genes', 'plant', 'plants', 'genome', 'genomic', 'genomics', 'novel', 'identify', 'revealed', 'demonstrate', 'associated', 'approach', 'method'].forEach(function (value) { STOP[clean(value)] = true; });
  function el(tag, cls, text) { var node = document.createElement(tag); if (cls) node.className = cls; if (text != null) node.textContent = text; return node; }
  function clean(value) { return String(value || '').normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, ' ').trim(); }
  function getSpecies(text) { var value = clean(text); return SPECIES.filter(function (group) { return group.some(function (name) { return value.indexOf(clean(name)) >= 0; }); }).map(function (group) { return group[0]; }); }
  function getMethods(text) { return METHOD_PATTERNS.filter(function (entry) { return entry[1].test(text); }).map(function (entry) { return entry[0]; }); }
  function tokenSet(text) {
    var words = String(text || '').toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [];
    return words.filter(function (word) { return !GENERIC.test(word); }).reduce(function (set, word) { set[word] = true; return set; }, Object.create(null));
  }
  function arraySet(values) { var set = Object.create(null); (Array.isArray(values) ? values : []).forEach(function (x) { var key = clean(x); if (key && !GENERIC.test(key) && !DIRECTIONS[key]) set[key] = true; }); return set; }
  function intersection(a, b) { return Object.keys(a).filter(function (key) { return b[key]; }); }
  function normalizeDoi(value) { return clean(value).replace(/^https? doi org /, '').replace(/^doi /, '').trim(); }
  function contentTokens(text) {
    var source = String(text || '').toLocaleLowerCase().normalize('NFKC'), set = Object.create(null);
    (source.match(/[a-z0-9][a-z0-9.+-]{2,}/g) || []).forEach(function (word) { var key = clean(word); if (key.length >= 3 && !STOP[key] && !GENERIC.test(key)) set[key] = true; });
    TOPIC_TERMS.forEach(function (term) { if (source.indexOf(term.toLocaleLowerCase()) >= 0) set[clean(term)] = true; });
    return set;
  }
  function recordText(item) { return [item.title_zh, item.title_en, item.summary, item.abstract].join(' '); }
  function buildDocumentFrequency(items) {
    var df = Object.create(null);
    items.forEach(function (item) { Object.keys(contentTokens(recordText(item))).forEach(function (term) { df[term] = (df[term] || 0) + 1; }); });
    return df;
  }
  function currentRecord(items) {
    var issue = location.pathname.match(/(?:^|\/)(\d{4}-\d{2}-\d{2})\/index\.html$/);
    var number = parseInt(new URLSearchParams(location.search).get('article') || '0', 10);
    if (!issue || number < 1) return null;
    return items.find(function (item) { return item.issue === issue[1] && Number(item.article_number) === number; }) || null;
  }
  function candidateScore(current, candidate, documentFrequency, corpusSize) {
    if (!current || !candidate || current.issue === candidate.issue) return null;
    var currentDate = current.issue_date || current.issue || '', candidateDate = candidate.issue_date || candidate.issue || '';
    if (candidateDate >= currentDate) return null;
    var doi = normalizeDoi(current.doi); if (doi && doi === normalizeDoi(candidate.doi)) return null;
    var currentAll = [recordText(current), (current.keywords || []).join(' ')].join(' ');
    var candidateAll = [recordText(candidate), (candidate.keywords || []).join(' ')].join(' ');
    var sharedSpecies = intersection(getSpecies(currentAll).reduce(function (o, x) { o[x] = true; return o; }, Object.create(null)), getSpecies(candidateAll).reduce(function (o, x) { o[x] = true; return o; }, Object.create(null)));
    var directions = intersection(arraySet(current.research_direction), arraySet(candidate.research_direction));
    var keywords = intersection(arraySet(current.keywords), arraySet(candidate.keywords)).filter(function (x) { return x.length > 2; });
    var methods = intersection(getMethods(currentAll).reduce(function (o, x) { o[x] = true; return o; }, Object.create(null)), getMethods(candidateAll).reduce(function (o, x) { o[x] = true; return o; }, Object.create(null)));
    var sharedTerms = intersection(contentTokens(recordText(current)), contentTokens(recordText(candidate)))
      .filter(function (term) { return !documentFrequency || (documentFrequency[term] || 0) <= Math.max(5, corpusSize * .3); })
      .sort(function (a, b) { return (documentFrequency && documentFrequency[a] || 1) - (documentFrequency && documentFrequency[b] || 1) || a.localeCompare(b, 'zh-CN'); });
    var families = [sharedSpecies.length, methods.length, keywords.length, sharedTerms.length].filter(function (n) { return n > 0; }).length;
    // Direction labels are broad categories in the current index. They add context to a reason,
    // but never qualify a weak recommendation by themselves.
    if (families < 2) return null;
    var score = sharedSpecies.length * 6 + methods.length * 3.2 + Math.min(keywords.length, 4) * 2.4
      + Math.min(sharedTerms.length, 5) * 1.55 + directions.length * .7;
    var reasons = [];
    if (sharedSpecies.length) reasons.push('同物种 · ' + sharedSpecies[0]);
    if (methods.length) reasons.push('方法 · ' + methods.slice(0, 2).join('、'));
    if (keywords.length) reasons.push('关键词 · ' + keywords.slice(0, 2).join('、'));
    else if (sharedTerms.length) reasons.push('主题词 · ' + sharedTerms.slice(0, 2).join('、'));
    if (directions.length && reasons.length < 3) reasons.push('研究方向 · ' + directions.slice(0, 1).join('、'));
    return { item: candidate, score: score, reasons: reasons.slice(0, 3), families: families };
  }
  function validUrl(item) {
    var url = String(item.article_url || '');
    return /^\d{4}-\d{2}-\d{2}\/index\.html\?article=[1-9]\d*$/.test(url) ? url : '';
  }
  function render(index) {
    var current = currentRecord(index), pages = document.querySelectorAll('.article-page');
    if (!current || !pages.length) return;
    var page = pages[Number(current.article_number) - 1], grid = page && page.querySelector('.grid');
    if (!grid) return;
    var documentFrequency = buildDocumentFrequency(index);
    var recs = index.map(function (candidate) { return candidateScore(current, candidate, documentFrequency, index.length); }).filter(Boolean)
      .sort(function (a, b) { return b.score - a.score || String(b.item.issue).localeCompare(String(a.item.issue)) || Number(a.item.article_number) - Number(b.item.article_number); })
      .filter(function (row) { return row.score >= 4.5; }).slice(0, 3);
    if (!recs.length) return;
    var section = el('section', 'related-articles');
    section.setAttribute('aria-labelledby', 'related-title');
    section.appendChild(el('h3', 'related-heading', '往期相关推荐'));
    var list = el('div', 'related-list');
    recs.forEach(function (row) {
      var href = validUrl(row.item); if (!href) return;
      var card = el('a', 'related-card'); card.href = '../' + href;
      card.appendChild(el('span', 'related-issue', row.item.issue_week || row.item.issue || '往期期次'));
      card.appendChild(el('strong', 'related-title', row.item.title_zh || '标题未标注'));
      card.appendChild(el('span', 'related-journal', row.item.journal || '期刊未标注'));
      card.appendChild(el('span', 'related-reasons', '相关原因：' + row.reasons.join(' · ')));
      list.appendChild(card);
    });
    if (list.childElementCount) { section.appendChild(list); grid.after(section); }
  }
  fetch('../assets/search-index.json', { credentials: 'same-origin' }).then(function (response) { if (!response.ok) throw new Error('文献索引读取失败'); return response.json(); })
    .then(function (index) { if (index && Array.isArray(index.articles)) render(index.articles); })
    .catch(function () { /* 推荐数据不可用时保留原文章内容。 */ });
})(window);
