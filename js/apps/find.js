// Find: searches file names and text contents across D: (the website). Double-click a result to open it.
function findBody(ctx) {
  const mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };
  const named = mk('input', 'dinp sunk'), text = mk('input', 'dinp sunk'), go = mk('button', 'btn raised', 'Find Now'), reset = mk('button', 'btn raised', 'New Search');
  const res = mk('div', 'xl sunk fres'), stat = mk('div', 'xs sunk', 'Type a name or some text, then press Find Now.');
  named.placeholder = 'e.g. spice'; text.placeholder = 'a word inside the file'; named.setAttribute('aria-label', 'Named'); text.setAttribute('aria-label', 'Containing text');
  const row = (l, el) => { const r = mk('label', 'frow'); r.append(mk('span', '', l), el); return r; };
  const where = row('Look in:', Object.assign(mk('div', 'fin sunk', 'PORTFOLIO (D:\\)  \u2014 including subfolders')));
  const btns = mk('div', 'fbtn'); btns.append(go, reset);
  let hits = [];
  const fmt = n => Math.max(1, Math.ceil(n / 1024)) + ' KB';
  function walk(n, parents, q, t, out) {
    (n.children || []).forEach(c => {
      if (BIN.has('D:/' + parents.concat(c.name).join('/'))) return;
      const okName = !q || c.name.toLowerCase().includes(q), okText = !t || (c.type !== 'dir' && c.text !== undefined && c.text.toLowerCase().includes(t));
      if (okName && okText) out.push({ n: c, parents: parents.slice() });
      if (c.type === 'dir') walk(c, parents.concat(c.name), q, t, out);
    });
  }
  function search() {
    const q = named.value.trim().toLowerCase(), t = text.value.trim().toLowerCase();
    if (!q && !t) { stat.textContent = 'Type a name or some text, then press Find Now.'; return; }
    hits = []; walk(window.MANIFEST, [], q, t, hits); render();
  }
  function render() {
    res.textContent = '';
    const tb = mk('table', 'bt'), hr = tb.createTHead().insertRow(); ['Name', 'In Folder', 'Size', 'Type'].forEach(x => hr.appendChild(mk('th', '', x)));
    const body = tb.createTBody();
    hits.forEach((h, i) => {
      const r = body.insertRow(); r.dataset.i = i; r.tabIndex = 0;
      const nm = r.insertCell(); nm.className = 'nm'; nm.innerHTML = ICON[h.n.type === 'dir' ? 'folder' : 'file']; nm.append(h.n.name);
      r.insertCell().textContent = 'D:\\' + h.parents.join('\\');
      const sz = r.insertCell(); sz.className = 'n'; sz.textContent = h.n.type === 'dir' ? '' : fmt(h.n.size);
      r.insertCell().textContent = FS.type(h.n);
    });
    res.append(tb); stat.textContent = hits.length + ' file(s) found';
  }
  const open = h => h.n.type === 'dir' ? openFolderWindow(['D:'].concat(h.parents, h.n.name)) : openFileNode(h.parents, h.n, o => dialog(Object.assign({ parent: ctx.w }, o)));
  res.addEventListener('click', e => { const r = e.target.closest('tr[data-i]'); res.querySelectorAll('tr.sel').forEach(x => x.classList.remove('sel')); if (r) r.classList.add('sel'); });
  res.addEventListener('dblclick', e => { const r = e.target.closest('tr[data-i]'); if (r) open(hits[+r.dataset.i]); });
  res.addEventListener('keydown', e => { const r = e.target.closest('tr[data-i]'); if (r && e.key === 'Enter') open(hits[+r.dataset.i]); });
  go.onclick = search; reset.onclick = () => { named.value = text.value = ''; hits = []; res.textContent = ''; stat.textContent = 'Type a name or some text, then press Find Now.'; named.focus(); };
  [named, text].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') search(); }));
  const top = mk('div', 'ftop'); top.append(row('Named:', named), row('Containing text:', text), where, btns);
  const root = mk('div', 'xp'); root.append(top, res, stat); setTimeout(() => named.focus(), 0); return root;
}
