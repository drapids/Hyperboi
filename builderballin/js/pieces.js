export const GLAZES = [
  ['Cobalt', '#1c3faa'],
  ['Sky', '#6e8fe0'],
  ['Porcelain', '#eef1f8'],
  ['Chalk', '#ffffff'],
  ['Slate', '#3a4256'],
  ['Ink', '#15161c'],
  ['Stop red', '#e23a2e'],
  ['Marigold', '#f2b33d'],
  ['Moss', '#3fae6b'],
  ['Mint', '#8fe3c8'],
  ['Blush', '#f08bb4'],
  ['Violet', '#7b5cd6']
];

export const ZONE_COLORS = {
  finish: '#15161c',
  checkpoint: '#f2b33d',
  kill: '#e23a2e',
  bounce: '#3fae6b',
  boost: '#2fb8d8',
  speed: '#7b5cd6',
  gravity: '#6e8fe0',
  wind: '#5fcfae',
  teleport: '#f08bb4',
  trigger: '#ef8a2e',
  message: '#3a4256',
  slowmo: '#a48ce8'
};

const D = Math.PI / 180;
const cube = (pos, rot, size, extra = {}) => ({ kind: 'shape', shape: 'cube', pos, rot, scale: [size[0] / 100, size[1] / 100, size[2] / 100], ...extra });

function arcParts(p, vertical) {
  const parts = [];
  const n = Math.max(2, Math.round(p.segments));
  const total = p.angle * D;
  const segAng = total / n;
  const chord = 2 * p.radius * Math.sin(segAng / 2) + 2;
  for (let i = 0; i < n; i++) {
    const a = segAng * (i + 0.5);
    if (!vertical) {
      const x = p.radius * Math.sin(a);
      const y = p.radius - p.radius * Math.cos(a);
      const z = (p.rise || 0) * ((i + 0.5) / n);
      const pitch = p.rise ? Math.atan2(p.rise / n, chord) / D : 0;
      parts.push(cube([x, y, z], [pitch, a / D, p.bank || 0], [chord, p.width, p.thickness]));
    } else {
      const x = p.radius * Math.sin(a);
      const z = p.radius - p.radius * Math.cos(a);
      const y = (p.shift || 0) * ((i + 0.5) / n);
      parts.push(cube([x, y, z], [a / D, 0, 0], [chord, p.width, p.thickness]));
    }
  }
  return parts;
}

function ringParts(radius, sides, length, thickness, from = 0, to = 360, slabWidth) {
  const parts = [];
  const span = (to - from) * D;
  const step = span / sides;
  const w = slabWidth ?? 2 * radius * Math.tan(step / 2) + 2;
  for (let i = 0; i < sides; i++) {
    const a = from * D + step * (i + 0.5);
    const y = Math.sin(a) * radius;
    const z = -Math.cos(a) * radius;
    parts.push(cube([0, y, z + radius], [0, 0, a / D], [length, w, thickness]));
  }
  return parts;
}

export const PIECES = [
  { id: 'platform', cat: 'shapes', name: 'Platform', kind: 'solid', size: [400, 400, 50], color: '#eef1f8', desc: 'Flat slab to stand on' },
  { id: 'cube', cat: 'shapes', name: 'Cube', kind: 'solid', size: [100, 100, 100], color: '#6e8fe0', desc: 'One metre block' },
  { id: 'beam', cat: 'shapes', name: 'Beam', kind: 'solid', size: [800, 60, 60], color: '#3a4256', desc: 'Long thin rail' },
  { id: 'wall', cat: 'shapes', name: 'Wall', kind: 'solid', size: [800, 40, 400], color: '#eef1f8', desc: 'Upright panel' },
  { id: 'cylinder', cat: 'shapes', name: 'Cylinder', kind: 'solid', shape: 'cylinder', size: [200, 200, 200], color: '#1c3faa', desc: 'Round column' },
  { id: 'disc', cat: 'shapes', name: 'Disc', kind: 'solid', shape: 'cylinder', size: [400, 400, 30], color: '#ffffff', desc: 'Round platform' },
  { id: 'sphere', cat: 'shapes', name: 'Sphere', kind: 'solid', shape: 'sphere', size: [200, 200, 200], color: '#f08bb4', desc: 'Ball' },
  { id: 'cone', cat: 'shapes', name: 'Cone', kind: 'solid', shape: 'cone', size: [200, 200, 200], color: '#f2b33d', desc: 'Spike or hill' },

  {
    id: 'ramp', cat: 'smart', name: 'Ramp', kind: 'smart', color: '#eef1f8', desc: 'Slope with a set rise',
    params: [
      { key: 'length', label: 'Length', min: 100, max: 5000, step: 50, def: 800 },
      { key: 'rise', label: 'Rise', min: -3000, max: 3000, step: 25, def: 300 },
      { key: 'width', label: 'Width', min: 50, max: 3000, step: 25, def: 400 },
      { key: 'thickness', label: 'Thickness', min: 10, max: 400, step: 5, def: 40 }
    ],
    build: (p) => {
      const pitch = Math.atan2(p.rise, p.length);
      const len = Math.hypot(p.length, p.rise);
      return [cube([p.length / 2, 0, p.rise / 2], [pitch / D, 0, 0], [len, p.width, p.thickness])];
    }
  },
  {
    id: 'stairs', cat: 'smart', name: 'Stairs', kind: 'smart', color: '#eef1f8', desc: 'Steps going up',
    params: [
      { key: 'steps', label: 'Steps', min: 2, max: 60, step: 1, def: 8 },
      { key: 'run', label: 'Step depth', min: 20, max: 1000, step: 5, def: 100 },
      { key: 'riseStep', label: 'Step height', min: 5, max: 500, step: 5, def: 40 },
      { key: 'width', label: 'Width', min: 50, max: 3000, step: 25, def: 300 },
      { key: 'gap', label: 'Gap', min: 0, max: 800, step: 5, def: 0 }
    ],
    build: (p) => Array.from({ length: p.steps }, (_, i) => cube([i * (p.run + p.gap) + p.run / 2, 0, i * p.riseStep + p.riseStep / 2], [0, 0, 0], [p.run, p.width, p.riseStep]))
  },
  {
    id: 'curve', cat: 'smart', name: 'Curve', kind: 'smart', color: '#eef1f8', desc: 'Bent road, can bank and climb',
    params: [
      { key: 'radius', label: 'Radius', min: 100, max: 8000, step: 50, def: 1000 },
      { key: 'angle', label: 'Turn', min: 10, max: 1080, step: 5, def: 90 },
      { key: 'width', label: 'Width', min: 50, max: 3000, step: 25, def: 400 },
      { key: 'thickness', label: 'Thickness', min: 10, max: 400, step: 5, def: 40 },
      { key: 'bank', label: 'Bank', min: -80, max: 80, step: 1, def: 0 },
      { key: 'rise', label: 'Climb', min: -8000, max: 8000, step: 25, def: 0 },
      { key: 'segments', label: 'Smoothness', min: 2, max: 96, step: 1, def: 16 }
    ],
    build: (p) => arcParts(p, false)
  },
  {
    id: 'loop', cat: 'smart', name: 'Loop', kind: 'smart', color: '#eef1f8', desc: 'Vertical loop or corkscrew',
    params: [
      { key: 'radius', label: 'Radius', min: 200, max: 6000, step: 50, def: 900 },
      { key: 'angle', label: 'Sweep', min: 30, max: 360, step: 5, def: 360 },
      { key: 'width', label: 'Width', min: 50, max: 2000, step: 25, def: 350 },
      { key: 'thickness', label: 'Thickness', min: 10, max: 300, step: 5, def: 40 },
      { key: 'shift', label: 'Side shift', min: -3000, max: 3000, step: 25, def: 450 },
      { key: 'segments', label: 'Smoothness', min: 6, max: 96, step: 1, def: 28 }
    ],
    build: (p) => arcParts(p, true)
  },
  {
    id: 'tube', cat: 'smart', name: 'Tube', kind: 'smart', color: '#6e8fe0', desc: 'Pipe you roll through',
    params: [
      { key: 'radius', label: 'Radius', min: 100, max: 3000, step: 25, def: 350 },
      { key: 'length', label: 'Length', min: 100, max: 8000, step: 50, def: 1200 },
      { key: 'sides', label: 'Sides', min: 6, max: 48, step: 1, def: 16 },
      { key: 'thickness', label: 'Thickness', min: 10, max: 200, step: 5, def: 30 }
    ],
    build: (p) => ringParts(p.radius, p.sides, p.length, p.thickness).map((q) => ({ ...q, pos: [p.length / 2, q.pos[1], q.pos[2]] }))
  },
  {
    id: 'halfpipe', cat: 'smart', name: 'Half pipe', kind: 'smart', color: '#eef1f8', desc: 'U-shaped channel',
    params: [
      { key: 'radius', label: 'Radius', min: 100, max: 3000, step: 25, def: 500 },
      { key: 'length', label: 'Length', min: 100, max: 8000, step: 50, def: 1600 },
      { key: 'sides', label: 'Sides', min: 4, max: 32, step: 1, def: 10 },
      { key: 'thickness', label: 'Thickness', min: 10, max: 200, step: 5, def: 30 },
      { key: 'sweep', label: 'Sweep', min: 60, max: 300, step: 5, def: 180 }
    ],
    build: (p) => ringParts(p.radius, p.sides, p.length, p.thickness, -p.sweep / 2, p.sweep / 2).map((q) => ({ ...q, pos: [p.length / 2, q.pos[1], q.pos[2]] }))
  },
  {
    id: 'pillars', cat: 'smart', name: 'Pillar row', kind: 'smart', color: '#1c3faa', desc: 'Row of columns to hop across',
    params: [
      { key: 'count', label: 'Count', min: 2, max: 60, step: 1, def: 6 },
      { key: 'spacing', label: 'Spacing', min: 50, max: 3000, step: 25, def: 350 },
      { key: 'height', label: 'Height', min: 50, max: 5000, step: 25, def: 600 },
      { key: 'diameter', label: 'Diameter', min: 20, max: 2000, step: 10, def: 180 },
      { key: 'step', label: 'Height step', min: -1000, max: 1000, step: 10, def: 0 }
    ],
    build: (p) => Array.from({ length: p.count }, (_, i) => ({ kind: 'shape', shape: 'cylinder', pos: [i * p.spacing, 0, (p.height + i * p.step) / 2], rot: [0, 0, 0], scale: [p.diameter / 100, p.diameter / 100, (p.height + i * p.step) / 100] }))
  },
  {
    id: 'zigzag', cat: 'smart', name: 'Zigzag', kind: 'smart', color: '#eef1f8', desc: 'Back and forth path',
    params: [
      { key: 'count', label: 'Turns', min: 2, max: 40, step: 1, def: 6 },
      { key: 'segment', label: 'Segment length', min: 100, max: 3000, step: 25, def: 600 },
      { key: 'angle', label: 'Angle', min: 5, max: 85, step: 1, def: 35 },
      { key: 'width', label: 'Width', min: 50, max: 1500, step: 25, def: 200 },
      { key: 'thickness', label: 'Thickness', min: 10, max: 300, step: 5, def: 40 }
    ],
    build: (p) => {
      const parts = [];
      let x = 0, y = 0;
      for (let i = 0; i < p.count; i++) {
        const a = (i % 2 ? -p.angle : p.angle) * D;
        const dx = Math.cos(a) * p.segment, dy = Math.sin(a) * p.segment;
        parts.push(cube([x + dx / 2, y + dy / 2, 0], [0, a / D, 0], [p.segment + p.width * 0.6, p.width, p.thickness]));
        x += dx;
        y += dy;
      }
      return parts;
    }
  },
  {
    id: 'hoop', cat: 'smart', name: 'Hoop', kind: 'smart', color: '#f2b33d', desc: 'Ring to fly through',
    params: [
      { key: 'radius', label: 'Radius', min: 100, max: 3000, step: 25, def: 400 },
      { key: 'sides', label: 'Sides', min: 6, max: 48, step: 1, def: 20 },
      { key: 'thickness', label: 'Thickness', min: 10, max: 300, step: 5, def: 40 }
    ],
    build: (p) => ringParts(p.radius, p.sides, p.thickness, p.thickness).map((q) => ({ ...q, pos: [0, q.pos[1], q.pos[2] - p.radius] }))
  },

  { id: 'spawn', cat: 'play', name: 'Spawn', kind: 'marker', marker: 'spawn', color: '#1c3faa', size: [100, 100, 100], desc: 'Where the run starts. One per map' },
  { id: 'finish', cat: 'play', name: 'Finish', kind: 'zone', zone: 'finish', size: [400, 400, 300], desc: 'Touch it to end the run' },
  { id: 'checkpoint', cat: 'play', name: 'Checkpoint', kind: 'zone', zone: 'checkpoint', size: [400, 400, 300], desc: 'Respawn here after a fall', params: [{ key: 'order', label: 'Order', min: 1, max: 99, step: 1, def: 1 }] },
  { id: 'kill', cat: 'play', name: 'Kill zone', kind: 'zone', zone: 'kill', size: [800, 800, 100], desc: 'Sends you back to your last checkpoint' },
  { id: 'bounce', cat: 'play', name: 'Bounce pad', kind: 'zone', zone: 'bounce', size: [200, 200, 80], desc: 'Launches you straight up', params: [{ key: 'power', label: 'Power', min: 200, max: 10000, step: 50, def: 2200 }, { key: 'keep', label: 'Keep sideways speed', type: 'bool', def: true }], pad: true },
  { id: 'boost', cat: 'play', name: 'Boost pad', kind: 'zone', zone: 'boost', size: [300, 200, 80], desc: 'Shoves you the way the arrow points', params: [{ key: 'power', label: 'Power', min: 200, max: 15000, step: 50, def: 3500 }, { key: 'lift', label: 'Lift', min: 0, max: 5000, step: 25, def: 200 }], pad: true },
  { id: 'speed', cat: 'play', name: 'Speed zone', kind: 'zone', zone: 'speed', size: [400, 400, 300], desc: 'Multiplies your speed once on entry', params: [{ key: 'mult', label: 'Multiplier', min: 0.1, max: 5, step: 0.05, def: 1.6 }] },
  { id: 'gravity', cat: 'play', name: 'Gravity zone', kind: 'zone', zone: 'gravity', size: [800, 800, 800], desc: 'Changes gravity while you are inside', params: [{ key: 'scale', label: 'Gravity', min: -2, max: 4, step: 0.05, def: 0.3 }] },
  { id: 'wind', cat: 'play', name: 'Wind', kind: 'zone', zone: 'wind', size: [800, 400, 400], desc: 'Pushes you along the arrow while inside', params: [{ key: 'force', label: 'Strength', min: 50, max: 8000, step: 50, def: 900 }] },
  { id: 'slowmo', cat: 'play', name: 'Slow motion', kind: 'zone', zone: 'slowmo', size: [800, 800, 600], desc: 'Time slows down inside', params: [{ key: 'speed', label: 'Time speed', min: 0.05, max: 1, step: 0.05, def: 0.4 }] },
  { id: 'teleport', cat: 'play', name: 'Teleporter', kind: 'zone', zone: 'teleport', size: [200, 200, 250], desc: 'Comes with an exit you can move', params: [{ key: 'keep', label: 'Keep speed', type: 'bool', def: true }] },
  { id: 'exit', cat: 'play', name: 'Teleport exit', kind: 'marker', marker: 'exit', color: '#f08bb4', size: [100, 100, 100], desc: 'Where a teleporter drops you', hidden: true },
  { id: 'trigger', cat: 'play', name: 'Trigger', kind: 'zone', zone: 'trigger', size: [300, 300, 300], desc: 'Starts anything listening on its channel', params: [{ key: 'channel', label: 'Channel', type: 'text', def: 'A' }, { key: 'once', label: 'Only once', type: 'bool', def: true }] },
  { id: 'message', cat: 'play', name: 'Message', kind: 'zone', zone: 'message', size: [400, 400, 300], desc: 'Shows text when entered', params: [{ key: 'text', label: 'Text', type: 'text', def: 'You got this' }] },

  { id: 'g_track_round', cat: 'game', name: 'Rounded track', kind: 'game', mesh: '/Game/Assets/TrackPieces/greentrackrounded/StaticMeshes/greentrackrounded', proxy: [1000, 400, 100] },
  { id: 'g_large_green', cat: 'game', name: 'Large green', kind: 'game', mesh: '/Game/Assets/TrackPieces/largegreenexpg/StaticMeshes/largegreenexpg', proxy: [1600, 1600, 100] },
  { id: 'g_green_hole', cat: 'game', name: 'Green with hole', kind: 'game', mesh: '/Game/Assets/TrackPieces/largegreenexpg/holeongreensimple1/StaticMeshes/Original', proxy: [1600, 1600, 100] },
  { id: 'g_tracks', cat: 'game', name: 'Track', kind: 'game', mesh: '/Game/Assets/TrackPieces/tracks1_3a1/StaticMeshes/tracks1_3a1', proxy: [1200, 400, 100] },
  { id: 'g_halftunnel', cat: 'game', name: 'Half tunnel', kind: 'game', mesh: '/Game/Assets/TrackPieces/tracks1_3a1/StaticMeshes/halftunnel3/StaticMeshes/halftunnel3', proxy: [1200, 500, 400] },
  { id: 'g_halftunnel_m', cat: 'game', name: 'Half tunnel, mirrored', kind: 'game', mesh: '/Game/Assets/TrackPieces/tracks1_3a1/StaticMeshes/halftunnel3/StaticMeshes/halftunnel3mirror', proxy: [1200, 500, 400] },
  { id: 'g_window_tunnel', cat: 'game', name: 'Window tunnel', kind: 'game', mesh: '/Game/Assets/TrackPieces/tracks1_3a1/StaticMeshes/windowhalftunnel2b1/StaticMeshes/windowhalftunnel2b1', proxy: [1200, 500, 400] },
  { id: 'g_block', cat: 'game', name: 'Wall block', kind: 'game', mesh: '/Game/Assets/TrackPieces/StraightWalls/Block1a1/StaticMeshes/Block1a1', proxy: [400, 400, 400] },
  { id: 'g_bowl', cat: 'game', name: 'Bowl', kind: 'game', mesh: '/Game/Assets/TrackPieces/Bowls/scene/StaticMeshes/scene', proxy: [2000, 2000, 600] },
  { id: 'g_plate', cat: 'game', name: 'Striped plate', kind: 'game', mesh: '/Game/Assets/TrackPieces/spinplate/spinplateexp/StaticMeshes/Decorative_plate', proxy: [1200, 1200, 80], round: true },
  { id: 'g_spinplate', cat: 'game', name: 'Spinning plate', kind: 'game', cls: '/Game/Assets/TrackPieces/spinplate/spinplateexp/StaticMeshes/BP_spinningplate', proxy: [1200, 1200, 80], round: true },
  { id: 'g_tube', cat: 'game', name: 'Steel tube', kind: 'game', mesh: '/Game/Assets/TrackPieces/spinplate/spinplateexp/StaticMeshes/Rounded_square_steel_tube_PL', proxy: [600, 60, 60] },
  { id: 'g_hookpoint', cat: 'game', name: 'Hook point', kind: 'game', cls: '/Game/Assets/TrackPieces/Hookpoint/hookpointexp/StaticMeshes/BP_hookpoint', proxy: [100, 100, 100], round: true },
  { id: 'g_lowceiling', cat: 'game', name: 'Low ceiling', kind: 'game', mesh: '/Game/Assets/TrackPieces/Lowceiling/SM_staple3', proxy: [800, 600, 300] },
  { id: 'g_pillar', cat: 'game', name: 'Triangle pillar', kind: 'game', mesh: '/Game/Assets/TrackPieces/pillartriangle/Models/p1a2eg2/StaticMeshes/p1a2eg2', proxy: [200, 200, 600] },
  { id: 'g_pillar_boost', cat: 'game', name: 'Boost pillar', kind: 'game', cls: '/Game/Assets/TrackPieces/pillartriangle/BP_PillarBoost', proxy: [200, 200, 600] },
  { id: 'g_pillar_bounce', cat: 'game', name: 'Bounce pillar', kind: 'game', cls: '/Game/Assets/TrackPieces/pillartriangle/BP_PillarBounce', proxy: [200, 200, 600] },
  { id: 'g_torus', cat: 'game', name: 'Torus', kind: 'game', mesh: '/Game/Assets/Misc/SM_Torus', proxy: [400, 400, 100], round: true },
  { id: 'g_marker', cat: 'game', name: 'Marker', kind: 'game', mesh: '/Game/Assets/Misc/marker/StaticMeshes/marker', proxy: [100, 100, 200] },
  { id: 'g_marble', cat: 'game', name: 'Marble', kind: 'game', cls: '/Game/Blueprints/BP_Marble1', proxy: [60, 60, 60], round: true },
  { id: 'g_gorilla', cat: 'game', name: 'Gorilla', kind: 'game', skel: '/Game/Assets/Misc/Random/Gorilla/Gorilla_hd', proxy: [150, 150, 180] },

  { id: 'sign', cat: 'decor', name: 'Sign', kind: 'decor', decor: 'text', color: '#1c3faa', size: [100, 100, 100], desc: 'Floating text', params: [{ key: 'text', label: 'Text', type: 'text', def: 'Hello' }, { key: 'height', label: 'Text size', min: 10, max: 2000, step: 5, def: 120 }] },
  { id: 'light', cat: 'decor', name: 'Light', kind: 'decor', decor: 'light', color: '#ffd9a0', size: [60, 60, 60], desc: 'Coloured point light', params: [{ key: 'intensity', label: 'Brightness', min: 100, max: 200000, step: 100, def: 8000 }, { key: 'radius', label: 'Reach', min: 100, max: 20000, step: 50, def: 2000 }] }
];

export const PIECE = Object.fromEntries(PIECES.map((p) => [p.id, p]));

export const CATS = [
  ['shapes', 'Shapes'],
  ['smart', 'Smart'],
  ['play', 'Gameplay'],
  ['game', 'Game parts'],
  ['decor', 'Decor']
];

export function defaultParams(piece) {
  const p = {};
  for (const prm of piece.params || []) p[prm.key] = prm.def;
  return p;
}

export function initialScale(piece) {
  if (piece.kind === 'smart' || piece.kind === 'game') return [1, 1, 1];
  const s = piece.size || piece.proxy || [100, 100, 100];
  return [s[0] / 100, s[1] / 100, s[2] / 100];
}

export function pieceColor(piece) {
  if (piece.kind === 'zone') return ZONE_COLORS[piece.zone];
  return piece.color || '#8b93ad';
}

export function localParts(obj) {
  const piece = PIECE[obj.piece];
  if (!piece) return [];
  if (piece.kind === 'smart') return piece.build({ ...defaultParams(piece), ...obj.p });
  return [{ kind: 'shape', shape: piece.shape || 'cube', pos: [0, 0, 0], rot: [0, 0, 0], scale: [1, 1, 1], unit: true }];
}
