# 基因组雷达 / Genome Radar

> 面向植物科学与基因组学的中文文献周报：每周精选研究进展，帮助读者更快发现值得阅读的论文。

**在线网站：** [打开基因组雷达](https://hao1006sy-source.github.io/genome-radar-site/)
**文献搜索：** [搜索全部历史文章](https://hao1006sy-source.github.io/genome-radar-site/search.html)
**阅读指南：** [了解项目定位与选文方法](https://hao1006sy-source.github.io/genome-radar-site/about.html)

基因组雷达围绕植物、作物和比较基因组学整理近期研究论文。每期约 20 篇，提供结构化中文解读、原文入口与历史归档。网站采用静态页面，可直接浏览和分享文章链接。

## 项目能做什么

### 每周精选与主题观察

每期从当周发表的候选论文中进行主题筛选、去重与综合评分，再结合研究方向、研究类型和物种体系形成精选列表。首页和每期封面会展示本周观察、重点发现及来源期刊概览。

关注方向包括：

- 植物与作物基因组学
- 泛基因组、基因组组装与结构变异
- 遗传变异、群体遗传与性状关联
- 基因表达、调控与功能研究
- 生物信息学方法、软件工具与数据资源
- 跨物种比较与进化基因组学

每期来源随新发表研究变化。已收录论文涉及 *Genome Biology*、*The Plant Cell*、*Nature Genetics*、*Science Advances*、*The Plant Journal*、*Molecular Plant*、*Nature Plants*、*Plant Cell & Environment*、*Journal of Integrative Plant Biology* 等期刊。

### 结构化中文研究解读

文章详情页围绕四个问题组织内容：

1. **做了什么：** 研究对象、数据与方法。
2. **结论：** 主要发现及其证据。
3. **为什么值得关注：** 对领域研究、数据资源或应用的意义。
4. **未来展望：** 仍待验证的问题与可能的后续方向。

页面同时保留原始标题、期刊、发表日期、DOI、PMID、可获取的分区和影响因子信息，以及原文链接。缺失的元数据不会用推测值补齐。

### 透明的选文维度

候选论文会从六个方面进行评分，每项 10 分：

- 研究重要性
- 方法创新
- 数据与资源价值
- 结果可靠性
- 代表性
- 启发性

评分用于辅助比较。最终精选也会考虑主题覆盖、研究类型和物种体系，避免只按总分机械排序。完整说明见[项目与阅读指南](https://hao1006sy-source.github.io/genome-radar-site/about.html)。

## 浏览与检索

- **按期归档：** 浏览每周封面、重点摘要和当期来源期刊。
- **本期目录：** 按文章类别查看目录，搜索标题、期刊或主题，并从目录直接进入文章。
- **全文检索：** 搜索历史文章的中英文标题、摘要、关键词、期次、期刊、DOI 等信息。
- **筛选与排序：** 按研究方向、期刊分区和发表年份筛选；支持相关性、发表日期和期次排序。
- **文章直达：** 搜索结果链接可打开对应文章，并定位到正确页码，链接可复制和分享。
- **打印与 PDF：** 从每期页面或文章详情页使用打印入口，保存单篇解读或整期简报。

## 如何使用

1. 从[网站首页](https://hao1006sy-source.github.io/genome-radar-site/)查看最新一期和历史归档。
2. 打开每期目录，按标题或期刊浏览文章。
3. 使用[文献搜索](https://hao1006sy-source.github.io/genome-radar-site/search.html)查找历史主题、关键词或 DOI。
4. 在文章详情页查看研究解读，或点击原文链接继续阅读论文。
5. 使用“打印 / PDF”入口保存单篇或整期内容。

## 自动更新与网站发布

网站按计划在**每周日北京时间 21:30**启动新一期生成流程。系统会确定检索周期，检索并筛选论文，生成中文解读和网页文件，再检查文章数量、元数据、链接、目录与搜索索引。质量检查和费用门槛通过后，静态网站文件会同步到本仓库，并由 GitHub Pages 发布。

常规更新不需要手动创建或合并 PR。若自动检查未通过，流程会停止发布并保留当前线上版本。

最近一次完整生成 20 篇文章的模型 API 费用实测约 **¥0.106**。这是单次运行记录；实际金额会随候选文献、Token 用量、缓存命中和服务价格变化。

## 技术与数据

- 使用 HTML、CSS、JavaScript 和静态 JSON 数据。
- 通过 GitHub Pages 发布，无需运行时后端或数据库。
- 全站搜索索引在构建阶段生成，浏览器端完成检索。
- 文章详情链接使用期次页面与文章编号定位。
- 本公开仓库保存供网站访问的静态页面与资源；生成端凭据和 API 密钥不放入网页、搜索索引或公开资源。

## 当前历史归档

- [2026 年第 40 周](https://hao1006sy-source.github.io/genome-radar-site/2026-10-04/)
- [2026 年第 41 周](https://hao1006sy-source.github.io/genome-radar-site/2026-10-11/)
- [2026 年第 42 周](https://hao1006sy-source.github.io/genome-radar-site/2026-10-19/)
- [2026 年第 43 周](https://hao1006sy-source.github.io/genome-radar-site/2026-10-25/)
- [2026 年第 44 周](https://hao1006sy-source.github.io/genome-radar-site/2026-11-01/)
- [2026 年第 45 周](https://hao1006sy-source.github.io/genome-radar-site/2026-11-08/)

## 项目链接

- 🌐 [在线网站](https://hao1006sy-source.github.io/genome-radar-site/)
- 🔎 [全站文献搜索](https://hao1006sy-source.github.io/genome-radar-site/search.html)
- 📖 [关于项目 / 阅读指南](https://hao1006sy-source.github.io/genome-radar-site/about.html)
- 💻 [GitHub 仓库](https://github.com/hao1006sy-source/genome-radar-site)

文献解读用于快速了解研究内容与阅读线索，具体方法、数据和结论请以原始论文为准。欢迎通过 GitHub Issues 提交建议。
