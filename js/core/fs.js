// Virtual filesystem over window.MANIFEST (D:). Paths are arrays of names below D:.
const FS = {
  node(parts) { let n = window.MANIFEST; for (const p of parts) { n = (n.children || []).find(c => c.name === p); if (!n) return null; } return n; },
  json(parts) { const n = FS.node(parts); if (!n || n.text === undefined) throw new Error('Missing file: D:\\' + parts.join('\\')); return JSON.parse(n.text); },
  kids(parts) { const n = FS.node(parts); return n && n.children ? n.children.filter(c => typeof BIN === 'undefined' || !BIN.has('D:/' + parts.concat(c.name).join('/'))) : []; },
  type(n) {
    if (n.type === 'dir') return 'File Folder';
    const e = (n.name.split('.').pop() || '').toLowerCase();
    return { txt: 'Text Document', js: 'JavaScript File', css: 'Cascading Style Sheet', html: 'HTML Document', json: 'JSON File', csv: 'CSV File', md: 'Markdown File', pdf: 'PDF Document', png: 'PNG Image', jpg: 'JPEG Image', jpeg: 'JPEG Image', gif: 'GIF Image', webp: 'WebP Image', mp3: 'MP3 Audio File', woff2: 'Font File', svg: 'SVG Image', fasta: 'FASTA Sequence' }[e] || 'File';
  }
};
