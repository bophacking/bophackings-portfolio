// menuBar({Name:[[label,fn,keyHint],'-',...]}) -> menu bar element with hover-switching dropdowns
function menuBar(MENUS) {
  const bar = document.createElement('div'); bar.className = 'mbar'; bar.setAttribute('role', 'menubar');
  let cur = null;
  const closeAll = () => { bar.querySelectorAll('.mi').forEach(m => m.classList.remove('open')); cur = null; };
  Object.entries(MENUS).forEach(([name, items]) => {
    const m = document.createElement('div'); m.className = 'mi';
    const b = document.createElement('button'); b.textContent = name; b.setAttribute('aria-haspopup', 'true');
    const checks = [], dd = document.createElement('div'); dd.className = 'dd raised'; dd.setAttribute('role', 'menu');
    items.forEach(it => {
      if (it === '-') { dd.appendChild(document.createElement('hr')); return; }
      const x = document.createElement('button'); x.setAttribute('role', 'menuitem');
      x.innerHTML = '<span></span><span></span>'; x.children[0].textContent = it[0]; if (it[3]) checks.push(() => { x.children[0].textContent = (it[3]() ? '\u2713 ' : '\u00a0\u00a0\u00a0') + it[0]; }); x.children[1].textContent = it[2] || '';
      x.onclick = () => { closeAll(); it[1](); }; dd.appendChild(x);
    });
    const open = () => { checks.forEach(f => f()); m.classList.add('open'); cur = m; };
    b.onclick = () => { const was = cur === m; closeAll(); if (!was) open(); };
    m.addEventListener('pointerenter', () => { if (cur && cur !== m) { closeAll(); open(); } });
    m.append(b, dd); bar.appendChild(m);
  });
  const outside = e => { if (!bar.isConnected) return document.removeEventListener('pointerdown', outside); if (!bar.contains(e.target)) closeAll(); };
  document.addEventListener('pointerdown', outside);
  return bar;
}
