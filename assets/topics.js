/**
 * Genome Radar - 研究专题与学术分类交互引擎 V2.0
 * 支持：一级专题首页、二级专题详情、学科发展史多分支时间线、代表性文献库、多维学术检索与文献深链接直达
 */

(function () {
  'use strict';

  var state = {
    currentTopicId: 'assembly-annotation',
    currentSubtopicId: null,
    topicConfig: null,
    subtopicConfig: null,
    allArticles: [],
    topicMap: {},
    milestones: [],
    repPapers: [],
    libraryData: null,
    // 筛选状态
    searchQuery: '',
    selectedSubtopic: 'all',
    selectedContrib: 'all',
    selectedQuartile: 'all',
    selectedYear: 'all',
    selectedSort: 'issue_desc',
    selectedKeyword: null,
    // 时间线筛选
    timelineSubtopic: 'all',
    timelineType: 'all',
    timelineEra: 'all',
    // 代表文献分类
    repCategory: 'all',
    // 折叠状态
    evolutionFolded: false,
    repFolded: false
  };

  var els = {};

  function init() {
    cacheDomElements();
    parseUrlParams();
    fetchInitialData();
  }

  function cacheDomElements() {
    els.breadcrumbPrimary = document.getElementById('breadcrumb-primary-topic');
    els.breadcrumbSubSep = document.getElementById('breadcrumb-subtopic-sep');
    els.breadcrumbSub = document.getElementById('breadcrumb-subtopic');
    els.tabsBar = document.getElementById('topic-tabs');

    // Hero
    els.heroIcon = document.getElementById('hero-topic-icon');
    els.heroTitleZh = document.getElementById('hero-title-zh-text');
    els.heroTitleEn = document.getElementById('hero-title-en');
    els.heroBadge = document.getElementById('hero-badge');
    els.heroDesc = document.getElementById('hero-desc');
    els.heroCriteriaBox = document.getElementById('hero-criteria-box');
    els.heroInclusion = document.getElementById('hero-inclusion');
    els.heroExclusion = document.getElementById('hero-exclusion');
    els.subtopicBackRow = document.getElementById('subtopic-back-row');
    els.subtopicBackBtn = document.getElementById('subtopic-back-btn');

    // Stats
    els.statTotal = document.getElementById('stat-topic-total');
    els.statSubtopics = document.getElementById('stat-topic-subtopics');
    els.statMilestones = document.getElementById('stat-topic-milestones');
    els.statRep = document.getElementById('stat-topic-rep');

    // Subtopics Grid
    els.subtopicsSection = document.getElementById('subtopics-nav-section');
    els.subtopicsGrid = document.getElementById('subtopics-cards-grid');

    // Evolution
    els.evolutionSection = document.getElementById('evolution-section');
    els.evolutionContent = document.getElementById('evolution-content');
    els.toggleEvolutionBtn = document.getElementById('toggle-evolution-btn');
    els.timelineSubtopicFilter = document.getElementById('timeline-subtopic-filter');
    els.timelineTypeFilter = document.getElementById('timeline-type-filter');
    els.timelineEraJumps = document.getElementById('timeline-era-jumps');
    els.timelineContainer = document.getElementById('multibranch-timeline');

    // Representative Papers
    els.repSection = document.getElementById('rep-papers-section');
    els.repContent = document.getElementById('rep-papers-content');
    els.toggleRepBtn = document.getElementById('toggle-rep-btn');
    els.repCategoryTabs = document.getElementById('rep-category-tabs');
    els.repGrid = document.getElementById('rep-papers-grid');
    els.repCntAll = document.getElementById('rep-cnt-all');
    els.repCntFoundation = document.getElementById('rep-cnt-foundation');
    els.repCntMethod = document.getElementById('rep-cnt-method');
    els.repCntFrontier = document.getElementById('rep-cnt-frontier');

    // Trends & Toolbar
    els.trendChart = document.getElementById('topic-trend-chart');
    els.searchInput = document.getElementById('topic-search-input');
    els.filterSubtopic = document.getElementById('filter-subtopic');
    els.filterContrib = document.getElementById('filter-contrib');
    els.filterQuartile = document.getElementById('filter-quartile');
    els.filterYear = document.getElementById('filter-year');
    els.sortSelect = document.getElementById('sort-select');
    els.resetFiltersBtn = document.getElementById('reset-filters-btn');
    els.keywordChipsBar = document.getElementById('topic-keyword-chips');

    // Articles List
    els.resultsCount = document.getElementById('topic-results-count');
    els.articlesList = document.getElementById('topic-articles-list');
  }

  function parseUrlParams() {
    var params = new URLSearchParams(window.location.search);
    var rawTopic = params.get('topic');
    var rawSub = params.get('subtopic');

    state.currentTopicId = window.GenomeRadarTopics.normalizeTopicId(rawTopic);
    state.currentSubtopicId = rawSub ? rawSub.trim() : null;
    state.selectedSubtopic = state.currentSubtopicId || 'all';

    state.topicConfig = window.GenomeRadarTopics.getTopic(state.currentTopicId);
    state.subtopicConfig = state.currentSubtopicId 
      ? window.GenomeRadarTopics.findSubtopic(state.currentTopicId, state.currentSubtopicId) 
      : null;
  }

  function fetchInitialData() {
    if (window.GenomeLibrary && typeof window.GenomeLibrary.read === 'function') {
      try {
        state.libraryData = window.GenomeLibrary.read();
      } catch (e) {
        state.libraryData = null;
      }
    }

    Promise.all([
      fetch('assets/search-index.json').then(function (r) { return r.json(); }),
      fetch('assets/data/topic-milestones.json').then(function (r) { return r.json(); }).catch(function () { return []; }),
      fetch('assets/data/topic-representative-papers.json').then(function (r) { return r.json(); }).catch(function () { return []; })
    ]).then(function (results) {
      var searchData = results[0];
      state.milestones = results[1] || [];
      state.repPapers = results[2] || [];

      state.allArticles = searchData.articles || [];
      state.topicMap = window.GenomeRadarTopics.aggregateTopics(state.allArticles);

      renderAll();
    }).catch(function (err) {
      console.error('Data load error:', err);
      if (els.articlesList) {
        els.articlesList.innerHTML = '<div class="empty-state"><h3 style="color:#b33;">数据加载失败</h3><p>' + err.message + '</p></div>';
      }
    });
  }

  function renderAll() {
    renderPrimaryTabs();
    renderHeroAndBreadcrumbs();
    renderSubtopicsGrid();
    renderEvolutionTimeline();
    renderRepresentativePapers();
    renderTrendsChart();
    populateFilterDropdowns();
    applyFilterAndRenderArticles();
    bindEvents();
  }

  /* --------------------------------------------------------------------------
     1. 导航与 Hero 区渲染
     -------------------------------------------------------------------------- */
  function renderPrimaryTabs() {
    if (!els.tabsBar) return;
    var html = '';
    window.GenomeRadarTopics.TOPICS.forEach(function (topic) {
      var isActive = topic.id === state.currentTopicId;
      html += 
        '<a class="topic-nav-tab' + (isActive ? ' active' : '') + '" href="topic.html?topic=' + encodeURIComponent(topic.id) + '">' +
          '<span class="tab-icon">' + topic.icon_svg + '</span>' +
          '<span>' + topic.name_zh + '</span>' +
        '</a>';
    });
    els.tabsBar.innerHTML = html;
  }

  function renderHeroAndBreadcrumbs() {
    var t = state.topicConfig;
    var sub = state.subtopicConfig;
    var isSubtopicView = !!sub;

    // 面包屑
    if (els.breadcrumbPrimary) {
      els.breadcrumbPrimary.innerHTML = '<a href="topic.html?topic=' + encodeURIComponent(t.id) + '">' + t.name_zh + '</a>';
    }
    if (els.breadcrumbSubSep && els.breadcrumbSub) {
      els.breadcrumbSubSep.style.display = isSubtopicView ? 'inline' : 'none';
      els.breadcrumbSub.style.display = isSubtopicView ? 'inline' : 'none';
      if (isSubtopicView) {
        els.breadcrumbSub.textContent = sub.name_zh;
      }
    }

    // Hero 图标与标题
    if (els.heroIcon) els.heroIcon.innerHTML = t.icon_svg;
    if (els.heroTitleZh) {
      els.heroTitleZh.textContent = isSubtopicView ? sub.name_zh : t.name_zh;
    }
    if (els.heroTitleEn) {
      els.heroTitleEn.textContent = isSubtopicView ? sub.name_en : t.name_en;
    }
    if (els.heroBadge) {
      els.heroBadge.textContent = isSubtopicView ? ('二级专题 · 隶属于「' + t.name_zh + '」') : '核心研究专题';
    }
    if (els.heroDesc) {
      els.heroDesc.textContent = isSubtopicView 
        ? ('本二级专题聚焦「' + sub.name_zh + '」细分方向的前沿理论、技术算法与重要生物学发现。')
        : t.definition;
    }

    // 纳入与排除标准
    if (els.heroCriteriaBox) {
      els.heroCriteriaBox.style.display = isSubtopicView ? 'none' : 'flex';
      if (els.heroInclusion) els.heroInclusion.textContent = t.inclusion_criteria;
      if (els.heroExclusion) els.heroExclusion.textContent = t.exclusion_criteria;
    }

    // 二级专题返回按钮
    if (els.subtopicBackRow && els.subtopicBackBtn) {
      els.subtopicBackRow.style.display = isSubtopicView ? 'block' : 'none';
      els.subtopicBackBtn.href = 'topic.html?topic=' + encodeURIComponent(t.id);
      els.subtopicBackBtn.textContent = '← 返回「' + t.name_zh + '」一级专题首页';
    }

    // 指标看板
    var group = state.topicMap[t.id];
    var topicArticles = group ? group.articles : [];
    var filteredTopicArticles = isSubtopicView
      ? topicArticles.filter(function (a) { return Array.isArray(a.subtopics) && a.subtopics.indexOf(sub.id) !== -1; })
      : topicArticles;

    var topicMilestones = state.milestones.filter(function (m) {
      return m.topic_id === t.id && (!isSubtopicView || (Array.isArray(m.subtopic_ids) && m.subtopic_ids.indexOf(sub.id) !== -1));
    });

    var topicRepPapers = state.repPapers.filter(function (p) {
      return p.topic_id === t.id && (!isSubtopicView || p.subtopic_id === sub.id);
    });

    if (els.statTotal) els.statTotal.textContent = filteredTopicArticles.length;
    if (els.statSubtopics) els.statSubtopics.textContent = isSubtopicView ? '1' : t.subtopics.length;
    if (els.statMilestones) els.statMilestones.textContent = topicMilestones.length;
    if (els.statRep) els.statRep.textContent = topicRepPapers.length;
  }

  /* --------------------------------------------------------------------------
     2. 二级专题导航 Grid (仅一级专题模式)
     -------------------------------------------------------------------------- */
  function renderSubtopicsGrid() {
    if (!els.subtopicsSection || !els.subtopicsGrid) return;
    if (state.currentSubtopicId) {
      els.subtopicsSection.style.display = 'none';
      return;
    }
    els.subtopicsSection.style.display = 'block';

    var t = state.topicConfig;
    var group = state.topicMap[t.id];
    var subCounts = group ? group.subtopicCounts : {};

    var html = '';
    t.subtopics.forEach(function (sub) {
      var cnt = subCounts[sub.id] || 0;
      var link = 'topic.html?topic=' + encodeURIComponent(t.id) + '&subtopic=' + encodeURIComponent(sub.id);
      html += 
        '<div class="subtopic-nav-card">' +
          '<div>' +
            '<h3><a href="' + link + '">' + sub.name_zh + '</a></h3>' +
            '<span class="sub-en">' + sub.name_en + '</span>' +
          '</div>' +
          '<div class="sub-footer">' +
            '<span class="sub-count">收录 <b>' + cnt + '</b> 篇</span>' +
            '<a class="sub-link" href="' + link + '">进入二级专题 →</a>' +
          '</div>' +
        '</div>';
    });
    els.subtopicsGrid.innerHTML = html;
  }

  /* --------------------------------------------------------------------------
     3. 学科发展史多分支时间线
     -------------------------------------------------------------------------- */
  function renderEvolutionTimeline() {
    if (!els.evolutionSection || !els.timelineContainer) return;
    if (state.currentSubtopicId) {
      els.evolutionSection.style.display = 'none';
      return;
    }
    els.evolutionSection.style.display = 'block';

    var t = state.topicConfig;
    var allTopicMilestones = state.milestones.filter(function (m) { return m.topic_id === t.id; });

    // 填充二级专题筛选下拉
    if (els.timelineSubtopicFilter) {
      var subOpt = '<option value="all">全部二级方向 (' + allTopicMilestones.length + ')</option>';
      t.subtopics.forEach(function (sub) {
        var cnt = allTopicMilestones.filter(function (m) { return Array.isArray(m.subtopic_ids) && m.subtopic_ids.indexOf(sub.id) !== -1; }).length;
        subOpt += '<option value="' + sub.id + '">' + sub.name_zh + ' (' + cnt + ')</option>';
      });
      els.timelineSubtopicFilter.innerHTML = subOpt;
      els.timelineSubtopicFilter.value = state.timelineSubtopic;
    }

    // 填充年代跳转芯片
    if (els.timelineEraJumps) {
      var eras = ['all', '1970s', '1990s', '2000s', '2010s', '2020s'];
      var eraHtml = '';
      eras.forEach(function (era) {
        var label = era === 'all' ? '全部年代' : era;
        var active = state.timelineEra === era ? ' active' : '';
        eraHtml += '<span class="era-pill' + active + '" data-era="' + era + '">' + label + '</span>';
      });
      els.timelineEraJumps.innerHTML = eraHtml;
    }

    // 过滤里程碑
    var filtered = allTopicMilestones.filter(function (m) {
      if (state.timelineSubtopic !== 'all' && (!Array.isArray(m.subtopic_ids) || m.subtopic_ids.indexOf(state.timelineSubtopic) === -1)) {
        return false;
      }
      if (state.timelineType !== 'all' && m.milestone_type !== state.timelineType) {
        return false;
      }
      if (state.timelineEra !== 'all') {
        var y = parseInt(m.year, 10);
        if (state.timelineEra === '1970s' && (y < 1970 || y > 1979)) return false;
        if (state.timelineEra === '1990s' && (y < 1990 || y > 1999)) return false;
        if (state.timelineEra === '2000s' && (y < 2000 || y > 2009)) return false;
        if (state.timelineEra === '2010s' && (y < 2010 || y > 2019)) return false;
        if (state.timelineEra === '2020s' && (y < 2020 || y > 2029)) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      els.timelineContainer.innerHTML = '<div class="empty-state" style="padding:20px;text-align:center;color:#888;">该筛选条件下暂无学术里程碑事件</div>';
      return;
    }

    var html = '';
    filtered.forEach(function (m) {
      var typeClass = 'landmark';
      if (m.milestone_type === '理论奠基') typeClass = 'theory';
      else if (m.milestone_type === '算法突破') typeClass = 'algorithm';
      else if (m.milestone_type === '技术革命') typeClass = 'tech';

      var subTags = (m.subtopic_ids || []).map(function (sid) {
        var subObj = window.GenomeRadarTopics.findSubtopic(t.id, sid);
        return subObj ? '<span class="milestone-sub-tag">' + subObj.name_zh + '</span>' : '';
      }).join('');

      var predecessorsHtml = m.predecessors ? '<span class="relation-item"><b>前置基础：</b>' + m.predecessors + '</span>' : '';
      var successorsHtml = m.successors ? '<span class="relation-item"><b>后续发展：</b>' + m.successors + '</span>' : '';

      var doiLink = m.doi 
        ? '<a class="btn-action" href="https://doi.org/' + encodeURIComponent(m.doi) + '" target="_blank" rel="noopener">原始论文 DOI ↗</a>' 
        : '';

      html += 
        '<div class="timeline-node" data-year="' + m.year + '">' +
          '<div class="timeline-marker ' + typeClass + '"></div>' +
          '<div class="milestone-card">' +
            '<div class="milestone-header">' +
              '<div class="milestone-year-type">' +
                '<span class="milestone-year-badge">' + (m.date || m.year) + '</span>' +
                '<span class="milestone-type-pill">' + m.milestone_type + '</span>' +
              '</div>' +
              '<div class="milestone-subtopics-list">' + subTags + '</div>' +
            '</div>' +
            '<h3 class="milestone-title-zh">' + m.title_zh + '</h3>' +
            '<div class="milestone-title-en">' + m.title_en + '</div>' +
            '<div class="milestone-narrative">' +
              '<div class="narrative-block"><span class="narrative-title">历史背景：</span>' + m.background + '</div>' +
              '<div class="narrative-block"><span class="narrative-title">核心问题：</span>' + m.core_question + '</div>' +
              '<div class="narrative-block"><span class="narrative-title">理论与技术贡献：</span>' + m.contribution + '</div>' +
              '<div class="narrative-block"><span class="narrative-title">学术影响：</span>' + m.significance + ' ' + (m.future_impact || '') + '</div>' +
            '</div>' +
            '<div class="milestone-relations-row">' +
              predecessorsHtml +
              successorsHtml +
            '</div>' +
            '<div class="milestone-paper-box">' +
              '<div class="paper-meta-left">' +
                '<span class="paper-original-title">《' + (m.paper_title || m.title_en) + '》</span>' +
                '<span class="paper-authors-journal">' + (m.authors || '权威团队') + ' · <i>' + (m.journal || '权威出版') + '</i></span>' +
              '</div>' +
              '<div style="display:flex;gap:8px;">' +
                doiLink +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    });
    els.timelineContainer.innerHTML = html;
  }

  /* --------------------------------------------------------------------------
     4. 专题代表性论文库
     -------------------------------------------------------------------------- */
  function renderRepresentativePapers() {
    if (!els.repSection || !els.repGrid) return;

    var t = state.topicConfig;
    var sub = state.subtopicConfig;
    var isSubtopicView = !!sub;

    var topicReps = state.repPapers.filter(function (p) {
      if (p.topic_id !== t.id) return false;
      if (isSubtopicView && p.subtopic_id !== sub.id) return false;
      return true;
    });

    // 统计各分类篇数
    var countAll = topicReps.length;
    var countFoundation = topicReps.filter(function (p) { return p.category === 'foundation'; }).length;
    var countMethod = topicReps.filter(function (p) { return p.category === 'method'; }).length;
    var countFrontier = topicReps.filter(function (p) { return p.category === 'frontier'; }).length;

    if (els.repCntAll) els.repCntAll.textContent = countAll;
    if (els.repCntFoundation) els.repCntFoundation.textContent = countFoundation;
    if (els.repCntMethod) els.repCntMethod.textContent = countMethod;
    if (els.repCntFrontier) els.repCntFrontier.textContent = countFrontier;

    // 过滤当前选中 Tab
    var filteredReps = topicReps.filter(function (p) {
      if (state.repCategory === 'all') return true;
      return p.category === state.repCategory;
    });

    if (filteredReps.length === 0) {
      els.repGrid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;text-align:center;color:#888;">该类别暂无代表性论文收录</div>';
      return;
    }

    var html = '';
    filteredReps.forEach(function (p) {
      var catClass = p.category || 'foundation';
      var catLabel = p.category === 'foundation' ? '领域奠基' : (p.category === 'method' ? '重要方法' : '前沿突破');

      var doiLink = p.doi 
        ? '<a class="btn-action" href="https://doi.org/' + encodeURIComponent(p.doi) + '" target="_blank" rel="noopener">原文 DOI ↗</a>' 
        : '';

      var radarLink = '';
      var directUrl = p.article_url || '';
      if (!directUrl && (p.article_id || p.doi)) {
        var matchedArt = state.allArticles.find(function (a) {
          return (p.article_id && a.id === p.article_id) || (p.doi && a.doi && a.doi.toLowerCase() === p.doi.toLowerCase());
        });
        if (matchedArt && matchedArt.article_url) {
          directUrl = matchedArt.article_url;
        }
      }
      if (!directUrl && p.radar_article_id) {
        var parts = p.radar_article_id.split(':');
        directUrl = parts[0] + '/index.html?article=' + (parts[1] || '1');
      }
      if (directUrl) {
        radarLink = '<a class="btn-action btn-primary-action" href="' + directUrl + '">周报精读直达 →</a>';
      }

      html += 
        '<div class="rep-card">' +
          '<div>' +
            '<div class="rep-card-top">' +
              '<span class="rep-cat-badge ' + catClass + '">' + catLabel + '</span>' +
              '<span class="rep-citation-badge">' + (p.citation_count_level || '权威精选') + '</span>' +
            '</div>' +
            '<h4 class="rep-title-zh">' + p.title_zh + '</h4>' +
            '<p class="rep-title-en">' + p.title_en + '</p>' +
            '<div class="rep-authors">' + p.authors + ' · <b>' + p.journal + '</b> (' + (p.publication_date ? p.publication_date.slice(0, 4) : '经典') + ')</div>' +
            '<div class="rep-reason-box"><b>入选依据：</b>' + p.reason + '</div>' +
          '</div>' +
          '<div class="rep-actions-row">' +
            doiLink +
            radarLink +
          '</div>' +
        '</div>';
    });
    els.repGrid.innerHTML = html;
  }

  /* --------------------------------------------------------------------------
     5. 趋势图渲染
     -------------------------------------------------------------------------- */
  function renderTrendsChart() {
    if (!els.trendChart) return;
    var t = state.topicConfig;
    var group = state.topicMap[t.id];
    var articles = group ? group.articles : [];

    var issueCounts = {};
    articles.forEach(function (a) {
      var iss = a.issue || a.issue_date || '其他';
      issueCounts[iss] = (issueCounts[iss] || 0) + 1;
    });

    var sortedIssues = Object.keys(issueCounts).sort();
    if (sortedIssues.length === 0) {
      els.trendChart.innerHTML = '<div style="color:#888;font-size:12px;padding:20px 0;">暂无历期趋势数据</div>';
      return;
    }

    var maxCount = Math.max.apply(null, Object.values(issueCounts)) || 1;
    var latestIssue = sortedIssues[sortedIssues.length - 1];

    var html = '';
    sortedIssues.forEach(function (iss) {
      var count = issueCounts[iss];
      var heightPct = Math.max(12, Math.round((count / maxCount) * 100));
      var isLatest = iss === latestIssue;
      var shortLabel = iss.slice(5);

      html += 
        '<div class="trend-col" title="' + iss + '：收录 ' + count + ' 篇">' +
          '<span class="trend-count-hint">' + count + '</span>' +
          '<div class="trend-bar' + (isLatest ? ' latest' : '') + '" style="height:' + heightPct + '%;"></div>' +
          '<span class="trend-col-label">' + shortLabel + '</span>' +
        '</div>';
    });
    els.trendChart.innerHTML = html;
  }

  /* --------------------------------------------------------------------------
     6. 下拉框与关键词填充
     -------------------------------------------------------------------------- */
  function populateFilterDropdowns() {
    var t = state.topicConfig;

    // 二级专题筛选
    if (els.filterSubtopic) {
      var subOpt = '<option value="all">全部二级方向</option>';
      t.subtopics.forEach(function (sub) {
        subOpt += '<option value="' + sub.id + '">' + sub.name_zh + '</option>';
      });
      els.filterSubtopic.innerHTML = subOpt;
      els.filterSubtopic.value = state.selectedSubtopic;
    }

    // 发表年份筛选
    if (els.filterYear) {
      var years = {};
      var group = state.topicMap[t.id];
      var articles = group ? group.articles : [];
      articles.forEach(function (a) {
        var d = a.publication_date || a.issue;
        if (d && d.length >= 4) {
          var y = d.slice(0, 4);
          years[y] = (years[y] || 0) + 1;
        }
      });
      var yearOpt = '<option value="all">全部发表年份</option>';
      Object.keys(years).sort().reverse().forEach(function (y) {
        yearOpt += '<option value="' + y + '">' + y + ' 年 (' + years[y] + ')</option>';
      });
      els.filterYear.innerHTML = yearOpt;
      els.filterYear.value = state.selectedYear;
    }

    // 热门关键词
    if (els.keywordChipsBar) {
      var kwCounts = {};
      var group = state.topicMap[t.id];
      var articles = group ? group.articles : [];
      articles.forEach(function (a) {
        var kws = Array.isArray(a.keywords) ? a.keywords : [];
        kws.forEach(function (k) {
          if (k && k !== t.name_zh && k !== t.tag) {
            kwCounts[k] = (kwCounts[k] || 0) + 1;
          }
        });
      });
      var topKws = Object.keys(kwCounts).sort(function (a, b) {
        return kwCounts[b] - kwCounts[a];
      }).slice(0, 10);

      var kwHtml = '<span style="font-size:12px;color:#7a8874;font-weight:600;display:inline-flex;align-items:center;">高频热词：</span>';
      topKws.forEach(function (kw) {
        var active = state.selectedKeyword === kw ? ' active' : '';
        kwHtml += '<span class="keyword-chip' + active + '" data-kw="' + kw + '">' + kw + ' (' + kwCounts[kw] + ')</span>';
      });
      els.keywordChipsBar.innerHTML = kwHtml;
    }
  }

  /* --------------------------------------------------------------------------
     7. 文献检索与列表卡片渲染（含直接深链接）
     -------------------------------------------------------------------------- */
  function applyFilterAndRenderArticles() {
    var t = state.topicConfig;
    var group = state.topicMap[t.id];
    var list = group ? group.articles.slice() : [];

    // 1. 搜索词匹配
    var query = state.searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(function (a) {
        var hay = (
          (a.title_zh || '') + ' ' + 
          (a.title_en || '') + ' ' + 
          (a.summary || '') + ' ' + 
          (a.abstract || '') + ' ' + 
          (a.journal || '') + ' ' + 
          (a.doi || '') + ' ' + 
          (Array.isArray(a.research_methods) ? a.research_methods.join(' ') : '') + ' ' +
          (Array.isArray(a.research_objects) ? a.research_objects.join(' ') : '')
        ).toLowerCase();
        return hay.indexOf(query) !== -1;
      });
    }

    // 2. 二级专题筛选
    if (state.selectedSubtopic !== 'all') {
      list = list.filter(function (a) {
        return Array.isArray(a.subtopics) && a.subtopics.indexOf(state.selectedSubtopic) !== -1;
      });
    }

    // 3. 贡献类型筛选
    if (state.selectedContrib !== 'all') {
      list = list.filter(function (a) {
        return Array.isArray(a.contribution_types) && a.contribution_types.indexOf(state.selectedContrib) !== -1;
      });
    }

    // 4. 期刊分区筛选
    if (state.selectedQuartile !== 'all') {
      list = list.filter(function (a) {
        var q = String(a.quartile || '').toLowerCase();
        if (state.selectedQuartile === 'top') return q.indexOf('top') !== -1 || q.indexOf('1区') !== -1;
        if (state.selectedQuartile === 'q1') return q.indexOf('1') !== -1;
        if (state.selectedQuartile === 'q2') return q.indexOf('2') !== -1;
        return true;
      });
    }

    // 5. 发表年份筛选
    if (state.selectedYear !== 'all') {
      list = list.filter(function (a) {
        var d = a.publication_date || a.issue || '';
        return d.indexOf(state.selectedYear) === 0;
      });
    }

    // 6. 热词点击筛选
    if (state.selectedKeyword) {
      list = list.filter(function (a) {
        var kws = Array.isArray(a.keywords) ? a.keywords : [];
        return kws.indexOf(state.selectedKeyword) !== -1;
      });
    }

    // 7. 排序
    list.sort(function (a, b) {
      if (state.selectedSort === 'date_desc') {
        var d1 = a.publication_date || a.issue || '';
        var d2 = b.publication_date || b.issue || '';
        return d2.localeCompare(d1);
      } else if (state.selectedSort === 'if_desc') {
        var if1 = parseFloat(a.impact_factor) || 0;
        var if2 = parseFloat(b.impact_factor) || 0;
        return if2 - if1;
      } else {
        // issue_desc
        var iss1 = a.issue || '';
        var iss2 = b.issue || '';
        if (iss2 !== iss1) return iss2.localeCompare(iss1);
        return (b.article_number || 0) - (a.article_number || 0);
      }
    });

    // 渲染结果计数
    if (els.resultsCount) {
      els.resultsCount.textContent = '找到 ' + list.length + ' 篇专题相关精选文献';
    }

    // 渲染文献卡片
    if (!els.articlesList) return;
    if (list.length === 0) {
      els.articlesList.innerHTML = '<div class="empty-state" style="padding:40px;text-align:center;background:#fff;border-radius:8px;border:1px solid var(--line);"><h3 style="color:#667362;margin:0 0 8px;">未检索到匹配文献</h3><p style="color:#889684;margin:0;">建议清除筛选条件或尝试不同关键词重新检索</p></div>';
      return;
    }

    var html = '';
    list.forEach(function (item) {
      // 统一深链接直达格式：YYYY-MM-DD/index.html?article=N
      var directUrl = item.issue + '/index.html?article=' + item.article_number;

      // 检查个人文献库收藏状态
      var isStarred = false;
      if (window.GenomeLibrary && typeof window.GenomeLibrary.key === 'function') {
        try {
          var k = window.GenomeLibrary.key(item);
          var lib = state.libraryData || window.GenomeLibrary.read();
          var rec = lib && lib.records ? lib.records[k] : null;
          if (rec && rec.starred) isStarred = true;
        } catch (e) {}
      }

      var quartileHtml = item.quartile ? '<span class="article-zone">' + item.quartile + '</span>' : '';
      var ifHtml = item.impact_factor ? '<span class="article-if">IF ' + item.impact_factor + '</span>' : '';
      var issueHtml = item.issue_week ? '<span class="article-week-badge">' + item.issue_week + '</span>' : '';
      var doiLink = item.doi ? '<a class="btn-action" href="https://doi.org/' + encodeURIComponent(item.doi) + '" target="_blank" rel="noopener">原文 DOI ↗</a>' : '';

      // 二级专题标签
      var subTags = (item.subtopics || []).map(function (sid) {
        var subObj = window.GenomeRadarTopics.findSubtopic(t.id, sid);
        return subObj ? '<span class="tag-badge subtopic">' + subObj.name_zh + '</span>' : '';
      }).join('');

      // 贡献类型标签
      var contribTags = (item.contribution_types || []).map(function (c) {
        return '<span class="tag-badge contrib">' + c + '</span>';
      }).join('');

      // 物种标签
      var speciesTags = (item.research_objects || []).slice(0, 2).map(function (sp) {
        return '<span class="tag-badge species">' + sp + '</span>';
      }).join('');

      // 方法标签
      var methodTags = (item.research_methods || []).slice(0, 2).map(function (m) {
        return '<span class="tag-badge method">' + m + '</span>';
      }).join('');

      html += 
        '<article class="article-card" data-id="' + item.id + '">' +
          '<div class="article-meta">' +
            '<span class="article-journal">' + (item.journal || '权威期刊') + '</span>' +
            quartileHtml +
            ifHtml +
            '<span>·</span>' +
            issueHtml +
            '<span style="color:#888;">(' + (item.publication_date || item.issue) + ')</span>' +
          '</div>' +
          '<h3 class="article-title-zh">' +
            '<a href="' + directUrl + '" title="进入周报精准定位阅读">' + (item.title_zh || '标题未标注') + '</a>' +
          '</h3>' +
          '<p class="article-title-en">' + (item.title_en || '') + '</p>' +
          '<p class="article-summary">' + (item.summary || item.abstract || '') + '</p>' +
          '<div class="article-tags-wrap">' +
            '<span class="tag-badge primary">' + t.name_zh + '</span>' +
            subTags +
            contribTags +
            speciesTags +
            methodTags +
          '</div>' +
          '<div class="article-footer">' +
            '<div style="font-size:12px;color:#7a8a77;">' + (item.classification_reason || '') + '</div>' +
            '<div class="article-actions">' +
              doiLink +
              '<button type="button" class="btn-action btn-star' + (isStarred ? ' starred' : '') + '" data-article-id="' + item.id + '" title="收藏至本地文献库">' +
                (isStarred ? '★ 已收藏' : '☆ 收藏') +
              '</button>' +
              '<a class="btn-action" href="library.html?article=' + encodeURIComponent(item.id) + '" title="查看文献库笔记">笔记</a>' +
              '<a class="btn-action btn-primary-action" href="deep-read.html?article=' + encodeURIComponent(item.id) + '" title="进入论文精读工作台">精读工作台 →</a>' +
            '</div>' +
          '</div>' +
        '</article>';
    });
    els.articlesList.innerHTML = html;

    bindStarButtons();
  }

  function bindStarButtons() {
    if (!els.articlesList) return;
    var starBtns = els.articlesList.querySelectorAll('.btn-star');
    starBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var articleId = btn.getAttribute('data-article-id');
        var article = state.allArticles.find(function (a) { return a.id === articleId; });
        if (!article || !window.GenomeLibrary) return;

        var wasStarred = btn.classList.contains('starred');
        if (typeof window.GenomeLibrary.update === 'function') {
          window.GenomeLibrary.update(article, function (r) {
            r.starred = !wasStarred;
          });
          state.libraryData = window.GenomeLibrary.read();
        }

        btn.classList.toggle('starred', !wasStarred);
        btn.textContent = !wasStarred ? '★ 已收藏' : '☆ 收藏';
      });
    });
  }

  /* --------------------------------------------------------------------------
     8. 事件监听绑定
     -------------------------------------------------------------------------- */
  function bindEvents() {
    // 搜索输入防抖
    var searchTimer = null;
    if (els.searchInput) {
      els.searchInput.addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
          state.searchQuery = els.searchInput.value;
          applyFilterAndRenderArticles();
        }, 250);
      });
    }

    // 二级专题筛选
    if (els.filterSubtopic) {
      els.filterSubtopic.addEventListener('change', function () {
        state.selectedSubtopic = els.filterSubtopic.value;
        applyFilterAndRenderArticles();
      });
    }

    // 贡献类型筛选
    if (els.filterContrib) {
      els.filterContrib.addEventListener('change', function () {
        state.selectedContrib = els.filterContrib.value;
        applyFilterAndRenderArticles();
      });
    }

    // 分区筛选
    if (els.filterQuartile) {
      els.filterQuartile.addEventListener('change', function () {
        state.selectedQuartile = els.filterQuartile.value;
        applyFilterAndRenderArticles();
      });
    }

    // 年份筛选
    if (els.filterYear) {
      els.filterYear.addEventListener('change', function () {
        state.selectedYear = els.filterYear.value;
        applyFilterAndRenderArticles();
      });
    }

    // 排序
    if (els.sortSelect) {
      els.sortSelect.addEventListener('change', function () {
        state.selectedSort = els.sortSelect.value;
        applyFilterAndRenderArticles();
      });
    }

    // 重置
    if (els.resetFiltersBtn) {
      els.resetFiltersBtn.addEventListener('click', function () {
        state.searchQuery = '';
        state.selectedSubtopic = state.currentSubtopicId || 'all';
        state.selectedContrib = 'all';
        state.selectedQuartile = 'all';
        state.selectedYear = 'all';
        state.selectedKeyword = null;

        if (els.searchInput) els.searchInput.value = '';
        if (els.filterSubtopic) els.filterSubtopic.value = state.selectedSubtopic;
        if (els.filterContrib) els.filterContrib.value = 'all';
        if (els.filterQuartile) els.filterQuartile.value = 'all';
        if (els.filterYear) els.filterYear.value = 'all';

        if (els.keywordChipsBar) {
          var chips = els.keywordChipsBar.querySelectorAll('.keyword-chip');
          chips.forEach(function (c) { c.classList.remove('active'); });
        }

        applyFilterAndRenderArticles();
      });
    }

    // 关键词 Chips 点击
    if (els.keywordChipsBar) {
      els.keywordChipsBar.addEventListener('click', function (e) {
        var chip = e.target.closest('.keyword-chip');
        if (!chip) return;
        var kw = chip.getAttribute('data-kw');
        if (state.selectedKeyword === kw) {
          state.selectedKeyword = null;
          chip.classList.remove('active');
        } else {
          state.selectedKeyword = kw;
          var chips = els.keywordChipsBar.querySelectorAll('.keyword-chip');
          chips.forEach(function (c) { c.classList.toggle('active', c === chip); });
        }
        applyFilterAndRenderArticles();
      });
    }

    // 时间线折叠切换
    if (els.toggleEvolutionBtn && els.evolutionContent) {
      els.toggleEvolutionBtn.addEventListener('click', function () {
        state.evolutionFolded = !state.evolutionFolded;
        els.evolutionContent.style.display = state.evolutionFolded ? 'none' : 'block';
        els.toggleEvolutionBtn.textContent = state.evolutionFolded ? '展开时间线' : '收起时间线';
        els.toggleEvolutionBtn.setAttribute('aria-expanded', !state.evolutionFolded);
      });
    }

    // 时间线筛选
    if (els.timelineSubtopicFilter) {
      els.timelineSubtopicFilter.addEventListener('change', function () {
        state.timelineSubtopic = els.timelineSubtopicFilter.value;
        renderEvolutionTimeline();
      });
    }
    if (els.timelineTypeFilter) {
      els.timelineTypeFilter.addEventListener('change', function () {
        state.timelineType = els.timelineTypeFilter.value;
        renderEvolutionTimeline();
      });
    }
    if (els.timelineEraJumps) {
      els.timelineEraJumps.addEventListener('click', function (e) {
        var pill = e.target.closest('.era-pill');
        if (!pill) return;
        state.timelineEra = pill.getAttribute('data-era');
        renderEvolutionTimeline();
      });
    }

    // 代表性论文折叠切换
    if (els.toggleRepBtn && els.repContent) {
      els.toggleRepBtn.addEventListener('click', function () {
        state.repFolded = !state.repFolded;
        els.repContent.style.display = state.repFolded ? 'none' : 'block';
        els.toggleRepBtn.textContent = state.repFolded ? '展开代表文献' : '收起代表文献';
        els.toggleRepBtn.setAttribute('aria-expanded', !state.repFolded);
      });
    }

    // 代表论文分类 Tab 切换
    if (els.repCategoryTabs) {
      els.repCategoryTabs.addEventListener('click', function (e) {
        var tab = e.target.closest('.rep-tab');
        if (!tab) return;
        var cat = tab.getAttribute('data-cat');
        state.repCategory = cat;
        var tabs = els.repCategoryTabs.querySelectorAll('.rep-tab');
        tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
        renderRepresentativePapers();
      });
    }

    // 跨页面文献库状态同步
    window.addEventListener('gr-library-change', function (e) {
      if (window.GenomeLibrary && typeof window.GenomeLibrary.read === 'function') {
        state.libraryData = window.GenomeLibrary.read();
        bindStarButtons();
      }
    });
  }

  // 页面启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
