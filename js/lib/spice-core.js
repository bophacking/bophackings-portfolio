// SPICE inference core (no DOM). Port of spice/app.py: drop unused columns -> one-hot (get_dummies) -> align to the
// training columns (reindex, fill 0) -> LinearRegression -> price level + profit. Plain <script> or Node module.
(function (root) {
  'use strict';
  // RFC 4180-ish CSV parser (quotes, "" escapes, CRLF, BOM). Returns {header, rows:[{col:value}]}
  function parseCSV(text) {
    text = String(text).replace(/^﻿/, '');
    const recs = []; let row = [], f = '', q = false, i = 0;
    const endField = () => { row.push(f); f = ''; }, endRow = () => { endField(); recs.push(row); row = []; };
    for (; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ',') endField();
      else if (c === '\n') endRow();
      else if (c === '\r') { if (text[i + 1] === '\n') i++; endRow(); }
      else f += c;
    }
    if (f !== '' || row.length) endRow();
    const header = (recs.shift() || []).map(h => h.trim());
    const rows = recs.filter(r => !(r.length === 1 && r[0] === '')).map(r => { const o = {}; header.forEach((h, k) => { o[h] = r[k] === undefined ? '' : r[k]; }); return o; });
    return { header, rows };
  }
  const num = v => { if (v === undefined) return NaN; const t = String(v).trim(); if (t === '') return NaN; if (/^true$/i.test(t)) return 1; if (/^false$/i.test(t)) return 0; return Number(t); };
  const level = (p, pl) => p < pl.cheap_below ? 'Cheap' : (p < pl.average_below ? 'Average' : 'Expensive');

  // model: content/spice/model.json. Returns {results:[{name,predicted,level,profit,row}], warnings:[...], skipped:[{row,why}]}
  function predict(model, parsed) {
    const warnings = [], skipped = [], results = [];
    const have = new Set(parsed.header);
    const missingNum = model.numeric.filter(c => !have.has(c));
    if (missingNum.length) warnings.push('Missing numeric column(s) treated as 0: ' + missingNum.join(', ') + '. Predictions will be unreliable.');
    const missingCat = Object.keys(model.categories).filter(c => !have.has(c));
    if (missingCat.length) warnings.push('Missing column(s) treated as the baseline category: ' + missingCat.join(', ') + '.');
    const unseen = {};
    // column plan: numeric -> value, dummy "<cat>_<value>" -> 1 if row[cat] === value
    const plan = model.columns.map(name => {
      if (model.numeric.indexOf(name) >= 0) return { name, num: true };
      for (const cat of Object.keys(model.categories)) if (name.startsWith(cat + '_')) return { name, cat, val: name.slice(cat.length + 1) };
      throw new Error('Unmappable model column: ' + name);
    });
    parsed.rows.forEach((row, idx) => {
      let p = model.intercept, bad = null;
      plan.forEach((c, k) => {
        let x;
        if (c.num) { x = have.has(c.name) ? num(row[c.name]) : 0; if (Number.isNaN(x)) { bad = bad || 'missing or non-numeric "' + c.name + '"'; return; } }
        else x = row[c.cat] === c.val ? 1 : 0;
        p += model.coef[k] * x;
      });
      for (const cat of Object.keys(model.categories)) {
        const v = row[cat];
        if (v !== undefined && v !== '' && model.categories[cat].values.indexOf(v) < 0) (unseen[cat] = unseen[cat] || new Set()).add(v);
      }
      if (bad) { skipped.push({ row: idx + 2, why: bad }); return; }
      const cost = have.has('typical_ingredient_cost') ? num(row.typical_ingredient_cost) : NaN, act = have.has('actual_selling_price') ? num(row.actual_selling_price) : NaN;
      results.push({ name: row.menu_item_name === undefined ? '' : row.menu_item_name, predicted: p, level: level(p, model.price_level), profit: Number.isNaN(cost) ? null : p - cost, actual: Number.isNaN(act) ? null : act });
    });
    for (const cat of Object.keys(unseen)) warnings.push('Not seen in training, counted as the baseline "' + model.categories[cat].baseline + '" for ' + cat + ': ' + [...unseen[cat]].slice(0, 8).join(', ') + (unseen[cat].size > 8 ? ', ...' : ''));
    if (skipped.length) warnings.push(skipped.length + ' row(s) skipped (first: row ' + skipped[0].row + ', ' + skipped[0].why + ').');
    return { results, warnings, skipped };
  }
  const api = { parseCSV, predict, level };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SpiceCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
