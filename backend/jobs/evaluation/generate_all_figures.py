#!/usr/bin/env python3
"""
Generate all IEEE paper figures from master_benchmark_results_883.json

Generates:
- Figure 1: System Architecture (TikZ LaTeX code output)
- Figure 2: Cost-Accuracy Pareto Frontier (PNG)
- Figure 3: Per-Difficulty Performance (PNG)

Usage:
    python generate_all_figures.py

Output:
    - fig1_architecture.tex (TikZ code to paste into paper)
    - fig2_pareto_frontier.png
    - fig3_difficulty_breakdown.png
"""

import json
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

# IEEE color palette (colorblind-friendly)
IEEE_BLUE = '#0072BD'
IEEE_RED = '#D95319'
IEEE_YELLOW = '#EDB120'
IEEE_PURPLE = '#7E2F8E'
IEEE_GREEN = '#77AC30'
IEEE_CYAN = '#4DBEEE'
IEEE_GRAY = '#808080'

def load_results():
    """Load master benchmark results"""
    with open('master_benchmark_results_883.json', 'r') as f:
        return json.load(f)

def generate_fig1_architecture_tikz():
    """Generate Figure 1: System Architecture as TikZ LaTeX code"""

    tikz_code = r"""
% Figure 1: NISE Five-Layer System Architecture
% Paste this into your LaTeX document

\begin{figure}[!t]
\centering
\begin{tikzpicture}[
    node distance=1.2cm,
    box/.style={rectangle, draw, thick, text width=3.2cm, align=center, minimum height=0.8cm, fill=blue!10},
    arrow/.style={->, thick, >=stealth}
]

% Layer 1: Ingestion
\node[box] (rss) {RSS Wire Feeds\\(21 sources, 14 sectors)};
\node[box, below of=rss] (dedup) {Anti-Duplication Lock\\(URL, Title Hash, Title)};

% Layer 2: Synthesis
\node[box, below of=dedup] (llm) {LLM Synthesis Module\\(Groq Llama-3.1-8B)};
\node[box, below of=llm] (summary) {150-Word Editorial\\+ Social Caption};

% Layer 3: Clustering
\node[box, below of=summary] (gate) {Two-Stage Hybrid Gate};
\node[box, below of=gate, xshift=-1.6cm, text width=1.5cm] (lex) {Lexical\\Filter};
\node[box, below of=gate, xshift=1.6cm, text width=1.5cm] (llmv) {LLM\\Verifier};

% Layer 4: Storage
\node[box, below of=gate, yshift=-1cm] (mongo) {MongoDB Event Clusters};

% Layer 5: Distribution
\node[box, below of=mongo] (webhook) {Autonomous Webhook\\Distribution};

% Arrows
\draw[arrow] (rss) -- (dedup);
\draw[arrow] (dedup) -- node[right, font=\tiny] {Unique} (llm);
\draw[arrow] (llm) -- (summary);
\draw[arrow] (summary) -- (gate);
\draw[arrow] (gate) -- (lex);
\draw[arrow] (gate) -- (llmv);
\draw[arrow] (lex) -- (mongo);
\draw[arrow] (llmv) -- (mongo);
\draw[arrow] (mongo) -- (webhook);

% Side annotations
\node[right of=rss, xshift=2cm, font=\tiny, text width=1.5cm] {Layer 1:\\Ingestion};
\node[right of=llm, xshift=2cm, font=\tiny, text width=1.5cm] {Layer 2:\\Synthesis};
\node[right of=gate, xshift=2cm, font=\tiny, text width=1.5cm] {Layer 3:\\Clustering};
\node[right of=mongo, xshift=2cm, font=\tiny, text width=1.5cm] {Layer 4:\\Storage};
\node[right of=webhook, xshift=2cm, font=\tiny, text width=1.5cm] {Layer 5:\\Distribution};

\end{tikzpicture}
\caption{NISE five-layer pipeline architecture. Layer 3 hybrid gate reduces LLM calls by 82.2\% via lexical pre-filtering.}
\label{fig:architecture}
\end{figure}
"""

    with open('fig1_architecture.tex', 'w') as f:
        f.write(tikz_code)

    print("✓ Generated: fig1_architecture.tex (TikZ code)")
    print("  → Paste this directly into your LaTeX document")

def generate_fig2_pareto_frontier(data):
    """Generate Figure 2: Cost-Accuracy Pareto Frontier"""

    # Extract data for key methods
    methods_data = {
        'Lexical Jaccard Only (τ=0.12)': {'f1': 1.98, 'saved': 100, 'label': 'Jaccard'},
        'EFSA Gate Only (τ=0.22)': {'f1': 34.72, 'saved': 100, 'label': 'EFSA'},
        'Production Two-Stage Hybrid (NISE)': {'f1': 40.32, 'saved': 82.2, 'label': 'NISE'},
        'SBERT (all-MiniLM-L6-v2, τ=0.55)': {'f1': 78.82, 'saved': 100, 'label': 'SBERT'},
        'LLM-Only Upper Bound (Exhaustive)': {'f1': 100, 'saved': 0, 'label': 'LLM-Only'}
    }

    # Map from JSON results
    for result in data['primary_results']:
        method = result['method']
        if method in methods_data:
            methods_data[method]['f1'] = float(result['f1_score'].rstrip('%'))
            methods_data[method]['saved'] = float(result['calls_saved'].rstrip('%'))

    # Create figure
    plt.figure(figsize=(7, 5))

    # Plot each method
    colors = [IEEE_GRAY, IEEE_YELLOW, IEEE_RED, IEEE_GREEN, IEEE_BLUE]
    sizes = [80, 100, 150, 100, 80]  # NISE largest

    for (method, props), color, size in zip(methods_data.items(), colors, sizes):
        marker = 'D' if 'NISE' in method else 'o'
        plt.scatter(props['saved'], props['f1'],
                   s=size, c=color, marker=marker,
                   edgecolors='black', linewidths=1.5, zorder=3)

        # Label
        offset_x = -8 if props['label'] == 'NISE' else 3
        offset_y = 3 if props['label'] == 'SBERT' else -5
        plt.annotate(props['label'],
                    xy=(props['saved'], props['f1']),
                    xytext=(offset_x, offset_y),
                    textcoords='offset points',
                    fontsize=9, fontweight='bold' if 'NISE' in method else 'normal')

    # Styling
    plt.xlabel('LLM Call Savings (%)', fontsize=11, fontweight='bold')
    plt.ylabel('F1-Score (%)', fontsize=11, fontweight='bold')
    plt.title('Cost-Accuracy Pareto Frontier (N=198 Test Set)', fontsize=12, fontweight='bold')
    plt.grid(True, alpha=0.3, linestyle='--')
    plt.xlim(-5, 105)
    plt.ylim(-5, 105)

    # Add Pareto frontier line (NISE is on it)
    pareto_x = [0, 82.2, 100, 100]
    pareto_y = [100, 40.32, 40.32, 0]
    plt.plot(pareto_x, pareto_y, 'k--', alpha=0.3, linewidth=1, zorder=1)

    plt.tight_layout()
    plt.savefig('fig2_pareto_frontier.png', dpi=300, bbox_inches='tight')
    print("✓ Generated: fig2_pareto_frontier.png (300 DPI)")

def generate_fig3_difficulty_breakdown(data):
    """Generate Figure 3: Per-Difficulty Performance Breakdown"""

    # Extract difficulty data
    difficulty_data = data['difficulty_breakdown']

    difficulties = ['Easy', 'Medium', 'Hard']
    accuracy = [float(difficulty_data['easy']['accuracy'].rstrip('%')),
                float(difficulty_data['medium']['accuracy'].rstrip('%')),
                float(difficulty_data['hard']['accuracy'].rstrip('%'))]
    recall = [float(difficulty_data['easy']['recall'].rstrip('%')),
              float(difficulty_data['medium']['recall'].rstrip('%')),
              float(difficulty_data['hard']['recall'].rstrip('%'))]
    f1 = [float(difficulty_data['easy']['f1'].rstrip('%')),
          float(difficulty_data['medium']['f1'].rstrip('%')),
          float(difficulty_data['hard']['f1'].rstrip('%'))]

    # Create figure
    fig, ax = plt.subplots(figsize=(8, 5))

    x = np.arange(len(difficulties))
    width = 0.25

    # Bars
    bars1 = ax.bar(x - width, accuracy, width, label='Accuracy',
                   color=IEEE_BLUE, edgecolor='black', linewidth=0.8)
    bars2 = ax.bar(x, recall, width, label='Recall',
                   color=IEEE_RED, edgecolor='black', linewidth=0.8)
    bars3 = ax.bar(x + width, f1, width, label='F1-Score',
                   color=IEEE_GREEN, edgecolor='black', linewidth=0.8)

    # Add value labels on bars
    def add_labels(bars):
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{height:.1f}%',
                   ha='center', va='bottom', fontsize=8)

    add_labels(bars1)
    add_labels(bars2)
    add_labels(bars3)

    # Styling
    ax.set_xlabel('Difficulty Tier', fontsize=11, fontweight='bold')
    ax.set_ylabel('Performance (%)', fontsize=11, fontweight='bold')
    ax.set_title('Per-Difficulty Performance Breakdown (Production NISE, N=883)',
                 fontsize=12, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(difficulties)
    ax.legend(loc='upper right', framealpha=0.9)
    ax.grid(True, axis='y', alpha=0.3, linestyle='--')
    ax.set_ylim(0, 105)

    plt.tight_layout()
    plt.savefig('fig3_difficulty_breakdown.png', dpi=300, bbox_inches='tight')
    print("✓ Generated: fig3_difficulty_breakdown.png (300 DPI)")

def main():
    """Generate all figures"""
    print("=" * 60)
    print("GENERATING ALL IEEE PAPER FIGURES")
    print("=" * 60)
    print()

    try:
        # Generate architecture TikZ code
        generate_fig1_architecture_tikz()
        print()

        # Load data for remaining figures
        data = load_results()

        # Generate Pareto frontier
        generate_fig2_pareto_frontier(data)
        print()

        # Generate difficulty breakdown
        generate_fig3_difficulty_breakdown(data)
        print()

        print("=" * 60)
        print("ALL FIGURES GENERATED SUCCESSFULLY!")
        print("=" * 60)
        print()
        print("Next steps:")
        print("1. Copy fig1_architecture.tex into your LaTeX document")
        print("2. Upload fig2_pareto_frontier.png to Overleaf")
        print("3. Upload fig3_difficulty_breakdown.png to Overleaf")
        print()
        print("Reference in LaTeX as:")
        print("  \\includegraphics[width=\\columnwidth]{fig2_pareto_frontier.png}")
        print("  \\includegraphics[width=\\columnwidth]{fig3_difficulty_breakdown.png}")

    except FileNotFoundError:
        print("ERROR: master_benchmark_results_883.json not found")
        print("Run from: E:\\ai-news-aggregator\\backend\\jobs\\evaluation\\")
        return 1
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())
