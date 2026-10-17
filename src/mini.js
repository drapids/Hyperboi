const el = (id) => document.getElementById(id);

window.hb.on('mini', (d) => {
  el('spd').textContent = String(d.speed).padStart(3, '0');
  el('unit').textContent = d.unit;
  el('tmr').textContent = d.timer;
  el('dot').style.background = d.link === 'live' ? '#6fe3b4' : d.link === 'waiting' ? '#ffb21a' : '#ff8fb8';
  const html = d.active.length
    ? d.active.map((a) => `<span class="px-1.5 rounded bg-amber/15 text-amber text-[11px] font-medium whitespace-nowrap">${a}</span>`).join('')
    : '<span class="text-[11px] text-mute">No cheats on</span>';
  if (el('act').innerHTML !== html) el('act').innerHTML = html;
});
