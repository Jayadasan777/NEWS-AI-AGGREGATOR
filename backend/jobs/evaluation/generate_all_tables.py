#!/usr/bin/env python3
"""
Generate ALL IEEE paper tables from master_benchmark_results_883.json

Generates 5 tables ready to paste into LaTeX:
- TABLE I: System Comparison Matrix
- TABLE II: Baseline Comparison (N=198)
- TABLE III: Cost-Accuracy Tradeoff
- TABLE IV: Top-5 Sectors Performance
- TABLE V: Production Telemetry

Usage:
    python generate_all_tables.py > all_tables.tex
"""

import json

def load_results():
    with open('master_benchmark_results_883.json', 'r') as f:
        return json.load(f)

def table1_system_comparison():
    """TABLE I: System Comparison Matrix (Section II)"""
    print(r"""
% ========== TABLE I: SYSTEM COMPARISON MATRIX ==========
\begin{table}[!t]
\caption{SYSTEM CAPABILITY COMPARISON MATRIX}
\label{tab:comparison}
\centering
\small
\begin{tabular}{lcccc}
\toprule
\textbf{System} & \textbf{LLM} & \textbf{Cost} & \textbf{Deployed} & \textbf{Public} \\
 & \textbf{Verify} & \textbf{Analyzed} & \textbf{System} & \textbf{Benchmark} \\
\midrule
Salton \& Buckley [16] & $\times$ & $\times$ & $\times$ & $\times$ \\
Reimers \& Gurevych [15] & $\times$ & $\times$ & $\times$ & \checkmark \\
Tarekegn et al. [19] & \checkmark & $\times$ & $\times$ & $\times$ \\
Nakshatri et al. [13] & \checkmark & $\times$ & \checkmark & $\times$ \\
\textbf{NISE (This Work)} & \checkmark & \checkmark & \checkmark & \checkmark \\
\bottomrule
\end{tabular}
\end{table}
""")

def table2_baseline_comparison(data):
    """TABLE II: Primary Baseline Comparison (Section V)"""
    print(r"""
% ========== TABLE II: BASELINE COMPARISON (N=198) ==========
\begin{table*}[!t]
\caption{PRIMARY DEDUPLICATION BASELINE COMPARISON (N=198 HELD-OUT TEST SPLIT)}
\label{tab:baseline}
\centering
\small
\begin{tabular}{lcccccc}
\toprule
\textbf{Method} & \textbf{Accuracy} & \textbf{Precision} & \textbf{Recall} & \textbf{F1-Score} & \textbf{MCC} & \textbf{Calls Saved} \\
\midrule
\multicolumn{7}{l}{\textit{Pure Lexical Baselines (No LLM)}} \\
""")

    # Extract lexical methods
    lexical = ['TF-IDF + Cosine (τ=0.20)', 'BM25 Overlap (τ=0.25)',
               'Lexical Jaccard Only (τ=0.12)', 'Char 3-Gram Cosine Only (τ=0.25)']

    for result in data['primary_results']:
        if result['method'] in lexical:
            print(f"{result['method']} & {result['accuracy']} & {result['precision']} & "
                  f"{result['recall']} & {result['f1_score']} & {result['mcc']:.3f} & "
                  f"{result['calls_saved']} \\\\")

    print(r"""\midrule
\multicolumn{7}{l}{\textit{Dense Semantic Baseline (CPU-Only)}} \\""")

    # SBERT (manually add since it's in separate file)
    print(r"SBERT MiniLM-L6-v2 ($\tau=0.55$) & 81.82\% & 94.37\% & 67.68\% & 78.82\% & 0.664 & 100\% \\")

    print(r"""\midrule
\multicolumn{7}{l}{\textit{Multi-Evidence Gates (No LLM)}} \\""")

    # EFSA methods
    for result in data['primary_results']:
        if 'EFSA' in result['method']:
            print(f"{result['method']} & {result['accuracy']} & {result['precision']} & "
                  f"{result['recall']} & {result['f1_score']} & {result['mcc']:.3f} & "
                  f"{result['calls_saved']} \\\\")

    print(r"""\midrule
\multicolumn{7}{l}{\textit{Hybrid Two-Stage Pipelines (Lexical $\rightarrow$ LLM)}} \\""")

    # NISE (bold)
    for result in data['primary_results']:
        if 'Two-Stage' in result['method'] or 'NISE' in result['method']:
            print(f"\\textbf{{{result['method']}}} & \\textbf{{{result['accuracy']}}} & "
                  f"\\textbf{{{result['precision']}}} & \\textbf{{{result['recall']}}} & "
                  f"\\textbf{{{result['f1_score']}}} & \\textbf{{{result['mcc']:.3f}}} & "
                  f"\\textbf{{{result['calls_saved']}}} \\\\")

    print(r"""\midrule
\multicolumn{7}{l}{\textit{Upper Bound (Exhaustive LLM)}} \\
LLM-Only Ceiling & 100\% & 100\% & 100\% & 100\% & 1.000 & 0\% \\
\bottomrule
\end{tabular}
\end{table*}
""")

def table3_cost_accuracy(data):
    """TABLE III: Cost-Accuracy Tradeoff (Section V)"""
    print(r"""
% ========== TABLE III: COST-ACCURACY TRADEOFF ==========
\begin{table}[!t]
\caption{COST-ACCURACY PARETO FRONTIER (N=198 TEST SET)}
\label{tab:cost}
\centering
\small
\begin{tabular}{lcccc}
\toprule
\textbf{Method} & \textbf{F1} & \textbf{Calls} & \textbf{Cost} & \textbf{Latency} \\
 & & \textbf{Saved} & \textbf{/1M} & \textbf{(ms)} \\
\midrule""")

    # Map short names
    method_map = {
        'Lexical Jaccard Only (τ=0.12)': 'Jaccard Only',
        'EFSA Gate Only (τ=0.22)': 'EFSA Gate',
        'Production Two-Stage Hybrid (NISE)': 'NISE (Production)',
        'LLM-Only Upper Bound (Exhaustive)': 'LLM-Only Ceiling'
    }

    for result in data['primary_results']:
        if result['method'] in method_map:
            short = method_map[result['method']]
            latency = result['latency_ms']
            lat_str = f"{latency:.2f}" if latency < 1000 else f"{latency/1000:.2f}s"

            if 'NISE' in short:
                print(f"\\textbf{{{short}}} & \\textbf{{{result['f1_score']}}} & "
                      f"\\textbf{{{result['calls_saved']}}} & \\textbf{{{result['cost_per_1m']}}} & "
                      f"\\textbf{{{lat_str}}} \\\\")
            else:
                print(f"{short} & {result['f1_score']} & {result['calls_saved']} & "
                      f"{result['cost_per_1m']} & {lat_str} \\\\")

    # Add SBERT manually
    print(r"SBERT (CPU) & 78.82\% & 100\% & \$0.00 & 102.54 \\")

    print(r"""\bottomrule
\end{tabular}
\end{table}
""")

def table4_top5_sectors(data):
    """TABLE IV: Top-5 Sectors Performance (Section V)"""
    print(r"""
% ========== TABLE IV: TOP-5 SECTORS PERFORMANCE ==========
\begin{table}[!t]
\caption{TOP-5 SECTOR PERFORMANCE BREAKDOWN (PRODUCTION NISE)}
\label{tab:sectors}
\centering
\small
\begin{tabular}{lccccc}
\toprule
\textbf{Sector} & \textbf{N} & \textbf{Acc.} & \textbf{Prec.} & \textbf{Rec.} & \textbf{F1} \\
\midrule""")

    # Get top 5 sectors by F1
    sectors = sorted(data['sector_breakdown'].items(),
                    key=lambda x: float(x[1]['f1'].rstrip('%')),
                    reverse=True)[:5]

    for sector, metrics in sectors:
        print(f"{sector} & {metrics['total']} & {metrics['accuracy']} & "
              f"{metrics['precision']} & {metrics['recall']} & {metrics['f1']} \\\\")

    # Mean ± Std
    import statistics
    all_f1 = [float(m['f1'].rstrip('%')) for _, m in data['sector_breakdown'].items()]
    all_rec = [float(m['recall'].rstrip('%')) for _, m in data['sector_breakdown'].items()]

    print(f"\\midrule\n\\textit{{Mean $\\pm$ Std (15)}} & --- & --- & 100\\% & "
          f"{statistics.mean(all_rec):.1f}$\\pm${statistics.stdev(all_rec):.1f}\\% & "
          f"{statistics.mean(all_f1):.1f}$\\pm${statistics.stdev(all_f1):.1f}\\% \\\\")

    print(r"""\bottomrule
\end{tabular}
\end{table}
""")

def table5_production_telemetry(data):
    """TABLE V: Production Telemetry (Section V)"""
    print(r"""
% ========== TABLE V: PRODUCTION TELEMETRY ==========
\begin{table}[!t]
\caption{PRODUCTION OPERATIONAL TELEMETRY (30-DAY MEAN)}
\label{tab:telemetry}
\centering
\small
\begin{tabular}{lr}
\toprule
\textbf{Operational Metric} & \textbf{Value} \\
\midrule""")

    tel = data['production_telemetry']

    metrics = [
        ('RSS Articles Ingested / Day', f"{tel['rss_articles_per_day']:,}"),
        ('Events Clustered / Day', f"{tel['events_clustered_per_day']:,}"),
        ('Duplicate Articles Filtered / Day', f"{tel['duplicates_removed_per_day']:,}"),
        ('LLM Verification Requests / Day', f"{tel['llm_requests_per_day']:,}"),
        ('Mean End-to-End Latency', f"{tel['mean_processing_latency_ms']} ms"),
        ('Peak Ingestion Throughput', f"{tel['peak_ingestion_throughput_eps']} events/sec")
    ]

    for label, value in metrics:
        print(f"{label} & {value} \\\\")

    print(r"""\bottomrule
\end{tabular}
\end{table}
""")

def main():
    print("% ========================================================")
    print("% AUTO-GENERATED IEEE PAPER TABLES")
    print("% Generated by: generate_all_tables.py")
    print("% Copy-paste each table into your LaTeX document")
    print("% ========================================================")
    print()

    try:
        data = load_results()

        table1_system_comparison()
        print()

        table2_baseline_comparison(data)
        print()

        table3_cost_accuracy(data)
        print()

        table4_top5_sectors(data)
        print()

        table5_production_telemetry(data)

        print()
        print("% ========================================================")
        print("% END OF AUTO-GENERATED TABLES")
        print("% ========================================================")

    except Exception as e:
        print(f"% ERROR: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import sys
    main()
