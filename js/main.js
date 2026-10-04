openApp('welcome');
document.querySelector('.ic[data-id="portfolio"]').classList.add('hint');
document.querySelector('.ic[data-id="portfolio"]').addEventListener('dblclick', () => document.querySelector('.ic.hint')?.classList.remove('hint'));

// Deep link: index.html#topt opens that app (used by the "Open the app" links on the portfolio pages).
{ const id = decodeURIComponent(location.hash.slice(1)); if (id && APPS[id] && !APPS[id].hidden) (id === 'portfolio' ? openMax : openApp)(id); }
