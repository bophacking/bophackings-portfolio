let instSeq = 0;                                        // apps flagged multi in APPS open a new window each time
function topVisible() { return wins.filter(w => !w.min).sort((a, b) => +b.el.style.zIndex - +a.el.style.zIndex)[0]; }
function paint() {
  wins.forEach(w => { w.el.classList.toggle('on', w === active); w.btn.classList.toggle('pr', w === active); });
}
function focusWin(w) { z++; w.el.style.zIndex = z; active = w; paint(); }

function openApp(id, opts = {}) {
  const a = APPS[id], key = opts.key || (a.multi ? id + '#' + (++instSeq) : id); let w = wins.find(x => x.key === key);
  if (w) { restore(w); if (opts.load && w.ctx.api) w.ctx.api.load(opts.load); return; }
  const ctx = { opts }, el = document.createElement('div'); el.className = 'win raised';
  el.innerHTML = '<div class="tb">' + ICON[a.icon] + '<span class="tt"></span><button class="raised" data-a="min" aria-label="Minimize">_</button><button class="raised" data-a="max" aria-label="Maximize">&#9633;</button><button class="raised" data-a="x" aria-label="Close">&times;</button></div><div class="body sunk"></div><div class="grip"></div>';
  el.querySelector('.tt').textContent = opts.title || a.title;
  el.querySelector('.body').appendChild(a.body(ctx));
  const off = (wins.length % 4) * 22;
  const ww = Math.min(a.w, desk.clientWidth - 16), hh = Math.min(a.h, desk.clientHeight - 16);
  Object.assign(el.style, { left: Math.max(0, Math.min(a.x + off, desk.clientWidth - ww - 4)) + 'px', top: Math.max(0, Math.min(a.y + off, desk.clientHeight - hh - 4)) + 'px', width: ww + 'px', height: hh + 'px' });
  desk.appendChild(el);
  const btn = document.createElement('button'); btn.className = 'btn';
  btn.innerHTML = ICON[a.icon] + '<span></span>'; btn.lastChild.textContent = opts.label || a.label; tasks.appendChild(btn);
  const w2 = { id, key, ctx, el, btn, min: false, max: false, saved: null }; wins.push(w2); ctx.w = w2; ctx.close = () => close(w2);
  if (desk.clientWidth <= 600) { w2.max = true; el.classList.add('max'); }   // phones: windows open maximized, the taskbar stays
  btn.addEventListener('click', () => { if (w2.min) restore(w2); else if (active === w2) minimize(w2); else focusWin(w2); });
  el.addEventListener('pointerdown', () => focusWin(w2));
  const tb = el.querySelector('.tb');
  tb.addEventListener('click', e => { const t = e.target.closest('button'); if (!t) return; ({ min: minimize, max: toggleMax, x: close })[t.dataset.a](w2); });
  tb.addEventListener('dblclick', e => { if (!e.target.closest('button')) toggleMax(w2); });
  tb.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    const sx = e.clientX, sy = e.clientY, D = desk.getBoundingClientRect(); let moved = !w2.max;
    let dx = sx - D.left - el.offsetLeft, dy = sy - D.top - el.offsetTop; tb.setPointerCapture(e.pointerId);
    const mv = ev => {
      if (!moved) {
        if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 4) return;
        const ratio = (sx - D.left) / D.width;
        w2.max = false; el.classList.remove('max'); moved = true;
        dx = ratio * el.offsetWidth; dy = 14;
      }
      el.style.left = Math.min(Math.max(ev.clientX - D.left - dx, 80 - el.offsetWidth), desk.clientWidth - 80) + 'px';
      el.style.top = Math.min(Math.max(ev.clientY - D.top - dy, 0), desk.clientHeight - 26) + 'px';
    };
    const up = () => { tb.removeEventListener('pointermove', mv); tb.removeEventListener('pointerup', up); };
    tb.addEventListener('pointermove', mv); tb.addEventListener('pointerup', up);
  });
  const gr = el.querySelector('.grip');
  gr.addEventListener('pointerdown', e => {
    const sx = e.clientX, sy = e.clientY, sw = el.offsetWidth, sh = el.offsetHeight; gr.setPointerCapture(e.pointerId);
    const mv = ev => { el.style.width = Math.max(200, sw + ev.clientX - sx) + 'px'; el.style.height = Math.max(110, sh + ev.clientY - sy) + 'px'; };
    const up = () => { gr.removeEventListener('pointermove', mv); gr.removeEventListener('pointerup', up); };
    gr.addEventListener('pointermove', mv); gr.addEventListener('pointerup', up);
  });
  focusWin(w2);
  if (opts.load && ctx.api) ctx.api.load(opts.load);
}
function openMax(id) {                                  // open (or raise) an app and make it fill the desktop
  openApp(id); const w = wins.find(x => x.id === id); if (w && !w.max) toggleMax(w);
  const ic = document.querySelector('.ic.hint'); if (ic) ic.classList.remove('hint');
}
function toggleMax(w) { w.max = !w.max; w.el.classList.toggle('max', w.max); focusWin(w); }
function minimize(w) {
  const b = w.btn.getBoundingClientRect(), r = w.el.getBoundingClientRect();
  w.min = true; w.el.style.transition = 'transform .18s ease-in,opacity .18s';
  w.el.style.transform = 'translate(' + (b.left + b.width / 2 - r.left - r.width / 2) + 'px,' + (b.top - r.top - r.height / 2) + 'px) scale(.1)';
  w.el.style.opacity = 0;
  setTimeout(() => { if (w.min) w.el.style.visibility = 'hidden'; }, 180);
  active = topVisible() === w ? null : active; const n = topVisible(); if (n && n !== w) focusWin(n); else paint();
}
function restore(w) {
  if (w.min) {
    w.min = false; w.el.style.visibility = 'visible'; void w.el.offsetWidth;
    w.el.style.transform = ''; w.el.style.opacity = 1; setTimeout(() => { w.el.style.transition = ''; }, 200);
  }
  focusWin(w);
}
function close(w) {
  w.el.remove(); w.btn.remove(); wins = wins.filter(x => x !== w);
  active = null; const n = topVisible(); if (n) focusWin(n); else paint();
}
