import * as THREE from 'three';
import { GLTFLoader, OBJLoader, MTLLoader, STLLoader, PLYLoader, FBXLoader, ThreeMFLoader } from '../vendor/loaders.js';
import { Grid, gridToAsset, reduceGrid, hex } from './voxels.js';
import { parseMinecraft } from './minecraft.js';

const ext = (name) => (name.match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase() || '';
const stem = (name) => name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Import';

export const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'];
export const MC_EXT = ['schem', 'schematic', 'litematic', 'nbt'];
export const MODEL_EXT = ['glb', 'gltf', 'obj', 'stl', 'ply', 'fbx', '3mf'];
export const ACCEPT = [...IMAGE_EXT, ...MC_EXT, 'vox', ...MODEL_EXT].map((e) => '.' + e).join(',') + ',.mtl,.bin';

export function kindOf(files) {
  const main = pickMain(files);
  if (!main) return null;
  const e = ext(main.name);
  if (IMAGE_EXT.includes(e)) return 'image';
  if (MC_EXT.includes(e)) return 'minecraft';
  if (e === 'vox') return 'vox';
  if (MODEL_EXT.includes(e)) return 'model';
  return null;
}

export function pickMain(files) {
  const order = [...MC_EXT, 'vox', ...MODEL_EXT, ...IMAGE_EXT];
  let best = null;
  let rank = 1e9;
  for (const f of files) {
    const r = order.indexOf(ext(f.name));
    if (r >= 0 && r < rank) {
      rank = r;
      best = f;
    }
  }
  return best;
}

export const DEFAULTS = {
  image: { mode: 'wall', res: 48, pixel: 400, depth: 400, height: 6000, levels: 12, colors: 16, alpha: 128 },
  minecraft: { block: 500, colors: 0, fluids: false, solid: true },
  vox: { block: 300, colors: 0, solid: true },
  model: { res: 48, size: 8000, colors: 12, solid: true, up: 'y' }
};

export async function loadSource(files) {
  const kind = kindOf(files);
  const main = pickMain(files);
  if (!kind) throw new Error("I can't read that file type. Try a PNG, a Minecraft schematic, a .vox or a 3D model.");
  const name = stem(main.name);
  if (kind === 'image') return { kind, name, img: await readImage(main) };
  if (kind === 'minecraft') return { kind, name, buf: await main.arrayBuffer() };
  if (kind === 'vox') return { kind, name, vox: parseVox(await main.arrayBuffer()) };
  return { kind, name, model: await loadModel(files, main) };
}

export function buildAsset(src, opt) {
  if (src.kind === 'image') return imageAsset(src, opt);
  if (src.kind === 'minecraft') return minecraftAsset(src, opt);
  if (src.kind === 'vox') return voxAsset(src, opt);
  return modelAsset(src, opt);
}

async function readImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

function sampleImage(img, res) {
  const s = Math.min(1, res / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * s));
  const h = Math.max(1, Math.round(img.naturalHeight * s));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = s < 1;
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, w, h);
  return { w, h, data: g.getImageData(0, 0, w, h).data };
}

function imageAsset(src, o) {
  const { w, h, data } = sampleImage(src.img, o.res);
  const pal = [];
  const index = new Map();
  const pix = new Int32Array(w * h).fill(-1);
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const a = data[i * 4 + 3];
    if (a < o.alpha) continue;
    const r = data[i * 4];
    const gg = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    lum[i] = (0.2126 * r + 0.7152 * gg + 0.0722 * b) / 255;
    const key = (r << 16) | (gg << 8) | b;
    let ci = index.get(key);
    if (ci === undefined) {
      ci = pal.length;
      pal.push(hex(r, gg, b));
      index.set(key, ci);
    }
    pix[i] = ci;
  }
  let g;
  if (o.mode === 'wall') {
    g = new Grid(1, w, h, [o.depth, o.pixel, o.pixel]);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (pix[y * w + x] >= 0) g.set(0, x, h - 1 - y, pix[y * w + x] + 1);
  } else if (o.mode === 'floor') {
    g = new Grid(h, w, 1, [o.pixel, o.pixel, o.depth]);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (pix[y * w + x] >= 0) g.set(h - 1 - y, x, 0, pix[y * w + x] + 1);
  } else {
    const L = Math.max(1, o.levels);
    g = new Grid(h, w, L + 1, [o.pixel, o.pixel, o.height / L]);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (pix[i] < 0) continue;
        const top = Math.round(lum[i] * L);
        for (let z = 0; z <= top; z++) g.set(h - 1 - y, x, z, pix[i] + 1);
      }
  }
  const palette = reduceGrid(g, pal, o.colors);
  return gridToAsset(g, palette, { name: src.name, source: 'image', inside: o.mode === 'height' });
}

function minecraftAsset(src, o) {
  const b = parseMinecraft(src.buf, { fluids: o.fluids });
  const { grid, palette } = b.grid(o.block);
  const pal = reduceGrid(grid, palette, o.colors);
  const a = gridToAsset(grid, pal, { name: src.name, source: 'minecraft', inside: o.solid });
  a.blocks = b.blocks.length;
  return a;
}

function parseVox(buf) {
  const dv = new DataView(buf);
  const tag = (p) => String.fromCharCode(dv.getUint8(p), dv.getUint8(p + 1), dv.getUint8(p + 2), dv.getUint8(p + 3));
  if (tag(0) !== 'VOX ') throw new Error("That isn't a MagicaVoxel file.");
  const models = [];
  let palette = null;
  const nodes = {};
  let p = 8;
  const readStr = (q) => {
    const n = dv.getInt32(q, true);
    return [new TextDecoder().decode(new Uint8Array(buf, q + 4, n)), q + 4 + n];
  };
  const readDict = (q) => {
    const n = dv.getInt32(q, true);
    q += 4;
    const d = {};
    for (let i = 0; i < n; i++) {
      let k, v;
      [k, q] = readStr(q);
      [v, q] = readStr(q);
      d[k] = v;
    }
    return [d, q];
  };
  let size = null;
  while (p + 12 <= buf.byteLength) {
    const id = tag(p);
    const n = dv.getInt32(p + 4, true);
    const c = p + 12;
    if (id === 'MAIN') {
      p = c;
      continue;
    }
    if (id === 'SIZE') size = [dv.getInt32(c, true), dv.getInt32(c + 4, true), dv.getInt32(c + 8, true)];
    else if (id === 'XYZI') {
      const count = dv.getInt32(c, true);
      const v = new Uint8Array(buf, c + 4, count * 4).slice();
      models.push({ size, v });
    } else if (id === 'RGBA') {
      palette = [];
      for (let i = 0; i < 256; i++) palette.push(hex(dv.getUint8(c + i * 4), dv.getUint8(c + i * 4 + 1), dv.getUint8(c + i * 4 + 2)));
    } else if (id === 'nTRN') {
      let q = c;
      const nid = dv.getInt32(q, true);
      q += 4;
      [, q] = readDict(q);
      const child = dv.getInt32(q, true);
      q += 16;
      const frames = dv.getInt32(q - 4, true);
      let t = [0, 0, 0];
      if (frames > 0) {
        const [fd] = readDict(q);
        if (fd._t) t = fd._t.split(' ').map(Number);
      }
      nodes[nid] = { type: 'trn', child, t };
    } else if (id === 'nGRP') {
      let q = c;
      const nid = dv.getInt32(q, true);
      q += 4;
      [, q] = readDict(q);
      const k = dv.getInt32(q, true);
      q += 4;
      const kids = [];
      for (let i = 0; i < k; i++) kids.push(dv.getInt32(q + i * 4, true));
      nodes[nid] = { type: 'grp', kids };
    } else if (id === 'nSHP') {
      let q = c;
      const nid = dv.getInt32(q, true);
      q += 4;
      [, q] = readDict(q);
      const k = dv.getInt32(q, true);
      q += 4;
      const ms = [];
      for (let i = 0; i < k; i++) {
        ms.push(dv.getInt32(q, true));
        q += 4;
        [, q] = readDict(q);
      }
      nodes[nid] = { type: 'shp', models: ms };
    }
    p = c + n;
  }
  if (!models.length) throw new Error('That .vox file has no voxels.');
  if (!palette) palette = Array.from({ length: 256 }, (_, i) => hex(255 - i, 255 - i, 255 - i));
  const placed = [];
  const walk = (id, t) => {
    const nd = nodes[id];
    if (!nd) return;
    if (nd.type === 'trn') walk(nd.child, [t[0] + nd.t[0], t[1] + nd.t[1], t[2] + nd.t[2]]);
    else if (nd.type === 'grp') nd.kids.forEach((k) => walk(k, t));
    else nd.models.forEach((m) => placed.push({ m, t }));
  };
  if (nodes[0]) walk(0, [0, 0, 0]);
  if (!placed.length) placed.push({ m: 0, t: [0, 0, 0] });
  return { models, palette, placed };
}

function voxAsset(src, o) {
  const { models, palette, placed } = src.vox;
  const pts = [];
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const { m, t } of placed) {
    const md = models[m];
    if (!md) continue;
    const off = [t[0] - Math.floor(md.size[0] / 2), t[1] - Math.floor(md.size[1] / 2), t[2] - Math.floor(md.size[2] / 2)];
    for (let i = 0; i < md.v.length; i += 4) {
      const x = md.v[i] + off[0];
      const y = md.v[i + 1] + off[1];
      const z = md.v[i + 2] + off[2];
      pts.push(x, y, z, md.v[i + 3]);
      if (x < min[0]) min[0] = x;
      if (y < min[1]) min[1] = y;
      if (z < min[2]) min[2] = z;
      if (x > max[0]) max[0] = x;
      if (y > max[1]) max[1] = y;
      if (z > max[2]) max[2] = z;
    }
  }
  const g = new Grid(max[1] - min[1] + 1, max[0] - min[0] + 1, max[2] - min[2] + 1, [o.block, o.block, o.block]);
  for (let i = 0; i < pts.length; i += 4) g.set(pts[i + 1] - min[1], pts[i] - min[0], pts[i + 2] - min[2], pts[i + 3]);
  const pal = reduceGrid(g, palette.slice(0, 256), o.colors);
  return gridToAsset(g, pal, { name: src.name, source: 'vox', inside: o.solid });
}

async function loadModel(files, main) {
  const urls = new Map();
  for (const f of files) urls.set(f.name.toLowerCase(), URL.createObjectURL(f));
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    if (url.startsWith('blob:') || url.startsWith('data:')) return url;
    const base = decodeURIComponent(url.split(/[\\/]/).pop().split('?')[0]).toLowerCase();
    return urls.get(base) || url;
  });
  const e = ext(main.name);
  const mainUrl = urls.get(main.name.toLowerCase());
  try {
    let obj;
    if (e === 'glb' || e === 'gltf') obj = (await new GLTFLoader(manager).loadAsync(mainUrl)).scene;
    else if (e === 'obj') {
      const loader = new OBJLoader(manager);
      const mtl = files.find((f) => ext(f.name) === 'mtl');
      if (mtl) {
        const mats = new MTLLoader(manager).parse(await mtl.text(), '');
        mats.preload();
        loader.setMaterials(mats);
      }
      obj = loader.parse(await main.text());
    } else if (e === 'stl') obj = new THREE.Mesh(new STLLoader(manager).parse(await main.arrayBuffer()), new THREE.MeshStandardMaterial({ color: '#b9b2f2', vertexColors: false }));
    else if (e === 'ply') {
      const geo = new PLYLoader(manager).parse(await main.arrayBuffer());
      obj = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: !!geo.attributes.color }));
    } else if (e === 'fbx') obj = new FBXLoader(manager).parse(await main.arrayBuffer(), '');
    else if (e === '3mf') obj = new ThreeMFLoader(manager).parse(await main.arrayBuffer());
    await waitTextures(obj);
    return obj;
  } finally {
    setTimeout(() => urls.forEach((u) => URL.revokeObjectURL(u)), 30000);
  }
}

async function waitTextures(obj) {
  const imgs = [];
  obj.traverse((c) => {
    if (!c.isMesh) return;
    for (const m of [].concat(c.material || [])) if (m && m.map && m.map.image && m.map.image.decode) imgs.push(m.map.image);
  });
  const deadline = Date.now() + 5000;
  await Promise.all(imgs.map((im) => (im.complete ? Promise.resolve() : im.decode().catch(() => {}))));
  while (Date.now() < deadline) {
    let ready = true;
    obj.traverse((c) => {
      if (!c.isMesh) return;
      for (const m of [].concat(c.material || [])) if (m && m.map && !m.map.image) ready = false;
    });
    if (ready) break;
    await new Promise((r) => setTimeout(r, 100));
  }
}

const texCache = new WeakMap();
function texData(tex) {
  if (texCache.has(tex)) return texCache.get(tex);
  let out = null;
  const im = tex.image;
  if (im && (im.width || im.naturalWidth)) {
    const w0 = im.naturalWidth || im.width;
    const h0 = im.naturalHeight || im.height;
    const s = Math.min(1, 512 / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * s));
    const h = Math.max(1, Math.round(h0 * s));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    try {
      g.drawImage(im, 0, 0, w, h);
      out = { w, h, d: g.getImageData(0, 0, w, h).data, flip: tex.flipY };
    } catch {
      out = null;
    }
  }
  texCache.set(tex, out);
  return out;
}

const tmpC = new THREE.Color();
const tmpO = { r: 0, g: 0, b: 0 };
function toSrgb(r, g, b) {
  tmpC.setRGB(r, g, b, THREE.LinearSRGBColorSpace);
  tmpC.getRGB(tmpO, THREE.SRGBColorSpace);
  return [tmpO.r, tmpO.g, tmpO.b];
}

function modelAsset(src, o) {
  const root = src.model;
  root.updateMatrixWorld(true);
  const tris = [];
  const v = new THREE.Vector3();
  const mapPos = (p) => (o.up === 'z' ? [p.x, -p.y, p.z] : [p.x, p.z, p.y]);
  root.traverse((mesh) => {
    if (!mesh.isMesh || !mesh.geometry || !mesh.geometry.attributes.position) return;
    const geo = mesh.geometry;
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    const col = geo.attributes.color;
    const mats = [].concat(mesh.material || []);
    const index = geo.index;
    const groups = geo.groups.length ? geo.groups : [{ start: 0, count: index ? index.count : pos.count, materialIndex: 0 }];
    const world = [];
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      world.push(mapPos(v));
    }
    for (const gr of groups) {
      const m = mats[gr.materialIndex] || mats[0] || {};
      const base = m.color ? [m.color.r, m.color.g, m.color.b] : [1, 1, 1];
      const td = m.map ? texData(m.map) : null;
      const useCol = col && (m.vertexColors || !m.map);
      for (let k = gr.start; k + 2 < gr.start + gr.count; k += 3) {
        const ia = index ? index.getX(k) : k;
        const ib = index ? index.getX(k + 1) : k + 1;
        const ic = index ? index.getX(k + 2) : k + 2;
        tris.push({ a: world[ia], b: world[ib], c: world[ic], ia, ib, ic, uv, col: useCol ? col : null, td, base });
      }
    }
  });
  if (!tris.length) throw new Error('No mesh found in that model.');
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const t of tris)
    for (const p of [t.a, t.b, t.c])
      for (let k = 0; k < 3; k++) {
        if (p[k] < min[k]) min[k] = p[k];
        if (p[k] > max[k]) max[k] = p[k];
      }
  const ext3 = max.map((m, k) => Math.max(1e-6, m - min[k]));
  const longest = Math.max(...ext3);
  const vs = longest / o.res;
  const dims = ext3.map((e) => Math.max(1, Math.ceil(e / vs - 1e-6)));
  const n = dims[0] * dims[1] * dims[2];
  if (n > 9e6) throw new Error('That is too many voxels. Lower the detail.');
  const sums = new Float32Array(n * 4);
  const idx = (x, y, z) => x + dims[0] * (y + dims[1] * z);
  const ua = new THREE.Vector2();
  const ub = new THREE.Vector2();
  const uc = new THREE.Vector2();
  for (const t of tris) {
    const A = t.a.map((q, k) => (q - min[k]) / vs);
    const B = t.b.map((q, k) => (q - min[k]) / vs);
    const C = t.c.map((q, k) => (q - min[k]) / vs);
    const len = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
    const steps = Math.min(400, Math.ceil(Math.max(len(A, B), len(B, C), len(C, A)) * 2) + 1);
    if (t.uv && t.td) {
      ua.fromBufferAttribute(t.uv, t.ia);
      ub.fromBufferAttribute(t.uv, t.ib);
      uc.fromBufferAttribute(t.uv, t.ic);
    }
    let ca, cb, cc;
    if (t.col) {
      ca = toSrgb(t.col.getX(t.ia), t.col.getY(t.ia), t.col.getZ(t.ia));
      cb = toSrgb(t.col.getX(t.ib), t.col.getY(t.ib), t.col.getZ(t.ib));
      cc = toSrgb(t.col.getX(t.ic), t.col.getY(t.ic), t.col.getZ(t.ic));
    }
    const base = toSrgb(...t.base);
    for (let i = 0; i <= steps; i++)
      for (let j = 0; j <= steps - i; j++) {
        const wa = i / steps;
        const wb = j / steps;
        const wc = 1 - wa - wb;
        const x = Math.min(dims[0] - 1, Math.floor(A[0] * wa + B[0] * wb + C[0] * wc));
        const y = Math.min(dims[1] - 1, Math.floor(A[1] * wa + B[1] * wb + C[1] * wc));
        const z = Math.min(dims[2] - 1, Math.floor(A[2] * wa + B[2] * wb + C[2] * wc));
        let r = base[0];
        let g = base[1];
        let b = base[2];
        if (t.td && t.uv) {
          let u = ua.x * wa + ub.x * wb + uc.x * wc;
          let vv = ua.y * wa + ub.y * wb + uc.y * wc;
          u -= Math.floor(u);
          vv -= Math.floor(vv);
          const px = Math.min(t.td.w - 1, Math.floor(u * t.td.w));
          const py = Math.min(t.td.h - 1, Math.floor((t.td.flip ? 1 - vv : vv) * t.td.h));
          const q = (py * t.td.w + px) * 4;
          if (t.td.d[q + 3] < 40) continue;
          r *= t.td.d[q] / 255;
          g *= t.td.d[q + 1] / 255;
          b *= t.td.d[q + 2] / 255;
        } else if (ca) {
          r = ca[0] * wa + cb[0] * wb + cc[0] * wc;
          g = ca[1] * wa + cb[1] * wb + cc[1] * wc;
          b = ca[2] * wa + cb[2] * wb + cc[2] * wc;
        }
        const s = idx(x, y, z) * 4;
        sums[s] += r;
        sums[s + 1] += g;
        sums[s + 2] += b;
        sums[s + 3] += 1;
      }
  }
  const scale = o.size / longest;
  const cell = vs * scale;
  const grid = new Grid(dims[0], dims[1], dims[2], [cell, cell, cell]);
  const pal = [];
  const pIndex = new Map();
  for (let i = 0; i < n; i++) {
    const c = sums[i * 4 + 3];
    if (!c) continue;
    const r = Math.round((sums[i * 4] / c) * 255);
    const g = Math.round((sums[i * 4 + 1] / c) * 255);
    const b = Math.round((sums[i * 4 + 2] / c) * 255);
    const key = ((r >> 2) << 12) | ((g >> 2) << 6) | (b >> 2);
    let ci = pIndex.get(key);
    if (ci === undefined) {
      ci = pal.length;
      pal.push(hex(r, g, b));
      pIndex.set(key, ci);
    }
    grid.cells[i] = ci + 1;
  }
  const palette = reduceGrid(grid, pal, o.colors);
  return gridToAsset(grid, palette, { name: src.name, source: 'model', inside: o.solid });
}

