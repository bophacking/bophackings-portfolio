const start = $('#start');
start.addEventListener('click', e => { e.stopPropagation(); start.classList.toggle('pr', menu.classList.toggle('open')); });
document.addEventListener('pointerdown', e => { if (!e.target.closest('#menu,#start')) { menu.classList.remove('open'); start.classList.remove('pr'); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { menu.classList.remove('open'); start.classList.remove('pr'); } });

function tick() { const d = new Date(); $('#clock').textContent = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); $('#clock').title = d.toLocaleDateString([], { dateStyle: 'full' }); }
tick(); setInterval(tick, 15000);
