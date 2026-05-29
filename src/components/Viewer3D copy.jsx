// import React, { useEffect, useRef, useState } from 'react';
// import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// export default function Viewer3D({ modelType, autoRotate = true }) {
//   const containerRef = useRef(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!containerRef.current) return;

//     setLoading(true);

//     const width = containerRef.current.clientWidth || 400;
//     const height = containerRef.current.clientHeight || 400;

//     // Scene
//     const scene = new THREE.Scene();
//     scene.background = new THREE.Color('#111122');

//     // Camera
//     const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
//     camera.position.set(0, 2.2, 5.5);

//     // Renderer - physically correct lighting
//     const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
//     renderer.setSize(width, height);
//     renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
//     renderer.shadowMap.enabled = true;
//     renderer.shadowMap.type = THREE.PCFSoftShadowMap;
//     renderer.outputColorSpace = THREE.SRGBColorSpace;
//     renderer.toneMapping = THREE.ACESFilmicToneMapping;
//     renderer.toneMappingExposure = 1.1;

//     containerRef.current.innerHTML = '';
//     containerRef.current.appendChild(renderer.domElement);

//     // Controls
//     const controls = new OrbitControls(camera, renderer.domElement);
//     controls.enableDamping = true;
//     controls.dampingFactor = 0.05;
//     controls.minDistance = 2.0;
//     controls.maxDistance = 10;
//     controls.maxPolarAngle = Math.PI / 2 + 0.1;
//     controls.target.set(0, 0, 0);

//     // ── PROCEDURAL STUDIO ENVIRONMENT MAP ──────────────────────────────────────
//     const pmremGenerator = new THREE.PMREMGenerator(renderer);
//     pmremGenerator.compileEquirectangularShader();

//     const envCanvas = document.createElement('canvas');
//     envCanvas.width = 512;
//     envCanvas.height = 256;
//     const envCtx = envCanvas.getContext('2d');

//     // Soft dark blue studio backdrop
//     envCtx.fillStyle = '#06060c';
//     envCtx.fillRect(0, 0, 512, 256);

//     // Warm key light reflection
//     let envGrad = envCtx.createRadialGradient(160, 80, 0, 160, 80, 140);
//     envGrad.addColorStop(0, '#ffffff');
//     envGrad.addColorStop(0.3, '#fff2e0');
//     envGrad.addColorStop(1, 'transparent');
//     envCtx.fillStyle = envGrad;
//     envCtx.fillRect(0, 0, 512, 256);

//     // Cool fill light reflection
//     envGrad = envCtx.createRadialGradient(380, 120, 0, 380, 120, 180);
//     envGrad.addColorStop(0, '#e3efff');
//     envGrad.addColorStop(0.5, '#94b3ff');
//     envGrad.addColorStop(1, 'transparent');
//     envCtx.fillStyle = envGrad;
//     envCtx.fillRect(0, 0, 512, 256);

//     // Rim light reflection
//     envGrad = envCtx.createRadialGradient(256, 180, 0, 256, 180, 80);
//     envGrad.addColorStop(0, '#ffe8d6');
//     envGrad.addColorStop(1, 'transparent');
//     envCtx.fillStyle = envGrad;
//     envCtx.fillRect(0, 0, 512, 256);

//     const envTexture = new THREE.CanvasTexture(envCanvas);
//     envTexture.mapping = THREE.EquirectangularReflectionMapping;
//     const envMap = pmremGenerator.fromEquirectangular(envTexture).texture;
//     scene.environment = envMap;
    
//     pmremGenerator.dispose();
//     envTexture.dispose();

//     // ── LIGHTING ──────────────────────────────────────────────────────────────
//     // Hemisphere: soft ambient sky/ground fill
//     const hemiLight = new THREE.HemisphereLight('#cbd8f5', '#241a15', 0.25);
//     scene.add(hemiLight);

//     // Key light (warm studio key)
//     const keyLight = new THREE.DirectionalLight('#fffcf5', 2.0);
//     keyLight.position.set(4, 7, 3.5);
//     keyLight.castShadow = true;
//     keyLight.shadow.mapSize.width = 2048;
//     keyLight.shadow.mapSize.height = 2048;
//     keyLight.shadow.camera.near = 0.5;
//     keyLight.shadow.camera.far = 15;
//     keyLight.shadow.camera.left = -3;
//     keyLight.shadow.camera.right = 3;
//     keyLight.shadow.camera.top = 3;
//     keyLight.shadow.camera.bottom = -3;
//     keyLight.shadow.bias = -0.0003;
//     keyLight.shadow.normalBias = 0.015;
//     scene.add(keyLight);

//     // Fill light (cool fill)
//     const fillLight = new THREE.DirectionalLight('#dce6ff', 0.7);
//     fillLight.position.set(-4, 2, -2);
//     scene.add(fillLight);

//     // Rim / Back light
//     const rimLight = new THREE.DirectionalLight('#fff2db', 1.2);
//     rimLight.position.set(0, 3.5, -5);
//     scene.add(rimLight);

//     // Under light to fill bottom shadows
//     const underLight = new THREE.PointLight('#ffffff', 0.35, 8);
//     underLight.position.set(0, -2, 2);
//     scene.add(underLight);

//     // ── GROUND PLANE ──────────────────────────────────────────────────────────
//     const shadowPlaneGeo = new THREE.PlaneGeometry(12, 12);
//     const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.38 });
//     const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
//     shadowPlane.rotation.x = -Math.PI / 2;
//     shadowPlane.position.y = -1.5;
//     shadowPlane.receiveShadow = true;
//     scene.add(shadowPlane);

//     // Reflective disc under object
//     const discGeo = new THREE.CircleGeometry(1.5, 64);
//     const discMat = new THREE.MeshStandardMaterial({
//       color: '#ffffff',
//       roughness: 0.15,
//       metalness: 0.0,
//       transparent: true,
//       opacity: 0.06,
//     });
//     const disc = new THREE.Mesh(discGeo, discMat);
//     disc.rotation.x = -Math.PI / 2;
//     disc.position.y = -1.49;
//     scene.add(disc);

//     // ── HELPERS ───────────────────────────────────────────────────────────────
//     const makeCanvasTexture = (draw, w = 512, h = 512) => {
//       const c = document.createElement('canvas');
//       c.width = w; c.height = h;
//       draw(c.getContext('2d'), w, h);
//       const t = new THREE.CanvasTexture(c);
//       t.colorSpace = THREE.SRGBColorSpace;
//       return t;
//     };

//     // Organic deforming helper to make models look natural (imperfect)
//     const deformGeometry = (geometry, amount = 0.05, frequency = 2.0) => {
//       const position = geometry.attributes.position;
//       const normal = geometry.attributes.normal;
//       if (!normal) return;

//       for (let i = 0; i < position.count; i++) {
//         const x = position.getX(i);
//         const y = position.getY(i);
//         const z = position.getZ(i);

//         // Simple 3D sine/cosine noise
//         const noise = Math.sin(x * frequency) * Math.cos(y * frequency) * Math.sin(z * frequency) +
//                       Math.sin(x * frequency * 2.2 + 1.1) * Math.cos(z * frequency * 1.9 + 0.4) * 0.5;

//         const nx = normal.getX(i);
//         const ny = normal.getY(i);
//         const nz = normal.getZ(i);

//         position.setXYZ(i, x + nx * noise * amount, y + ny * noise * amount, z + nz * noise * amount);
//       }
//       geometry.computeVertexNormals();
//     };

//     // ── GAUSSIAN SPLATTING HELPERS ─────────────────────────────────────────────
//     const parseSplat = (arrayBuffer) => {
//       const rowLength = 32;
//       const numSplats = Math.floor(arrayBuffer.byteLength / rowLength);
      
//       const positions = new Float32Array(numSplats * 3);
//       const scales = new Float32Array(numSplats * 3);
//       const colors = new Float32Array(numSplats * 4);
      
//       const fBuffer = new Float32Array(arrayBuffer);
//       const uBuffer = new Uint8Array(arrayBuffer);
      
//       for (let i = 0; i < numSplats; i++) {
//         // Position
//         positions[i * 3 + 0] = fBuffer[i * 8 + 0];
//         positions[i * 3 + 1] = fBuffer[i * 8 + 1];
//         positions[i * 3 + 2] = fBuffer[i * 8 + 2];
        
//         // Scale
//         scales[i * 3 + 0] = fBuffer[i * 8 + 3];
//         scales[i * 3 + 1] = fBuffer[i * 8 + 4];
//         scales[i * 3 + 2] = fBuffer[i * 8 + 5];
        
//         // Color (RGBA)
//         colors[i * 4 + 0] = uBuffer[i * 32 + 24] / 255.0;
//         colors[i * 4 + 1] = uBuffer[i * 32 + 25] / 255.0;
//         colors[i * 4 + 2] = uBuffer[i * 32 + 26] / 255.0;
//         colors[i * 4 + 3] = uBuffer[i * 32 + 27] / 255.0;
//       }
      
//       return { positions, scales, colors, numSplats };
//     };

//     const createSplatMesh = (splatData) => {
//       const geometry = new THREE.BufferGeometry();
      
//       geometry.setAttribute('position', new THREE.BufferAttribute(splatData.positions, 3));
//       geometry.setAttribute('color', new THREE.BufferAttribute(splatData.colors, 4));
//       geometry.setAttribute('scale', new THREE.BufferAttribute(splatData.scales, 3));
      
//       const material = new THREE.ShaderMaterial({
//         vertexShader: `
//           attribute vec3 scale;
//           attribute vec4 color;
//           varying vec4 vColor;
//           void main() {
//             vColor = color;
//             vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            
//             float size = (scale.x + scale.y + scale.z) / 3.0;
//             size = max(size, 0.001);
            
//             gl_PointSize = size * (800.0 / -mvPosition.z);
//             gl_PointSize = clamp(gl_PointSize, 1.0, 64.0);
            
//             gl_Position = projectionMatrix * mvPosition;
//           }
//         `,
//         fragmentShader: `
//           varying vec4 vColor;
//           void main() {
//             vec2 coord = gl_PointCoord - vec2(0.5);
//             float rSq = dot(coord, coord);
//             if (rSq > 0.25) discard;
            
//             float alpha = exp(-rSq * 16.0) * vColor.a;
//             if (alpha < 0.02) discard;
            
//             gl_FragColor = vec4(vColor.rgb, alpha);
//           }
//         `,
//         transparent: true,
//         depthWrite: false,
//         depthTest: true,
//         blending: THREE.NormalBlending,
//       });
      
//       const points = new THREE.Points(geometry, material);
//       return points;
//     };

//     // ── MODEL GROUP ───────────────────────────────────────────────────────────
//     const modelGroup = new THREE.Group();

//     // ── 1. APPLE ──────────────────────────────────────────────────────────────
//     const createApple = () => {
//       const diffuseTex = makeCanvasTexture((ctx, w, h) => {
//         // Base red-yellow gradient
//         const grad = ctx.createLinearGradient(0, h, 0, 0);
//         grad.addColorStop(0.0, '#cbd448'); // greenish-yellow base
//         grad.addColorStop(0.18, '#ffd54f'); // golden yellow
//         grad.addColorStop(0.35, '#e53935'); // rich red
//         grad.addColorStop(1.0, '#b71c1c'); // deep red top
//         ctx.fillStyle = grad;
//         ctx.fillRect(0, 0, w, h);

//         // Vertical streaks
//         ctx.globalAlpha = 0.38;
//         for (let i = 0; i < 40; i++) {
//           const x = Math.random() * w;
//           ctx.strokeStyle = Math.random() > 0.4 ? '#8b0000' : '#d32f2f';
//           ctx.lineWidth = 1.2 + Math.random() * 3;
//           ctx.beginPath();
//           ctx.moveTo(x, 0);
//           ctx.bezierCurveTo(x + (Math.random() - 0.5) * 30, h * 0.3, x + (Math.random() - 0.5) * 30, h * 0.7, x + (Math.random() - 0.5) * 10, h);
//           ctx.stroke();
//         }

//         // Natural spots
//         ctx.globalAlpha = 0.45;
//         ctx.fillStyle = '#ffecb3';
//         for (let i = 0; i < 700; i++) {
//           ctx.beginPath();
//           ctx.arc(Math.random() * w, Math.random() * h, 0.7 + Math.random() * 1.0, 0, Math.PI * 2);
//           ctx.fill();
//         }
//       });

//       const bumpTex = makeCanvasTexture((ctx, w, h) => {
//         ctx.fillStyle = '#808080';
//         ctx.fillRect(0, 0, w, h);
        
//         ctx.fillStyle = '#686868';
//         ctx.globalAlpha = 0.25;
//         for (let i = 0; i < 2000; i++) {
//           ctx.beginPath();
//           ctx.arc(Math.random() * w, Math.random() * h, 0.6 + Math.random() * 0.8, 0, Math.PI * 2);
//           ctx.fill();
//         }
//       });

//       const bodyGeo = new THREE.SphereGeometry(1.15, 64, 64);
//       const pos = bodyGeo.attributes.position;
//       for (let i = 0; i < pos.count; i++) {
//         let x = pos.getX(i);
//         let y = pos.getY(i);
//         let z = pos.getZ(i);
        
//         // Creases and indentation
//         const angle = Math.atan2(z, x);
//         const crease = Math.sin(angle * 5) * 0.025;
//         const topIndent = y > 0.7 ? (y - 0.7) * 0.22 : 0;
//         const botIndent = y < -0.7 ? (-y - 0.7) * 0.26 : 0;
//         const scale = 1 - topIndent - botIndent - crease;
//         pos.setXYZ(i, x * scale, y * (1 - topIndent * 0.08), z * scale);
//       }
//       deformGeometry(bodyGeo, 0.02, 3.0);

//       const appleMat = new THREE.MeshPhysicalMaterial({
//         map: diffuseTex,
//         bumpMap: bumpTex,
//         bumpScale: 0.006,
//         roughness: 0.2,
//         metalness: 0.01,
//         clearcoat: 1.0,
//         clearcoatRoughness: 0.12,
//       });

//       const appleMesh = new THREE.Mesh(bodyGeo, appleMat);
//       appleMesh.castShadow = true;
//       appleMesh.receiveShadow = true;
//       modelGroup.add(appleMesh);

//       // Wood stem
//       const stemPoints = [
//         new THREE.Vector3(0, 0.9, 0),
//         new THREE.Vector3(0.03, 1.05, 0.02),
//         new THREE.Vector3(0.1, 1.2, 0.06),
//       ];
//       const stemCurve = new THREE.CatmullRomCurve3(stemPoints);
//       const stemGeo = new THREE.TubeGeometry(stemCurve, 10, 0.04, 8, false);
//       const stemMat = new THREE.MeshPhysicalMaterial({ color: '#422c1e', roughness: 0.9 });
//       const stem = new THREE.Mesh(stemGeo, stemMat);
//       stem.castShadow = true;
//       modelGroup.add(stem);

//       // Leaf
//       const leafShape = new THREE.Shape();
//       leafShape.moveTo(0, 0);
//       leafShape.quadraticCurveTo(0.2, 0.28, 0.06, 0.58);
//       leafShape.quadraticCurveTo(-0.16, 0.32, 0, 0);
//       const leafGeo = new THREE.ExtrudeGeometry(leafShape, { depth: 0.01, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.005, bevelThickness: 0.005 });
//       const leafDiffuse = makeCanvasTexture((ctx, w, h) => {
//         ctx.fillStyle = '#2e7d32';
//         ctx.fillRect(0, 0, w, h);
//         ctx.strokeStyle = '#81c784';
//         ctx.lineWidth = 4;
//         ctx.beginPath(); ctx.moveTo(w / 2, h); ctx.lineTo(w / 2, 0); ctx.stroke();
//         ctx.lineWidth = 1.8;
//         for (let y = h - 40; y > 20; y -= 40) {
//           ctx.beginPath(); ctx.moveTo(w / 2, y); ctx.lineTo(w * 0.15, y - 30); ctx.stroke();
//           ctx.beginPath(); ctx.moveTo(w / 2, y); ctx.lineTo(w * 0.85, y - 30); ctx.stroke();
//         }
//       }, 256, 256);
//       const leafMat = new THREE.MeshPhysicalMaterial({ map: leafDiffuse, roughness: 0.45, side: THREE.DoubleSide });
//       const leaf = new THREE.Mesh(leafGeo, leafMat);
//       leaf.position.set(0.06, 1.13, 0.03);
//       leaf.rotation.set(0.5, 0.6, -0.9);
//       leaf.scale.set(1.4, 1.4, 1.4);
//       leaf.castShadow = true;
//       modelGroup.add(leaf);
//     };

//     // ── 2. ORANGE ─────────────────────────────────────────────────────────────
//     const createOrange = () => {
//       const diffuseTex = makeCanvasTexture((ctx, w, h) => {
//         ctx.fillStyle = '#fb8c00';
//         ctx.fillRect(0, 0, w, h);
        
//         ctx.globalAlpha = 0.2;
//         for (let i = 0; i < 20; i++) {
//           ctx.fillStyle = Math.random() > 0.5 ? '#ffa726' : '#e65100';
//           ctx.beginPath();
//           ctx.arc(Math.random() * w, Math.random() * h, 70 + Math.random() * 80, 0, Math.PI * 2);
//           ctx.fill();
//         }
        
//         ctx.globalAlpha = 0.65;
//         const g = ctx.createRadialGradient(w/2, 0, 0, w/2, 0, 35);
//         g.addColorStop(0, '#545524');
//         g.addColorStop(1, 'transparent');
//         ctx.fillStyle = g;
//         ctx.fillRect(0, 0, w, h);
//       });

//       const bumpTex = makeCanvasTexture((ctx, w, h) => {
//         ctx.fillStyle = '#808080';
//         ctx.fillRect(0, 0, w, h);
        
//         ctx.globalAlpha = 0.55;
//         for (let i = 0; i < 7000; i++) {
//           const x = Math.random() * w;
//           const y = Math.random() * h;
//           const r = 0.6 + Math.random() * 1.4;
//           ctx.fillStyle = Math.random() > 0.45 ? '#555555' : '#b5b5b5';
//           ctx.beginPath();
//           ctx.arc(x, y, r, 0, Math.PI * 2);
//           ctx.fill();
//         }
//       });

//       const orangeGeo = new THREE.SphereGeometry(1.2, 64, 64);
//       const pos = orangeGeo.attributes.position;
//       for (let i = 0; i < pos.count; i++) {
//         let x = pos.getX(i);
//         let y = pos.getY(i);
//         let z = pos.getZ(i);
//         pos.setXYZ(i, x * 1.04, y * 0.96, z * 1.04);
//       }
//       deformGeometry(orangeGeo, 0.016, 4.0);

//       const orangeMat = new THREE.MeshPhysicalMaterial({
//         map: diffuseTex,
//         bumpMap: bumpTex,
//         bumpScale: 0.012,
//         roughness: 0.68,
//         clearcoat: 0.2,
//         clearcoatRoughness: 0.4,
//       });

//       const orangeMesh = new THREE.Mesh(orangeGeo, orangeMat);
//       orangeMesh.castShadow = true;
//       orangeMesh.receiveShadow = true;
//       modelGroup.add(orangeMesh);

//       // Stem
//       const stemGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.12, 8);
//       const stemMat = new THREE.MeshPhysicalMaterial({ color: '#3d2b1f', roughness: 0.95 });
//       const stem = new THREE.Mesh(stemGeo, stemMat);
//       stem.position.set(0, 1.13, 0);
//       modelGroup.add(stem);

//       // Calyx leaves
//       const calyxMat = new THREE.MeshPhysicalMaterial({ color: '#2b541a', roughness: 0.8 });
//       for (let i = 0; i < 5; i++) {
//         const angle = (i / 5) * Math.PI * 2;
//         const leafShape = new THREE.Shape();
//         leafShape.moveTo(0, 0);
//         leafShape.quadraticCurveTo(0.04, 0.06, 0.02, 0.12);
//         leafShape.quadraticCurveTo(-0.04, 0.08, 0, 0);
//         const lGeo = new THREE.ShapeGeometry(leafShape);
//         const lMesh = new THREE.Mesh(lGeo, calyxMat);
//         lMesh.position.set(Math.cos(angle) * 0.04, 1.12, Math.sin(angle) * 0.04);
//         lMesh.rotation.y = angle;
//         lMesh.rotation.x = -0.4;
//         modelGroup.add(lMesh);
//       }
//     };

//     // ── 3. CARROT ─────────────────────────────────────────────────────────────
//     const createCarrot = () => {
//       const diffuseTex = makeCanvasTexture((ctx, w, h) => {
//         ctx.fillStyle = '#ff7011';
//         ctx.fillRect(0, 0, w, h);
        
//         ctx.globalAlpha = 0.2;
//         ctx.fillStyle = '#ffab00';
//         ctx.fillRect(0, 0, w, h);
        
//         // Soil residue top
//         ctx.globalAlpha = 0.55;
//         const topGrad = ctx.createLinearGradient(0, 0, 0, h * 0.16);
//         topGrad.addColorStop(0, '#3e2723');
//         topGrad.addColorStop(1, 'transparent');
//         ctx.fillStyle = topGrad;
//         ctx.fillRect(0, 0, w, h);

//         // Ring dirt marks
//         ctx.globalAlpha = 0.4;
//         ctx.strokeStyle = '#4e342e';
//         ctx.lineWidth = 3.5;
//         for (let y = 30; y < h; y += 45) {
//           ctx.beginPath();
//           const offset = Math.sin(y) * 6;
//           ctx.moveTo(0, y + offset);
//           ctx.lineTo(w, y + offset);
//           ctx.stroke();
//         }
//       });

//       const bumpTex = makeCanvasTexture((ctx, w, h) => {
//         ctx.fillStyle = '#808080';
//         ctx.fillRect(0, 0, w, h);
        
//         ctx.globalAlpha = 0.65;
//         ctx.strokeStyle = '#454545';
//         ctx.lineWidth = 4;
//         for (let y = 30; y < h; y += 45) {
//           ctx.beginPath();
//           const offset = Math.sin(y) * 6;
//           ctx.moveTo(0, y + offset);
//           ctx.lineTo(w, y + offset);
//           ctx.stroke();
//         }
        
//         ctx.globalAlpha = 0.35;
//         ctx.fillStyle = '#353535';
//         for (let i = 0; i < 300; i++) {
//           ctx.beginPath();
//           ctx.arc(Math.random() * w, Math.random() * h, 1.2, 0, Math.PI * 2);
//           ctx.fill();
//         }
//       });

//       const carrotGeo = new THREE.CylinderGeometry(0.5, 0.05, 2.5, 32, 16);
//       carrotGeo.translate(0, -1.25, 0);
      
//       const pos = carrotGeo.attributes.position;
//       for (let i = 0; i < pos.count; i++) {
//         let x = pos.getX(i);
//         let y = pos.getY(i);
//         let z = pos.getZ(i);
        
//         const bendX = Math.sin((y + 1.25) * 1.5) * 0.12;
//         const bendZ = Math.cos((y + 1.25) * 1.2) * 0.08;
//         const ridge = Math.sin(y * 8.0) * 0.02;
//         pos.setXYZ(i, x * (1 + ridge) + bendX, y, z * (1 + ridge) + bendZ);
//       }
//       carrotGeo.computeVertexNormals();

//       const carrotMat = new THREE.MeshPhysicalMaterial({
//         map: diffuseTex,
//         bumpMap: bumpTex,
//         bumpScale: 0.024,
//         roughness: 0.78,
//       });
//       const carrotMesh = new THREE.Mesh(carrotGeo, carrotMat);
//       carrotMesh.castShadow = true;
//       carrotMesh.receiveShadow = true;
//       modelGroup.add(carrotMesh);

//       // Stems and leaves
//       const leafColors = ['#1b5e20', '#2e7d32', '#388e3c', '#4caf50'];
//       for (let i = 0; i < 9; i++) {
//         const angle = (i / 9) * Math.PI * 2 + Math.random() * 0.25;
//         const length = 1.0 + Math.random() * 0.5;
        
//         const startX = Math.cos(angle) * 0.15;
//         const startZ = Math.sin(angle) * 0.15;
//         const curvePoints = [
//           new THREE.Vector3(startX, -0.05, startZ),
//           new THREE.Vector3(startX * 1.4, 0.3, startZ * 1.4),
//           new THREE.Vector3(Math.cos(angle) * length * 0.6, length * 0.65, Math.sin(angle) * length * 0.6),
//           new THREE.Vector3(Math.cos(angle) * length, length, Math.sin(angle) * length),
//         ];
//         const stemCurve = new THREE.CatmullRomCurve3(curvePoints);
//         const stemGeo = new THREE.TubeGeometry(stemCurve, 10, 0.018, 5, false);
//         const stemMat = new THREE.MeshPhysicalMaterial({
//           color: leafColors[i % leafColors.length],
//           roughness: 0.85,
//         });
//         const stem = new THREE.Mesh(stemGeo, stemMat);
//         stem.castShadow = true;
//         modelGroup.add(stem);
        
//         // Leaflets
//         for (let j = 5; j <= 10; j++) {
//           const pt = stemCurve.getPoint(j / 10);
//           const leafletShape = new THREE.Shape();
//           leafletShape.moveTo(0, 0);
//           leafletShape.quadraticCurveTo(0.1, 0.1, 0.07, 0.22);
//           leafletShape.quadraticCurveTo(-0.1, 0.1, 0, 0);
//           const leafletGeo = new THREE.ShapeGeometry(leafletShape);
//           const leafL = new THREE.Mesh(leafletGeo, stemMat);
//           leafL.position.copy(pt);
//           leafL.scale.set(0.75, 0.75, 0.75);
//           leafL.rotation.set(Math.random() * 0.4, angle, Math.random() * 0.4);
//           modelGroup.add(leafL);
//         }
//       }
//     };

//     // ── 4. BROCCOLI ───────────────────────────────────────────────────────────
//     const createBroccoli = () => {
//       const stemGeo = new THREE.CylinderGeometry(0.28, 0.42, 1.2, 16, 8);
//       stemGeo.translate(0, -0.6, 0);
      
//       const stemPos = stemGeo.attributes.position;
//       for (let i = 0; i < stemPos.count; i++) {
//         const x = stemPos.getX(i);
//         const y = stemPos.getY(i);
//         const z = stemPos.getZ(i);
//         const bump = Math.sin(y * 6.0) * 0.03;
//         const curve = (y + 1.2) * (y + 1.2) * 0.03;
//         stemPos.setXYZ(i, x * (1 + bump) + curve, y, z * (1 + bump));
//       }
//       stemGeo.computeVertexNormals();

//       const stemTex = makeCanvasTexture((ctx, w, h) => {
//         const grad = ctx.createLinearGradient(0, h, 0, 0);
//         grad.addColorStop(0, '#e2f1d5');
//         grad.addColorStop(0.3, '#bfe29b');
//         grad.addColorStop(1.0, '#558b2f');
//         ctx.fillStyle = grad;
//         ctx.fillRect(0, 0, w, h);
//       });

//       const stemMat = new THREE.MeshPhysicalMaterial({
//         map: stemTex,
//         roughness: 0.85,
//         bumpMap: makeCanvasTexture((ctx, w, h) => {
//           ctx.fillStyle = '#808080';
//           ctx.fillRect(0, 0, w, h);
//           ctx.strokeStyle = '#606060';
//           ctx.lineWidth = 1.5;
//           for (let x = 0; x < w; x += 12) {
//             ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (Math.random() - 0.5) * 8, h); ctx.stroke();
//           }
//         }),
//         bumpScale: 0.015,
//       });

//       const stemMesh = new THREE.Mesh(stemGeo, stemMat);
//       stemMesh.castShadow = true;
//       stemMesh.receiveShadow = true;
//       modelGroup.add(stemMesh);

//       // Floret bud bumps
//       const floretBump = makeCanvasTexture((ctx, w, h) => {
//         ctx.fillStyle = '#808080';
//         ctx.fillRect(0, 0, w, h);
        
//         ctx.fillStyle = '#303030';
//         ctx.globalAlpha = 0.6;
//         for (let i = 0; i < 12000; i++) {
//           const rx = Math.random() * w;
//           const ry = Math.random() * h;
//           ctx.beginPath(); ctx.arc(rx, ry, 1 + Math.random() * 1.5, 0, Math.PI * 2); ctx.fill();
//         }
//       }, 512, 512);

//       const darkGreen = new THREE.MeshPhysicalMaterial({
//         color: '#1a541d',
//         roughness: 0.98,
//         bumpMap: floretBump,
//         bumpScale: 0.03,
//         sheen: 0.65,
//         sheenColor: new THREE.Color('#2d5e20'),
//       });

//       const midGreen = new THREE.MeshPhysicalMaterial({
//         color: '#2b7530',
//         roughness: 0.98,
//         bumpMap: floretBump,
//         bumpScale: 0.03,
//         sheen: 0.65,
//         sheenColor: new THREE.Color('#4e892c'),
//       });

//       const lightGreen = new THREE.MeshPhysicalMaterial({
//         color: '#388e3c',
//         roughness: 0.98,
//         bumpMap: floretBump,
//         bumpScale: 0.03,
//         sheen: 0.65,
//         sheenColor: new THREE.Color('#689f38'),
//       });

//       const floretData = [
//         [0, 0.1, 0, 0.85, darkGreen],
//         [0.42, 0.02, 0.22, 0.68, midGreen],
//         [-0.42, 0.02, -0.22, 0.68, midGreen],
//         [0.28, 0.02, -0.36, 0.65, darkGreen],
//         [-0.28, 0.02, 0.36, 0.65, darkGreen],
//         [0, 0.44, 0.08, 0.58, lightGreen],
//         [0.16, 0.36, -0.16, 0.52, midGreen],
//         [-0.16, 0.36, 0.16, 0.52, midGreen],
//         [0.48, 0.08, -0.05, 0.44, lightGreen],
//         [-0.48, 0.08, 0.05, 0.44, lightGreen],
//       ];

//       floretData.forEach(([x, y, z, s, mat]) => {
//         const fGeo = new THREE.IcosahedronGeometry(0.65, 2);
//         const pos = fGeo.attributes.position;
//         for (let i = 0; i < pos.count; i++) {
//           const px = pos.getX(i);
//           const py = pos.getY(i);
//           const pz = pos.getZ(i);
//           const noise = Math.sin(px * 3.5) * Math.cos(py * 3.5) * Math.sin(pz * 3.5);
//           const scale = 1.0 + noise * 0.07;
//           pos.setXYZ(i, px * scale, py * scale, pz * scale);
//         }
//         fGeo.computeVertexNormals();

//         const fMesh = new THREE.Mesh(fGeo, mat);
//         fMesh.position.set(x, y, z);
//         fMesh.scale.setScalar(s);
//         fMesh.castShadow = true;
//         fMesh.receiveShadow = true;
//         modelGroup.add(fMesh);
//       });

//       // Branch connects
//       floretData.forEach(([x, y, z]) => {
//         if (x === 0 && y === 0.1 && z === 0) return;
//         const curvePoints = [
//           new THREE.Vector3(0, -0.3, 0),
//           new THREE.Vector3(x * 0.4, y * 0.3, z * 0.4),
//           new THREE.Vector3(x * 0.88, y * 0.88, z * 0.88),
//         ];
//         const branchCurve = new THREE.CatmullRomCurve3(curvePoints);
//         const branchGeo = new THREE.TubeGeometry(branchCurve, 6, 0.08, 6, false);
//         const branchMesh = new THREE.Mesh(branchGeo, stemMat);
//         modelGroup.add(branchMesh);
//       });
//     };

//     // ── 5. SALMON ─────────────────────────────────────────────────────────────
//     const createSalmon = () => {
//       const topTex = makeCanvasTexture((ctx, w, h) => {
//         ctx.fillStyle = '#ff6c3e';
//         ctx.fillRect(0, 0, w, h);
        
//         ctx.globalAlpha = 0.25;
//         for (let i = 0; i < 8; i++) {
//           ctx.fillStyle = '#d83a15';
//           ctx.beginPath(); ctx.arc(Math.random()*w, Math.random()*h, 90, 0, Math.PI*2); ctx.fill();
//         }

//         // Marbling
//         ctx.globalAlpha = 0.85;
//         ctx.strokeStyle = '#fffaf0';
//         ctx.lineCap = 'round';
//         for (let i = 0; i < 15; i++) {
//           const x = -30 + (i / 13) * (w + 60);
//           ctx.lineWidth = 3 + Math.random() * 3.5;
//           ctx.beginPath();
//           ctx.moveTo(x, 0);
//           ctx.bezierCurveTo(x + 25, h * 0.3, x - 25, h * 0.7, x + 8, h);
//           ctx.stroke();
//         }
        
//         ctx.globalAlpha = 0.35;
//         ctx.lineWidth = 1.0;
//         for (let i = 0; i < 16; i++) {
//           const x = -20 + (i / 15) * (w + 40);
//           ctx.beginPath();
//           ctx.moveTo(x + 8, 0);
//           ctx.bezierCurveTo(x + 35, h * 0.35, x - 8, h * 0.65, x + 15, h);
//           ctx.stroke();
//         }
//       }, 512, 512);

//       const sideTex = makeCanvasTexture((ctx, w, h) => {
//         ctx.fillStyle = '#ff6c3e';
//         ctx.fillRect(0, 0, w, h);
        
//         ctx.globalAlpha = 0.6;
//         ctx.strokeStyle = '#fffaf0';
//         ctx.lineWidth = 2.0;
//         for (let y = 10; y < h - 20; y += 18) {
//           ctx.beginPath();
//           ctx.moveTo(0, y);
//           ctx.bezierCurveTo(w * 0.25, y - 3, w * 0.75, y + 5, w, y);
//           ctx.stroke();
//         }

//         // Skin band
//         ctx.globalAlpha = 1.0;
//         ctx.fillStyle = '#37474f';
//         ctx.fillRect(0, h * 0.84, w, h * 0.16);
//         ctx.fillStyle = '#212121';
//         ctx.fillRect(0, h * 0.92, w, h * 0.08);
//       }, 512, 256);

//       const skinTex = makeCanvasTexture((ctx, w, h) => {
//         ctx.fillStyle = '#263238';
//         ctx.fillRect(0, 0, w, h);
        
//         ctx.globalAlpha = 0.2;
//         ctx.strokeStyle = '#b0bec5';
//         ctx.lineWidth = 1.8;
//         for (let x = 0; x < w; x += 15) {
//           ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 8, h); ctx.stroke();
//         }
//       }, 256, 256);

//       const topMat = new THREE.MeshPhysicalMaterial({
//         map: topTex,
//         roughness: 0.26,
//         transmission: 0.16,
//         thickness: 0.5,
//         clearcoat: 0.85,
//         clearcoatRoughness: 0.08,
//       });

//       const sideMat = new THREE.MeshPhysicalMaterial({
//         map: sideTex,
//         roughness: 0.32,
//         transmission: 0.12,
//         thickness: 0.4,
//         clearcoat: 0.65,
//         clearcoatRoughness: 0.12,
//       });

//       const skinMat = new THREE.MeshPhysicalMaterial({
//         map: skinTex,
//         roughness: 0.6,
//         metalness: 0.25,
//       });

//       const filletGeo = new THREE.BoxGeometry(2.6, 0.58, 1.36, 16, 4, 10);
      
//       const pos = filletGeo.attributes.position;
//       for (let i = 0; i < pos.count; i++) {
//         let x = pos.getX(i);
//         let y = pos.getY(i);
//         let z = pos.getZ(i);

//         const taperFactor = 1.0 + (x * 0.15);
//         const thicknessFactor = Math.cos(z * 1.0) * 0.95;
        
//         const curveY = y * thicknessFactor;
//         const curveZ = z * (1.0 - (y > 0 ? y * 0.15 : 0));
        
//         pos.setXYZ(i, x, curveY, curveZ * taperFactor);
//       }
//       deformGeometry(filletGeo, 0.015, 3.0);

//       const materials = [sideMat, sideMat, topMat, skinMat, sideMat, sideMat];
//       const fillet = new THREE.Mesh(filletGeo, materials);
//       fillet.castShadow = true;
//       fillet.receiveShadow = true;
//       fillet.rotation.y = 0.45;
//       modelGroup.add(fillet);
//     };

//     // ── 6. LOBSTER ────────────────────────────────────────────────────────────
//     const createLobster = () => {
//       const shellTex = makeCanvasTexture((ctx, w, h) => {
//         const grad = ctx.createLinearGradient(0, 0, w, h);
//         grad.addColorStop(0, '#e64a19');
//         grad.addColorStop(0.4, '#d84315');
//         grad.addColorStop(0.7, '#b72a08');
//         grad.addColorStop(1.0, '#751a04');
//         ctx.fillStyle = grad;
//         ctx.fillRect(0, 0, w, h);

//         ctx.globalAlpha = 0.35;
//         for (let i = 0; i < 40; i++) {
//           ctx.fillStyle = Math.random() > 0.5 ? '#fed777' : '#320a01';
//           ctx.beginPath(); ctx.arc(Math.random()*w, Math.random()*h, 7 + Math.random()*22, 0, Math.PI*2); ctx.fill();
//         }
        
//         ctx.globalAlpha = 0.2;
//         ctx.strokeStyle = '#ff9100';
//         ctx.lineWidth = 3;
//         for (let y = 40; y < h; y += 50) {
//           ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
//         }
//       }, 512, 512);

//       const shellBump = makeCanvasTexture((ctx, w, h) => {
//         ctx.fillStyle = '#808080';
//         ctx.fillRect(0, 0, w, h);
        
//         ctx.fillStyle = '#9e9e9e';
//         ctx.globalAlpha = 0.4;
//         for (let i = 0; i < 2000; i++) {
//           ctx.beginPath(); ctx.arc(Math.random()*w, Math.random()*h, 1.2 + Math.random()*2, 0, Math.PI * 2); ctx.fill();
//         }
//       }, 256, 256);

//       const shellMat = new THREE.MeshPhysicalMaterial({
//         map: shellTex,
//         bumpMap: shellBump,
//         bumpScale: 0.015,
//         roughness: 0.22,
//         clearcoat: 1.0,
//         clearcoatRoughness: 0.08,
//       });

//       const carapaceGeo = new THREE.SphereGeometry(0.48, 16, 16);
//       carapaceGeo.scale(1.0, 0.9, 1.45);
//       deformGeometry(carapaceGeo, 0.02, 5.0);
//       const carapace = new THREE.Mesh(carapaceGeo, shellMat);
//       carapace.position.set(0, 0.1, 0.2);
//       carapace.castShadow = true;
//       modelGroup.add(carapace);

//       let currentZ = -0.4;
//       for (let i = 0; i < 6; i++) {
//         const scale = 0.45 - i * 0.035;
//         const segGeo = new THREE.SphereGeometry(scale, 12, 12);
//         segGeo.scale(1.22, 0.8, 0.85);
//         deformGeometry(segGeo, 0.015, 6.0);
//         const seg = new THREE.Mesh(segGeo, shellMat);
//         seg.position.set(0, 0.06 - i * 0.03, currentZ);
//         seg.castShadow = true;
//         modelGroup.add(seg);
//         currentZ -= scale * 0.72;
//       }

//       const tFanGroup = new THREE.Group();
//       tFanGroup.position.set(0, -0.06, currentZ - 0.05);
//       for (let i = -2; i <= 2; i++) {
//         const fanGeo = new THREE.BoxGeometry(0.16, 0.03, 0.4);
//         const fan = new THREE.Mesh(fanGeo, shellMat);
//         fan.position.set(i * 0.12, 0, -0.1);
//         fan.rotation.y = i * 0.2;
//         fan.rotation.z = i * 0.12;
//         fan.castShadow = true;
//         tFanGroup.add(fan);
//       }
//       modelGroup.add(tFanGroup);

//       const rostrumGeo = new THREE.ConeGeometry(0.04, 0.35, 6);
//       rostrumGeo.rotateX(Math.PI / 2.3);
//       const rostrum = new THREE.Mesh(rostrumGeo, shellMat);
//       rostrum.position.set(0, 0.28, 0.95);
//       modelGroup.add(rostrum);

//       const makeClaw = (side) => {
//         const jointPoints = [
//           new THREE.Vector3(side * 0.3, 0.1, 0.4),
//           new THREE.Vector3(side * 0.52, 0.15, 0.65),
//           new THREE.Vector3(side * 0.62, 0.22, 0.9),
//         ];
//         const armCurve = new THREE.CatmullRomCurve3(jointPoints);
//         const armGeo = new THREE.TubeGeometry(armCurve, 6, 0.075, 8, false);
//         const armMesh = new THREE.Mesh(armGeo, shellMat);
//         armMesh.castShadow = true;
//         modelGroup.add(armMesh);

//         const clawGeo = new THREE.SphereGeometry(0.25, 12, 12);
//         clawGeo.scale(1.8, 1.1, 0.65);
//         deformGeometry(clawGeo, 0.02, 5.0);
//         const claw = new THREE.Mesh(clawGeo, shellMat);
//         claw.position.set(side * 0.72, 0.28, 1.15);
//         claw.rotation.set(0.1, side * 0.7, side * -0.2);
//         claw.castShadow = true;
//         modelGroup.add(claw);
        
//         const fGeo1 = new THREE.ConeGeometry(0.065, 0.3, 8);
//         fGeo1.rotateX(Math.PI / 1.7);
//         fGeo1.scale(1.2, 0.75, 1.0);
//         const finger1 = new THREE.Mesh(fGeo1, shellMat);
//         finger1.position.set(side * 0.85, 0.32, 1.34);
//         finger1.rotation.set(0.05, side * 0.4, side * -0.1);
//         modelGroup.add(finger1);

//         const fGeo2 = new THREE.ConeGeometry(0.05, 0.24, 8);
//         fGeo2.rotateX(Math.PI / 1.6);
//         fGeo2.scale(1.0, 0.75, 1.0);
//         const finger2 = new THREE.Mesh(fGeo2, shellMat);
//         finger2.position.set(side * 0.68, 0.3, 1.32);
//         finger2.rotation.set(0.05, side * 0.9, side * -0.15);
//         modelGroup.add(finger2);
//       };
//       makeClaw(1);
//       makeClaw(-1);

//       const legMat = new THREE.MeshPhysicalMaterial({ color: '#c33d1c', roughness: 0.6 });
//       for (let side = -1; side <= 1; side += 2) {
//         for (let i = 0; i < 4; i++) {
//           const zOffset = 0.2 - i * 0.22;
//           const legPoints = [
//             new THREE.Vector3(side * 0.2, 0.05, zOffset),
//             new THREE.Vector3(side * 0.62, -0.2, zOffset - 0.05),
//             new THREE.Vector3(side * 0.75, -0.62, zOffset - 0.12),
//           ];
//           const legCurve = new THREE.CatmullRomCurve3(legPoints);
//           const legGeo = new THREE.TubeGeometry(legCurve, 6, 0.024, 5, false);
//           const leg = new THREE.Mesh(legGeo, legMat);
//           modelGroup.add(leg);
//         }
//       }

//       const antMat = new THREE.MeshPhysicalMaterial({ color: '#a0280b', roughness: 0.9 });
//       for (let i = 0; i < 2; i++) {
//         const s = i === 0 ? 1 : -1;
//         const curve = new THREE.QuadraticBezierCurve3(
//           new THREE.Vector3(s * 0.12, 0.24, 0.88),
//           new THREE.Vector3(s * 0.85, 0.65, 1.8),
//           new THREE.Vector3(s * 1.5, 1.25, 2.8),
//         );
//         const antGeo = new THREE.TubeGeometry(curve, 20, 0.01, 4, false);
//         const ant = new THREE.Mesh(antGeo, antMat);
//         modelGroup.add(ant);
//       }

//       modelGroup.scale.setScalar(0.9);
//       modelGroup.position.set(0, 0.1, 0.1);
//     };

//     // ── 7. MANGO ──────────────────────────────────────────────────────────────
//     const createMango = () => {
//       const diffuseTex = makeCanvasTexture((ctx, w, h) => {
//         const grad = ctx.createLinearGradient(0, h, w, 0);
//         grad.addColorStop(0.0, '#93a115'); // green end
//         grad.addColorStop(0.35, '#ffca28'); // yellow
//         grad.addColorStop(0.7, '#ff8f00'); // orange
//         grad.addColorStop(1.0, '#e64a19'); // reddish blush sunside
//         ctx.fillStyle = grad;
//         ctx.fillRect(0, 0, w, h);
        
//         ctx.globalAlpha = 0.35;
//         ctx.fillStyle = '#ffecb3';
//         for (let i = 0; i < 500; i++) {
//           ctx.beginPath();
//           ctx.arc(Math.random() * w, Math.random() * h, 0.8 + Math.random() * 1.0, 0, Math.PI * 2);
//           ctx.fill();
//         }
//       }, 512, 512);

//       const mangoGeo = new THREE.SphereGeometry(1.0, 64, 64);
//       const pos = mangoGeo.attributes.position;
//       for (let i = 0; i < pos.count; i++) {
//         let x = pos.getX(i);
//         let y = pos.getY(i);
//         let z = pos.getZ(i);
        
//         const curve = y > 0 ? (1.0 - y * 0.18) : (1.0 + y * 0.08);
//         const beak = y < 0 ? (y * y * 0.16) : 0;
        
//         pos.setXYZ(i, (x + beak) * curve * 1.35, y * 1.15, z * curve * 0.95);
//       }
//       deformGeometry(mangoGeo, 0.015, 3.0);

//       const mangoMat = new THREE.MeshPhysicalMaterial({
//         map: diffuseTex,
//         roughness: 0.3,
//         clearcoat: 0.72,
//         clearcoatRoughness: 0.15,
//       });

//       const mangoMesh = new THREE.Mesh(mangoGeo, mangoMat);
//       mangoMesh.castShadow = true;
//       mangoMesh.receiveShadow = true;
//       modelGroup.add(mangoMesh);

//       // Stem
//       const stemGeo = new THREE.CylinderGeometry(0.024, 0.03, 0.14, 6);
//       const stemMat = new THREE.MeshPhysicalMaterial({ color: '#422a1a', roughness: 0.9 });
//       const stem = new THREE.Mesh(stemGeo, stemMat);
//       stem.position.set(-0.06, 1.12, 0);
//       modelGroup.add(stem);
//     };

//     // ── 8. STRAWBERRY ─────────────────────────────────────────────────────────
//     const createStrawberry = () => {
//       const diffuseTex = makeCanvasTexture((ctx, w, h) => {
//         ctx.fillStyle = '#d32f2f';
//         ctx.fillRect(0, 0, w, h);
        
//         ctx.globalAlpha = 0.2;
//         for (let i = 0; i < 8; i++) {
//           ctx.fillStyle = '#7a0004';
//           ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, 120, 0, Math.PI * 2); ctx.fill();
//         }
        
//         ctx.globalAlpha = 1.0;
//         for (let r = 24; r < h - 20; r += 36) {
//           const shift = (r % 72 === 0) ? 18 : 0;
//           for (let c = 12; c < w; c += 36) {
//             const x = c + shift;
//             const y = r;
//             ctx.fillStyle = '#7a0004';
//             ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
//             ctx.fillStyle = '#fdd835';
//             ctx.beginPath(); ctx.ellipse(x, y, 1.8, 3.2, 0.1, 0, Math.PI * 2); ctx.fill();
//           }
//         }
//       }, 512, 512);

//       const bumpTex = makeCanvasTexture((ctx, w, h) => {
//         ctx.fillStyle = '#808080';
//         ctx.fillRect(0, 0, w, h);
//         for (let r = 24; r < h - 20; r += 36) {
//           const shift = (r % 72 === 0) ? 18 : 0;
//           for (let c = 12; c < w; c += 36) {
//             const x = c + shift;
//             const y = r;
//             ctx.fillStyle = '#404040';
//             ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
//             ctx.fillStyle = '#c0c0c0';
//             ctx.beginPath(); ctx.ellipse(x, y, 1.8, 3.2, 0.1, 0, Math.PI * 2); ctx.fill();
//           }
//         }
//       }, 512, 512);

//       const berryGeo = new THREE.SphereGeometry(1.0, 64, 64);
//       const pos = berryGeo.attributes.position;
//       for (let i = 0; i < pos.count; i++) {
//         let x = pos.getX(i);
//         let y = pos.getY(i);
//         let z = pos.getZ(i);
        
//         let taper = 1.0;
//         if (y < 0) {
//           taper = 1.0 + y * 0.65;
//         } else {
//           taper = 1.0 - y * y * 0.12;
//         }
//         pos.setXYZ(i, x * taper * 1.05, y * 1.25, z * taper * 1.05);
//       }
//       deformGeometry(berryGeo, 0.012, 5.0);

//       const berryMat = new THREE.MeshPhysicalMaterial({
//         map: diffuseTex,
//         bumpMap: bumpTex,
//         bumpScale: 0.012,
//         roughness: 0.18,
//         clearcoat: 1.0,
//         clearcoatRoughness: 0.08,
//       });

//       const strawberry = new THREE.Mesh(berryGeo, berryMat);
//       strawberry.castShadow = true;
//       strawberry.receiveShadow = true;
//       modelGroup.add(strawberry);

//       // Calyx sepals
//       const leafMat = new THREE.MeshPhysicalMaterial({ color: '#2e7d32', roughness: 0.75, side: THREE.DoubleSide });
//       const calyxGroup = new THREE.Group();
//       calyxGroup.position.y = 1.22;
//       for (let i = 0; i < 8; i++) {
//         const angle = (i / 8) * Math.PI * 2;
//         const leafShape = new THREE.Shape();
//         leafShape.moveTo(0, 0);
//         leafShape.quadraticCurveTo(0.1, 0.15, 0.04, 0.42);
//         leafShape.quadraticCurveTo(-0.1, 0.2, 0, 0);
//         const leafGeo = new THREE.ShapeGeometry(leafShape);
//         const leaf = new THREE.Mesh(leafGeo, leafMat);
//         leaf.rotation.y = angle;
//         leaf.rotation.x = -1.1 + Math.random() * 0.15;
//         leaf.scale.set(1.1, 1.1, 1.1);
//         calyxGroup.add(leaf);
//       }
//       modelGroup.add(calyxGroup);

//       // Small stem
//       const stemGeo = new THREE.CylinderGeometry(0.025, 0.035, 0.35, 8);
//       const stemMat = new THREE.MeshPhysicalMaterial({ color: '#4caf50', roughness: 0.9 });
//       const stem = new THREE.Mesh(stemGeo, stemMat);
//       stem.position.set(0, 1.34, 0);
//       stem.rotation.z = -0.2;
//       modelGroup.add(stem);
//     };

//     // ── 9. MELON (DƯA LƯỚI) ───────────────────────────────────────────────────
//     const createMelon = () => {
//       const w = 512, h = 512;
      
//       let seed = 24680;
//       const pseudoRandom = () => {
//         const x = Math.sin(seed++) * 10000;
//         return x - Math.floor(x);
//       };

//       const drawNets = (ctx, isBump) => {
//         ctx.lineCap = 'round';
//         seed = 24680;
//         for (let i = 0; i < 80; i++) {
//           const x0 = pseudoRandom() * w;
//           const y0 = pseudoRandom() * h;
//           const x1 = pseudoRandom() * w;
//           const y1 = pseudoRandom() * h;
//           const cpx = pseudoRandom() * w;
//           const cpy = pseudoRandom() * h;

//           ctx.strokeStyle = isBump ? '#cccccc' : '#d8d3b7';
//           ctx.lineWidth = isBump ? 3.0 : 1.8;
//           ctx.beginPath();
//           ctx.moveTo(x0, y0);
//           ctx.quadraticCurveTo(cpx, cpy, x1, y1);
//           ctx.stroke();
//         }
//       };

//       const diffuseTex = makeCanvasTexture((ctx, w, h) => {
//         ctx.fillStyle = '#659730';
//         ctx.fillRect(0, 0, w, h);
        
//         ctx.globalAlpha = 0.25;
//         ctx.fillStyle = '#8bc34a';
//         for (let i = 0; i < 8; i++) {
//           ctx.beginPath(); ctx.arc(pseudoRandom()*w, pseudoRandom()*h, 100, 0, Math.PI*2); ctx.fill();
//         }
        
//         ctx.globalAlpha = 1.0;
//         drawNets(ctx, false);
//       }, w, h);

//       const bumpTex = makeCanvasTexture((ctx, w, h) => {
//         ctx.fillStyle = '#808080';
//         ctx.fillRect(0, 0, w, h);
//         drawNets(ctx, true);
//       }, w, h);

//       const melonGeo = new THREE.SphereGeometry(1.22, 64, 64);
//       deformGeometry(melonGeo, 0.015, 3.0);

//       const melonMat = new THREE.MeshPhysicalMaterial({
//         map: diffuseTex,
//         bumpMap: bumpTex,
//         bumpScale: 0.02,
//         roughness: 0.86,
//         clearcoat: 0.08,
//       });

//       const melonMesh = new THREE.Mesh(melonGeo, melonMat);
//       melonMesh.castShadow = true;
//       melonMesh.receiveShadow = true;
//       modelGroup.add(melonMesh);

//       // Curved stem
//       const stemPoints = [
//         new THREE.Vector3(0, 1.2, 0),
//         new THREE.Vector3(0.04, 1.34, -0.04),
//         new THREE.Vector3(0.16, 1.42, -0.08),
//       ];
//       const stemCurve = new THREE.CatmullRomCurve3(stemPoints);
//       const stemGeo = new THREE.TubeGeometry(stemCurve, 8, 0.05, 8, false);
//       const stemMat = new THREE.MeshPhysicalMaterial({ color: '#564936', roughness: 0.9 });
//       const stem = new THREE.Mesh(stemGeo, stemMat);
//       modelGroup.add(stem);
//     };

//     // ── 10. CHERRY TOMATO ─────────────────────────────────────────────────────
//     const createCherryTomato = () => {
//       const diffuseTex = makeCanvasTexture((ctx, w, h) => {
//         ctx.fillStyle = '#d32f2f';
//         ctx.fillRect(0, 0, w, h);
        
//         const g1 = ctx.createRadialGradient(w/2, h/2, 40, w/2, h/2, w/2);
//         g1.addColorStop(0, '#e53935');
//         g1.addColorStop(1, '#9e0000');
//         ctx.fillStyle = g1;
//         ctx.fillRect(0, 0, w, h);

//         ctx.globalAlpha = 0.7;
//         const g2 = ctx.createRadialGradient(w/2, 0, 0, w/2, 0, 65);
//         g2.addColorStop(0, '#afb42b');
//         g2.addColorStop(0.5, '#fbc02d');
//         g2.addColorStop(1, 'transparent');
//         ctx.fillStyle = g2;
//         ctx.fillRect(0, 0, w, h);
//       }, 256, 256);

//       const tomatoGeo = new THREE.SphereGeometry(1.0, 48, 48);
      
//       const tomatoMat = new THREE.MeshPhysicalMaterial({
//         map: diffuseTex,
//         roughness: 0.05,
//         transmission: 0.15,
//         thickness: 0.4,
//         clearcoat: 1.0,
//         clearcoatRoughness: 0.02,
//       });

//       const tomatoMesh = new THREE.Mesh(tomatoGeo, tomatoMat);
//       tomatoMesh.castShadow = true;
//       tomatoMesh.receiveShadow = true;
//       modelGroup.add(tomatoMesh);

//       // Calyx
//       const calyxMat = new THREE.MeshPhysicalMaterial({ color: '#2b752e', roughness: 0.85 });
//       const calyx = new THREE.Group();
//       calyx.position.y = 0.98;
      
//       for (let i = 0; i < 6; i++) {
//         const angle = (i / 6) * Math.PI * 2;
//         const sepalPoints = [
//           new THREE.Vector3(0, 0, 0),
//           new THREE.Vector3(Math.cos(angle) * 0.11, 0.04, Math.sin(angle) * 0.11),
//           new THREE.Vector3(Math.cos(angle) * 0.26, 0.16, Math.sin(angle) * 0.26),
//         ];
//         const sepalCurve = new THREE.CatmullRomCurve3(sepalPoints);
//         const sepalGeo = new THREE.TubeGeometry(sepalCurve, 6, 0.015, 4, false);
//         const sepal = new THREE.Mesh(sepalGeo, calyxMat);
//         calyx.add(sepal);
//       }
      
//       const stemGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.24, 6);
//       stemGeo.translate(0, 0.11, 0);
//       const stem = new THREE.Mesh(stemGeo, calyxMat);
//       stem.rotation.z = -0.28;
//       calyx.add(stem);

//       modelGroup.add(calyx);
//     };

//     // ── 11. SPINACH (CẢI BÓ XÔI) ──────────────────────────────────────────────
//     const createSpinach = () => {
//       const leafDiffuse = makeCanvasTexture((ctx, w, h) => {
//         ctx.fillStyle = '#18541c';
//         ctx.fillRect(0, 0, w, h);
        
//         ctx.globalAlpha = 0.25;
//         ctx.fillStyle = '#27702b';
//         ctx.fillRect(0, 0, w, h);

//         ctx.globalAlpha = 0.85;
//         ctx.strokeStyle = '#81c784';
//         ctx.lineWidth = 4;
        
//         ctx.beginPath(); ctx.moveTo(w/2, h); ctx.lineTo(w/2, 0); ctx.stroke();

//         ctx.lineWidth = 1.8;
//         for (let y = h - 60; y > 30; y -= 50) {
//           ctx.beginPath(); ctx.moveTo(w/2, y); ctx.lineTo(w * 0.16, y - 42); ctx.stroke();
//           ctx.beginPath(); ctx.moveTo(w/2, y); ctx.lineTo(w * 0.84, y - 42); ctx.stroke();
//         }
//       }, 512, 512);

//       const leafMat = new THREE.MeshPhysicalMaterial({
//         map: leafDiffuse,
//         roughness: 0.52,
//         clearcoat: 0.15,
//         transmission: 0.12,
//         thickness: 0.04,
//         side: THREE.DoubleSide,
//       });

//       const stemMat = new THREE.MeshPhysicalMaterial({ color: '#558b2f', roughness: 0.85 });

//       for (let i = 0; i < 6; i++) {
//         const leafGroup = new THREE.Group();
//         const angle = (i / 6) * Math.PI * 2;
//         const tilt = 0.35 + Math.random() * 0.25;
        
//         const leafGeo = new THREE.PlaneGeometry(0.7, 1.25, 10, 16);
//         leafGeo.translate(0, 0.62, 0);
        
//         const pos = leafGeo.attributes.position;
//         for (let j = 0; j < pos.count; j++) {
//           const px = pos.getX(j);
//           const py = pos.getY(j);
//           const ruffle = Math.sin(py * 4.5) * Math.cos(px * 3.5) * 0.07;
//           const curve = -py * py * 0.05;
//           const widthScale = py < 0.25 ? (py / 0.25) : (1.0 - (py > 0.9 ? (py - 0.9) * 2.5 : 0));
//           pos.setXYZ(j, px * Math.max(0.1, widthScale), py, ruffle + curve);
//         }
//         leafGeo.computeVertexNormals();

//         const leafMesh = new THREE.Mesh(leafGeo, leafMat);
//         leafMesh.castShadow = true;
//         leafMesh.receiveShadow = true;
//         leafGroup.add(leafMesh);

//         const stemPoints = [
//           new THREE.Vector3(0, -0.35, 0),
//           new THREE.Vector3(0, 0.0, 0),
//           new THREE.Vector3(0, 0.28, -0.02),
//         ];
//         const stemCurve = new THREE.CatmullRomCurve3(stemPoints);
//         const stemGeo = new THREE.TubeGeometry(stemCurve, 6, 0.024, 6, false);
//         const stem = new THREE.Mesh(stemGeo, stemMat);
//         stem.castShadow = true;
//         leafGroup.add(stem);

//         leafGroup.rotation.y = angle;
//         leafGroup.rotation.x = tilt;
//         leafGroup.rotation.z = (Math.random() - 0.5) * 0.15;
//         leafGroup.position.set(Math.cos(angle) * 0.05, -0.2, Math.sin(angle) * 0.05);
        
//         modelGroup.add(leafGroup);
//       }
//     };

//     // ── 12. SWEET CORN (BẮP NGỌT) ─────────────────────────────────────────────
//     const createSweetCorn = () => {
//       const cob = new THREE.Group();

//       const coreGeo = new THREE.CylinderGeometry(0.3, 0.38, 1.8, 16);
//       const coreMat = new THREE.MeshPhysicalMaterial({ color: '#fff9c4', roughness: 0.9 });
//       const core = new THREE.Mesh(coreGeo, coreMat);
//       cob.add(core);

//       const kernelMat1 = new THREE.MeshPhysicalMaterial({ color: '#ffeb3b', roughness: 0.25, clearcoat: 0.35, clearcoatRoughness: 0.2 });
//       const kernelMat2 = new THREE.MeshPhysicalMaterial({ color: '#fdd835', roughness: 0.25, clearcoat: 0.35, clearcoatRoughness: 0.2 });
//       const kernelMat3 = new THREE.MeshPhysicalMaterial({ color: '#ffee58', roughness: 0.25, clearcoat: 0.35, clearcoatRoughness: 0.2 });
//       const kernelMats = [kernelMat1, kernelMat2, kernelMat3];

//       const rows = 15;
//       const cols = 14;
//       for (let r = 0; r < rows; r++) {
//         const y = -0.8 + (r / (rows - 1)) * 1.6;
//         const taper = r > 11 ? (1.0 - (r - 11) * 0.18) : 1.0;
//         const radius = 0.35 * taper;
        
//         for (let c = 0; c < cols; c++) {
//           const angle = (c / cols) * Math.PI * 2 + (r % 2) * (Math.PI / cols);
//           const kGeo = new THREE.BoxGeometry(0.12, 0.075, 0.14);
          
//           const mat = kernelMats[(r + c) % kernelMats.length];
//           const kMesh = new THREE.Mesh(kGeo, mat);
          
//           kMesh.position.set(Math.cos(angle) * (radius + 0.04), y, Math.sin(angle) * (radius + 0.04));
//           kMesh.rotation.y = angle;
//           kMesh.rotation.x = (Math.random() - 0.5) * 0.15;
//           kMesh.castShadow = true;
          
//           cob.add(kMesh);
//         }
//       }

//       // Husks
//       const huskMat = new THREE.MeshPhysicalMaterial({ color: '#9ccc65', roughness: 0.8, side: THREE.DoubleSide });
//       for (let i = 0; i < 4; i++) {
//         const angle = (i / 4) * Math.PI * 2 + 0.3;
//         const huskGeo = new THREE.PlaneGeometry(0.7, 1.8, 8, 8);
//         huskGeo.translate(0, 0.9, 0);
        
//         const pos = huskGeo.attributes.position;
//         for (let j = 0; j < pos.count; j++) {
//           const px = pos.getX(j);
//           const py = pos.getY(j);
//           const wrap = Math.sin(px * 1.5) * 0.12;
//           const flare = py > 1.0 ? (py - 1.0) * 0.3 * Math.cos(angle) : 0;
//           pos.setXYZ(j, px * 0.9, py - 0.9, wrap + flare);
//         }
//         huskGeo.computeVertexNormals();

//         const huskMesh = new THREE.Mesh(huskGeo, huskMat);
//         huskMesh.position.set(Math.cos(angle) * 0.2, -0.2, Math.sin(angle) * 0.2);
//         huskMesh.rotation.y = angle;
//         huskMesh.rotation.x = 0.18;
//         huskMesh.castShadow = true;
//         huskMesh.receiveShadow = true;
//         cob.add(huskMesh);
//       }

//       // Silk (Râu ngô)
//       const silkMat = new THREE.MeshPhysicalMaterial({ color: '#bcaaa4', roughness: 0.9 });
//       for (let i = 0; i < 15; i++) {
//         const curve = new THREE.QuadraticBezierCurve3(
//           new THREE.Vector3(0, 0.9, 0),
//           new THREE.Vector3((Math.random() - 0.5) * 0.18, 1.12, (Math.random() - 0.5) * 0.18),
//           new THREE.Vector3((Math.random() - 0.5) * 0.45, 1.32, (Math.random() - 0.5) * 0.45),
//         );
//         const silkGeo = new THREE.TubeGeometry(curve, 6, 0.006, 3, false);
//         const silk = new THREE.Mesh(silkGeo, silkMat);
//         cob.add(silk);
//       }

//       modelGroup.add(cob);
//     };

//     // ── 13. TUNA (CÁ NGỪ SAKU) ────────────────────────────────────────────────
//     const createTuna = () => {
//       const diffuseTex = makeCanvasTexture((ctx, w, h) => {
//         ctx.fillStyle = '#b71c1c';
//         ctx.fillRect(0, 0, w, h);
        
//         ctx.globalAlpha = 0.2;
//         ctx.fillStyle = '#880e4f';
//         ctx.fillRect(0, 0, w, h);

//         ctx.globalAlpha = 0.38;
//         ctx.strokeStyle = '#ffcdd2';
//         ctx.lineWidth = 1.6;
//         for (let y = 10; y < h; y += 20) {
//           ctx.beginPath();
//           ctx.moveTo(0, y);
//           ctx.bezierCurveTo(w*0.3, y - 4, w*0.7, y + 4, w, y);
//           ctx.stroke();
//         }
//       }, 512, 256);

//       const tunaMat = new THREE.MeshPhysicalMaterial({
//         map: diffuseTex,
//         roughness: 0.25,
//         transmission: 0.18,
//         thickness: 0.6,
//         clearcoat: 0.9,
//         clearcoatRoughness: 0.08,
//       });

//       const tunaGeo = new THREE.BoxGeometry(2.4, 0.65, 1.1, 12, 4, 8);
//       const pos = tunaGeo.attributes.position;
//       for (let i = 0; i < pos.count; i++) {
//         let x = pos.getX(i);
//         let y = pos.getY(i);
//         let z = pos.getZ(i);
//         const curveX = x * (1.0 - y * y * 0.08);
//         const curveZ = z * (1.0 - y * y * 0.1);
//         pos.setXYZ(i, curveX, y, curveZ);
//       }
//       deformGeometry(tunaGeo, 0.012, 4.0);

//       const tunaMesh = new THREE.Mesh(tunaGeo, tunaMat);
//       tunaMesh.castShadow = true;
//       tunaMesh.receiveShadow = true;
//       tunaMesh.rotation.y = 0.35;
//       modelGroup.add(tunaMesh);
//     };

//     // ── 14. OCTOPUS (BẠCH TUỘC) ────────────────────────────────────────────────
//     const createOctopus = () => {
//       const points = [];
//       const numPoints = 24;
//       for (let i = 0; i < numPoints; i++) {
//         const t = i / (numPoints - 1);
//         const angle = t * Math.PI * 1.8;
//         const radius = 1.1 - t * 0.8;
//         points.push(new THREE.Vector3(
//           Math.cos(angle) * radius,
//           -0.5 + t * 1.0,
//           Math.sin(angle) * radius
//         ));
//       }
//       const tentacleCurve = new THREE.CatmullRomCurve3(points);
//       const tentacleGeo = new THREE.TubeGeometry(tentacleCurve, 64, 0.22, 12, false);
      
//       const pos = tentacleGeo.attributes.position;
//       for (let i = 0; i < pos.count; i++) {
//         const x = pos.getX(i);
//         const y = pos.getY(i);
//         const z = pos.getZ(i);
        
//         const sliceIdx = Math.floor(i / 13);
//         const t = sliceIdx / (64 + 1);
//         const taper = 1.0 - t * 0.88;
//         const curvePt = tentacleCurve.getPoint(t);
        
//         const dx = x - curvePt.x;
//         const dy = y - curvePt.y;
//         const dz = z - curvePt.z;
        
//         pos.setXYZ(i, curvePt.x + dx * taper, curvePt.y + dy * taper, curvePt.z * dz * taper);
//       }
//       deformGeometry(tentacleGeo, 0.015, 6.0);

//       const diffuseTex = makeCanvasTexture((ctx, w, h) => {
//         const grad = ctx.createLinearGradient(0, 0, w, h);
//         grad.addColorStop(0, '#880e4f');
//         grad.addColorStop(0.5, '#ad1457');
//         grad.addColorStop(1, '#ff80ab');
//         ctx.fillStyle = grad;
//         ctx.fillRect(0, 0, w, h);

//         ctx.globalAlpha = 0.4;
//         ctx.fillStyle = '#fce4ec';
//         for (let i = 0; i < 400; i++) {
//           ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 5, 0, Math.PI * 2); ctx.fill();
//         }
//       }, 512, 128);

//       const tentacleMat = new THREE.MeshPhysicalMaterial({
//         map: diffuseTex,
//         roughness: 0.15,
//         clearcoat: 1.0,
//         clearcoatRoughness: 0.04,
//         transmission: 0.1,
//         thickness: 0.3,
//       });

//       const tentacle = new THREE.Mesh(tentacleGeo, tentacleMat);
//       tentacle.castShadow = true;
//       tentacle.receiveShadow = true;
//       modelGroup.add(tentacle);

//       const suckerMat = new THREE.MeshPhysicalMaterial({
//         color: '#f8bbd0',
//         roughness: 0.4,
//         clearcoat: 0.3,
//       });

//       const numSuckers = 20;
//       for (let i = 0; i < numSuckers; i++) {
//         const t = (i / (numSuckers - 1)) * 0.9;
//         const pt = tentacleCurve.getPoint(t);
//         const angle = t * Math.PI * 1.8;
//         const inwardDir = new THREE.Vector3(-Math.cos(angle), -0.2, -Math.sin(angle)).normalize();
        
//         const size = 0.13 * (1.0 - t * 0.7);
//         const suckerGeo = new THREE.SphereGeometry(size, 8, 8);
//         suckerGeo.scale(1.2, 0.6, 1.2);
//         suckerGeo.translate(0, -size * 0.2, 0);

//         const suckerMesh = new THREE.Mesh(suckerGeo, suckerMat);
//         suckerMesh.position.copy(pt).addScaledVector(inwardDir, 0.12 * (1.0 - t * 0.8));
        
//         const up = new THREE.Vector3(0, 1, 0);
//         suckerMesh.quaternion.setFromUnitVectors(up, inwardDir);
//         suckerMesh.castShadow = true;
        
//         modelGroup.add(suckerMesh);
//       }
//     };

//     // ── DISPATCH & LOADING FLOW ───────────────────────────────────────────────
//     let isCancelled = false;

//     const runProceduralFallback = () => {
//       if (isCancelled) return;
//       modelGroup.clear();
      
//       switch (modelType) {
//         case 'apple':         createApple();        break;
//         case 'orange':        createOrange();       break;
//         case 'carrot':        createCarrot();       break;
//         case 'broccoli':      createBroccoli();     break;
//         case 'salmon':        createSalmon();       break;
//         case 'lobster':       createLobster();      break;
//         case 'mango':         createMango();        break;
//         case 'strawberry':    createStrawberry();   break;
//         case 'melon':         createMelon();        break;
//         case 'cherry_tomato': createCherryTomato(); break;
//         case 'spinach':       createSpinach();      break;
//         case 'sweet_corn':    createSweetCorn();    break;
//         case 'tuna':          createTuna();         break;
//         case 'octopus':       createOctopus();      break;
//         default: {
//           const boxGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
//           const boxMat = new THREE.MeshPhysicalMaterial({ color: '#2e7d32', roughness: 0.5 });
//           const box = new THREE.Mesh(boxGeo, boxMat);
//           box.castShadow = true;
//           modelGroup.add(box);
//         }
//       }
//       scene.add(modelGroup);
//       setLoading(false);
//     };

//     // Try loading Gaussian Splatting file from public/splats/
//     const splatUrl = `/splats/${modelType}.splat`;

//     fetch(splatUrl, { method: 'HEAD' })
//       .then((res) => {
//         if (isCancelled) return;
//         const contentType = res.headers.get('content-type');
//         const isHtml = contentType && contentType.includes('text/html');
//         if (res.ok && !isHtml) {
//           fetch(splatUrl)
//             .then((response) => {
//               if (!response.ok) throw new Error('Failed to download splat file');
//               return response.arrayBuffer();
//             })
//             .then((arrayBuffer) => {
//               if (isCancelled) return;
//               try {
//                 const splatData = parseSplat(arrayBuffer);
//                 const splatMesh = createSplatMesh(splatData);
//                 modelGroup.add(splatMesh);
//                 scene.add(modelGroup);
//                 setLoading(false);
//               } catch (parseErr) {
//                 console.warn('Error parsing splat file, falling back to procedural:', parseErr);
//                 runProceduralFallback();
//               }
//             })
//             .catch((err) => {
//               if (isCancelled) return;
//               console.warn('Error loading splat file, falling back to procedural:', err);
//               runProceduralFallback();
//             });
//         } else {
//           runProceduralFallback();
//         }
//       })
//       .catch((err) => {
//         if (isCancelled) return;
//         console.warn('Splat file check failed, falling back to procedural:', err);
//         runProceduralFallback();
//       });

//     // ── ANIMATION ─────────────────────────────────────────────────────────────
//     let rafId;
//     const startTime = performance.now();

//     const animate = () => {
//       rafId = requestAnimationFrame(animate);
//       controls.update();
//       const t = (performance.now() - startTime) / 1000;
//       if (autoRotate) modelGroup.rotation.y += 0.0035;
      
//       let baseY = 0.0;
//       if (modelType === 'carrot') baseY = 0.3;
//       else if (modelType === 'broccoli' || modelType === 'spinach' || modelType === 'sweet_corn') baseY = 0.15;
//       else if (modelType === 'octopus') baseY = 0.08;
      
//       modelGroup.position.y = baseY + Math.sin(t * 1.1) * 0.06;
//       renderer.render(scene, camera);
//     };
//     animate();

//     // ── RESIZE ────────────────────────────────────────────────────────────────
//     const handleResize = () => {
//       if (!containerRef.current) return;
//       const w = containerRef.current.clientWidth;
//       const h = containerRef.current.clientHeight;
//       camera.aspect = w / h;
//       camera.updateProjectionMatrix();
//       renderer.setSize(w, h);
//     };
//     window.addEventListener('resize', handleResize);

//     // ── CLEANUP ───────────────────────────────────────────────────────────────
//     return () => {
//       isCancelled = true;
//       window.removeEventListener('resize', handleResize);
//       cancelAnimationFrame(rafId);
//       controls.dispose();
//       renderer.dispose();
      
//       if (scene.environment) scene.environment.dispose();

//       modelGroup.traverse((obj) => {
//         if (!obj.isMesh && !obj.isPoints) return;
//         obj.geometry.dispose();
//         if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
//         else obj.material.dispose();
//       });
//       shadowPlaneGeo.dispose();
//       shadowPlaneMat.dispose();
//       discGeo.dispose();
//       discMat.dispose();
//     };
//   }, [modelType, autoRotate]);

//   return (
//     <div className="relative w-full h-full overflow-hidden select-none">
//       {loading && (
//         <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm z-10">
//           <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
//           <span className="mt-4 text-sm font-semibold text-white">Đang tải mô hình 3D...</span>
//         </div>
//       )}
//       <div ref={containerRef} className="w-full h-full" style={{ minHeight: '300px' }} />
//     </div>
//   );
// }
