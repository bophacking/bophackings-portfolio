// Topt Predictor: enzyme optimal catalytic temperature from a protein sequence (+ optional OGT), fully in the browser.
// Port of the Flask project "CompBio-Project"; maths lives in js/lib/topt-core.js (parity-tested against Flask).
function toptBody(ctx) {
  const dlg = o => dialog(Object.assign({ title: 'Topt Predictor', parent: ctx.w }, o));
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  let model = null, busy = false;
  const M = () => model || (model = FS.json(['content', 'topt', 'model.json']));
  const f1 = v => (Math.round(v * 10) / 10).toString();

  // FASTA: optional ">" header (key=value pairs are read), first record only
  function parseFasta(text) {
    let header = '', seq = [], extra = false;
    for (const ln of String(text).split(/\r?\n/)) {
      if (ln.charAt(0) === '>') { if (seq.length) { extra = true; break; } header = ln.slice(1).trim(); } else seq.push(ln);
    }
    return { header, seq: seq.join('\n').trim(), extra };
  }
  const samples = FS.kids(['content', 'topt', 'samples']).filter(n => /\.fasta$/i.test(n.name) && n.text).map(n => {
    const f = parseFasta(n.text), kv = {}; f.header.replace(/(\w+)=([\d.]+)/g, (_, k, v) => { kv[k] = Number(v); });
    return { name: n.name.replace(/\.fasta$/i, ''), seq: f.seq, topt: kv.reference_topt, ogt: kv.ogt };
  });

  // ---- Predict tab
  const sel = h('select', { class: 'sunk fld', 'aria-label': 'Sample sequence' }, h('option', { value: '', text: '(choose a sample)' }),
    samples.map((s, i) => h('option', { value: String(i), text: s.name + (s.topt != null ? '  -  reference Topt ' + s.topt + ' °C, OGT ' + s.ogt : '') })));
  const ta = h('textarea', { class: 'sunk fld seq', rows: '6', spellcheck: 'false', 'aria-label': 'Protein sequence', placeholder: 'Paste a protein sequence (plain letters or FASTA), or drop a .fasta file here...' });
  const useOgt = h('input', { type: 'checkbox' });
  const ogtIn = h('input', { type: 'number', class: 'sunk fld ogt', min: '0', max: '130', step: 'any', placeholder: 'e.g. 37', 'aria-label': 'OGT in degrees Celsius', disabled: true });
  const ref = h('div', { class: 'note' }), out = h('div', { class: 'out', role: 'status', 'aria-live': 'polite' });
  const fill = h('div', { class: 'pfill' }), bar = h('div', { class: 'pbar sunk', hidden: true, role: 'progressbar', 'aria-label': 'Predicting' }, fill);
  const go = h('button', { class: 'btn raised', type: 'button', text: 'Predict', onclick: () => run() });
  const clear = h('button', { class: 'btn raised', type: 'button', text: 'Clear', onclick: () => { ta.value = ''; ogtIn.value = ''; sel.value = ''; ref.textContent = ''; out.replaceChildren(); ta.focus(); } });
  const openBtn = h('button', { class: 'btn raised', type: 'button', text: 'Open file...', onclick: () => pickFile('.fasta,.fa,.faa,.txt', onFile) });
  useOgt.addEventListener('change', () => { ogtIn.disabled = !useOgt.checked; if (useOgt.checked) ogtIn.focus(); });
  ta.addEventListener('input', () => { ref.textContent = ''; });
  ta.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); } });
  sel.addEventListener('change', () => {
    const s = samples[+sel.value]; out.replaceChildren(); if (!s) return;
    ta.value = s.seq; ref.textContent = s.topt != null ? 'Reference Topt for this sample: ' + s.topt + ' °C (to compare with the prediction)' : '';
    if (s.ogt != null) { useOgt.checked = true; ogtIn.disabled = false; ogtIn.value = s.ogt; }
  });
  function onFile(f, err) { if (err) return dlg({ icon: 'x', text: err.message }); load(f); }
  function load(f) {
    const r = parseFasta(f.text); out.replaceChildren(); sel.value = '';
    ta.value = r.seq; ref.textContent = 'Loaded ' + f.name + (r.extra ? ' (only the first FASTA record was used)' : '') + '.';
    ta.focus();
  }
  ctx.api = { load };

  const progress = () => new Promise(res => {
    if (reduce) return res();
    bar.hidden = false; fill.style.width = '0%'; let p = 0;
    const t = setInterval(() => { p += 22 + Math.random() * 20; fill.style.width = Math.min(p, 100) + '%'; if (p >= 100) { clearInterval(t); setTimeout(() => { bar.hidden = true; res(); }, 90); } }, 55);
  });
  const thermo = v => {
    const pct = Math.max(0, Math.min(100, v / 110 * 100));
    return h('div', { class: 'thermo' }, h('div', { class: 'tbar sunk', role: 'img', 'aria-label': v.toFixed(2) + ' degrees Celsius on a 0 to 110 scale' }, h('div', { class: 'tfill', style: 'width:' + pct + '%' })),
      h('div', { class: 'tscale', 'aria-hidden': 'true' }, [0, 25, 50, 75, 100].map(t => h('span', { style: 'left:' + t / 110 * 100 + '%', text: String(t) }))));
  };
  const card = (label, v, rmse, cls) => h('div', { class: 'rcard sunk ' + cls }, h('div', { class: 'rl', text: label }), h('div', { class: 'rv', text: v.toFixed(2) + ' °C' }), thermo(v), h('div', { class: 'note', text: 'Typical error ±' + f1(rmse) + ' °C (test RMSE)' }));

  async function run() {
    if (busy) return;
    const rec = parseFasta(ta.value);
    if (!rec.seq) return dlg({ icon: 'w', text: 'Please enter a protein sequence.' });
    const a = ToptCore.analyze(rec.seq);
    if (!a) return dlg({ icon: 'w', text: 'Invalid or too-short sequence.\nUse at least 5 standard amino-acid letters (ACDEFGHIKLMNPQRSTVWY).' });
    let ogt = null;
    if (useOgt.checked) {
      const t = ogtIn.value.trim();
      if (!t) return dlg({ icon: 'w', text: 'Please enter the OGT (optimal growth temperature, °C), or untick "Include OGT".' });
      ogt = Number(t); if (!isFinite(ogt)) return dlg({ icon: 'w', text: 'OGT must be a number.' });
    }
    busy = true; go.disabled = true; out.replaceChildren();
    try {
      await progress();
      const m = M(), cards = [card('Model A — sequence only', ToptCore.predictA(m, a), m.metrics.a.rmse, 'ca')];
      if (ogt != null) cards.push(card('Model B — sequence + OGT', ToptCore.predictB(m, a, ogt), m.metrics.b.rmse, 'cb'));
      const kids = [h('div', { class: 'cards' }, cards)];
      if (cards.length === 2) kids.push(h('div', { class: 'note', text: 'Difference between models: ' + Math.abs(ToptCore.predictA(m, a) - ToptCore.predictB(m, a, ogt)).toFixed(2) + ' °C' }));
      kids.push(h('div', { class: 'note', text: a.length + ' residues · molecular weight ' + (a.mw / 1000).toFixed(1) + ' kDa · pI ' + a.pi.toFixed(2) + ' · GRAVY ' + a.gravy.toFixed(2) }));
      out.replaceChildren(...kids);
    } catch (e) { dlg({ icon: 'x', text: 'The model could not be loaded.\n' + e.message }); }
    busy = false; go.disabled = false;
  }

  const predictPanel = h('div', { class: 'pane' },
    h('div', { class: 'row' }, h('label', { text: 'Sample:' }), sel),
    h('label', { class: 'lbl', text: 'Protein sequence' }), ta,
    h('div', { class: 'row' }, h('label', { class: 'chk' }, useOgt, ' Include OGT (organism optimal growth temperature)'), ogtIn, h('span', { text: '°C' })),
    h('div', { class: 'row btns' }, go, clear, openBtn),
    bar, ref, out);

  // ---- About tab
  let m0 = null; try { m0 = M(); } catch (e) { /* shown on predict */ }
  const sec = (t, ...k) => [h('h3', { text: t }), ...k];
  const link = (href, text) => h('a', { href, target: '_blank', rel: 'noopener noreferrer', text });
  const mt = m0 && h('table', { class: 'mt' }, h('tr', {}, ['Model', 'R²', 'RMSE (°C)', 'MAE (°C)'].map(x => h('th', { text: x }))),
    [['A — sequence only', m0.metrics.a], ['B — sequence + OGT', m0.metrics.b]].map(([n, x]) => h('tr', {}, h('td', { text: n }), h('td', { text: String(x.r2) }), h('td', { text: String(x.rmse) }), h('td', { text: String(x.mae) }))));
  const aboutPanel = h('div', { class: 'pane about' },
    sec('Enzyme optimal temperature', h('p', { text: 'Predicts the temperature at which an enzyme works fastest (Topt) from its amino-acid sequence, optionally together with the optimal growth temperature (OGT) of the organism it comes from. It was a computational biology university project, built with six teammates and inspired by the work of Gado, Beckham and Payne (2020).' })),
    sec('How it works', h('p', { text: 'Each sequence becomes 23 numbers: the fraction of each of the 20 amino acids, molecular weight, isoelectric point and GRAVY hydropathy. Model A is a linear regression on those 23 numbers; Model B also uses the OGT. Both were trained with scikit-learn on 2,917 enzyme records and run here entirely in your browser: nothing is uploaded and there is no server.' })),
    sec('Accuracy', mt, h('p', { class: 'note', text: 'Test-set figures from the project report. R² of 0.28 and 0.42 means the models explain well under half of the variation, so treat predictions as rough estimates.' }),
      h('img', { class: 'fig', src: 'content/topt/comparison.png', alt: 'Scatter plots of predicted against actual Topt for Model A and Model B on the test set' })),
    sec('Limitations', h('p', { text: 'A linear model on composition ignores amino-acid order and 3D structure. Letters that are not one of the 20 standard amino acids are ignored, and at least 5 valid residues are needed. This is a learning project, not a tool for lab decisions.' })),
    sec('References', h('p', {}, 'J. E. Gado, B. C. Beckham and C. M. Payne, “Improving Enzyme Optimum Temperature Prediction with Resampling Strategies and Ensemble Learning”, J. Chem. Inf. Model. 60(8), 2020. ', link('https://doi.org/10.1021/acs.jcim.0c00489', 'doi:10.1021/acs.jcim.0c00489')),
      h('p', {}, 'Dataset: ', link('https://github.com/jafetgado/tomerdesign', 'TOMER design dataset (J. E. Gado)'), '.')));

  const t = tabs([{ label: 'Predict', el: predictPanel }, { label: 'About', el: aboutPanel }]);
  const root = h('div', { class: 'ml' }, t.el); fileDrop(root, onFile); return root;
}
