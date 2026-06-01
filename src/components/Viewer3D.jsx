import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default function Viewer3D({ modelType, autoRotate = true }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    setLoading(true);

    const width = containerRef.current.clientWidth || 400;
    const height = containerRef.current.clientHeight || 400;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#111122');

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 2.2, 5.5);

    // Renderer - physically correct lighting
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2.0;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.target.set(0, 0, 0);

    // ── PROCEDURAL STUDIO ENVIRONMENT MAP ──────────────────────────────────────
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const envCanvas = document.createElement('canvas');
    envCanvas.width = 512;
    envCanvas.height = 256;
    const envCtx = envCanvas.getContext('2d');

    // Soft dark blue studio backdrop
    envCtx.fillStyle = '#06060c';
    envCtx.fillRect(0, 0, 512, 256);

    // Warm key light reflection
    let envGrad = envCtx.createRadialGradient(160, 80, 0, 160, 80, 140);
    envGrad.addColorStop(0, '#ffffff');
    envGrad.addColorStop(0.3, '#fff2e0');
    envGrad.addColorStop(1, 'transparent');
    envCtx.fillStyle = envGrad;
    envCtx.fillRect(0, 0, 512, 256);

    // Cool fill light reflection
    envGrad = envCtx.createRadialGradient(380, 120, 0, 380, 120, 180);
    envGrad.addColorStop(0, '#e3efff');
    envGrad.addColorStop(0.5, '#94b3ff');
    envGrad.addColorStop(1, 'transparent');
    envCtx.fillStyle = envGrad;
    envCtx.fillRect(0, 0, 512, 256);

    // Rim light reflection
    envGrad = envCtx.createRadialGradient(256, 180, 0, 256, 180, 80);
    envGrad.addColorStop(0, '#ffe8d6');
    envGrad.addColorStop(1, 'transparent');
    envCtx.fillStyle = envGrad;
    envCtx.fillRect(0, 0, 512, 256);

    const envTexture = new THREE.CanvasTexture(envCanvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;
    const envMap = pmremGenerator.fromEquirectangular(envTexture).texture;
    scene.environment = envMap;
    
    pmremGenerator.dispose();
    envTexture.dispose();

    // ── LIGHTING ──────────────────────────────────────────────────────────────
    // Hemisphere: soft ambient sky/ground fill
    const hemiLight = new THREE.HemisphereLight('#cbd8f5', '#241a15', 0.25);
    scene.add(hemiLight);

    // Key light (warm studio key)
    const keyLight = new THREE.DirectionalLight('#fffcf5', 2.0);
    keyLight.position.set(4, 7, 3.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.camera.left = -3;
    keyLight.shadow.camera.right = 3;
    keyLight.shadow.camera.top = 3;
    keyLight.shadow.camera.bottom = -3;
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.normalBias = 0.015;
    scene.add(keyLight);

    // Fill light (cool fill)
    const fillLight = new THREE.DirectionalLight('#dce6ff', 0.7);
    fillLight.position.set(-4, 2, -2);
    scene.add(fillLight);

    // Rim / Back light
    const rimLight = new THREE.DirectionalLight('#fff2db', 1.2);
    rimLight.position.set(0, 3.5, -5);
    scene.add(rimLight);

    // Under light to fill bottom shadows
    const underLight = new THREE.PointLight('#ffffff', 0.35, 8);
    underLight.position.set(0, -2, 2);
    scene.add(underLight);

    // ── GROUND PLANE ──────────────────────────────────────────────────────────
    const shadowPlaneGeo = new THREE.PlaneGeometry(12, 12);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.38 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.5;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Reflective disc under object
    const discGeo = new THREE.CircleGeometry(1.5, 64);
    const discMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.15,
      metalness: 0.0,
      transparent: true,
      opacity: 0.06,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = -1.49;
    scene.add(disc);

    // ── HELPERS ───────────────────────────────────────────────────────────────
    const makeCanvasTexture = (draw, w = 512, h = 512) => {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };

    // Organic deforming helper to make models look natural (imperfect)
    const deformGeometry = (geometry, amount = 0.05, frequency = 2.0) => {
      const position = geometry.attributes.position;
      const normal = geometry.attributes.normal;
      if (!normal) return;

      for (let i = 0; i < position.count; i++) {
        const x = position.getX(i);
        const y = position.getY(i);
        const z = position.getZ(i);

        // Simple 3D sine/cosine noise
        const noise = Math.sin(x * frequency) * Math.cos(y * frequency) * Math.sin(z * frequency) +
                      Math.sin(x * frequency * 2.2 + 1.1) * Math.cos(z * frequency * 1.9 + 0.4) * 0.5;

        const nx = normal.getX(i);
        const ny = normal.getY(i);
        const nz = normal.getZ(i);

        position.setXYZ(i, x + nx * noise * amount, y + ny * noise * amount, z + nz * noise * amount);
      }
      geometry.computeVertexNormals();
    };

    // ── MODEL GROUP ───────────────────────────────────────────────────────────
    const modelGroup = new THREE.Group();

    // ── 1. APPLE ──────────────────────────────────────────────────────────────
    const createApple = () => {
      const diffuseTex = makeCanvasTexture((ctx, w, h) => {
        // Base red-yellow gradient
        const grad = ctx.createLinearGradient(0, h, 0, 0);
        grad.addColorStop(0.0, '#cbd448'); // greenish-yellow base
        grad.addColorStop(0.18, '#ffd54f'); // golden yellow
        grad.addColorStop(0.35, '#e53935'); // rich red
        grad.addColorStop(1.0, '#b71c1c'); // deep red top
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Vertical streaks
        ctx.globalAlpha = 0.38;
        for (let i = 0; i < 40; i++) {
          const x = Math.random() * w;
          ctx.strokeStyle = Math.random() > 0.4 ? '#8b0000' : '#d32f2f';
          ctx.lineWidth = 1.2 + Math.random() * 3;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.bezierCurveTo(x + (Math.random() - 0.5) * 30, h * 0.3, x + (Math.random() - 0.5) * 30, h * 0.7, x + (Math.random() - 0.5) * 10, h);
          ctx.stroke();
        }

        // Natural spots
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = '#ffecb3';
        for (let i = 0; i < 700; i++) {
          ctx.beginPath();
          ctx.arc(Math.random() * w, Math.random() * h, 0.7 + Math.random() * 1.0, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      const bumpTex = makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, w, h);
        
        ctx.fillStyle = '#686868';
        ctx.globalAlpha = 0.25;
        for (let i = 0; i < 2000; i++) {
          ctx.beginPath();
          ctx.arc(Math.random() * w, Math.random() * h, 0.6 + Math.random() * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      const bodyGeo = new THREE.SphereGeometry(1.15, 64, 64);
      const pos = bodyGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);
        
        // Creases and indentation
        const angle = Math.atan2(z, x);
        const crease = Math.sin(angle * 5) * 0.025;
        const topIndent = y > 0.7 ? (y - 0.7) * 0.22 : 0;
        const botIndent = y < -0.7 ? (-y - 0.7) * 0.26 : 0;
        const scale = 1 - topIndent - botIndent - crease;
        pos.setXYZ(i, x * scale, y * (1 - topIndent * 0.08), z * scale);
      }
      deformGeometry(bodyGeo, 0.02, 3.0);

      const appleMat = new THREE.MeshPhysicalMaterial({
        map: diffuseTex,
        bumpMap: bumpTex,
        bumpScale: 0.006,
        roughness: 0.2,
        metalness: 0.01,
        clearcoat: 1.0,
        clearcoatRoughness: 0.12,
      });

      const appleMesh = new THREE.Mesh(bodyGeo, appleMat);
      appleMesh.castShadow = true;
      appleMesh.receiveShadow = true;
      modelGroup.add(appleMesh);

      // Wood stem
      const stemPoints = [
        new THREE.Vector3(0, 0.9, 0),
        new THREE.Vector3(0.03, 1.05, 0.02),
        new THREE.Vector3(0.1, 1.2, 0.06),
      ];
      const stemCurve = new THREE.CatmullRomCurve3(stemPoints);
      const stemGeo = new THREE.TubeGeometry(stemCurve, 10, 0.04, 8, false);
      const stemMat = new THREE.MeshPhysicalMaterial({ color: '#422c1e', roughness: 0.9 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.castShadow = true;
      modelGroup.add(stem);

      // Leaf
      const leafShape = new THREE.Shape();
      leafShape.moveTo(0, 0);
      leafShape.quadraticCurveTo(0.2, 0.28, 0.06, 0.58);
      leafShape.quadraticCurveTo(-0.16, 0.32, 0, 0);
      const leafGeo = new THREE.ExtrudeGeometry(leafShape, { depth: 0.01, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.005, bevelThickness: 0.005 });
      const leafDiffuse = makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#81c784';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(w / 2, h); ctx.lineTo(w / 2, 0); ctx.stroke();
        ctx.lineWidth = 1.8;
        for (let y = h - 40; y > 20; y -= 40) {
          ctx.beginPath(); ctx.moveTo(w / 2, y); ctx.lineTo(w * 0.15, y - 30); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(w / 2, y); ctx.lineTo(w * 0.85, y - 30); ctx.stroke();
        }
      }, 256, 256);
      const leafMat = new THREE.MeshPhysicalMaterial({ map: leafDiffuse, roughness: 0.45, side: THREE.DoubleSide });
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(0.06, 1.13, 0.03);
      leaf.rotation.set(0.5, 0.6, -0.9);
      leaf.scale.set(1.4, 1.4, 1.4);
      leaf.castShadow = true;
      modelGroup.add(leaf);
    };

    // ── 2. ORANGE ─────────────────────────────────────────────────────────────
    const createOrange = () => {
      const diffuseTex = makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#fb8c00';
        ctx.fillRect(0, 0, w, h);
        
        ctx.globalAlpha = 0.2;
        for (let i = 0; i < 20; i++) {
          ctx.fillStyle = Math.random() > 0.5 ? '#ffa726' : '#e65100';
          ctx.beginPath();
          ctx.arc(Math.random() * w, Math.random() * h, 70 + Math.random() * 80, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.globalAlpha = 0.65;
        const g = ctx.createRadialGradient(w/2, 0, 0, w/2, 0, 35);
        g.addColorStop(0, '#545524');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });

      const bumpTex = makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, w, h);
        
        ctx.globalAlpha = 0.55;
        for (let i = 0; i < 7000; i++) {
          const x = Math.random() * w;
          const y = Math.random() * h;
          const r = 0.6 + Math.random() * 1.4;
          ctx.fillStyle = Math.random() > 0.45 ? '#555555' : '#b5b5b5';
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      const orangeGeo = new THREE.SphereGeometry(1.2, 64, 64);
      const pos = orangeGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);
        pos.setXYZ(i, x * 1.04, y * 0.96, z * 1.04);
      }
      deformGeometry(orangeGeo, 0.016, 4.0);

      const orangeMat = new THREE.MeshPhysicalMaterial({
        map: diffuseTex,
        bumpMap: bumpTex,
        bumpScale: 0.012,
        roughness: 0.68,
        clearcoat: 0.2,
        clearcoatRoughness: 0.4,
      });

      const orangeMesh = new THREE.Mesh(orangeGeo, orangeMat);
      orangeMesh.castShadow = true;
      orangeMesh.receiveShadow = true;
      modelGroup.add(orangeMesh);

      // Stem
      const stemGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.12, 8);
      const stemMat = new THREE.MeshPhysicalMaterial({ color: '#3d2b1f', roughness: 0.95 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(0, 1.13, 0);
      modelGroup.add(stem);

      // Calyx leaves
      const calyxMat = new THREE.MeshPhysicalMaterial({ color: '#2b541a', roughness: 0.8 });
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const leafShape = new THREE.Shape();
        leafShape.moveTo(0, 0);
        leafShape.quadraticCurveTo(0.04, 0.06, 0.02, 0.12);
        leafShape.quadraticCurveTo(-0.04, 0.08, 0, 0);
        const lGeo = new THREE.ShapeGeometry(leafShape);
        const lMesh = new THREE.Mesh(lGeo, calyxMat);
        lMesh.position.set(Math.cos(angle) * 0.04, 1.12, Math.sin(angle) * 0.04);
        lMesh.rotation.y = angle;
        lMesh.rotation.x = -0.4;
        modelGroup.add(lMesh);
      }
    };

    // ── 3. CARROT ─────────────────────────────────────────────────────────────
    const createCarrot = () => {
      const diffuseTex = makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#ff7011';
        ctx.fillRect(0, 0, w, h);
        
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#ffab00';
        ctx.fillRect(0, 0, w, h);
        
        // Soil residue top
        ctx.globalAlpha = 0.55;
        const topGrad = ctx.createLinearGradient(0, 0, 0, h * 0.16);
        topGrad.addColorStop(0, '#3e2723');
        topGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, w, h);

        // Ring dirt marks
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = '#4e342e';
        ctx.lineWidth = 3.5;
        for (let y = 30; y < h; y += 45) {
          ctx.beginPath();
          const offset = Math.sin(y) * 6;
          ctx.moveTo(0, y + offset);
          ctx.lineTo(w, y + offset);
          ctx.stroke();
        }
      });

      const bumpTex = makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, w, h);
        
        ctx.globalAlpha = 0.65;
        ctx.strokeStyle = '#454545';
        ctx.lineWidth = 4;
        for (let y = 30; y < h; y += 45) {
          ctx.beginPath();
          const offset = Math.sin(y) * 6;
          ctx.moveTo(0, y + offset);
          ctx.lineTo(w, y + offset);
          ctx.stroke();
        }
        
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#353535';
        for (let i = 0; i < 300; i++) {
          ctx.beginPath();
          ctx.arc(Math.random() * w, Math.random() * h, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      const carrotGeo = new THREE.CylinderGeometry(0.5, 0.05, 2.5, 32, 16);
      carrotGeo.translate(0, -1.25, 0);
      
      const pos = carrotGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);
        
        const bendX = Math.sin((y + 1.25) * 1.5) * 0.12;
        const bendZ = Math.cos((y + 1.25) * 1.2) * 0.08;
        const ridge = Math.sin(y * 8.0) * 0.02;
        pos.setXYZ(i, x * (1 + ridge) + bendX, y, z * (1 + ridge) + bendZ);
      }
      carrotGeo.computeVertexNormals();

      const carrotMat = new THREE.MeshPhysicalMaterial({
        map: diffuseTex,
        bumpMap: bumpTex,
        bumpScale: 0.024,
        roughness: 0.78,
      });
      const carrotMesh = new THREE.Mesh(carrotGeo, carrotMat);
      carrotMesh.castShadow = true;
      carrotMesh.receiveShadow = true;
      modelGroup.add(carrotMesh);

      // Stems and leaves
      const leafColors = ['#1b5e20', '#2e7d32', '#388e3c', '#4caf50'];
      for (let i = 0; i < 9; i++) {
        const angle = (i / 9) * Math.PI * 2 + Math.random() * 0.25;
        const length = 1.0 + Math.random() * 0.5;
        
        const startX = Math.cos(angle) * 0.15;
        const startZ = Math.sin(angle) * 0.15;
        const curvePoints = [
          new THREE.Vector3(startX, -0.05, startZ),
          new THREE.Vector3(startX * 1.4, 0.3, startZ * 1.4),
          new THREE.Vector3(Math.cos(angle) * length * 0.6, length * 0.65, Math.sin(angle) * length * 0.6),
          new THREE.Vector3(Math.cos(angle) * length, length, Math.sin(angle) * length),
        ];
        const stemCurve = new THREE.CatmullRomCurve3(curvePoints);
        const stemGeo = new THREE.TubeGeometry(stemCurve, 10, 0.018, 5, false);
        const stemMat = new THREE.MeshPhysicalMaterial({
          color: leafColors[i % leafColors.length],
          roughness: 0.85,
        });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.castShadow = true;
        modelGroup.add(stem);
        
        // Leaflets
        for (let j = 5; j <= 10; j++) {
          const pt = stemCurve.getPoint(j / 10);
          const leafletShape = new THREE.Shape();
          leafletShape.moveTo(0, 0);
          leafletShape.quadraticCurveTo(0.1, 0.1, 0.07, 0.22);
          leafletShape.quadraticCurveTo(-0.1, 0.1, 0, 0);
          const leafletGeo = new THREE.ShapeGeometry(leafletShape);
          const leafL = new THREE.Mesh(leafletGeo, stemMat);
          leafL.position.copy(pt);
          leafL.scale.set(0.75, 0.75, 0.75);
          leafL.rotation.set(Math.random() * 0.4, angle, Math.random() * 0.4);
          modelGroup.add(leafL);
        }
      }
    };

    // ── 4. BROCCOLI ───────────────────────────────────────────────────────────
    const createBroccoli = () => {
      const stemGeo = new THREE.CylinderGeometry(0.28, 0.42, 1.2, 16, 8);
      stemGeo.translate(0, -0.6, 0);
      
      const stemPos = stemGeo.attributes.position;
      for (let i = 0; i < stemPos.count; i++) {
        const x = stemPos.getX(i);
        const y = stemPos.getY(i);
        const z = stemPos.getZ(i);
        const bump = Math.sin(y * 6.0) * 0.03;
        const curve = (y + 1.2) * (y + 1.2) * 0.03;
        stemPos.setXYZ(i, x * (1 + bump) + curve, y, z * (1 + bump));
      }
      stemGeo.computeVertexNormals();

      const stemTex = makeCanvasTexture((ctx, w, h) => {
        const grad = ctx.createLinearGradient(0, h, 0, 0);
        grad.addColorStop(0, '#e2f1d5');
        grad.addColorStop(0.3, '#bfe29b');
        grad.addColorStop(1.0, '#558b2f');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      });

      const stemMat = new THREE.MeshPhysicalMaterial({
        map: stemTex,
        roughness: 0.85,
        bumpMap: makeCanvasTexture((ctx, w, h) => {
          ctx.fillStyle = '#808080';
          ctx.fillRect(0, 0, w, h);
          ctx.strokeStyle = '#606060';
          ctx.lineWidth = 1.5;
          for (let x = 0; x < w; x += 12) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (Math.random() - 0.5) * 8, h); ctx.stroke();
          }
        }),
        bumpScale: 0.015,
      });

      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      stemMesh.castShadow = true;
      stemMesh.receiveShadow = true;
      modelGroup.add(stemMesh);

      // Floret bud bumps
      const floretBump = makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, w, h);
        
        ctx.fillStyle = '#303030';
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 12000; i++) {
          const rx = Math.random() * w;
          const ry = Math.random() * h;
          ctx.beginPath(); ctx.arc(rx, ry, 1 + Math.random() * 1.5, 0, Math.PI * 2); ctx.fill();
        }
      }, 512, 512);

      const darkGreen = new THREE.MeshPhysicalMaterial({
        color: '#1a541d',
        roughness: 0.98,
        bumpMap: floretBump,
        bumpScale: 0.03,
        sheen: 0.65,
        sheenColor: new THREE.Color('#2d5e20'),
      });

      const midGreen = new THREE.MeshPhysicalMaterial({
        color: '#2b7530',
        roughness: 0.98,
        bumpMap: floretBump,
        bumpScale: 0.03,
        sheen: 0.65,
        sheenColor: new THREE.Color('#4e892c'),
      });

      const lightGreen = new THREE.MeshPhysicalMaterial({
        color: '#388e3c',
        roughness: 0.98,
        bumpMap: floretBump,
        bumpScale: 0.03,
        sheen: 0.65,
        sheenColor: new THREE.Color('#689f38'),
      });

      const floretData = [
        [0, 0.1, 0, 0.85, darkGreen],
        [0.42, 0.02, 0.22, 0.68, midGreen],
        [-0.42, 0.02, -0.22, 0.68, midGreen],
        [0.28, 0.02, -0.36, 0.65, darkGreen],
        [-0.28, 0.02, 0.36, 0.65, darkGreen],
        [0, 0.44, 0.08, 0.58, lightGreen],
        [0.16, 0.36, -0.16, 0.52, midGreen],
        [-0.16, 0.36, 0.16, 0.52, midGreen],
        [0.48, 0.08, -0.05, 0.44, lightGreen],
        [-0.48, 0.08, 0.05, 0.44, lightGreen],
      ];

      floretData.forEach(([x, y, z, s, mat]) => {
        const fGeo = new THREE.IcosahedronGeometry(0.65, 2);
        const pos = fGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const px = pos.getX(i);
          const py = pos.getY(i);
          const pz = pos.getZ(i);
          const noise = Math.sin(px * 3.5) * Math.cos(py * 3.5) * Math.sin(pz * 3.5);
          const scale = 1.0 + noise * 0.07;
          pos.setXYZ(i, px * scale, py * scale, pz * scale);
        }
        fGeo.computeVertexNormals();

        const fMesh = new THREE.Mesh(fGeo, mat);
        fMesh.position.set(x, y, z);
        fMesh.scale.setScalar(s);
        fMesh.castShadow = true;
        fMesh.receiveShadow = true;
        modelGroup.add(fMesh);
      });

      // Branch connects
      floretData.forEach(([x, y, z]) => {
        if (x === 0 && y === 0.1 && z === 0) return;
        const curvePoints = [
          new THREE.Vector3(0, -0.3, 0),
          new THREE.Vector3(x * 0.4, y * 0.3, z * 0.4),
          new THREE.Vector3(x * 0.88, y * 0.88, z * 0.88),
        ];
        const branchCurve = new THREE.CatmullRomCurve3(curvePoints);
        const branchGeo = new THREE.TubeGeometry(branchCurve, 6, 0.08, 6, false);
        const branchMesh = new THREE.Mesh(branchGeo, stemMat);
        modelGroup.add(branchMesh);
      });
    };

    // ── 5. SALMON ─────────────────────────────────────────────────────────────
    const createSalmon = () => {
      const topTex = makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#ff6c3e';
        ctx.fillRect(0, 0, w, h);
        
        ctx.globalAlpha = 0.25;
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = '#d83a15';
          ctx.beginPath(); ctx.arc(Math.random()*w, Math.random()*h, 90, 0, Math.PI*2); ctx.fill();
        }

        // Marbling
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = '#fffaf0';
        ctx.lineCap = 'round';
        for (let i = 0; i < 15; i++) {
          const x = -30 + (i / 13) * (w + 60);
          ctx.lineWidth = 3 + Math.random() * 3.5;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.bezierCurveTo(x + 25, h * 0.3, x - 25, h * 0.7, x + 8, h);
          ctx.stroke();
        }
        
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1.0;
        for (let i = 0; i < 16; i++) {
          const x = -20 + (i / 15) * (w + 40);
          ctx.beginPath();
          ctx.moveTo(x + 8, 0);
          ctx.bezierCurveTo(x + 35, h * 0.35, x - 8, h * 0.65, x + 15, h);
          ctx.stroke();
        }
      }, 512, 512);

      const sideTex = makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#ff6c3e';
        ctx.fillRect(0, 0, w, h);
        
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = '#fffaf0';
        ctx.lineWidth = 2.0;
        for (let y = 10; y < h - 20; y += 18) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.bezierCurveTo(w * 0.25, y - 3, w * 0.75, y + 5, w, y);
          ctx.stroke();
        }

        // Skin band
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#37474f';
        ctx.fillRect(0, h * 0.84, w, h * 0.16);
        ctx.fillStyle = '#212121';
        ctx.fillRect(0, h * 0.92, w, h * 0.08);
      }, 512, 256);

      const skinTex = makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#263238';
        ctx.fillRect(0, 0, w, h);
        
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = '#b0bec5';
        ctx.lineWidth = 1.8;
        for (let x = 0; x < w; x += 15) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 8, h); ctx.stroke();
        }
      }, 256, 256);

      const topMat = new THREE.MeshPhysicalMaterial({
        map: topTex,
        roughness: 0.26,
        transmission: 0.16,
        thickness: 0.5,
        clearcoat: 0.85,
        clearcoatRoughness: 0.08,
      });

      const sideMat = new THREE.MeshPhysicalMaterial({
        map: sideTex,
        roughness: 0.32,
        transmission: 0.12,
        thickness: 0.4,
        clearcoat: 0.65,
        clearcoatRoughness: 0.12,
      });

      const skinMat = new THREE.MeshPhysicalMaterial({
        map: skinTex,
        roughness: 0.6,
        metalness: 0.25,
      });

      const filletGeo = new THREE.BoxGeometry(2.6, 0.58, 1.36, 16, 4, 10);
      
      const pos = filletGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        const taperFactor = 1.0 + (x * 0.15);
        const thicknessFactor = Math.cos(z * 1.0) * 0.95;
        
        const curveY = y * thicknessFactor;
        const curveZ = z * (1.0 - (y > 0 ? y * 0.15 : 0));
        
        pos.setXYZ(i, x, curveY, curveZ * taperFactor);
      }
      deformGeometry(filletGeo, 0.015, 3.0);

      const materials = [sideMat, sideMat, topMat, skinMat, sideMat, sideMat];
      const fillet = new THREE.Mesh(filletGeo, materials);
      fillet.castShadow = true;
      fillet.receiveShadow = true;
      fillet.rotation.y = 0.45;
      modelGroup.add(fillet);
    };

    // ── 6. LOBSTER ────────────────────────────────────────────────────────────
    const createLobster = () => {
      const shellTex = makeCanvasTexture((ctx, w, h) => {
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#e64a19');
        grad.addColorStop(0.4, '#d84315');
        grad.addColorStop(0.7, '#b72a08');
        grad.addColorStop(1.0, '#751a04');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.globalAlpha = 0.35;
        for (let i = 0; i < 40; i++) {
          ctx.fillStyle = Math.random() > 0.5 ? '#fed777' : '#320a01';
          ctx.beginPath(); ctx.arc(Math.random()*w, Math.random()*h, 7 + Math.random()*22, 0, Math.PI*2); ctx.fill();
        }
        
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = '#ff9100';
        ctx.lineWidth = 3;
        for (let y = 40; y < h; y += 50) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
      }, 512, 512);

      const shellBump = makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, w, h);
        
        ctx.fillStyle = '#9e9e9e';
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 2000; i++) {
          ctx.beginPath(); ctx.arc(Math.random()*w, Math.random()*h, 1.2 + Math.random()*2, 0, Math.PI * 2); ctx.fill();
        }
      }, 256, 256);

      const shellMat = new THREE.MeshPhysicalMaterial({
        map: shellTex,
        bumpMap: shellBump,
        bumpScale: 0.015,
        roughness: 0.22,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
      });

      const carapaceGeo = new THREE.SphereGeometry(0.48, 16, 16);
      carapaceGeo.scale(1.0, 0.9, 1.45);
      deformGeometry(carapaceGeo, 0.02, 5.0);
      const carapace = new THREE.Mesh(carapaceGeo, shellMat);
      carapace.position.set(0, 0.1, 0.2);
      carapace.castShadow = true;
      modelGroup.add(carapace);

      let currentZ = -0.4;
      for (let i = 0; i < 6; i++) {
        const scale = 0.45 - i * 0.035;
        const segGeo = new THREE.SphereGeometry(scale, 12, 12);
        segGeo.scale(1.22, 0.8, 0.85);
        deformGeometry(segGeo, 0.015, 6.0);
        const seg = new THREE.Mesh(segGeo, shellMat);
        seg.position.set(0, 0.06 - i * 0.03, currentZ);
        seg.castShadow = true;
        modelGroup.add(seg);
        currentZ -= scale * 0.72;
      }

      const tFanGroup = new THREE.Group();
      tFanGroup.position.set(0, -0.06, currentZ - 0.05);
      for (let i = -2; i <= 2; i++) {
        const fanGeo = new THREE.BoxGeometry(0.16, 0.03, 0.4);
        const fan = new THREE.Mesh(fanGeo, shellMat);
        fan.position.set(i * 0.12, 0, -0.1);
        fan.rotation.y = i * 0.2;
        fan.rotation.z = i * 0.12;
        fan.castShadow = true;
        tFanGroup.add(fan);
      }
      modelGroup.add(tFanGroup);

      const rostrumGeo = new THREE.ConeGeometry(0.04, 0.35, 6);
      rostrumGeo.rotateX(Math.PI / 2.3);
      const rostrum = new THREE.Mesh(rostrumGeo, shellMat);
      rostrum.position.set(0, 0.28, 0.95);
      modelGroup.add(rostrum);

      const makeClaw = (side) => {
        const jointPoints = [
          new THREE.Vector3(side * 0.3, 0.1, 0.4),
          new THREE.Vector3(side * 0.52, 0.15, 0.65),
          new THREE.Vector3(side * 0.62, 0.22, 0.9),
        ];
        const armCurve = new THREE.CatmullRomCurve3(jointPoints);
        const armGeo = new THREE.TubeGeometry(armCurve, 6, 0.075, 8, false);
        const armMesh = new THREE.Mesh(armGeo, shellMat);
        armMesh.castShadow = true;
        modelGroup.add(armMesh);

        const clawGeo = new THREE.SphereGeometry(0.25, 12, 12);
        clawGeo.scale(1.8, 1.1, 0.65);
        deformGeometry(clawGeo, 0.02, 5.0);
        const claw = new THREE.Mesh(clawGeo, shellMat);
        claw.position.set(side * 0.72, 0.28, 1.15);
        claw.rotation.set(0.1, side * 0.7, side * -0.2);
        claw.castShadow = true;
        modelGroup.add(claw);
        
        const fGeo1 = new THREE.ConeGeometry(0.065, 0.3, 8);
        fGeo1.rotateX(Math.PI / 1.7);
        fGeo1.scale(1.2, 0.75, 1.0);
        const finger1 = new THREE.Mesh(fGeo1, shellMat);
        finger1.position.set(side * 0.85, 0.32, 1.34);
        finger1.rotation.set(0.05, side * 0.4, side * -0.1);
        modelGroup.add(finger1);

        const fGeo2 = new THREE.ConeGeometry(0.05, 0.24, 8);
        fGeo2.rotateX(Math.PI / 1.6);
        fGeo2.scale(1.0, 0.75, 1.0);
        const finger2 = new THREE.Mesh(fGeo2, shellMat);
        finger2.position.set(side * 0.68, 0.3, 1.32);
        finger2.rotation.set(0.05, side * 0.9, side * -0.15);
        modelGroup.add(finger2);
      };
      makeClaw(1);
      makeClaw(-1);

      const legMat = new THREE.MeshPhysicalMaterial({ color: '#c33d1c', roughness: 0.6 });
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 4; i++) {
          const zOffset = 0.2 - i * 0.22;
          const legPoints = [
            new THREE.Vector3(side * 0.2, 0.05, zOffset),
            new THREE.Vector3(side * 0.62, -0.2, zOffset - 0.05),
            new THREE.Vector3(side * 0.75, -0.62, zOffset - 0.12),
          ];
          const legCurve = new THREE.CatmullRomCurve3(legPoints);
          const legGeo = new THREE.TubeGeometry(legCurve, 6, 0.024, 5, false);
          const leg = new THREE.Mesh(legGeo, legMat);
          modelGroup.add(leg);
        }
      }

      const antMat = new THREE.MeshPhysicalMaterial({ color: '#a0280b', roughness: 0.9 });
      for (let i = 0; i < 2; i++) {
        const s = i === 0 ? 1 : -1;
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(s * 0.12, 0.24, 0.88),
          new THREE.Vector3(s * 0.85, 0.65, 1.8),
          new THREE.Vector3(s * 1.5, 1.25, 2.8),
        );
        const antGeo = new THREE.TubeGeometry(curve, 20, 0.01, 4, false);
        const ant = new THREE.Mesh(antGeo, antMat);
        modelGroup.add(ant);
      }

      modelGroup.scale.setScalar(0.9);
      modelGroup.position.set(0, 0.1, 0.1);
    };

    // ── 7. MANGO ──────────────────────────────────────────────────────────────
    const createMango = () => {
      const diffuseTex = makeCanvasTexture((ctx, w, h) => {
        const grad = ctx.createLinearGradient(0, h, w, 0);
        grad.addColorStop(0.0, '#93a115'); // green end
        grad.addColorStop(0.35, '#ffca28'); // yellow
        grad.addColorStop(0.7, '#ff8f00'); // orange
        grad.addColorStop(1.0, '#e64a19'); // reddish blush sunside
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#ffecb3';
        for (let i = 0; i < 500; i++) {
          ctx.beginPath();
          ctx.arc(Math.random() * w, Math.random() * h, 0.8 + Math.random() * 1.0, 0, Math.PI * 2);
          ctx.fill();
        }
      }, 512, 512);

      const mangoGeo = new THREE.SphereGeometry(1.0, 64, 64);
      const pos = mangoGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);
        
        const curve = y > 0 ? (1.0 - y * 0.18) : (1.0 + y * 0.08);
        const beak = y < 0 ? (y * y * 0.16) : 0;
        
        pos.setXYZ(i, (x + beak) * curve * 1.35, y * 1.15, z * curve * 0.95);
      }
      deformGeometry(mangoGeo, 0.015, 3.0);

      const mangoMat = new THREE.MeshPhysicalMaterial({
        map: diffuseTex,
        roughness: 0.3,
        clearcoat: 0.72,
        clearcoatRoughness: 0.15,
      });

      const mangoMesh = new THREE.Mesh(mangoGeo, mangoMat);
      mangoMesh.castShadow = true;
      mangoMesh.receiveShadow = true;
      modelGroup.add(mangoMesh);

      // Stem
      const stemGeo = new THREE.CylinderGeometry(0.024, 0.03, 0.14, 6);
      const stemMat = new THREE.MeshPhysicalMaterial({ color: '#422a1a', roughness: 0.9 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(-0.06, 1.12, 0);
      modelGroup.add(stem);
    };

    // ── 8. STRAWBERRY ─────────────────────────────────────────────────────────
    const createStrawberry = () => {
      const diffuseTex = makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(0, 0, w, h);
        
        ctx.globalAlpha = 0.2;
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = '#7a0004';
          ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, 120, 0, Math.PI * 2); ctx.fill();
        }
        
        ctx.globalAlpha = 1.0;
        for (let r = 24; r < h - 20; r += 36) {
          const shift = (r % 72 === 0) ? 18 : 0;
          for (let c = 12; c < w; c += 36) {
            const x = c + shift;
            const y = r;
            ctx.fillStyle = '#7a0004';
            ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fdd835';
            ctx.beginPath(); ctx.ellipse(x, y, 1.8, 3.2, 0.1, 0, Math.PI * 2); ctx.fill();
          }
        }
      }, 512, 512);

      const bumpTex = makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, w, h);
        for (let r = 24; r < h - 20; r += 36) {
          const shift = (r % 72 === 0) ? 18 : 0;
          for (let c = 12; c < w; c += 36) {
            const x = c + shift;
            const y = r;
            ctx.fillStyle = '#404040';
            ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#c0c0c0';
            ctx.beginPath(); ctx.ellipse(x, y, 1.8, 3.2, 0.1, 0, Math.PI * 2); ctx.fill();
          }
        }
      }, 512, 512);

      const berryGeo = new THREE.SphereGeometry(1.0, 64, 64);
      const pos = berryGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);
        
        let taper = 1.0;
        if (y < 0) {
          taper = 1.0 + y * 0.65;
        } else {
          taper = 1.0 - y * y * 0.12;
        }
        pos.setXYZ(i, x * taper * 1.05, y * 1.25, z * taper * 1.05);
      }
      deformGeometry(berryGeo, 0.012, 5.0);

      const berryMat = new THREE.MeshPhysicalMaterial({
        map: diffuseTex,
        bumpMap: bumpTex,
        bumpScale: 0.012,
        roughness: 0.18,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
      });

      const strawberry = new THREE.Mesh(berryGeo, berryMat);
      strawberry.castShadow = true;
      strawberry.receiveShadow = true;
      modelGroup.add(strawberry);

      // Calyx sepals
      const leafMat = new THREE.MeshPhysicalMaterial({ color: '#2e7d32', roughness: 0.75, side: THREE.DoubleSide });
      const calyxGroup = new THREE.Group();
      calyxGroup.position.y = 1.22;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const leafShape = new THREE.Shape();
        leafShape.moveTo(0, 0);
        leafShape.quadraticCurveTo(0.1, 0.15, 0.04, 0.42);
        leafShape.quadraticCurveTo(-0.1, 0.2, 0, 0);
        const leafGeo = new THREE.ShapeGeometry(leafShape);
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.rotation.y = angle;
        leaf.rotation.x = -1.1 + Math.random() * 0.15;
        leaf.scale.set(1.1, 1.1, 1.1);
        calyxGroup.add(leaf);
      }
      modelGroup.add(calyxGroup);

      // Small stem
      const stemGeo = new THREE.CylinderGeometry(0.025, 0.035, 0.35, 8);
      const stemMat = new THREE.MeshPhysicalMaterial({ color: '#4caf50', roughness: 0.9 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(0, 1.34, 0);
      stem.rotation.z = -0.2;
      modelGroup.add(stem);
    };

    // ── 9. MELON (DƯA LƯỚI) ───────────────────────────────────────────────────
    const createMelon = () => {
      const w = 512, h = 512;
      
      let seed = 24680;
      const pseudoRandom = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };

      const drawNets = (ctx, isBump) => {
        ctx.lineCap = 'round';
        seed = 24680;
        for (let i = 0; i < 80; i++) {
          const x0 = pseudoRandom() * w;
          const y0 = pseudoRandom() * h;
          const x1 = pseudoRandom() * w;
          const y1 = pseudoRandom() * h;
          const cpx = pseudoRandom() * w;
          const cpy = pseudoRandom() * h;

          ctx.strokeStyle = isBump ? '#cccccc' : '#d8d3b7';
          ctx.lineWidth = isBump ? 3.0 : 1.8;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.quadraticCurveTo(cpx, cpy, x1, y1);
          ctx.stroke();
        }
      };

      const diffuseTex = makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#659730';
        ctx.fillRect(0, 0, w, h);
        
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#8bc34a';
        for (let i = 0; i < 8; i++) {
          ctx.beginPath(); ctx.arc(pseudoRandom()*w, pseudoRandom()*h, 100, 0, Math.PI*2); ctx.fill();
        }
        
        ctx.globalAlpha = 1.0;
        drawNets(ctx, false);
      }, w, h);

      const bumpTex = makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, w, h);
        drawNets(ctx, true);
      }, w, h);

      const melonGeo = new THREE.SphereGeometry(1.22, 64, 64);
      deformGeometry(melonGeo, 0.015, 3.0);

      const melonMat = new THREE.MeshPhysicalMaterial({
        map: diffuseTex,
        bumpMap: bumpTex,
        bumpScale: 0.02,
        roughness: 0.86,
        clearcoat: 0.08,
      });

      const melonMesh = new THREE.Mesh(melonGeo, melonMat);
      melonMesh.castShadow = true;
      melonMesh.receiveShadow = true;
      modelGroup.add(melonMesh);

      // Curved stem
      const stemPoints = [
        new THREE.Vector3(0, 1.2, 0),
        new THREE.Vector3(0.04, 1.34, -0.04),
        new THREE.Vector3(0.16, 1.42, -0.08),
      ];
      const stemCurve = new THREE.CatmullRomCurve3(stemPoints);
      const stemGeo = new THREE.TubeGeometry(stemCurve, 8, 0.05, 8, false);
      const stemMat = new THREE.MeshPhysicalMaterial({ color: '#564936', roughness: 0.9 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      modelGroup.add(stem);
    };

    // ── 10. CHERRY TOMATO ─────────────────────────────────────────────────────
    const createCherryTomato = () => {
      const diffuseTex = makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(0, 0, w, h);
        
        const g1 = ctx.createRadialGradient(w/2, h/2, 40, w/2, h/2, w/2);
        g1.addColorStop(0, '#e53935');
        g1.addColorStop(1, '#9e0000');
        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, w, h);

        ctx.globalAlpha = 0.7;
        const g2 = ctx.createRadialGradient(w/2, 0, 0, w/2, 0, 65);
        g2.addColorStop(0, '#afb42b');
        g2.addColorStop(0.5, '#fbc02d');
        g2.addColorStop(1, 'transparent');
        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, w, h);
      }, 256, 256);

      const tomatoGeo = new THREE.SphereGeometry(1.0, 48, 48);
      
      const tomatoMat = new THREE.MeshPhysicalMaterial({
        map: diffuseTex,
        roughness: 0.05,
        transmission: 0.15,
        thickness: 0.4,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
      });

      const tomatoMesh = new THREE.Mesh(tomatoGeo, tomatoMat);
      tomatoMesh.castShadow = true;
      tomatoMesh.receiveShadow = true;
      modelGroup.add(tomatoMesh);

      // Calyx
      const calyxMat = new THREE.MeshPhysicalMaterial({ color: '#2b752e', roughness: 0.85 });
      const calyx = new THREE.Group();
      calyx.position.y = 0.98;
      
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const sepalPoints = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(Math.cos(angle) * 0.11, 0.04, Math.sin(angle) * 0.11),
          new THREE.Vector3(Math.cos(angle) * 0.26, 0.16, Math.sin(angle) * 0.26),
        ];
        const sepalCurve = new THREE.CatmullRomCurve3(sepalPoints);
        const sepalGeo = new THREE.TubeGeometry(sepalCurve, 6, 0.015, 4, false);
        const sepal = new THREE.Mesh(sepalGeo, calyxMat);
        calyx.add(sepal);
      }
      
      const stemGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.24, 6);
      stemGeo.translate(0, 0.11, 0);
      const stem = new THREE.Mesh(stemGeo, calyxMat);
      stem.rotation.z = -0.28;
      calyx.add(stem);

      modelGroup.add(calyx);
    };

    // ── 11. SPINACH (CẢI BÓ XÔI) ──────────────────────────────────────────────
    const createSpinach = () => {
      const leafDiffuse = makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#18541c';
        ctx.fillRect(0, 0, w, h);
        
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#27702b';
        ctx.fillRect(0, 0, w, h);

        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = '#81c784';
        ctx.lineWidth = 4;
        
        ctx.beginPath(); ctx.moveTo(w/2, h); ctx.lineTo(w/2, 0); ctx.stroke();

        ctx.lineWidth = 1.8;
        for (let y = h - 60; y > 30; y -= 50) {
          ctx.beginPath(); ctx.moveTo(w/2, y); ctx.lineTo(w * 0.16, y - 42); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(w/2, y); ctx.lineTo(w * 0.84, y - 42); ctx.stroke();
        }
      }, 512, 512);

      const leafMat = new THREE.MeshPhysicalMaterial({
        map: leafDiffuse,
        roughness: 0.52,
        clearcoat: 0.15,
        transmission: 0.12,
        thickness: 0.04,
        side: THREE.DoubleSide,
      });

      const stemMat = new THREE.MeshPhysicalMaterial({ color: '#558b2f', roughness: 0.85 });

      for (let i = 0; i < 6; i++) {
        const leafGroup = new THREE.Group();
        const angle = (i / 6) * Math.PI * 2;
        const tilt = 0.35 + Math.random() * 0.25;
        
        const leafGeo = new THREE.PlaneGeometry(0.7, 1.25, 10, 16);
        leafGeo.translate(0, 0.62, 0);
        
        const pos = leafGeo.attributes.position;
        for (let j = 0; j < pos.count; j++) {
          const px = pos.getX(j);
          const py = pos.getY(j);
          const ruffle = Math.sin(py * 4.5) * Math.cos(px * 3.5) * 0.07;
          const curve = -py * py * 0.05;
          const widthScale = py < 0.25 ? (py / 0.25) : (1.0 - (py > 0.9 ? (py - 0.9) * 2.5 : 0));
          pos.setXYZ(j, px * Math.max(0.1, widthScale), py, ruffle + curve);
        }
        leafGeo.computeVertexNormals();

        const leafMesh = new THREE.Mesh(leafGeo, leafMat);
        leafMesh.castShadow = true;
        leafMesh.receiveShadow = true;
        leafGroup.add(leafMesh);

        const stemPoints = [
          new THREE.Vector3(0, -0.35, 0),
          new THREE.Vector3(0, 0.0, 0),
          new THREE.Vector3(0, 0.28, -0.02),
        ];
        const stemCurve = new THREE.CatmullRomCurve3(stemPoints);
        const stemGeo = new THREE.TubeGeometry(stemCurve, 6, 0.024, 6, false);
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.castShadow = true;
        leafGroup.add(stem);

        leafGroup.rotation.y = angle;
        leafGroup.rotation.x = tilt;
        leafGroup.rotation.z = (Math.random() - 0.5) * 0.15;
        leafGroup.position.set(Math.cos(angle) * 0.05, -0.2, Math.sin(angle) * 0.05);
        
        modelGroup.add(leafGroup);
      }
    };

    // ── 12. SWEET CORN (BẮP NGỌT) ─────────────────────────────────────────────
    const createSweetCorn = () => {
      const cob = new THREE.Group();

      const coreGeo = new THREE.CylinderGeometry(0.3, 0.38, 1.8, 16);
      const coreMat = new THREE.MeshPhysicalMaterial({ color: '#fff9c4', roughness: 0.9 });
      const core = new THREE.Mesh(coreGeo, coreMat);
      cob.add(core);

      const kernelMat1 = new THREE.MeshPhysicalMaterial({ color: '#ffeb3b', roughness: 0.25, clearcoat: 0.35, clearcoatRoughness: 0.2 });
      const kernelMat2 = new THREE.MeshPhysicalMaterial({ color: '#fdd835', roughness: 0.25, clearcoat: 0.35, clearcoatRoughness: 0.2 });
      const kernelMat3 = new THREE.MeshPhysicalMaterial({ color: '#ffee58', roughness: 0.25, clearcoat: 0.35, clearcoatRoughness: 0.2 });
      const kernelMats = [kernelMat1, kernelMat2, kernelMat3];

      const rows = 15;
      const cols = 14;
      for (let r = 0; r < rows; r++) {
        const y = -0.8 + (r / (rows - 1)) * 1.6;
        const taper = r > 11 ? (1.0 - (r - 11) * 0.18) : 1.0;
        const radius = 0.35 * taper;
        
        for (let c = 0; c < cols; c++) {
          const angle = (c / cols) * Math.PI * 2 + (r % 2) * (Math.PI / cols);
          const kGeo = new THREE.BoxGeometry(0.12, 0.075, 0.14);
          
          const mat = kernelMats[(r + c) % kernelMats.length];
          const kMesh = new THREE.Mesh(kGeo, mat);
          
          kMesh.position.set(Math.cos(angle) * (radius + 0.04), y, Math.sin(angle) * (radius + 0.04));
          kMesh.rotation.y = angle;
          kMesh.rotation.x = (Math.random() - 0.5) * 0.15;
          kMesh.castShadow = true;
          
          cob.add(kMesh);
        }
      }

      // Husks
      const huskMat = new THREE.MeshPhysicalMaterial({ color: '#9ccc65', roughness: 0.8, side: THREE.DoubleSide });
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + 0.3;
        const huskGeo = new THREE.PlaneGeometry(0.7, 1.8, 8, 8);
        huskGeo.translate(0, 0.9, 0);
        
        const pos = huskGeo.attributes.position;
        for (let j = 0; j < pos.count; j++) {
          const px = pos.getX(j);
          const py = pos.getY(j);
          const wrap = Math.sin(px * 1.5) * 0.12;
          const flare = py > 1.0 ? (py - 1.0) * 0.3 * Math.cos(angle) : 0;
          pos.setXYZ(j, px * 0.9, py - 0.9, wrap + flare);
        }
        huskGeo.computeVertexNormals();

        const huskMesh = new THREE.Mesh(huskGeo, huskMat);
        huskMesh.position.set(Math.cos(angle) * 0.2, -0.2, Math.sin(angle) * 0.2);
        huskMesh.rotation.y = angle;
        huskMesh.rotation.x = 0.18;
        huskMesh.castShadow = true;
        huskMesh.receiveShadow = true;
        cob.add(huskMesh);
      }

      // Silk (Râu ngô)
      const silkMat = new THREE.MeshPhysicalMaterial({ color: '#bcaaa4', roughness: 0.9 });
      for (let i = 0; i < 15; i++) {
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(0, 0.9, 0),
          new THREE.Vector3((Math.random() - 0.5) * 0.18, 1.12, (Math.random() - 0.5) * 0.18),
          new THREE.Vector3((Math.random() - 0.5) * 0.45, 1.32, (Math.random() - 0.5) * 0.45),
        );
        const silkGeo = new THREE.TubeGeometry(curve, 6, 0.006, 3, false);
        const silk = new THREE.Mesh(silkGeo, silkMat);
        cob.add(silk);
      }

      modelGroup.add(cob);
    };

    // ── 13. TUNA (CÁ NGỪ SAKU) ────────────────────────────────────────────────
    const createTuna = () => {
      const diffuseTex = makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(0, 0, w, h);
        
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#880e4f';
        ctx.fillRect(0, 0, w, h);

        ctx.globalAlpha = 0.38;
        ctx.strokeStyle = '#ffcdd2';
        ctx.lineWidth = 1.6;
        for (let y = 10; y < h; y += 20) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.bezierCurveTo(w*0.3, y - 4, w*0.7, y + 4, w, y);
          ctx.stroke();
        }
      }, 512, 256);

      const tunaMat = new THREE.MeshPhysicalMaterial({
        map: diffuseTex,
        roughness: 0.25,
        transmission: 0.18,
        thickness: 0.6,
        clearcoat: 0.9,
        clearcoatRoughness: 0.08,
      });

      const tunaGeo = new THREE.BoxGeometry(2.4, 0.65, 1.1, 12, 4, 8);
      const pos = tunaGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);
        const curveX = x * (1.0 - y * y * 0.08);
        const curveZ = z * (1.0 - y * y * 0.1);
        pos.setXYZ(i, curveX, y, curveZ);
      }
      deformGeometry(tunaGeo, 0.012, 4.0);

      const tunaMesh = new THREE.Mesh(tunaGeo, tunaMat);
      tunaMesh.castShadow = true;
      tunaMesh.receiveShadow = true;
      tunaMesh.rotation.y = 0.35;
      modelGroup.add(tunaMesh);
    };

    // ── 14. OCTOPUS (BẠCH TUỘC) ────────────────────────────────────────────────
    const createOctopus = () => {
      const points = [];
      const numPoints = 24;
      for (let i = 0; i < numPoints; i++) {
        const t = i / (numPoints - 1);
        const angle = t * Math.PI * 1.8;
        const radius = 1.1 - t * 0.8;
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          -0.5 + t * 1.0,
          Math.sin(angle) * radius
        ));
      }
      const tentacleCurve = new THREE.CatmullRomCurve3(points);
      const tentacleGeo = new THREE.TubeGeometry(tentacleCurve, 64, 0.22, 12, false);
      
      const pos = tentacleGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        
        const sliceIdx = Math.floor(i / 13);
        const t = sliceIdx / (64 + 1);
        const taper = 1.0 - t * 0.88;
        const curvePt = tentacleCurve.getPoint(t);
        
        const dx = x - curvePt.x;
        const dy = y - curvePt.y;
        const dz = z - curvePt.z;
        
        pos.setXYZ(i, curvePt.x + dx * taper, curvePt.y + dy * taper, curvePt.z * dz * taper);
      }
      deformGeometry(tentacleGeo, 0.015, 6.0);

      const diffuseTex = makeCanvasTexture((ctx, w, h) => {
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#880e4f');
        grad.addColorStop(0.5, '#ad1457');
        grad.addColorStop(1, '#ff80ab');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#fce4ec';
        for (let i = 0; i < 400; i++) {
          ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 5, 0, Math.PI * 2); ctx.fill();
        }
      }, 512, 128);

      const tentacleMat = new THREE.MeshPhysicalMaterial({
        map: diffuseTex,
        roughness: 0.15,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
        transmission: 0.1,
        thickness: 0.3,
      });

      const tentacle = new THREE.Mesh(tentacleGeo, tentacleMat);
      tentacle.castShadow = true;
      tentacle.receiveShadow = true;
      modelGroup.add(tentacle);

      const suckerMat = new THREE.MeshPhysicalMaterial({
        color: '#f8bbd0',
        roughness: 0.4,
        clearcoat: 0.3,
      });

      const numSuckers = 20;
      for (let i = 0; i < numSuckers; i++) {
        const t = (i / (numSuckers - 1)) * 0.9;
        const pt = tentacleCurve.getPoint(t);
        const angle = t * Math.PI * 1.8;
        const inwardDir = new THREE.Vector3(-Math.cos(angle), -0.2, -Math.sin(angle)).normalize();
        
        const size = 0.13 * (1.0 - t * 0.7);
        const suckerGeo = new THREE.SphereGeometry(size, 8, 8);
        suckerGeo.scale(1.2, 0.6, 1.2);
        suckerGeo.translate(0, -size * 0.2, 0);

        const suckerMesh = new THREE.Mesh(suckerGeo, suckerMat);
        suckerMesh.position.copy(pt).addScaledVector(inwardDir, 0.12 * (1.0 - t * 0.8));
        
        const up = new THREE.Vector3(0, 1, 0);
        suckerMesh.quaternion.setFromUnitVectors(up, inwardDir);
        suckerMesh.castShadow = true;
        
        modelGroup.add(suckerMesh);
      }
    };

    // ── LUXURY CAR MODELS ─────────────────────────────────────────────────────

    // Shared car builder helper — builds a realistic sedan/SUV body procedurally
    const buildCarBody = ({
      bodyColor = '#1a1a2e',
      accentColor = '#c0c0c0',
      glassColor = '#4fc3f7',
      wheelColor = '#111111',
      rimColor = '#e0e0e0',
      bodyLength = 4.2,
      bodyWidth = 1.82,
      bodyHeight = 0.72,
      roofHeight = 0.68,
      roofRatio = 0.52,
      isSUV = false,
    } = {}) => {
      const scale = 1 / bodyLength; // normalise to ~1 unit length
      const S = (v) => v * scale * 2.2;

      const carMat = new THREE.MeshPhysicalMaterial({
        color: bodyColor,
        roughness: 0.12,
        metalness: 0.85,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        reflectivity: 1.0,
      });

      const chromeMat = new THREE.MeshPhysicalMaterial({
        color: accentColor,
        roughness: 0.05,
        metalness: 1.0,
        clearcoat: 0.6,
      });

      const glassMat = new THREE.MeshPhysicalMaterial({
        color: glassColor,
        roughness: 0.0,
        metalness: 0.0,
        transmission: 0.72,
        thickness: 0.08,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
      });

      const tireMat = new THREE.MeshPhysicalMaterial({
        color: wheelColor,
        roughness: 0.88,
        metalness: 0.0,
      });

      const rimMat = new THREE.MeshPhysicalMaterial({
        color: rimColor,
        roughness: 0.12,
        metalness: 0.95,
      });

      const lightMat = new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        emissive: '#ffe082',
        emissiveIntensity: 0.8,
        roughness: 0.05,
        metalness: 0.0,
        transparent: true,
        opacity: 0.9,
      });

      const tailLightMat = new THREE.MeshPhysicalMaterial({
        color: '#ff1744',
        emissive: '#ff1744',
        emissiveIntensity: 0.6,
        roughness: 0.1,
        transparent: true,
        opacity: 0.85,
      });

      // ── BODY ─────────────────────────────────────────────────────────────────
      const bL = S(bodyLength);
      const bW = S(bodyWidth);
      const bH = S(bodyHeight);
      const rH = S(roofHeight);
      const rW = bW * 0.84;
      const rL = bL * roofRatio;

      // Lower body (box with rounded proportions via scale)
      const lowerGeo = new THREE.BoxGeometry(bL, bH, bW, 4, 2, 4);
      // Bevel lower body slightly by deforming corners
      {
        const pos = lowerGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
          // Taper front & rear slightly
          const xRel = x / (bL / 2);
          const taper = 1 - Math.pow(Math.abs(xRel), 2.5) * 0.08;
          pos.setXYZ(i, x, y, z * taper);
        }
        lowerGeo.computeVertexNormals();
      }
      const lowerMesh = new THREE.Mesh(lowerGeo, carMat);
      lowerMesh.position.y = bH / 2;
      lowerMesh.castShadow = true;
      lowerMesh.receiveShadow = true;
      modelGroup.add(lowerMesh);

      // Roofline (tapered box)
      const roofGeo = new THREE.BoxGeometry(rL, rH, rW, 4, 2, 4);
      {
        const pos = roofGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
          const xRel = x / (rL / 2);
          // Taper top and front/back of roof
          const topTaper = y > 0 ? 1 - Math.pow(Math.abs(xRel), 1.4) * 0.18 : 1.0;
          pos.setXYZ(i, x, y, z * topTaper);
        }
        roofGeo.computeVertexNormals();
      }
      const roofMesh = new THREE.Mesh(roofGeo, carMat);
      roofMesh.position.set(S(0.05), bH + rH / 2, 0);
      roofMesh.castShadow = true;
      modelGroup.add(roofMesh);

      // Trunk lid / hood (thin flat panels)
      const hoodGeo = new THREE.BoxGeometry(bL * 0.26, bH * 0.05, bW * 0.97);
      const hoodMesh = new THREE.Mesh(hoodGeo, carMat);
      hoodMesh.position.set(bL * 0.36, bH + 0.005, 0);
      hoodMesh.castShadow = true;
      modelGroup.add(hoodMesh);

      const trunkGeo = new THREE.BoxGeometry(bL * 0.18, bH * 0.05, bW * 0.97);
      const trunkMesh = new THREE.Mesh(trunkGeo, carMat);
      trunkMesh.position.set(-bL * 0.38, bH + 0.005, 0);
      trunkMesh.castShadow = true;
      modelGroup.add(trunkMesh);

      // ── WINDSHIELDS ───────────────────────────────────────────────────────────
      const makeWindshield = (posX, rotY, width, height) => {
        const wGeo = new THREE.PlaneGeometry(width, height, 2, 2);
        {
          const pos = wGeo.attributes.position;
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const curve = Math.pow(Math.abs(x / (width / 2)), 1.8) * 0.06;
            pos.setZ(i, -curve);
          }
          wGeo.computeVertexNormals();
        }
        const wMesh = new THREE.Mesh(wGeo, glassMat);
        wMesh.position.set(posX, bH + rH * 0.42, 0);
        wMesh.rotation.y = rotY;
        wMesh.castShadow = false;
        modelGroup.add(wMesh);
      };
      // Front windshield (angled back ~25°)
      makeWindshield(rL * 0.44, -Math.PI * 0.14, rW * 0.88, rH * 0.82);
      // Rear windshield (angled forward ~20°)
      makeWindshield(-rL * 0.46, Math.PI * 0.12, rW * 0.82, rH * 0.76);

      // Side windows (simple quads per door)
      const sideWinH = rH * 0.62;
      const sideWinW = rL * 0.22;
      [-1, 1].forEach((side) => {
        for (let d = 0; d < 2; d++) {
          const wGeo = new THREE.PlaneGeometry(sideWinW, sideWinH);
          const wMesh = new THREE.Mesh(wGeo, glassMat);
          const offsetX = (d === 0 ? rL * 0.18 : -rL * 0.18);
          wMesh.position.set(offsetX, bH + rH * 0.44, side * (bW / 2 + 0.005));
          wMesh.rotation.y = side * Math.PI / 2;
          modelGroup.add(wMesh);
        }
      });

      // ── HEADLIGHTS & TAILLIGHTS ──────────────────────────────────────────────
      [-1, 1].forEach((side) => {
        // Headlight (front)
        const hGeo = new THREE.BoxGeometry(bW * 0.025, bH * 0.1, bW * 0.22);
        const hMesh = new THREE.Mesh(hGeo, lightMat);
        hMesh.position.set(bL / 2 + 0.01, bH * 0.62, side * bW * 0.33);
        modelGroup.add(hMesh);

        // DRL strip
        const drlGeo = new THREE.BoxGeometry(bW * 0.015, bH * 0.022, bW * 0.32);
        const drlMesh = new THREE.Mesh(drlGeo, lightMat);
        drlMesh.position.set(bL / 2 + 0.01, bH * 0.78, side * bW * 0.3);
        modelGroup.add(drlMesh);

        // Taillight
        const tlGeo = new THREE.BoxGeometry(bW * 0.02, bH * 0.09, bW * 0.28);
        const tlMesh = new THREE.Mesh(tlGeo, tailLightMat);
        tlMesh.position.set(-bL / 2 - 0.01, bH * 0.65, side * bW * 0.3);
        modelGroup.add(tlMesh);
      });

      // ── GRILLE ────────────────────────────────────────────────────────────────
      const grilleGeo = new THREE.BoxGeometry(bW * 0.02, bH * 0.28, bW * 0.52);
      const grilleMesh = new THREE.Mesh(grilleGeo, chromeMat);
      grilleMesh.position.set(bL / 2 + 0.01, bH * 0.36, 0);
      modelGroup.add(grilleMesh);

      // Horizontal grille slats
      for (let i = 0; i < 4; i++) {
        const slatGeo = new THREE.BoxGeometry(bW * 0.025, bH * 0.02, bW * 0.5);
        const slatMesh = new THREE.Mesh(slatGeo, chromeMat);
        slatMesh.position.set(bL / 2 + 0.012, bH * 0.22 + i * bH * 0.065, 0);
        modelGroup.add(slatMesh);
      }

      // Front bumper
      const bumperFGeo = new THREE.BoxGeometry(bW * 0.06, bH * 0.18, bW * 0.96);
      const bumperFMesh = new THREE.Mesh(bumperFGeo, carMat);
      bumperFMesh.position.set(bL / 2 + 0.02, bH * 0.1, 0);
      bumperFMesh.castShadow = true;
      modelGroup.add(bumperFMesh);

      // Rear bumper
      const bumperRGeo = new THREE.BoxGeometry(bW * 0.06, bH * 0.18, bW * 0.96);
      const bumperRMesh = new THREE.Mesh(bumperRGeo, carMat);
      bumperRMesh.position.set(-bL / 2 - 0.02, bH * 0.1, 0);
      bumperRMesh.castShadow = true;
      modelGroup.add(bumperRMesh);

      // ── DOOR PANELS & LINES ───────────────────────────────────────────────────
      [-1, 1].forEach((side) => {
        // Decorative chrome side strip
        const stripGeo = new THREE.BoxGeometry(bL * 0.78, bH * 0.018, bW * 0.015);
        const stripMesh = new THREE.Mesh(stripGeo, chromeMat);
        stripMesh.position.set(0, bH * 0.52, side * (bW / 2 + 0.001));
        modelGroup.add(stripMesh);

        // Side mirror housing
        const mirrorGeo = new THREE.BoxGeometry(bW * 0.08, bH * 0.1, bW * 0.12);
        const mirrorMesh = new THREE.Mesh(mirrorGeo, carMat);
        mirrorMesh.position.set(bL * 0.26, bH * 0.96, side * (bW / 2 + 0.07));
        mirrorMesh.castShadow = true;
        modelGroup.add(mirrorMesh);
      });

      // ── WHEELS ────────────────────────────────────────────────────────────────
      const wheelR = S(isSUV ? 0.37 : 0.32);
      const wheelW = S(0.22);
      const axleY = wheelR * 0.98;
      const wheelPositions = [
        [bL * 0.32, axleY, bW / 2 + wheelW * 0.5],
        [bL * 0.32, axleY, -(bW / 2 + wheelW * 0.5)],
        [-bL * 0.28, axleY, bW / 2 + wheelW * 0.5],
        [-bL * 0.28, axleY, -(bW / 2 + wheelW * 0.5)],
      ];

      wheelPositions.forEach(([wx, wy, wz]) => {
        // Tyre
        const tyreGeo = new THREE.TorusGeometry(wheelR, wheelW * 0.42, 18, 48);
        const tyreMesh = new THREE.Mesh(tyreGeo, tireMat);
        tyreMesh.position.set(wx, wy, wz);
        tyreMesh.rotation.y = Math.PI / 2;
        tyreMesh.castShadow = true;
        modelGroup.add(tyreMesh);

        // Rim disc
        const rimDiscGeo = new THREE.CylinderGeometry(wheelR * 0.78, wheelR * 0.78, wheelW * 0.12, 36);
        const rimDiscMesh = new THREE.Mesh(rimDiscGeo, rimMat);
        rimDiscMesh.position.set(wx, wy, wz);
        rimDiscMesh.rotation.x = Math.PI / 2;
        rimDiscMesh.castShadow = true;
        modelGroup.add(rimDiscMesh);

        // Rim spokes (5-spoke design)
        for (let s = 0; s < 5; s++) {
          const angle = (s / 5) * Math.PI * 2;
          const spokeGeo = new THREE.BoxGeometry(wheelR * 0.14, wheelW * 0.16, wheelR * 0.62);
          const spokeMesh = new THREE.Mesh(spokeGeo, rimMat);
          spokeMesh.position.set(wx, wy, wz);
          spokeMesh.rotation.x = Math.PI / 2;
          spokeMesh.rotation.z = angle;
          spokeMesh.translateZ(wheelR * 0.28);
          modelGroup.add(spokeMesh);
        }

        // Centre cap
        const capGeo = new THREE.CylinderGeometry(wheelR * 0.14, wheelR * 0.14, wheelW * 0.18, 20);
        const capMesh = new THREE.Mesh(capGeo, chromeMat);
        capMesh.position.set(wx, wy, wz);
        capMesh.rotation.x = Math.PI / 2;
        modelGroup.add(capMesh);

        // Brake calliper (red accent)
        const calliperGeo = new THREE.BoxGeometry(wheelR * 0.22, wheelW * 0.35, wheelR * 0.28);
        const calliperMat = new THREE.MeshPhysicalMaterial({ color: '#c62828', roughness: 0.5, metalness: 0.6 });
        const calliperMesh = new THREE.Mesh(calliperGeo, calliperMat);
        calliperMesh.position.set(wx + wheelR * 0.48, wy, wz);
        modelGroup.add(calliperMesh);
      });

      // ── UNDERBODY / SILL ──────────────────────────────────────────────────────
      const sillGeo = new THREE.BoxGeometry(bL * 0.72, bH * 0.06, bW * 0.04);
      [-1, 1].forEach((side) => {
        const sillMesh = new THREE.Mesh(sillGeo, chromeMat);
        sillMesh.position.set(0, bH * 0.04, side * (bW / 2 - 0.01));
        modelGroup.add(sillMesh);
      });
    };

    // ── MERCEDES-BENZ S450 ────────────────────────────────────────────────────
    const createMercedesS450 = () => {
      buildCarBody({
        bodyColor: '#0d1117',    // Obsidian black
        accentColor: '#e8e8e8',
        glassColor: '#64b5f6',
        wheelColor: '#1a1a1a',
        rimColor: '#f5f5f5',
        bodyLength: 5.18,
        bodyWidth: 1.95,
        bodyHeight: 0.76,
        roofHeight: 0.72,
        roofRatio: 0.50,
        isSUV: false,
      });

      // Mercedes star grille badge
      const badgeGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.014, 32);
      const badgeMat = new THREE.MeshPhysicalMaterial({ color: '#e0e0e0', metalness: 1.0, roughness: 0.05 });
      const badge = new THREE.Mesh(badgeGeo, badgeMat);
      // Approximate front grille centre in normalised space
      badge.position.set(0.527, 0.17, 0);
      badge.rotation.x = Math.PI / 2;
      modelGroup.add(badge);
    };

    // ── BMW 730Li M SPORT ────────────────────────────────────────────────────
    const createBMW730Li = () => {
      buildCarBody({
        bodyColor: '#1b2838',    // Deep navy (M Sport)
        accentColor: '#d4af37',  // Gold chrome
        glassColor: '#90caf9',
        wheelColor: '#111111',
        rimColor: '#cccccc',
        bodyLength: 5.25,
        bodyWidth: 1.90,
        bodyHeight: 0.74,
        roofHeight: 0.70,
        roofRatio: 0.50,
        isSUV: false,
      });

      // BMW kidney grille (two vertical ovals)
      const scale = 1 / 5.25 * 2.2;
      const bW = 1.90 * scale;
      const bH = 0.74 * scale;
      const bL = 5.25 * scale;
      const kidneySizesX = [-bW * 0.12, bW * 0.12];
      const kidneySizesY = bH * 0.2;
      const kidneySizesZ = bW * 0.14;
      kidneySizesX.forEach((offsetZ) => {
        const kGeo = new THREE.BoxGeometry(bW * 0.025, kidneySizesY, kidneySizesZ);
        const kMat = new THREE.MeshPhysicalMaterial({ color: '#222', roughness: 0.2, metalness: 0.8 });
        const kMesh = new THREE.Mesh(kGeo, kMat);
        kMesh.position.set(bL / 2 + 0.015, bH * 0.42, offsetZ);
        modelGroup.add(kMesh);
      });
    };

    // ── AUDI Q8 S-LINE ────────────────────────────────────────────────────────
    const createAudiQ8 = () => {
      buildCarBody({
        bodyColor: '#2d2d2d',    // Daytona grey
        accentColor: '#c0c0c0',
        glassColor: '#80deea',
        wheelColor: '#0d0d0d',
        rimColor: '#e8e8e8',
        bodyLength: 4.99,
        bodyWidth: 1.99,
        bodyHeight: 0.90,       // Taller SUV stance
        roofHeight: 0.62,       // Sloped coupe roofline
        roofRatio: 0.54,
        isSUV: true,
      });

      // Audi Singleframe grille (large hexagonal front)
      const scale = 1 / 4.99 * 2.2;
      const bW = 1.99 * scale;
      const bH = 0.90 * scale;
      const bL = 4.99 * scale;

      const singleframeGeo = new THREE.BoxGeometry(bW * 0.035, bH * 0.36, bW * 0.72);
      const singleframeMat = new THREE.MeshPhysicalMaterial({ color: '#1a1a1a', roughness: 0.3, metalness: 0.9 });
      const singleframe = new THREE.Mesh(singleframeGeo, singleframeMat);
      singleframe.position.set(bL / 2 + 0.018, bH * 0.38, 0);
      modelGroup.add(singleframe);

      // Audi 4-ring badge
      const ringMat = new THREE.MeshPhysicalMaterial({ color: '#e0e0e0', metalness: 1.0, roughness: 0.04 });
      for (let r = 0; r < 4; r++) {
        const ringGeo = new THREE.TorusGeometry(0.038, 0.008, 12, 32);
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(bL / 2 + 0.022, bH * 0.46, -0.062 + r * 0.042);
        modelGroup.add(ringMesh);
      }
    };

    // ── ELECTRONICS MODELS ────────────────────────────────────────────────────

    const createIPhone = () => {
      // Body — titanium slab
      const bodyGeo = new THREE.BoxGeometry(0.72, 1.48, 0.075);
      {
        const pos = bodyGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
          const rx = Math.abs(x) / 0.36, ry = Math.abs(y) / 0.74;
          const bevel = Math.max(0, rx * rx + ry * ry - 0.72) * 0.06;
          pos.setXYZ(i, x * (1 - bevel * 0.2), y * (1 - bevel * 0.1), z);
        }
        bodyGeo.computeVertexNormals();
      }
      const bodyMat = new THREE.MeshPhysicalMaterial({
        color: '#1c1c1e', roughness: 0.08, metalness: 0.9,
        clearcoat: 1.0, clearcoatRoughness: 0.05,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true;
      modelGroup.add(body);

      // Screen
      const screenTex = makeCanvasTexture((ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#0a0a0f'); g.addColorStop(0.5, '#1a1a2e'); g.addColorStop(1, '#16213e');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#ffffff12';
        for (let i = 0; i < 6; i++) {
          ctx.fillRect(w * 0.08, h * (0.12 + i * 0.13), w * 0.84, h * 0.05);
        }
        ctx.fillStyle = '#4fc3f7'; ctx.beginPath();
        ctx.roundRect(w * 0.08, h * 0.78, w * 0.4, h * 0.08, 8); ctx.fill();
        ctx.fillStyle = '#ef9a9a'; ctx.beginPath();
        ctx.roundRect(w * 0.52, h * 0.78, w * 0.4, h * 0.08, 8); ctx.fill();
      }, 512, 1024);
      const screenGeo = new THREE.PlaneGeometry(0.66, 1.38);
      const screenMat = new THREE.MeshPhysicalMaterial({
        map: screenTex, roughness: 0.0, metalness: 0.0,
        emissive: '#111122', emissiveIntensity: 0.35,
      });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.z = 0.039; modelGroup.add(screen);

      // Dynamic Island notch
      const notchGeo = new THREE.CapsuleGeometry(0.028, 0.09, 8, 16);
      const notchMat = new THREE.MeshPhysicalMaterial({ color: '#000000', roughness: 0.2 });
      const notch = new THREE.Mesh(notchGeo, notchMat);
      notch.position.set(0, 0.62, 0.041);
      notch.rotation.z = Math.PI / 2; modelGroup.add(notch);

      // Camera bump (triple lens)
      const bumpGeo = new THREE.BoxGeometry(0.28, 0.28, 0.022);
      const bumpMat = new THREE.MeshPhysicalMaterial({ color: '#2a2a2e', roughness: 0.2, metalness: 0.8 });
      const bump = new THREE.Mesh(bumpGeo, bumpMat);
      bump.position.set(-0.16, 0.5, -0.047); modelGroup.add(bump);
      const lensMat = new THREE.MeshPhysicalMaterial({ color: '#111', roughness: 0.05, metalness: 0.3, clearcoat: 1.0 });
      [[0, 0.07], [0.08, -0.04], [-0.08, -0.04]].forEach(([lx, ly]) => {
        const lGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.025, 24);
        const l = new THREE.Mesh(lGeo, lensMat);
        l.position.set(-0.16 + lx, 0.5 + ly, -0.057);
        l.rotation.x = Math.PI / 2; modelGroup.add(l);
        const ringGeo = new THREE.TorusGeometry(0.038, 0.006, 8, 24);
        const ringMat2 = new THREE.MeshPhysicalMaterial({ color: '#888', metalness: 1, roughness: 0.1 });
        const ring = new THREE.Mesh(ringGeo, ringMat2);
        ring.position.copy(l.position); ring.rotation.x = Math.PI / 2; modelGroup.add(ring);
      });

      // Side buttons (titanium)
      const btnMat = new THREE.MeshPhysicalMaterial({ color: '#8e8e93', metalness: 0.9, roughness: 0.15 });
      [0.54, 0.38, 0.22].forEach(y => {
        const bG = new THREE.BoxGeometry(0.012, 0.06, 0.04);
        const b = new THREE.Mesh(bG, btnMat);
        b.position.set(0.368, y, 0); modelGroup.add(b);
      });
      const volG = new THREE.BoxGeometry(0.012, 0.1, 0.04);
      const v1 = new THREE.Mesh(volG, btnMat); v1.position.set(-0.368, 0.42, 0); modelGroup.add(v1);
      const v2 = new THREE.Mesh(volG, btnMat); v2.position.set(-0.368, 0.28, 0); modelGroup.add(v2);
    };

    const createIPhoneX = () => {
      // Load GLB from Blender
      const loader = new GLTFLoader();
      loader.load(
        '/Blender/iphone X.glb',
        (gltf) => {
          if (isCancelled) return;
          const model = gltf.scene;

          // Fit model into view
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2.2 / maxDim;
          model.scale.setScalar(scale);
          model.position.sub(center.multiplyScalar(scale));

          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          modelGroup.add(model);
          setLoading(false);
        },
        undefined,
        (err) => { console.error('GLB load error:', err); setLoading(false); }
      );
    };

    const createSamsungPhone = () => {
      // Body — glossy phantom black
      const bodyGeo = new THREE.BoxGeometry(0.74, 1.56, 0.072);
      const bodyMat = new THREE.MeshPhysicalMaterial({
        color: '#0a0a10', roughness: 0.06, metalness: 0.7,
        clearcoat: 1.0, clearcoatRoughness: 0.03,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true; modelGroup.add(body);

      // Screen — punch-hole AMOLED
      const screenTex = makeCanvasTexture((ctx, w, h) => {
        const g = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w);
        g.addColorStop(0, '#0d1117'); g.addColorStop(1, '#050508');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#1565c030';
        for (let i = 0; i < 5; i++) {
          ctx.fillRect(w*0.06, h*(0.1+i*0.14), w*0.88, h*0.06);
        }
        ctx.fillStyle = '#7c4dff'; ctx.beginPath();
        ctx.roundRect(w*0.06, h*0.82, w*0.6, h*0.09, 10); ctx.fill();
        ctx.fillStyle = '#ffffff20'; ctx.beginPath();
        ctx.roundRect(w*0.7, h*0.82, w*0.24, h*0.09, 10); ctx.fill();
      }, 512, 1024);
      const screenGeo = new THREE.PlaneGeometry(0.70, 1.50);
      const screenMat = new THREE.MeshPhysicalMaterial({
        map: screenTex, roughness: 0.0,
        emissive: '#0d0820', emissiveIntensity: 0.4,
      });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.z = 0.037; modelGroup.add(screen);

      // Punch-hole camera
      const holeGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.01, 20);
      const holeMat = new THREE.MeshPhysicalMaterial({ color: '#000', roughness: 0.1 });
      const hole = new THREE.Mesh(holeGeo, holeMat);
      hole.position.set(0, 0.68, 0.038); hole.rotation.x = Math.PI/2; modelGroup.add(hole);

      // Rear camera island (large horizontal bar)
      const islandGeo = new THREE.BoxGeometry(0.52, 0.22, 0.018);
      const islandMat = new THREE.MeshPhysicalMaterial({ color: '#111118', roughness: 0.15, metalness: 0.7 });
      const island = new THREE.Mesh(islandGeo, islandMat);
      island.position.set(-0.06, 0.56, -0.045); modelGroup.add(island);
      const lensMat = new THREE.MeshPhysicalMaterial({ color: '#080808', roughness: 0.02, clearcoat: 1 });
      [[-0.16,0],[0,0],[0.16,0]].forEach(([lx,ly]) => {
        const lG = new THREE.CylinderGeometry(0.042, 0.042, 0.022, 24);
        const l = new THREE.Mesh(lG, lensMat);
        l.position.set(-0.06+lx, 0.56+ly, -0.055);
        l.rotation.x = Math.PI/2; modelGroup.add(l);
      });

      // S-Pen slot at bottom
      const penGeo = new THREE.BoxGeometry(0.018, 0.62, 0.018);
      const penMat = new THREE.MeshPhysicalMaterial({ color: '#1a1a2e', roughness: 0.4 });
      const pen = new THREE.Mesh(penGeo, penMat);
      pen.position.set(0.33, -0.48, 0); modelGroup.add(pen);
    };

    const createMacBook = () => {
      // Base (keyboard deck)
      const baseGeo = new THREE.BoxGeometry(2.2, 0.045, 1.52);
      const alMat = new THREE.MeshPhysicalMaterial({
        color: '#1d1d1f', roughness: 0.18, metalness: 0.88,
        clearcoat: 0.6, clearcoatRoughness: 0.1,
      });
      const base = new THREE.Mesh(baseGeo, alMat);
      base.position.y = 0; base.castShadow = true; modelGroup.add(base);

      // Keyboard area
      const kbTex = makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#111'; ctx.fillRect(0,0,w,h);
        ctx.fillStyle = '#1a1a1a';
        const cols = 13;
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < cols; c++) {
            const kw = r===4 ? w*0.38 : w*0.068, kh = h*0.13;
            const kx = r===4 ? w*0.31 : w*(0.04 + c*0.074);
            const ky = h*(0.08 + r*0.19);
            ctx.fillStyle = '#282828';
            ctx.beginPath(); ctx.roundRect(kx, ky, kw-3, kh-3, 3); ctx.fill();
          }
        }
        ctx.fillStyle = '#ffffff18';
        ctx.fillRect(w*0.04, h*0.04, w*0.92, h*0.03);
      }, 512, 256);
      const kbGeo = new THREE.PlaneGeometry(1.8, 1.1);
      const kbMat = new THREE.MeshPhysicalMaterial({ map: kbTex, roughness: 0.6 });
      const kb = new THREE.Mesh(kbGeo, kbMat);
      kb.rotation.x = -Math.PI/2; kb.position.set(0, 0.024, 0.1); modelGroup.add(kb);

      // Trackpad
      const tpGeo = new THREE.BoxGeometry(0.52, 0.005, 0.34);
      const tpMat = new THREE.MeshPhysicalMaterial({ color: '#222', roughness: 0.08, metalness: 0.3 });
      const tp = new THREE.Mesh(tpGeo, tpMat);
      tp.position.set(0, 0.024, 0.52); modelGroup.add(tp);

      // Lid — open at ~105°
      const lidGroup = new THREE.Group();
      const lidGeo = new THREE.BoxGeometry(2.2, 0.032, 1.52);
      const lid = new THREE.Mesh(lidGeo, alMat);
      lid.castShadow = true; lidGroup.add(lid);

      // Retina XDR screen
      const screenTex = makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#000'; ctx.fillRect(0,0,w,h);
        const g = ctx.createLinearGradient(0,0,w,h);
        g.addColorStop(0,'#0a0015'); g.addColorStop(0.5,'#001a0a'); g.addColorStop(1,'#0a0500');
        ctx.fillStyle = g; ctx.fillRect(w*0.03,h*0.04,w*0.94,h*0.88);
        ctx.fillStyle = '#ffffff'; ctx.font = `bold ${h*0.06}px sans-serif`;
        ctx.fillText('MacBook Pro', w*0.28, h*0.28);
        ctx.fillStyle = '#a8ff78'; ctx.font = `${h*0.04}px sans-serif`;
        ctx.fillText('M3 Pro • 18h battery', w*0.22, h*0.42);
        ctx.fillStyle = '#ffffff30';
        for (let i=0;i<4;i++) ctx.fillRect(w*0.08, h*(0.52+i*0.1), w*0.84, h*0.04);
      }, 1024, 640);
      const sGeo = new THREE.PlaneGeometry(2.1, 1.42);
      const sMat = new THREE.MeshPhysicalMaterial({
        map: screenTex, roughness: 0.0,
        emissive: '#0a0505', emissiveIntensity: 0.5,
      });
      const s = new THREE.Mesh(sGeo, sMat);
      s.position.set(0, 0, -0.016); s.rotation.y = Math.PI; lidGroup.add(s);

      // Apple logo on back
      const logoGeo = new THREE.CircleGeometry(0.12, 32);
      const logoMat = new THREE.MeshPhysicalMaterial({ color: '#888', metalness: 0.9, roughness: 0.1 });
      const logo = new THREE.Mesh(logoGeo, logoMat);
      logo.position.set(0, 0, 0.017); lidGroup.add(logo);

      lidGroup.position.set(0, 0.016, -0.76);
      lidGroup.rotation.x = -Math.PI * 0.58; // ~105° open
      modelGroup.add(lidGroup);

      // Hinge
      const hingeGeo = new THREE.CylinderGeometry(0.022, 0.022, 2.1, 16);
      const hingeMat = new THREE.MeshPhysicalMaterial({ color: '#555', metalness: 0.95, roughness: 0.1 });
      const hinge = new THREE.Mesh(hingeGeo, hingeMat);
      hinge.rotation.z = Math.PI/2; hinge.position.set(0, 0.02, -0.75); modelGroup.add(hinge);
    };

    const createSonyCamera = () => {
      // Main body
      const bodyGeo = new THREE.BoxGeometry(1.32, 0.92, 0.82);
      const bodyMat = new THREE.MeshPhysicalMaterial({
        color: '#1a1a1a', roughness: 0.45, metalness: 0.6,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true; body.receiveShadow = true; modelGroup.add(body);

      // Grip bump (right side)
      const gripGeo = new THREE.BoxGeometry(0.32, 0.88, 0.86);
      {
        const pos = gripGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), z = pos.getZ(i);
          pos.setX(i, x + Math.sin((z+0.43)/0.86*Math.PI)*0.06);
        }
        gripGeo.computeVertexNormals();
      }
      const grip = new THREE.Mesh(gripGeo, bodyMat);
      grip.position.set(0.52, -0.02, 0); grip.castShadow = true; modelGroup.add(grip);

      // Top deck
      const topGeo = new THREE.BoxGeometry(1.32, 0.06, 0.82);
      const topMat = new THREE.MeshPhysicalMaterial({ color: '#222', roughness: 0.35, metalness: 0.7 });
      const top = new THREE.Mesh(topGeo, topMat);
      top.position.y = 0.49; modelGroup.add(top);

      // Shutter button
      const shutterGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.035, 20);
      const shutterMat = new THREE.MeshPhysicalMaterial({ color: '#cc3300', roughness: 0.4 });
      const shutter = new THREE.Mesh(shutterGeo, shutterMat);
      shutter.position.set(0.42, 0.525, 0.18); modelGroup.add(shutter);

      // Mode dial
      const dialGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.038, 20);
      const dialMat = new THREE.MeshPhysicalMaterial({ color: '#333', roughness: 0.3, metalness: 0.6 });
      const dial = new THREE.Mesh(dialGeo, dialMat);
      dial.position.set(0.16, 0.528, 0.16); modelGroup.add(dial);

      // Lens mount — large circle on front
      const mountRingGeo = new THREE.TorusGeometry(0.32, 0.04, 16, 48);
      const mountMat = new THREE.MeshPhysicalMaterial({ color: '#444', metalness: 0.9, roughness: 0.15 });
      const mountRing = new THREE.Mesh(mountRingGeo, mountMat);
      mountRing.position.set(-0.08, 0, 0.415); modelGroup.add(mountRing);

      // Lens barrel
      const lensGeo = new THREE.CylinderGeometry(0.28, 0.3, 0.62, 40);
      const lensMat2 = new THREE.MeshPhysicalMaterial({ color: '#1c1c1c', roughness: 0.25, metalness: 0.8 });
      const lens = new THREE.Mesh(lensGeo, lensMat2);
      lens.rotation.x = Math.PI/2; lens.position.set(-0.08, 0, 0.72); lens.castShadow = true; modelGroup.add(lens);

      // Front glass element
      const glassGeo = new THREE.CircleGeometry(0.21, 40);
      const glassMat2 = new THREE.MeshPhysicalMaterial({
        color: '#0a0a1a', roughness: 0.0, metalness: 0.1,
        transmission: 0.5, clearcoat: 1.0,
      });
      const glass = new THREE.Mesh(glassGeo, glassMat2);
      glass.position.set(-0.08, 0, 1.025); modelGroup.add(glass);

      // Zoom ring
      const zoomGeo = new THREE.CylinderGeometry(0.305, 0.305, 0.16, 40);
      const zoomMat = new THREE.MeshPhysicalMaterial({ color: '#252525', roughness: 0.5, metalness: 0.5 });
      const zoom = new THREE.Mesh(zoomGeo, zoomMat);
      zoom.rotation.x = Math.PI/2; zoom.position.set(-0.08, 0, 0.56); modelGroup.add(zoom);

      // Viewfinder hump
      const vfGeo = new THREE.BoxGeometry(0.22, 0.16, 0.26);
      const vf = new THREE.Mesh(vfGeo, topMat);
      vf.position.set(-0.28, 0.54, -0.15); modelGroup.add(vf);

      // LCD screen on back
      const lcdGeo = new THREE.PlaneGeometry(0.58, 0.38);
      const lcdMat = new THREE.MeshPhysicalMaterial({
        color: '#0a0a1e', roughness: 0.05,
        emissive: '#0a0a1e', emissiveIntensity: 0.4,
      });
      const lcd = new THREE.Mesh(lcdGeo, lcdMat);
      lcd.position.set(-0.12, -0.08, -0.415); lcd.rotation.y = Math.PI; modelGroup.add(lcd);
    };

    const createAirPods = () => {
      // Case
      const caseGeo = new THREE.BoxGeometry(0.68, 0.78, 0.32);
      {
        const pos = caseGeo.attributes.position;
        for (let i=0;i<pos.count;i++) {
          const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
          const rx=Math.abs(x)/0.34, ry=Math.abs(y)/0.39;
          const r=Math.sqrt(rx*rx+ry*ry);
          const bevel=Math.max(0,r-0.82)*0.14;
          pos.setXYZ(i,x*(1-bevel),y*(1-bevel),z);
        }
        caseGeo.computeVertexNormals();
      }
      const caseMat = new THREE.MeshPhysicalMaterial({
        color: '#f5f5f7', roughness: 0.12, metalness: 0.0,
        clearcoat: 0.8, clearcoatRoughness: 0.08,
      });
      const caseBody = new THREE.Mesh(caseGeo, caseMat);
      caseBody.position.y = -0.32; caseBody.castShadow = true; modelGroup.add(caseBody);

      // Case lid hinge line
      const hingeGeo = new THREE.BoxGeometry(0.66, 0.008, 0.32);
      const hingeMat2 = new THREE.MeshPhysicalMaterial({ color: '#ddd', roughness: 0.3 });
      const hingeLine = new THREE.Mesh(hingeGeo, hingeMat2);
      hingeLine.position.set(0, -0.01, 0); modelGroup.add(hingeLine);

      // USB-C port
      const portGeo = new THREE.BoxGeometry(0.12, 0.025, 0.012);
      const portMat = new THREE.MeshPhysicalMaterial({ color: '#bbb', metalness: 0.9 });
      const port = new THREE.Mesh(portGeo, portMat);
      port.position.set(0, -0.71, -0.161); modelGroup.add(port);

      // Two AirPods inside (case open, lids at top)
      const podMat = new THREE.MeshPhysicalMaterial({
        color: '#f5f5f7', roughness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.05,
      });
      [-0.16, 0.16].forEach((xOff) => {
        // Earbud head
        const headGeo = new THREE.SphereGeometry(0.1, 20, 20);
        const head = new THREE.Mesh(headGeo, podMat);
        head.position.set(xOff, 0.26, 0); head.castShadow = true; modelGroup.add(head);

        // Stem
        const stemGeo = new THREE.CylinderGeometry(0.028, 0.022, 0.32, 12);
        const stem = new THREE.Mesh(stemGeo, podMat);
        stem.position.set(xOff, 0.08, 0); stem.castShadow = true; modelGroup.add(stem);

        // Speaker mesh dot
        const dotGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.006, 12);
        const dotMat = new THREE.MeshPhysicalMaterial({ color: '#ccc', roughness: 0.6 });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.set(xOff, 0.015, 0); dot.rotation.x = Math.PI/2; modelGroup.add(dot);
      });

      // Status LED
      const ledGeo = new THREE.SphereGeometry(0.018, 12, 12);
      const ledMat = new THREE.MeshPhysicalMaterial({ color: '#00ff88', emissive: '#00ff88', emissiveIntensity: 1.2 });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(0, -0.32, 0.162); modelGroup.add(led);
    };

    const createLGTV = () => {
      // Screen panel
      const screenW = 2.8, screenH = 1.6;
      const panelGeo = new THREE.BoxGeometry(screenW, screenH, 0.028);
      const panelMat = new THREE.MeshPhysicalMaterial({
        color: '#080808', roughness: 0.04, metalness: 0.1,
        clearcoat: 0.5,
      });
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.castShadow = true; modelGroup.add(panel);

      // OLED display content
      const displayTex = makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#000'; ctx.fillRect(0,0,w,h);
        const g = ctx.createLinearGradient(0,0,w,h);
        g.addColorStop(0,'#0d0d2b'); g.addColorStop(0.4,'#0a1628'); g.addColorStop(1,'#0d0d0d');
        ctx.fillStyle = g; ctx.fillRect(w*0.01,h*0.015,w*0.98,h*0.97);
        // Abstract content
        ctx.fillStyle = '#1565c0';
        ctx.fillRect(w*0.04, h*0.06, w*0.56, h*0.58);
        ctx.fillStyle = '#0277bd';
        ctx.fillRect(w*0.62, h*0.06, w*0.34, h*0.28);
        ctx.fillStyle = '#01579b';
        ctx.fillRect(w*0.62, h*0.36, w*0.34, h*0.28);
        // Bottom bar
        ctx.fillStyle = '#ffffff10';
        ctx.fillRect(w*0.04, h*0.68, w*0.92, h*0.08);
        ctx.fillStyle = '#4fc3f7';
        ctx.fillRect(w*0.04, h*0.68, w*0.35, h*0.08);
      }, 1024, 576);
      const displayGeo = new THREE.PlaneGeometry(screenW - 0.08, screenH - 0.06);
      const displayMat = new THREE.MeshPhysicalMaterial({
        map: displayTex, roughness: 0.0,
        emissive: '#050510', emissiveIntensity: 0.6,
      });
      const display = new THREE.Mesh(displayGeo, displayMat);
      display.position.z = 0.015; modelGroup.add(display);

      // Thin bezel frame
      const bezelMat = new THREE.MeshPhysicalMaterial({ color: '#0a0a0a', roughness: 0.3, metalness: 0.5 });
      [[screenW*0.5,0,0.015,0.036,screenH+0.04,0.028],[-(screenW*0.5),0,0.015,0.036,screenH+0.04,0.028],
       [0,screenH*0.5,0.015,screenW+0.04,0.036,0.028],[0,-(screenH*0.5),0.015,screenW+0.04,0.036,0.028]
      ].forEach(([bx,by,bz,bw,bhh,bd]) => {
        const bG = new THREE.BoxGeometry(bw,bhh,bd);
        const b = new THREE.Mesh(bG, bezelMat);
        b.position.set(bx,by,bz); modelGroup.add(b);
      });

      // Stand
      const standGeo = new THREE.BoxGeometry(0.08, 0.52, 0.18);
      const standMat = new THREE.MeshPhysicalMaterial({ color: '#111', roughness: 0.5, metalness: 0.5 });
      const stand = new THREE.Mesh(standGeo, standMat);
      stand.position.set(0, -(screenH/2+0.26), -0.06); modelGroup.add(stand);

      // Stand base
      const baseGeo = new THREE.BoxGeometry(0.72, 0.04, 0.32);
      const base = new THREE.Mesh(baseGeo, standMat);
      base.position.set(0, -(screenH/2+0.52), -0.06); modelGroup.add(base);
    };

    const createPS5 = () => {
      // Main body — iconic two-tone curved design
      const bodyMat = new THREE.MeshPhysicalMaterial({
        color: '#f0f0f2', roughness: 0.1, metalness: 0.02,
        clearcoat: 0.6,
      });
      const blackMat = new THREE.MeshPhysicalMaterial({
        color: '#111118', roughness: 0.2, metalness: 0.3,
      });
      const blueMat = new THREE.MeshPhysicalMaterial({
        color: '#003087', roughness: 0.15, metalness: 0.2,
        emissive: '#003087', emissiveIntensity: 0.08,
      });

      // Centre black core
      const coreGeo = new THREE.BoxGeometry(0.42, 1.68, 0.68);
      const core = new THREE.Mesh(coreGeo, blackMat);
      core.castShadow = true; modelGroup.add(core);

      // White side panels (curved)
      [-1,1].forEach(side => {
        const panelGeo = new THREE.BoxGeometry(0.22, 1.78, 0.62);
        {
          const pos = panelGeo.attributes.position;
          for (let i=0;i<pos.count;i++) {
            const x=pos.getX(i), y=pos.getY(i);
            const yRel = y/0.89;
            const curve = Math.sin(Math.abs(yRel)*Math.PI)*0.08;
            pos.setX(i, x + side*curve);
          }
          panelGeo.computeVertexNormals();
        }
        const panel = new THREE.Mesh(panelGeo, bodyMat);
        panel.position.set(side*0.32, 0, 0);
        panel.castShadow = true; modelGroup.add(panel);
      });

      // Disc drive slot
      const slotGeo = new THREE.BoxGeometry(0.012, 0.9, 0.008);
      const slotMat = new THREE.MeshPhysicalMaterial({ color: '#222', roughness: 0.8 });
      const slot = new THREE.Mesh(slotGeo, slotMat);
      slot.position.set(0.22, 0.1, 0.34); modelGroup.add(slot);

      // USB ports
      [[0.22,0.42,0.34],[0.22,0.26,0.34]].forEach(([px,py,pz]) => {
        const uGeo = new THREE.BoxGeometry(0.012, 0.06, 0.04);
        const uMat = new THREE.MeshPhysicalMaterial({ color: '#1a1a1a' });
        const u = new THREE.Mesh(uGeo, uMat);
        u.position.set(px,py,pz); modelGroup.add(u);
      });

      // PS logo / light bar
      const lightBarGeo = new THREE.BoxGeometry(0.008, 0.88, 0.02);
      const lightBar = new THREE.Mesh(lightBarGeo, blueMat);
      lightBar.position.set(0.216, 0, 0.36); modelGroup.add(lightBar);

      // Stand base
      const standGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.045, 32);
      const standMat = new THREE.MeshPhysicalMaterial({ color: '#e8e8ea', roughness: 0.2 });
      const standBase = new THREE.Mesh(standGeo, standMat);
      standBase.position.set(0, -0.89, 0); modelGroup.add(standBase);
    };

    const createGarminWatch = () => {
      // Case — rugged titanium
      const caseGeo = new THREE.CylinderGeometry(0.52, 0.5, 0.18, 48);
      const caseMat = new THREE.MeshPhysicalMaterial({
        color: '#4a4a4e', roughness: 0.25, metalness: 0.85,
        clearcoat: 0.3,
      });
      const watchCase = new THREE.Mesh(caseGeo, caseMat);
      watchCase.castShadow = true; modelGroup.add(watchCase);

      // Bezel ring (slightly larger, textured)
      const bezelGeo = new THREE.TorusGeometry(0.52, 0.055, 12, 60);
      const bezelMat = new THREE.MeshPhysicalMaterial({ color: '#333', roughness: 0.5, metalness: 0.7 });
      const bezel = new THREE.Mesh(bezelGeo, bezelMat);
      modelGroup.add(bezel);

      // Watch face display
      const faceTex = makeCanvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#000'; ctx.arc(w/2,h/2,w/2,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(w/2,h/2,w*0.46,0,Math.PI*2);
        const g = ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w*0.46);
        g.addColorStop(0,'#0a0a1a'); g.addColorStop(1,'#050510');
        ctx.fillStyle = g; ctx.fill();
        // Tick marks
        ctx.strokeStyle='#4fc3f760'; ctx.lineWidth=3;
        for(let i=0;i<12;i++){
          const a=(i/12)*Math.PI*2-Math.PI/2;
          ctx.beginPath();
          ctx.moveTo(w/2+Math.cos(a)*w*0.38, h/2+Math.sin(a)*w*0.38);
          ctx.lineTo(w/2+Math.cos(a)*w*0.44, h/2+Math.sin(a)*w*0.44);
          ctx.stroke();
        }
        // Digital readout
        ctx.fillStyle='#fff'; ctx.font=`bold ${w*0.2}px monospace`;
        ctx.textAlign='center'; ctx.fillText('10:08', w/2, h*0.46);
        ctx.font=`${w*0.08}px sans-serif`;
        ctx.fillStyle='#4fc3f7'; ctx.fillText('Thu 29 May', w/2, h*0.58);
        // Heart rate
        ctx.fillStyle='#ef5350'; ctx.font=`${w*0.1}px monospace`;
        ctx.fillText('♥ 72', w*0.28, h*0.74);
        ctx.fillStyle='#66bb6a'; ctx.fillText('GPS', w*0.72, h*0.74);
      }, 512, 512);
      const faceGeo = new THREE.CircleGeometry(0.47, 48);
      const faceMat = new THREE.MeshPhysicalMaterial({
        map: faceTex, roughness: 0.0,
        emissive: '#050510', emissiveIntensity: 0.5,
      });
      const face = new THREE.Mesh(faceGeo, faceMat);
      face.position.y = 0.092; face.rotation.x = -Math.PI/2; modelGroup.add(face);

      // Side buttons (3 on right)
      const btnMat2 = new THREE.MeshPhysicalMaterial({ color: '#555', metalness: 0.8, roughness: 0.2 });
      [0.08,-0.02,-0.12].forEach(y => {
        const bG = new THREE.BoxGeometry(0.062, 0.05, 0.12);
        const b = new THREE.Mesh(bG, btnMat2);
        b.position.set(0.565, y, 0); modelGroup.add(b);
      });
      // Left button
      const lbG = new THREE.BoxGeometry(0.062,0.07,0.12);
      const lb = new THREE.Mesh(lbG, btnMat2);
      lb.position.set(-0.565, 0.02, 0); modelGroup.add(lb);

      // Strap (silicone band)
      const strapMat = new THREE.MeshPhysicalMaterial({ color: '#1a1a1a', roughness: 0.7 });
      ['top','bottom'].forEach((_side,idx) => {
        const sGeo = new THREE.BoxGeometry(0.44, 0.88, 0.055);
        const strap = new THREE.Mesh(sGeo, strapMat);
        strap.position.set(0, idx===0 ? 0.62 : -0.62, 0);
        strap.castShadow = true; modelGroup.add(strap);
      });
      // Strap buckle
      const buckleGeo = new THREE.TorusGeometry(0.1, 0.018, 8, 20);
      const buckleMat = new THREE.MeshPhysicalMaterial({ color: '#888', metalness: 0.9 });
      const buckle = new THREE.Mesh(buckleGeo, buckleMat);
      buckle.position.set(0, -1.28, 0); modelGroup.add(buckle);
    };

    // ── PROCESSED FOOD MODELS ─────────────────────────────────────────────────

    const createIbericoHam = () => {
      // Whole leg shape — tapered bone-in leg
      const legGeo = new THREE.CylinderGeometry(0.28, 0.62, 2.0, 32, 8);
      {
        const pos = legGeo.attributes.position;
        for (let i=0;i<pos.count;i++) {
          const x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i);
          const yRel=(y+1)/2;
          const bulge=Math.sin(yRel*Math.PI)*0.12;
          const angle=Math.atan2(z,x);
          const flatSide=1-Math.abs(Math.cos(angle))*0.18;
          pos.setXYZ(i,x*(flatSide+bulge*0.3),y,z*(flatSide+bulge*0.3));
        }
        legGeo.computeVertexNormals();
      }
      const hamTex = makeCanvasTexture((ctx, w, h) => {
        const g = ctx.createLinearGradient(0,0,w,h);
        g.addColorStop(0,'#4a0e0e'); g.addColorStop(0.3,'#6d1a1a'); g.addColorStop(0.6,'#8b2020'); g.addColorStop(1,'#3d0a0a');
        ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
        // Marbling fat streaks
        ctx.globalAlpha=0.3;
        ctx.strokeStyle='#f5deb3'; ctx.lineWidth=2;
        for(let i=0;i<30;i++){
          ctx.beginPath();
          ctx.moveTo(Math.random()*w, Math.random()*h);
          ctx.bezierCurveTo(Math.random()*w,Math.random()*h,Math.random()*w,Math.random()*h,Math.random()*w,Math.random()*h);
          ctx.stroke();
        }
        ctx.globalAlpha=0.15; ctx.fillStyle='#f5deb3';
        for(let i=0;i<200;i++) { ctx.beginPath(); ctx.arc(Math.random()*w,Math.random()*h,1+Math.random()*3,0,Math.PI*2); ctx.fill(); }
      }, 512, 512);
      const hamMat = new THREE.MeshPhysicalMaterial({
        map: hamTex, roughness: 0.62, metalness: 0.0,
        clearcoat: 0.15, clearcoatRoughness: 0.4,
      });
      const leg = new THREE.Mesh(legGeo, hamMat);
      leg.rotation.z = Math.PI*0.08; leg.rotation.x = Math.PI*0.06;
      leg.castShadow = true; leg.receiveShadow = true; modelGroup.add(leg);

      // Bone end
      const boneGeo = new THREE.CylinderGeometry(0.045, 0.06, 0.52, 14);
      const boneMat = new THREE.MeshPhysicalMaterial({ color: '#f5f0e8', roughness: 0.5 });
      const bone = new THREE.Mesh(boneGeo, boneMat);
      bone.position.set(0.04, 1.1, 0); bone.rotation.z = Math.PI*0.08; modelGroup.add(bone);

      // Hoof stub
      const hoofGeo = new THREE.BoxGeometry(0.1, 0.18, 0.08);
      const hoofMat = new THREE.MeshPhysicalMaterial({ color: '#1a0a00', roughness: 0.8 });
      const hoof = new THREE.Mesh(hoofGeo, hoofMat);
      hoof.position.set(0.06, 1.42, 0); modelGroup.add(hoof);

      // 2 slices of ham lying in front
      const sliceTex = makeCanvasTexture((ctx,w,h) => {
        const g=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w*0.48);
        g.addColorStop(0,'#c0392b'); g.addColorStop(0.5,'#922b21'); g.addColorStop(1,'#6e1010');
        ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(w/2,h/2,w*0.46,h*0.44,0,0,Math.PI*2); ctx.fill();
        ctx.globalAlpha=0.35; ctx.fillStyle='#f9e4b7';
        for(let i=0;i<15;i++){
          ctx.beginPath();
          ctx.moveTo(Math.random()*w,Math.random()*h);
          ctx.lineTo(Math.random()*w,Math.random()*h);
          ctx.strokeStyle='#f9e4b7'; ctx.lineWidth=2; ctx.stroke();
        }
      },256,256);
      const sliceMat = new THREE.MeshPhysicalMaterial({ map: sliceTex, roughness: 0.55, side: THREE.DoubleSide });
      [-0.45,0.45].forEach((xOff,idx) => {
        const sGeo = new THREE.CylinderGeometry(0.38,0.38,0.022,32);
        const s = new THREE.Mesh(sGeo, sliceMat);
        s.position.set(xOff + (idx*0.1), -0.98, 0.3+idx*0.06);
        s.rotation.x = Math.PI/2; s.rotation.z = Math.random()*0.3-0.15;
        modelGroup.add(s);
      });
    };

    const createWineBottle = () => {
      // Bottle silhouette using lathe
      const bottlePoints = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.14, 0),
        new THREE.Vector2(0.15, 0.06),
        new THREE.Vector2(0.155, 0.22),
        new THREE.Vector2(0.148, 0.36),
        new THREE.Vector2(0.15, 0.55),
        new THREE.Vector2(0.152, 0.80),
        new THREE.Vector2(0.142, 0.96),
        new THREE.Vector2(0.10, 1.1),
        new THREE.Vector2(0.065, 1.26),
        new THREE.Vector2(0.062, 1.44),
        new THREE.Vector2(0.066, 1.55),
        new THREE.Vector2(0.058, 1.60),
        new THREE.Vector2(0.048, 1.68),
        new THREE.Vector2(0.046, 1.74),
        new THREE.Vector2(0.05, 1.76),
        new THREE.Vector2(0.046, 1.82),
        new THREE.Vector2(0, 1.82),
      ];
      const bottleGeo = new THREE.LatheGeometry(bottlePoints, 40);
      const bottleMat = new THREE.MeshPhysicalMaterial({
        color: '#0d2b0d', roughness: 0.05, metalness: 0.0,
        transmission: 0.65, thickness: 0.3,
        clearcoat: 1.0, clearcoatRoughness: 0.04,
        transparent: true, opacity: 0.88,
      });
      const bottle = new THREE.Mesh(bottleGeo, bottleMat);
      bottle.position.y = -0.9; bottle.castShadow = true; modelGroup.add(bottle);

      // Wine level inside (dark red plane)
      const wineGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.01, 32);
      const wineMat = new THREE.MeshPhysicalMaterial({ color: '#5d0000', roughness: 0.2, transparent: true, opacity: 0.8 });
      const wine = new THREE.Mesh(wineGeo, wineMat);
      wine.position.set(0, -0.9+0.56, 0); modelGroup.add(wine);

      // Label
      const labelTex = makeCanvasTexture((ctx,w,h) => {
        ctx.fillStyle='#f5f0e8'; ctx.fillRect(0,0,w,h);
        ctx.fillStyle='#8b0000'; ctx.font=`bold ${h*0.18}px serif`;
        ctx.textAlign='center'; ctx.fillText('CHÂTEAU',w/2,h*0.22);
        ctx.font=`bold ${h*0.28}px serif`;
        ctx.fillText('MARGAUX',w/2,h*0.46);
        ctx.fillStyle='#555'; ctx.font=`${h*0.1}px serif`;
        ctx.fillText('Grand Cru Classé — 2018',w/2,h*0.62);
        ctx.strokeStyle='#8b0000'; ctx.lineWidth=3;
        ctx.strokeRect(6,6,w-12,h-12);
      },256,320);
      const labelGeo = new THREE.CylinderGeometry(0.156, 0.156, 0.44, 32, 1, true, -0.8, Math.PI*1.3);
      const labelMat = new THREE.MeshPhysicalMaterial({ map: labelTex, roughness: 0.5, side: THREE.DoubleSide });
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.position.set(0, -0.9+0.36, 0); modelGroup.add(label);

      // Foil capsule (top)
      const foilGeo = new THREE.CylinderGeometry(0.054, 0.054, 0.12, 24);
      const foilMat = new THREE.MeshPhysicalMaterial({ color: '#8b0000', roughness: 0.35, metalness: 0.5 });
      const foil = new THREE.Mesh(foilGeo, foilMat);
      foil.position.set(0, -0.9+1.76, 0); modelGroup.add(foil);

      // Cork
      const corkGeo = new THREE.CylinderGeometry(0.044, 0.044, 0.06, 16);
      const corkMat = new THREE.MeshPhysicalMaterial({ color: '#c8a97a', roughness: 0.8 });
      const cork = new THREE.Mesh(corkGeo, corkMat);
      cork.position.set(0, -0.9+1.84, 0); modelGroup.add(cork);
    };

    const createCoffee = () => {
      // Cylindrical tin can
      const canGeo = new THREE.CylinderGeometry(0.5, 0.48, 1.1, 40);
      const canTex = makeCanvasTexture((ctx,w,h)=>{
        const g=ctx.createLinearGradient(0,0,0,h);
        g.addColorStop(0,'#1a0800'); g.addColorStop(0.3,'#3d1a00'); g.addColorStop(0.7,'#2d1200'); g.addColorStop(1,'#1a0800');
        ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
        ctx.fillStyle='#c8860a'; ctx.font=`bold ${h*0.16}px serif`;
        ctx.textAlign='center'; ctx.fillText('Cà Phê Chồn', w/2, h*0.28);
        ctx.font=`${h*0.09}px serif`; ctx.fillStyle='#e8c060';
        ctx.fillText('Robusta Nguyên Hạt', w/2, h*0.42);
        ctx.font=`${h*0.07}px sans-serif`; ctx.fillStyle='#aaa';
        ctx.fillText('Buôn Ma Thuột — 250g', w/2, h*0.72);
        ctx.strokeStyle='#c8860a60'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(0,h*0.18); ctx.lineTo(w,h*0.18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,h*0.82); ctx.lineTo(w,h*0.82); ctx.stroke();
      },512,512);
      const canMat = new THREE.MeshPhysicalMaterial({ map: canTex, roughness: 0.35, metalness: 0.55 });
      const can = new THREE.Mesh(canGeo, canMat);
      can.castShadow=true; can.receiveShadow=true; modelGroup.add(can);

      // Lid (metal)
      const lidGeo = new THREE.CylinderGeometry(0.504, 0.504, 0.04, 40);
      const lidMat = new THREE.MeshPhysicalMaterial({ color: '#888', roughness:0.18, metalness:0.9 });
      const lid2 = new THREE.Mesh(lidGeo, lidMat);
      lid2.position.y=0.57; modelGroup.add(lid2);

      // Bottom rim
      const botGeo = new THREE.CylinderGeometry(0.484, 0.484, 0.03, 40);
      const bot = new THREE.Mesh(botGeo, lidMat);
      bot.position.y=-0.565; modelGroup.add(bot);

      // Coffee beans scattered on top
      const beanMat = new THREE.MeshPhysicalMaterial({ color: '#2a1200', roughness: 0.6 });
      for(let i=0;i<8;i++){
        const angle=i/8*Math.PI*2;
        const r=0.22+Math.random()*0.16;
        const bGeo = new THREE.SphereGeometry(0.048, 10, 10);
        bGeo.scale(1,0.6,0.7);
        const bean = new THREE.Mesh(bGeo, beanMat);
        bean.position.set(Math.cos(angle)*r, 0.595, Math.sin(angle)*r);
        bean.rotation.y=Math.random()*Math.PI;
        modelGroup.add(bean);
      }
    };

    const createBurrata = () => {
      // Cheese ball — soft white sphere
      const ballGeo = new THREE.SphereGeometry(0.72, 40, 40);
      deformGeometry(ballGeo, 0.035, 2.5);
      const ballTex = makeCanvasTexture((ctx,w,h)=>{
        const g=ctx.createRadialGradient(w*0.4,h*0.36,0,w/2,h/2,w*0.52);
        g.addColorStop(0,'#fffdf8'); g.addColorStop(0.5,'#f5f0e4'); g.addColorStop(1,'#e8dfc8');
        ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
        ctx.globalAlpha=0.12; ctx.fillStyle='#d4c9a8';
        for(let i=0;i<300;i++){
          ctx.beginPath(); ctx.arc(Math.random()*w,Math.random()*h,0.8+Math.random()*2,0,Math.PI*2); ctx.fill();
        }
      },512,512);
      const ballMat = new THREE.MeshPhysicalMaterial({
        map: ballTex, roughness: 0.18, metalness: 0.0,
        clearcoat: 0.6, clearcoatRoughness: 0.12,
        transmission: 0.04,
      });
      const ball = new THREE.Mesh(ballGeo, ballMat);
      ball.castShadow=true; ball.receiveShadow=true; modelGroup.add(ball);

      // Tied top knot
      const knotGeo = new THREE.SphereGeometry(0.18, 16, 16);
      knotGeo.scale(1.2, 0.7, 1.2);
      const knot = new THREE.Mesh(knotGeo, ballMat);
      knot.position.y=0.68; modelGroup.add(knot);

      // Cream ooze on top (small blob breaking open)
      const creamGeo = new THREE.SphereGeometry(0.16, 16, 12);
      creamGeo.scale(1.4, 0.5, 1.4);
      const creamMat = new THREE.MeshPhysicalMaterial({
        color: '#fff8e8', roughness: 0.08, clearcoat: 0.9, clearcoatRoughness: 0.04,
      });
      const cream = new THREE.Mesh(creamGeo, creamMat);
      cream.position.set(0.1, 0.65, 0.1); modelGroup.add(cream);

      // Cherry tomatoes alongside
      const tomatoMat = new THREE.MeshPhysicalMaterial({ color: '#c62828', roughness: 0.2, clearcoat: 0.9 });
      [[1.1,-0.42,0.3],[1.04,-0.38,-0.28],[1.16,-0.5,0.06]].forEach(([tx,ty,tz])=>{
        const tGeo = new THREE.SphereGeometry(0.14,16,16);
        const t = new THREE.Mesh(tGeo, tomatoMat);
        t.position.set(tx,ty,tz); t.castShadow=true; modelGroup.add(t);
      });

      // Fresh basil leaf
      const leafShape2 = new THREE.Shape();
      leafShape2.moveTo(0,0); leafShape2.quadraticCurveTo(0.22,0.3,0.06,0.62);
      leafShape2.quadraticCurveTo(-0.18,0.34,0,0);
      const leafGeo2 = new THREE.ExtrudeGeometry(leafShape2,{depth:0.008,bevelEnabled:false});
      const leafMat2 = new THREE.MeshPhysicalMaterial({ color:'#2e7d32', roughness:0.5, side:THREE.DoubleSide });
      const basil = new THREE.Mesh(leafGeo2, leafMat2);
      basil.position.set(0.62,-0.62,-0.04); basil.rotation.x=Math.PI*0.3; basil.rotation.z=Math.PI*0.2;
      modelGroup.add(basil);
    };

    // ── AGRI TOOLS MODEL ──────────────────────────────────────────────────────

    const createPHMeter = () => {
      // Handle body
      const handleGeo = new THREE.BoxGeometry(0.28, 1.62, 0.16);
      {
        const pos=handleGeo.attributes.position;
        for(let i=0;i<pos.count;i++){
          const x=pos.getX(i), y=pos.getY(i);
          const topTaper = y>0.5 ? (y-0.5)*0.06 : 0;
          pos.setX(i, x*(1-topTaper*0.2));
        }
        handleGeo.computeVertexNormals();
      }
      const handleMat = new THREE.MeshPhysicalMaterial({
        color: '#1565c0', roughness: 0.35, metalness: 0.1,
      });
      const handle = new THREE.Mesh(handleGeo, handleMat);
      handle.castShadow=true; handle.receiveShadow=true; modelGroup.add(handle);

      // LCD window
      const lcdTex = makeCanvasTexture((ctx,w,h)=>{
        ctx.fillStyle='#c8e6c9'; ctx.fillRect(0,0,w,h);
        ctx.fillStyle='#1b5e20'; ctx.font=`bold ${h*0.38}px monospace`;
        ctx.textAlign='center'; ctx.fillText('6.8', w/2, h*0.56);
        ctx.font=`${h*0.15}px sans-serif`;
        ctx.fillText('pH', w*0.2, h*0.25);
        ctx.fillText('▶', w*0.78, h*0.56);
      },128,96);
      const lcdGeo = new THREE.PlaneGeometry(0.2, 0.14);
      const lcdMat = new THREE.MeshPhysicalMaterial({ map:lcdTex, roughness:0.1, emissive:'#c8e6c9', emissiveIntensity:0.25 });
      const lcd = new THREE.Mesh(lcdGeo, lcdMat);
      lcd.position.set(0, 0.46, 0.082); modelGroup.add(lcd);

      // Label area
      const labelGeo = new THREE.PlaneGeometry(0.22, 0.38);
      const labelTex2 = makeCanvasTexture((ctx,w,h)=>{
        ctx.fillStyle='#fff'; ctx.fillRect(0,0,w,h);
        ctx.fillStyle='#1565c0'; ctx.font=`bold ${h*0.18}px sans-serif`;
        ctx.textAlign='center'; ctx.fillText('pH / Ẩm', w/2, h*0.28);
        ctx.font=`${h*0.12}px sans-serif`; ctx.fillStyle='#555';
        ctx.fillText('Soil Meter', w/2, h*0.48);
        ctx.fillStyle='#e0e0e0';
        ctx.fillRect(w*0.1,h*0.6,w*0.8,h*0.02);
        ctx.fillRect(w*0.1,h*0.68,w*0.55,h*0.02);
      },128,192);
      const labelMat2 = new THREE.MeshPhysicalMaterial({ map:labelTex2, roughness:0.5 });
      const labelMesh = new THREE.Mesh(labelGeo, labelMat2);
      labelMesh.position.set(0,-0.08,0.082); modelGroup.add(labelMesh);

      // Buttons (3 on top section)
      const btnColors = ['#ef5350','#4caf50','#2196f3'];
      btnColors.forEach((col,i)=>{
        const bG=new THREE.CylinderGeometry(0.022,0.022,0.018,14);
        const bM=new THREE.MeshPhysicalMaterial({color:col,roughness:0.4});
        const b=new THREE.Mesh(bG,bM);
        b.position.set(-0.07+i*0.07, 0.68, 0.082);
        b.rotation.x=Math.PI/2; modelGroup.add(b);
      });

      // Metal probe shaft
      const shaftGeo = new THREE.CylinderGeometry(0.028, 0.022, 1.1, 16);
      const shaftMat = new THREE.MeshPhysicalMaterial({ color:'#bdbdbd', roughness:0.2, metalness:0.95 });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.y=-1.36; modelGroup.add(shaft);

      // Probe tip (pointed)
      const tipGeo = new THREE.ConeGeometry(0.022, 0.12, 16);
      const tip = new THREE.Mesh(tipGeo, shaftMat);
      tip.position.y=-1.97; tip.rotation.x=Math.PI; modelGroup.add(tip);

      // Scale / ring markers on shaft
      const ringMatS = new THREE.MeshPhysicalMaterial({ color:'#888', metalness:0.9 });
      [-0.1,-0.3,-0.5,-0.7,-0.9].forEach(y=>{
        const rG=new THREE.TorusGeometry(0.03,0.005,6,18);
        const r=new THREE.Mesh(rG,ringMatS);
        r.position.set(0,y-0.81,0); modelGroup.add(r);
      });
    };

    // ── DISPATCH & LOADING FLOW ───────────────────────────────────────────────
    let isCancelled = false;

    const runProceduralFallback = () => {
      if (isCancelled) return;
      modelGroup.clear();

      switch (modelType) {
        case 'apple':              createApple();          break;
        case 'orange':             createOrange();         break;
        case 'carrot':             createCarrot();         break;
        case 'broccoli':           createBroccoli();       break;
        case 'salmon':             createSalmon();         break;
        case 'lobster':            createLobster();        break;
        case 'mango':              createMango();          break;
        case 'strawberry':         createStrawberry();     break;
        case 'melon':              createMelon();          break;
        case 'cherry_tomato':      createCherryTomato();   break;
        case 'spinach':            createSpinach();        break;
        case 'sweet_corn':         createSweetCorn();      break;
        case 'tuna':               createTuna();           break;
        case 'octopus':            createOctopus();        break;
        case 'car_mercedes_s450':  createMercedesS450();   break;
        case 'car_bmw_7':          createBMW730Li();       break;
        case 'car_audi_q8':        createAudiQ8();         break;
        case 'phone_iphone':       createIPhone();         break;
        case 'phone_iphone_x':     createIPhoneX();        break;
        case 'phone_samsung':      createSamsungPhone();   break;
        case 'laptop_macbook':     createMacBook();        break;
        case 'camera_sony':        createSonyCamera();     break;
        case 'headphone_airpods':  createAirPods();        break;
        case 'tv_lg':              createLGTV();           break;
        case 'console_ps5':        createPS5();            break;
        case 'watch_garmin':       createGarminWatch();    break;
        case 'food_ham':           createIbericoHam();     break;
        case 'food_wine':          createWineBottle();     break;
        case 'food_coffee':        createCoffee();         break;
        case 'food_cheese':        createBurrata();        break;
        case 'tool_meter':         createPHMeter();        break;
        default: {
          const boxGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
          const boxMat = new THREE.MeshPhysicalMaterial({ color: '#2e7d32', roughness: 0.5 });
          const box = new THREE.Mesh(boxGeo, boxMat);
          box.castShadow = true;
          modelGroup.add(box);
        }
      }
      scene.add(modelGroup);
      const isGlbAsync = ['phone_iphone_x'].includes(modelType);
      if (!isGlbAsync) setLoading(false);
    };

    runProceduralFallback();

    // ── ANIMATION ─────────────────────────────────────────────────────────────
    let rafId;
    const startTime = performance.now();

    const isCar = ['car_mercedes_s450', 'car_bmw_7', 'car_audi_q8'].includes(modelType);
    if (isCar) {
      camera.position.set(0, 1.4, 5.2);
      controls.maxDistance = 14;
      controls.minDistance = 2.5;
    }

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      controls.update();
      const t = (performance.now() - startTime) / 1000;
      if (autoRotate) modelGroup.rotation.y += isCar ? 0.0022 : 0.0035;

      let baseY = 0.0;
      if (modelType === 'carrot') baseY = 0.3;
      else if (modelType === 'broccoli' || modelType === 'spinach' || modelType === 'sweet_corn') baseY = 0.15;
      else if (modelType === 'octopus') baseY = 0.08;
      else if (isCar) baseY = 0.12;

      modelGroup.position.y = baseY + Math.sin(t * 0.8) * (isCar ? 0.03 : 0.06);
      renderer.render(scene, camera);
    };
    animate();

    // ── RESIZE ────────────────────────────────────────────────────────────────
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ── CLEANUP ───────────────────────────────────────────────────────────────
    return () => {
      isCancelled = true;
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
      controls.dispose();
      renderer.dispose();
      
      if (scene.environment) scene.environment.dispose();

      modelGroup.traverse((obj) => {
        if (!obj.isMesh && !obj.isPoints) return;
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      });
      shadowPlaneGeo.dispose();
      shadowPlaneMat.dispose();
      discGeo.dispose();
      discMat.dispose();
    };
  }, [modelType, autoRotate]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm z-10">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="mt-4 text-sm font-semibold text-white">Đang tải mô hình 3D...</span>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: '300px' }} />
    </div>
  );
}
