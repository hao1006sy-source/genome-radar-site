/**
 * Genome Radar - 专题详情页交互引擎 (topics.js)
 * 实现数据动态聚合、多维过滤、趋势统计、收藏状态双向同步与跨专题导航
 */
(function (window, document) {
  'use strict';

  var state = {
    currentTopicId: 'assembly-annotation',
    articles: [],          // 当前专题的全部文章
    filteredArticles: [],  // 筛选后的文章
    query: '',
    selectedKeyword: '',
    selectedQuartile: 'all',
    selectedYear: 'all',
    selectedCategory: 'all',
    sortBy: 'issue_desc',
    libraryData: null
  };

  // DOM 元素缓存
  var els = {};

  function init() {
    // 缓存元素
    els.topicTabs = document.getElementById('topic-tabs');
    els.breadcrumbTopic = document.getElementById('breadcrumb-topic');
    els.heroIcon = document.getElementById('hero-topic-icon');
    els.heroTitleZh = document.getElementById('hero-title-zh');
    els.heroTitleEn = document.getElementById('hero-title-en');
    els.heroBadge = document.getElementById('hero-badge');
    els.heroDesc = document.getElementById('hero-desc');
    els.statTotal = document.getElementById('stat-topic-total');
    els.statNew = document.getElementById('stat-topic-new');
    els.statJournals = document.getElementById('stat-topic-journals');
    els.statSpan = document.getElementById('stat-topic-span');
    els.trendBar = document.getElementById('topic-trend-chart');
    els.keywordChips = document.getElementById('topic-keyword-chips');
    els.searchInput = document.getElementById('topic-search-input');
    els.filterQuartile = document.getElementById('filter-quartile');
    els.filterYear = document.getElementById('filter-year');
    els.filterCategory = document.getElementById('filter-category');
    els.sortSelect = document.getElementById('sort-select');
    els.articlesList = document.getElementById('topic-articles-list');
    els.resultsCount = document.getElementById('topic-results-count');
    els.resetFiltersBtn = document.getElementById('reset-filters-btn');

    // 解析 URL 参数
    var params = new URLSearchParams(window.location.search);
    var topicParam = params.get('topic');
    if (topicParam && GenomeRadarTopics.getTopicById(topicParam)) {
      state.currentTopicId = topicParam;
    } else {
      state.currentTopicId = GenomeRadarTopics.DEFINITIONS[0].id;
    }

    // 初始化本地文献库存储
    if (window.GenomeLibrary) {
      try {
        state.libraryData = window.GenomeLibrary.read();
      } catch (e) {
        console.warn('文献库加载失败', e);
      }
    }

    // 绑定事件
    bindEvents();

    // 渲染顶部专题 Tab 切换器
    renderTopicTabs();

    // 加载全站数据
    loadSiteData();
  }

  function bindEvents() {
    // 搜索输入
    els.searchInput.addEventListener('input', function (e) {
      state.query = e.target.value.trim().toLowerCase();
      applyFilters();
    });

    // 下拉筛选
    els.filterQuartile.addEventListener('change', function (e) {
      state.selectedQuartile = e.target.value;
      applyFilters();
    });

    els.filterYear.addEventListener('change', function (e) {
      state.selectedYear = e.target.value;
      applyFilters();
    });

    els.filterCategory.addEventListener('change', function (e) {
      state.selectedCategory = e.target.value;
      applyFilters();
    });

    // 排序
    els.sortSelect.addEventListener('change', function (e) {
      state.sortBy = e.target.value;
      applyFilters();
    });

    // 重置筛选
    els.resetFiltersBtn.addEventListener('click', function () {
      state.query = '';
      state.selectedKeyword = '';
      state.selectedQuartile = 'all';
      state.selectedYear = 'all';
      state.selectedCategory = 'all';
      state.sortBy = 'issue_desc';

      els.searchInput.value = '';
      els.filterQuartile.value = 'all';
      els.filterYear.value = 'all';
      els.filterCategory.value = 'all';
      els.sortSelect.value = 'issue_desc';

      // 刷新关键词 chip 高亮
      var activeChip = els.keywordChips.querySelector('.kw-chip.active');
      if (activeChip) activeChip.classList.remove('active');

      applyFilters();
    });

    // 监听文献库变更事件
    window.addEventListener('gr-library-change', function () {
      if (window.GenomeLibrary) {
        state.libraryData = window.GenomeLibrary.read();
        updateStarButtons();
      }
    });

    // 监听浏览历史的前进/后退
    window.addEventListener('popstate', function () {
      var params = new URLSearchParams(window.location.search);
      var topicParam = params.get('topic');
      if (topicParam && GenomeRadarTopics.getTopicById(topicParam)) {
        switchTopic(topicParam, false);
      }
    });
  }

  function renderTopicTabs() {
    els.topicTabs.innerHTML = '';
    GenomeRadarTopics.DEFINITIONS.forEach(function (topic) {
      var tab = document.createElement('a');
      tab.className = 'topic-nav-tab' + (topic.id === state.currentTopicId ? ' active' : '');
      tab.href = 'topic.html?topic=' + encodeURIComponent(topic.id);
      tab.innerHTML = topic.name_zh;
      tab.addEventListener('click', function (e) {
        e.preventDefault();
        switchTopic(topic.id, true);
      });
      els.topicTabs.appendChild(tab);
    });
  }

  function loadSiteData() {
    fetch('assets/search-index.json')
      .then(function (res) {
        if (!res.ok) throw new Error('无法读取 search-index.json');
        return res.json();
      })
      .then(function (data) {
        window.__ALL_ARTICLES = data.articles || [];
        window.__AGGREGATED = GenomeRadarTopics.aggregateTopics(window.__ALL_ARTICLES);
        switchTopic(state.currentTopicId, false);
      })
      .catch(function (err) {
        console.error(err);
        els.articlesList.innerHTML = '<div class="empty-state"><h3 style="color:#b33;">加载失败</h3><p>' + err.message + '</p></div>';
      });
  }

  function switchTopic(topicId, updateHistory) {
    state.currentTopicId = topicId;
    var topicMeta = GenomeRadarTopics.getTopicById(topicId);
    if (!topicMeta) return;

    if (updateHistory) {
      history.pushState(null, '', 'topic.html?topic=' + encodeURIComponent(topicId));
    }

    // 更新页面 title
    document.title = topicMeta.name_zh + ' · 研究专题 · 基因组雷达';

    // 更新 Tab 高亮
    var tabs = els.topicTabs.querySelectorAll('.topic-nav-tab');
    tabs.forEach(function (tab) {
      var href = tab.getAttribute('href');
      tab.classList.toggle('active', href.indexOf(topicId) !== -1);
    });

    // 更新 Hero
    els.breadcrumbTopic.textContent = topicMeta.name_zh;
    els.heroIcon.innerHTML = topicMeta.icon;
    els.heroTitleZh.textContent = topicMeta.name_zh;
    els.heroTitleEn.textContent = topicMeta.name_en;
    els.heroBadge.textContent = topicMeta.badge;
    els.heroDesc.textContent = topicMeta.description;

    // 获取当前专题聚合数据
    var group = window.__AGGREGATED ? window.__AGGREGATED.topics[topicId] : null;
    state.articles = group ? group.articles : [];

    // 更新统计看板
    var total = state.articles.length;
    var newCount = group ? group.latestNewCount : 0;
    var journalCount = group ? Object.keys(group.journals).length : 0;
    
    // 计算年份跨度
    var years = group ? Object.keys(group.years).sort() : [];
    var yearSpan = years.length > 1 ? years[0] + ' ~ ' + years[years.length - 1] : (years[0] || '2026');

    els.statTotal.textContent = total + ' 篇';
    els.statNew.textContent = '+' + newCount + ' 篇';
    els.statJournals.textContent = journalCount + ' 种';
    els.statSpan.textContent = yearSpan;

    // 填充年份下拉项
    els.filterYear.innerHTML = '<option value="all">全部发表年份</option>';
    years.forEach(function (yr) {
      var opt = document.createElement('option');
      opt.value = yr;
      opt.textContent = yr + ' 年 (' + group.years[yr] + ')';
      els.filterYear.appendChild(opt);
    });

    // 渲染收录趋势条形图
    renderTrendChart(group);

    // 渲染热门关键词
    renderKeywordChips(group);

    // 重置局部筛选并应用
    state.query = '';
    state.selectedKeyword = '';
    state.selectedQuartile = 'all';
    state.selectedYear = 'all';
    state.selectedCategory = 'all';
    state.sortBy = 'issue_desc';

    els.searchInput.value = '';
    els.filterQuartile.value = 'all';
    els.filterCategory.value = 'all';
    els.sortSelect.value = 'issue_desc';

    applyFilters();
  }

  function renderTrendChart(group) {
    if (!group || !els.trendBar) return;
    var issues = Object.keys(group.issues).sort();
    if (issues.length === 0) {
      els.trendBar.innerHTML = '<div style="color:var(--muted);font-size:12px;">暂无期次数据</div>';
      return;
    }

    var maxVal = Math.max.apply(null, issues.map(function (k) { return group.issues[k]; })) || 1;
    var html = '<div class="trend-bars-wrapper">';

    issues.forEach(function (iss) {
      var count = group.issues[iss];
      var heightPct = Math.max(15, Math.round((count / maxVal) * 100));
      var isLatest = (iss === window.__AGGREGATED.latestIssue);

      html += 
        '<div class="trend-bar-col" title="' + iss + ': 收录 ' + count + ' 篇">' +
          '<div class="trend-bar-track">' +
            '<div class="trend-bar-fill' + (isLatest ? ' latest' : '') + '" style="height:' + heightPct + '%;"></div>' +
          '</div>' +
          '<span class="trend-bar-count">' + count + '</span>' +
          '<span class="trend-bar-label">' + iss.slice(5) + '</span>' +
        '</div>';
    });

    html += '</div>';
    els.trendBar.innerHTML = html;
  }

  function renderKeywordChips(group) {
    if (!group || !els.keywordChips) return;
    var kws = group.keywords || {};
    var sortedKws = Object.keys(kws).sort(function (a, b) {
      return kws[b] - kws[a];
    }).slice(0, 14);

    if (sortedKws.length === 0) {
      els.keywordChips.innerHTML = '<span style="color:var(--muted);font-size:12px;">无高频词</span>';
      return;
    }

    var html = '<span class="filter-chip-label">高频词快捷过滤：</span>';
    sortedKws.forEach(function (kw) {
      html += '<button type="button" class="kw-chip" data-kw="' + kw + '">' + kw + ' <small>(' + kws[kw] + ')</small></button>';
    });

    els.keywordChips.innerHTML = html;

    // 绑定高频词点击
    els.keywordChips.querySelectorAll('.kw-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var kw = btn.getAttribute('data-kw');
        if (state.selectedKeyword === kw) {
          state.selectedKeyword = '';
          btn.classList.remove('active');
        } else {
          var prev = els.keywordChips.querySelector('.kw-chip.active');
          if (prev) prev.classList.remove('active');
          state.selectedKeyword = kw;
          btn.classList.add('active');
        }
        applyFilters();
      });
    });
  }

  function applyFilters() {
    var rows = state.articles.slice();

    // 1. 关键词搜索
    if (state.query) {
      rows = rows.filter(function (a) {
        var text = (
          (a.title_zh || '') + ' ' + 
          (a.title_en || '') + ' ' + 
          (a.summary || '') + ' ' + 
          (a.abstract || '') + ' ' + 
          (a.journal || '') + ' ' + 
          (a.affiliation || '') + ' ' + 
          (a.doi || '')
        ).toLowerCase();
        return text.indexOf(state.query) !== -1;
      });
    }

    // 2. Chip 关键词过滤
    if (state.selectedKeyword) {
      rows = rows.filter(function (a) {
        var kwList = (a.keywords || []).map(function (k) { return String(k).trim().toLowerCase(); });
        var dirList = (a.research_direction || []).map(function (d) { return String(d).trim().toLowerCase(); });
        var target = state.selectedKeyword.toLowerCase();
        return kwList.indexOf(target) !== -1 || dirList.indexOf(target) !== -1;
      });
    }

    // 3. 期刊分区过滤
    if (state.selectedQuartile !== 'all') {
      rows = rows.filter(function (a) {
        var q = String(a.quartile || '');
        if (state.selectedQuartile === 'top') {
          return q.indexOf('Top') !== -1;
        } else if (state.selectedQuartile === 'q1') {
          return q.indexOf('1区') !== -1;
        } else if (state.selectedQuartile === 'q2') {
          return q.indexOf('2区') !== -1;
        }
        return true;
      });
    }

    // 4. 年份过滤
    if (state.selectedYear !== 'all') {
      rows = rows.filter(function (a) {
        var yr = (a.publication_date || '').slice(0, 4) || (a.issue || '').slice(0, 4);
        return yr === state.selectedYear;
      });
    }

    // 5. 类别过滤
    if (state.selectedCategory !== 'all') {
      rows = rows.filter(function (a) {
        return a.category === state.selectedCategory;
      });
    }

    // 6. 排序
    rows.sort(function (x, y) {
      if (state.sortBy === 'issue_desc') {
        var ix = x.issue || '', iy = y.issue || '';
        if (ix !== iy) return iy.localeCompare(ix);
        return (x.article_number || 0) - (y.article_number || 0);
      } else if (state.sortBy === 'date_desc') {
        var dx = x.publication_date || x.issue || '';
        var dy = y.publication_date || y.issue || '';
        return dy.localeCompare(dx);
      } else if (state.sortBy === 'if_desc') {
        var ifx = parseFloat(x.impact_factor) || 0;
        var ify = parseFloat(y.impact_factor) || 0;
        return ify - ifx;
      }
      return 0;
    });

    state.filteredArticles = rows;
    renderArticles();
  }

  function renderArticles() {
    var totalCount = state.filteredArticles.length;
    els.resultsCount.textContent = '共筛选出 ' + totalCount + ' 篇专题文献';

    if (totalCount === 0) {
      els.articlesList.innerHTML = 
        '<div class="empty-state">' +
          '<h3>未找到匹配的文献</h3>' +
          '<p>请尝试减少筛选条件或调整搜索关键词</p>' +
          '<button type="button" class="btn-action" style="margin-top:12px;" onclick="document.getElementById(\'reset-filters-btn\').click()">清除所有筛选</button>' +
        '</div>';
      return;
    }

    var html = '';
    state.filteredArticles.forEach(function (item) {
      var directUrl = item.article_url || (item.issue + '/index.html?article=' + item.article_number);
      var isStarred = false;

      if (state.libraryData && window.GenomeLibrary) {
        try {
          var rec = window.GenomeLibrary.rec(state.libraryData, item);
          if (rec && rec.starred) isStarred = true;
        } catch (e) {}
      }

      // 研究方向标签（带跨专题跳转入口）
      var dirs = Array.isArray(item.research_direction) ? item.research_direction : [item.research_direction || ''];
      var tagsHtml = dirs.map(function (d) {
        if (!d) return '';
        var matchedIds = GenomeRadarTopics.mapTagToTopicIds(d);
        var targetTopicId = matchedIds.length > 0 ? matchedIds[0] : state.currentTopicId;
        return '<a class="topic-tag-link" href="topic.html?topic=' + encodeURIComponent(targetTopicId) + '" title="进入「' + d + '」专题">' +
                 '# ' + d +
               '</a>';
      }).join('');

      var quartileHtml = item.quartile ? '<span class="article-zone">' + item.quartile + '</span>' : '';
      var ifHtml = item.impact_factor ? '<span class="article-if">IF ' + item.impact_factor + '</span>' : '';
      var issueHtml = item.issue_week ? '<span class="article-week-badge">' + item.issue_week + '</span>' : '';
      var doiLink = item.doi ? '<a class="btn-action" href="https://doi.org/' + encodeURIComponent(item.doi) + '" target="_blank" rel="noopener">原文 DOI ↗</a>' : '';

      html += 
        '<article class="article-card" data-id="' + item.id + '">' +
          '<div class="article-meta">' +
            '<span class="article-journal">' + (item.journal || '期刊未标注') + '</span>' +
            quartileHtml +
            ifHtml +
            '<span>·</span>' +
            issueHtml +
            '<span style="color:#888;">(' + (item.publication_date || item.issue) + ')</span>' +
          '</div>' +
          '<h3 class="article-title-zh">' +
            '<a href="' + directUrl + '" title="在周报中阅读解读全文">' + (item.title_zh || '标题未标注') + '</a>' +
          '</h3>' +
          '<p class="article-title-en">' + (item.title_en || '') + '</p>' +
          '<p class="article-summary">' + (item.summary || item.abstract || '') + '</p>' +
          '<div class="article-footer">' +
            '<div class="article-tags">' + tagsHtml + '</div>' +
            '<div class="article-actions">' +
              doiLink +
              '<button type="button" class="btn-action btn-star' + (isStarred ? ' starred' : '') + '" data-article-id="' + item.id + '" title="收藏至本地文献库">' +
                (isStarred ? '★ 已收藏' : '☆ 收藏') +
              '</button>' +
              '<a class="btn-action" href="library.html?article=' + encodeURIComponent(item.id) + '" title="查看研究笔记与文献库详情">笔记</a>' +
              '<a class="btn-action btn-primary-action" href="deep-read.html?article=' + encodeURIComponent(item.id) + '" title="进入论文精读工作台">精读工作台 →</a>' +
            '</div>' +
          '</div>' +
        '</article>';
    });

    els.articlesList.innerHTML = html;

    // 绑定卡片上的收藏按钮事件
    bindStarButtons();
  }

  function bindStarButtons() {
    var starBtns = els.articlesList.querySelectorAll('.btn-star');
    starBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var articleId = btn.getAttribute('data-article-id');
        var article = state.articles.find(function (a) { return a.id === articleId; });
        if (!article || !window.GenomeLibrary) return;

        try {
          window.GenomeLibrary.update(article, function (r) {
            r.starred = !r.starred;
          });
          state.libraryData = window.GenomeLibrary.read();
          var rec = window.GenomeLibrary.rec(state.libraryData, article);
          var nowStarred = rec && rec.starred;
          btn.classList.toggle('starred', nowStarred);
          btn.textContent = nowStarred ? '★ 已收藏' : '☆ 收藏';

          // 派发跨页面同步事件
          window.dispatchEvent(new CustomEvent('gr-library-change'));
        } catch (err) {
          alert('收藏更新失败: ' + err.message);
        }
      });
    });
  }

  function updateStarButtons() {
    if (!state.libraryData || !window.GenomeLibrary) return;
    var starBtns = els.articlesList.querySelectorAll('.btn-star');
    starBtns.forEach(function (btn) {
      var articleId = btn.getAttribute('data-article-id');
      var article = state.articles.find(function (a) { return a.id === articleId; });
      if (!article) return;
      var rec = window.GenomeLibrary.rec(state.libraryData, article);
      var nowStarred = rec && rec.starred;
      btn.classList.toggle('starred', nowStarred);
      btn.textContent = nowStarred ? '★ 已收藏' : '☆ 收藏';
    });
  }

  // 页面加载就绪
  document.addEventListener('DOMContentLoaded', init);

})(window, document);
