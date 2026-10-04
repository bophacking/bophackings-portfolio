// SPICE (Restaurant Price Picker): upload a menu CSV, get predicted selling price, price level and profit estimate.
// Port of the Flask project "SPICE"; maths lives in js/lib/spice-core.js (parity-tested against Flask).
function spiceBody(ctx) {
  const dlg = o => dialog(Object.assign({ title: 'SPICE', parent: ctx.w }, o));
  const SHOW = 500;
  let model = null, cur = null, sk = null, sd = 1;
  const M = () => model || (model = FS.json(['content', 'spice', 'model.json']));
  const f2 = v => v == null ? '' : v.toFixed(2);

  const status = h('div', { class: 'xs sunk', text: 'Open a CSV file to begin.' });
  const warn = h('div', { class: 'warn', hidden: true, role: 'alert' });
  const wrap = h('div', { class: 'tablewrap sunk' });
  const empty = () => { const m = M(); wrap.replaceChildren(h('div', { class: 'emptyhint' },
    h('p', { text: 'Open a menu CSV, load a sample, or drop a .csv file onto this window.' }),
    h('p', { class: 'note', text: 'Needs: ' + m.numeric.join(', ') + ', ' + Object.keys(m.categories).join(', ') + '.' }))); };

  function draw() {
    if (!cur) return;
    let rows = cur.out.results.map((r, i) => ({ r, i }));
    if (sk) rows.sort((a, b) => { const x = a.r[sk], y = b.r[sk]; return sd * ((x == null) - (y == null) || (typeof x === 'string' ? x.localeCompare(y) : x - y)) || a.i - b.i; });
    const hasActual = cur.out.results.some(r => r.actual != null);
    const cols = [['name', 'Menu item'], ['predicted', 'Predicted price'], ['level', 'Price level'], ['profit', 'Profit estimate']].concat(hasActual ? [['actual', 'Actual price']] : []);
    const head = h('tr', {}, cols.map(([k, l]) => h('th', { 'aria-sort': sk === k ? (sd > 0 ? 'ascending' : 'descending') : 'none' },
      h('button', { type: 'button', text: l + (sk === k ? (sd > 0 ? ' ▲' : ' ▼') : ''), onclick: () => { sd = sk === k ? -sd : 1; sk = k; draw(); } }))));
    const body = rows.slice(0, SHOW).map(({ r }) => h('tr', {}, h('td', { text: r.name }), h('td', { class: 'n', text: f2(r.predicted) }), h('td', { class: 'lv ' + r.level.toLowerCase(), text: r.level }), h('td', { class: 'n', text: f2(r.profit) }), hasActual ? h('td', { class: 'n', text: f2(r.actual) }) : null));
    wrap.replaceChildren(h('table', { class: 'rt' }, h('thead', {}, head), h('tbody', {}, body)));
    const n = cur.out.results.length;
    status.textContent = n + ' row(s) predicted from ' + cur.name + (n > SHOW ? ' — showing the first ' + SHOW + '; Save results has all of them' : '');
    if (cur.out.warnings.length) { warn.hidden = false; warn.replaceChildren(h('div', { class: 'wi', text: '!' }), h('ul', {}, cur.out.warnings.map(w => h('li', { text: w })))); } else warn.hidden = true;
  }
  function load(f) {
    let parsed, out;
    try { parsed = SpiceCore.parseCSV(f.text); if (!parsed.rows.length) return dlg({ icon: 'w', text: 'That CSV has no data rows.' }); out = SpiceCore.predict(M(), parsed); }
    catch (e) { return dlg({ icon: 'x', text: 'Could not read that file.\n' + e.message }); }
    if (!out.results.length) return dlg({ icon: 'w', text: 'No rows could be predicted.\n' + out.warnings.join('\n') });
    cur = { name: f.name, out }; sk = null; sd = 1; draw();
  }
  const onFile = (f, err) => err ? dlg({ icon: 'x', text: err.message }) : load(f);
  const sample = (file, label) => { const n = FS.node(['content', 'spice', file]); n && n.text ? load({ name: file, text: n.text }) : dlg({ icon: 'w', text: label + ' is not available.' }); };
  const q = v => /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  function save() {
    if (!cur) return dlg({ icon: 'i', text: 'There are no results to save yet.' });
    const act = cur.out.results.some(r => r.actual != null);
    const lines = [['menu_item_name', 'predicted_selling_price', 'price_level', 'profit_estimation'].concat(act ? ['actual_selling_price'] : []).join(',')];
    cur.out.results.forEach(r => lines.push([q(r.name), f2(r.predicted), r.level, f2(r.profit)].concat(act ? [f2(r.actual)] : []).join(',')));
    download('spice-results.csv', lines.join('\r\n') + '\r\n', 'text/csv');
  }
  ctx.api = { load };

  const bar = menuBar({
    File: [['Open CSV...', () => pickFile('.csv,text/csv', onFile)], ['Save results...', save], '-', ['Exit', () => ctx.close()]],
    Sample: [['Project sample input', () => sample('sample-input.csv', 'The sample')], ['Real rows from the training data', () => sample('sample-training-rows.csv', 'The sample')]],
    Help: [['About SPICE', () => tabsCtl.select(1)]]
  });
  const btn = (text, fn) => h('button', { class: 'btn raised', type: 'button', text, onclick: fn });
  const tool = h('div', { class: 'xt' }, btn('Open CSV...', () => pickFile('.csv,text/csv', onFile)), btn('Sample', () => sample('sample-training-rows.csv', 'The sample')), btn('Save results...', save));
  const predictPanel = h('div', { class: 'pane flex' }, tool, warn, wrap, status);
  try { empty(); } catch (e) { wrap.textContent = 'The model could not be loaded: ' + e.message; }

  // ---- About
  const sec = (t, ...k) => [h('h3', { text: t }), ...k];
  const link = (href, text) => h('a', { href, target: '_blank', rel: 'noopener noreferrer', text });
  let m0 = null; try { m0 = M(); } catch (e) { /* shown elsewhere */ }
  const vocab = m0 && h('table', { class: 'mt' }, Object.entries(m0.categories).map(([c, v]) => h('tr', {}, h('th', { text: c }), h('td', { text: v.values.join(', ') }))));
  const aboutPanel = h('div', { class: 'pane about' },
    sec('SPICE — Restaurant Price Picker', h('p', { text: 'My first machine-learning project. Give it a menu as a CSV file and a linear-regression model estimates the selling price of every item, labels it Cheap, Average or Expensive, and works out a rough profit. It runs entirely in your browser, so nothing is uploaded.' })),
    sec('How the answers are made', h('p', { text: 'Price: linear regression on the numeric columns plus one-hot encoded restaurant type, meal type, weekday, category and cuisine. Price level: under 9 is Cheap, under 14 is Average, otherwise Expensive. Profit estimate: predicted price minus typical ingredient cost.' })),
    sec('Accuracy', h('p', { text: m0 ? 'On a held-out 20% test split of ' + m0.dataset.rows.toLocaleString('en-US') + ' menu records the model scores R² ' + m0.metrics.r2 + ' with a mean absolute error of ' + m0.metrics.mae + '.' : '' }),
      h('img', { class: 'fig', src: 'content/spice/plot.png', alt: 'Scatter plot of predicted against actual price on the test set' })),
    sec('Accepted values', h('p', { class: 'note', text: 'The model only knows these values. Anything else is treated like the first one in each list (the baseline), and SPICE will warn you.' }), vocab),
    sec('Limitations', h('p', { text: 'A straight-line model cannot capture everything about pricing, and it only knows Malaysian restaurant data. Treat the output as a rough guide.' })),
    sec('Credit', h('p', {}, 'Dataset by jordanchan20 on Kaggle: ', link('https://www.kaggle.com/datasets/jordanchan20/restaurant-menu-price', 'Restaurant menu price'), '.')));
  const tabsCtl = tabs([{ label: 'Predict', el: predictPanel }, { label: 'About', el: aboutPanel }]);
  const root = h('div', { class: 'ml' }, bar, tabsCtl.el); fileDrop(root, onFile); return root;
}
