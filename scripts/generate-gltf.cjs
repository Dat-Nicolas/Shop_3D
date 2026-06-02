/**
 * generate-gltf.js
 * Generates self-contained .gltf files (geometry embedded as base64) for all product modelTypes.
 * Run: node scripts/generate-gltf.js
 * Output: public/Blender/{modelType}.gltf
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'public', 'Blender');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ── UTILITIES ─────────────────────────────────────────────────────────────────

function eulerToQuat(x, y, z) {
  const cx = Math.cos(x / 2), sx = Math.sin(x / 2);
  const cy = Math.cos(y / 2), sy = Math.sin(y / 2);
  const cz = Math.cos(z / 2), sz = Math.sin(z / 2);
  return [
    sx * cy * cz - cx * sy * sz,
    cx * sy * cz + sx * cy * sz,
    cx * cy * sz - sx * sy * cz,
    cx * cy * cz + sx * sy * sz,
  ];
}

// ── GEOMETRY PRIMITIVES ───────────────────────────────────────────────────────

function buildSphere(radius, wSeg, hSeg) {
  wSeg = wSeg || 24; hSeg = hSeg || 16;
  const pos = [], nrm = [], idx = [];
  for (let j = 0; j <= hSeg; j++) {
    const phi = (j / hSeg) * Math.PI;
    for (let i = 0; i <= wSeg; i++) {
      const theta = (i / wSeg) * 2 * Math.PI;
      const x = -Math.cos(theta) * Math.sin(phi);
      const y =  Math.cos(phi);
      const z =  Math.sin(theta) * Math.sin(phi);
      pos.push(x * radius, y * radius, z * radius);
      nrm.push(x, y, z);
    }
  }
  for (let j = 0; j < hSeg; j++) {
    for (let i = 0; i < wSeg; i++) {
      const a = j * (wSeg + 1) + i, b = a + wSeg + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return { positions: new Float32Array(pos), normals: new Float32Array(nrm), indices: new Uint16Array(idx) };
}

function buildCylinder(rTop, rBot, height, radSeg, openEnded) {
  rTop = rTop === undefined ? 0.5 : rTop;
  rBot = rBot === undefined ? 0.5 : rBot;
  height = height || 1; radSeg = radSeg || 20;
  const pos = [], nrm = [], idx = [];
  const halfH = height / 2;
  for (let j = 0; j <= 1; j++) {
    const y = j === 0 ? halfH : -halfH;
    const r = j === 0 ? rTop : rBot;
    for (let i = 0; i <= radSeg; i++) {
      const theta = (i / radSeg) * 2 * Math.PI;
      const slope = (rBot - rTop) / height;
      const len = Math.sqrt(1 + slope * slope);
      pos.push(r * Math.cos(theta), y, r * Math.sin(theta));
      nrm.push(Math.cos(theta) / len, slope / len, Math.sin(theta) / len);
    }
  }
  const rs = radSeg + 1;
  for (let i = 0; i < radSeg; i++) {
    const a = i, b = i + rs;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  if (!openEnded) {
    const tc = pos.length / 3;
    pos.push(0, halfH, 0); nrm.push(0, 1, 0);
    for (let i = 0; i <= radSeg; i++) {
      const t = (i / radSeg) * 2 * Math.PI;
      pos.push(rTop * Math.cos(t), halfH, rTop * Math.sin(t)); nrm.push(0, 1, 0);
    }
    for (let i = 0; i < radSeg; i++) idx.push(tc, tc + i + 1, tc + i + 2);
    const bc = pos.length / 3;
    pos.push(0, -halfH, 0); nrm.push(0, -1, 0);
    for (let i = 0; i <= radSeg; i++) {
      const t = (i / radSeg) * 2 * Math.PI;
      pos.push(rBot * Math.cos(t), -halfH, rBot * Math.sin(t)); nrm.push(0, -1, 0);
    }
    for (let i = 0; i < radSeg; i++) idx.push(bc, bc + i + 2, bc + i + 1);
  }
  return { positions: new Float32Array(pos), normals: new Float32Array(nrm), indices: new Uint16Array(idx) };
}

function buildBox(w, h, d) {
  const hw = w / 2, hh = h / 2, hd = d / 2;
  const faces = [
    { n: [0,0,1],  c: [[-hw,-hh,hd],[hw,-hh,hd],[hw,hh,hd],[-hw,hh,hd]] },
    { n: [0,0,-1], c: [[hw,-hh,-hd],[-hw,-hh,-hd],[-hw,hh,-hd],[hw,hh,-hd]] },
    { n: [1,0,0],  c: [[hw,-hh,hd],[hw,-hh,-hd],[hw,hh,-hd],[hw,hh,hd]] },
    { n: [-1,0,0], c: [[-hw,-hh,-hd],[-hw,-hh,hd],[-hw,hh,hd],[-hw,hh,-hd]] },
    { n: [0,1,0],  c: [[-hw,hh,hd],[hw,hh,hd],[hw,hh,-hd],[-hw,hh,-hd]] },
    { n: [0,-1,0], c: [[-hw,-hh,-hd],[hw,-hh,-hd],[hw,-hh,hd],[-hw,-hh,hd]] },
  ];
  const pos = [], nrm = [], idx = [];
  faces.forEach((f, fi) => {
    const base = fi * 4;
    f.c.forEach(v => { pos.push(...v); nrm.push(...f.n); });
    idx.push(base, base+1, base+2, base, base+2, base+3);
  });
  return { positions: new Float32Array(pos), normals: new Float32Array(nrm), indices: new Uint16Array(idx) };
}

function buildTorus(radius, tube, radSeg, tubeSeg) {
  radSeg = radSeg || 24; tubeSeg = tubeSeg || 16;
  const pos = [], nrm = [], idx = [];
  for (let j = 0; j <= radSeg; j++) {
    const u = (j / radSeg) * 2 * Math.PI;
    for (let i = 0; i <= tubeSeg; i++) {
      const v = (i / tubeSeg) * 2 * Math.PI;
      const x = (radius + tube * Math.cos(v)) * Math.cos(u);
      const y =  tube * Math.sin(v);
      const z = (radius + tube * Math.cos(v)) * Math.sin(u);
      pos.push(x, y, z);
      const cx = radius * Math.cos(u), cz = radius * Math.sin(u);
      const nx = x - cx, ny = y, nz = z - cz;
      const len = Math.sqrt(nx*nx + ny*ny + nz*nz) || 1;
      nrm.push(nx/len, ny/len, nz/len);
    }
  }
  for (let j = 0; j < radSeg; j++) {
    for (let i = 0; i < tubeSeg; i++) {
      const a = j * (tubeSeg+1) + i, b = a + tubeSeg + 1;
      idx.push(a, b, a+1, b, b+1, a+1);
    }
  }
  return { positions: new Float32Array(pos), normals: new Float32Array(nrm), indices: new Uint16Array(idx) };
}

function buildDisc(radius, radSeg) {
  return buildCylinder(radius, radius, 0.01, radSeg || 24, false);
}

function buildCone(radius, height, radSeg) {
  return buildCylinder(0, radius, height, radSeg || 20, false);
}

// ── GLTF BUILDER ──────────────────────────────────────────────────────────────

class GltfBuilder {
  constructor() {
    this._chunks = [];
    this._byteOffset = 0;
    this.accessors   = [];
    this.bufferViews = [];
    this.meshes      = [];
    this.nodes       = [];
    this.materials   = [];
  }

  addMaterial(opts) {
    opts = opts || {};
    const color     = opts.color     || [1, 1, 1];
    const roughness = opts.roughness !== undefined ? opts.roughness : 0.5;
    const metalness = opts.metalness !== undefined ? opts.metalness : 0.0;
    const idx = this.materials.length;
    const mat = {
      name: opts.name || ('mat' + idx),
      doubleSided: opts.doubleSided || false,
      pbrMetallicRoughness: {
        baseColorFactor: [color[0], color[1], color[2], 1.0],
        metallicFactor:  metalness,
        roughnessFactor: roughness,
      },
    };
    this.materials.push(mat);
    return idx;
  }

  _addBV(data, target) {
    const bvIdx = this.bufferViews.length;
    this.bufferViews.push({ byteOffset: this._byteOffset, byteLength: data.byteLength, target });
    this._chunks.push(data);
    this._byteOffset += data.byteLength;
    const rem = data.byteLength % 4;
    if (rem) {
      const pad = Buffer.alloc(4 - rem);
      this._chunks.push(pad);
      this._byteOffset += pad.byteLength;
    }
    return bvIdx;
  }

  _addAcc(bvIdx, compType, count, type, min, max) {
    const idx = this.accessors.length;
    const acc = { bufferView: bvIdx, componentType: compType, count, type };
    if (min !== undefined) acc.min = min;
    if (max !== undefined) acc.max = max;
    this.accessors.push(acc);
    return idx;
  }

  buildPrim(geo, matIdx) {
    const posData = Buffer.from(geo.positions.buffer);
    const nrmData = Buffer.from(geo.normals.buffer);
    const idxData = Buffer.from(geo.indices.buffer);

    const p = geo.positions;
    const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < p.length; i += 3) {
      if (p[i]   < mn[0]) mn[0] = p[i];   if (p[i]   > mx[0]) mx[0] = p[i];
      if (p[i+1] < mn[1]) mn[1] = p[i+1]; if (p[i+1] > mx[1]) mx[1] = p[i+1];
      if (p[i+2] < mn[2]) mn[2] = p[i+2]; if (p[i+2] > mx[2]) mx[2] = p[i+2];
    }

    const posBV = this._addBV(posData, 34962);
    const nrmBV = this._addBV(nrmData, 34962);
    const idxBV = this._addBV(idxData, 34963);

    const posAcc = this._addAcc(posBV, 5126, p.length / 3, 'VEC3', mn, mx);
    const nrmAcc = this._addAcc(nrmBV, 5126, geo.normals.length / 3, 'VEC3');
    const idxAcc = this._addAcc(idxBV, 5123, geo.indices.length, 'SCALAR');

    return { attributes: { POSITION: posAcc, NORMAL: nrmAcc }, indices: idxAcc, material: matIdx };
  }

  addMesh(name, primitives) {
    const idx = this.meshes.length;
    this.meshes.push({ name, primitives });
    return idx;
  }

  addNode(name, meshIdx, translation, rotation, scale) {
    const idx = this.nodes.length;
    const node = { name, mesh: meshIdx };
    if (translation && translation.some(v => v !== 0)) node.translation = translation;
    if (rotation && (rotation[0] || rotation[1] || rotation[2] || rotation[3] !== 1)) node.rotation = rotation;
    if (scale && scale.some(v => v !== 1)) node.scale = scale;
    this.nodes.push(node);
    return idx;
  }

  build(sceneNodes) {
    const allData = Buffer.concat(this._chunks);
    const uri = 'data:application/octet-stream;base64,' + allData.toString('base64');
    return {
      asset: { generator: 'Food3D generate-gltf.js', version: '2.0' },
      scene: 0,
      scenes: [{ name: 'Scene', nodes: sceneNodes }],
      nodes:       this.nodes,
      meshes:      this.meshes,
      materials:   this.materials,
      accessors:   this.accessors,
      bufferViews: this.bufferViews,
      buffers:     [{ uri, byteLength: allData.byteLength }],
    };
  }
}

// ── SAVE HELPER ───────────────────────────────────────────────────────────────

function save(modelType, buildFn) {
  const gltf = buildFn();
  fs.writeFileSync(path.join(OUT_DIR, modelType + '.gltf'), JSON.stringify(gltf, null, 2));
  process.stdout.write('  ✓ ' + modelType + '.gltf\n');
}

// ── MODEL DEFINITIONS ─────────────────────────────────────────────────────────

console.log('Generating GLTF files...\n');

// 1. APPLE
save('apple', () => {
  const b = new GltfBuilder();
  const mBody = b.addMaterial({ name: 'body', color: [0.82, 0.13, 0.13], roughness: 0.22, metalness: 0.01 });
  const mStem = b.addMaterial({ name: 'stem', color: [0.26, 0.17, 0.12], roughness: 0.9 });
  const mLeaf = b.addMaterial({ name: 'leaf', color: [0.18, 0.49, 0.20], roughness: 0.45, doubleSided: true });
  const pBody = b.buildPrim(buildSphere(1.05, 24, 16), mBody);
  const pStem = b.buildPrim(buildCylinder(0.04, 0.05, 0.32, 10, true), mStem);
  const pLeaf = b.buildPrim(buildBox(0.04, 0.38, 0.22), mLeaf);
  const mesh0 = b.addMesh('apple_body', [pBody]);
  const mesh1 = b.addMesh('apple_stem', [pStem]);
  const mesh2 = b.addMesh('apple_leaf', [pLeaf]);
  const n0 = b.addNode('Body', mesh0);
  const n1 = b.addNode('Stem', mesh1, [0, 1.12, 0]);
  const n2 = b.addNode('Leaf', mesh2, [0.12, 1.18, 0.05], eulerToQuat(0.5, 0.6, -0.9));
  return b.build([n0, n1, n2]);
});

// 2. ORANGE
save('orange', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'body', color: [0.97, 0.55, 0.08], roughness: 0.38 });
  const m1 = b.addMaterial({ name: 'nib',  color: [0.55, 0.28, 0.04], roughness: 0.85 });
  const p0 = b.buildPrim(buildSphere(1.05, 24, 16), m0);
  const p1 = b.buildPrim(buildCylinder(0.06, 0.04, 0.12, 10, true), m1);
  const me0 = b.addMesh('body', [p0]);
  const me1 = b.addMesh('nib',  [p1]);
  const n0 = b.addNode('Body', me0);
  const n1 = b.addNode('Nib',  me1, [0, 1.08, 0]);
  return b.build([n0, n1]);
});

// 3. MANGO
save('mango', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'body', color: [0.98, 0.78, 0.11], roughness: 0.28 });
  const m1 = b.addMaterial({ name: 'stem', color: [0.22, 0.14, 0.07], roughness: 0.9 });
  const p0 = b.buildPrim(buildSphere(1.0, 24, 16), m0);
  const p1 = b.buildPrim(buildCylinder(0.05, 0.06, 0.3, 10, true), m1);
  const me0 = b.addMesh('body', [p0]);
  const me1 = b.addMesh('stem', [p1]);
  const n0 = b.addNode('Body', me0, [0, 0, 0], [0,0,0,1], [0.80, 1.25, 0.65]);
  const n1 = b.addNode('Stem', me1, [0, 1.28, 0]);
  return b.build([n0, n1]);
});

// 4. STRAWBERRY
save('strawberry', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'body', color: [0.87, 0.12, 0.16], roughness: 0.32 });
  const m1 = b.addMaterial({ name: 'leaf', color: [0.20, 0.55, 0.22], roughness: 0.50, doubleSided: true });
  const p0 = b.buildPrim(buildSphere(1.0, 20, 16), m0);
  const p1 = b.buildPrim(buildDisc(0.7, 16), m1);
  const me0 = b.addMesh('body', [p0]);
  const me1 = b.addMesh('leaf', [p1]);
  const n0 = b.addNode('Body', me0, [0, 0, 0], [0,0,0,1], [0.75, 1.1, 0.75]);
  const n1 = b.addNode('Leaf', me1, [0, 0.95, 0]);
  return b.build([n0, n1]);
});

// 5. MELON
save('melon', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'body', color: [0.82, 0.88, 0.55], roughness: 0.40 });
  const m1 = b.addMaterial({ name: 'rib',  color: [0.58, 0.68, 0.30], roughness: 0.50 });
  const p0 = b.buildPrim(buildSphere(1.1, 24, 16), m0);
  const p1 = b.buildPrim(buildCylinder(0.06, 0.06, 2.1, 8, true), m1);
  const me0 = b.addMesh('body', [p0]);
  const me1 = b.addMesh('rib',  [p1]);
  const n0 = b.addNode('Body', me0, [0, 0, 0], [0,0,0,1], [1.1, 0.9, 1.1]);
  const ribQ = eulerToQuat(0, 0, Math.PI / 2);
  const nodes = [n0];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const nr = b.addNode('Rib' + i, me1, [Math.cos(angle) * 1.05, 0, Math.sin(angle) * 1.05], ribQ);
    nodes.push(nr);
  }
  return b.build(nodes);
});

// 6. CARROT
save('carrot', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'body', color: [0.97, 0.48, 0.07], roughness: 0.35 });
  const m1 = b.addMaterial({ name: 'top',  color: [0.20, 0.60, 0.18], roughness: 0.55, doubleSided: true });
  const p0 = b.buildPrim(buildCone(0.45, 2.2, 20), m0);
  const p1 = b.buildPrim(buildCylinder(0.06, 0.04, 0.7, 8, true), m1);
  const me0 = b.addMesh('body', [p0]);
  const me1 = b.addMesh('top',  [p1]);
  const n0 = b.addNode('Body', me0, [0, 0, 0], eulerToQuat(Math.PI, 0, 0));
  const n1 = b.addNode('Top',  me1, [0, 1.45, 0]);
  return b.build([n0, n1]);
});

// 7. BROCCOLI
save('broccoli', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'head', color: [0.16, 0.48, 0.20], roughness: 0.60 });
  const m1 = b.addMaterial({ name: 'stem', color: [0.55, 0.72, 0.42], roughness: 0.50 });
  const p0 = b.buildPrim(buildSphere(0.9, 20, 14), m0);
  const p1 = b.buildPrim(buildCylinder(0.18, 0.22, 1.1, 14), m1);
  const me0 = b.addMesh('head', [p0]);
  const me1 = b.addMesh('stem', [p1]);
  const n0 = b.addNode('Stem', me1, [0, -0.3, 0]);
  const n1 = b.addNode('Main', me0, [0,  0.7, 0]);
  const nodes = [n0, n1];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const n = b.addNode('F' + i, me0, [Math.cos(a) * 0.55, 0.45, Math.sin(a) * 0.55], [0,0,0,1], [0.55,0.55,0.55]);
    nodes.push(n);
  }
  return b.build(nodes);
});

// 8. CHERRY TOMATO
save('cherry_tomato', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'fruit', color: [0.87, 0.18, 0.12], roughness: 0.25, metalness: 0.01 });
  const m1 = b.addMaterial({ name: 'stem',  color: [0.25, 0.55, 0.18], roughness: 0.70 });
  const p0 = b.buildPrim(buildSphere(0.9, 20, 14), m0);
  const p1 = b.buildPrim(buildCylinder(0.04, 0.03, 0.3, 8, true), m1);
  const me0 = b.addMesh('fruit', [p0]);
  const me1 = b.addMesh('stem',  [p1]);
  const n0 = b.addNode('T1',   me0, [-0.65, 0,    0]);
  const n1 = b.addNode('T2',   me0, [ 0.65, 0.1,  0]);
  const n2 = b.addNode('T3',   me0, [ 0,    0,    0.65]);
  const n3 = b.addNode('Stem', me1, [ 0,    1.1,  0]);
  return b.build([n0, n1, n2, n3]);
});

// 9. SPINACH
save('spinach', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'leaf', color: [0.10, 0.40, 0.15], roughness: 0.55, doubleSided: true });
  const p0 = b.buildPrim(buildBox(1.5, 0.02, 1.0), m0);
  const me0 = b.addMesh('leaf', [p0]);
  const nodes = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const n = b.addNode('L' + i, me0,
      [Math.cos(angle) * 0.4, i * 0.12, Math.sin(angle) * 0.4],
      eulerToQuat(0, angle, 0.3),
      [0.9, 0.9, 0.9]);
    nodes.push(n);
  }
  return b.build(nodes);
});

// 10. SWEET CORN
save('sweet_corn', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'cob',  color: [0.98, 0.85, 0.20], roughness: 0.38 });
  const m1 = b.addMaterial({ name: 'husk', color: [0.55, 0.72, 0.28], roughness: 0.55, doubleSided: true });
  const p0 = b.buildPrim(buildCylinder(0.42, 0.30, 2.2, 18), m0);
  const p1 = b.buildPrim(buildBox(0.5, 2.0, 0.04), m1);
  const me0 = b.addMesh('cob',  [p0]);
  const me1 = b.addMesh('husk', [p1]);
  const n0 = b.addNode('Cob', me0);
  const nodes = [n0];
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const n = b.addNode('H' + i, me1,
      [Math.cos(angle) * 0.5, -0.4, Math.sin(angle) * 0.5],
      eulerToQuat(0.35, angle, 0));
    nodes.push(n);
  }
  return b.build(nodes);
});

// 11. SALMON
save('salmon', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'flesh', color: [0.95, 0.45, 0.32], roughness: 0.40 });
  const m1 = b.addMaterial({ name: 'skin',  color: [0.58, 0.55, 0.50], roughness: 0.55 });
  const p0 = b.buildPrim(buildBox(2.2, 0.38, 1.1), m0);
  const p1 = b.buildPrim(buildBox(2.2, 0.05, 1.1), m1);
  const me0 = b.addMesh('flesh', [p0]);
  const me1 = b.addMesh('skin',  [p1]);
  const n0 = b.addNode('Flesh', me0, [0,  0.02, 0]);
  const n1 = b.addNode('Skin',  me1, [0, -0.18, 0]);
  return b.build([n0, n1]);
});

// 12. LOBSTER
save('lobster', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'shell', color: [0.82, 0.22, 0.10], roughness: 0.35, metalness: 0.05 });
  const m1 = b.addMaterial({ name: 'claw',  color: [0.75, 0.18, 0.08], roughness: 0.40 });
  const p0 = b.buildPrim(buildSphere(0.6, 18, 12), m0);
  const p1 = b.buildPrim(buildCylinder(0.35, 0.15, 1.4, 16), m0);
  const p2 = b.buildPrim(buildSphere(0.38, 14, 10), m1);
  const me0 = b.addMesh('body', [p0]);
  const me1 = b.addMesh('tail', [p1]);
  const me2 = b.addMesh('claw', [p2]);
  const n0 = b.addNode('Body',  me0, [0,  0.5,  0]);
  const n1 = b.addNode('Tail',  me1, [0, -0.3,  0], eulerToQuat(Math.PI / 12, 0, 0));
  const n2 = b.addNode('ClawL', me2, [-1.0, 0.6, 0.3], [0,0,0,1], [1, 0.7, 1.3]);
  const n3 = b.addNode('ClawR', me2, [ 1.0, 0.6, 0.3], [0,0,0,1], [1, 0.7, 1.3]);
  return b.build([n0, n1, n2, n3]);
});

// 13. TUNA
save('tuna', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'flesh', color: [0.68, 0.15, 0.18], roughness: 0.38 });
  const m1 = b.addMaterial({ name: 'cut',   color: [0.82, 0.32, 0.28], roughness: 0.35 });
  const p0 = b.buildPrim(buildBox(1.8, 0.9, 0.9), m0);
  const p1 = b.buildPrim(buildBox(0.02, 0.9, 0.9), m1);
  const me0 = b.addMesh('block', [p0]);
  const me1 = b.addMesh('face',  [p1]);
  const n0 = b.addNode('Block', me0);
  const n1 = b.addNode('Face',  me1, [0.91, 0, 0]);
  return b.build([n0, n1]);
});

// 14. OCTOPUS
save('octopus', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'body', color: [0.55, 0.35, 0.60], roughness: 0.50 });
  const m1 = b.addMaterial({ name: 'tent', color: [0.60, 0.38, 0.62], roughness: 0.55 });
  const p0 = b.buildPrim(buildSphere(0.85, 18, 14), m0);
  const p1 = b.buildPrim(buildCylinder(0.12, 0.04, 1.6, 8, true), m1);
  const me0 = b.addMesh('head', [p0]);
  const me1 = b.addMesh('tent', [p1]);
  const n0 = b.addNode('Head', me0, [0, 0.6, 0]);
  const nodes = [n0];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const n = b.addNode('T' + i, me1,
      [Math.cos(angle) * 0.6, -0.2, Math.sin(angle) * 0.6],
      eulerToQuat(0.5, angle, 0));
    nodes.push(n);
  }
  return b.build(nodes);
});

// 15. MERCEDES S450
save('car_mercedes_s450', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'body',   color: [0.88, 0.88, 0.90], roughness: 0.10, metalness: 0.80 });
  const m1 = b.addMaterial({ name: 'glass',  color: [0.22, 0.30, 0.38], roughness: 0.05, metalness: 0.20, doubleSided: true });
  const m2 = b.addMaterial({ name: 'wheel',  color: [0.12, 0.12, 0.12], roughness: 0.60 });
  const m3 = b.addMaterial({ name: 'chrome', color: [0.95, 0.95, 0.95], roughness: 0.05, metalness: 1.00 });
  const p0 = b.buildPrim(buildBox(4.2, 0.35, 1.85), m0);
  const p1 = b.buildPrim(buildBox(2.6, 0.65, 1.70), m0);
  const p2 = b.buildPrim(buildBox(2.2, 0.55, 1.65), m1);
  const p3 = b.buildPrim(buildTorus(0.34, 0.14, 20, 12), m2);
  const p4 = b.buildPrim(buildDisc(0.28, 20), m3);
  const me0 = b.addMesh('chassis', [p0]);
  const me1 = b.addMesh('cabin',   [p1]);
  const me2 = b.addMesh('glass',   [p2]);
  const me3 = b.addMesh('tire',    [p3]);
  const me4 = b.addMesh('rim',     [p4]);
  const tireQ = eulerToQuat(Math.PI / 2, 0, 0);
  const nodes = [
    b.addNode('Chassis', me0, [0, 0.20, 0]),
    b.addNode('Cabin',   me1, [0.1, 0.72, 0]),
    b.addNode('Glass',   me2, [0.1, 0.73, 0]),
  ];
  [[-1.4, 0, 1.0],[-1.4, 0,-1.0],[1.3, 0, 1.0],[1.3, 0,-1.0]].forEach(function(w, i) {
    nodes.push(b.addNode('Tire' + i, me3, w, tireQ));
    nodes.push(b.addNode('Rim'  + i, me4, [w[0], w[1], w[2] + (w[2] > 0 ? 0.14 : -0.14)], tireQ));
  });
  return b.build(nodes);
});

// 16. BMW 730Li
save('car_bmw_7', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'body',  color: [0.05, 0.05, 0.08], roughness: 0.10, metalness: 0.80 });
  const m1 = b.addMaterial({ name: 'glass', color: [0.20, 0.28, 0.35], roughness: 0.05, metalness: 0.20, doubleSided: true });
  const m2 = b.addMaterial({ name: 'wheel', color: [0.10, 0.10, 0.10], roughness: 0.60 });
  const p0 = b.buildPrim(buildBox(4.1, 0.35, 1.85), m0);
  const p1 = b.buildPrim(buildBox(2.5, 0.62, 1.72), m0);
  const p2 = b.buildPrim(buildBox(2.1, 0.52, 1.66), m1);
  const p3 = b.buildPrim(buildTorus(0.34, 0.14, 20, 12), m2);
  const me0 = b.addMesh('chassis', [p0]);
  const me1 = b.addMesh('cabin',   [p1]);
  const me2 = b.addMesh('glass',   [p2]);
  const me3 = b.addMesh('tire',    [p3]);
  const tireQ = eulerToQuat(Math.PI / 2, 0, 0);
  const nodes = [
    b.addNode('Chassis', me0, [0, 0.20, 0]),
    b.addNode('Cabin',   me1, [0.05, 0.72, 0]),
    b.addNode('Glass',   me2, [0.05, 0.73, 0]),
  ];
  [[-1.35,0,1],[-1.35,0,-1],[1.25,0,1],[1.25,0,-1]].forEach(function(w, i) {
    nodes.push(b.addNode('Tire' + i, me3, w, tireQ));
  });
  return b.build(nodes);
});

// 17. AUDI Q8
save('car_audi_q8', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'body',  color: [0.58, 0.12, 0.08], roughness: 0.10, metalness: 0.80 });
  const m1 = b.addMaterial({ name: 'glass', color: [0.22, 0.30, 0.38], roughness: 0.05, metalness: 0.20, doubleSided: true });
  const m2 = b.addMaterial({ name: 'wheel', color: [0.12, 0.12, 0.12], roughness: 0.60 });
  const p0 = b.buildPrim(buildBox(4.0, 0.42, 1.92), m0);
  const p1 = b.buildPrim(buildBox(2.4, 0.72, 1.80), m0);
  const p2 = b.buildPrim(buildBox(2.0, 0.60, 1.74), m1);
  const p3 = b.buildPrim(buildTorus(0.38, 0.16, 20, 12), m2);
  const me0 = b.addMesh('chassis', [p0]);
  const me1 = b.addMesh('cabin',   [p1]);
  const me2 = b.addMesh('glass',   [p2]);
  const me3 = b.addMesh('tire',    [p3]);
  const tireQ = eulerToQuat(Math.PI / 2, 0, 0);
  const nodes = [
    b.addNode('Chassis', me0, [0, 0.22, 0]),
    b.addNode('Cabin',   me1, [0.1, 0.80, 0]),
    b.addNode('Glass',   me2, [0.1, 0.81, 0]),
  ];
  [[-1.3,0,1.05],[-1.3,0,-1.05],[1.2,0,1.05],[1.2,0,-1.05]].forEach(function(w, i) {
    nodes.push(b.addNode('Tire' + i, me3, w, tireQ));
  });
  return b.build(nodes);
});

// 18. IPHONE 15 (phone_iphone)
save('phone_iphone', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'body',   color: [0.08, 0.08, 0.10], roughness: 0.06, metalness: 0.70 });
  const m1 = b.addMaterial({ name: 'screen', color: [0.04, 0.04, 0.08], roughness: 0.05 });
  const m2 = b.addMaterial({ name: 'frame',  color: [0.72, 0.72, 0.75], roughness: 0.05, metalness: 1.00 });
  const p0 = b.buildPrim(buildBox(0.72, 1.50, 0.080), m0);
  const p1 = b.buildPrim(buildBox(0.64, 1.36, 0.005), m1);
  const p2 = b.buildPrim(buildBox(0.02, 1.50, 0.080), m2);
  const me0 = b.addMesh('body',   [p0]);
  const me1 = b.addMesh('screen', [p1]);
  const me2 = b.addMesh('frameL', [p2]);
  const n0 = b.addNode('Body',   me0);
  const n1 = b.addNode('Screen', me1, [0, 0, 0.042]);
  const n2 = b.addNode('FrameL', me2, [-0.37, 0, 0]);
  const n3 = b.addNode('FrameR', me2, [ 0.37, 0, 0]);
  return b.build([n0, n1, n2, n3]);
});

// 19. SAMSUNG (phone_samsung)
save('phone_samsung', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'body',   color: [0.06, 0.06, 0.10], roughness: 0.06, metalness: 0.70 });
  const m1 = b.addMaterial({ name: 'screen', color: [0.02, 0.04, 0.08], roughness: 0.05 });
  const p0 = b.buildPrim(buildBox(0.76, 1.58, 0.085), m0);
  const p1 = b.buildPrim(buildBox(0.68, 1.44, 0.005), m1);
  const me0 = b.addMesh('body',   [p0]);
  const me1 = b.addMesh('screen', [p1]);
  const n0 = b.addNode('Body',   me0);
  const n1 = b.addNode('Screen', me1, [0, 0, 0.044]);
  return b.build([n0, n1]);
});

// 20. MACBOOK (laptop_macbook)
save('laptop_macbook', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'alu',    color: [0.72, 0.72, 0.73], roughness: 0.18, metalness: 0.85 });
  const m1 = b.addMaterial({ name: 'screen', color: [0.03, 0.04, 0.06], roughness: 0.05 });
  const m2 = b.addMaterial({ name: 'keys',   color: [0.18, 0.18, 0.20], roughness: 0.50 });
  const p0 = b.buildPrim(buildBox(3.0, 0.10, 2.1), m0);
  const p1 = b.buildPrim(buildBox(3.0, 0.06, 2.1), m0);
  const p2 = b.buildPrim(buildBox(2.85, 1.85, 0.005), m1);
  const p3 = b.buildPrim(buildBox(2.0, 0.01, 1.0), m2);
  const me0 = b.addMesh('base',   [p0]);
  const me1 = b.addMesh('lid',    [p1]);
  const me2 = b.addMesh('screen', [p2]);
  const me3 = b.addMesh('keys',   [p3]);
  const lidQ = eulerToQuat(-1.92, 0, 0);
  const n0 = b.addNode('Base',   me0, [0, -0.05, 0]);
  const n1 = b.addNode('Keys',   me3, [0,  0.06, 0.1]);
  const n2 = b.addNode('Lid',    me1, [0,  0.03, -1.05], lidQ);
  const n3 = b.addNode('Screen', me2, [0,  0.98, -2.06], lidQ);
  return b.build([n0, n1, n2, n3]);
});

// 21. SONY CAMERA (camera_sony)
save('camera_sony', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'body',  color: [0.08, 0.08, 0.10], roughness: 0.40 });
  const m1 = b.addMaterial({ name: 'lens',  color: [0.12, 0.12, 0.14], roughness: 0.10, metalness: 0.50 });
  const m2 = b.addMaterial({ name: 'glass', color: [0.12, 0.18, 0.25], roughness: 0.05 });
  const p0 = b.buildPrim(buildBox(1.4, 1.0, 0.80), m0);
  const p1 = b.buildPrim(buildBox(0.4, 1.0, 0.85), m0);
  const p2 = b.buildPrim(buildCylinder(0.42, 0.40, 0.9, 24), m1);
  const p3 = b.buildPrim(buildDisc(0.35, 24), m2);
  const me0 = b.addMesh('body',   [p0]);
  const me1 = b.addMesh('grip',   [p1]);
  const me2 = b.addMesh('lbody',  [p2]);
  const me3 = b.addMesh('lglass', [p3]);
  const lensQ = eulerToQuat(Math.PI / 2, 0, 0);
  const n0 = b.addNode('Body',   me0, [0.1,  0,    0]);
  const n1 = b.addNode('Grip',   me1, [-0.9, -0.05, 0.025]);
  const n2 = b.addNode('LBody',  me2, [0.15,  0.1,  0.85], lensQ);
  const n3 = b.addNode('LGlass', me3, [0.15,  0.1,  1.31], lensQ);
  return b.build([n0, n1, n2, n3]);
});

// 22. AIRPODS (headphone_airpods)
save('headphone_airpods', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'case', color: [0.96, 0.96, 0.97], roughness: 0.12 });
  const m1 = b.addMaterial({ name: 'bud',  color: [0.94, 0.94, 0.96], roughness: 0.15 });
  const p0 = b.buildPrim(buildBox(0.9, 0.7, 0.55), m0);
  const p1 = b.buildPrim(buildSphere(0.22, 14, 10), m1);
  const p2 = b.buildPrim(buildCylinder(0.06, 0.05, 0.55, 10, true), m1);
  const me0 = b.addMesh('case', [p0]);
  const me1 = b.addMesh('bud',  [p1]);
  const me2 = b.addMesh('stem', [p2]);
  const n0 = b.addNode('Case',  me0);
  const n1 = b.addNode('BudL',  me1, [-0.28,  0.18, 0.22]);
  const n2 = b.addNode('StemL', me2, [-0.28, -0.10, 0.22]);
  const n3 = b.addNode('BudR',  me1, [ 0.28,  0.18, 0.22]);
  const n4 = b.addNode('StemR', me2, [ 0.28, -0.10, 0.22]);
  return b.build([n0, n1, n2, n3, n4]);
});

// 23. LG TV (tv_lg)
save('tv_lg', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'screen', color: [0.04, 0.04, 0.08], roughness: 0.05 });
  const m1 = b.addMaterial({ name: 'bezel',  color: [0.06, 0.06, 0.08], roughness: 0.30 });
  const m2 = b.addMaterial({ name: 'stand',  color: [0.12, 0.12, 0.14], roughness: 0.35 });
  const p0 = b.buildPrim(buildBox(4.00, 2.28, 0.04), m0);
  const p1 = b.buildPrim(buildBox(4.12, 2.38, 0.05), m1);
  const p2 = b.buildPrim(buildBox(0.14, 1.00, 0.12), m2);
  const p3 = b.buildPrim(buildBox(1.20, 0.08, 0.45), m2);
  const me0 = b.addMesh('screen', [p0]);
  const me1 = b.addMesh('bezel',  [p1]);
  const me2 = b.addMesh('standV', [p2]);
  const me3 = b.addMesh('standH', [p3]);
  const n0 = b.addNode('Screen', me0, [0,     0,     0.005]);
  const n1 = b.addNode('Bezel',  me1);
  const n2 = b.addNode('StandV', me2, [0,    -1.68,  0]);
  const n3 = b.addNode('StandH', me3, [0,    -2.20,  0.12]);
  return b.build([n1, n0, n2, n3]);
});

// 24. PS5 (console_ps5)
save('console_ps5', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'white', color: [0.94, 0.94, 0.96], roughness: 0.15 });
  const m1 = b.addMaterial({ name: 'black', color: [0.06, 0.06, 0.08], roughness: 0.40 });
  const m2 = b.addMaterial({ name: 'ctrl',  color: [0.90, 0.90, 0.92], roughness: 0.20 });
  const p0 = b.buildPrim(buildBox(1.00, 2.80, 0.55), m1);
  const p1 = b.buildPrim(buildBox(0.18, 2.60, 0.52), m0);
  const p2 = b.buildPrim(buildBox(1.10, 0.45, 0.70), m2);
  const me0 = b.addMesh('core',   [p0]);
  const me1 = b.addMesh('panel',  [p1]);
  const me2 = b.addMesh('ctrl',   [p2]);
  const n0 = b.addNode('Core',   me0);
  const n1 = b.addNode('PanelL', me1, [-0.59, 0, 0]);
  const n2 = b.addNode('PanelR', me1, [ 0.59, 0, 0]);
  const n3 = b.addNode('Ctrl',   me2, [0, -1.9, 0.45]);
  return b.build([n0, n1, n2, n3]);
});

// 25. GARMIN WATCH (watch_garmin)
save('watch_garmin', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'case',   color: [0.62, 0.62, 0.65], roughness: 0.20, metalness: 0.70 });
  const m1 = b.addMaterial({ name: 'screen', color: [0.04, 0.06, 0.10], roughness: 0.08 });
  const m2 = b.addMaterial({ name: 'band',   color: [0.08, 0.08, 0.10], roughness: 0.55 });
  const discQ = eulerToQuat(Math.PI / 2, 0, 0);
  const p0 = b.buildPrim(buildCylinder(0.60, 0.60, 0.16, 32), m0);
  const p1 = b.buildPrim(buildDisc(0.52, 32), m1);
  const p2 = b.buildPrim(buildBox(0.45, 1.1, 0.08), m2);
  const me0 = b.addMesh('case',   [p0]);
  const me1 = b.addMesh('screen', [p1]);
  const me2 = b.addMesh('band',   [p2]);
  const n0 = b.addNode('Case',    me0, [0, 0, 0],    discQ);
  const n1 = b.addNode('Screen',  me1, [0, 0, 0.09], discQ);
  const n2 = b.addNode('BandTop', me2, [0,  0.72, 0]);
  const n3 = b.addNode('BandBot', me2, [0, -0.72, 0]);
  return b.build([n0, n1, n2, n3]);
});

// 26. HAM (food_ham)
save('food_ham', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'meat', color: [0.70, 0.22, 0.18], roughness: 0.50 });
  const m1 = b.addMaterial({ name: 'fat',  color: [0.90, 0.82, 0.72], roughness: 0.40 });
  const m2 = b.addMaterial({ name: 'bone', color: [0.88, 0.84, 0.78], roughness: 0.55 });
  const p0 = b.buildPrim(buildSphere(1.1, 20, 14), m0);
  const p1 = b.buildPrim(buildDisc(1.1, 20), m1);
  const p2 = b.buildPrim(buildCylinder(0.12, 0.08, 1.8, 12), m2);
  const me0 = b.addMesh('leg',  [p0]);
  const me1 = b.addMesh('fat',  [p1]);
  const me2 = b.addMesh('bone', [p2]);
  const n0 = b.addNode('Leg',  me0, [0, 0, 0], [0,0,0,1], [1.0, 0.8, 1.2]);
  const n1 = b.addNode('Fat',  me1, [0, 0.55, 0], eulerToQuat(Math.PI / 2, 0, 0), [1.0, 1.0, 1.0]);
  const n2 = b.addNode('Bone', me2, [0.2, -0.5, 0], eulerToQuat(0.3, 0, 0.2));
  return b.build([n0, n1, n2]);
});

// 27. WINE BOTTLE (food_wine)
save('food_wine', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'glass', color: [0.10, 0.22, 0.08], roughness: 0.05, metalness: 0.10 });
  const m1 = b.addMaterial({ name: 'label', color: [0.90, 0.88, 0.82], roughness: 0.60 });
  const m2 = b.addMaterial({ name: 'cork',  color: [0.72, 0.58, 0.40], roughness: 0.70 });
  const p0 = b.buildPrim(buildCylinder(0.38, 0.38, 2.2, 24), m0);
  const p1 = b.buildPrim(buildCylinder(0.14, 0.30, 0.45, 16), m0);
  const p2 = b.buildPrim(buildBox(0.78, 0.85, 0.02), m1);
  const p3 = b.buildPrim(buildCylinder(0.14, 0.14, 0.22, 12), m2);
  const me0 = b.addMesh('body',  [p0]);
  const me1 = b.addMesh('neck',  [p1]);
  const me2 = b.addMesh('label', [p2]);
  const me3 = b.addMesh('cork',  [p3]);
  const n0 = b.addNode('Body',  me0);
  const n1 = b.addNode('Neck',  me1, [0, 1.33, 0]);
  const n2 = b.addNode('Label', me2, [0, -0.05, 0.40]);
  const n3 = b.addNode('Cork',  me3, [0, 1.68, 0]);
  return b.build([n0, n1, n2, n3]);
});

// 28. COFFEE TIN (food_coffee)
save('food_coffee', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'tin',   color: [0.15, 0.10, 0.08], roughness: 0.30, metalness: 0.60 });
  const m1 = b.addMaterial({ name: 'lid',   color: [0.65, 0.52, 0.35], roughness: 0.35 });
  const m2 = b.addMaterial({ name: 'label', color: [0.88, 0.82, 0.72], roughness: 0.60 });
  const p0 = b.buildPrim(buildCylinder(0.55, 0.55, 1.4, 24), m0);
  const p1 = b.buildPrim(buildCylinder(0.57, 0.57, 0.14, 24), m1);
  const p2 = b.buildPrim(buildBox(1.12, 0.8, 0.02), m2);
  const me0 = b.addMesh('tin',   [p0]);
  const me1 = b.addMesh('lid',   [p1]);
  const me2 = b.addMesh('label', [p2]);
  const n0 = b.addNode('Tin',   me0);
  const n1 = b.addNode('Lid',   me1, [0, 0.77, 0]);
  const n2 = b.addNode('Label', me2, [0, 0,    0.57]);
  return b.build([n0, n1, n2]);
});

// 29. BURRATA (food_cheese)
save('food_cheese', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'outer', color: [0.96, 0.95, 0.90], roughness: 0.40 });
  const m1 = b.addMaterial({ name: 'inner', color: [0.98, 0.97, 0.92], roughness: 0.50 });
  const m2 = b.addMaterial({ name: 'plate', color: [0.92, 0.90, 0.86], roughness: 0.35 });
  const p0 = b.buildPrim(buildSphere(0.85, 18, 14), m0);
  const p1 = b.buildPrim(buildSphere(0.80, 16, 12), m1);
  const p2 = b.buildPrim(buildDisc(1.4, 24), m2);
  const me0 = b.addMesh('outer', [p0]);
  const me1 = b.addMesh('inner', [p1]);
  const me2 = b.addMesh('plate', [p2]);
  const plateQ = eulerToQuat(Math.PI / 2, 0, 0);
  const n0 = b.addNode('Outer', me0, [0, 0.10, 0]);
  const n1 = b.addNode('Inner', me1, [0, 0.10, 0]);
  const n2 = b.addNode('Plate', me2, [0, -0.82, 0], plateQ);
  return b.build([n0, n1, n2]);
});

// 30. PH METER (tool_meter)
save('tool_meter', () => {
  const b = new GltfBuilder();
  const m0 = b.addMaterial({ name: 'body',   color: [0.10, 0.55, 0.22], roughness: 0.40 });
  const m1 = b.addMaterial({ name: 'screen', color: [0.05, 0.10, 0.08], roughness: 0.10 });
  const m2 = b.addMaterial({ name: 'probe',  color: [0.72, 0.72, 0.74], roughness: 0.25, metalness: 0.80 });
  const p0 = b.buildPrim(buildBox(0.5, 1.4, 0.25), m0);
  const p1 = b.buildPrim(buildBox(0.38, 0.55, 0.01), m1);
  const p2 = b.buildPrim(buildCylinder(0.06, 0.04, 1.8, 14, true), m2);
  const me0 = b.addMesh('body',   [p0]);
  const me1 = b.addMesh('screen', [p1]);
  const me2 = b.addMesh('probe',  [p2]);
  const n0 = b.addNode('Body',   me0);
  const n1 = b.addNode('Screen', me1, [0,  0.22, 0.13]);
  const n2 = b.addNode('Probe',  me2, [0, -2.00, 0]);
  return b.build([n0, n1, n2]);
});

console.log('\nDone! All .gltf files written to public/Blender/');
