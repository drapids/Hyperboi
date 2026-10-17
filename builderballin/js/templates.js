import { blankMap, newObject, blankAnim } from './mapfile.js';

function make(map, piece, pos, extra = {}) {
  const o = newObject(piece, pos.map((v) => Math.round(v)));
  if (extra.size) o.scale = extra.size.map((v) => v / 100);
  if (extra.scale) o.scale = extra.scale;
  if (extra.rot) o.rot = extra.rot.map((v) => Math.round(v * 100) / 100);
  if (extra.color) o.color = extra.color;
  if (extra.p) Object.assign(o.p, extra.p);
  if (extra.name) o.name = extra.name;
  if (extra.group) o.group = extra.group;
  if (extra.anim) o.anim = { ...blankAnim(), ...extra.anim };
  if (extra.look) Object.assign(o.look, extra.look);
  map.objects.push(o);
  return o;
}

const D = Math.PI / 180;

class Path {
  constructor(map, pos, yaw, look = {}) {
    this.map = map;
    this.pos = pos.slice();
    this.yaw = yaw;
    this.width = look.width || 10000;
    this.walls = look.walls ?? 1800;
    this.group = look.group || 'track';
  }
  local(v) {
    const c = Math.cos(this.yaw * D);
    const s = Math.sin(this.yaw * D);
    return [this.pos[0] + v[0] * c - v[1] * s, this.pos[1] + v[0] * s + v[1] * c, this.pos[2] + v[2]];
  }
  straight(length, drop, extra = {}) {
    const start = { pos: this.pos.slice(), yaw: this.yaw };
    make(this.map, 'track', this.pos, { rot: [0, this.yaw, 0], group: this.group, p: { length, drop, width: extra.width || this.width, thickness: 400, walls: extra.walls ?? this.walls } });
    this.pos = this.local([length, 0, -drop]);
    return start;
  }
  right(radius, angle, rise, bank = 12) {
    const start = { pos: this.pos.slice(), yaw: this.yaw };
    make(this.map, 'track_curve', this.pos, { rot: [0, this.yaw, 0], group: this.group, p: { radius, angle, rise, bank, width: this.width, thickness: 400, segments: Math.max(8, Math.round(angle / 4)) } });
    this.pos = this.local([radius * Math.sin(angle * D), radius * (1 - Math.cos(angle * D)), rise]);
    this.yaw += angle;
    return start;
  }
  kicker(radius, angle) {
    const start = { pos: this.pos.slice(), yaw: this.yaw };
    make(this.map, 'track_kicker', this.pos, { rot: [0, this.yaw, 0], group: this.group, p: { radius, angle, width: this.width, thickness: 400, segments: 12 } });
    this.pos = this.local([radius * Math.sin(angle * D), 0, radius * (1 - Math.cos(angle * D))]);
    return start;
  }
  ahead(dist, side = 0, up = 0) {
    return this.local([dist, side, up]);
  }
}

function at(seg, v) {
  const c = Math.cos(seg.yaw * D);
  const s = Math.sin(seg.yaw * D);
  return [seg.pos[0] + v[0] * c - v[1] * s, seg.pos[1] + v[0] * s + v[1] * c, seg.pos[2] + v[2]];
}

function spawner(map, seg, extra = {}) {
  return make(map, 'spawner', at(seg, [2500, 0, extra.height ?? 3200]), {
    rot: [0, seg.yaw, 0],
    name: extra.name || 'Marble feed',
    p: { interval: extra.every ?? 0.55, spread: extra.spread ?? 5500, speedMin: extra.min ?? 4500, speedMax: extra.max ?? 9500, angle: extra.angle ?? 24, max: extra.cap ?? 30, mode: 'roll', color: extra.color || 'random' }
  });
}

function marbleRun() {
  const m = blankMap();
  m.meta.name = 'Marble run';
  m.meta.description = 'Long wooden run with marbles pouring down it. Ride one, hop to the next, and take the kicker into the Dominus.';
  m.meta.difficulty = 'Easy';
  m.meta.gems = { diamond: 30, emerald: 38, gold: 48, steel: 65, rock: 95 };
  const p = new Path(m, [0, 0, 0], 0, { width: 11000, walls: 2200 });
  const s1 = p.straight(45000, 7000);
  const c1 = p.right(26000, 90, -4500, 14);
  const s2 = p.straight(55000, 9000);
  const c2 = p.right(26000, 90, -4500, 14);
  const s3 = p.straight(35000, 6000);
  p.kicker(16000, 32);
  const lip = p.pos.slice();
  const yaw = p.yaw;
  make(m, 'spawn', at(s1, [3000, 0, 0]), { rot: [0, s1.yaw, 0], p: { mode: 'roll', speedMin: 7000, speedMax: 9000, color: 'coral' } });
  spawner(m, s1, { name: 'Top feed', every: 0.5 });
  spawner(m, s2, { name: 'Middle feed', every: 0.7, color: 'lime' });
  spawner(m, s3, { name: 'Bottom feed', every: 0.8, color: 'yellow' });
  make(m, 'checkpoint', at(s2, [6000, 0, 3500]), { rot: [0, s2.yaw, 0], size: [9000, 11000, 7000] });
  make(m, 'checkpoint', at(s3, [6000, 0, 3500]), { rot: [0, s3.yaw, 0], size: [9000, 11000, 7000], p: { order: 2 } });
  const gapStart = at({ pos: lip, yaw }, [9000, 0, 2500]);
  make(m, 'marble_line', gapStart, { rot: [0, yaw, 0], p: { count: 6, spacing: 5200, rise: 650, turn: 0, color: 'cycle', mode: 'float' } });
  make(m, 'track_pad', at({ pos: lip, yaw }, [48000, 0, 4500]), { rot: [0, yaw, 0], size: [16000, 16000, 400] });
  make(m, 'finish', at({ pos: lip, yaw }, [48000, 0, 9000]), { rot: [0, yaw, 0], p: { size: 1.4 } });
  make(m, 'sign', at(s1, [9000, -9000, 5000]), { rot: [0, s1.yaw + 180, 0], p: { text: 'floors hurt. ride the marbles', height: 2200 } });
  make(m, 'g_pillar', at(c1, [12000, 34000, -52000]));
  make(m, 'g_pillar', at(c2, [12000, 34000, -60000]));
  make(m, 'light', at(c2, [0, 26000, 12000]), { color: '#ffd9a0', p: { intensity: 500000, radius: 60000 } });
  make(m, 'kill', [40000, 50000, -60000], { size: [400000, 400000, 2000] });
  return m;
}

function corkscrew() {
  const m = blankMap();
  m.meta.name = 'Corkscrew';
  m.meta.description = 'A banked spiral winding down around a tower. Marbles race the whole way round, and floaters in the middle let you cut across if you are brave.';
  m.meta.difficulty = 'Medium';
  m.meta.gems = { diamond: 34, emerald: 42, gold: 54, steel: 72, rock: 105 };
  const R = 30000;
  const p = new Path(m, [0, 0, 0], 0, { width: 10000, walls: 1600 });
  const s0 = p.straight(22000, 3000);
  const center = p.ahead(0, R, 0);
  const turns = [];
  for (let i = 0; i < 7; i++) turns.push(p.right(R, 90, -6500, 18));
  const s1 = p.straight(30000, 5000);
  p.kicker(14000, 34);
  const lip = { pos: p.pos.slice(), yaw: p.yaw };
  make(m, 'spawn', at(s0, [2500, 0, 0]), { rot: [0, s0.yaw, 0], p: { mode: 'roll', speedMin: 8000, speedMax: 10000, color: 'mint' } });
  spawner(m, s0, { name: 'Tower feed', every: 0.45, cap: 45, min: 6000, max: 11000 });
  spawner(m, turns[3], { name: 'Halfway feed', every: 0.9, color: 'magenta', height: 3600 });
  make(m, 'g_pillar', [center[0], center[1], center[2] - 52000], { scale: [3, 3, 1.4] });
  make(m, 'marble_spiral', [center[0], center[1], center[2] - 40000], { p: { count: 14, radius: 9000, turn: -40, rise: 2600, color: 'yellow', mode: 'float' } });
  make(m, 'checkpoint', at(turns[3], [0, 0, 3500]), { rot: [0, turns[3].yaw, 0], size: [10000, 10000, 7000] });
  make(m, 'checkpoint', at(s1, [5000, 0, 3500]), { rot: [0, s1.yaw, 0], size: [10000, 10000, 7000], p: { order: 2 } });
  make(m, 'marble_zig', at(lip, [8000, 0, 3000]), { rot: [0, lip.yaw, 0], p: { count: 7, spacing: 4600, offset: 2600, rise: 700, color: 'cycle', mode: 'float' } });
  make(m, 'bounce', at(lip, [44000, 0, 1500]), { rot: [0, lip.yaw, 0], size: [5000, 5000, 800], p: { power: 9000, keep: true } });
  make(m, 'finish', at(lip, [52000, 0, 16000]), { rot: [0, lip.yaw, 0], p: { size: 1.5 } });
  make(m, 'light', [center[0], center[1], center[2] - 10000], { color: '#9dffca', p: { intensity: 600000, radius: 70000 } });
  make(m, 'sign', at(s0, [8000, -8000, 5000]), { rot: [0, s0.yaw + 180, 0], p: { text: 'down and round', height: 2400 } });
  make(m, 'kill', [center[0], center[1], -90000], { size: [500000, 500000, 2000] });
  return m;
}

function feverGap() {
  const m = blankMap();
  m.meta.name = 'Fever gap';
  m.meta.description = 'Two runs split around a canyon, a half pipe, slow motion over the big gap and swinging hook points. Use every ability you have.';
  m.meta.difficulty = 'Hard';
  m.meta.gems = { diamond: 45, emerald: 56, gold: 72, steel: 98, rock: 140 };
  const p = new Path(m, [0, 0, 0], 0, { width: 9000, walls: 1500 });
  const s0 = p.straight(30000, 6000);
  const split = { pos: p.pos.slice(), yaw: p.yaw };
  const tilt = Math.atan2(6000, 40000);
  make(m, 'track_pipe', at(split, [0, 0, -150]), { rot: [-tilt / D, split.yaw, 0], p: { radius: 6000, length: 40000, sides: 14, thickness: 300, sweep: 170 } });
  const pipeEnd = at(split, [40000 * Math.cos(tilt), 0, -40000 * Math.sin(tilt)]);
  const p2 = new Path(m, pipeEnd, split.yaw, { width: 9000, walls: 1500, group: 'track' });
  const s1 = p2.straight(25000, 7000);
  const c1 = p2.right(22000, 60, -3500, 16);
  const s2 = p2.straight(30000, 5000);
  p2.kicker(12000, 40);
  const lip = { pos: p2.pos.slice(), yaw: p2.yaw };
  make(m, 'spawn', at(s0, [2500, 0, 0]), { rot: [0, s0.yaw, 0], p: { mode: 'roll', speedMin: 9000, speedMax: 11000, color: 'ember' } });
  spawner(m, s0, { name: 'Start feed', every: 0.4, min: 7000, max: 12000, cap: 35 });
  spawner(m, s1, { name: 'Pipe exit feed', every: 0.6, color: 'magenta' });
  spawner(m, s2, { name: 'Last feed', every: 0.7, color: 'mint' });
  make(m, 'checkpoint', at(s1, [4000, 0, 3500]), { rot: [0, s1.yaw, 0], size: [9000, 9000, 7000] });
  const gap = at(lip, [30000, 0, 6000]);
  make(m, 'slowmo', gap, { rot: [0, lip.yaw, 0], size: [46000, 30000, 24000], p: { speed: 0.5 } });
  make(m, 'marble_cloud', gap, { rot: [0, lip.yaw, 0], p: { count: 18, sizeX: 40000, sizeY: 18000, sizeZ: 9000, gap: 1800, seed: 11, color: 'cycle', mode: 'drift' } });
  make(m, 'g_hookpoint', at(lip, [22000, -7000, 16000]), { scale: [0.6, 0.6, 0.6] });
  make(m, 'g_hookpoint', at(lip, [42000, 6000, 19000]), { scale: [0.6, 0.6, 0.6] });
  const far = at(lip, [62000, 0, 9000]);
  make(m, 'marble_line', far, { rot: [0, lip.yaw, 0], p: { count: 5, spacing: 5000, rise: 900, color: 'yellow', mode: 'float', sway: 2500 }, anim: { move: { points: [[0, 3500, 0]], duration: 2.6, mode: 'pingpong', ease: 'smooth', delay: 0 } } });
  make(m, 'track_pad', at(lip, [96000, 0, 12000]), { rot: [0, lip.yaw, 0], size: [14000, 14000, 400] });
  make(m, 'finish', at(lip, [96000, 0, 16500]), { rot: [0, lip.yaw, 0], p: { size: 1.3 } });
  make(m, 'light', gap, { color: '#ff8fb8', p: { intensity: 700000, radius: 60000 } });
  make(m, 'sign', at(split, [4000, -9000, 9000]), { rot: [0, split.yaw + 180, 0], p: { text: 'stay in the pipe', height: 2200 } });
  make(m, 'kill', [60000, 20000, -70000], { size: [500000, 500000, 2000] });
  return m;
}

export const TEMPLATES = [
  { name: 'Marble run', blurb: 'Easy. A long wooden run with marbles pouring down. Ride, hop, kicker, Dominus.', make: marbleRun },
  { name: 'Corkscrew', blurb: 'Medium. A banked spiral down a tower, with floaters in the middle for a shortcut.', make: corkscrew },
  { name: 'Fever gap', blurb: 'Hard. Half pipe, slow motion over a canyon, drifting marbles and hook points.', make: feverGap }
];
