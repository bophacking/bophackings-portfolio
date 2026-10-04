// Small DOM helpers shared by the apps.
function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v === false || v == null) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) e.append(kid.nodeType ? kid : document.createTextNode(kid));
  return e;
}
// Win95 tab control. defs: [{label, el}] -> {el, select(i)}
function tabs(defs) {
  const root = h('div', { class: 'tabs' }), bar = h('div', { class: 'tabbar', role: 'tablist' }), panels = h('div', { class: 'tabpanels raised' });
  const btns = defs.map((d, i) => {
    const b = h('button', { class: 'tab', role: 'tab', type: 'button', text: d.label, onclick: () => select(i) });
    d.el.classList.add('tabpanel'); d.el.setAttribute('role', 'tabpanel'); bar.append(b); panels.append(d.el); return b;
  });
  function select(i) { defs.forEach((d, k) => { d.el.hidden = k !== i; btns[k].classList.toggle('on', k === i); btns[k].setAttribute('aria-selected', String(k === i)); }); }
  select(0); root.append(bar, panels); return { el: root, select };
}
const MAX_FILE = 25 * 1024 * 1024;
function readFile(file, cb) {
  if (file.size > MAX_FILE) return cb(null, new Error('That file is larger than 25 MB.'));
  const r = new FileReader();
  r.onload = () => cb({ name: file.name, text: String(r.result) });
  r.onerror = () => cb(null, new Error('Could not read that file.'));
  r.readAsText(file);
}
// Lets a file dragged from the visitor's computer be dropped onto an element.
function fileDrop(target, cb) {
  const has = e => e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0;
  target.addEventListener('dragover', e => { if (has(e)) { e.preventDefault(); target.classList.add('drop'); } });
  target.addEventListener('dragleave', e => { if (!target.contains(e.relatedTarget)) target.classList.remove('drop'); });
  target.addEventListener('drop', e => { target.classList.remove('drop'); const f = e.dataTransfer && e.dataTransfer.files[0]; if (f) { e.preventDefault(); readFile(f, cb); } });
}
function pickFile(accept, cb) {
  const i = h('input', { type: 'file', accept }); i.onchange = () => { if (i.files[0]) readFile(i.files[0], cb); }; i.click();
}
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' })), a = h('a', { href: url, download: name });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
}
