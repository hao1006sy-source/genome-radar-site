/**
 * Genome Radar V3.0 - 我的科研雷达 (My Research Radar)
 * 纯前端高响应单用户个性化科研情报工作台
 */

(function () {
  'use strict';

  var PROFILE_KEY = 'gr_research_profile_draft';
  var TOKEN_KEY = 'gr_sync_token';
  var FEEDBACK_KEY = 'gr_radar_feedback';

  var state = {
    profile: null,
    taxonomy: null,
    articles: [],
    milestones: [],
    isDirty: false,
    matchedArticles: []
  };

  // Helper DOM utilities
  function $(id) { return document.getElementById(id); }
  function qs(selector) { return document.querySelector(selector); }
  function qsa(selector) { return document.querySelectorAll(selector); }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var ACTIVE_DISCOVERY_KEY = 'gr_active_discovery_run';
  var discoveryPollTimer = null;

  // Profile Hash & Equivalence Helpers (Recursive Canonical JSON SHA-256)
  function canonicalizeProfile(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(canonicalizeProfile);
    }
    var sortedKeys = Object.keys(obj).sort();
    var result = {};
    for (var i = 0; i < sortedKeys.length; i++) {
      var k = sortedKeys[i];
      if (k === 'sync_status' || k === 'updated_at') continue;
      result[k] = canonicalizeProfile(obj[k]);
    }
    return result;
  }

  function sha256Pure(s) {
    var ascii = unescape(encodeURIComponent(s));
    function rightRotate(value, amount) { return (value>>>amount) | (value<<(32 - amount)); }
    var mathPow = Math.pow, maxWord = mathPow(2, 32), lengthProperty = 'length', i, j, result = '', words = [];
    var asciiBitLength = ascii[lengthProperty]*8, hash = sha256Pure.h = sha256Pure.h || [], k = sha256Pure.k = sha256Pure.k || [];
    var primeCounter = k[lengthProperty], isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (mathPow(candidate, .5)*maxWord)|0;
        k[primeCounter++] = (mathPow(candidate, 1/3)*maxWord)|0;
      }
    }
    hash = hash.slice(0);
    ascii += '\x80';
    while (ascii[lengthProperty]%64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      words[i>>2] |= j << ((3 - i)%4)*8;
    }
    words[words[lengthProperty]] = ((asciiBitLength/maxWord)|0);
    words[words[lengthProperty]] = (asciiBitLength);
    for (j = 0; j < words[lengthProperty];) {
      var w = words.slice(j, j += 16), oldHash = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var i2 = i + j, w15 = w[i - 15], w2 = w[i - 2];
        var a = hash[0], e = hash[4];
        var temp1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15>>>3)) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2>>>10)))|0);
        var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2)|0].concat(hash);
        hash[4] = (hash[4] + temp1)|0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i])|0;
    }
    for (i = 0; i < 8; i++) {
      for (i2 = 3; i2 >= 0; i2--) {
        var b = (hash[i]>>(i2*8))&255;
        result += ((b < 16) ? 0 : '') + b.toString(16);
      }
    }
    return result;
  }

  async function computeProfileSha256(profileObj) {
    if (!profileObj) return '';
    var canonicalObj = canonicalizeProfile(profileObj);
    var str = JSON.stringify(canonicalObj);
    if (window.crypto && window.crypto.subtle) {
      try {
        var encoder = new TextEncoder();
        var data = encoder.encode(str);
        var hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        var hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(function(b){ return b.toString(16).padStart(2, '0'); }).join('');
      } catch(e){}
    }
    return sha256Pure(str);
  }

  function areProfilesEquivalent(p1, p2) {
    if (!p1 || !p2) return false;
    var c1 = JSON.stringify(canonicalizeProfile(p1));
    var c2 = JSON.stringify(canonicalizeProfile(p2));
    return c1 === c2;
  }

  function updateDiscoveryStatusUI(status, label, desc, linksHtml) {
    var box = $('discovery-job-box');
    var badge = $('discovery-job-badge');
    var descEl = $('discovery-job-desc');
    var linksEl = $('discovery-job-links');
    var btn = $('btn-trigger-discovery');

    if (!box) return;
    box.style.display = 'block';

    if (badge) {
      badge.textContent = label || status;
      if (status === 'queued') {
        badge.style.background = '#fef3c7';
        badge.style.color = '#92400e';
      } else if (status === 'in_progress') {
        badge.style.background = '#e0f2fe';
        badge.style.color = '#0369a1';
      } else if (status === 'completed') {
        badge.style.background = '#dcfce7';
        badge.style.color = '#15803d';
      } else if (status === 'failed') {
        badge.style.background = '#fee2e2';
        badge.style.color = '#b91c1c';
      }
    }

    if (descEl) descEl.innerHTML = desc || '';
    if (linksEl) linksEl.innerHTML = linksHtml || '';

    if (btn) {
      if (status === 'queued' || status === 'in_progress') {
        btn.disabled = true;
        btn.textContent = '⏳ ' + (label || '发现任务正在运行...');
      } else {
        btn.disabled = false;
        btn.textContent = '🔍 发现高相关历史文献并生成专刊';
      }
    }
  }

  async function pollDiscoveryRun(runId, githubToken, reqId) {
    if (!runId || !githubToken) return;

    try {
      var resp = await fetch('https://api.github.com/repos/hao1006sy-source/genome-radar-pipeline/actions/runs/' + runId, {
        headers: {
          'Authorization': 'Bearer ' + githubToken,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (!resp.ok) return;
      var data = await resp.json();
      var status = data.status; // queued, in_progress, completed
      var conclusion = data.conclusion; // success, failure, cancelled
      var runUrl = data.html_url;

      var links = '<a href="' + runUrl + '" target="_blank" style="color:#0284c7;text-decoration:none;">查看 GitHub Actions 运行日志 (Run #' + runId + ')</a>';

      if (status === 'queued') {
        updateDiscoveryStatusUI('queued', '已排队 (Queued)', '云端 GitHub Actions 正在调度运行环境，等待就绪...', links);
      } else if (status === 'in_progress') {
        updateDiscoveryStatusUI('in_progress', '正在运行 (In Progress)', '云端流水线正在执行：检索学术数据库 (Europe PMC/PubMed) ➔ 核验与初筛候选文献 ➔ 调用 DeepSeek 大模型解读 ➔ 发布专刊...', links);
      } else if (status === 'completed') {
        if (discoveryPollTimer) { clearInterval(discoveryPollTimer); discoveryPollTimer = null; }
        localStorage.removeItem(ACTIVE_DISCOVERY_KEY);

        if (conclusion === 'success') {
          var targetSuppUrl = 'personal-supplement/index.html';
          var suppLabel = '直达最新生成的科研专刊 ➔';
          try {
            var sResp = await fetch('assets/data/supplement-index.json?_t=' + Date.now());
            if (sResp.ok) {
              var sData = await sResp.json();
              var supps = sData.supplements || [];
              var matchedSupp = null;
              if (reqId) {
                matchedSupp = supps.find(function(s){ return s.request_id === reqId; });
              }
              if (!matchedSupp && supps.length > 0) matchedSupp = supps[0];
              if (matchedSupp) {
                targetSuppUrl = matchedSupp.url || targetSuppUrl;
                suppLabel = '直达最新科研专刊 (' + (matchedSupp.date || '最新') + ') ➔';
              }
            }
          } catch(e) {}

          links += ' | <a href="' + targetSuppUrl + '" style="color:#15803d;font-weight:700;text-decoration:none;">' + escapeHtml(suppLabel) + '</a>';
          updateDiscoveryStatusUI('completed', '✓ 已完成 (Success)', '历史文献发现任务已顺利完成！个人科研专刊已自动发布至全站，并更新全站搜索索引与成本统计。', links);
          await renderSupplements();
          await renderCostStats();
        } else {
          updateDiscoveryStatusUI('failed', '运行失败 (' + (conclusion || 'Failed') + ')', '云端工作流执行未成功，请点击链接检查 GitHub Actions 日志排查原因。', links);
        }
      }
    } catch(e) {
      console.warn('轮询 GitHub Actions 运行状态出错:', e);
    }
  }

  function checkAndResumeActiveDiscovery() {
    var savedRun = localStorage.getItem(ACTIVE_DISCOVERY_KEY);
    if (!savedRun) return;
    try {
      var runInfo = JSON.parse(savedRun);
      var githubToken = localStorage.getItem('gr_sync_github_token');
      if (runInfo.run_id && githubToken) {
        var elapsed = Date.now() - (runInfo.started_at || 0);
        if (elapsed < 30 * 60 * 1000) {
          updateDiscoveryStatusUI('in_progress', '恢复监控中', '检测到此前启动的发现任务 (Run #' + runInfo.run_id + ')，正在恢复状态追踪...');
          pollDiscoveryRun(runInfo.run_id, githubToken);
          discoveryPollTimer = setInterval(function() {
            pollDiscoveryRun(runInfo.run_id, githubToken);
          }, 5000);
        } else {
          localStorage.removeItem(ACTIVE_DISCOVERY_KEY);
        }
      }
    } catch(e) {}
  }

  // Load Initial Data with Cloud Config Priority and Cross-Device Recovery
  async function init() {
    try {
      // 1. Load taxonomy
      var taxRes = await fetch('assets/data/topics-taxonomy.json');
      state.taxonomy = await taxRes.json();

      // 2. Load profile: priority given to authenticated private production profile
      var githubToken = localStorage.getItem('gr_sync_github_token');
      var localEndpoint = localStorage.getItem('gr_sync_endpoint') || 'http://127.0.0.1:8765/api/profile';
      var localDraftStr = localStorage.getItem(PROFILE_KEY);
      var localDraft = null;
      if (localDraftStr) {
        try { localDraft = JSON.parse(localDraftStr); } catch (e) {}
      }

      var remoteProfile = null;
      if (githubToken) {
        try {
          var ghResp = await fetch('https://api.github.com/repos/hao1006sy-source/genome-radar-pipeline/contents/data/research-profile.json', {
            headers: {
              'Authorization': 'Bearer ' + githubToken,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          if (ghResp.ok) {
            var ghData = await ghResp.json();
            var decoded = decodeURIComponent(escape(atob(ghData.content.replace(/\s/g, ''))));
            remoteProfile = JSON.parse(decoded);
          }
        } catch(e) {
          console.warn('获取 GitHub 远程配置失败:', e);
        }
      }

      if (!remoteProfile && localEndpoint) {
        try {
          var locResp = await fetch(localEndpoint, { method: 'GET' });
          if (locResp.ok) {
            var locData = await locResp.json();
            if (locData.profile) remoteProfile = locData.profile;
          }
        } catch(e) {}
      }

      if (remoteProfile) {
        if (localDraft && !areProfilesEquivalent(localDraft, remoteProfile)) {
          var useRemote = confirm(
            '【科研画像跨设备同步提示】\n\n' +
            '检测到云端存在已生效的生产配置 (版本: ' + (remoteProfile.profile_version || '最新') + ')，\n' +
            '同时当前浏览器存在未同步的本地草稿 (版本: ' + (localDraft.profile_version || '草稿') + ')。\n\n' +
            '• 点击【确定】：使用云端生产配置覆盖本地（推荐用于跨设备恢复）；\n' +
            '• 点击【取消】：保留本地未同步修改草稿继续编辑。'
          );
          if (useRemote) {
            state.profile = remoteProfile;
            state.isDirty = false;
            localStorage.setItem(PROFILE_KEY, JSON.stringify(state.profile));
          } else {
            state.profile = localDraft;
            state.isDirty = true;
          }
        } else {
          state.profile = remoteProfile;
          state.isDirty = false;
          localStorage.setItem(PROFILE_KEY, JSON.stringify(state.profile));
        }
      } else if (localDraft) {
        state.profile = localDraft;
        state.isDirty = true;
      } else {
        var profRes = await fetch('assets/data/research-profile.json');
        state.profile = await profRes.json();
        state.isDirty = false;
      }

      // 3. Load search-index articles for instant matching
      var idxRes = await fetch('assets/search-index.json');
      var idxData = await idxRes.json();
      state.articles = idxData.articles || [];

      // 4. Load milestones for classic papers
      try {
        var msRes = await fetch('assets/data/topic-milestones.json');
        var msData = await msRes.json();
        state.milestones = msData.milestones || msData || [];
      } catch (e) {
        state.milestones = [];
      }

      // Render all 12 modules
      renderAll();
      bindEvents();
      checkAndResumeActiveDiscovery();
    } catch (err) {
      console.error('Failed to initialize My Radar:', err);
      alert('加载科研雷达数据失败，请刷新重试：' + err.message);
    }
  }

  function renderAll() {
    updateStatusBadge();
    renderOverview();       // Module 1
    renderTopicsTree();     // Module 2
    renderSpecies();        // Module 3
    renderGenes();          // Module 4
    renderMethods();        // Module 5
    renderWeeklyStrategy(); // Module 6
    renderDiscoveryStrategy(); // Module 7
    executeInstantMatching(); // Module 8
    renderClassicPapers();  // Module 9
    renderSupplements();    // Module 10
    renderSyncStatus();     // Module 11
    renderCostStats();      // Module 12
  }

  function updateStatusBadge(customMsg) {
    var badge = $('radar-status-badge');
    if (!badge) return;
    if (customMsg) {
      badge.innerHTML = '<span class="radar-status-dot dirty"></span> ' + escapeHtml(customMsg);
      return;
    }
    if (state.isDirty) {
      badge.innerHTML = '<span class="radar-status-dot dirty"></span> 本地修改草稿待同步 (' + escapeHtml(state.profile.profile_version || 'v3.1.0') + ')';
    } else if (state.profile.sync_status && state.profile.sync_status.status === 'synced') {
      badge.innerHTML = '<span class="radar-status-dot"></span> 已同步至流水线生产配置 (' + escapeHtml(state.profile.profile_version || 'v3.1.0') + ')';
    } else {
      badge.innerHTML = '<span class="radar-status-dot" style="background:#717873;"></span> 未同步 (使用本地配置: ' + escapeHtml(state.profile.profile_version || 'v3.1.0') + ')';
    }
  }

  // Module 1: Overview
  function renderOverview() {
    var cTopics = (state.profile.followed_topics || []).length;
    var cSubtopics = (state.profile.followed_subtopics || []).length;
    var cSpecies = (state.profile.followed_species || []).length;
    var cGenes = (state.profile.followed_genes || []).length;
    var cMethods = (state.profile.followed_methods || []).length;
    var strat = state.profile.weekly_selection_strategy || {};
    var disc = state.profile.historical_discovery_strategy || {};

    var container = $('overview-cards-container');
    if (!container) return;

    container.innerHTML = [
      '<div class="overview-card">',
      '  <div class="overview-card-label">关注学术专题</div>',
      '  <div class="overview-card-val">' + cTopics + ' <span style="font-size:14px;font-weight:normal;color:#717873;">一级 / ' + cSubtopics + ' 二级</span></div>',
      '  <div class="overview-card-sub">覆盖功能、编辑与育种等</div>',
      '</div>',
      '<div class="overview-card">',
      '  <div class="overview-card-label">关注研究物种</div>',
      '  <div class="overview-card-val">' + cSpecies + ' <span style="font-size:14px;font-weight:normal;color:#717873;">类目标物种</span></div>',
      '  <div class="overview-card-sub">' + (state.profile.followed_species || []).map(function(s){return s.name_zh;}).join('、') + '</div>',
      '</div>',
      '<div class="overview-card">',
      '  <div class="overview-card-label">关注核心基因</div>',
      '  <div class="overview-card-val">' + cGenes + ' <span style="font-size:14px;font-weight:normal;color:#717873;">个实体</span></div>',
      '  <div class="overview-card-sub">' + (state.profile.followed_genes || []).map(function(g){return g.symbol;}).join('、') + '</div>',
      '</div>',
      '<div class="overview-card">',
      '  <div class="overview-card-label">关注关键方法</div>',
      '  <div class="overview-card-val">' + cMethods + ' <span style="font-size:14px;font-weight:normal;color:#717873;">项技术</span></div>',
      '  <div class="overview-card-sub">实验、测序与生信算法</div>',
      '</div>',
      '<div class="overview-card">',
      '  <div class="overview-card-label">每周选文策略</div>',
      '  <div class="overview-card-val">' + Math.round((strat.core_focus_ratio || 0.7) * 100) + '% <span style="font-size:14px;font-weight:normal;color:#717873;">核心关注</span></div>',
      '  <div class="overview-card-sub">关联 ' + Math.round((strat.related_focus_ratio || 0.2) * 100) + '% · 突破 ' + Math.round((strat.breakthrough_ratio || 0.1) * 100) + '%</div>',
      '</div>',
      '<div class="overview-card">',
      '  <div class="overview-card-label">科研溯源发现</div>',
      '  <div class="overview-card-val">' + (disc.enabled ? '已开启' : '已暂停') + ' <span style="font-size:14px;font-weight:normal;color:#717873;">' + (disc.weekly_quota || 5) + '篇/周</span></div>',
      '  <div class="overview-card-sub">跨库真实历史文献溯源</div>',
      '</div>'
    ].join('\n');
  }

  // Module 2: Followed Topics Tree
  function renderTopicsTree() {
    var container = $('topic-tree-container');
    if (!container || !state.taxonomy) return;

    var followedTopicMap = {};
    (state.profile.followed_topics || []).forEach(function (t) {
      followedTopicMap[t.topic_id] = t;
    });

    var followedSubtopicMap = {};
    (state.profile.followed_subtopics || []).forEach(function (st) {
      followedSubtopicMap[st.subtopic_id] = st;
    });

    var html = [];
    (state.taxonomy.topics || []).forEach(function (top) {
      var isTopFollowed = !!followedTopicMap[top.id];
      var topPriority = isTopFollowed ? followedTopicMap[top.id].priority : 'normal';

      html.push('<div class="topic-tree-node' + (isTopFollowed ? ' expanded' : '') + '" data-topic-id="' + top.id + '">');
      html.push('  <div class="topic-parent-row" onclick="window.GenomeRadarUI.toggleTopicNode(this)">');
      html.push('    <div class="topic-parent-left">');
      html.push('      <span class="topic-toggle-icon">▶</span>');
      html.push('      <input type="checkbox" id="chk-top-' + top.id + '" ' + (isTopFollowed ? 'checked' : '') + ' onclick="event.stopPropagation(); window.GenomeRadarUI.togglePrimaryTopic(\'' + top.id + '\', this.checked)">');
      html.push('      <label class="topic-parent-name" for="chk-top-' + top.id + '">' + escapeHtml(top.name_zh) + ' <span style="font-size:12px;font-weight:normal;color:#717873;">(' + (top.subtopics || []).length + ' 个方向)</span></label>');
      html.push('    </div>');
      html.push('    <div class="topic-parent-right" onclick="event.stopPropagation();">');
      html.push('      <select class="priority-select" onchange="window.GenomeRadarUI.setTopicPriority(\'' + top.id + '\', this.value)">');
      html.push('        <option value="high" ' + (topPriority === 'high' ? 'selected' : '') + '>重点关注 (1.5x)</option>');
      html.push('        <option value="normal" ' + (topPriority === 'normal' ? 'selected' : '') + '>普通关注 (1.0x)</option>');
      html.push('        <option value="low" ' + (topPriority === 'low' ? 'selected' : '') + '>低优先级 (0.5x)</option>');
      html.push('      </select>');
      html.push('    </div>');
      html.push('  </div>');

      html.push('  <div class="subtopic-list">');
      (top.subtopics || []).forEach(function (sub) {
        var isSubFollowed = isTopFollowed || !!followedSubtopicMap[sub.id];
        html.push('    <div class="subtopic-item">');
        html.push('      <label class="subtopic-label">');
        html.push('        <input type="checkbox" ' + (isSubFollowed ? 'checked' : '') + ' onchange="window.GenomeRadarUI.toggleSubtopic(\'' + sub.id + '\', \'' + top.id + '\', this.checked)">');
        html.push('        <span>' + escapeHtml(sub.name_zh) + '</span>');
        html.push('      </label>');
        html.push('    </div>');
      });
      html.push('  </div>');
      html.push('</div>');
    });

    container.innerHTML = html.join('\n');
  }

  // Module 3: Species
  function renderSpecies() {
    var container = $('species-grid');
    if (!container) return;

    var speciesList = state.profile.followed_species || [];
    var html = speciesList.map(function (sp, index) {
      return [
        '<div class="species-card">',
        '  <div class="species-card-header">',
        '    <div>',
        '      <span class="species-name">' + escapeHtml(sp.name_zh) + '</span>',
        '      <span class="species-latin">' + escapeHtml(sp.latin_name) + '</span>',
        '    </div>',
        '    <button type="button" class="btn-radar btn-secondary" style="padding:2px 8px;font-size:11px;" onclick="window.GenomeRadarUI.removeSpecies(' + index + ')">删除</button>',
        '  </div>',
        '  <div class="species-meta">',
        '    <span class="species-badge ' + (sp.role || 'primary') + '">' + (sp.role === 'primary' ? '主要物种' : sp.role === 'comparative' ? '比较物种' : '验证物种') + '</span>',
        '    <span style="font-size:11px;color:#717873;">TaxID: ' + (sp.tax_id || '未标注') + '</span>',
        '    ' + (sp.expand_relatives ? '<span style="font-size:11px;color:#173e2d;background:#eef3ec;padding:2px 6px;border-radius:4px;">扩展近缘</span>' : ''),
        '  </div>',
        '</div>'
      ].join('\n');
    }).join('\n');

    container.innerHTML = html || '<p style="color:#717873;font-size:13.5px;">暂未添加关注物种，请从下方快捷添加或手动输入。</p>';
  }

  // Module 4: Genes
  function renderGenes() {
    var container = $('gene-cards-grid');
    if (!container) return;

    var geneList = state.profile.followed_genes || [];
    var html = geneList.map(function (g, index) {
      return [
        '<div class="gene-card">',
        '  <div class="gene-card-title">',
        '    <span class="gene-symbol">' + escapeHtml(g.symbol) + '</span>',
        '    <span class="gene-species-tag">' + escapeHtml(g.species) + '</span>',
        '  </div>',
        '  <div class="gene-desc">' + escapeHtml(g.functional_annotation || '暂无详细注释') + '</div>',
        '  <div class="gene-sub-info">',
        '    <div><b>别名:</b> ' + escapeHtml((g.aliases || []).join(', ') || '无') + ' | <b>家族:</b> ' + escapeHtml(g.gene_family || '未归类') + '</div>',
        '    <div><b>通路:</b> ' + escapeHtml(g.pathway || '未指定') + '</div>',
        '    <div><b>稳定标识:</b> ' + escapeHtml(JSON.stringify(g.db_xrefs || {})) + '</div>',
        '  </div>',
        '  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding-top:8px;border-top:1px solid #eae7de;">',
        '    <label style="font-size:12px;color:#173e2d;display:flex;align-items:center;gap:4px;cursor:pointer;">',
        '      <input type="checkbox" ' + (g.expand_homology ? 'checked' : '') + ' onchange="window.GenomeRadarUI.toggleGeneHomology(' + index + ', this.checked)"> 同源基因扩展',
        '    </label>',
        '    <button type="button" class="btn-radar btn-secondary" style="padding:2px 8px;font-size:11px;" onclick="window.GenomeRadarUI.removeGene(' + index + ')">删除</button>',
        '  </div>',
        '</div>'
      ].join('\n');
    }).join('\n');

    container.innerHTML = html || '<p style="color:#717873;font-size:13.5px;">暂未添加关注基因实体，请使用下方表单添加。</p>';
  }

  // Module 5: Research Methods
  function renderMethods() {
    var container = $('methods-container');
    if (!container) return;

    var followedNames = (state.profile.followed_methods || []).map(function(m){return m.name;});

    var ALL_METHOD_PRESETS = [
      { category: '实验与分子技术', methods: ['CRISPR/Cas9 靶向敲除', '先导编辑 (Prime Editing)', '单碱基编辑 (ABE/CBE)', '染色质免疫共沉淀测序 (ChIP-seq)', 'CUT&Tag 高敏组蛋白修饰检测', '全基因组重亚硫酸盐测序 (WGBS)', '三维基因组构象捕获 (Hi-C / Micro-C)', '转基因过表达与突变体互补'] },
      { category: '前沿测序技术', methods: ['长读长 PacBio HiFi 测序', '高通量单核 RNA 测序 (snRNA-seq)', '单细胞 RNA 测序 (scRNA-seq)', '空间转录组测序 (Stereo-seq/Xenium)', '超长 Nanopore 测序'] },
      { category: '生物信息与基因组学方法', methods: ['全基因组从头 De Novo 组装', '单倍型分相组装', '端粒到端粒 (T2T) 完整图谱', '图形泛基因组构建算法 (Minigraph/vg)', '系统发育分析', '分子钟定年分析', '全基因组复制 (WGD) 分析', '多基因组共线性分析 (MCScanX)', '杂交渐渗与网状演化分析'] },
      { category: '统计遗传与关联分析', methods: ['全基因组关联分析 (GWAS)', 'QTL 连锁定位与精细定位', 'Fast3VmrMLM 快速上位性检测算法', '全基因组选择与分子标记辅助育种'] },
      { category: '软件算法与 AI 工具', methods: ['变异检出算法基准评测 (DeepVariant/GATK)', '图神经网络 (GNN) 预测平台', '蛋白质语言模型与结构预测 (AlphaFold/ESM)', '多组学数据整合与可视化'] }
    ];

    var html = ALL_METHOD_PRESETS.map(function (grp) {
      var chips = grp.methods.map(function (mName) {
        var isSel = followedNames.includes(mName);
        return '<span class="method-chip ' + (isSel ? 'selected' : '') + '" onclick="window.GenomeRadarUI.toggleMethod(\'' + escapeHtml(mName) + '\')">' + (isSel ? '✓ ' : '+ ') + escapeHtml(mName) + '</span>';
      }).join('');

      return [
        '<div class="methods-category-group">',
        '  <div class="methods-cat-title">' + escapeHtml(grp.category) + '</div>',
        '  <div class="methods-chips-wrapper">' + chips + '</div>',
        '</div>'
      ].join('\n');
    }).join('\n');

    container.innerHTML = html;
  }

  // Module 6: Weekly Selection Strategy
  function renderWeeklyStrategy() {
    var strat = state.profile.weekly_selection_strategy || {
      core_focus_ratio: 0.70,
      related_focus_ratio: 0.20,
      breakthrough_ratio: 0.10,
      personal_relevance_weight: 0.70,
      academic_quality_weight: 0.30
    };
    var weights = state.profile.priority_weights || {
      topic: 0.35, species: 0.25, gene: 0.25, method: 0.15
    };

    $('slider-core').value = Math.round(strat.core_focus_ratio * 100);
    $('val-core').textContent = Math.round(strat.core_focus_ratio * 100) + '%';

    $('slider-related').value = Math.round(strat.related_focus_ratio * 100);
    $('val-related').textContent = Math.round(strat.related_focus_ratio * 100) + '%';

    $('slider-breakthrough').value = Math.round(strat.breakthrough_ratio * 100);
    $('val-breakthrough').textContent = Math.round(strat.breakthrough_ratio * 100) + '%';

    $('slider-relevance-weight').value = Math.round(strat.personal_relevance_weight * 100);
    $('val-relevance-weight').textContent = Math.round(strat.personal_relevance_weight * 100) + '%';

    $('slider-w-topic').value = Math.round(weights.topic * 100);
    $('val-w-topic').textContent = Math.round(weights.topic * 100) + '%';

    $('slider-w-species').value = Math.round(weights.species * 100);
    $('val-w-species').textContent = Math.round(weights.species * 100) + '%';

    $('slider-w-gene').value = Math.round(weights.gene * 100);
    $('val-w-gene').textContent = Math.round(weights.gene * 100) + '%';

    $('slider-w-method').value = Math.round(weights.method * 100);
    $('val-w-method').textContent = Math.round(weights.method * 100) + '%';
  }

  // Module 7: Historical Discovery Strategy
  function renderDiscoveryStrategy() {
    var disc = state.profile.historical_discovery_strategy || {
      enabled: true,
      weekly_quota: 5,
      types: ['foundational', 'classic_method', 'breakthrough', 'high_relevance', 'cross_species_heuristic']
    };

    $('chk-discovery-enabled').checked = !!disc.enabled;
    $('slider-discovery-quota').value = disc.weekly_quota || 5;
    $('val-discovery-quota').textContent = (disc.weekly_quota || 5) + ' 篇';

    var types = disc.types || [];
    $('chk-type-foundational').checked = types.includes('foundational');
    $('chk-type-classic').checked = types.includes('classic_method');
    $('chk-type-breakthrough').checked = types.includes('breakthrough');
    $('chk-type-high-rel').checked = types.includes('high_relevance');
    $('chk-type-cross').checked = types.includes('cross_species_heuristic');
  }

  function calcAcademicQualityScore(art) {
    if (art && art.academic_quality) {
      if (typeof art.academic_quality.overall_score === 'number') {
        return art.academic_quality.overall_score;
      }
      if (typeof art.academic_quality.content_score === 'number') {
        return art.academic_quality.content_score;
      }
    }

    var j = (art.journal || '').toLowerCase();
    var score = 0.60;
    var cnsTop = ['nature', 'science', 'cell', 'nat genet', 'nat plants', 'nat biotechnol', 'nat commun', 'sci adv'];
    var casQ1 = ['plant cell', 'mol plant', 'genome biol', 'nucleic acids res', 'pnas', 'new phytol', 'trends plant sci', 'genome res'];
    var casQ2 = ['plant biotechnol j', 'plant j', 'j exp bot', 'plant physiol', 'theor appl genet', 'front plant sci', 'bmc plant biol', 'crop j', 'hortic res'];
    var casQ3 = ['plos one', 'sci rep', 'plants', 'agronomy', 'int j mol sci', 'genes'];

    if (cnsTop.some(function(top){ return j.includes(top); })) {
      score = 0.94;
    } else if (casQ1.some(function(q1){ return j.includes(q1); })) {
      score = 0.88;
    } else if (casQ2.some(function(q2){ return j.includes(q2); })) {
      score = 0.80;
    } else if (casQ3.some(function(q3){ return j.includes(q3); })) {
      score = 0.70;
    } else if (j) {
      score = 0.64;
    }

    if (art.impact_factor) {
      try {
        var ifVal = parseFloat(art.impact_factor);
        if (!isNaN(ifVal)) score += Math.min(Math.max(ifVal, 0), 35.0) / 350.0;
      } catch(e){}
    }

    if (art.is_cover_highlight || art.cover_featured) score += 0.05;
    if (art.fulltext_available || art.pmcid || art.open_access) score += 0.05;

    return Math.min(1.0, Math.max(0.50, Number(score.toFixed(4))));
  }

  // Helper: Gene Entity Matching with Species Disambiguation
  function matchGeneEntity(art, followedGene) {
    var sym = (followedGene.symbol || '').trim();
    if (!sym) return { score: 0, tags: [] };

    var symLower = sym.toLowerCase();
    var targetSp = (followedGene.species || '').toLowerCase();
    var geneId = (followedGene.gene_id || '').toLowerCase();
    var fam = (followedGene.gene_family || '').toLowerCase();
    var expandHomology = !!followedGene.expand_homology;
    var aliases = (followedGene.aliases || []).map(function(a){ return String(a).trim().toLowerCase(); }).filter(Boolean);

    var artSp = (art.primary_species || '').toLowerCase();
    var artObjs = (art.research_objects || []).map(function(o){ return String(o).toLowerCase(); }).join(' ');
    var artFams = (art.gene_families || []).map(function(f){ return String(f).toLowerCase(); });
    var fullText = [
      art.title_zh || '',
      art.title_en || '',
      art.lead || '',
      art.what || '',
      art.abstract || ''
    ].join(' ').toLowerCase();

    function parseSpeciesIdentifiers(spStr) {
      var spLower = (spStr || '').toLowerCase();
      var latinMatch = spLower.match(/\b([a-z]{3,})\s+([a-z]{3,})\b/);
      var latinBinomial = latinMatch ? (latinMatch[1] + ' ' + latinMatch[2]) : '';
      var genus = latinMatch ? latinMatch[1] : '';
      var zhMatches = (spStr || '').match(/[\u4e00-\u9fa5]{2,}/g) || [];
      var taxMatches = spLower.match(/(?:taxid:?|taxonomy\/)?([0-9]{3,7})/g) || [];
      return {
        raw: spLower,
        latin: latinBinomial,
        genus: genus,
        zh: zhMatches,
        taxids: taxMatches
      };
    }

    var targetSpInfo = parseSpeciesIdentifiers(targetSp);

    function isSpeciesMatched(geneSpStr) {
      if (!targetSp) return true;
      var checkStr = ((geneSpStr || '') + ' ' + artSp + ' ' + artObjs).toLowerCase();
      var candInfo = parseSpeciesIdentifiers(checkStr);

      // 1. TaxID 匹配优先
      if (targetSpInfo.taxids.length && candInfo.taxids.length) {
        if (targetSpInfo.taxids.some(function(t){ return candInfo.taxids.includes(t); })) return true;
      }

      // 2. 完整拉丁双名法匹配 (禁止仅凭属名判定为同一物种)
      if (targetSpInfo.latin && candInfo.latin) {
        if (targetSpInfo.latin === candInfo.latin) return true;
        if (targetSpInfo.genus === candInfo.genus) return false;
      }

      // 3. 中文物种名精确匹配
      if (targetSpInfo.zh.length && candInfo.zh.length) {
        if (targetSpInfo.zh.some(function(z){ return candInfo.zh.includes(z); })) return true;
      }

      // 4. 后备：如果目标物种完整拉丁学名包含在文本中
      if (targetSpInfo.latin && checkStr.includes(targetSpInfo.latin)) return true;

      return false;
    }

    // 1. Check structured genes array (compatible with both strings and objects)
    var rawGenes = (art.genes || []).concat(art.gene_entities || []);
    for (var i = 0; i < rawGenes.length; i++) {
      var item = rawGenes[i];
      var itemSym = '';
      var itemSp = '';
      var itemGid = '';
      var itemAliases = [];

      if (typeof item === 'string') {
        itemSym = item.trim().toLowerCase();
      } else if (item && typeof item === 'object') {
        itemSym = (item.symbol || '').trim().toLowerCase();
        itemSp = (item.species || '').trim().toLowerCase();
        itemGid = (item.gene_id || '').trim().toLowerCase();
        itemAliases = (item.aliases || []).map(function(a){ return String(a).trim().toLowerCase(); });
      }

      var hit = (itemSym === symLower) || (itemSym && aliases.includes(itemSym)) || (geneId && itemGid && geneId === itemGid);
      if (!hit && aliases.length && itemAliases.some(function(a){ return aliases.includes(a); })) {
        hit = true;
      }

      if (hit) {
        if (isSpeciesMatched(itemSp)) {
          var spLabel = (followedGene.species || '').split(/[\s(]/)[0];
          var tag = spLabel ? ('精确定位关注基因 [' + sym + '] (' + spLabel + ')') : ('精确定位关注基因 [' + sym + ']');
          return { score: 1.0, tags: [tag] };
        } else if (expandHomology) {
          var hasHomologyEv = ['homolog', 'ortholog', 'paralog', '同源', 'syntenic', 'orthologs'].some(function(w){
            return fullText.includes(w);
          });
          if (hasHomologyEv) {
            return { score: 0.80, tags: ['同源基因拓展 [' + sym + '] (跨物种)'] };
          } else {
            return { score: 0.35, tags: ['同名跨物种基因待核验候选 [' + sym + ']'] };
          }
        }
      }
    }

    // 2. Full text matching with word boundaries
    var escapedSym = symLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var regex = new RegExp('(?:^|[^a-zA-Z0-9_])' + escapedSym + '(?:$|[^a-zA-Z0-9_])', 'i');
    var textHit = regex.test(fullText);

    if (!textHit && aliases.length) {
      for (var j = 0; j < aliases.length; j++) {
        var al = aliases[j];
        if (al.length >= 3) {
          var escAl = al.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          if (new RegExp('(?:^|[^a-zA-Z0-9_])' + escAl + '(?:$|[^a-zA-Z0-9_])', 'i').test(fullText)) {
            textHit = true;
            break;
          }
        }
      }
    }

    if (textHit) {
      if (isSpeciesMatched()) {
        return { score: 0.90, tags: ['文献涉及关注基因 [' + sym + ']'] };
      } else if (expandHomology) {
        var hasHomologyEvText = ['homolog', 'ortholog', 'paralog', '同源', 'syntenic', 'orthologs'].some(function(w){
          return fullText.includes(w);
        });
        if (hasHomologyEvText) {
          return { score: 0.75, tags: ['文献提及同源候选 [' + sym + ']'] };
        } else {
          return { score: 0.35, tags: ['同名跨物种基因待核验候选 [' + sym + ']'] };
        }
      }
    }

    // 3. Family level match (only if expandHomology is enabled)
    if (expandHomology && fam) {
      if (artFams.some(function(af){ return af.includes(fam) || fam.includes(af); }) || (fam.length >= 4 && fullText.includes(fam))) {
        return { score: 0.65, tags: ['命中同源基因家族 [' + (followedGene.gene_family || fam) + ']'] };
      }
    }

    return { score: 0.0, tags: [] };
  }

  // Module 8: Instant Matching Engine (Core Algorithm)
  function executeInstantMatching() {
    var articles = state.articles || [];
    var followedTopics = state.profile.followed_topics || [];
    var followedSubtopics = state.profile.followed_subtopics || [];
    var followedSpecies = state.profile.followed_species || [];
    var followedGenes = state.profile.followed_genes || [];
    var followedMethods = state.profile.followed_methods || [];
    var weights = state.profile.priority_weights || { topic: 0.35, species: 0.25, gene: 0.25, method: 0.15 };
    var strat = state.profile.weekly_selection_strategy || { personal_relevance_weight: 0.70, academic_quality_weight: 0.30 };

    var scored = articles.map(function (art) {
      var matchTags = [];
      var topicScore = 0;
      var speciesScore = 0;
      var geneScore = 0;
      var methodScore = 0;

      // 1. Topic scoring
      var artPt = art.primary_topic || art.topic_id;
      var artSubs = art.subtopics || [];
      var artSecs = art.secondary_topics || [];

      followedTopics.forEach(function (t) {
        if (t.status === 'paused') return;
        if (t.topic_id === artPt) {
          topicScore = Math.max(topicScore, t.priority === 'high' ? 1.0 : t.priority === 'normal' ? 0.8 : 0.5);
          matchTags.push({ type: 'topic', label: '核心专题: ' + (t.name_zh || t.topic_id) });
        } else if (artSecs.includes(t.topic_id)) {
          topicScore = Math.max(topicScore, 0.6);
          matchTags.push({ type: 'topic', label: '关联专题: ' + (t.name_zh || t.topic_id) });
        }
      });

      followedSubtopics.forEach(function (st) {
        if (st.status === 'paused') return;
        if (artSubs.includes(st.subtopic_id)) {
          topicScore = Math.max(topicScore, st.priority === 'high' ? 1.0 : 0.85);
          matchTags.push({ type: 'topic', label: '二级方向: ' + (st.name_zh || st.subtopic_id) });
        }
      });

      // 2. Species scoring
      var artSp = art.primary_species || '';
      var artObjs = (art.research_objects || []).join(' ');
      var artText = (art.title_zh + ' ' + art.title_en + ' ' + (art.lead || '')).toLowerCase();

      followedSpecies.forEach(function (sp) {
        if (sp.status === 'paused') return;
        var spZh = (sp.name_zh || '').toLowerCase();
        var spEn = (sp.name_en || '').toLowerCase();
        var spLat = (sp.latin_name || '').toLowerCase();

        if ((spZh && artSp.toLowerCase().includes(spZh)) || (spLat && artSp.toLowerCase().includes(spLat))) {
          speciesScore = Math.max(speciesScore, sp.role === 'primary' ? 1.0 : sp.role === 'comparative' ? 0.8 : 0.6);
          matchTags.push({ type: 'species', label: '主要物种: ' + sp.name_zh });
        } else if ((spZh && artObjs.toLowerCase().includes(spZh)) || (spZh && artText.includes(spZh)) || (spEn && artText.includes(spEn))) {
          speciesScore = Math.max(speciesScore, 0.7);
          matchTags.push({ type: 'species', label: '涉及物种: ' + sp.name_zh });
        } else if (sp.expand_relatives) {
          if ((spZh === '大麦' || spZh === '小麦') && (artSp.includes('小麦') || artSp.includes('大麦') || artSp.includes('偃麦草') || artSp.includes('草林'))) {
            speciesScore = Math.max(speciesScore, 0.5);
            matchTags.push({ type: 'species', label: '近缘物种: ' + artSp.split(' ')[0] });
          }
        }
      });

      // 3. Gene scoring (with entity & species disambiguation)
      followedGenes.forEach(function (g) {
        if (g.status === 'paused') return;
        var gRes = matchGeneEntity(art, g);
        if (gRes.score > geneScore) {
          geneScore = gRes.score;
        }
        gRes.tags.forEach(function (tag) {
          matchTags.push({ type: 'gene', label: tag });
        });
      });

      // 4. Method scoring
      var artMethods = art.research_methods || [];
      followedMethods.forEach(function (m) {
        if (m.status === 'paused') return;
        var mName = m.name || '';
        if (mName && artMethods.some(function(am){ return am.includes(mName) || mName.includes(am); })) {
          methodScore = Math.max(methodScore, m.priority === 'high' ? 1.0 : 0.8);
          matchTags.push({ type: 'method', label: '关注方法: ' + mName.split(' ')[0] });
        } else if (mName && artText.includes(mName.toLowerCase())) {
          methodScore = Math.max(methodScore, 0.6);
          matchTags.push({ type: 'method', label: '方法提及: ' + mName.split(' ')[0] });
        }
      });

      // Weighted personal score with dynamic normalization (only active non-paused dimensions participate)
      var activeTopics = (state.profile.followed_topics || []).filter(function(t){ return t.status !== 'paused'; });
      var activeSubtopics = (state.profile.followed_subtopics || []).filter(function(st){ return st.status !== 'paused'; });
      var activeSpecies = (state.profile.followed_species || []).filter(function(s){ return s.status !== 'paused'; });
      var activeGenes = (state.profile.followed_genes || []).filter(function(g){ return g.status !== 'paused'; });
      var activeMethods = (state.profile.followed_methods || []).filter(function(m){ return m.status !== 'paused'; });

      var hasActiveTopic = (activeTopics.length > 0 || activeSubtopics.length > 0);
      var hasActiveSpecies = (activeSpecies.length > 0);
      var hasActiveGene = (activeGenes.length > 0);
      var hasActiveMethod = (activeMethods.length > 0);

      function parseDimWeight(val, defVal) {
        if (typeof val === 'number' && !isNaN(val)) return val;
        if (typeof val === 'string' && val.trim() !== '') {
          var n = Number(val);
          if (!isNaN(n)) return n;
        }
        return defVal;
      }

      var wTopic = hasActiveTopic ? parseDimWeight(weights.topic, 0.35) : 0.0;
      var wSpecies = hasActiveSpecies ? parseDimWeight(weights.species, 0.25) : 0.0;
      var wGene = hasActiveGene ? parseDimWeight(weights.gene, 0.25) : 0.0;
      var wMethod = hasActiveMethod ? parseDimWeight(weights.method, 0.15) : 0.0;

      var totalActiveW = wTopic + wSpecies + wGene + wMethod;
      var pScore = 0.50; // Neutral baseline when all active weights are 0
      if (totalActiveW > 0) {
        pScore = ((topicScore * wTopic) +
                  (speciesScore * wSpecies) +
                  (geneScore * wGene) +
                  (methodScore * wMethod)) / totalActiveW;
      }

      // Data-driven academic quality score (0.50 ~ 1.00)
      var acadScore = calcAcademicQualityScore(art);

      var finalScore = (pScore * strat.personal_relevance_weight) + (acadScore * strat.academic_quality_weight);

      return {
        article: art,
        personalScore: Math.min(1.0, pScore),
        academicScore: Math.min(1.0, acadScore),
        finalScore: Math.min(1.0, finalScore),
        matchTags: matchTags
      };
    });

    // Sort descending
    scored.sort(function (a, b) { return b.finalScore - a.finalScore; });
    state.matchedArticles = scored;

    renderRecommendations();
  }

  function renderRecommendations() {
    var container = $('recommendations-list');
    if (!container) return;

    var topMatches = state.matchedArticles.slice(0, 10);
    if (!topMatches.length) {
      container.innerHTML = '<p style="color:#717873;padding:20px;">暂未找到匹配文献，请尝试调整个性化关注条件。</p>';
      return;
    }

    var feedback = {};
    try { feedback = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '{}'); } catch(e){}

    var html = topMatches.map(function (item, idx) {
      var art = item.article;
      var url = art.url || (art.issue_date ? art.issue_date + '/index.html?article=' + (art.article_number || (idx + 1)) : '#');
      var pPct = Math.round(item.personalScore * 100);
      var fPct = (item.finalScore * 100).toFixed(1);
      var fb = feedback[art.id] || {};

      var tagSpans = item.matchTags.map(function(t) {
        return '<span class="match-tag ' + t.type + '">' + escapeHtml(t.label) + '</span>';
      }).join(' ');

      return [
        '<div class="rec-article-card" data-article-id="' + art.id + '">',
        '  <div class="rec-card-header">',
        '    <div>',
        '      <a class="rec-card-title" href="' + url + '" target="_blank">' + escapeHtml(art.title_zh) + '</a>',
        '      <div style="font-size:13px;color:#717873;margin-top:3px;">' + escapeHtml(art.title_en) + '</div>',
        '    </div>',
        '    <div class="rec-score-box">',
        '      <span class="rec-score-num">' + fPct + '<span style="font-size:12px;font-weight:normal;">分</span></span>',
        '      <span class="rec-score-label">匹配度 ' + pPct + '%</span>',
        '    </div>',
        '  </div>',
        '  <div class="rec-meta-row">',
        '    <span>' + escapeHtml(art.journal) + '</span>',
        '    <span>' + escapeHtml(art.date || art.publication_date || '') + '</span>',
        '    <span>' + escapeHtml(art.primary_species || '植物') + '</span>',
        '    ' + (art.doi ? '<a href="https://doi.org/' + art.doi + '" target="_blank" style="color:#173e2d;text-decoration:none;">DOI: ' + art.doi + '</a>' : ''),
        '    <span class="match-tag" style="background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;font-weight:600;" title="' + escapeHtml(art.academic_quality ? art.academic_quality.rationale : '') + '">六维学术质量: ' + Math.round(item.academicScore * 100) + '分</span>',
        '  </div>',
        (art.academic_quality && art.academic_quality.rationale ? '  <div style="font-size:12px;color:#0284c7;background:#f0f9ff;padding:4px 8px;border-radius:4px;margin-bottom:8px;border:1px solid #e0f2fe;"><b>六维学术评价:</b> ' + escapeHtml(art.academic_quality.rationale) + '</div>' : ''),
        '  <div class="rec-match-reasons">' + tagSpans + '</div>',
        '  <div class="rec-card-snippet">' + escapeHtml(art.lead || art.what || art.finding || '') + '</div>',
        '  <div class="rec-feedback-bar">',
        '    <button type="button" class="feedback-btn ' + (fb.interested ? 'active' : '') + '" onclick="window.GenomeRadarUI.sendFeedback(\'' + art.id + '\', \'interested\')">👍 感兴趣</button>',
        '    <button type="button" class="feedback-btn ' + (fb.read ? 'active' : '') + '" onclick="window.GenomeRadarUI.sendFeedback(\'' + art.id + '\', \'read\')">✓ 已读</button>',
        '    <button type="button" class="feedback-btn ' + (fb.starred ? 'active' : '') + '" onclick="window.GenomeRadarUI.sendFeedback(\'' + art.id + '\', \'starred\')">★ 收藏到文献库</button>',
        '    <a class="feedback-btn" href="deep-read.html?doi=' + encodeURIComponent(art.doi || '') + '" target="_blank">📖 加入精读工作台</a>',
        '    <button type="button" class="feedback-btn ' + (fb.uninterested ? 'active' : '') + '" onclick="window.GenomeRadarUI.sendFeedback(\'' + art.id + '\', \'uninterested\')">✕ 减少此类推荐</button>',
        '  </div>',
        '</div>'
      ].join('\n');
    }).join('\n');

    container.innerHTML = html;
  }

  // Module 9: Classic Papers
  function renderClassicPapers() {
    var container = $('classic-papers-grid');
    if (!container) return;

    var milestones = state.milestones || [];
    var followedTopics = (state.profile.followed_topics || []).map(function(t){return t.topic_id;});

    var filtered = milestones.filter(function (m) {
      return followedTopics.includes(m.topic_id) || m.id === 'MS-EVO-2008-MCSCAN' || m.id === 'MS-PAN-2023-HPRC';
    }).slice(0, 4);

    if (!filtered.length) filtered = milestones.slice(0, 4);

    var html = filtered.map(function (m) {
      return [
        '<div class="overview-card" style="border-left: 3px solid #173e2d;">',
        '  <div style="display:flex;justify-content:space-between;align-items:baseline;">',
        '    <span style="font-weight:700;font-size:15px;color:#173e2d;">' + escapeHtml(m.title_zh) + '</span>',
        '    <span style="font-size:12px;font-weight:700;color:#b87315;">' + m.year + '</span>',
        '  </div>',
        '  <div style="font-size:12.5px;color:#717873;font-style:italic;">' + escapeHtml(m.paper_title || m.title_en) + '</div>',
        '  <div style="font-size:13px;color:#4a524d;margin-top:4px;">' + escapeHtml(m.significance) + '</div>',
        '  <div style="font-size:12px;color:#717873;margin-top:4px;">' + escapeHtml(m.journal) + ' · DOI: ' + escapeHtml(m.doi) + '</div>',
        '</div>'
      ].join('\n');
    }).join('\n');

    container.innerHTML = html;
  }

  // Module 10: Supplement Archive
  async function renderSupplements() {
    var container = $('supplements-list');
    if (!container) return;

    try {
      var res = await fetch('assets/data/supplement-index.json');
      if (!res.ok) throw new Error('not found');
      var data = await res.json();
      var supplements = data.supplements || [];
      if (!supplements.length) throw new Error('empty');

      var html = supplements.map(function (sup) {
        var count = sup.article_count || (sup.articles ? sup.articles.length : 0);
        return [
          '<div class="overview-card" style="display:flex;justify-content:space-between;align-items:center;">',
          '  <div>',
          '    <a href="' + escapeHtml(sup.url) + '" target="_blank" style="font-weight:700;font-size:16px;color:#173e2d;text-decoration:none;">' + escapeHtml(sup.title) + '</a>',
          '    <div style="font-size:13px;color:#717873;margin-top:3px;">收录 ' + count + ' 篇经核验历史奠基论文 · 专属定制人: ' + escapeHtml(sup.profile_identity || '科研人员') + ' · 依据画像: ' + escapeHtml(sup.profile_version || 'v3.1.0') + '</div>',
          '  </div>',
          '  <a href="' + escapeHtml(sup.url) + '" target="_blank" class="btn-radar btn-primary" style="padding:6px 14px;font-size:13px;">进入专刊阅读 →</a>',
          '</div>'
        ].join('\n');
      }).join('\n');

      container.innerHTML = html;
    } catch (e) {
      container.innerHTML = '<div style="padding:24px;text-align:center;color:#717873;background:#fff;border-radius:8px;border:1px dashed #d0d7de;">暂无个人科研专刊归档。点击上方【发现高相关历史文献并生成专刊】即可生成首期专刊。</div>';
    }
  }

  // Module 11: Sync Status
  function renderSyncStatus() {
    $('sync-version-label').textContent = state.profile.profile_version || 'v3.1.0-clean';
    $('sync-time-label').textContent = state.profile.updated_at || '未同步';
    if (state.isDirty) {
      $('sync-status-state').textContent = '本地有未同步的修改草稿';
      $('sync-status-state').style.color = '#e67e22';
    } else if (state.profile.sync_status && state.profile.sync_status.status === 'synced') {
      $('sync-status-state').textContent = '已与流水线生产配置完成双向同步';
      $('sync-status-state').style.color = '#27ae60';
    } else {
      $('sync-status-state').textContent = '未同步 (使用本地配置)';
      $('sync-status-state').style.color = '#717873';
    }
  }

  // Module 12: Cost Stats
  async function renderCostStats() {
    try {
      var res = await fetch('assets/data/radar-cost-summary.json');
      if (!res.ok) throw new Error('not found');
      var summary = await res.json();
      if (!summary || summary.total_runs === 0) {
        $('stat-run-tokens').textContent = '0 Token';
        $('stat-run-cost').textContent = '暂无运行记录';
        $('stat-cache-hit').textContent = '--';
        $('stat-budget-cap').textContent = '$0.25 / 周';
      } else {
        $('stat-run-tokens').textContent = Number(summary.total_tokens || 0).toLocaleString();
        $('stat-run-cost').textContent = '$' + (summary.total_cost_usd || 0).toFixed(4) + ' (约 ¥' + (summary.total_cost_cny || 0).toFixed(2) + ')';
        $('stat-cache-hit').textContent = '已启用';
        $('stat-budget-cap').textContent = '$0.25 / 周';
      }
    } catch (e) {
      $('stat-run-tokens').textContent = '0 Token';
      $('stat-run-cost').textContent = '暂无运行记录';
      $('stat-cache-hit').textContent = '--';
      $('stat-budget-cap').textContent = '$0.25 / 周';
    }
  }

  // Event handlers & API Actions
  function saveProfileDraft() {
    state.isDirty = true;
    state.profile.updated_at = new Date().toISOString();
    localStorage.setItem(PROFILE_KEY, JSON.stringify(state.profile));
    updateStatusBadge();
    executeInstantMatching();
  }

  window.state = state;
  window.GenomeRadarUI = {
    getState: function() { return state; },
    toggleTopicNode: function (headerEl) {
      var node = headerEl.closest('.topic-tree-node');
      if (node) node.classList.toggle('expanded');
    },

    togglePrimaryTopic: function (topicId, checked) {
      state.profile.followed_topics = state.profile.followed_topics || [];
      if (checked) {
        if (!state.profile.followed_topics.some(function(t){return t.topic_id === topicId;})) {
          state.profile.followed_topics.push({
            topic_id: topicId,
            priority: 'normal',
            weight: 1.0,
            auto_associate: true,
            status: 'active'
          });
        }
      } else {
        state.profile.followed_topics = state.profile.followed_topics.filter(function(t){
          return t.topic_id !== topicId;
        });
      }
      saveProfileDraft();
      renderOverview();
      renderTopicsTree();
    },

    setTopicPriority: function (topicId, prio) {
      var w = prio === 'high' ? 1.5 : prio === 'normal' ? 1.0 : 0.5;
      (state.profile.followed_topics || []).forEach(function (t) {
        if (t.topic_id === topicId) {
          t.priority = prio;
          t.weight = w;
        }
      });
      saveProfileDraft();
    },

    toggleSubtopic: function (subId, topId, checked) {
      state.profile.followed_subtopics = state.profile.followed_subtopics || [];
      if (checked) {
        if (!state.profile.followed_subtopics.some(function(s){return s.subtopic_id === subId;})) {
          state.profile.followed_subtopics.push({
            subtopic_id: subId,
            topic_id: topId,
            priority: 'normal',
            weight: 1.0,
            status: 'active'
          });
        }
      } else {
        state.profile.followed_subtopics = state.profile.followed_subtopics.filter(function(s){
          return s.subtopic_id !== subId;
        });
      }
      saveProfileDraft();
      renderOverview();
    },

    addSpeciesPreset: function (nameZh, nameEn, latin, taxId) {
      state.profile.followed_species = state.profile.followed_species || [];
      if (state.profile.followed_species.some(function(s){return s.name_zh === nameZh;})) {
        alert(nameZh + ' 已在关注列表中');
        return;
      }
      state.profile.followed_species.push({
        name_zh: nameZh,
        name_en: nameEn,
        latin_name: latin,
        tax_id: taxId,
        role: 'primary',
        expand_relatives: true
      });
      saveProfileDraft();
      renderOverview();
      renderSpecies();
    },

    removeSpecies: function (idx) {
      state.profile.followed_species.splice(idx, 1);
      saveProfileDraft();
      renderOverview();
      renderSpecies();
    },

    toggleGeneHomology: function (idx, checked) {
      if (state.profile.followed_genes[idx]) {
        state.profile.followed_genes[idx].expand_homology = checked;
        saveProfileDraft();
      }
    },

    removeGene: function (idx) {
      state.profile.followed_genes.splice(idx, 1);
      saveProfileDraft();
      renderOverview();
      renderGenes();
    },

    toggleMethod: function (mName) {
      state.profile.followed_methods = state.profile.followed_methods || [];
      var idx = state.profile.followed_methods.findIndex(function(m){return m.name === mName;});
      if (idx >= 0) {
        state.profile.followed_methods.splice(idx, 1);
      } else {
        state.profile.followed_methods.push({
          name: mName,
          category: 'experimental',
          priority: 'high',
          weight: 1.5
        });
      }
      saveProfileDraft();
      renderOverview();
      renderMethods();
    },

    sendFeedback: function (articleId, type) {
      var fb = {};
      try { fb = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '{}'); } catch(e){}
      fb[articleId] = fb[articleId] || {};
      fb[articleId][type] = !fb[articleId][type];
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(fb));

      if (window.GenomeLibrary) {
        var art = (state.articles || []).find(function(a){return a.id === articleId;});
        if (art) {
          try {
            if (type === 'starred') {
              window.GenomeLibrary.update(art, function(rec) {
                rec.starred = !rec.starred;
              });
            } else if (type === 'read') {
              window.GenomeLibrary.update(art, function(rec) {
                rec.status = (rec.status === 'read' ? 'unread' : 'read');
              });
            }
          } catch(e) {
            console.warn('GenomeLibrary.update 出错:', e);
          }
        }
      }

      renderRecommendations();
    },

    syncProfile: async function () {
      var btn = $('btn-sync-profile');
      btn.textContent = '正在同步...';
      btn.disabled = true;

      // 更新本地时间与版本
      state.profile.updated_at = new Date().toISOString();
      state.profile.profile_version = 'v3.1.' + Math.floor(Date.now() / 1000).toString().slice(-4);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(state.profile));

      var localHash = await computeProfileSha256(state.profile);

      var githubToken = localStorage.getItem('gr_sync_github_token');
      var localEndpoint = localStorage.getItem('gr_sync_endpoint') || 'http://127.0.0.1:8765/api/profile';

      var synced = false;
      var errMsg = '';

      // 1. 尝试本地流水线同步服务
      try {
        var localResp = await fetch(localEndpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state.profile)
        });
        if (localResp.ok) {
          var remoteData = await localResp.json();
          var remoteHash = remoteData.sha256 || (remoteData.profile ? await computeProfileSha256(remoteData.profile) : '');
          if (localHash === remoteHash || areProfilesEquivalent(state.profile, remoteData.profile)) {
            synced = true;
            state.isDirty = false;
            if (remoteData.profile) state.profile = remoteData.profile;
          } else {
            throw new Error('本地服务返回配置指纹与本地提交不一致');
          }
        }
      } catch (localErr) {
        if (localErr.message && localErr.message.includes('指纹')) {
          errMsg = localErr.message;
        }
      }

      // 2. 尝试 GitHub REST API
      if (!synced && githubToken) {
        try {
          var repoUrl = 'https://api.github.com/repos/hao1006sy-source/genome-radar-pipeline/contents/data/research-profile.json';
          var getResp = await fetch(repoUrl, {
            headers: {
              'Authorization': 'Bearer ' + githubToken,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          var sha = '';
          if (getResp.ok) {
            var getJson = await getResp.json();
            sha = getJson.sha;
          }

          var putBody = {
            message: 'chore(radar): update user research profile via web UI (' + state.profile.profile_version + ')',
            content: btoa(unescape(encodeURIComponent(JSON.stringify(state.profile, null, 2)))),
            sha: sha || undefined
          };

          var putResp = await fetch(repoUrl, {
            method: 'PUT',
            headers: {
              'Authorization': 'Bearer ' + githubToken,
              'Content-Type': 'application/json',
              'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(putBody)
          });

          if (!putResp.ok) {
            var errJson = await putResp.json();
            throw new Error(errJson.message || 'GitHub API 同步失败 (' + putResp.status + ')');
          }

          // 回读核验完整配置一致性 (基于 SHA-256 指纹比对)
          var verifyResp = await fetch(repoUrl, {
            headers: {
              'Authorization': 'Bearer ' + githubToken,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          if (verifyResp.ok) {
            var verifyJson = await verifyResp.json();
            var decoded = decodeURIComponent(escape(atob(verifyJson.content.replace(/\s/g, ''))));
            var parsed = JSON.parse(decoded);
            var remoteHash = await computeProfileSha256(parsed);

            if (localHash === remoteHash || areProfilesEquivalent(state.profile, parsed)) {
              synced = true;
              state.isDirty = false;
            } else {
              throw new Error('回读完整配置与提交配置 SHA-256 指纹不一致 (本地: ' + localHash.slice(0, 8) + ', 远程: ' + remoteHash.slice(0, 8) + ')');
            }
          } else {
            throw new Error('回读已提交配置失败 (' + verifyResp.status + ')');
          }
        } catch (ghErr) {
          errMsg = ghErr.message;
        }
      }

      btn.disabled = false;
      if (synced) {
        btn.textContent = '✓ 同步成功';
        state.profile.sync_status = {
          last_synced_at: new Date().toISOString(),
          status: 'synced',
          client_version: state.profile.profile_version,
          sha256: localHash
        };
        localStorage.setItem(PROFILE_KEY, JSON.stringify(state.profile));
        updateStatusBadge();
        renderSyncStatus();
        alert('科研画像已成功校验并同步至流水线生产配置！\n版本: ' + state.profile.profile_version + '\nSHA-256 指纹: ' + localHash.slice(0, 16));
        setTimeout(function(){ btn.textContent = '☁ 保存并同步研究画像'; }, 2500);
      } else {
        btn.textContent = '☁ 保存并同步研究画像';
        state.isDirty = true; // 确保保留未同步状态
        if (errMsg) {
          alert('同步至生产端失败：' + errMsg + '\n\n本地草稿已完整保留在浏览器中，未丢失。');
          updateStatusBadge('同步失败：' + errMsg);
        } else {
          alert('本地草稿已成功保存！\n\n当前尚未配置 GitHub 访问令牌 (PAT) 或本地同步服务，未能直接推送到生产仓库。\n建议点击右上角【配置同步凭据】以启用云端双向同步，或使用【导出画像 JSON】进行手动同步。');
          updateStatusBadge('本地草稿已保存 (未连接流水线)');
          if ($('modal-sync-credentials')) {
            $('modal-sync-credentials').classList.add('open');
          }
        }
        renderSyncStatus();
      }
    },

    exportJSON: function () {
      var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.profile, null, 2));
      var dl = document.createElement('a');
      dl.setAttribute("href", dataStr);
      dl.setAttribute("download", "research-profile.json");
      dl.click();
    },

    importJSON: function (event) {
      var file = event.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var imported = JSON.parse(e.target.result);
          if (!imported.schema_version) throw new Error('无效的研究画像配置文件');
          state.profile = imported;
          saveProfileDraft();
          renderAll();
          alert('科研画像导入成功！');
        } catch (err) {
          alert('导入失败：' + err.message);
        }
      };
      reader.readAsText(file);
    },

    resetDefault: async function () {
      if (!confirm('确定将科研画像重置为默认配置吗？本地所有自定义设置将被覆盖。')) return;
      localStorage.removeItem(PROFILE_KEY);
      var res = await fetch('assets/data/research-profile.json');
      state.profile = await res.json();
      state.isDirty = false;
      renderAll();
      alert('已重置为默认科研画像配置。');
    }
  };

  function bindEvents() {
    $('btn-sync-profile').addEventListener('click', window.GenomeRadarUI.syncProfile);
    $('btn-export-json').addEventListener('click', window.GenomeRadarUI.exportJSON);
    $('btn-import-json').addEventListener('click', function(){ $('file-import-json').click(); });
    $('file-import-json').addEventListener('change', window.GenomeRadarUI.importJSON);
    $('btn-reset-default').addEventListener('click', window.GenomeRadarUI.resetDefault);

    // Strategy slider listeners
    ['slider-core', 'slider-related', 'slider-breakthrough'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('input', function () {
        var c = parseInt($('slider-core').value, 10);
        var r = parseInt($('slider-related').value, 10);
        var b = parseInt($('slider-breakthrough').value, 10);
        var sum = c + r + b;
        if (sum === 0) sum = 1;
        state.profile.weekly_selection_strategy.core_focus_ratio = Number((c / sum).toFixed(2));
        state.profile.weekly_selection_strategy.related_focus_ratio = Number((r / sum).toFixed(2));
        state.profile.weekly_selection_strategy.breakthrough_ratio = Number((1 - (c/sum + r/sum)).toFixed(2));
        $('val-core').textContent = Math.round(state.profile.weekly_selection_strategy.core_focus_ratio * 100) + '%';
        $('val-related').textContent = Math.round(state.profile.weekly_selection_strategy.related_focus_ratio * 100) + '%';
        $('val-breakthrough').textContent = Math.round(state.profile.weekly_selection_strategy.breakthrough_ratio * 100) + '%';
        saveProfileDraft();
      });
    });

    // Priority weight slider listeners
    ['slider-w-topic', 'slider-w-species', 'slider-w-gene', 'slider-w-method'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('input', function () {
        var wt = parseInt($('slider-w-topic').value, 10) || 0;
        var ws = parseInt($('slider-w-species').value, 10) || 0;
        var wg = parseInt($('slider-w-gene').value, 10) || 0;
        var wm = parseInt($('slider-w-method').value, 10) || 0;
        var sum = wt + ws + wg + wm;
        if (sum === 0) sum = 1;
        state.profile.priority_weights = {
          topic: Number((wt / sum).toFixed(2)),
          species: Number((ws / sum).toFixed(2)),
          gene: Number((wg / sum).toFixed(2)),
          method: Number((1 - (wt / sum + ws / sum + wg / sum)).toFixed(2))
        };
        $('val-w-topic').textContent = Math.round(state.profile.priority_weights.topic * 100) + '%';
        $('val-w-species').textContent = Math.round(state.profile.priority_weights.species * 100) + '%';
        $('val-w-gene').textContent = Math.round(state.profile.priority_weights.gene * 100) + '%';
        $('val-w-method').textContent = Math.round(state.profile.priority_weights.method * 100) + '%';
        saveProfileDraft();
      });
    });

    $('slider-relevance-weight').addEventListener('input', function(e){
      var v = parseInt(e.target.value, 10) / 100;
      state.profile.weekly_selection_strategy.personal_relevance_weight = v;
      state.profile.weekly_selection_strategy.academic_quality_weight = Number((1 - v).toFixed(2));
      $('val-relevance-weight').textContent = Math.round(v * 100) + '%';
      saveProfileDraft();
    });

    // Sync Credentials Modal
    if ($('btn-config-credentials')) {
      $('btn-config-credentials').addEventListener('click', function(){
        $('input-github-token').value = localStorage.getItem('gr_sync_github_token') || '';
        $('input-sync-endpoint').value = localStorage.getItem('gr_sync_endpoint') || 'http://127.0.0.1:8765/api/profile';
        $('modal-sync-credentials').classList.add('open');
      });
    }
    if ($('btn-cancel-credentials')) {
      $('btn-cancel-credentials').addEventListener('click', function(){
        $('modal-sync-credentials').classList.remove('open');
      });
    }
    if ($('btn-save-credentials')) {
      $('btn-save-credentials').addEventListener('click', function(){
        var token = $('input-github-token').value.trim();
        var ep = $('input-sync-endpoint').value.trim();
        if (token) localStorage.setItem('gr_sync_github_token', token);
        else localStorage.removeItem('gr_sync_github_token');
        if (ep) localStorage.setItem('gr_sync_endpoint', ep);
        $('modal-sync-credentials').classList.remove('open');
        alert('同步凭据保存成功！');
      });
    }

    if ($('btn-clear-credentials')) {
      $('btn-clear-credentials').addEventListener('click', function(){
        if (!confirm('确定要清除所有保存在本地的 GitHub 访问凭据与端点配置吗？')) return;
        localStorage.removeItem('gr_sync_github_token');
        localStorage.removeItem('gr_sync_endpoint');
        if ($('input-github-token')) $('input-github-token').value = '';
        if ($('input-sync-endpoint')) $('input-sync-endpoint').value = '';
        if ($('modal-sync-credentials')) $('modal-sync-credentials').classList.remove('open');
        updateStatusBadge('已安全清除凭据 (未连接流水线)');
        renderSyncStatus();
        alert('所有同步凭据已从浏览器安全移除。');
      });
    }

    // Trigger Discovery Button (Real Local and GitHub Actions workflow_dispatch State Machine)
    if ($('btn-trigger-discovery')) {
      $('btn-trigger-discovery').addEventListener('click', async function(){
        var btn = $('btn-trigger-discovery');

        if (state.isDirty) {
          var proceed = confirm('【提示】检测到本地存在未同步至生成端的修改草稿。\n\n建议点击【取消】并先点击【保存并同步研究画像】，确保外部检索和专刊使用最新配置。\n\n若您确认以生成端已生效的配置继续运行，请点击【确定】。');
          if (!proceed) return;
        }

        var reqId = 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        var triggerTimestamp = Date.now();
        var quota = parseInt($('slider-discovery-quota').value, 10) || 5;
        var githubToken = localStorage.getItem('gr_sync_github_token');
        var localEndpoint = localStorage.getItem('gr_sync_endpoint') || 'http://127.0.0.1:8765/api/profile';

        btn.disabled = true;
        btn.textContent = '⏳ 正在提交科研发现任务...';
        updateDiscoveryStatusUI('queued', '正在准备', '正在建立检索连接与任务调度...');

        // 1. 尝试本地同步服务的 /api/discovery/trigger 端点
        var triggeredLocally = false;
        try {
          var localDiscoveryUrl = localEndpoint.replace(/\/profile\/?$/, '/discovery/trigger');
          var dResp = await fetch(localDiscoveryUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ request_id: reqId, quota: quota, profile: state.profile })
          });
          if (dResp.ok) {
            triggeredLocally = true;
            var targetSuppUrl = 'personal-supplement/index.html';
            try {
              var sResp = await fetch('assets/data/supplement-index.json?_t=' + Date.now());
              if (sResp.ok) {
                var sData = await sResp.json();
                var supps = sData.supplements || [];
                var matchedSupp = supps.find(function(s){ return s.request_id === reqId; }) || supps[0];
                if (matchedSupp && matchedSupp.url) targetSuppUrl = matchedSupp.url;
              }
            } catch(e) {}

            updateDiscoveryStatusUI('completed', '✓ 本地任务已完成', '已通过本地流水线服务完成检索与专刊生成！', '<a href="' + targetSuppUrl + '" target="_blank" style="color:#15803d;font-weight:700;">查看最新科研专刊 ➔</a>');
            await renderSupplements();
            await renderCostStats();
            btn.disabled = false;
            btn.textContent = '🔍 发现高相关历史文献并生成专刊';
            return;
          }
        } catch(e) {}

        // 2. 尝试云端 GitHub Actions workflow_dispatch
        if (githubToken) {
          try {
            updateDiscoveryStatusUI('queued', '正在触发云端工作流', '向私有流水线提交 workflow_dispatch 调度请求 (Request ID: ' + reqId + ')...');
            var dispatchUrl = 'https://api.github.com/repos/hao1006sy-source/genome-radar-pipeline/actions/workflows/discovery.yml/dispatches';
            var dispResp = await fetch(dispatchUrl, {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + githubToken,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                ref: 'main',
                inputs: {
                  request_id: reqId,
                  quota: String(quota),
                  profile_version: state.profile.profile_version || 'v3.1.0',
                  publish: 'true'
                }
              })
            });

            if (!dispResp.ok) {
              var errJson = await dispResp.json();
              throw new Error(errJson.message || 'HTTP ' + dispResp.status);
            }

            // 循环轮询匹配本次调度生成的真实工作流实例 (过滤 created_at >= triggerTimestamp - 5000)
            updateDiscoveryStatusUI('queued', '工作流已排队 (Queued)', '已提交调度请求，正在精准关联对应的运行实例...');
            var matchedRun = null;
            for (var attempt = 0; attempt < 8; attempt++) {
              await new Promise(function(resolve){ setTimeout(resolve, 2000); });
              var runsUrl = 'https://api.github.com/repos/hao1006sy-source/genome-radar-pipeline/actions/workflows/discovery.yml/runs?event=workflow_dispatch&per_page=5';
              var runsResp = await fetch(runsUrl, {
                headers: {
                  'Authorization': 'Bearer ' + githubToken,
                  'Accept': 'application/vnd.github.v3+json'
                }
              });
              if (runsResp.ok) {
                var runsData = await runsResp.json();
                var runs = runsData.workflow_runs || [];
                matchedRun = runs.find(function(r) {
                  return new Date(r.created_at).getTime() >= (triggerTimestamp - 5000);
                });
                if (matchedRun) break;
              }
            }

            if (matchedRun) {
              var runId = matchedRun.id;
              localStorage.setItem(ACTIVE_DISCOVERY_KEY, JSON.stringify({
                run_id: runId,
                request_id: reqId,
                started_at: triggerTimestamp,
                quota: quota,
                profile_version: state.profile.profile_version
              }));
              var linkHtml = '<a href="' + matchedRun.html_url + '" target="_blank" style="color:#0284c7;text-decoration:none;">查看 GitHub Actions 实时运行日志 (Run #' + runId + ')</a>';
              updateDiscoveryStatusUI('in_progress', '云端流水线运行中', '已进入实时运行状态机：检索学术数据库 ➔ 核验初筛 ➔ DeepSeek解读 ➔ 发布专刊', linkHtml);

              if (discoveryPollTimer) clearInterval(discoveryPollTimer);
              discoveryPollTimer = setInterval(function(){
                pollDiscoveryRun(runId, githubToken, reqId);
              }, 5000);
              return;
            }

            updateDiscoveryStatusUI('in_progress', '任务已调度', '工作流已成功派发至云端执行，请稍后刷新专刊列表。');
          } catch(ghErr) {
            updateDiscoveryStatusUI('failed', '云端触发失败', 'GitHub Actions 调度遇到问题: ' + ghErr.message);
          } finally {
            btn.disabled = false;
            btn.textContent = '🔍 发现高相关历史文献并生成专刊';
          }
          return;
        }

        // 3. 无凭据无本地服务时的友好引导
        updateDiscoveryStatusUI('failed', '未配置流水线凭据', '未检测到可用的本地同步服务或 GitHub 访问令牌 (PAT)。请点击右上角【配置同步凭据】配置细粒度 PAT。');
        btn.disabled = false;
        btn.textContent = '🔍 发现高相关历史文献并生成专刊';
        if ($('modal-sync-credentials')) $('modal-sync-credentials').classList.add('open');
      });
    }

    // Custom Species Add Modal
    $('btn-add-custom-species').addEventListener('click', function(){
      $('modal-custom-species').classList.add('open');
    });
    $('btn-cancel-species').addEventListener('click', function(){
      $('modal-custom-species').classList.remove('open');
    });
    $('btn-save-species').addEventListener('click', function(){
      var nameZh = $('form-sp-zh').value.trim();
      var nameEn = $('form-sp-en').value.trim();
      var latin = $('form-sp-latin').value.trim();
      var taxId = parseInt($('form-sp-taxid').value, 10) || null;
      var role = $('form-sp-role').value;
      var expand = $('form-sp-expand').checked;

      if (!nameZh) { alert('请输入物种中文名'); return; }
      state.profile.followed_species.push({
        name_zh: nameZh, name_en: nameEn, latin_name: latin, tax_id: taxId, role: role, expand_relatives: expand
      });
      saveProfileDraft();
      renderOverview();
      renderSpecies();
      $('modal-custom-species').classList.remove('open');
    });

    // Custom Gene Add Modal
    $('btn-add-custom-gene').addEventListener('click', function(){
      $('modal-custom-gene').classList.add('open');
    });
    $('btn-cancel-gene').addEventListener('click', function(){
      $('modal-custom-gene').classList.remove('open');
    });
    $('btn-save-gene').addEventListener('click', function(){
      var sym = $('form-gene-sym').value.trim();
      var sp = $('form-gene-sp').value.trim();
      var gid = $('form-gene-id').value.trim();
      var fam = $('form-gene-fam').value.trim();
      var anno = $('form-gene-anno').value.trim();
      var pway = $('form-gene-pway').value.trim();
      var expand = $('form-gene-homology').checked;

      if (!sym) { alert('请输入基因符号'); return; }
      state.profile.followed_genes.push({
        symbol: sym,
        species: sp || '植物',
        gene_id: gid,
        aliases: [],
        gene_family: fam,
        functional_annotation: anno,
        pathway: pway,
        db_xrefs: {},
        expand_homology: expand
      });
      saveProfileDraft();
      renderOverview();
      renderGenes();
      $('modal-custom-gene').classList.remove('open');
    });
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
