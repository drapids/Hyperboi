import { blankMap, newObject, blankAnim } from './mapfile.js';

function make(map, piece, pos, extra = {}) {
  const o = newObject(piece, pos);
  if (extra.size) o.scale = extra.size.map((v) => v / 100);
  if (extra.rot) o.rot = extra.rot;
  if (extra.color) o.color = extra.color;
  if (extra.p) Object.assign(o.p, extra.p);
  if (extra.name) o.name = extra.name;
  if (extra.group) o.group = extra.group;
  if (extra.anim) o.anim = { ...blankAnim(), ...extra.anim };
  if (extra.look) Object.assign(o.look, extra.look);
  map.objects.push(o);
  return o;
}

function blank() {
  const m = blankMap();
  m.meta.name = 'Untitled map';
  make(m, 'platform', [0, 0, -25], { size: [600, 600, 50] });
  make(m, 'spawn', [0, 0, 0]);
  return m;
}

function starter() {
  const m = blankMap();
  m.meta.name = 'First roll';
  m.meta.description = 'A short warm-up with a ramp, a bend, some pillars, a bounce and a moving bridge.';
  m.meta.difficulty = 'Easy';
  m.meta.gems = { diamond: 18, emerald: 22, gold: 28, steel: 40, rock: 60 };
  make(m, 'platform', [0, 0, -25], { size: [600, 600, 50], color: '#eef1f8' });
  make(m, 'spawn', [0, 0, 0]);
  make(m, 'sign', [900, 0, 450], { rot: [0, 180, 0], p: { text: 'Roll!', height: 160 } });
  make(m, 'ramp', [300, 0, 0], { p: { length: 900, rise: 300, width: 400, thickness: 40 } });
  make(m, 'platform', [1500, 0, 275], { size: [600, 600, 50], color: '#6e8fe0' });
  make(m, 'curve', [1800, 0, 280], { p: { radius: 1000, angle: 90, width: 400, thickness: 40, bank: 12, rise: 0, segments: 18 } });
  make(m, 'platform', [2800, 1150, 275], { size: [500, 500, 50] });
  make(m, 'pillars', [2800, 1650, 0], { rot: [0, 90, 0], p: { count: 5, spacing: 380, height: 300, diameter: 200, step: 0 }, color: '#1c3faa' });
  make(m, 'kill', [2800, 2400, -200], { size: [1600, 2000, 100] });
  make(m, 'platform', [2800, 3500, 275], { size: [700, 700, 50] });
  make(m, 'checkpoint', [2800, 3500, 450], { size: [700, 700, 300], p: { order: 1 } });
  make(m, 'bounce', [2800, 3500, 340], { size: [220, 220, 80], p: { power: 2400, keep: true } });
  make(m, 'platform', [2800, 4500, 1175], { size: [600, 600, 50], color: '#f2b33d' });
  make(m, 'platform', [2800, 5100, 1175], { size: [400, 400, 50], color: '#f08bb4', name: 'Moving bridge', anim: { move: { points: [[0, 1300, 0]], duration: 3.2, mode: 'pingpong', ease: 'smooth', delay: 0 } } });
  make(m, 'platform', [2800, 7000, 1175], { size: [800, 800, 50], color: '#15161c' });
  make(m, 'finish', [2800, 7000, 1350], { size: [800, 800, 300] });
  make(m, 'light', [2800, 7000, 1700], { color: '#ffd9a0' });
  return m;
}

function showcase() {
  const m = blankMap();
  m.meta.name = 'Fever lab';
  m.meta.description = 'Shows off triggers, spinners, a teleporter, a wind tube, low gravity and blinking floors.';
  m.meta.difficulty = 'Hard';
  m.meta.gems = { diamond: 35, emerald: 45, gold: 60, steel: 90, rock: 140 };
  make(m, 'platform', [0, 0, -25], { size: [800, 800, 50] });
  make(m, 'spawn', [-200, 0, 0]);
  make(m, 'stairs', [400, 0, 0], { p: { steps: 8, run: 120, riseStep: 45, width: 400, gap: 0 }, color: '#6e8fe0' });
  make(m, 'platform', [1700, 0, 335], { size: [1000, 800, 50] });
  make(m, 'cube', [1700, 0, 410], { size: [60, 700, 100], color: '#e23a2e', name: 'Sweeper', anim: { spin: { axis: 'world-up', speed: 90 } } });
  make(m, 'trigger', [1700, 0, 500], { size: [300, 300, 300], p: { channel: 'gate', once: true } });
  make(m, 'wall', [2240, 0, 560], { size: [40, 800, 400], color: '#1c3faa', name: 'Gate', anim: { start: 'trigger', channel: 'gate', move: { points: [[0, 0, -450]], duration: 1.2, mode: 'once', ease: 'smooth', delay: 0 } } });
  make(m, 'tube', [2300, 0, 360], { p: { radius: 350, length: 2000, sides: 18, thickness: 30 }, color: '#8fe3c8' });
  make(m, 'wind', [3300, 0, 700], { size: [2000, 600, 600], p: { force: 1200 } });
  make(m, 'platform', [4800, 0, 335], { size: [1000, 1000, 50] });
  make(m, 'checkpoint', [4800, 0, 510], { size: [1000, 1000, 300], p: { order: 1 } });
  const tp = make(m, 'teleport', [5100, 0, 485], { size: [200, 200, 250] });
  const ex = make(m, 'exit', [5000, 2600, 2400]);
  tp.p.exit = ex.id;
  ex.p.link = tp.id;
  make(m, 'disc', [5000, 2600, 2385], { size: [700, 700, 30], color: '#7b5cd6' });
  make(m, 'gravity', [5000, 3800, 2900], { size: [1200, 2000, 1600], p: { scale: 0.25 } });
  for (let i = 0; i < 4; i++) make(m, 'platform', [5000, 3200 + i * 450, 2385 + i * 120], { size: [350, 350, 40], color: i % 2 ? '#f08bb4' : '#ffffff', group: 'Blinkers', anim: { blink: { on: 1.6, off: 0.8, offset: i * 0.6 } } });
  make(m, 'hoop', [5000, 5300, 3200], { rot: [0, 90, 0], p: { radius: 400, sides: 20, thickness: 40 } });
  make(m, 'platform', [5000, 6400, 2585], { size: [900, 900, 50], color: '#15161c' });
  make(m, 'finish', [5000, 6400, 2760], { size: [900, 900, 300] });
  make(m, 'kill', [3000, 3000, -600], { size: [12000, 12000, 100] });
  make(m, 'light', [1700, 0, 900], { color: '#ffb0c8' });
  make(m, 'light', [5000, 6400, 3000], { color: '#b8c8ff' });
  make(m, 'sign', [5600, 0, 900], { rot: [0, 180, 0], p: { text: 'Jump in', height: 120 } });
  return m;
}

export const TEMPLATES = [
  { name: 'Blank', blurb: 'A spawn on a single platform. Build from nothing.', make: blank },
  { name: 'First roll', blurb: 'A short starter course to pull apart and learn from.', make: starter },
  { name: 'Fever lab', blurb: 'Triggers, spinners, teleporter, wind tube and low gravity.', make: showcase }
];
