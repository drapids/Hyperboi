import { PIECE, defaultParams, localParts, pieceColor } from './pieces.js';
import { axesFromRot, rotFromAxes, applyAxes, composeAxes, add, hadamard } from './ue.js';

export const FORMAT = 'builderballin';
export const VERSION = 1;

export const DIFFICULTIES = ['Chill', 'Easy', 'Medium', 'Hard', 'Brutal', 'Fever'];
export const GEM_NAMES = ['diamond', 'emerald', 'gold', 'steel', 'rock'];

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function blankMap() {
  return {
    format: FORMAT,
    version: VERSION,
    meta: { name: 'Untitled map', author: '', description: '', difficulty: 'Easy', gems: { diamond: 0, emerald: 0, gold: 0, steel: 0, rock: 0 }, created: Date.now(), updated: Date.now() },
    rules: { gravity: 1, speed: 1, jump: 1, killHeight: -3000, needCheckpoints: false, timeLimit: 0 },
    objects: []
  };
}

export function newObject(pieceId, pos, extra = {}) {
  const piece = PIECE[pieceId];
  const s = piece.kind === 'smart' || piece.kind === 'game' ? [1, 1, 1] : (piece.size || [100, 100, 100]).map((v) => v / 100);
  return {
    id: uid(),
    piece: pieceId,
    name: '',
    pos: pos.slice(),
    rot: [0, 0, 0],
    scale: s,
    color: pieceColor(piece),
    p: defaultParams(piece),
    look: { ice: false, visible: true, collide: true },
    anim: null,
    group: '',
    ...extra
  };
}

export function blankAnim() {
  return { start: 'always', channel: 'A', pivot: 'self', move: null, spin: null, swing: null, blink: null };
}

export const MOVE_DEFAULT = () => ({ points: [[0, 0, 400]], duration: 3, mode: 'pingpong', ease: 'smooth', delay: 0 });
export const SPIN_DEFAULT = () => ({ axis: 'world-up', speed: 45 });
export const SWING_DEFAULT = () => ({ axis: 'object-forward', angle: 35, period: 3 });
export const BLINK_DEFAULT = () => ({ on: 2, off: 1, offset: 0 });

export function axisVector(name, objAxes) {
  if (name === 'world-up') return [0, 0, 1];
  if (name === 'world-forward') return [1, 0, 0];
  if (name === 'world-side') return [0, 1, 0];
  if (name === 'object-forward') return objAxes[0];
  if (name === 'object-side') return objAxes[1];
  return objAxes[2];
}

function groupCenters(objects) {
  const g = {};
  for (const o of objects) {
    if (!o.group) continue;
    (g[o.group] = g[o.group] || []).push(o.pos);
  }
  const out = {};
  for (const [k, list] of Object.entries(g)) out[k] = [0, 1, 2].map((i) => list.reduce((s, p) => s + p[i], 0) / list.length);
  return out;
}

function resolveAnim(o, axes, centers) {
  const a = o.anim;
  if (!a || !(a.move || a.spin || a.swing || a.blink)) return null;
  const out = { start: a.start, channel: a.channel || 'A', pivot: a.pivot === 'group' && o.group && centers[o.group] ? centers[o.group] : o.pos.slice() };
  if (a.move && a.move.points.length) out.move = { points: [[0, 0, 0], ...a.move.points.map((p) => p.slice())], duration: Math.max(0.05, a.move.duration), mode: a.move.mode, ease: a.move.ease, delay: a.move.delay || 0 };
  if (a.spin) out.spin = { axis: axisVector(a.spin.axis, axes), speed: a.spin.speed };
  if (a.swing) out.swing = { axis: axisVector(a.swing.axis, axes), angle: a.swing.angle, period: Math.max(0.1, a.swing.period) };
  if (a.blink) out.blink = { on: Math.max(0.05, a.blink.on), off: Math.max(0, a.blink.off), offset: a.blink.offset || 0 };
  return out;
}

export function flatten(map) {
  const objects = map.objects;
  const centers = groupCenters(objects);
  const byId = Object.fromEntries(objects.map((o) => [o.id, o]));
  const build = { spawn: null, parts: [], zones: [], checkpoints: 0 };
  for (const o of objects) {
    const piece = PIECE[o.piece];
    if (!piece) continue;
    const axes = axesFromRot(o.rot);
    const anim = resolveAnim(o, axes, centers);
    const common = { id: o.id, anim };
    if (piece.kind === 'marker') {
      if (piece.marker === 'spawn' && !build.spawn) build.spawn = { pos: o.pos.slice(), yaw: o.rot[1] };
      continue;
    }
    if (piece.kind === 'zone') {
      const z = { ...common, type: piece.zone, pos: o.pos.slice(), rot: o.rot.slice(), ext: o.scale.map((s) => Math.abs(s) * 50), params: { ...defaultParams(piece), ...o.p } };
      if (piece.zone === 'teleport') {
        const ex = byId[o.p.exit];
        z.to = ex ? { pos: ex.pos.slice(), yaw: ex.rot[1] } : null;
      }
      if (piece.zone === 'checkpoint') build.checkpoints += 1;
      build.zones.push(z);
      if (piece.pad) {
        const hz = o.scale[2] * 50;
        build.parts.push({ ...common, id: o.id + ':pad', kind: 'shape', shape: piece.zone === 'bounce' ? 'cylinder' : 'cube', pos: add(o.pos, applyAxes(axes, [0, 0, -hz + 10])), rot: o.rot.slice(), scale: [o.scale[0] * 0.95, o.scale[1] * 0.95, 0.2], color: pieceColor(piece), ice: false, hidden: false, collide: true });
      }
      continue;
    }
    if (piece.kind === 'game') {
      const part = { ...common, kind: piece.cls ? 'bp' : piece.skel ? 'skel' : 'mesh', path: piece.cls || piece.skel || piece.mesh, pos: o.pos.slice(), rot: o.rot.slice(), scale: o.scale.slice(), color: null, ice: o.look.ice, hidden: !o.look.visible, collide: o.look.collide };
      build.parts.push(part);
      continue;
    }
    if (piece.kind === 'decor') {
      const prm = { ...defaultParams(piece), ...o.p };
      if (piece.decor === 'text') build.parts.push({ ...common, kind: 'text', text: prm.text, size: prm.height, pos: o.pos.slice(), rot: o.rot.slice(), scale: [1, 1, 1], color: o.color });
      else build.parts.push({ ...common, kind: 'light', intensity: prm.intensity, radius: prm.radius, pos: o.pos.slice(), rot: [0, 0, 0], scale: [1, 1, 1], color: o.color });
      continue;
    }
    const parts = localParts(o);
    parts.forEach((lp, i) => {
      const la = axesFromRot(lp.rot);
      const wa = composeAxes(axes, la);
      build.parts.push({
        ...common,
        id: `${o.id}:${i}`,
        kind: 'shape',
        shape: lp.shape,
        pos: add(o.pos, applyAxes(axes, hadamard(lp.pos, o.scale))),
        rot: rotFromAxes(wa),
        scale: hadamard(lp.scale, o.scale),
        color: o.color,
        ice: o.look.ice,
        hidden: !o.look.visible,
        collide: o.look.collide
      });
    });
  }
  return build;
}

export function exportMap(map) {
  const out = JSON.parse(JSON.stringify(map));
  out.meta.updated = Date.now();
  out.build = flatten(map);
  out.build.counts = { parts: out.build.parts.length, zones: out.build.zones.length };
  return JSON.stringify(out);
}

export function importMap(text) {
  const data = JSON.parse(text);
  if (data.format !== FORMAT) throw new Error("That file isn't a Builderballin map.");
  if ((data.version || 0) > VERSION) throw new Error('That map was made with a newer Builderballin. Refresh the page and try again.');
  const base = blankMap();
  const map = {
    ...base,
    ...data,
    meta: { ...base.meta, ...data.meta, gems: { ...base.meta.gems, ...(data.meta && data.meta.gems) } },
    rules: { ...base.rules, ...data.rules },
    objects: (data.objects || []).filter((o) => PIECE[o.piece]).map((o) => ({ ...newObject(o.piece, o.pos || [0, 0, 0]), ...o, look: { ice: false, visible: true, collide: true, ...o.look } }))
  };
  delete map.build;
  return map;
}

export function validate(map) {
  const issues = [];
  const count = (id) => map.objects.filter((o) => o.piece === id).length;
  if (!count('spawn')) issues.push({ level: 'bad', text: 'Add a spawn so the game knows where to start you.', fix: 'spawn' });
  if (count('spawn') > 1) issues.push({ level: 'warn', text: 'There are several spawns. Only the first one is used.' });
  if (!count('finish')) issues.push({ level: 'bad', text: 'Add a finish so runs can end.', fix: 'finish' });
  const ids = new Set(map.objects.map((o) => o.id));
  for (const o of map.objects) {
    if (o.piece === 'teleport' && !ids.has(o.p.exit)) issues.push({ level: 'warn', text: `${o.name || 'A teleporter'} has no exit.`, id: o.id });
    if (o.anim && o.anim.start === 'trigger' && !map.objects.some((t) => t.piece === 'trigger' && (t.p.channel || 'A') === (o.anim.channel || 'A'))) issues.push({ level: 'warn', text: `${o.name || PIECE[o.piece].name} waits for channel ${o.anim.channel}, but no trigger sends it.`, id: o.id });
  }
  const parts = flatten(map).parts.length;
  if (parts > 4000) issues.push({ level: 'warn', text: `${parts} parts is a lot. The game might stutter while loading it.` });
  return issues;
}
