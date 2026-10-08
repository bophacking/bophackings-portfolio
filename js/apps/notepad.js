// Notepad body: menu bar (File, Edit, Search, Help) + textarea. ctx.w is the owning window.
function notepadBody(ctx, text, fileName) {
  const root = document.createElement('div'); root.className = 'np';
  const ta = document.createElement('textarea'); ta.className = 'pad'; ta.value = text; ta.spellcheck = false;
  const dlg = o => dialog(Object.assign({ parent: ctx.w }, o));
  let last = '', name = fileName || ((ctx.opts && /\.\w+$/.test(ctx.opts.label || '')) ? ctx.opts.label : null);   // name of the file being edited (null = Untitled)
  const stamp = () => { ta.setRangeText(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString(), ta.selectionStart, ta.selectionEnd, 'end'); ta.focus(); };
  const findNext = () => {
    const h = ta.value.toLowerCase(), n = last.toLowerCase(); if (!n) return;
    let i = h.indexOf(n, ta.selectionEnd); if (i < 0) i = h.indexOf(n);
    if (i < 0) { dlg({ title: 'Notepad', text: 'Cannot find "' + last + '"', icon: 'i' }); return; }
    ta.focus(); ta.setSelectionRange(i, i + n.length);
  };
  const find = () => dlg({ title: 'Find', text: 'Find what:', input: last, buttons: ['Find Next', 'Cancel'] }).then(r => { if (r.btn === 'Find Next' && r.value) { last = r.value; findNext(); } });
  const retitle = () => {                                         // window and taskbar follow the file name, like the real thing
    const t = (name || 'Untitled') + ' - Notepad', tt = ctx.w && ctx.w.el.querySelector('.tt');
    if (tt) tt.textContent = t; if (ctx.w && ctx.w.btn && ctx.w.btn.lastChild) ctx.w.btn.lastChild.textContent = name || 'Untitled';
  };
  const write = n => { download(n, ta.value, 'text/plain;charset=utf-8'); name = n; retitle(); };   // "saving" = a download to the visitor's computer
  const saveAs = async () => {
    const r = await dlg({ title: 'Save As', text: 'File name:', input: name || 'Untitled.txt', buttons: ['Save', 'Cancel'] });
    const n = r.btn === 'Save' && (r.value || '').trim().replace(/[\\/:*?"<>|]+/g, '_');
    if (n) write(/\.\w+$/.test(n) ? n : n + '.txt');
  };
  const save = () => name ? write(name) : saveAs();
  const MENUS = {
    File: [['New', () => { ta.value = ''; name = null; retitle(); ta.focus(); }], ['Save', save, 'Ctrl+S'], ['Save As...', saveAs], '-', ['Exit', () => ctx.close()]],
    Edit: [['Select All', () => { ta.focus(); ta.select(); }], ['Copy', () => { ta.focus(); document.execCommand('copy'); }], '-', ['Time/Date', stamp, 'F5']],
    Search: [['Find...', find], ['Find Next', findNext, 'F3']],
    Help: [['About Notepad', () => dlg({ title: 'About Notepad', icon: 'i', text: 'Notepad (bophacking edition)\nA tiny tribute, made for the web.' })]]
  };
  const bar = menuBar(MENUS);
  ta.addEventListener('keydown', e => {
    if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) { e.preventDefault(); ta.setRangeText('\t', ta.selectionStart, ta.selectionEnd, 'end'); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
     if (e.key === 'F5') { e.preventDefault(); stamp(); } if (e.key === 'F3') { e.preventDefault(); findNext(); } });
  root.append(bar, ta); return root;
}
