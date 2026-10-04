// Opens a file node by type. parents = folder names below D:, n = manifest node, dlgf = dialog function (so errors parent to the caller).
function openFileNode(parents, n, dlgf, drive) {
  drive = drive || 'D:';
  const ext = (n.name.split('.').pop() || '').toLowerCase(), full = parents.concat(n.name).join('/');
  if (['txt', 'md', 'js', 'css', 'html', 'json'].includes(ext)) {
    if (n.text === undefined) return dlgf({ title: n.name, icon: 'w', text: 'This file is too large to open in Notepad.' });
    openApp('notepad', { key: 'np:' + full, title: n.name + ' - Notepad', label: n.name, text: n.text });
  } else if (ext === 'pdf') { const a = document.createElement('a'); a.href = full; a.target = '_blank'; a.click(); }
  else if (ext === 'fasta' || ext === 'csv') {
    if (n.text === undefined) return dlgf({ title: n.name, icon: 'w', text: 'This file is too large to open here.' });
    openApp(ext === 'fasta' ? 'topt' : 'spice', { load: { name: n.name, text: n.text } });
  }
  else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) openApp('viewer', { key: 'img:' + drive + '/' + full, title: n.name + ' - Imaging', label: n.name, src: n.url || full });
  else dlgf({ title: n.name, icon: 'w', text: 'Windows cannot open this file.\nNo program is associated with it.' });
}
function openFolderWindow(parts) { openApp('computer', { key: 'computer:' + parts.join('/'), path: parts }); }   // parts includes 'D:'
