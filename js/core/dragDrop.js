// Pointer-based drag and drop (works with mouse, pen and touch). A source is a container + item selector; a target is any element.
//   DND.source(root, selector, item => payload|null, onFree(item, dx, dy)?)   onFree runs when dropped on no target    DND.target(el, { drop(payload) })
// While a payload hovers a target, that element gets the class "drop".
const DND = {
  targets: [],
  target(el, t) { DND.targets = DND.targets.filter(x => x.el.isConnected); DND.targets.push(Object.assign({ el }, t)); },
  source(root, selector, payloadOf, onFree) {
    root.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      const item = e.target.closest(selector); if (!item || !root.contains(item)) return;
      const sx = e.clientX, sy = e.clientY; let g = null, p = null, over = null, lx = sx, ly = sy;
      const find = (x, y) => { const el = document.elementFromPoint(x, y); return (el && DND.targets.find(t => t.el.isConnected && t.el !== item && t.el.contains(el))) || null; };
      const stop = () => {
        document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', stop);
        if (g) g.remove(); if (over) over.el.classList.remove('drop');
      };
      const move = ev => {
        if (!g) {
          if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 6) return;
          p = payloadOf(item, e); if (!p) return stop();
          g = document.createElement('div'); g.className = 'dndghost'; g.innerHTML = ICON[p.icon] || '';
          const s = document.createElement('span'); s.textContent = p.name; g.append(s); document.body.append(g);
        }
        lx = ev.clientX; ly = ev.clientY;
        g.style.left = ev.clientX + 6 + 'px'; g.style.top = ev.clientY + 6 + 'px';
        const t = find(ev.clientX, ev.clientY);
        if (t !== over) { if (over) over.el.classList.remove('drop'); over = t; if (over) over.el.classList.add('drop'); }
      };
      const up = () => {
        const t = over, dragged = !!g, payload = p; stop();
        if (!dragged) return;
        const eat = ev => { ev.stopPropagation(); ev.preventDefault(); };            // a drag must not also count as a click
        document.addEventListener('click', eat, true); setTimeout(() => document.removeEventListener('click', eat, true), 60);
        if (t) t.drop(payload); else if (onFree) onFree(item, lx - sx, ly - sy);
      };
      document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', stop);
    });
  }
};
