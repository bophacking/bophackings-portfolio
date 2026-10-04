// Recycle Bin window: lists what was binned; Restore, Delete and Empty Recycle Bin, each with the classic confirmation.
function binBody(ctx) {
  const dlg = o => dialog(Object.assign({ title: 'Recycle Bin', parent: ctx.w }, o));
  const fmt = n => Math.max(1, Math.ceil(n / 1024)) + ' KB';
  let sel = new Set();
  const list = h('div', { class: 'xl sunk', tabindex: '0', 'aria-label': 'Items in the Recycle Bin' }), stat = h('div', { class: 'xs sunk' });
  const chosen = () => BIN.items.filter(i => sel.has(i.id));

  function render() {
    sel = new Set([...sel].filter(id => BIN.items.some(i => i.id === id)));
    const rows = BIN.items.map(it => {
      const nm = h('td', { class: 'nm' }); nm.innerHTML = ICON[it.icon]; nm.append(it.name);
      return h('tr', { 'data-id': String(it.id), class: sel.has(it.id) ? 'sel' : '' }, nm, h('td', { text: it.orig }),
        h('td', { text: it.date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) }), h('td', { text: it.type }), h('td', { class: 'n', text: it.isDir ? '' : fmt(it.size) }));
    });
    list.replaceChildren(h('table', { class: 'bt' }, h('thead', {}, h('tr', {}, ['Name', 'Original Location', 'Date Deleted', 'Type', 'Size'].map(x => h('th', { text: x })))), h('tbody', {}, rows)));
    const total = BIN.items.reduce((s, i) => s + (i.isDir ? 0 : i.size), 0);
    stat.textContent = BIN.items.length + ' object(s)' + (total ? '    ' + fmt(total) : '');
  }
  const restore = () => { const c = chosen(); if (c.length) BIN.restore(c); };
  const del = async () => {
    const c = chosen(); if (!c.length) return;
    const r = await dlg({ icon: 'q', buttons: ['Yes', 'No'], title: 'Confirm File Delete', text: c.length === 1 ? "Are you sure you want to delete '" + c[0].name + "'?" : 'Are you sure you want to delete these ' + c.length + ' items?' });
    if (r.btn === 'Yes') BIN.purge(c);
  };
  const empty = async () => {
    if (!BIN.items.length) return dlg({ icon: 'i', text: 'The Recycle Bin is already empty.' });
    const r = await dlg({ icon: 'q', buttons: ['Yes', 'No'], title: 'Confirm Multiple File Delete', text: 'Are you sure you want to delete all of the items in the Recycle Bin?' });
    if (r.btn === 'Yes') BIN.empty();
  };
  list.addEventListener('click', e => {
    const tr = e.target.closest('tr[data-id]'), id = tr && +tr.dataset.id;
    if (!id) sel = new Set(); else if (e.ctrlKey || e.metaKey) { if (sel.has(id)) sel.delete(id); else sel.add(id); } else sel = new Set([id]);
    render();
  });
  list.addEventListener('keydown', e => { if (e.key === 'Delete') del(); });
  const bar = menuBar({
    File: [['Restore', restore], ['Delete', del], '-', ['Empty Recycle Bin', empty], '-', ['Close', () => ctx.close()]],
    Edit: [['Select All', () => { sel = new Set(BIN.items.map(i => i.id)); render(); }]]
  });
  const root = h('div', { class: 'xp bin' }, bar, list, stat);
  BIN.on(() => { if (!root.isConnected) return false; render(); });
  DND.target(root, { drop: sendToBin });
  render(); return root;
}
