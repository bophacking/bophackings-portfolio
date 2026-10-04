// dialog({title,text,icon:'i|w|q|x',buttons:[..],input:'prefill',parent:win}) -> Promise<{btn,value}>
// Modal: a cover blocks the parent window (or the whole desktop); clicking it shakes the dialog.
function dialog(o) {
  return new Promise(res => {
    const par = o.parent && o.parent.el, icon = o.icon || 'i', btns = o.buttons || ['OK'];
    const cover = document.createElement('div'); cover.className = 'cover' + (par ? '' : ' sys');
    (par || desk).appendChild(cover);
    const d = document.createElement('div'); d.className = 'win on raised dlg';
    d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
    d.innerHTML = '<div class="tb"><span class="tt"></span><button class="raised" aria-label="Close">&times;</button></div>' +
      '<div class="dbody"><div class="gl g-' + icon + '">' + { i: 'i', w: '!', q: '?', x: '\u00d7' }[icon] + '</div><div class="dt"><div class="msg"></div></div></div><div class="dbtns"></div>';
    d.querySelector('.tt').textContent = o.title || 'Message';
    d.querySelector('.msg').textContent = o.text || '';
    let inp = null;
    if (o.input !== undefined) { inp = document.createElement('input'); inp.className = 'dinp sunk'; inp.value = o.input; d.querySelector('.dt').appendChild(inp); }
    const done = btn => { cover.remove(); d.remove(); res({ btn, value: inp ? inp.value : undefined }); };
    btns.forEach(label => { const b = document.createElement('button'); b.className = 'btn raised'; b.textContent = label; b.onclick = () => done(label); d.querySelector('.dbtns').appendChild(b); });
    d.querySelector('.tb button').onclick = () => done(null);
    d.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Escape') done(null);
      if (e.key === 'Enter' && inp && e.target === inp) done(btns[0]);
    });
    cover.addEventListener('pointerdown', e => { e.stopPropagation(); d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake'); });
    d.style.width = Math.min(320, desk.clientWidth - 16) + 'px';
    desk.appendChild(d);
    d.style.left = Math.max(0, (desk.clientWidth - d.offsetWidth) / 2) + 'px';
    d.style.top = Math.max(0, (desk.clientHeight - d.offsetHeight) / 3) + 'px';
    (inp || d.querySelector('.dbtns button')).focus();
  });
}
