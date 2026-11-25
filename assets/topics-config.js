/**
 * Genome Radar (基因组雷达) - 研究专题与学术分类体系配置 V2.2
 * 包含：9大一级专题、65个细分二级专题、学术定义、纳入与排除标准、主题矢量图标及映射函数
 */

(function (global) {
  'use strict';

  var TAXONOMY_VERSION = '2.2.0';

  var TOPICS = [
    {
        "id": "assembly-annotation",
        "aliases": [
            "assembly",
            "组装与注释"
        ],
        "name_zh": "基因组组装与注释",
        "name_en": "Genome Assembly & Annotation",
        "definition": "利用长读长测序、光学图谱与染色质三维构象等技术，构建染色体级乃至端粒到端粒 (T2T) 的完整基因组序列，并完成编码区与非编码调控元件的高精结构与功能注释。",
        "inclusion_criteria": "以基因组组装构建、序列纠错与填洞、端粒着丝粒解析、多倍体单倍型分型、全基因组结构/功能/重复序列注释为主要成果的论文。",
        "exclusion_criteria": "仅将已发表基因组作为参考序列进行常规短读长回帖比对或仅进行重测序 GWAS 分析的论文；纯软件算法论文若主要用于组装则主归此专题或方法工具。",
        "subtopics": [
            {
                "id": "t2t-telomere-centromere",
                "name_zh": "端粒到端粒 (T2T) 与复杂着丝粒组装",
                "name_en": "T2T & Centromere Assembly"
            },
            {
                "id": "polyploid-haplotype",
                "name_zh": "多倍体分型与单倍型精细组装",
                "name_en": "Polyploid & Haplotype-phased Assembly"
            },
            {
                "id": "long-read-sequencing",
                "name_zh": "长读长测序与杂交组装策略",
                "name_en": "Long-read & Hybrid Assembly Strategies"
            },
            {
                "id": "structural-annotation",
                "name_zh": "基因结构与高精转录本注释",
                "name_en": "Gene Structure & Transcript Annotation"
            },
            {
                "id": "repeats-transposons",
                "name_zh": "重复序列与转座子注释解析",
                "name_en": "Repeat & Transposable Element Annotation"
            },
            {
                "id": "organelle-genomes",
                "name_zh": "质体与线粒体细胞器基因组",
                "name_en": "Plastid & Organelle Genomes"
            },
            {
                "id": "metagenome-assembly",
                "name_zh": "环境微生物组与共生体基因组组装",
                "name_en": "Metagenomic & Endophyte Assembly"
            }
        ],
        "color": "#2e6b47",
        "bg_light": "#edf4ee",
        "tag": "组装与注释",
        "icon_svg": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 6h16M4 12h16M4 18h16\"/><circle cx=\"8\" cy=\"6\" r=\"2\" fill=\"currentColor\"/><circle cx=\"16\" cy=\"12\" r=\"2\" fill=\"currentColor\"/><circle cx=\"10\" cy=\"18\" r=\"2\" fill=\"currentColor\"/></svg>"
    },
    {
        "id": "pangenome",
        "aliases": [
            "pangenome",
            "泛基因组"
        ],
        "name_zh": "泛基因组",
        "name_en": "Pangenomics",
        "definition": "超越单一线性参考基因组局限，通过群体水平的多基因组组装与图基因组构建，全面捕获物种内及近缘种间的核心基因组、可变基因组及大规模结构变异多样性。",
        "inclusion_criteria": "构建物种或属级多基因组比对、变异图谱 (Variation Graph)、核心/非必需基因组划分、泛基因家族演化及结构变异全景解析的论文。",
        "exclusion_criteria": "仅包含 1-2 个材料的常规基因组组装；仅基于低深度重测序 SNP 呼叫而不涉及大尺度结构变异或图基因组的常规群体研究。",
        "subtopics": [
            {
                "id": "graph-pangenome",
                "name_zh": "图基因组建模与泛基因组算法",
                "name_en": "Graph Pangenome Modeling & Algorithms"
            },
            {
                "id": "core-dispensable-genome",
                "name_zh": "核心基因组与可变基因组解析",
                "name_en": "Core & Dispensable Genome Analysis"
            },
            {
                "id": "structural-variation-pan",
                "name_zh": "泛基因组结构变异全景",
                "name_en": "Pan-genomic Structural Variations"
            },
            {
                "id": "crop-wild-pangenome",
                "name_zh": "作物驯化与野生种泛基因组",
                "name_en": "Crop Domestication & Wild Relatives Pangenome"
            },
            {
                "id": "pan-annotation-family",
                "name_zh": "基因家族扩张收缩与泛注释",
                "name_en": "Pan-annotation & Gene Family Dynamics"
            },
            {
                "id": "super-pangenome",
                "name_zh": "跨属跨物种超级泛基因组",
                "name_en": "Super-pangenomics & Cross-species Graphs"
            }
        ],
        "color": "#1a5944",
        "bg_light": "#ebf4f0",
        "tag": "泛基因组",
        "icon_svg": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"5\" r=\"3\"/><circle cx=\"5\" cy=\"19\" r=\"3\"/><circle cx=\"19\" cy=\"19\" r=\"3\"/><path d=\"M12 8v4m-4.5 4.5L10 14m4 0 2.5 2.5M10 14h4\"/></svg>"
    },
    {
        "id": "variation-gwas",
        "aliases": [
            "variation",
            "变异与关联",
            "遗传变异与性状关联"
        ],
        "name_zh": "遗传变异与性状关联",
        "name_en": "Genetic Variation & Trait Association",
        "definition": "系统鉴定基因组自然与诱变遗传变异（SNP、InDel、SV、CNV），结合表型组学与统计遗传学模型（GWAS、连锁 QTL、单倍型分析），解析复杂农艺与适应性性状的群体遗传构型与连锁不平衡演化。",
        "inclusion_criteria": "以全基因组重测序群体变异调查、全基因组关联分析 (GWAS)、双亲高密度 QTL 定位、大尺度染色体结构变异性状关联、单倍型块结构与上位性分析为核心成果的论文。",
        "exclusion_criteria": "未定位具体遗传变异或缺乏群体遗传关联的单一基因分子生化功能验证（归入植物功能基因组学）；纯基因编辑技术开发或分子设计育种实证（归入基因组编辑与分子育种）。",
        "subtopics": [
            {
                "id": "gwas-trait-mapping",
                "name_zh": "全基因组关联分析与变异定位",
                "name_en": "GWAS & Trait Mapping"
            },
            {
                "id": "qtl-linkage-mapping",
                "name_zh": "双亲连锁群体与 QTL 精细定位",
                "name_en": "Biparental QTL Linkage Mapping"
            },
            {
                "id": "fine-mapping-causal",
                "name_zh": "候选区间精细定位与因果变异鉴定",
                "name_en": "Fine Mapping & Causal Variant Identification"
            },
            {
                "id": "structural-variation-impact",
                "name_zh": "大尺度结构变异 (SV/CNV) 与农艺性状",
                "name_en": "Structural Variation & Agronomic Traits"
            },
            {
                "id": "haplotype-linkage-disequilibrium",
                "name_zh": "单倍型块结构与连锁不平衡分析",
                "name_en": "Haplotype Block & Linkage Disequilibrium"
            },
            {
                "id": "population-genomics-diversity",
                "name_zh": "群体等位基因多样性与选择清除",
                "name_en": "Population Diversity & Selective Sweeps"
            }
        ],
        "color": "#b0611c",
        "bg_light": "#fdf3ea",
        "tag": "变异与关联",
        "icon_svg": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 20h18M6 16l4-8 4 6 5-10\"/><circle cx=\"6\" cy=\"16\" r=\"1.5\" fill=\"currentColor\"/><circle cx=\"10\" cy=\"8\" r=\"1.5\" fill=\"currentColor\"/><circle cx=\"14\" cy=\"14\" r=\"1.5\" fill=\"currentColor\"/><circle cx=\"19\" cy=\"4\" r=\"1.5\" fill=\"currentColor\"/></svg>"
    },
    {
        "id": "evolution",
        "aliases": [
            "evolution",
            "进化与比较",
            "进化与比较基因组学"
        ],
        "name_zh": "进化与比较基因组学",
        "name_en": "Evolutionary & Comparative Genomics",
        "definition": "通过多物种基因组共线性比对与系统发育分析，探究全基因组复制 (WGD)、物种形成与辐射分化、古老杂交渗入、水平基因转移以及自然选择与人工驯化的分子印记。",
        "inclusion_criteria": "以系统发育重建、古多倍化与亚基因组不对称进化、染色体进化断裂融合、跨物种适应性演化、基因家族分子演化为主要学术创新的研究。",
        "exclusion_criteria": "单一品种内部且无进化对比的常规定位研究；无基因组比较支撑的纯形态学分类。",
        "subtopics": [
            {
                "id": "polyploidy-wgd",
                "name_zh": "全基因组复制 (WGD) 与多倍化进化",
                "name_en": "Whole Genome Duplication & Polyploid Evolution"
            },
            {
                "id": "phylogenomics",
                "name_zh": "系统发育基因组学与物种定年",
                "name_en": "Phylogenomics & Species Tree Reconstruction"
            },
            {
                "id": "synteny-collinearity",
                "name_zh": "染色体进化与共线性断裂重排",
                "name_en": "Chromosome Evolution, Synteny & Karyotype Dynamics"
            },
            {
                "id": "domestication-adaptation",
                "name_zh": "驯化选择历史与环境适应性进化",
                "name_en": "Domestication History & Adaptive Evolution"
            },
            {
                "id": "hybridization-introgression",
                "name_zh": "古老杂交渗入与网状进化",
                "name_en": "Hybridization, Introgression & Reticulate Evolution"
            },
            {
                "id": "horizontal-gene-transfer",
                "name_zh": "水平基因转移与外源基因流动",
                "name_en": "Horizontal Gene Transfer & Alien Chromosome Introgressions"
            },
            {
                "id": "sex-chromosome-evolution",
                "name_zh": "性染色体与性别决定演化",
                "name_en": "Sex Chromosome & Sex-determination Evolution"
            }
        ],
        "color": "#634832",
        "bg_light": "#f7f1ec",
        "tag": "进化与比较",
        "icon_svg": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 2v20M4 10l8-8 8 8M4 18l8-4 8 4\"/></svg>"
    },
    {
        "id": "epigenetics",
        "aliases": [
            "epigenetics",
            "表观与调控",
            "表观遗传与基因调控"
        ],
        "name_zh": "表观遗传与基因调控",
        "name_en": "Epigenetics & Gene Regulation",
        "definition": "在不改变 DNA 序列前提下，研究 DNA 甲基化、组蛋白化学修饰、染色质开放性 (ATAC-seq)、三维染色质高级构象 (Hi-C) 以及非编码 RNA 对基因表达的精密调控机制。",
        "inclusion_criteria": "探究表观修饰动态、转录因子结合与顺式调控元件 (cCREs)、启动子-增强子远距离环化交互、基因组印记及转座子表观沉默的论文。",
        "exclusion_criteria": "常规转录组测序差异表达分析（若未涉及具体转录调控机制或表观修饰）；单纯的组织表达谱描述。",
        "subtopics": [
            {
                "id": "dna-methylation",
                "name_zh": "DNA 胞嘧啶甲基化模式与动态",
                "name_en": "DNA Methylation & Demethylation Dynamics"
            },
            {
                "id": "histone-modification",
                "name_zh": "组蛋白修饰与染色质状态",
                "name_en": "Histone Modifications & Chromatin Signatures"
            },
            {
                "id": "chromatin-accessibility",
                "name_zh": "染色质开放性与转录因子顺式调控",
                "name_en": "Chromatin Accessibility & Cis-Regulatory Elements"
            },
            {
                "id": "3d-genome-topology",
                "name_zh": "三维基因组结构与染色质环拓扑",
                "name_en": "3D Genome Architecture & Chromatin Loops"
            },
            {
                "id": "non-coding-rna",
                "name_zh": "非编码 RNA 与转录后调控",
                "name_en": "Non-coding RNAs & Post-transcriptional Regulation"
            },
            {
                "id": "epigenetic-inheritance",
                "name_zh": "环境诱导表观变异与跨代遗传",
                "name_en": "Environmental Epigenomics & Transgenerational Inheritance"
            }
        ],
        "color": "#5b4a70",
        "bg_light": "#f4eff8",
        "tag": "表观与调控",
        "icon_svg": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 21l7.03-3.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z\"/><path d=\"M12 7v10M8 12h8\"/></svg>"
    },
    {
        "id": "single-cell",
        "aliases": [
            "single-cell",
            "单细胞与空间",
            "单细胞与空间组学"
        ],
        "name_zh": "单细胞与空间组学",
        "name_en": "Single-cell & Spatial Omics",
        "definition": "运用单细胞 RNA 测序 (scRNA-seq)、单细胞表观组 (scATAC-seq) 及高分辨率空间原位转录组技术，在单细胞与组织原位尺度解析细胞异质性、细胞谱系分化轨迹与细胞微环境互作。",
        "inclusion_criteria": "以植物根尖、茎尖、叶肉、生殖器官或维管束等的单细胞图谱绘制、细胞异质性解析、细胞轨迹分化及组织原位空间微环境研究为核心的研究。",
        "exclusion_criteria": "传统大块组织 (Bulk) 混合测序研究；未在单细胞分辨率展开的常规分子实验。",
        "subtopics": [
            {
                "id": "single-cell-transcriptomics",
                "name_zh": "植物单细胞 RNA 测序与细胞异质性",
                "name_en": "Single-cell RNA-seq & Cell Type Diversity"
            },
            {
                "id": "spatial-transcriptomics",
                "name_zh": "空间转录组学与组织微环境原位图谱",
                "name_en": "Spatial Transcriptomics & In Situ Tissue Microenvironment"
            },
            {
                "id": "single-cell-epigenomics",
                "name_zh": "单细胞染色质开放性与表观异质性",
                "name_en": "Single-cell Epigenomics & scATAC-seq"
            },
            {
                "id": "cell-lineage-differentiation",
                "name_zh": "细胞分化发育轨迹与拟时序分析",
                "name_en": "Cell Trajectory & Pseudotime Differentiation"
            },
            {
                "id": "spatiotemporal-atlas",
                "name_zh": "器官发生与逆境响应时空图谱",
                "name_en": "Organogenesis & Stress Spatiotemporal Atlases"
            }
        ],
        "color": "#206371",
        "bg_light": "#e8f4f7",
        "tag": "单细胞与空间",
        "icon_svg": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"3\"/><circle cx=\"6\" cy=\"7\" r=\"2\"/><circle cx=\"18\" cy=\"7\" r=\"2\"/><circle cx=\"5\" cy=\"16\" r=\"2\"/><circle cx=\"19\" cy=\"16\" r=\"2\"/><path d=\"m8 8 2.5 2.5m3 0L16 8m-2.5 5.5L16 16m-5.5-2.5L8 16\"/></svg>"
    },
    {
        "id": "methods-tools",
        "aliases": [
            "methods",
            "方法与工具",
            "生物信息学方法与工具"
        ],
        "name_zh": "生物信息学方法与工具",
        "name_en": "Bioinformatics Methods & Tools",
        "definition": "研发面向高通量基因组与多组学数据的原创算法、计算软件、基准评测数据集、人工智能生物大模型以及端到端自动化分析工作流。",
        "inclusion_criteria": "核心学术贡献为新软件、新算法、统计模型、可独立运行的分析流水线、基准测试评测 (Benchmarking) 或开源计算平台的论文。",
        "exclusion_criteria": "严禁将仅仅使用既有公开软件分析生物学数据的应用型实证论文归入此专题；仅包含常规生信脚本而无软件工程封装与学术创新的论文排除。",
        "subtopics": [
            {
                "id": "assembly-polishing-tools",
                "name_zh": "组装、分型与抛光纠错算法",
                "name_en": "Assembly, Phasing & Polishing Algorithms"
            },
            {
                "id": "variant-calling-benchmarking",
                "name_zh": "变异检测算法、基准评测与质控",
                "name_en": "Variant Calling & Benchmarking"
            },
            {
                "id": "graph-algorithms-tools",
                "name_zh": "变异图谱构建与图基因组工具集",
                "name_en": "Graph Genomes & Pangenome Software"
            },
            {
                "id": "deep-learning-ai-biology",
                "name_zh": "深度学习与生成式生物学大模型",
                "name_en": "Deep Learning & Biological AI Models"
            },
            {
                "id": "multi-omics-integration",
                "name_zh": "多组学数据整合与可视化平台",
                "name_en": "Multi-omics Integration & Interactive Visual Tools"
            },
            {
                "id": "workflow-pipeline-reproducibility",
                "name_zh": "高通量分析工作流与可重复计算框架",
                "name_en": "Pipelines & Reproducible Computational Frameworks"
            },
            {
                "id": "statistical-genetics-algorithms",
                "name_zh": "统计遗传学算法",
                "name_en": "Statistical Genetics Algorithms"
            },
            {
                "id": "sequence-alignment-search",
                "name_zh": "序列比对与相似性搜索算法",
                "name_en": "Sequence Alignment & Similarity Search Algorithms"
            },
            {
                "id": "bioinformatics-databases",
                "name_zh": "生物信息学数据库与知识资源",
                "name_en": "Bioinformatics Databases & Knowledge Resources"
            }
        ],
        "color": "#3f5368",
        "bg_light": "#edf2f7",
        "tag": "方法与工具",
        "icon_svg": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z\"/></svg>"
    },
    {
        "id": "functional-genomics",
        "aliases": [
            "functional",
            "功能基因组学",
            "植物功能基因组学"
        ],
        "name_zh": "植物功能基因组学",
        "name_en": "Plant Functional Genomics",
        "definition": "从全基因组尺度深入探究植物基因时空转录表达、转录后调控与生物生化功能，解析抗逆应激、生长发育、特征次生代谢与植物-微生物互作的分子调控网络与生化机制。",
        "inclusion_criteria": "以植物基因功能鉴定与验证、时空转录组与全长表达图谱、非生物抗逆（旱/寒/盐/热）与免疫应答通路、器官形态建成发育、特征代谢物合成生物学解析、根际微生态与共生互作为核心科学发现的研究。",
        "exclusion_criteria": "仅涉及全基因组从头序列拼接而不涉及功能深入探索的研究；纯粹的群体等位基因频率统计或纯 GWAS 统计分析（归入变异与关联）；以基因组编辑工具创新为主要贡献的论文（归入基因编辑与育种）。",
        "subtopics": [
            {
                "id": "gene-function-validation",
                "name_zh": "关键农艺基因功能鉴定与生化验证",
                "name_en": "Gene Function Characterization & Validation"
            },
            {
                "id": "stress-immunity-mechanisms",
                "name_zh": "非生物抗逆与抗病免疫分子网络",
                "name_en": "Abiotic Stress & Plant Immunity Mechanisms"
            },
            {
                "id": "plant-developmental-genomics",
                "name_zh": "器官形态建成与发育时相调控",
                "name_en": "Organogenesis & Developmental Genomics"
            },
            {
                "id": "metabolic-pathways-metabolomics",
                "name_zh": "特征代谢通路重构与代谢组学",
                "name_en": "Metabolic Pathway & Metabolomics"
            },
            {
                "id": "transcriptome-expression-atlas",
                "name_zh": "时空动态表达图谱与全长转录本",
                "name_en": "Spatiotemporal Transcriptome & Isoform Atlas"
            },
            {
                "id": "plant-microbe-interactions",
                "name_zh": "根际微生态与植物-微生物互作",
                "name_en": "Plant-Microbe Interactions & Rhizobiome"
            },
            {
                "id": "multi-omics-mechanisms",
                "name_zh": "跨层次多组学整合与系统生物学机制",
                "name_en": "Multi-omics Integration & System Mechanisms"
            }
        ],
        "color": "#0a6c74",
        "bg_light": "#e6f4f5",
        "tag": "植物功能基因组学",
        "icon_svg": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6\"/><circle cx=\"12\" cy=\"12\" r=\"2\" fill=\"currentColor\"/></svg>"
    },
    {
        "id": "genome-editing-breeding",
        "aliases": [
            "breeding",
            "editing",
            "基因组编辑与分子育种",
            "基因编辑与育种"
        ],
        "name_zh": "基因组编辑与分子育种",
        "name_en": "Genome Editing & Molecular Breeding",
        "definition": "聚焦 CRISPR/Cas 基因组定向编辑、单碱基编辑、先导编辑及组织培养转化等前沿生物工程技术，结合全基因组选择 (GS) 与分子设计模型，加速创制优异等位基因与突破性农作物新种质。",
        "inclusion_criteria": "以植物 CRISPR/Cas 靶向编辑、碱基编辑系统优化、先导编辑 (Prime Editing) 效率提升、多位点高通量基因编辑、无愈伤直接再生与高效遗传转化技术建立、全基因组选择模型构建与分子设计育种实证为主要成果的论文。",
        "exclusion_criteria": "仅将标准商品化 CRISPR 试剂作为常规生物学辅助手段用于已知基因敲除且核心发现为基础生物学机制的论文（归入植物功能基因组学）；纯测序数据统计且无分子育种应用导向的研究。",
        "subtopics": [
            {
                "id": "crispr-cas-systems",
                "name_zh": "CRISPR/Cas 编辑系统优化与分子改造",
                "name_en": "CRISPR/Cas System Optimization"
            },
            {
                "id": "prime-editing",
                "name_zh": "先导编辑 (Prime Editing) 系统与效率优化",
                "name_en": "Plant Prime Editing Technologies"
            },
            {
                "id": "base-editing",
                "name_zh": "胞嘧啶/腺嘌呤单碱基精准编辑系统",
                "name_en": "Cytidine & Adenine Base Editing"
            },
            {
                "id": "multiplex-gene-editing",
                "name_zh": "多靶点超高通量基因协同编辑",
                "name_en": "Multiplex & High-throughput Gene Editing"
            },
            {
                "id": "transformation-regeneration",
                "name_zh": "高效离体组织培养、转化与再生技术",
                "name_en": "Plant Transformation & Direct Regeneration"
            },
            {
                "id": "genomic-selection",
                "name_zh": "全基因组选择 (GS) 与多组学预测模型",
                "name_en": "Genomic Selection & Omics Prediction"
            },
            {
                "id": "elite-allele-creation",
                "name_zh": "优异人工等位基因创制与驯化改良",
                "name_en": "Elite Allele Creation & De Novo Domestication"
            },
            {
                "id": "molecular-design-breeding",
                "name_zh": "分子设计育种与多重抗逆品质聚合",
                "name_en": "Molecular Design Breeding & Trait Pyramiding"
            }
        ],
        "color": "#b83b26",
        "bg_light": "#fdf0ed",
        "tag": "基因组编辑与分子育种",
        "icon_svg": "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m18 2 4 4-12 12H6v-4L18 2zM14 6l4 4\"/><circle cx=\"6\" cy=\"18\" r=\"3\"/><path d=\"m3 21 3-3\"/></svg>"
    }
];

  /**
   * 将任意别名、旧ID规范化为官方标准一级专题 ID
   */
  function normalizeTopicId(rawId) {
    if (!rawId) return TOPICS[0].id;
    var clean = String(rawId).trim().toLowerCase();
    for (var i = 0; i < TOPICS.length; i++) {
      var t = TOPICS[i];
      if (t.id === clean) return t.id;
      for (var j = 0; j < t.aliases.length; j++) {
        if (t.aliases[j].toLowerCase() === clean) return t.id;
      }
    }
    return TOPICS[0].id;
  }

  function getTopic(topicId) {
    var id = normalizeTopicId(topicId);
    return TOPICS.find(function (t) { return t.id === id; }) || TOPICS[0];
  }

  function findSubtopic(topicId, subtopicId) {
    var t = getTopic(topicId);
    if (!t || !subtopicId) return null;
    return t.subtopics.find(function (s) { return s.id === subtopicId; }) || null;
  }

  function mapTagToTopicIds(tag) {
    if (!tag) return [];
    var t = String(tag).trim();
    if (t === '泛基因组与组装') return ['pangenome', 'assembly-annotation'];
    var matched = [];
    TOPICS.forEach(function (topic) {
      if (t === topic.tag || t === topic.name_zh || topic.aliases.indexOf(t) !== -1) {
        matched.push(topic.id);
      }
    });
    return matched;
  }

  /**
   * 聚合全站文献到各个一级专题中（基于 V2.2 primary_topic 与 secondary_topics）
   */
  function aggregateTopics(articles) {
    var safeArticles = Array.isArray(articles) ? articles : [];
    var topicMap = {};

    TOPICS.forEach(function (t) {
      topicMap[t.id] = {
        config: t,
        primaryArticles: [],
        secondaryArticles: [],
        articles: [], // 主归档文献（学术分类唯一归属）
        allArticles: [], // 综合（含交叉关联文献）
        subtopicCounts: {},
        latestIssue: '',
        newCount: 0
      };
      t.subtopics.forEach(function (sub) {
        topicMap[t.id].subtopicCounts[sub.id] = 0;
      });
    });

    safeArticles.forEach(function (article) {
      var pTopic = article.primary_topic ? normalizeTopicId(article.primary_topic) : null;
      var sTopics = Array.isArray(article.secondary_topics) ? article.secondary_topics.map(normalizeTopicId) : [];

      if (!pTopic) {
        var dirs = Array.isArray(article.research_direction) ? article.research_direction : [article.research_direction || ''];
        var fallbackIds = [];
        dirs.forEach(function (d) {
          fallbackIds = fallbackIds.concat(mapTagToTopicIds(d));
        });
        fallbackIds = Array.from(new Set(fallbackIds));
        if (fallbackIds.length > 0) {
          pTopic = fallbackIds[0];
          sTopics = fallbackIds.slice(1);
        } else {
          pTopic = 'functional-genomics';
        }
      }

      // 归入主要专题
      if (topicMap[pTopic]) {
        topicMap[pTopic].primaryArticles.push(article);
        if (topicMap[pTopic].articles.indexOf(article) === -1) {
          topicMap[pTopic].articles.push(article);
        }
        if (topicMap[pTopic].allArticles.indexOf(article) === -1) {
          topicMap[pTopic].allArticles.push(article);
        }
        // 统计二级专题
        var subs = Array.isArray(article.subtopics) ? article.subtopics : [];
        subs.forEach(function (sid) {
          if (topicMap[pTopic].subtopicCounts[sid] !== undefined) {
            topicMap[pTopic].subtopicCounts[sid]++;
          }
        });
      }

      // 归入关联专题
      sTopics.forEach(function (secId) {
        if (topicMap[secId] && secId !== pTopic) {
          topicMap[secId].secondaryArticles.push(article);
          if (topicMap[secId].allArticles.indexOf(article) === -1) {
            topicMap[secId].allArticles.push(article);
          }
        }
      });
    });

    // 计算各专题统计指标
    TOPICS.forEach(function (t) {
      var item = topicMap[t.id];
      item.articles.sort(function (a, b) {
        var d1 = a.publication_date || a.issue || '';
        var d2 = b.publication_date || b.issue || '';
        return d2.localeCompare(d1);
      });
      if (item.articles.length > 0) {
        item.latestIssue = item.articles[0].issue || item.articles[0].issue_date || '';
        var latest = item.latestIssue;
        item.newCount = item.articles.filter(function (a) {
          return a.issue === latest || a.issue_date === latest;
        }).length;
      }
    });

    var allIssues = safeArticles.map(function (a) { return a.issue || ''; }).filter(Boolean).sort().reverse();
    var globalLatest = allIssues.length > 0 ? allIssues[0] : '';
    topicMap.topics = topicMap;
    topicMap.latestIssue = globalLatest;
    topicMap.totalArticles = safeArticles.length;
    return topicMap;
  }

  global.GenomeRadarTopics = {
    VERSION: TAXONOMY_VERSION,
    TOPICS: TOPICS,
    DEFINITIONS: TOPICS,
    normalizeTopicId: normalizeTopicId,
    getTopic: getTopic,
    findSubtopic: findSubtopic,
    mapTagToTopicIds: mapTagToTopicIds,
    aggregateTopics: aggregateTopics
  };

})(typeof window !== 'undefined' ? window : this);
