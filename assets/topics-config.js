(function (global) {
  'use strict';

  var TOPIC_DEFINITIONS = [
    {
      id: 'assembly-annotation',
      name_zh: '基因组组装与注释',
      name_en: 'Genome Assembly & Annotation',
      badge: 'Assembly & T2T',
      description: '聚焦植物与作物染色体级、端粒到端粒（T2T）高质量基因组组装，以及编码基因、转座子（TE）与非编码 RNA 的深度结构与功能注释。',
      highlights: ['染色体级组装', 'T2T端粒到端粒', '长读长测序', '转座子注释', '单倍型分相'],
      icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="topic-icon-svg"><rect x="6" y="8" width="36" height="32" rx="4" fill="none"/><line x1="12" y1="16" x2="26" y2="16"/><line x1="12" y1="24" x2="36" y2="24"/><line x1="12" y1="32" x2="30" y2="32"/><circle cx="34" cy="16" r="2.5" fill="currentColor"/><path d="M30 36l4 4 8-8" stroke-width="2.2"/></svg>',
      matches: ['组装与注释', '基因组组装', '基因组注释', '组装', '注释', '染色体组装', 'T2T', '单倍型组装', '泛基因组与组装']
    },
    {
      id: 'pangenome',
      name_zh: '泛基因组',
      name_en: 'Pangenome & Structural Variation',
      badge: 'Pangenome Graph',
      description: '追踪物种内多品系与属内种间泛基因组构建，揭示核心基因组、可变基因组及大尺度结构变异（SV、倒位、易位）在作物驯化与适应中的作用。',
      highlights: ['图形泛基因组', '大尺度结构变异', '核心/可变基因组', '属间比较泛基因组', '转座子介导重排'],
      icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="topic-icon-svg"><circle cx="14" cy="14" r="6"/><circle cx="34" cy="14" r="6"/><circle cx="24" cy="34" r="6"/><path d="M18 18l8 12M30 18l-8 12M20 14h8"/><circle cx="24" cy="24" r="2" fill="currentColor"/></svg>',
      matches: ['泛基因组', '图基因组', '图形泛基因组', '结构变异', '泛基因组与组装', '超泛基因组']
    },
    {
      id: 'variation-gwas',
      name_zh: '遗传变异与性状关联',
      name_en: 'Genetic Variation & Trait Association',
      badge: 'GWAS & Breeding',
      description: '解析群体遗传多样性、单核苷酸多态性（SNP）、InDel 与自然变异，通过全基因组关联分析（GWAS）与连锁定位锁定农艺性状关键候选基因。',
      highlights: ['群体遗传学', 'GWAS性状关联', '自然变异定位', 'QTL克隆', '分子标记辅助育种'],
      icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="topic-icon-svg"><line x1="6" y1="40" x2="42" y2="40"/><polyline points="8,34 16,30 22,14 28,26 34,10 40,32"/><circle cx="22" cy="14" r="3" fill="#315b3e"/><circle cx="34" cy="10" r="3" fill="#315b3e"/><line x1="22" y1="17" x2="22" y2="40" stroke-dasharray="2 3"/><line x1="34" cy1="13" x2="34" y2="40" stroke-dasharray="2 3"/></svg>',
      matches: ['变异与关联', '变异', '关联', 'GWAS', '群体遗传', 'QTL', '单倍型图谱', '等位基因']
    },
    {
      id: 'evolution',
      name_zh: '进化与比较基因组学',
      name_en: 'Evolution & Comparative Genomics',
      badge: 'Phylogeny & Synteny',
      description: '探讨植物多倍化全基因组复制（WGD）、水平基因转移（HGT）、基因家族扩张收缩、系统发育树构建及跨物种同源共线性演化历程。',
      highlights: ['全基因组复制(WGD)', '系统发育分析', '共线性比对', '水平基因转移(HGT)', '亚基因组分化'],
      icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="topic-icon-svg"><path d="M8 40V12M8 24h14M8 12h28M22 24v16M22 32h14M36 12v28"/><circle cx="36" cy="40" r="3" fill="currentColor"/><circle cx="22" cy="40" r="3" fill="currentColor"/><circle cx="8" cy="40" r="3" fill="currentColor"/><circle cx="36" cy="12" r="3" fill="currentColor"/></svg>',
      matches: ['进化与比较', '进化', '比较基因组', '系统发育', '多倍化', '共线性', '物种分化', '基因家族']
    },
    {
      id: 'epigenetics',
      name_zh: '表观遗传与基因调控',
      name_en: 'Epigenetics & Gene Regulation',
      badge: 'ChIP & Methylation',
      description: '研究 DNA 甲基化、组蛋白修饰、染色质开放性（ATAC-seq/DHS）、转录因子结合与三维基因组互作对基因时空特异性表达的精细调控机制。',
      highlights: ['DNA甲基化', '组蛋白共修饰', 'ATAC-seq染色质开放', '转录因子网络', '启动子/增强子互作'],
      icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="topic-icon-svg"><path d="M12 36c4-16 8-24 12-24s8 8 12 24"/><circle cx="12" cy="36" r="4" fill="none"/><circle cx="36" cy="36" r="4" fill="none"/><circle cx="24" cy="12" r="4" fill="#315b3e"/><line x1="16" y1="28" x2="32" y2="28" stroke-dasharray="2 2"/></svg>',
      matches: ['表观与调控', '表观', '调控', '甲基化', '表观遗传', '染色质', '转录调控', '组蛋白修饰']
    },
    {
      id: 'single-cell',
      name_zh: '单细胞与空间组学',
      name_en: 'Single-Cell & Spatial Omics',
      badge: 'scRNA & Spatial',
      description: '应用单细胞 RNA 测序（scRNA-seq）与空间转录组技术解析植物组织器官异质性、细胞谱系分化轨迹与原位分子图谱。',
      highlights: ['单细胞转录组', '空间转录组原位图谱', '分化发育轨迹', '细胞类型异质性', '细胞通讯网络'],
      icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="topic-icon-svg"><circle cx="24" cy="24" r="18"/><circle cx="18" cy="20" r="5" fill="none"/><circle cx="30" cy="20" r="3.5" fill="#315b3e"/><circle cx="24" cy="32" r="4" fill="none"/><line x1="21" y1="23" x2="27" y2="21" stroke-width="1.5"/></svg>',
      matches: ['单细胞与空间', '单细胞', '空间组学', '空间转录组', '单细胞转录组', '细胞图谱', 'scRNA']
    },
    {
      id: 'methods-tools',
      name_zh: '生物信息学方法与工具',
      name_en: 'Bioinformatics Methods & Tools',
      badge: 'Algorithms & Tools',
      description: '梳理植物基因组学前沿分析软件、序列比对算法、深度学习预测模型、大规模组学数据库与生信交互分析平台的开发与实践应用。',
      highlights: ['生物信息软件', '基因组数据库', 'AI与深度学习模型', '质控与比对算法', '开源生信工作流'],
      icon: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="topic-icon-svg"><rect x="8" y="10" width="32" height="24" rx="3"/><path d="M16 38h16M24 34v4"/><polyline points="15,22 19,18 15,14"/><line x1="23" y1="24" x2="31" y2="24"/></svg>',
      matches: ['方法与工具', '方法', '工具', '生信软件', '算法', '数据库', '深度学习', '分析流程', '模型']
    }
  ];

  // 辅助映射字典
  var ID_MAP = {};
  TOPIC_DEFINITIONS.forEach(function (t) {
    ID_MAP[t.id] = t;
  });

  /**
   * 将单个方向字符串映射为匹配的专题ID数组（支持复合标签）
   */
  function mapTagToTopicIds(tag) {
    if (!tag) return [];
    var str = String(tag).trim();
    var matched = [];

    TOPIC_DEFINITIONS.forEach(function (topic) {
      for (var i = 0; i < topic.matches.length; i++) {
        var kw = topic.matches[i];
        if (str === kw || str.indexOf(kw) !== -1) {
          if (matched.indexOf(topic.id) === -1) {
            matched.push(topic.id);
          }
          break;
        }
      }
    });

    return matched;
  }

  /**
   * 提取文章所属的所有专题 ID 列表（去重）
   */
  function getTopicIdsForArticle(article) {
    if (!article) return [];
    var rawDirs = article.research_direction;
    var tags = [];
    if (Array.isArray(rawDirs)) {
      tags = rawDirs;
    } else if (typeof rawDirs === 'string') {
      tags = rawDirs.split(/[,/、;]/);
    }

    var topicIds = [];
    tags.forEach(function (tag) {
      var ids = mapTagToTopicIds(tag);
      ids.forEach(function (id) {
        if (topicIds.indexOf(id) === -1) {
          topicIds.push(id);
        }
      });
    });

    // 如果未命中任何已知标签，根据 keywords 兜底匹配
    if (topicIds.length === 0 && Array.isArray(article.keywords)) {
      article.keywords.forEach(function (kw) {
        var ids = mapTagToTopicIds(kw);
        ids.forEach(function (id) {
          if (topicIds.indexOf(id) === -1) {
            topicIds.push(id);
          }
        });
      });
    }

    // 如果依然未命中，统一归入 'methods-tools' 作为诊断/通用归档，确保覆盖率 100%
    if (topicIds.length === 0) {
      topicIds.push('methods-tools');
    }

    return topicIds;
  }

  /**
   * 获取指定专题元信息
   */
  function getTopicById(id) {
    return ID_MAP[id] || null;
  }

  /**
   * 对整库文献按专题聚合统计
   */
  function aggregateTopics(articles) {
    var list = Array.isArray(articles) ? articles : [];
    
    // 寻找最新期次
    var latestIssue = '';
    list.forEach(function (a) {
      if (a.issue && (!latestIssue || a.issue > latestIssue)) {
        latestIssue = a.issue;
      }
    });

    var result = {};
    TOPIC_DEFINITIONS.forEach(function (t) {
      result[t.id] = {
        meta: t,
        articles: [],
        seenDoi: {},
        latestNewCount: 0,
        journals: {},
        years: {},
        categories: {},
        issues: {},
        keywords: {}
      };
    });

    list.forEach(function (a) {
      var assignedTopicIds = getTopicIdsForArticle(a);
      var articleKey = a.doi || a.id;

      assignedTopicIds.forEach(function (tid) {
        var group = result[tid];
        if (!group) return;

        // 同一专题内部按 DOI / ID 去重
        if (group.seenDoi[articleKey]) return;
        group.seenDoi[articleKey] = true;
        group.articles.push(a);

        // 统计当期新增
        if (a.issue && a.issue === latestIssue) {
          group.latestNewCount++;
        }

        // 期刊频次
        if (a.journal) {
          group.journals[a.journal] = (group.journals[a.journal] || 0) + 1;
        }

        // 年份
        var year = (a.publication_date || '').slice(0, 4) || (a.issue || '').slice(0, 4);
        if (year) {
          group.years[year] = (group.years[year] || 0) + 1;
        }

        // 期次
        if (a.issue) {
          group.issues[a.issue] = (group.issues[a.issue] || 0) + 1;
        }

        // 类别
        if (a.category) {
          group.categories[a.category] = (group.categories[a.category] || 0) + 1;
        }

        // 关键词
        if (Array.isArray(a.keywords)) {
          a.keywords.forEach(function (kw) {
            var k = String(kw).trim();
            if (k) group.keywords[k] = (group.keywords[k] || 0) + 1;
          });
        }
      });
    });

    // 排序文献（默认按期次降序，期次相同按编号升序）
    Object.keys(result).forEach(function (tid) {
      result[tid].articles.sort(function (x, y) {
        var ix = x.issue || '', iy = y.issue || '';
        if (ix !== iy) return iy.localeCompare(ix);
        return (x.article_number || 0) - (y.article_number || 0);
      });
    });

    return {
      latestIssue: latestIssue,
      topics: result
    };
  }

  var GenomeRadarTopics = {
    DEFINITIONS: TOPIC_DEFINITIONS,
    getTopicById: getTopicById,
    mapTagToTopicIds: mapTagToTopicIds,
    getTopicIdsForArticle: getTopicIdsForArticle,
    aggregateTopics: aggregateTopics
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GenomeRadarTopics;
  } else {
    global.GenomeRadarTopics = GenomeRadarTopics;
  }
})(typeof window !== 'undefined' ? window : this);
