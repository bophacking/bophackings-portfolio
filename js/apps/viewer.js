// Image viewer ("Imaging"): shows one picture. opts.src is the image URL.
function viewerBody(ctx) {
  const root = document.createElement('div'); root.className = 'vwr';
  const bar = menuBar({ File: [['Close', () => ctx.close()]], Help: [['About Imaging', () => dialog({ parent: ctx.w, title: 'About Imaging', icon: 'i', text: 'Imaging (bophacking edition)\nShows a picture. That is all it does.' })]] });
  const box = document.createElement('div'); box.className = 'vbox sunk';
  const img = document.createElement('img'); img.src = ctx.opts.src; img.alt = ctx.opts.label || 'Image';
  img.onerror = () => { box.textContent = 'This picture could not be loaded.'; };
  box.appendChild(img); root.append(bar, box); return root;
}
