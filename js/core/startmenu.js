// Start menu: Programs flyout (the apps), Help, Run... (a dead button, like a decoration), Shut Down...
(function () {
  const closeMenu = () => { menu.classList.remove('open'); $('#start').classList.remove('pr'); };
  const row = (icon, label, fn, cls) => {
    const b = document.createElement('button'); b.className = cls || ''; b.setAttribute('role', 'menuitem');
    b.innerHTML = ICON[icon] + '<span></span>'; b.lastChild.textContent = label; if (fn) b.onclick = () => { closeMenu(); fn(); }; return b;
  };
  const progRow = document.createElement('div'); progRow.className = 'row';
  const pb = row('folder', 'Programs', null, 'sub'); pb.onclick = () => progRow.classList.toggle('open');
  progRow.append(pb, progs);
  const hr = () => document.createElement('hr');

  async function shutDown() {
    const r = await dialog({ title: 'Shut Down Windows', icon: 'q', buttons: ['Yes', 'No'], text: 'Are you sure you want to shut down your computer?' });
    if (r.btn !== 'Yes') return;
    const d = document.createElement('div'); d.className = 'shut'; d.textContent = "It's now safe to turn off\nyour computer."; d.style.whiteSpace = 'pre-line'; document.body.append(d);
    setTimeout(() => { const back = () => location.reload(); d.addEventListener('pointerdown', back); document.addEventListener('keydown', back, { once: true }); }, 700);
  }
  ml.append(progRow, row('find', 'Find...', () => openApp('find')), row('help', 'Help', () => openApp('welcome')), row('run', 'Run...'), hr(), row('shut', 'Shut Down...', shutDown));
})();
