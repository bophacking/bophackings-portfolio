#!/usr/bin/env node
// Scans the project folder and writes manifest.json + js/manifest.js (the .js copy also works when opened from disk).
// Small text files are embedded so Notepad can open them without fetch(). Run: node tools/build-manifest.js
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), SKIP = new Set(['manifest.json', 'manifest.js', 'node_modules']);
const HIDE = new Set(['assets/c']);                     // C: drive files: served from here, listed on C:, not on D:
const TEXT = /\.(txt|md|js|css|html|json|csv|fasta)$/i, LIMIT = 64 * 1024, NO_EMBED = new Set(['tools/parity']);
function scan(dir, name) {
  const rel = path.relative(ROOT, dir).split(path.sep).join('/');
  const kids = fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => !SKIP.has(d.name) && !d.name.startsWith('.') && !d.name.endsWith('.zip') && !HIDE.has((rel ? rel + '/' : '') + d.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(d => {
      const p = path.join(dir, d.name);
      if (d.isDirectory()) return scan(p, d.name);
      const st = fs.statSync(p), n = { name: d.name, type: 'file', size: st.size };
      if (TEXT.test(d.name) && st.size <= LIMIT && !NO_EMBED.has(rel)) n.text = fs.readFileSync(p, 'utf8');
      return n;
    });
  return { name, type: 'dir', children: kids };
}
const tree = scan(ROOT, 'D:');
fs.writeFileSync(path.join(ROOT, 'manifest.json'), JSON.stringify(tree, null, 1));
const cdir = path.join(ROOT, 'assets', 'c'), cfiles = fs.existsSync(cdir) ? fs.readdirSync(cdir).filter(f => !f.startsWith('.')).map(f => ({ name: f, size: fs.statSync(path.join(cdir, f)).size, url: 'assets/c/' + f })) : [];
fs.writeFileSync(path.join(ROOT, 'js', 'manifest.js'), 'window.MANIFEST=' + JSON.stringify(tree) + ';\nwindow.CDRIVE=' + JSON.stringify(cfiles) + ';\n');
console.log('manifest written');
