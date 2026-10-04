const ICON = {
  floppy: '<svg viewBox="0 0 32 32"><rect x="5" y="5" width="22" height="22" fill="#404040" stroke="#000"/><rect x="9" y="5" width="14" height="9" fill="#c0c0c0"/><rect x="10" y="18" width="12" height="9" fill="#fff"/></svg>',
  drive: '<svg viewBox="0 0 32 32"><rect x="3" y="11" width="26" height="11" fill="#c0c0c0" stroke="#000"/><rect x="6" y="16" width="14" height="2" fill="#404040"/><circle cx="25" cy="17" r="1.5" fill="#0c0"/></svg>',
  folder: '<svg viewBox="0 0 32 32"><path d="M3 8h9l3 3h14v15H3z" fill="#ffe27a" stroke="#000"/></svg>',
  file: '<svg viewBox="0 0 32 32"><path d="M8 4h11l5 5v19H8z" fill="#fff" stroke="#000"/><path d="M19 4v5h5" fill="none" stroke="#000"/></svg>',
  topt: '<svg viewBox="0 0 32 32"><polygon points="12,4 20,4 20,6 18,6 18,13 26,26 25,28 7,28 6,26 14,13 14,6 12,6" fill="#eaf6ff" stroke="#000"/><polygon points="9.5,22 22.5,22 26,26 25,28 7,28 6,26" fill="#3a9bd5"/><circle cx="16" cy="25" r="1.3" fill="#fff"/><circle cx="19.5" cy="24" r="1" fill="#fff"/><rect x="22" y="5" width="3" height="9" fill="#fff" stroke="#000"/><circle cx="23.5" cy="16" r="2.4" fill="#d22" stroke="#000"/><rect x="23" y="9" width="1" height="7" fill="#d22"/></svg>',
  spice: '<svg viewBox="0 0 32 32"><path d="M10 9C6 15 8 25 22 28c3 .4 4.500-3 1-5C17 20 16 15 15 9z" fill="#d6262c" stroke="#000"/><path d="M10 9C9.500 5.500 13 4 16 5.500" fill="none" stroke="#1a8a2a" stroke-width="2.500"/><path d="M12 12c-1.500 4-.5 8 2 10" fill="none" stroke="#f78" stroke-width="1.200"/></svg>',
  computer: '<svg viewBox="0 0 32 32"><rect x="4" y="5" width="24" height="16" fill="#c0c0c0" stroke="#000"/><rect x="7" y="8" width="18" height="10" fill="#1aa"/><rect x="10" y="24" width="12" height="3" fill="#c0c0c0" stroke="#000"/></svg>',
  bin: '<svg viewBox="0 0 32 32"><path d="M8 9h16l-2 18H10z" fill="#c0c0c0" stroke="#000"/><path d="M6 7h20" stroke="#000" stroke-width="2"/><path d="M13 12v12M19 12v12" stroke="#808080"/></svg>',
  binFull: '<svg viewBox="0 0 32 32"><polygon points="11,8 14,3 19,4 18,9" fill="#fff" stroke="#000"/><polygon points="17,8 21,4 25,6 22,10" fill="#fff" stroke="#000"/><path d="M8 9h16l-2 18H10z" fill="#c0c0c0" stroke="#000"/><path d="M6 8h20" stroke="#000" stroke-width="2"/><path d="M13 12v12M19 12v12" stroke="#808080"/></svg>',
  img: '<svg viewBox="0 0 32 32"><rect x="4" y="6" width="24" height="20" fill="#fff" stroke="#000"/><rect x="6" y="8" width="20" height="16" fill="#8cf"/><path d="M6 24l7-9 5 6 3-3 5 6z" fill="#080"/><circle cx="21" cy="12" r="2" fill="#fd0"/></svg>',
  find: '<svg viewBox="0 0 32 32"><circle cx="13" cy="13" r="8" fill="#cfe9ff" stroke="#000" stroke-width="2"/><path d="M19 19l9 9" stroke="#000" stroke-width="4"/><path d="M9 11a5 5 0 0 1 4-4" stroke="#fff" stroke-width="2" fill="none"/></svg>',
  pad: '<svg viewBox="0 0 32 32"><rect x="6" y="6" width="20" height="22" fill="#fff" stroke="#000"/><rect x="6" y="6" width="20" height="5" fill="#008080" stroke="#000"/><path d="M10 3v6M14 3v6M18 3v6M22 3v6" stroke="#000" stroke-width="2"/><path d="M9 16h14M9 20h14M9 24h9" stroke="#22c"/></svg>',
  notepad: '<svg viewBox="0 0 32 32"><rect x="7" y="4" width="18" height="24" fill="#fff" stroke="#000"/><path d="M10 10h12M10 14h12M10 18h12M10 22h8" stroke="#22c"/></svg>',
  ie: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#3a7bd5" stroke="#000"/><text x="16" y="23" font-size="19" font-family="serif" font-weight="bold" fill="#fff" text-anchor="middle">e</text></svg>'
};
// Icons from the Windows 98 set in assets/icons (32x32 PNGs wrapped in an svg so existing sizing rules still apply).
// Remove the assets/icons folder and this block to fall back to the hand-drawn svgs above (topt and spice stay hand-drawn either way).
{
  const px = n => '<svg viewBox="0 0 32 32"><image href="assets/icons/' + n + '.png" width="32" height="32"/></svg>';
  ['computer', 'bin', 'binFull', 'pad', 'notepad', 'folder', 'file', 'drive', 'floppy', 'ie', 'find', 'img', 'printers', 'ctrl', 'dialup', 'help', 'run', 'shut'].forEach(k => { ICON[k] = px(k); });
}
const WELCOME = "Welcome to bophacking's portfolio page.\n\nTo skip immediately to the details, I've \nprovided a skip button above the texts.\n\nYou can also access it and my other projects through the desktop icons.\n\nWe don't provide free drinks, but feel free to explore as you wish.\n\nBeyond all ideas of right and wrong, there is a field. I will be meeting you there.\n";
const stub = t => () => { const d = document.createElement('div'); d.className = 'stub'; d.textContent = t; return d; };
const APPS = {
  computer: { multi: true, label: 'My Computer', title: 'My Computer', icon: 'computer', w: 480, h: 320, x: 60, y: 40, body: ctx => explorerBody(ctx) },
  bin: { label: 'Recycle Bin', title: 'Recycle Bin', icon: 'bin', w: 560, h: 300, x: 90, y: 70, body: ctx => binBody(ctx) },
  welcome: { multi: true, label: 'Welcome Guide', title: 'Welcome Guide - Notepad', icon: 'notepad', w: 400, h: 300, x: 140, y: 50, body: ctx => { const f = FS.node(['content', 'welcome-guide.txt']); const r = notepadBody(ctx, f && f.text !== undefined ? f.text : WELCOME, 'welcome-guide.txt'); r.insertBefore(skipLink(), r.querySelector('.pad')); return r; } },
  viewer: { label: 'Imaging', title: 'Imaging', icon: 'img', w: 300, h: 290, x: 160, y: 70, hidden: true, body: ctx => viewerBody(ctx) },
  find: { label: 'Find', title: 'Find: All Files', icon: 'find', w: 520, h: 360, x: 130, y: 60, hidden: true, body: ctx => findBody(ctx) },
  notepad: { multi: true, label: 'Notepad', title: 'Untitled - Notepad', icon: 'pad', w: 440, h: 320, x: 120, y: 60, body: ctx => notepadBody(ctx, ctx.opts.text || '') },
  topt: { label: 'Topt Predictor', title: 'Enzyme Topt Predictor', icon: 'topt', w: 580, h: 520, x: 90, y: 20, body: ctx => toptBody(ctx) },
  spice: { label: 'SPICE', title: 'SPICE - Restaurant Price Picker', icon: 'spice', w: 680, h: 480, x: 120, y: 30, body: ctx => spiceBody(ctx) },
  portfolio: { label: 'Portfolio', title: 'Portfolio - Internet Explorer', icon: 'ie', w: 800, h: 580, x: 150, y: 14, body: ctx => portfolioBody(ctx) }
};

// "Skip to portfolio": opens the Portfolio window maximized right away.
function skipLink() {
  const a = document.createElement('a'); a.className = 'skip'; a.href = '#portfolio'; a.textContent = '\u25B6 Skip to portfolio';
  a.addEventListener('click', e => { e.preventDefault(); openMax('portfolio'); });
  return a;
}
