# Genome Radar V2.2.2 学术数据收尾修复最终报告

> 本报告全部统计数据均由仓库实际数据文件自动生成。

## 1. 核心数据资产核查
- 文献分类数据（`assets/articles-classified.json`）：共 **160** 篇，版本分布：`{'v2.2.2': 160}`
- 分类体系（`assets/topics-taxonomy.json`）：版本 `2.2.1`，一级专题 **9** 个，二级专题 **61** 个
- 学科发展史里程碑（`assets/topic-milestones.json`）：共 **34** 条
- 多标签归档覆盖（`secondary_topics` 非空）：**96/160** (60.0%)
- 审核状态分布：`verified` **138** 篇，`needs_review` **22** 篇
- 研究方法证据覆盖（`research_methods_evidence`）：**160/160** (100.0%)

## 2. 九大一级专题分布（实际统计）
| 一级专题 ID | 中文名称 | 文献数 |
|---|---|---|
| `assembly-annotation` | 基因组组装与注释 | 11 |
| `pangenome` | 泛基因组 | 8 |
| `variation-gwas` | 遗传变异与性状关联 | 11 |
| `evolution` | 进化与比较基因组学 | 14 |
| `epigenetics` | 表观遗传与基因调控 | 12 |
| `single-cell` | 单细胞与空间组学 | 12 |
| `methods-tools` | 生物信息学方法与工具 | 9 |
| `functional-genomics` | 植物功能基因组学 | 61 |
| `genome-editing-breeding` | 基因组编辑与分子育种 | 22 |

## 3. 里程碑关键修复核查（基于稳定事件 ID 精确定位）
- **MCScanX (`MS-EVO-2008-MCSCAN`)**：年份 `2012`，在线发表日期 `2012-01-04`，正式出版日期 `2012-04-01`，DOI `10.1093/nar/gkr1293`，标题 `MCScanX: a toolkit for detection and evolutionary analysis of gene synteny and collinearity`
- **HPRC (`MS-PAN-2023-HPRC`)**：significance 为「相比基于 GRCh38 的分析工作流，小变异发现错误减少 34%，每个单倍型检出的结构变异数量增加 104%。」
- **PE 2019 (`MS-EDT-2019-PE-ORIGIN`)**：`review_status=verified`，已补充 `url` 与 `evidence`

## 4. 固定回归测试集与流水线集成结果
- **60 篇固定回归测试集（`test_regression_60.py`，合并原 40 篇与 20 篇基准样本，用于验证分类规则回归稳定性）**：
  - 物种识别：60/60 (100.0%)
  - 一级专题：60/60 (100.0%)
  - 二级专题：60/60 (100.0%)
  - 研究方法：60/60 (100.0%)
- **浏览器 E2E 回归测试（`test_topics_e2e_v2_2.py`）**：
  - 9 大专题门户、详情页、收敛性核查、代表性文献像素级直达跳转 100% 通过
- **流水线集成**：`genome-radar-pipeline/radar/search.py` 已接入 `semantic_classify_article` 自动分类。
