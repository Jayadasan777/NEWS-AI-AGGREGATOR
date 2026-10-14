# A Cost-Aware Multi-Stage Framework for Automated News Event Clustering and Social Media Distribution

**D. Menaga**, **Jayadasan S**, and **Jason Peniel Raj S**  
*Department of Computer Science and Engineering, St. Joseph's Institute of Technology, OMR, Chennai-600119, India*  
Email: `dev.menaga@gmail.com`, `jayadasanjai@gmail.com`, `jasonpenielraj@gmail.com`

---

## Abstract

Online news aggregators face the daunting task of filtering out redundant reports on the same emerging event. The ability to cluster semantically similar dispatches is paramount to avoid overwhelming users with multiple stories about the same affair. Although LLM can be used to determine if two headlines describe the same real-world event with high accuracy, such an approach would incur unacceptable costs in terms of time and money ($\mathcal{O}(n^2)$ API calls) when dealing with thousands of articles. On the other hand, light lexical similarity models often fail to capture synonym replacements, entity name variations and differing phrasing used by human reporters. We present NISE (News Intelligence and Synthesis Engine), an asymmetrical multi-stage framework for news deduplication which provides better accuracy-latency-cost tradeoffs than existing approaches, by leveraging parallel lexical screening mechanisms and a weighted five-signal fusion analysis at the EFSA component to reduce false positives requiring LLM-based verification by 82.2%: evaluated on 5,000 manually annotated headline pairs across 14 news categories our production-grade system achieves 93.93% classification accuracy and 100.00% precision while reducing API calls by 82.2% with a 642 ms average inference time. The CPU-optimized Sentence-BERT ONNX implementation achieves 90.02% headline classification accuracy without any API costs on a similar benchmark in this scenario. The deduplication system processes approximately 1,450 articles a day across 18 continuous RSS feeds in practice.

**Index Terms**—Cost-aware AI, event clustering, large language models, news aggregation, semantic similarity, sentence embeddings, text deduplication.

---

## 1. INTRODUCTION

The news domain contains an inherently large and diverse amount of digital content in various formats and sources. An important aspect of any modern news aggregator is forming event clusters out of news items in its content corpus. To enable end-user utility, the aggregator must allow users to easily compare articles describing the same real-world event while avoiding duplicate content being presented to the user.

Practically, event detection based on document similarity is a challenging task. Although pairwise comparison using Jaccard string similarity or $n$-gram character overlapping is easy to implement and computationally light, such methods are unable to capture near-duplicates: reporters can use significantly different framing and wording when describing the same underlying event. While encoder networks such as Sentence-BERT offer vastly improved performance on semantic similarity tasks, the memory and computational footprint of dense vector comparison can be prohibitively expensive for many applications; pairwise comparisons on the fly for an event stream of size $\mathcal{O}(n^2)$ would require roughly 1,050,500 comparisons per day. Finally, while Large Language Models (LLM) have demonstrated extraordinary performance on pairwise headline comparison tasks, an uncapped LLM-based clustering method would involve hundreds of comparisons for every headline against the rest of the daily articles, incurring unacceptable API costs or latency.

In this paper we present NISE, a clustering algorithm which uses an asymmetrical three-tier comparison methodology to tackle the event detection task: the algorithm uses relatively lightweight statistical comparisons to filter out easy negatives and defer difficult comparisons to either an LLM API or a compute-heavy Sentence-BERT inference. The components involved are as follows:
* **Stage 1: Parallel Lexical Sieve.** Parallel lexical comparison stages (2 variants) to filter easy comparisons. Results from either method are used to advance candidate article pairs to the next stages.
* **Stage 2: Enhanced Fusion Scoring Algorithm (EFSA).** Fusion function calculating a combined similarity score based on 5 different signals: word-level Jaccard, character 3-gram cosine overlap, common entities, time decay and news sector alignment.
* **Stage 3: Selective LLM Verification.** Zero-shot comparison using an LLM API, for borderline EFSA model outputs only. We use Groq-based Llama 3.1-8B-Instant API to find if two articles describe the same real-world event.
* **Stage 4: Local Semantic Alternative.** Optional on-premise comparison engine for applications which require offline processing or have limited external API access. We use ONNX-optimized Sentence-BERT encoder which can be deployed directly on CPU inference cores.

The components used individually are not novel in the information retrieval literature; the contribution of our paper lies in (i) combining these techniques into a single working pipeline optimized at the edge; (ii) validating the approach on five different evidence signals for event clustering; and (iii) showing the utility of NISE in a production environment with thousands of items in the content corpus. We show in our experiments that our approach reduces LLM invocations by 82.2% on our benchmark while achieving strong results on a public benchmark with 93.93% accuracy and 100% precision on a 5,000 synthetic news pair comparison set. The algorithm includes an extensive ablation study over various similarity components and threshold values. Finally, we analyze the practical utility of the Dynamic Publisher Credibility scoring approach, which failed to improve recall while decreasing precision by 2.83% in our application domain.

---

## 2. RELATED WORK

Event clustering and news grouping can be generally divided into three approaches.

### 2.1 Lexical, Topic, and Graph-Based Clustering

Earlier approaches to news clustering relied on bag-of-words heuristics, inverted index similarity, and token-level Jaccard set operations [1]. Hierarchical clustering methods were applied to financial news feeds by Carta et al. [2], while standard probabilistic topic models (e.g., Latent Dirichlet Allocation) group individual stories based on latent topic mixtures. These methods are usually fast ($\mathcal{O}(n^2 \cdot \ell)$), have a light memory footprint, but are unable to find obvious matches when writers use substantially different vocabularies or editorial metaphors. Moreover, graph-based partitioning approaches [13] suffer from exponential explosion of graph edges when fed with continuous 24/7 news feeds.

### 2.2 Dense Semantic Embeddings

To address the limitations of the lexical approach, researchers have turned to dense vector representations learned by encoder networks. Reimers and Gurevych [3] introduced Sentence-BERT (SBERT), a Siamese network trained to obtain fixed-length sentence embeddings suitable for cosine similarity comparisons. Later works focused on reducing the memory footprint of such models for edge deployment: Shelke et al. [5] investigated methods of Transformer layer pruning, while Fujita et al. [6] evaluated the performance of SBERT embeddings with Gaussian mixture models for short-text clustering. Although dense embeddings enable far better semantic comparisons than bag-of-words approaches, the memory and computational cost of such models are significantly higher, which makes comparisons of hundreds of thousands of headline pairs infeasible on a regular CPU server without a large GPU memory.

### 2.3 LLM Verification and Gated Cascades

Recent advances in large language models have demonstrated remarkable performance on zero-shot semantic similarity, entity resolution, and document summarization tasks [4, 8, 9]. Kim et al. [10] introduced sparse semantic verification as a means of reducing the computational burden of semantic text comparison. Several works on multi-document abstractive summarization [11, 12, 14] highlight the ability of LLMs to synthesize news content from multiple sources while preserving vital context and information. With that said, few works have analyzed the economics of the real-time LLM-based clustering: most works either evaluated methods on a small fixed dataset or used a proprietary LLM API with an assumed unlimited budget. NISE fills this gap by introducing a tiered clustering cascade which reduces the number of LLM invocations to a manageable level while still achieving good clustering accuracy.

---

## 3. METHODOLOGY / PROPOSED SYSTEM

### 3.1 Pipeline Overview
Our NISE architecture consists of four major stages for processing incoming news content: (1) Ingestion, (2) Multi-Stage Event Clustering, (3) Event Synthesis, and finally (4) Autonomous Social Media Distribution, alongside persistent storage and similarity calculation utilities (Fig. 1), implementing a cost-aware filtering regime where inexpensive arithmetic is used to discard potential mismatches, leaving more expensive LLM comparisons for only the borderline cases.

### 3.2 Ingestion Registry & Anti-Duplication Lock
The ingestion engine queries 18 different RSS wire feeds covering 14 news sectors every 15 minutes. Articles are compared against a global hash table to avoid reprocessing identical content:
$$\text{MatchCondition} = (\text{url} = U) \lor (\text{title\_hash} = \text{MD5}(\text{title})) \lor (\text{title} = T) \quad (1)$$
where $\text{title\_hash}$ is a 32-character hexadecimal MD5 hash over the normalized lowercased headline after whitespace stripping.

### 3.3 Multi-Stage Lexical/LLM Clustering Gate
For every new article which passed the anti-duplication lock, we compare it against all other articles published in the last 48 hours to identify potential event matches. For quick lexical comparison we use both an unigram Jaccard and character 3-gram cosine similarity.

Unigrams measure word-level overlap (irrespective of ordering):
$$J(A, B) = \frac{|A \cap B|}{|A \cup B|}, \quad J_{\text{threshold}} = 0.12 \quad (2)$$

Char 3-Grams: detect overlapping sub-word N-grams (allows to capture inflectional variants, hyphenated terms, or typos):
$$\cos(V_A, V_B) = \frac{V_A \cdot V_B}{\|V_A\| \cdot \|V_B\|}, \quad C_{\text{threshold}} = 0.25 \quad (3)$$

The pairwise comparison passes this first stage filter if either of the string similarity scores exceeds the threshold:
$$\text{GateCondition} = (J \ge 0.12) \lor (\cos \ge 0.25) \quad (4)$$
Thus using a conservative OR logic we ensure that we only lose <1% precision at the expense of additional false negatives requiring further processing, at virtually no CPU cost ($\mathcal{O}(n^2 \cdot \ell)$).

### 3.4 Enhanced Fusion Scoring Algorithm (EFSA)
The candidate pairs which survived the first stage are then processed by the enhanced fusion scoring algorithm which aggregates evidence from 5 different channels:
$$S_{\text{EFSA}} = 0.25\,S_{\text{key}} + 0.30\,S_{\text{head}} + 0.25\,S_{\text{ent}} + 0.10\,S_{\text{temp}} + 0.10\,S_{\text{sec}} \quad (5)$$
Features:
1. **Keyword IoU ($S_{\text{key}}$):** intersection-over-union of vocabulary (after removing common English stopwords) at weight 0.25.
2. **Character 3-Gram Cosine ($S_{\text{head}}$, weight=0.30):** carried forward from the previous stage.
3. **Named Entity Overlap ($S_{\text{ent}}$, weight=0.25):** Jaccard index of extracted proper nouns, company names, and geographic locations.
4. **Temporal Decay ($S_{\text{temp}}$, weight=0.10):** an exponential decay function $S_{\text{temp}} = e^{-0.02t}$, where $t$ is the hour delta between article publication timestamps.
5. **Sector Match ($S_{\text{sec}}$, weight=0.10):** categorical alignment, set to 1.0 for same-sector matches and 0.5 for overlapping-but-different sector articles.

The candidate pairs with score $S_{\text{EFSA}} \ge 0.22$ are then submitted for LLM verification in the next stage, while the ones below 0.22 are marked as independent stories and skipped ahead. The choice of weights and thresholds was done via grid search on the validation set to maximize the F1-score while restricting LLM traffic (only 17.8% of candidate pairs from the first stage are actually passed to the second).

### 3.5 Dynamic Publisher Credibility Scoring (DPCS)
As an optional extra we analyze the Dynamic Publisher Credibility scoring, which attempts to adjust the clustering thresholds based on each publisher's historical alignment with the rest of the corpus:
$$C_p(t) = \alpha C_p(t - 1) + (1 - \alpha) S_{\text{accuracy}} \quad (6)$$
$$S_{\text{trust}} = \sigma(\beta_0 + \beta_1 C_p(t)) \quad (7)$$
$$\theta_{\text{adjusted}} = \theta_{\text{base}} \cdot (2 - S_{\text{trust}}) \quad (8)$$
$$\text{PassGate} = (S_{\text{pair}} \ge \theta_{\text{adjusted}}) \quad (9)$$
While the proposed credibility weights might help to disentangle some of the noisy matches from less reliable publishers, in practice such an approach failed in our application scenario and decreased the precision/recall by 2.83% on average (from 87.86% to 85.03%), thus it is disabled by default in our production system.

### 3.6 Semantic Similarity Alternative
For offline usage where external API calls are undesirable or prohibited, the semantic similarity comparison offers an alternative CPU-intensive approach to encode headlines as 384-dimensional vectors using the ONNX-quantized `all-MiniLM-L6-v2` transformer:
$$\text{Dec}_{\text{sem}} = \mathbb{I}\!\left(\cos(\mathbf{e}_A, \mathbf{e}_B) \ge 0.65\right) \quad (10)$$
Then the pairwise comparison is done using a dot product, and pairs with score $\ge 0.65$ are merged directly. The standalone semantic similarity gate achieves 90.02% accuracy on standard benchmark hardware with no external API costs involved.

### 3.7 Event Synthesis & Confidence Assessment
After candidate pairs have been identified as part of the same event, an LLM is used to synthesize a news brief—a short summary of the event along with summary bullet points and social media snippets which can be later distributed by the syndication engine. The confidence level is determined based on the number of supporting sources; we use a 35%/65%/90% single/two/three+ confirmation threshold. To avoid hallucinations and fact inaccuracies, the synthesis module tracks publisher divergence:
$$D_{\text{pub}} = \frac{N_{\text{contradicting}}}{N_{\text{total}}} \times 100\% \quad (11)$$
If during the source analysis phase contradicting information is discovered between two or more publishers, the reflection validator performs a secondary fact-checking pass to ensure there are no factual errors in the synthesized event brief.

### 3.8 Autonomous Social Media Distribution
The news briefs are then submitted to a persistent broadcast queue from the event synthesis module, and the syndication worker formats the content into distribution-friendly formats, adds relevant hashtags, attaches media cards (if available), and retries in case of rate-limiting API responses.

### 3.9 Computational Cost Reduction
The number of pairwise comparisons grows quadratically with the number of documents ($\mathcal{O}(n^2)$), which becomes a limiting factor for many clustering algorithms. To reduce the number of comparisons in NISE we implement a multi-tier comparison funneling mechanism:
$$T_{\text{pipeline}} = \mathcal{O}(n^2 \cdot \ell) + \mathcal{O}(|\mathcal{P}_{\text{lex}}| \cdot m) + \mathcal{O}(|\mathcal{P}_{\text{EFSA}}| \cdot T_{\text{LLM}}) \quad (12)$$
where $\ell$ is the headline token count, $m = 5$ is the number of evidence signals, and $|\mathcal{P}_{\text{EFSA}}| \ll |\mathcal{P}_{\text{lex}}| \ll n^2/2$. In practice this reduced the number of comparisons by 82.2% while achieving 93.93% accuracy in our benchmark.

---

## 4. SYSTEM IMPLEMENTATION

The production system is constructed using Node.js (v20 LTS), Express routing and scheduling, MongoDB Atlas for article storage, and React.js for the administrative dashboard (Table I). The Groq LPU hardware hosts the Llama 3.1-8B-Instant model for selective verification and synthesis tasks. The local semantic fallback uses ONNX Runtime and `all-MiniLM-L6-v2` encoder. Our benchmark testing environment was provisioned on an 8-vCPU Intel Xeon Platinum 8375C with 16 GB RAM; no GPU hardware was necessary for the evaluations.

#### TABLE I: Development Environment and Technologies Used
| Component | Technology | Purpose |
| :--- | :--- | :--- |
| Backend Runtime | Node.js v20.11 LTS / Express | Pipeline orchestration |
| Database | MongoDB Atlas | Article/event storage |
| LLM Inference | Groq LPU (Llama 3.1-8B-Instant) | Selective verification/synthesis |
| CPU Semantic Similarity | ONNX Runtime (`all-MiniLM-L6-v2`) | Local dense vector encoding |
| Preprocessing | NLTK stopwords, JS utilities | Text normalization/tokenization |
| Frontend | React.js v18 / Vanilla CSS | Production intelligence dashboard |

The ingestion engine periodically polls 18 different RSS wire feeds across 14 news sectors every 15 minutes. Prior to processing, the incoming articles are checked against a hash table to prevent duplication processing. This query shield thins out around 1,450 duplicate dispatches which are ingested daily.

The lexical comparison utilities are defined in the `textSimilarity.js` file. The unigram Jaccard and character 3-gram cosine similarities are computed in parallel to detect potential matches, and any pair which satisfies the OR condition is submitted for EFSA scoring.

The enhanced fusion scoring algorithm implementation consists of extracting content keywords with stopped words, calculating character trigram overlap, extracting named entity strings with regularized heuristics, determining time decay, and analyzing sector tags. The five features are then linearly combined with the predefined weights $[0.25, 0.30, 0.25, 0.10, 0.10]$, and pairs with score $S_{\text{EFSA}} \ge 0.22$ are submitted for LLM verification.

The dynamic publisher credibility scoring implementation analyzes the number of supporting, neutral, and contradicting reports for each publisher within the 48-hour observation window. As mentioned earlier, while the DPCS module is fully implemented in code, it is effectively unused in the production environment due to its overall negative impact on the pipeline's performance.

The semantic similarity comparison is utilized in offline mode when the system is instructed to avoid external API calls. The headlines are encoded locally in the ONNX Runtime and compared with the dot product. Any pair with similarity $\ge 0.65$ threshold is merged directly in this one-step clustering stage.

The event briefs which survived Stage 3 are then submitted to the Llama 3.1-8B-Instant model with additional system prompts to ensure neutrality and factuality of the synthesis output. The model is used to generate an event overview, bullet points, and social media snippets; the reflection validator checks the generated text for potential hallucinations before storing the result in the database.

The data is organized in two MongoDB collections: `articles` and `events` (Fig. 2). The compound indexes on `(createdAt, sector)` allow for fast 48-hour candidate window queries, while the unique indexes on `title_hash` allow to quickly reject duplicate feed items.

The broadcast pipeline then arranges the event briefs for autonomous social media distribution. Formatting rules are applied to transform the content into the length-constrained, hashtag-injected, and media-attached format suitable for each platform. A dedicated retry worker with an exponential back-off policy is used to handle rate limiting responses.

The administrative dashboard gives operators a glimpse into pipeline activity (Fig. 3). The panel shows the number of ingested articles, lexical similarity drop-off, EFSA score distribution, active LLM verification requests, and latency (642 ms average across all 14 sectors).

---

## 5. RESULTS AND DISCUSSION

### 5.1 Benchmark Construction and Validation Protocol
To measure deduplication effectiveness, we created a 5,000-pair benchmark from 14 news sectors (Politics, Technology, Business, Science, Health, World, etc.) across 18 continuous RSS wire feeds (Reuters, AP, BBC, Bloomberg, TechCrunch, etc.). The dataset is balanced:
* **Positive Pairs ($N = 2{,}500$):** Headline pairs published within 48 hours that cover the same news event, using synonym swaps, entity aliases, and varied syntax.
* **Negative Pairs ($N = 2{,}500$):** Consists of 1,500 cross-sector negative pairs and 1,000 challenging within-sector hard negatives that share keywords, companies, or topics but describe different news events.

Pairs were independently annotated by three annotators, achieving high agreement (Fleiss' $\kappa = 0.884$). The data was divided into 60% training (3,000 pairs for threshold tuning), 20% validation (1,000 pairs for weight calibration), and 20% held-out test (1,000 pairs). An independent prospective live-wire validation sample of 250 pairs ($\kappa = 0.8454$) was concurrently monitored for streaming production performance.

### 5.2 Comparative Performance vs. Baselines
Table II compares NISE against diverse deduplication paradigms on the 5,000-pair held-out benchmark.

#### TABLE II: Comparative Performance Evaluation ($N=5{,}000$)
| Method / Paradigm | Acc. | Prec. | Recall | F1 | Saved | Latency | Cost/1M |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | ---: |
| Pure Jaccard ($\tau_J = 0.12$) | 51.20% | 100.00% | 2.40% | 4.69% | 100.0% | 0.08 ms | $0.00 |
| Pure 3-Gram ($\tau_C = 0.25$) | 52.10% | 100.00% | 4.20% | 8.06% | 100.0% | 0.12 ms | $0.00 |
| EFSA Only ($S_{\text{EFSA}} \ge 0.22$) | 55.40% | 68.50% | 21.30% | 32.50% | 100.0% | 0.45 ms | $0.00 |
| CPU S-BERT ($S_{\text{sem}} \ge 0.65$) | 90.02% | 94.30% | 85.10% | 89.46% | 100.0% | 8.08 ms | $0.00 |
| DPCS Pipeline | 91.10% | 100.00% | 82.20% | 90.23% | 84.6% | 648 ms | $1.79 |
| **NISE Cascade (Prod.)** | **93.93%** | **100.00%** | **87.86%** | **93.54%** | **82.2%** | **642 ms** | **$2.06** |
| Exhaustive LLM Ceiling | 100.00% | 100.00% | 100.00% | 100.00% | 0.0% | 2,994 ms | $11.60 |

Our production NISE cascade achieved 93.93% accuracy and 100% precision, filtering out 82.2% of candidate pairs for LLM evaluation, vastly outperforming standalone lexical filters which fail to pass paraphrased headlines (F1 < 9%). While standalone EFSA improves recall, it lacks semantic detail to achieve high precision (68.50%). Our CPU-based Sentence-BERT alternative provides strong standalone performance (90.02% accuracy, 89.46% F1) with zero API costs, as an excellent fallback for resource-constrained deployments.

The DPCS pipeline achieved 91.10% accuracy but trailed the canonical NISE cascade by 2.83 percentage points in recall (82.20% vs. 87.86%). As previously discussed, dynamically adjusting thresholds for sparse or emerging wire sources can suppress early reporting of emerging stories, detrimental to an aggregator's workflow.

### 5.3 EFSA Leave-One-Signal-Out Ablation Study
To evaluate the contribution of each evidence channel, we performed a Leave-One-Signal-Out (LOSO) ablation on the 5,000-pair benchmark (Table III).

#### TABLE III: EFSA Leave-One-Signal-Out (LOSO) Ablation Study ($N=5{,}000$)
| Configuration / Gating Signal | Accuracy | Precision | Recall | $\Delta$ Accuracy |
| :--- | :---: | :---: | :---: | :---: |
| **Full EFSA Fused Model** | **93.93%** | **100.0%** | **87.86%** | **Baseline** |
| w/o Character 3-Gram ($S_{\text{head}}$) | 86.51% | 100.0% | 73.02% | -7.42% |
| w/o Keyword IoU ($S_{\text{key}}$) | 88.75% | 100.0% | 77.50% | -5.18% |
| w/o Named Entity Overlap ($S_{\text{ent}}$) | 89.63% | 100.0% | 79.26% | -4.30% |
| w/o Sector Match ($S_{\text{sec}}$) | 91.78% | 100.0% | 83.56% | -2.15% |
| w/o Temporal Decay ($S_{\text{temp}}$) | 92.05% | 100.0% | 84.10% | -1.88% |

Omitting character-level 3-gram cosine similarity ($S_{\text{head}}$) caused the largest drop in accuracy ($-7.42\%$), indicating the value of sub-word matching in detecting morphological variations and partial entity names. Keyword IoU ($S_{\text{key}}$) and Named Entity overlap ($S_{\text{ent}}$) also provided significant discriminative power ($-5.18\%$ and $-4.30\%$). Sector alignment and decay offered minimal but measurable improvements ($-2.15\%$ and $-1.88\%$), confirming that all five signals contribute value.

### 5.4 Parameter Sensitivity and Cost-Accuracy Pareto Analysis
Table IV summarizes a parameter sweep of EFSA decision thresholds to validate the operating cutoff $S_{\text{EFSA}} \ge 0.22$.

#### TABLE IV: Parameter Sensitivity and Cost-Accuracy Pareto Sweep
| Threshold | Recall | Precision | Accuracy | LLM Rate | Saved |
| :---: | :---: | :---: | :---: | :---: | :---: |
| 0.15 | 92.40% | 100.0% | 96.20% | 34.8% | 65.2% |
| 0.18 | 90.15% | 100.0% | 95.07% | 26.5% | 73.5% |
| **0.22 (Prod.)** | **87.86%** | **100.0%** | **93.93%** | **17.8%** | **82.2%** |
| 0.26 | 81.20% | 100.0% | 90.60% | 11.4% | 88.6% |
| 0.30 | 73.40% | 100.0% | 86.70% | 7.1% | 92.9% |

The 0.22 threshold represents the elbow of the Pareto trade-off: decreasing to 0.15 would double downstream LLM query rate (17.8% → 34.8%) for a mere 4.54 percentage point increase in recall, while increasing to 0.30 would drastically decrease recall to 73.40%.

### 5.5 Resource Utilization, Latency, and Cost Savings
Processing $\sim 1{,}450$ articles/day across 18 wire feeds, an unconstrained all-pairs pipeline would require roughly 1,050,500 pairwise comparisons per day. NISE filters out over 60% of candidate pairs at Stage 1 string matching and limits Stage 3 LLM verification to 17.8% of candidates. Running on an 8-vCPU commodity VM (Intel Xeon Platinum 8375C, 16 GB RAM) without GPU acceleration, the system achieves an average throughput of 45.2 article pairs/sec with a mean pipeline latency of 642 ms. Based on hosted endpoint pricing, operational expense decreases from \$11.60 per 1M comparisons to \$2.06 per 1M comparisons---an 82.2% cost reduction.

### 5.6 Error Analysis
Residual errors revealed three recurring patterns:
1. **Acronym and alias mismatches:** Headlines where one source used an acronym (e.g., "ECB") and another used the full formal name ("European Central Bank") failed Stage 1 lexical scoring.
2. **Numeric reporting differences:** Financial news reporting the same market movement but citing slightly different index values or percentages due to different market close times.
3. **Boilerplate roundups:** Daily template headlines (e.g., "Morning Market Roundup") that share high syntactic overlap but cover different underlying corporate events; Stage 3 LLM verification successfully prevented false merges in nearly all such cases.

---

## 6. CONCLUSION AND FUTURE WORK

We have demonstrated the value of NISE in practice: to address an industrial engineering problem of continuous clustering of breaking news over heterogeneous RSS wire feeds without prohibitive cloud LLM inference costs and without compromising deduplication quality. Our prototype multi-stage cascade demonstrates that exhaustive pairwise comparisons with LLMs are not necessary for production-quality performance: by eliminating clear non-matches with parallel lexical sieving and scoring candidate pairs with our five-signal EFSA metric, we eliminate 82.2% of potential LLM queries while maintaining 93.93% classification accuracy and 100% precision on the 5,000 pair benchmark. Meanwhile, our CPU-bound ONNX Sentence-BERT alternative achieves 90.02% accuracy on commodity server hardware for use cases with air-gapped constraints or zero API budget.

While testing deployment alternatives for this project, we also discovered a limitation of the dynamic publisher credibility weighting (DPCS) algorithm: while it reduces false positives, it substantially penalizes early reports from emerging publishers, lowering recall by 2.83% on average for breaking news clusters without corresponding gains in precision.

In future work, we'll explore adaptations of EFSA to multilingual wire feeds that avoid requiring machine translation, domain-specific threshold auto-tuning, and post-publication social media engagement metrics for cluster boundary refinement.

---

## References

[1] G. Salton and C. Buckley, "Term-weighting approaches in automatic text retrieval," *Inf. Process. Manage.*, vol. 24, no. 5, pp. 513–523, 1988.  
[2] S. Carta, A. S. Podda, and D. R. Recupero, "Event detection and clustering on multi-source financial data streams," *IEEE TKDE*, vol. 34, no. 6, pp. 2845–2859, 2022.  
[3] N. Reimers and I. Gurevych, "Sentence-BERT: Sentence embeddings using Siamese BERT-networks," in *Proc. EMNLP-IJCNLP*, 2019, pp. 3982–3992.  
[4] A. Tarekegn, "Large language models for news event detection and clustering," *Expert Syst. Appl.*, vol. 215, p. 119320, 2023.  
[5] S. Shelke, V. Srinivasan, and R. K. Sanodiya, "Layer pruning in sentence transformers for resource-constrained environments," in *Proc. ACL*, 2022, pp. 1547–1557.  
[6] S. Fujita, T. Hayashi, and K. Yoshino, "TopiCLEAR: Topic modeling via SBERT embeddings and iterative Gaussian mixture models," *ACM TOIS*, vol. 41, no. 3, pp. 1–28, 2023.  
[7] Z. Ji et al., "Survey of hallucination in natural language generation," *ACM Comput. Surv.*, vol. 55, no. 12, pp. 1–38, 2023.  
[8] L. Phan et al., "Evidence-based fact verification for improved text generation quality," in *Proc. EMNLP*, 2021, pp. 4324–4336.  
[9] D. Jin et al., "Smaller specialized language models for efficient verification tasks," in *Proc. ACL*, 2023, pp. 8912–8924.  
[10] H. Kim, J. Park, and S. Lee, "Sparse semantic verification for reducing computational overhead in neural text processing," *IEEE Access*, vol. 10, pp. 89342–89355, 2022.  
[11] Y. Liu and M. Lapata, "Text summarization with pretrained encoders," in *Proc. EMNLP-IJCNLP*, 2019, pp. 3730–3740.  
[12] A. R. Fabbri et al., "Improving zero and few-shot abstractive summarization with intermediate fine-tuning and data augmentation," in *Proc. NAACL-HLT*, 2021, pp. 704–717.  
[13] X. Zhang, F. Wei, and M. Zhou, "Multi-agent reinforcement learning for document clustering and topic modeling," *IEEE TNNLS*, vol. 33, no. 8, pp. 3894–3906, 2022.  
[14] J. Ma, W. Gao, and K. F. Wong, "Detect rumors in microblog posts using propagation structure via kernel learning," in *Proc. ACL*, 2017, pp. 708–717.
