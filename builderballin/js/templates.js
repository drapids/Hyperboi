import { blankMap, newObject, blankAnim } from './mapfile.js';

function make(map, piece, pos, extra = {}) {
  const o = newObject(piece, pos);
  if (extra.size) o.scale = extra.size.map((v) => v / 100);
  if (extra.scale) o.scale = extra.scale;
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
  make(m, 'spawn', [0, 0, 0], { p: { mode: 'float', speedMin: 3000, speedMax: 3000 } });
  make(m, 'marble_line', [5000, 0, 800], { p: { count: 5, spacing: 4800, rise: 300, mode: 'float' } });
  make(m, 'finish', [34000, 0, 3000], { p: { size: 1 } });
  make(m, 'kill', [15000, 0, -40000], { size: [200000, 200000, 2000] });
  return m;
}

function hop() {
  const m = blankMap();
  m.meta.name = 'Marble hop';
  m.meta.description = 'Floating marbles all the way. Lines, a zigzag, a spiral and a ring to land on.';
  m.meta.difficulty = 'Easy';
  m.meta.gems = { diamond: 25, emerald: 32, gold: 42, steel: 60, rock: 90 };
  make(m, 'spawn', [0, 0, 0], { p: { mode: 'float', speedMin: 4000, speedMax: 4000, color: 'coral' } });
  make(m, 'sign', [6000, -9000, 6000], { rot: [0, 90, 0], p: { text: 'floors hurt. ride the marbles', height: 2200 } });
  make(m, 'marble_line', [5200, 0, 600], { p: { count: 7, spacing: 4800, rise: 500, turn: 4, color: 'cycle', mode: 'float' } });
  make(m, 'marble_zig', [37000, 7500, 4200], { rot: [0, 28, 0], p: { count: 8, spacing: 4200, offset: 2400, rise: 300, color: 'lime', mode: 'float' } });
  make(m, 'checkpoint', [68000, 23000, 8000], { size: [9000, 9000, 7000] });
  make(m, 'marble_ring', [80000, 30000, 7500], { p: { count: 12, radius: 9000, wobble: 1500, waves: 3, color: 'yellow', mode: 'float' } });
  make(m, 'marble_spiral', [80000, 30000, 9500], { p: { count: 16, radius: 4600, turn: 32, rise: 1100, color: 'magenta', mode: 'float' } });
  make(m, 'marble_line', [86000, 34000, 27500], { rot: [0, 35, 0], p: { count: 6, spacing: 5200, rise: -400, color: 'mint', mode: 'drift' } });
  make(m, 'finish', [116000, 54000, 25000], { rot: [0, 35, 0], p: { size: 1 } });
  make(m, 'kill', [60000, 25000, -40000], { size: [300000, 300000, 2000] });
  make(m, 'light', [80000, 30000, 16000], { color: '#ffb0ff', p: { intensity: 400000, radius: 40000 } });
  return m;
}

function downhill() {
  const m = blankMap();
  m.meta.name = 'Downhill';
  m.meta.description = 'Built the way the real stages are: a wooden track, a spawner running ahead of you throwing marbles down it, and the Dominus at the end of a kicker.';
  m.meta.difficulty = 'Medium';
  m.meta.gems = { diamond: 20, emerald: 26, gold: 34, steel: 48, rock: 70 };
  const wood = { width: 9000, thickness: 400, walls: 1500 };
  make(m, 'track', [0, 0, 0], { p: { ...wood, length: 30000, drop: 4000 } });
  make(m, 'track_curve', [30000, 0, -4000], { p: { radius: 20000, angle: 90, width: 9000, thickness: 400, bank: 8, rise: -3000, segments: 24 } });
  make(m, 'track', [50000, 20000, -7000], { rot: [0, 90, 0], p: { ...wood, length: 40000, drop: 6000 } });
  make(m, 'track_kicker', [50000, 60000, -13000], { rot: [0, 90, 0], p: { radius: 15000, angle: 35, width: 9000, thickness: 400, segments: 12 } });
  make(m, 'spawn', [2500, 0, -330], { p: { mode: 'roll', speedMin: 8000, speedMax: 8000 } });
  make(m, 'spawner', [3000, 0, 8000], {
    name: 'Runs ahead of you',
    p: { interval: 0.45, spread: 6000, speedMin: 4000, speedMax: 9000, angle: 30, max: 70, mode: 'roll', color: 'random' },
    anim: { move: { points: [[20000, 0, -3000], [40000, 8000, -5500], [47000, 20000, -7000], [47000, 50000, -11000]], duration: 16, mode: 'loop', ease: 'linear', delay: 0 } }
  });
  make(m, 'checkpoint', [50000, 30000, -5500], { size: [9000, 9000, 6000] });
  make(m, 'marble_line', [50000, 78000, -8200], { rot: [0, 90, 0], p: { count: 4, spacing: 5000, rise: 700, mode: 'float', color: 'yellow' } });
  make(m, 'finish', [50000, 104000, -4500], { rot: [0, 90, 0], p: { size: 1 } });
  make(m, 'g_pillar', [22000, 16000, -48000]);
  make(m, 'g_pillar', [64000, 38000, -50000]);
  make(m, 'g_block', [-14000, 0, -6000], { rot: [0, 0, -90], scale: [10, 10, 10] });
  make(m, 'sign', [9000, -8000, 4000], { rot: [0, 180, 0], p: { text: 'keep rolling', height: 2400 } });
  make(m, 'kill', [40000, 50000, -32000], { size: [240000, 240000, 2000] });
  return m;
}

function fever() {
  const m = blankMap();
  m.meta.name = 'Fever lab';
  m.meta.description = 'Drifting marbles in slow motion, a ring around a spiral, low gravity and a gate that opens on a trigger.';
  m.meta.difficulty = 'Hard';
  m.meta.gems = { diamond: 40, emerald: 52, gold: 68, steel: 95, rock: 140 };
  make(m, 'spawn', [0, 0, 0], { p: { mode: 'float', speedMin: 5000, speedMax: 5000, color: 'mint' } });
  make(m, 'marble_line', [5200, 0, 500], { p: { count: 5, spacing: 5000, rise: 0, color: 'mint', mode: 'float' } });
  make(m, 'slowmo', [42000, 0, 3000], { size: [30000, 30000, 18000], p: { speed: 0.45 } });
  make(m, 'marble_cloud', [42000, 0, 3000], { p: { count: 26, sizeX: 26000, sizeY: 22000, sizeZ: 9000, gap: 1500, seed: 7, color: 'cycle', mode: 'drift' } });
  make(m, 'trigger', [56000, 0, 4000], { size: [8000, 20000, 12000], p: { channel: 'gate', once: true } });
  make(m, 'wall', [62000, 0, 4000], { rot: [0, 90, 0], size: [24000, 600, 16000], color: '#2a2740', name: 'Gate', anim: { start: 'trigger', channel: 'gate', move: { points: [[0, 0, -22000]], duration: 1.4, mode: 'once', ease: 'smooth', delay: 0 } } });
  make(m, 'marble_line', [60000, 0, 3500], { p: { count: 4, spacing: 5200, rise: 400, color: 'lime', mode: 'float' } });
  make(m, 'marble_ring', [92000, 0, 6000], { p: { count: 14, radius: 11000, wobble: 2000, waves: 2, color: 'yellow', mode: 'float' } });
  make(m, 'marble_spiral', [92000, 0, 8000], { p: { count: 18, radius: 5000, turn: 30, rise: 1200, color: 'magenta', mode: 'float' }, anim: { spin: { axis: 'world-up', speed: 12 } } });
  make(m, 'gravity', [92000, 0, 18000], { size: [30000, 30000, 30000], p: { scale: 0.35 } });
  make(m, 'finish', [92000, 0, 36000], { rot: [-90, 0, 0], p: { size: 1 } });
  make(m, 'kill', [50000, 0, -40000], { size: [300000, 300000, 2000] });
  make(m, 'light', [42000, 0, 9000], { color: '#9dffca', p: { intensity: 400000, radius: 40000 } });
  make(m, 'light', [92000, 0, 20000], { color: '#ff8165', p: { intensity: 400000, radius: 40000 } });
  return m;
}

export const TEMPLATES = [
  { name: 'Blank', blurb: 'A start, a few marbles and the Dominus. Build from there.', make: blank },
  { name: 'Marble hop', blurb: 'Floating marbles all the way. The easiest kind of map to make.', make: hop },
  { name: 'Downhill', blurb: 'Like the real stages: wooden track, a spawner throwing marbles, a kicker into the Dominus.', make: downhill },
  { name: 'Fever lab', blurb: 'Slow motion drifters, a spinning spiral, low gravity and a trigger gate.', make: fever }
];
