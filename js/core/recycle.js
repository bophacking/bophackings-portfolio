// Recycle Bin: state, rules and desktop wiring. Everything is in memory and resets on reload (no visitor data is stored).
// "Gone" keys hide a shortcut from the desktop or a file/folder from D:. Restoring brings it back; deleting from the bin keeps it hidden.
const BIN = {
  items: [], gone: new Set(), seq: 0, fns: [],
  on(fn) { BIN.fns.push(fn); },                                  // fn returns false to unsubscribe
  emit() { BIN.fns = BIN.fns.filter(f => f() !== false); },
  has(key) { return BIN.gone.has(key); },
  add(it) { it.id = ++BIN.seq; it.date = new Date(); BIN.items.push(it); BIN.gone.add(it.key); BIN.emit(); },
  restore(list) { BIN.items = BIN.items.filter(x => list.indexOf(x) < 0); list.forEach(it => BIN.gone.delete(it.key)); BIN.emit(); },
  purge(list) { BIN.items = BIN.items.filter(x => list.indexOf(x) < 0); BIN.emit(); },
  kill(key) { BIN.gone.add(key); BIN.emit(); },                  // permanent: hidden for the session, nothing is listed in the bin
  empty() { BIN.items = []; BIN.emit(); }
};

// What can be dragged to the bin. {protected:true} items give the real "cannot delete" message instead.
function iconPayload(id) {
  const a = APPS[id];
  if (id === 'computer' || id === 'bin') return { protected: true, id, name: a.label, icon: a.icon };
  return { key: 'icon:' + id, name: a.label, icon: a.icon, orig: 'C:\\WINDOWS\\Desktop', type: 'Shortcut', size: 1024 };
}
function cPayload(f) { return { key: 'C:/' + f.name, name: f.name, icon: 'img', orig: 'C:\\', type: FS.type({ name: f.name }), size: f.size }; }
function filePayload(parents, it) {                              // parents: names below D:, it: Explorer item {name, n}
  const sum = n => n.type === 'dir' ? n.children.reduce((s, c) => s + sum(c), 0) : n.size, dir = it.n.type === 'dir';
  return { key: 'D:/' + parents.concat(it.name).join('/'), name: it.name, icon: dir ? 'folder' : 'file', orig: 'D:\\' + parents.join('\\'), type: FS.type(it.n), size: sum(it.n), isDir: dir };
}

// Printers and Control Panel: three ominous lines in rotation. The 10th time ends like deleting My Computer.
const OMENS = ["You wouldn't even want to know.", "You're not ready for this.", 'Beware what you wish for'];
let omenCount = 0;
async function omen(title, parent) {
  const text = OMENS[omenCount % OMENS.length]; omenCount++;
  await dialog({ parent, title, icon: 'w', text });
  if (omenCount >= 10) blackScreen();
}
function blackScreen() {                                         // the "crash": nothing but black until the page is reloaded
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;inset:0;background:#000;z-index:2147483647;cursor:none';
  document.body.append(d);
}
async function sendToBin(p) {
  const fatal = p.id === 'computer' || p.key === 'D:/index.html';
  if (fatal) {
    const r = await dialog({ title: 'Confirm', icon: 'q', buttons: ['Yes', 'No'], text: 'Are you sure about this?' });
    if (r.btn === 'Yes') blackScreen();
    return;
  }
  if (p.protected) return dialog({ title: 'Error Deleting File or Folder', icon: 'x', text: 'Cannot delete ' + p.name + ': This is a system folder and cannot be deleted.' });
  if (BIN.has(p.key)) return;
  BIN.kill(p.key);
  closeFor(p.key);
}
// Anything open that belongs to a deleted item closes at once: an app's window, or a Notepad showing a deleted file or a file inside a deleted folder.
function closeFor(key) {
  const app = key.startsWith('icon:') ? key.slice(5) : null, rest = key.slice(3);
  wins.filter(w => (app && w.id === app) ||
    (key.startsWith('D:/') && (w.key === 'np:' + rest || w.key.startsWith('np:' + rest + '/'))) ||
    ((key.startsWith('D:/') || key.startsWith('C:/')) && (w.key === 'img:' + key || w.key.startsWith('img:' + key + '/')))).forEach(w => w.ctx.close());
}

// Desktop: icons are draggable, the bin icon swaps empty/full, binned shortcuts disappear (the Start menu still lists every app).
function syncBin() {
  const key = BIN.items.length ? 'binFull' : 'bin'; APPS.bin.icon = key;
  document.querySelectorAll('[data-id="bin"] svg').forEach(s => { s.outerHTML = ICON[key]; });
  wins.filter(w => w.id === 'bin').forEach(w => { w.el.querySelector('.tb svg').outerHTML = ICON[key]; w.btn.querySelector('svg').outerHTML = ICON[key]; });
  document.querySelectorAll('.ic').forEach(b => { b.style.display = BIN.has('icon:' + b.dataset.id) ? 'none' : ''; });
}
BIN.on(syncBin);
// Icons sit on a grid (88px cells, column-first like the classic desktop). Dropping one snaps it to the nearest free cell; positions reset on reload.
const GRID = { w: 88, h: 88, pad: 8, ix: 6 }, cells = new Map();          // cells: icon element -> {c, r}
const gridSize = () => { const d = $('#desk'); return { cols: Math.max(1, Math.floor((d.clientWidth - 2 * GRID.pad) / GRID.w)), rows: Math.max(1, Math.floor((d.clientHeight - 2 * GRID.pad) / GRID.h)) }; };
function placeIcon(el, c, r) { cells.set(el, { c, r }); el.style.left = GRID.pad + GRID.ix + c * GRID.w + 'px'; el.style.top = GRID.pad + r * GRID.h + 'px'; }
const cellTaken = (c, r, except) => [...cells].some(([el, p]) => el !== except && el.style.display !== 'none' && p.c === c && p.r === r);
function nearestFree(c, r, el) {
  const { cols, rows } = gridSize(); let best = null, bd = Infinity;
  for (let cc = 0; cc < cols; cc++) for (let rr = 0; rr < rows; rr++) {
    if (cellTaken(cc, rr, el)) continue;
    const d = (cc - c) ** 2 + (rr - r) ** 2; if (d < bd) { bd = d; best = [cc, rr]; }
  }
  return best || [Math.min(c, cols - 1), Math.min(r, rows - 1)];
}
(function layoutIcons() {
  const box = $('#icons'), { rows } = gridSize(); box.classList.add('free');
  [...box.querySelectorAll('.ic')].forEach((el, i) => { el.style.position = 'absolute'; placeIcon(el, Math.floor(i / rows), i % rows); });
})();
window.addEventListener('resize', () => {
  const { cols, rows } = gridSize();
  cells.forEach((p, el) => { if (p.c >= cols || p.r >= rows) { const [c, r] = nearestFree(Math.min(p.c, cols - 1), Math.min(p.r, rows - 1), el); placeIcon(el, c, r); } });
});
DND.source($('#icons'), '.ic', el => iconPayload(el.dataset.id), (el, dx, dy) => {
  const { cols, rows } = gridSize();
  let c = Math.round((el.offsetLeft + dx - GRID.pad - GRID.ix) / GRID.w), r = Math.round((el.offsetTop + dy - GRID.pad) / GRID.h);
  c = Math.max(0, Math.min(cols - 1, c)); r = Math.max(0, Math.min(rows - 1, r));
  if (cellTaken(c, r, el)) [c, r] = nearestFree(c, r, el);
  placeIcon(el, c, r);
});
DND.target(document.querySelector('.ic[data-id="bin"]'), { drop: sendToBin });
$('#icons').addEventListener('keydown', e => { if (e.key === 'Delete') { const b = e.target.closest('.ic'); if (b) sendToBin(iconPayload(b.dataset.id)); } });
