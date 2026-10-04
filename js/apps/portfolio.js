// Portfolio: a small Internet Explorer shell that shows the REAL pages in D:\content\portfolio.
// Pages are read from the manifest and shown with srcdoc (works from file:// and over http); <base> makes their
// relative links resolve exactly as if the page were opened at its own address.
function portfolioBody(ctx) {
  const DIR = ['content', 'portfolio'], HOME = 'about.html', BASE = 'content/portfolio/';
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  let hist = [], pos = -1, timer = null;
  const dlg = o => dialog(Object.assign({ title: 'Internet Explorer', parent: ctx.w }, o));
  const btn = (text, fn, label) => h('button', { class: 'btn raised', type: 'button', text, 'aria-label': label || text, onclick: fn });
  const back = btn('\u25c0 Back', () => step(-1), 'Back'), fwd = btn('Forward \u25b6', () => step(1), 'Forward'),
    stop = btn('\u2715 Stop', () => halt(), 'Stop'), refresh = btn('\u21bb Refresh', () => pos >= 0 && show(hist[pos], false), 'Refresh'),
    home = btn('\u2302 Home', () => show(HOME, true), 'Home');
  const throb = h('div', { class: 'throb', 'aria-hidden': 'true' }); throb.innerHTML = ICON.ie;
  const addr = h('input', { class: 'sunk fld addr', readonly: true, 'aria-label': 'Address', value: '' });
  const status = h('div', { class: 'xs sunk', role: 'status', text: 'Done' });
  const frame = h('iframe', { class: 'ieframe', title: 'Portfolio page', sandbox: 'allow-same-origin allow-popups allow-popups-to-escape-sandbox' });

  const setBusy = on => { throb.classList.toggle('spin', on && !reduce); stop.disabled = !on; };
  const sync = () => { back.disabled = pos <= 0; fwd.disabled = pos >= hist.length - 1; };
  function pageHTML(file) {
    const n = FS.node(DIR.concat(file));
    if (!n || n.type !== 'file' || n.text === undefined) return null;
    // Inline same-folder stylesheets: avoids a failing speculative preload (the browser requests them before it sees <base>).
    const html = n.text.replace(/<link\s+rel="stylesheet"\s+href="([^"\/?#]+)"\s*\/?>/gi, (m, href) => { const c = FS.node(DIR.concat(href)); return c && c.text !== undefined ? '<style>' + c.text + '</style>' : m; });
    return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, m => m + '<base href="' + BASE + '">') : '<base href="' + BASE + '">' + html;
  }
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const errorPage = file => '<!doctype html><meta charset="utf-8"><base href="' + BASE + '"><title>Cannot find page</title><body style="font:14px Tahoma,Arial,sans-serif;margin:24px;color:#000"><h2 style="color:#5b2a9e">The page cannot be found</h2><p>The page you are looking for might have been removed or had its name changed.</p><p><b>' + esc(file) + '</b></p><p><a href="' + HOME + '">Go to the home page</a></p></body>';

  function show(file, push) {
    clearTimeout(timer); setBusy(true); status.textContent = 'Opening page ' + file + '...';
    timer = setTimeout(() => {
      if (push) { hist = hist.slice(0, pos + 1); hist.push(file); pos = hist.length - 1; }
      addr.value = 'D:\\' + DIR.join('\\') + '\\' + file; sync();
      frame.srcdoc = pageHTML(file) || errorPage(file); watch();
    }, reduce ? 0 : 200 + Math.random() * 200);
  }
  function step(d) { const p = pos + d; if (p >= 0 && p < hist.length) { pos = p; show(hist[pos], false); } }
  function halt() { clearTimeout(timer); setBusy(false); status.textContent = 'Download canceled'; }

  function onClick(e) {
    const a = e.target.closest && e.target.closest('a'); if (!a) return;
    const href = a.getAttribute('href') || '';
    if (a.dataset.app && APPS[a.dataset.app]) { e.preventDefault(); openApp(a.dataset.app); }
    else if (/^(https?:)?\/\//i.test(href)) { e.preventDefault(); window.open(href, '_blank', 'noopener,noreferrer'); }
    else if (href.charAt(0) !== '#' && /\.html?(#.*)?$/i.test(href)) { e.preventDefault(); show(href.split('#')[0], true); }
  }
  // Links must be handled as soon as the page is parsed, not after fonts/images finish ('load'): hook early, and again on load as a backup.
  let hooked = null, poller = null;
  function hook() {
    try {
      const d = frame.contentDocument;
      if (!d || d === hooked || !d.querySelector('base[href="' + BASE + '"]')) return false;
      hooked = d; d.addEventListener('click', onClick); setTitle(d); wireImages(d); return true;
    } catch (err) { return true; }          // page not reachable for scripting; stop trying
  }
  // The page runs sandboxed without scripts, so its inline image handlers can't fire: do the same job from here
  // (a figure's picture shows only if the file exists; otherwise its grey placeholder stays).
  function wireImages(d) {
    d.querySelectorAll('figure img').forEach(im => {
      if (im.dataset.wired) return; im.dataset.wired = '1';
      const ok = () => im.parentNode.classList.add('has'), bad = () => im.remove();
      if (im.complete) (im.naturalWidth ? ok : bad)(); else { im.addEventListener('load', ok); im.addEventListener('error', bad); }
    });
  }
  function setTitle(d) { const tt = ctx.w && ctx.w.el.querySelector('.tt'); if (tt) tt.textContent = (d.title || 'Portfolio') + ' - Internet Explorer'; }
  function watch() { clearInterval(poller); let n = 0; poller = setInterval(() => { if (hook() || ++n > 200) clearInterval(poller); }, 15); }
  frame.addEventListener('load', () => { setBusy(false); status.textContent = 'Done'; hook(); try { wireImages(frame.contentDocument); setTitle(frame.contentDocument); } catch (err) { /* ignore */ } });   // <title> is parsed after <base>, so refresh it here

  const bar = menuBar({
    File: [['Close', () => ctx.close()]],
    View: [['Stop', halt], ['Refresh', () => pos >= 0 && show(hist[pos], false)]],
    Go: [['Back', () => step(-1)], ['Forward', () => step(1)], ['Home Page', () => show(HOME, true)]],
    Help: [['About Internet Explorer', () => dlg({ icon: 'i', text: 'These pages are real files.\nThey live in D:\\content\\portfolio, so you can browse them in My Computer too.' })]]
  });
  ctx.api = { load: o => o && o.file && show(o.file, true) };
  sync(); setBusy(false); show(HOME, true);
  return h('div', { class: 'ie' }, bar,
    h('div', { class: 'ietool' }, back, fwd, stop, refresh, home, throb),
    h('div', { class: 'ieaddr' }, h('span', { text: 'Address' }), addr),
    h('div', { class: 'iewrap sunk' }, frame), status);
}
