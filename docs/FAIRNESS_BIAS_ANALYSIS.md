# Fairness, Bias, and Source Suppression Analysis of Publisher Credibility Models

*Reference document for IEEE paper revision Section J & Appendix.*

---

## 1. Ethical & Systemic Risks of Dynamic Publisher Credibility Scoring (DPCS)

The Dynamic Publisher Credibility Scoring (DPCS) mechanism utilizes Exponential Moving Averages (EMA) over historical agreement rates ($R_{\text{agree}}$) to adjust an outlet's trust score $C_{\text{pub}}(t) \in [0, 100]$. While designed to mitigate hallucination propagation and false event clustering from unverified blogs, such automated credibility scoring introduces three critical ethical and operational risks:

### 1.1 Minority Voice & Independent Outlet Suppression
Established mainstream news agencies (e.g., Reuters, Associated Press, BBC) dominate the training corpus and feed frequency. When an independent, local, or investigative media outlet breaks a novel breaking news event that mainstream wires have not yet reported:
- The agreement ratio $R_{\text{agree}}$ for the novel claim evaluates to neutral ($N_{\text{neu}}$) or unsupported ($N_{\text{contra}}$) relative to existing clusters.
- An unweighted credibility filter risks downweighting or gating out breaking investigative coverage prior to mainstream confirmation.

### 1.2 Algorithmic Confirmation Bias & Echo Chambers
If the credibility updating formula strictly rewards outlets that agree with existing majority event clusters ($R_{\text{agree}} = (N_{\text{sup}} + 0.5 N_{\text{neu}})/N_{\text{tot}}$), the system mathematically penalizes legitimate dissenting reporting or early corrections. Outlets reporting early retracted details could face credibility decay despite being factual.

---

## 2. Architectural Mitigations Implemented in Equation 9

To prevent automated source suppression while retaining anti-hallucination benefits, Equation 9 enforces a mathematical floor constraint:

$$\mathcal{S}_{\text{EFSA+DPCS}} = \mathcal{S}_{\text{EFSA}} \times \left( 0.80 + 0.20 \times \frac{C_{\text{pub}}}{100} \right)$$

### 2.1 The 80% Signal Floor Guarantee
- **Maximum Penalty Limit**: Even if an outlet has a zero credibility score ($C_{\text{pub}} = 0$), its EFSA similarity score is multiplied by a factor of $0.80$ (a maximum penalty of 20%).
- **Breaking News Exemption**: If an independent outlet reports a headline with high lexical or semantic evidence ($\mathcal{S}_{\text{EFSA}} \ge 0.275$), it still passes the production gate ($\tau_{\text{EFSA}} = 0.22$) regardless of historical credibility score.
- **Zero Absolute Blacklisting**: DPCS NEVER acts as a hard filter ($C_{\text{pub}} = 0 \centernot\implies \text{Blocked}$). It acts solely as a soft prior modulation.

---

## 3. Production Recommendation & Future Directions

1. **Experimental Classification**: DPCS is categorized as an *experimental evaluation component* rather than a mandatory production gate.
2. **Minimum History Safeguard**: DPCS updates should only influence gating decisions when a publisher has established $N_{\text{tot}} \ge 10$ historical dispatches.
3. **Graph-Based Trust Propagation**: Future iterations will replace single-outlet EMA tracking with PageRank-style source graph trust networks to account for syndication and primary reporting attribution.
