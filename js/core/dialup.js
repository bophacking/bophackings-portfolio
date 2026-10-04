// Dial-Up Networking: plays a modem handshake while a "Connecting to..." box is up.
// If assets/sounds/dialup.mp3 exists it plays that; otherwise it synthesizes an original handshake with Web Audio.
const DIALUP_FILE = 'assets/sounds/dialup.mp3';
function synthDialup() {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  const ac = new AC(), out = ac.createGain(); out.gain.value = 0.16; out.connect(ac.destination);
  const t0 = ac.currentTime + 0.05, nodes = [];
  const tone = (freqs, at, dur, type = 'sine', g = 1) => freqs.forEach(f => {
    const o = ac.createOscillator(), v = ac.createGain(); o.type = type; o.frequency.value = f; v.gain.value = g / freqs.length;
    o.connect(v); v.connect(out); o.start(t0 + at); o.stop(t0 + at + dur); nodes.push(o);
  });
  tone([350, 440], 0, 0.7);                                                        // dial tone
  const L = [697, 770, 852, 941], H = [1209, 1336, 1477];
  [5, 5, 5, 1, 2, 3, 4].forEach((d, i) => tone([L[(d * 7 + i) % 4], H[(d + i) % 3]], 0.9 + i * 0.17, 0.1));   // digits
  tone([2100], 3.3, 1.4, 'sine', 0.9);                                             // answer tone
  [1300, 2225, 1300, 2225].forEach((f, i) => tone([f], 4.9 + i * 0.12, 0.1));       // short calling tones
  let t = 5.6;                                                                      // the screech: stepping tones plus noise
  const o = ac.createOscillator(), v = ac.createGain(); o.type = 'square'; v.gain.value = 0.35; o.connect(v); v.connect(out);
  while (t < 11.5) { o.frequency.setValueAtTime(900 + Math.random() * 1900, t0 + t); t += 0.03 + Math.random() * 0.05; }
  v.gain.setValueAtTime(0.35, t0 + 9.5); v.gain.linearRampToValueAtTime(0.0, t0 + 11.6); o.start(t0 + 5.6); o.stop(t0 + 11.7); nodes.push(o);
  const buf = ac.createBuffer(1, ac.sampleRate * 7, ac.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const ns = ac.createBufferSource(), bp = ac.createBiquadFilter(), ng = ac.createGain(); ns.buffer = buf; bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.6;
  ng.gain.setValueAtTime(0.0, t0 + 6.5); ng.gain.linearRampToValueAtTime(0.5, t0 + 8); ng.gain.linearRampToValueAtTime(0.0, t0 + 12.2);
  ns.connect(bp); bp.connect(ng); ng.connect(out); ns.start(t0 + 6.5); ns.stop(t0 + 12.3); nodes.push(ns);
  return { dur: 12.4, stop() { nodes.forEach(n => { try { n.stop(); } catch (e) {} }); ac.close(); } };
}
function synthHandle() {
  const s = synthDialup(); if (!s) return null;
  let ended = null; const id = setTimeout(() => ended && ended(), s.dur * 1000);
  return { onend: fn => { ended = fn; }, stop() { clearTimeout(id); s.stop(); } };
}
function startDialupSound() {
  if (!FS.node(['assets', 'sounds', 'dialup.mp3'])) return synthHandle();
  let ended = null, inner = null; const a = new Audio(DIALUP_FILE);
  const fallback = () => { if (inner || a.ended) return; inner = synthHandle(); if (inner) inner.onend(() => ended && ended()); };   // file missing, blocked or undecodable
  a.addEventListener('ended', () => ended && ended()); a.addEventListener('error', fallback);
  const p = a.play(); if (p && p.catch) p.catch(fallback);
  return { onend: fn => { ended = fn; }, stop() { a.pause(); if (inner) inner.stop(); } };
}
async function dialUp(parent) {
  document.body.classList.add('busy');
  const snd = startDialupSound(), name = 'afterlife.net';
  const stages = [[0, 'Dialing...'], [3200, 'Waiting for the other modem...'], [5500, 'Negotiating... Verifying user name and password...']];
  const timers = []; let msg = null, done = false;
  const pr = dialog({ parent, title: 'Connecting to ' + name, icon: 'i', buttons: ['Cancel'], text: stages[0][1] });
  const box = () => msg || (msg = [...document.querySelectorAll('.dlg')].pop());
  stages.forEach(([ms, t]) => timers.push(setTimeout(() => { const m = box() && box().querySelector('.msg'); if (m) m.textContent = t; }, ms)));
  if (snd) snd.onend(() => { done = true; const b = box() && box().querySelector('.dbtns button'); if (b) b.click(); });
  else timers.push(setTimeout(() => { done = true; const b = box() && box().querySelector('.dbtns button'); if (b) b.click(); }, 9000));
  await pr; timers.forEach(clearTimeout); document.body.classList.remove('busy');
  if (!done) { if (snd) snd.stop(); return; }
  setTimeout(() => dialog({ parent, title: 'Connected to the afterlife', icon: 'i', text: 'You are now connected to the afterlife. Congratulations!' }), 150);
}
