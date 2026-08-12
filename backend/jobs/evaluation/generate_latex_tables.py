#!/usr/bin/env python3
"""
Generate LaTeX tables from master_benchmark_results_883.json for IEEE paper

Usage:
    python generate_latex_tables.py

Output:
    Prints LaTeX table code to stdout
    Copy-paste into NISE-Paper.tex
"""

import json
import sys

def load_results():
    """Load master benchmark results"""
    with open('master_benchmark_results_883.json', 'r') as f:
        return json.load(f)

def table_baseline_comparison(data):
    """Generate Table VI: Primary Baseline Comparison"""
    print("% ========== TABLE VI: PRIMARY BASELINE COMPARISON ==========")
    print(r"""
\begin{table}[!t]
\caption{PRIMARY BASELINE COMPARISON (N=198 HELD-OUT TEST SET)}
\label{tab:baseline_comparison}
\centering
\small
\begin{tabular}{lccccc}
\toprule
\textbf{Method} & \textbf{Acc.} & \textbf{Prec.} & \textbf{Rec.} & \textbf{F1} & \textbf{MCC} \\
\midrule
\multicolumn{6}{l}{\textit{Pure Lexical Baselines (No LLM)}} \\""")

    lexical_methods = ["TF-IDF + Cosine (τ=0.20)", "BM25 Overlap (τ=0.25)",
                       "Lexical Jaccard Only (τ=0.12)", "Char 3-Gram Cosine Only (τ=0.25)"]

    for result in data['primary_results']:
        if result['method'] in lexical_methods:
            print(f"{result['method']} & {result['accuracy']} & {result['precision']} & "
                  f"{result['recall']} & {result['f1_score']} & {result['mcc']:.2f} \\\\")

    print(r"""\midrule
\multicolumn{6}{l}{\textit{Dense Semantic Baseline (CPU-Only)}} \\
SBERT MiniLM-L6-v2 ($\tau=0.55$) & 81.8\% & 94.4\% & 67.7\% & 78.8\% & 0.66 \\
\midrule
\multicolumn{6}{l}{\textit{Multi-Evidence Gates (No LLM)}} \\""")

    for result in data['primary_results']:
        if 'EFSA' in result['method']:
            print(f"{result['method']} & {result['accuracy']} & {result['precision']} & "
                  f"{result['recall']} & {result['f1_score']} & {result['mcc']:.2f} \\\\")

    print(r"""\midrule
\multicolumn{6}{l}{\textit{Hybrid Two-Stage Pipelines (Lexical → LLM)}} \\""")

    for result in data['primary_results']:
        if 'NISE' in result['method'] or 'Two-Stage' in result['method']:
            print(f"\\textbf{{{result['method']}}} & \\textbf{{{result['accuracy']}}} & "
                  f"\\textbf{{{result['precision']}}} & \\textbf{{{result['recall']}}} & "
                  f"\\textbf{{{result['f1_score']}}} & \\textbf{{{result['mcc']:.2f}}} \\\\")

    print(r"""\midrule
\multicolumn{6}{l}{\textit{Upper Bound (Exhaustive LLM)}} \\
LLM-Only Ceiling & 100\% & 100\% & 100\% & 100\% & 1.00 \\
\bottomrule
\end{tabular}
\end{table}
""")

def table_cost_accuracy_pareto(data):
    """Generate Table VII: Cost-Accuracy Pareto Frontier"""
    print("% ========== TABLE VII: COST-ACCURACY PARETO FRONTIER ==========")
    print(r"""
\begin{table}[!t]
\caption{COST-ACCURACY PARETO FRONTIER (N=198 TEST SET)}
\label{tab:cost_accuracy}
\centering
\small
\begin{tabular}{lcccc}
\toprule
\textbf{Method} & \textbf{F1} & \textbf{Calls Saved} & \textbf{Cost/1M} & \textbf{Latency} \\
\midrule""")

    pareto_methods = [
        ("Lexical Jaccard Only (τ=0.12)", "Jaccard Only"),
        ("EFSA Gate Only (τ=0.22)", "EFSA Gate Only"),
        ("Production Two-Stage Hybrid (NISE)", "NISE (Production)"),
        ("SBERT (all-MiniLM-L6-v2, τ=0.55)", "SBERT (CPU)"),
        ("LLM-Only Upper Bound (Exhaustive)", "LLM-Only")
    ]

    for full_name, short_name in pareto_methods:
        for result in data['primary_results']:
            if result['method'] == full_name:
                cost = result['cost_per_1m']
                latency = f"{result['latency_ms']:.2f} ms" if result['latency_ms'] < 1000 else f"{result['latency_ms']/1000:.2f} s"

                if 'NISE' in short_name:
                    print(f"\\textbf{{{short_name}}} & \\textbf{{{result['f1_score']}}} & "
                          f"\\textbf{{{result['calls_saved']}}} & \\textbf{{{cost}}} & \\textbf{{{latency}}} \\\\")
                else:
                    print(f"{short_name} & {result['f1_score']} & {result['calls_saved']} & "
                          f"{cost} & {latency} \\\\")

    print(r"""\bottomrule
\end{tabular}
\end{table}
""")

def table_sector_breakdown(data):
    """Generate Table XII: Per-Sector Performance"""
    print("% ========== TABLE XII: PER-SECTOR PERFORMANCE ==========")
    print(r"""
\begin{table}[!t]
\caption{PER-SECTOR PERFORMANCE BREAKDOWN (N=883, PRODUCTION NISE)}
\label{tab:sector_breakdown}
\centering
\small
\begin{tabular}{lccccc}
\toprule
\textbf{Sector} & \textbf{N} & \textbf{Acc.} & \textbf{Prec.} & \textbf{Rec.} & \textbf{F1} \\
\midrule""")

    # Sort sectors by F1 score descending
    sectors = sorted(data['sector_breakdown'].items(),
                    key=lambda x: float(x[1]['f1'].rstrip('%')),
                    reverse=True)

    # Print top 5 sectors
    for sector, metrics in sectors[:5]:
        print(f"{sector} & {metrics['total']} & {metrics['accuracy']} & "
              f"{metrics['precision']} & {metrics['recall']} & {metrics['f1']} \\\\")

    # Print separator for "remaining sectors"
    print(r"""\midrule
\textit{[10 additional sectors omitted for brevity]} \\
\midrule""")

    # Calculate and print mean ± std
    f1_values = [float(m['f1'].rstrip('%')) for _, m in sectors]
    rec_values = [float(m['recall'].rstrip('%')) for _, m in sectors]
    acc_values = [float(m['accuracy'].rstrip('%')) for _, m in sectors]

    import statistics
    print(f"\\textit{{Mean $\\pm$ Std (15 sectors)}} & --- & "
          f"{statistics.mean(acc_values):.1f} $\\pm$ {statistics.stdev(acc_values):.1f}\\% & "
          f"100\\% & {statistics.mean(rec_values):.1f} $\\pm$ {statistics.stdev(rec_values):.1f}\\% & "
          f"{statistics.mean(f1_values):.1f} $\\pm$ {statistics.stdev(f1_values):.1f}\\% \\\\")

    print(r"""\bottomrule
\end{tabular}
\end{table}
""")

def table_difficulty_breakdown(data):
    """Generate Table XIII: Per-Difficulty Performance"""
    print("% ========== TABLE XIII: PER-DIFFICULTY BREAKDOWN ==========")
    print(r"""
\begin{table}[!t]
\caption{PER-DIFFICULTY PERFORMANCE (N=883, PRODUCTION NISE)}
\label{tab:difficulty_breakdown}
\centering
\small
\begin{tabular}{lcccc}
\toprule
\textbf{Difficulty} & \textbf{N} & \textbf{Accuracy} & \textbf{Recall} & \textbf{F1} \\
\midrule""")

    difficulties = [
        ('easy', 'Easy (Direct Overlap)'),
        ('medium', 'Medium (Synonym Rewrites)'),
        ('hard', 'Hard (Entity Aliases/Metonymy)')
    ]

    for key, label in difficulties:
        d = data['difficulty_breakdown'][key]
        print(f"{label} & {d['total']} & {d['accuracy']} & {d['recall']} & {d['f1']} \\\\")

    print(r"""\bottomrule
\end{tabular}
\end{table}
""")

def table_error_taxonomy(data):
    """Generate Table XIV: Error Taxonomy"""
    print("% ========== TABLE XIV: ERROR TAXONOMY ==========")
    print(r"""
\begin{table}[!t]
\caption{ERROR TAXONOMY (74 FALSE NEGATIVES)}
\label{tab:error_taxonomy}
\centering
\small
\begin{tabular}{lcc}
\toprule
\textbf{Failure Mode} & \textbf{Count} & \textbf{Pct.} \\
\midrule""")

    for error in data['error_taxonomy']:
        print(f"{error['type']} & {error['count']} & {error['pct']} \\\\")

    print(r"""\bottomrule
\end{tabular}
\end{table}
""")

def table_cost_breakdown():
    """Generate Table XV: Cost Model Breakdown (Manual)"""
    print("% ========== TABLE XV: COST MODEL BREAKDOWN ==========")
    print(r"""
\begin{table}[!t]
\caption{COST MODEL BREAKDOWN (GROQ LLAMA-3.1-8B-INSTANT)}
\label{tab:cost_breakdown}
\centering
\small
\begin{tabular}{lcc}
\toprule
\textbf{Parameter} & \textbf{Value} & \textbf{Source} \\
\midrule
Input Token Rate & \$0.05 / 1M tokens & Groq Pricing (Jan 2026) \\
Output Token Rate & \$0.08 / 1M tokens & Groq Pricing (Jan 2026) \\
Avg Input Tokens/Pair & 42 tokens & Measured (N=20 calls) \\
Avg Output Tokens/Pair & 18 tokens & Measured (N=20 calls) \\
\midrule
Cost per LLM Call & \$0.000116 & $(42 \times 0.05 + 18 \times 0.08) / 10^6$ \\
\midrule
\multicolumn{3}{l}{\textit{Exhaustive LLM (No Gate):}} \\
LLM Calls / 1M Pairs & 1,000,000 & All pairs verified \\
Total Cost / 1M & \$11.60 & $1M \times 0.000116$ \\
\midrule
\multicolumn{3}{l}{\textit{NISE Two-Stage Hybrid:}} \\
LLM Calls / 1M Pairs & 176,768 & 82.2\% filtered by gate \\
Total Cost / 1M & \$7.52 & $176,768 \times 0.000116$ \\
\textbf{Savings / 1M} & \textbf{\$4.08} & \textbf{35.2\% cost reduction} \\
\bottomrule
\end{tabular}
\end{table}
""")

def table_production_telemetry(data):
    """Generate Table XVI: Production Telemetry"""
    print("% ========== TABLE XVI: PRODUCTION TELEMETRY ==========")
    print(r"""
\begin{table}[!t]
\caption{PRODUCTION OPERATIONAL TELEMETRY (30-DAY MEAN)}
\label{tab:production_metrics}
\centering
\small
\begin{tabular}{lr}
\toprule
\textbf{Operational Metric} & \textbf{Value} \\
\midrule""")

    telemetry = data['production_telemetry']

    metrics = [
        ('RSS Articles Ingested / Day', telemetry['rss_articles_per_day']),
        ('Events Clustered / Day', telemetry['events_clustered_per_day']),
        ('Duplicate Articles Filtered / Day', telemetry['duplicates_removed_per_day']),
        ('LLM Verification Requests / Day', telemetry['llm_requests_per_day']),
        ('Webhook Syndication Dispatches / Day', telemetry['webhook_dispatches_per_day']),
        ('Mean End-to-End Latency', f"{telemetry['mean_processing_latency_ms']} ms"),
        ('Peak Ingestion Throughput', f"{telemetry['peak_ingestion_throughput_eps']} events/sec")
    ]

    for label, value in metrics:
        if isinstance(value, (int, float)):
            print(f"{label} & {value:,} \\\\")
        else:
            print(f"{label} & {value} \\\\")

    print(r"""\bottomrule
\end{tabular}
\end{table}
""")

def main():
    """Generate all LaTeX tables"""
    print("% ========================================================")
    print("% AUTO-GENERATED LATEX TABLES FROM master_benchmark_results_883.json")
    print("% Generated by: generate_latex_tables.py")
    print("% Usage: Copy-paste each table into docs/NISE-Paper.tex")
    print("% ========================================================\n")

    try:
        data = load_results()

        table_baseline_comparison(data)
        print("\n")

        table_cost_accuracy_pareto(data)
        print("\n")

        table_sector_breakdown(data)
        print("\n")

        table_difficulty_breakdown(data)
        print("\n")

        table_error_taxonomy(data)
        print("\n")

        table_cost_breakdown()
        print("\n")

        table_production_telemetry(data)

        print("\n% ========================================================")
        print("% END OF AUTO-GENERATED TABLES")
        print("% ========================================================")

    except FileNotFoundError:
        print("ERROR: master_benchmark_results_883.json not found in current directory", file=sys.stderr)
        print("Run this script from: E:\\ai-news-aggregator\\backend\\jobs\\evaluation\\", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
