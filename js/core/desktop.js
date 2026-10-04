const $ = s => document.querySelector(s), desk = $('#desk'), tasks = $('#tasks'), menu = $('#menu');
let z = 10, wins = [], active = null;

function mk(id, labelClass) {
  const a = APPS[id], b = document.createElement('button');
  b.className = labelClass; b.innerHTML = ICON[a.icon] + '<span>' + a.label + '</span>'; return b;
}
const sb = document.createElement('div'); sb.className = 'sb'; sb.innerHTML = '<span><b>bop</b>hacking</span>';
const ml = document.createElement('div'); ml.className = 'ml'; menu.append(sb, ml);
const progs = document.createElement('div'); progs.className = 'fly raised'; progs.setAttribute('role', 'menu');
const coarse = matchMedia('(pointer:coarse)').matches;
Object.keys(APPS).filter(id => !APPS[id].hidden).forEach(id => {
  if (!APPS[id].menuOnly) {
    const b = mk(id, 'ic'); b.dataset.id = id;
    b.addEventListener('click', e => {
      document.querySelectorAll('.ic').forEach(i => i.classList.remove('sel')); b.classList.add('sel');
      if (coarse) openApp(id);
    });
    b.addEventListener('dblclick', () => openApp(id));
    b.addEventListener('keydown', e => { if (e.key === 'Enter') openApp(id); });
    $('#icons').appendChild(b);
  }
  const m = mk(id, ''); m.setAttribute('role', 'menuitem'); m.dataset.id = id;
  m.addEventListener('click', () => { menu.classList.remove('open'); $('#start').classList.remove('pr'); openApp(id); });
  progs.appendChild(m);
});
desk.addEventListener('pointerdown', e => { if (e.target === desk || e.target.id === 'icons') document.querySelectorAll('.ic').forEach(i => i.classList.remove('sel')); });
