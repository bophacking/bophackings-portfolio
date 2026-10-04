#!/usr/bin/env node
// Parity test: the JS inference must reproduce the ORIGINAL Flask/sklearn/Biopython results.
// Fixtures come from tools/export-models.py. Run: node tools/parity-test.js   (exit code 1 on any failure)
const fs = require('fs'), path = require('path');
const R = p => path.join(__dirname, '..', p), J = p => JSON.parse(fs.readFileSync(R(p), 'utf8'));
const Topt = require(R('js/lib/topt-core.js')), Spice = require(R('js/lib/spice-core.js'));
let fail = 0; const bad = (m) => { fail++; if (fail <= 15) console.log('  FAIL', m); };
const close = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

// ---- Topt
const tm = J('content/topt/model.json'), tf = J('tools/parity/topt-fixtures.json');
let nFeat = 0, maxF = 0, maxP = 0, nRej = 0;
for (const c of tf.cases) {
  const a = Topt.analyze(c.raw);
  if (c.expect === null) { if (a !== null) bad('expected rejection for ' + JSON.stringify(c.raw.slice(0, 20))); else nRej++; continue; }
  if (a === null) { bad('unexpected rejection ' + JSON.stringify(c.raw.slice(0, 20))); continue; }
  if (a.vec.length !== c.expect.vec.length) { bad('vec length'); continue; }
  a.vec.forEach((v, i) => { const d = Math.abs(v - c.expect.vec[i]) / Math.max(1, Math.abs(c.expect.vec[i])); maxF = Math.max(maxF, d); if (d > 1e-9) bad('feature ' + i + ' ' + v + ' vs ' + c.expect.vec[i] + ' for ' + c.raw.slice(0, 12)); nFeat++; });
  const pa = Topt.predictA(tm, a), pb = Topt.predictB(tm, a, c.ogt);
  maxP = Math.max(maxP, Math.abs(pa - c.expect.topt_a), Math.abs(pb - c.expect.topt_b));
  if (!close(pa, c.expect.topt_a, 1e-9)) bad('topt_a ' + pa + ' vs ' + c.expect.topt_a);
  if (!close(pb, c.expect.topt_b, 1e-9)) bad('topt_b ' + pb + ' vs ' + c.expect.topt_b);
}
console.log('Topt : ' + tf.cases.length + ' sequences (' + nRej + ' correctly rejected), ' + nFeat + ' feature values; max rel feature diff ' + maxF.toExponential(2) + ', max prediction diff ' + maxP.toExponential(2) + ' C');

// ---- SPICE
const sm = J('content/spice/model.json'), se = J('tools/parity/spice-expected.json');
let nRows = 0, maxS = 0, maxProf = 0;
for (const [file, exp] of Object.entries(se.files)) {
  const out = Spice.predict(sm, Spice.parseCSV(fs.readFileSync(R('tools/parity/' + file), 'utf8')));
  if (out.skipped.length) bad(file + ': ' + out.skipped.length + ' rows skipped');
  if (out.results.length !== exp.length) { bad(file + ': row count ' + out.results.length + ' vs ' + exp.length); continue; }
  out.results.forEach((r, i) => {
    nRows++; maxS = Math.max(maxS, Math.abs(r.predicted - exp[i].pred));
    if (!close(r.predicted, exp[i].pred, 1e-9)) bad(file + ' row ' + i + ' price ' + r.predicted + ' vs ' + exp[i].pred);
    if (r.level !== exp[i].level) bad(file + ' row ' + i + ' level ' + r.level + ' vs ' + exp[i].level);
    if ((r.profit === null) !== (exp[i].profit === null)) bad(file + ' row ' + i + ' profit null mismatch');
    else if (r.profit !== null) { maxProf = Math.max(maxProf, Math.abs(r.profit - exp[i].profit)); if (!close(r.profit, exp[i].profit, 1e-9)) bad(file + ' row ' + i + ' profit'); }
  });
}
console.log('SPICE: ' + Object.keys(se.files).length + ' files, ' + nRows + ' rows; max price diff ' + maxS.toExponential(2) + ' RM, max profit diff ' + maxProf.toExponential(2) + ' RM');
console.log(fail ? ('\n' + fail + ' FAILURE(S)') : '\nPARITY OK');
process.exit(fail ? 1 : 0);
