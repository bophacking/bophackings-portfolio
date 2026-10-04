// My Computer / Explorer: root view (A:, C:, D:) plus the real folders on D: from FS and the one file on C:.
function explorerBody(ctx) {
  const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  const ROOT = [
    { name: '3\u00bd Floppy (A:)', icon: 'floppy', type: '3\u00bd-Inch Floppy Disk', go: ['A:'] },
    { name: '(C:)', icon: 'drive', type: 'Local Disk', go: ['C:'] },
    { name: 'PORTFOLIO (D:)', icon: 'drive', type: 'Local Disk', go: ['D:'] },
    { name: 'Printers', icon: 'printers', type: 'System Folder', omen: true },
    { name: 'Control Panel', icon: 'ctrl', type: 'System Folder', omen: true },
    { name: 'Dial-Up Networking', icon: 'dialup', type: 'System Folder', dial: true }];
  const VIEWS = [['large', 'Large Icons'], ['small', 'Small Icons'], ['list', 'List'], ['details', 'Details']];
  const SORTS = [['name', 'by Name'], ['type', 'by Type'], ['size', 'by Size']];
  let path = (ctx.opts && ctx.opts.path || []).slice(), view = 'large', sk = 'name', sd = 1, cur = [];
  const dlg = o => dialog(Object.assign({ parent: ctx.w }, o));
  const fmt = n => Math.max(1, Math.ceil(n / 1024)) + ' KB';
  const isImg = n => /\.(png|jpe?g|gif|webp)$/i.test(n);
  const mkItem = n => ({ name: n.name, icon: n.type === 'dir' ? 'folder' : isImg(n.name) ? 'img' : 'file', type: FS.type(n), size: n.type === 'dir' ? null : n.size, n });
  const items = () => !path.length ? ROOT.slice() :
    path[0] === 'D:' ? FS.kids(path.slice(1)).map(mkItem) :
    path[0] === 'C:' ? (window.CDRIVE || []).filter(f => !BIN.has('C:/' + f.name)).map(f => Object.assign(mkItem({ name: f.name, type: 'file', size: f.size }), { c: true, n: { name: f.name, type: 'file', size: f.size, url: f.url } })) : [];
  const openFile = it => openFileNode(path.slice(1), it.n, dlg, path[0]);
  const nav = p => { path = p; render(); };
  const goUp = () => { if (path.length) nav(path.slice(0, -1)); };
  const act = it => {
    if (!it) return;
    if (it.go) { if (it.go[0] === 'A:') dlg({ title: 'My Computer', icon: 'x', text: 'A:\\ is not accessible.\nThe device is not ready.' }); else nav(it.go); }
    else if (it.n && it.n.type === 'dir') nav(path.concat(it.name));
    else if (it.dial) dialUp(ctx.w);
    else if (it.omen) omen(it.name, ctx.w);
    else if (it.n) openFile(it);
  };
  const setView = k => { view = k; render(); };
  const list = mk('div', 'xl sunk'), stat = mk('div', 'xs sunk'), addr = mk('div', 'xv sunk'), arow = mk('div', 'xa');
  const els = () => [...list.querySelectorAll('[data-i]')];
  const chosen = () => els().filter(x => x.classList.contains('sel')).map(x => cur[+x.dataset.i]);
  function updateStat() {
    const c = chosen(), set = c.length ? c : cur, tot = set.reduce((s, it) => s + (it.size || 0), 0);
    stat.textContent = c.length ? c.length + ' object(s) selected' + (tot ? '    ' + fmt(tot) : '') : cur.length + ' object(s)' + (tot ? '    ' + fmt(tot) : '');
  }
  const setSel = list2 => { els().forEach(x => x.classList.toggle('sel', list2.includes(x))); updateStat(); };
  const selectAll = () => setSel(els());
  const invert = () => setSel(els().filter(x => !x.classList.contains('sel')));

  const drag = it => !it ? null : !path.length ? { protected: true, name: it.name, icon: it.icon } :
    (path[0] === 'D:' && it.n) ? filePayload(path.slice(1), it) : (path[0] === 'C:' && it.c) ? cPayload(it.n) : null;
  async function deleteSel() {
    for (const it of chosen()) { const p = drag(it); if (p) await sendToBin(p); }
  }
  const count = n => (n.children || []).reduce((a, c) => { if (c.type === 'dir') { const x = count(c); return { f: a.f + x.f, d: a.d + 1 + x.d, s: a.s + x.s }; } return { f: a.f + 1, d: a.d, s: a.s + c.size }; }, { f: 0, d: 0, s: 0 });
  function props() {
    const c = chosen(), it = c.length === 1 ? c[0] : null;
    let name, type, where, size = null, extra = '';
    if (it) {
      name = it.name; type = it.type; where = !path.length ? 'My Computer' : path[0] + '\\' + path.slice(1).join('\\');
      if (it.go && it.go[0] === 'D:') { const t = count(window.MANIFEST); size = t.s; extra = 'Contains: ' + t.f + ' file(s), ' + t.d + ' folder(s)'; }
      else if (it.n && it.n.type === 'dir') { const t = count(it.n); size = t.s; extra = 'Contains: ' + t.f + ' file(s), ' + t.d + ' folder(s)'; }
      else if (it.size != null) size = it.size;
    } else if (c.length > 1) { dlg({ title: 'Properties', icon: 'i', text: c.length + ' object(s) selected.\nTotal size: ' + fmt(c.reduce((s, x) => s + (x.size || 0), 0)) }); return; }
    else if (!path.length) { name = 'My Computer'; type = 'System Folder'; where = 'Desktop'; }
    else { name = path[path.length - 1]; type = path.length === 1 ? 'Local Disk' : 'File Folder'; where = path.length > 1 ? path[0] + '\\' + path.slice(1, -1).join('\\') : 'My Computer';
      if (path[0] === 'D:') { const n = FS.node(path.slice(1)); if (n) { const t = count(n); size = t.s; extra = 'Contains: ' + t.f + ' file(s), ' + t.d + ' folder(s)'; } } }
    const lines = ['Type:  ' + type, 'Location:  ' + where];
    if (size != null) lines.push('Size:  ' + fmt(size) + ' (' + size.toLocaleString() + ' bytes)');
    if (extra) lines.push(extra);
    dlg({ title: name + ' Properties', icon: 'i', text: name + '\n\n' + lines.join('\n') });
  }
  const sel1 = () => { const c = chosen(); if (c.length) act(c[0]); };
  const bar = menuBar({
    File: [['Open', sel1, 'Enter'], ['Delete', deleteSel, 'Del'], ['Properties', props], '-', ['Close', () => ctx.close()]],
    Edit: [['Select All', selectAll, 'Ctrl+A'], ['Invert Selection', invert]],
    View: VIEWS.map(([k, l]) => [l, () => setView(k), '', () => view === k]).concat(['-'], SORTS.map(([k, l]) => ['Arrange Icons ' + l, () => { sk = k; sd = 1; render(); }, '', () => sk === k]), ['-', ['Refresh', () => render(), 'F5']]),
    Help: [['About My Computer', () => dlg({ title: 'My Computer', icon: 'i', text: 'D: is this website.\nEvery file you see there is a real file.' })]]
  });
  const tool = mk('div', 'xt'), up = mk('button', 'btn raised', 'Up'); up.onclick = goUp; tool.appendChild(up);
  const del = mk('button', 'btn raised', 'Delete'); del.onclick = deleteSel; const pr = mk('button', 'btn raised', 'Properties'); pr.onclick = props; tool.append(del, pr);
  const vb = VIEWS.map(([k, l]) => { const b = mk('button', 'btn raised', l); b.onclick = () => setView(k); tool.appendChild(b); return b; });
  arow.append(mk('span', '', 'Address'), addr);
  function render() {
    cur = items();
    if (path.length) cur.sort((a, b) => (b.icon === 'folder') - (a.icon === 'folder') || sd * (sk === 'size' ? (a.size || 0) - (b.size || 0) : String(a[sk]).localeCompare(b[sk])));
    list.className = 'xl sunk v-' + view; list.textContent = '';
    vb.forEach((b, i) => b.classList.toggle('pr', VIEWS[i][0] === view));
    up.disabled = !path.length;
    if (view === 'details') {
      const t = mk('table'), hr = t.createTHead().insertRow();
      [['name', 'Name'], ['size', 'Size'], ['type', 'Type']].forEach(([k, l]) => {
        const b = mk('button', '', l + (sk === k ? (sd > 0 ? ' \u25b2' : ' \u25bc') : '')); b.onclick = () => { sd = sk === k ? -sd : 1; sk = k; render(); };
        hr.appendChild(mk('th')).appendChild(b);
      });
      const tb = t.createTBody();
      cur.forEach((it, i) => {
        const r = tb.insertRow(); r.dataset.i = i; r.tabIndex = 0;
        const c = r.insertCell(); c.innerHTML = ICON[it.icon]; c.append(it.name);
        r.insertCell().textContent = it.size == null ? '' : fmt(it.size); r.insertCell().textContent = it.type;
      });
      list.appendChild(t);
    } else cur.forEach((it, i) => { const b = mk('button', 'xi'); b.dataset.i = i; b.innerHTML = ICON[it.icon] + '<span></span>'; b.lastChild.textContent = it.name; list.appendChild(b); });
    addr.textContent = path.length ? path[0] + '\\' + path.slice(1).join('\\') : 'My Computer';
    updateStat();
    const tt = ctx.w && ctx.w.el.querySelector('.tt'); if (tt) tt.textContent = path.length ? path[path.length - 1] : 'My Computer';
  }
  const pick = e => { const t = e.target.closest('[data-i]'); return t && list.contains(t) ? t : null; };
  list.addEventListener('click', e => {
    const t = pick(e);
    if (t && (e.ctrlKey || e.metaKey)) { t.classList.toggle('sel'); updateStat(); }
    else { setSel(t ? [t] : []); if (t && coarse) act(cur[+t.dataset.i]); }
  });
  list.addEventListener('dblclick', e => { const t = pick(e); if (t) act(cur[+t.dataset.i]); });
  list.addEventListener('keydown', e => {
    const t = pick(e), all = els(), k = e.key;
    if (k === 'Enter' && t) act(cur[+t.dataset.i]);
    else if (k === 'Delete') { if (t && !t.classList.contains('sel')) setSel([t]); deleteSel(); }
    else if (k === 'Backspace') { e.preventDefault(); goUp(); }
    else if (k === 'F5') { e.preventDefault(); render(); }
    else if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'a') { e.preventDefault(); selectAll(); }
    else if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(k) && all.length) {
      e.preventDefault(); const i = t ? all.indexOf(t) : -1;
      const n = k === 'Home' ? 0 : k === 'End' ? all.length - 1 : (k === 'ArrowRight' || k === 'ArrowDown') ? Math.min(all.length - 1, i + 1) : Math.max(0, i < 0 ? 0 : i - 1);
      setSel([all[n]]); all[n].focus();
    }
  });
  const root = mk('div', 'xp'); root.append(bar, tool, arow, list, stat);
  DND.source(list, '[data-i]', el => drag(cur[+el.dataset.i]));
  BIN.on(() => { if (!root.isConnected) return false; render(); });
  render(); return root;
}
