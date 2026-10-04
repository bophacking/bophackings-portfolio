// Topt inference core (no DOM). Port of compbio-project/app.py compute_features + Biopython 1.88 ProteinAnalysis
// (molecular_weight, isoelectric_point, gravy) so a LinearRegression exported to JSON runs in the browser.
// Works as a plain <script> (window.ToptCore) and in Node (module.exports) for tools/parity-test.js.
(function (root) {
  'use strict';
  const AA = 'ACDEFGHIKLMNPQRSTVWY';
  // Bio.Data.IUPACData.protein_weights (average masses) and the water lost per peptide bond
  const MASS = { A: 89.0932, C: 121.1582, D: 133.1027, E: 147.1293, F: 165.1891, G: 75.0666, H: 155.1546, I: 131.1729, K: 146.1876, L: 131.1729, M: 149.2113, N: 132.1179, P: 115.1305, Q: 146.1445, R: 174.201, S: 105.0926, T: 119.1192, V: 117.1463, W: 204.2252, Y: 181.1885 };
  const WATER = 18.0153;
  // Kyte-Doolittle hydropathy (Bio.SeqUtils.ProtParamData.kd)
  const KD = { A: 1.8, R: -4.5, N: -3.5, D: -3.5, C: 2.5, Q: -3.5, E: -3.5, G: -0.4, H: -3.2, I: 4.5, L: 3.8, K: -3.9, M: 1.9, F: 2.8, P: -1.6, S: -0.8, T: -0.7, W: -0.9, Y: -1.3, V: 4.2 };
  // Bio.SeqUtils.IsoelectricPoint tables. Order matters: it is the summation order Biopython uses.
  const POS = [['Nterm', 7.5], ['K', 10.0], ['R', 12.0], ['H', 5.98]];
  const NEG = [['Cterm', 3.55], ['D', 4.05], ['E', 4.45], ['C', 9.0], ['Y', 10.0]];
  const PK_N = { A: 7.59, M: 7.0, S: 6.93, P: 8.36, T: 6.82, V: 7.44, E: 7.7 };
  const PK_C = { D: 4.55, E: 4.75 };

  function clean(raw) {
    let out = '';
    for (const ch of String(raw).toUpperCase()) if (AA.indexOf(ch) >= 0) out += ch;
    return out;
  }
  function isoelectricPoint(seq, counts) {
    const content = { Nterm: 1, Cterm: 1, K: counts.K, R: counts.R, H: counts.H, D: counts.D, E: counts.E, C: counts.C, Y: counts.Y };
    const pos = POS.map(([k, v]) => [k, v]), neg = NEG.map(([k, v]) => [k, v]);
    if (PK_N[seq[0]] !== undefined) pos[0][1] = PK_N[seq[0]];
    if (PK_C[seq[seq.length - 1]] !== undefined) neg[0][1] = PK_C[seq[seq.length - 1]];
    const charge = pH => {
      let p = 0, n = 0;
      for (const [k, pK] of pos) p += content[k] * (1.0 / (Math.pow(10, pH - pK) + 1.0));
      for (const [k, pK] of neg) n += content[k] * (1.0 / (Math.pow(10, pK - pH) + 1.0));
      return p - n;
    };
    let pH = 7.775, lo = 4.05, hi = 12;           // bisection exactly as IsoelectricPoint.pi()
    for (;;) {
      const c = charge(pH);
      if (hi - lo > 0.0001) { if (c > 0) lo = pH; else hi = pH; pH = (lo + hi) / 2; } else return pH;
    }
  }
  // -> null when fewer than 5 valid residues (same rule as the Flask app), else the feature vector + readable stats
  function analyze(raw) {
    const s = clean(raw);
    if (s.length < 5) return null;
    const counts = {}; for (const a of AA) counts[a] = 0;
    let mass = 0, kd = 0;
    for (const ch of s) { counts[ch] += 1; mass += MASS[ch]; kd += KD[ch]; }
    const n = s.length, mw = mass - (n - 1) * WATER, gravy = kd / n, pi = isoelectricPoint(s, counts);
    const vec = []; for (const a of AA) vec.push(counts[a] / n);
    vec.push(mw, pi, gravy);
    return { length: n, vec, mw, pi, gravy };
  }
  const dot = (coef, x, b) => { let t = 0; for (let i = 0; i < coef.length; i++) t += coef[i] * x[i]; return t + b; };
  const predictA = (model, a) => dot(model.model_a.coef, a.vec, model.model_a.intercept);
  const predictB = (model, a, ogt) => dot(model.model_b.coef, a.vec.concat([ogt]), model.model_b.intercept);
  const api = { AA, clean, analyze, predictA, predictB };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ToptCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
