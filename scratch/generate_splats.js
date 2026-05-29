// import fs from 'fs';
// import path from 'path';

// const OUTPUT_DIR = 'c:/Users/NguyenPH/Desktop/Food3D/public/splats';

// if (!fs.existsSync(OUTPUT_DIR)) {
//   fs.mkdirSync(OUTPUT_DIR, { recursive: true });
// }

// // Helper to write a splat file
// const writeSplatFile = (filename, splats) => {
//   const numSplats = splats.length;
//   const buffer = new ArrayBuffer(numSplats * 32);
//   const fBuffer = new Float32Array(buffer);
//   const uBuffer = new Uint8Array(buffer);

//   for (let i = 0; i < numSplats; i++) {
//     const splat = splats[i];
    
//     // Position (floats at bytes 0-11)
//     fBuffer[i * 8 + 0] = splat.pos[0];
//     fBuffer[i * 8 + 1] = splat.pos[1];
//     fBuffer[i * 8 + 2] = splat.pos[2];

//     // Scale (floats at bytes 12-23)
//     fBuffer[i * 8 + 3] = splat.scale[0];
//     fBuffer[i * 8 + 4] = splat.scale[1];
//     fBuffer[i * 8 + 5] = splat.scale[2];

//     // Color (uint8 at bytes 24-27)
//     uBuffer[i * 32 + 24] = splat.color[0]; // R
//     uBuffer[i * 32 + 25] = splat.color[1]; // G
//     uBuffer[i * 32 + 26] = splat.color[2]; // B
//     uBuffer[i * 32 + 27] = splat.color[3]; // A

//     // Rotation (uint8 at bytes 28-31)
//     uBuffer[i * 32 + 28] = splat.rot[0];
//     uBuffer[i * 32 + 29] = splat.rot[1];
//     uBuffer[i * 32 + 30] = splat.rot[2];
//     uBuffer[i * 32 + 31] = splat.rot[3];
//   }

//   const filePath = path.join(OUTPUT_DIR, filename);
//   fs.writeFileSync(filePath, Buffer.from(buffer));
//   console.log(`Generated ${filename} with ${numSplats} splats.`);
// };

// // Common defaults for splat scale and rotation
// const defaultScale = [0.015, 0.015, 0.015];
// const defaultRot = [128, 128, 128, 128]; // Identity quaternion in uint8 range

// // ── 1. APPLE ────────────────────────────────────────────────────────────────
// const generateApple = () => {
//   const splats = [];
//   const numPoints = 15000;
  
//   for (let i = 0; i < numPoints; i++) {
//     const theta = Math.acos(2 * Math.random() - 1);
//     const phi = 2 * Math.PI * Math.random();
    
//     // Dimple at top and bottom
//     const rBase = 0.85;
//     const verticalFactor = Math.abs(Math.cos(theta)); // 1 at top/bottom, 0 at equator
//     const r = rBase * (1.0 - 0.16 * verticalFactor);
    
//     // Slight noise
//     const noise = (Math.random() - 0.5) * 0.02;
//     const rad = r + noise;
    
//     const x = rad * Math.sin(theta) * Math.cos(phi);
//     const z = rad * Math.sin(theta) * Math.sin(phi);
//     const y = rad * Math.cos(theta);
    
//     // Color: Apple Red with streaks of gold/green at the bottom
//     let color = [183, 28, 28, 255]; // Red
//     if (y < -0.2) {
//       // Golden yellow gradient at bottom
//       const blend = Math.min(1.0, (-y - 0.2) * 1.5);
//       color[0] = Math.round(183 * (1 - blend) + 203 * blend);
//       color[1] = Math.round(28 * (1 - blend) + 212 * blend);
//       color[2] = Math.round(28 * (1 - blend) + 72 * blend);
//     }
//     // Add green dots
//     if (Math.random() < 0.05) {
//       color = [139, 195, 74, 255];
//     }
    
//     splats.push({ pos: [x, y, z], scale: defaultScale, color, rot: defaultRot });
//   }

//   // Add a brown stem at the top
//   for (let i = 0; i < 400; i++) {
//     const t = i / 400;
//     const sy = 0.7 + t * 0.35;
//     const sx = Math.sin(t * 1.5) * 0.15;
//     const sz = (Math.random() - 0.5) * 0.03;
//     splats.push({
//       pos: [sx + (Math.random() - 0.5) * 0.02, sy, sz + (Math.random() - 0.5) * 0.02],
//       scale: [0.008, 0.008, 0.008],
//       color: [93, 64, 55, 255],
//       rot: defaultRot
//     });
//   }

//   writeSplatFile('apple.splat', splats);
// };

// // ── 2. ORANGE ───────────────────────────────────────────────────────────────
// const generateOrange = () => {
//   const splats = [];
//   const numPoints = 15000;
  
//   for (let i = 0; i < numPoints; i++) {
//     const theta = Math.acos(2 * Math.random() - 1);
//     const phi = 2 * Math.PI * Math.random();
    
//     const r = 0.8 + (Math.random() - 0.5) * 0.015; // Textured orange shell
//     const x = r * Math.sin(theta) * Math.cos(phi);
//     const z = r * Math.sin(theta) * Math.sin(phi);
//     const y = r * Math.cos(theta);
    
//     // Orange skin colors
//     let color = [239, 108, 0, 255]; // Orange
//     if (Math.random() < 0.35) {
//       color = [245, 124, 0, 255]; // Lighter orange
//     } else if (Math.random() < 0.1) {
//       color = [230, 81, 0, 255]; // Darker shade
//     }
    
//     splats.push({ pos: [x, y, z], scale: defaultScale, color, rot: defaultRot });
//   }

//   // Small green/brown pore at top
//   for (let i = 0; i < 150; i++) {
//     const theta = Math.random() * 0.2;
//     const phi = Math.random() * 2 * Math.PI;
//     const r = 0.8;
//     const x = r * Math.sin(theta) * Math.cos(phi);
//     const z = r * Math.sin(theta) * Math.sin(phi);
//     const y = r * Math.cos(theta);
//     splats.push({ pos: [x, y, z], scale: [0.006, 0.006, 0.006], color: [46, 125, 50, 255], rot: defaultRot });
//   }

//   writeSplatFile('orange.splat', splats);
// };

// // ── 3. CARROT ───────────────────────────────────────────────────────────────
// const generateCarrot = () => {
//   const splats = [];
//   const numPoints = 12000;
  
//   for (let i = 0; i < numPoints; i++) {
//     const y = -0.8 + Math.random() * 1.6; // Vertical carrot shape from -0.8 to 0.8
//     const t = (y + 0.8) / 1.6; // 0 at bottom, 1 at top
    
//     // Cone-like width
//     const rMax = 0.32 * Math.pow(t, 0.48);
//     const angle = Math.random() * 2 * Math.PI;
//     const dist = Math.random() * rMax;
    
//     // Curved/organic tip
//     const bend = Math.sin(y * 1.5) * 0.08;
//     const x = dist * Math.cos(angle) + bend;
//     const z = dist * Math.sin(angle);
    
//     let color = [245, 124, 0, 255]; // Bright carrot orange
//     if (Math.random() < 0.25) {
//       color = [230, 81, 0, 255]; // Earthy dark orange
//     }
    
//     // Add dirt specs
//     if (Math.random() < 0.04) {
//       color = [62, 39, 35, 255];
//     }
    
//     splats.push({ pos: [x, y - 0.2, z], scale: defaultScale, color, rot: defaultRot });
//   }

//   // Add green foliage on top
//   for (let i = 0; i < 3000; i++) {
//     const branch = Math.floor(Math.random() * 5);
//     const length = 0.1 + Math.random() * 0.6;
//     const angle = (branch * (2 * Math.PI / 5)) + (Math.random() - 0.5) * 0.3;
    
//     const x = Math.cos(angle) * length * 0.5;
//     const z = Math.sin(angle) * length * 0.5;
//     const y = 0.6 + length * 0.8;
    
//     splats.push({
//       pos: [x, y - 0.2, z],
//       scale: [0.012, 0.012, 0.012],
//       color: [46, 125, 50, 255], // Green leaves
//       rot: defaultRot
//     });
//   }

//   writeSplatFile('carrot.splat', splats);
// };

// // ── 4. BROCCOLI ─────────────────────────────────────────────────────────────
// const generateBroccoli = () => {
//   const splats = [];
  
//   // Stems
//   const numStemPoints = 4000;
//   for (let i = 0; i < numStemPoints; i++) {
//     const y = -0.7 + Math.random() * 0.7; // Lower stem
//     const t = (y + 0.7) / 0.7; // 0 to 1
//     const r = 0.3 * (1.0 - t * 0.25);
//     const angle = Math.random() * 2 * Math.PI;
//     const dist = Math.sqrt(Math.random()) * r;
//     const x = dist * Math.cos(angle);
//     const z = dist * Math.sin(angle);
    
//     splats.push({
//       pos: [x, y, z],
//       scale: defaultScale,
//       color: [165, 214, 167, 255], // Pale green stem
//       rot: defaultRot
//     });
//   }

//   // Crown (dense clusters of florets)
//   const numCrownPoints = 12000;
//   const clusterCenters = [
//     [0.0, 0.3, 0.0, 0.5],
//     [0.35, 0.2, 0.25, 0.32],
//     [-0.35, 0.15, -0.2, 0.32],
//     [-0.25, 0.22, 0.35, 0.32],
//     [0.25, 0.18, -0.35, 0.32],
//   ];

//   for (let i = 0; i < numCrownPoints; i++) {
//     const cluster = clusterCenters[Math.floor(Math.random() * clusterCenters.length)];
//     const cx = cluster[0];
//     const cy = cluster[1];
//     const cz = cluster[2];
//     const radius = cluster[3];

//     // Distribute points in the spherical floret clusters
//     const u = Math.random();
//     const v = Math.random();
//     const theta = u * 2.0 * Math.PI;
//     const phi = Math.acos(2.0 * v - 1.0);
//     const r = Math.pow(Math.random(), 0.7) * radius;

//     const x = cx + r * Math.sin(phi) * Math.cos(theta);
//     const y = cy + r * Math.sin(phi) * Math.sin(theta);
//     const z = cz + r * Math.cos(phi);

//     let color = [27, 94, 32, 255]; // Dark green broccoli florets
//     if (Math.random() < 0.3) {
//       color = [46, 125, 50, 255]; // Bright green highlight
//     } else if (Math.random() < 0.1) {
//       color = [120, 144, 156, 255]; // Slightly purplish-blue tint
//     }

//     splats.push({ pos: [x, y, z], scale: [0.012, 0.012, 0.012], color, rot: defaultRot });
//   }

//   writeSplatFile('broccoli.splat', splats);
// };

// // ── 5. SALMON ───────────────────────────────────────────────────────────────
// const generateSalmon = () => {
//   const splats = [];
//   const numPoints = 15000;

//   for (let i = 0; i < numPoints; i++) {
//     // Generate within a flat rectangular slab (Salmon Fillet)
//     const x = (Math.random() - 0.5) * 2.2;
//     const y = (Math.random() - 0.5) * 0.4;
//     const z = (Math.random() - 0.5) * 1.0;

//     // Fat stripes (sinusoidal pattern along z and x)
//     const stripePattern = Math.sin(x * 6.5 + z * 3.5);
//     const isFatStripe = stripePattern > 0.72;

//     let color;
//     if (isFatStripe) {
//       color = [245, 235, 235, 255]; // Creamy fat stripe
//     } else {
//       color = [255, 99, 71, 255]; // Salmon pink-orange
//       if (Math.random() < 0.25) {
//         color = [244, 81, 30, 255]; // Deeper orange-red
//       }
//     }

//     splats.push({ pos: [x, y, z], scale: defaultScale, color, rot: defaultRot });
//   }

//   writeSplatFile('salmon.splat', splats);
// };

// // ── 6. LOBSTER ──────────────────────────────────────────────────────────────
// const generateLobster = () => {
//   const splats = [];
//   const numPoints = 16000;

//   for (let i = 0; i < numPoints; i++) {
//     // Body (segmented tail + carapace)
//     const t = Math.random(); // 0: tail, 1: head
//     const y = -0.8 + t * 1.6;
    
//     // Tail segments or Carapace width
//     const widthFactor = y < 0 ? 0.25 + (y + 0.8) * 0.2 : 0.4 - y * 0.15;
    
//     const angle = Math.random() * 2 * Math.PI;
//     const dist = Math.sqrt(Math.random()) * widthFactor;
    
//     // Flatten a bit on Y
//     const x = dist * Math.cos(angle);
//     const z = dist * Math.sin(angle) * 0.75;

//     let color = [183, 28, 28, 255]; // Deep lobster red
//     if (y < 0) {
//       // Segment borders (darker bands)
//       const segmentIdx = Math.floor((y + 0.8) * 10);
//       if ((y + 0.8) * 10 - segmentIdx < 0.15) {
//         color = [55, 10, 10, 255]; // Dark segment line
//       }
//     } else if (y > 0.4) {
//       // Highlight orange-red on head
//       if (Math.random() < 0.3) {
//         color = [224, 64, 10, 255];
//       }
//     }

//     splats.push({ pos: [x, y, z], scale: defaultScale, color, rot: defaultRot });
//   }

//   writeSplatFile('lobster.splat', splats);
// };

// // ── 7. MANGO ────────────────────────────────────────────────────────────────
// const generateMango = () => {
//   const splats = [];
//   const numPoints = 14000;

//   for (let i = 0; i < numPoints; i++) {
//     const theta = Math.acos(2 * Math.random() - 1);
//     const phi = 2 * Math.PI * Math.random();

//     // Kidney / asymmetrical shape
//     const rBase = 0.8;
//     const yFactor = Math.cos(theta); // -1 at bottom, 1 at top
    
//     // Curve at the bottom (asymmetrical kidney shape)
//     const bend = yFactor < 0 ? 0.18 * Math.sin(phi) * Math.sin(theta) : 0;
    
//     const r = rBase * (1.0 - 0.1 * yFactor);
//     const x = (r * Math.sin(theta) * Math.cos(phi)) * 0.72 + bend;
//     const z = r * Math.sin(theta) * Math.sin(phi);
//     const y = r * yFactor;

//     // Mango color gradient (green -> yellow -> red)
//     let color = [251, 192, 45, 255]; // Golden Yellow
    
//     if (y > 0.2) {
//       // Blushing red top
//       const blend = Math.min(1.0, (y - 0.2) * 2);
//       color[0] = Math.round(251 * (1 - blend) + 211 * blend);
//       color[1] = Math.round(192 * (1 - blend) + 47 * blend);
//       color[2] = Math.round(45 * (1 - blend) + 47 * blend);
//     } else if (y < -0.3) {
//       // Green unripe bottom
//       const blend = Math.min(1.0, (-y - 0.3) * 2);
//       color[0] = Math.round(251 * (1 - blend) + 139 * blend);
//       color[1] = Math.round(192 * (1 - blend) + 195 * blend);
//       color[2] = Math.round(45 * (1 - blend) + 74 * blend);
//     }

//     splats.push({ pos: [x, y, z], scale: defaultScale, color, rot: defaultRot });
//   }

//   writeSplatFile('mango.splat', splats);
// };

// // ── 8. STRAWBERRY ───────────────────────────────────────────────────────────
// const generateStrawberry = () => {
//   const splats = [];
//   const numPoints = 12000;

//   for (let i = 0; i < numPoints; i++) {
//     const theta = Math.acos(2 * Math.random() - 1);
//     const phi = 2 * Math.PI * Math.random();

//     // Conical tapering down
//     const yFactor = Math.cos(theta); // -1 (tip), 1 (base)
//     const taper = (yFactor + 1.0) / 2.0; // 0 to 1
    
//     const r = 0.8 * Math.pow(taper, 0.65) * (1.0 - 0.08 * yFactor);
//     const x = r * Math.sin(theta) * Math.cos(phi);
//     const z = r * Math.sin(theta) * Math.sin(phi);
//     const y = r * yFactor - 0.2; // Offset center

//     // Strawberry bright red
//     let color = [211, 47, 47, 255]; 
//     if (Math.random() < 0.2) {
//       color = [198, 40, 40, 255]; // Deep red shadows
//     }
    
//     // Add golden yellow seeds on surface
//     const seedPattern = Math.sin(theta * 18.0) * Math.cos(phi * 22.0);
//     if (seedPattern > 0.82 && taper > 0.2) {
//       color = [255, 235, 59, 255]; // Yellow seed
//     }

//     splats.push({ pos: [x, y, z], scale: defaultScale, color, rot: defaultRot });
//   }

//   // Green leafy cap (sepals)
//   for (let i = 0; i < 2000; i++) {
//     const angle = Math.random() * 2 * Math.PI;
//     const dist = Math.pow(Math.random(), 0.5) * 0.7;
//     const x = dist * Math.cos(angle);
//     const z = dist * Math.sin(angle);
//     const y = 0.45 + (0.7 - dist) * 0.35 + (Math.random() - 0.5) * 0.08;

//     splats.push({
//       pos: [x, y - 0.2, z],
//       scale: [0.01, 0.01, 0.01],
//       color: [46, 125, 50, 255],
//       rot: defaultRot
//     });
//   }

//   writeSplatFile('strawberry.splat', splats);
// };

// // ── 9. MELON ────────────────────────────────────────────────────────────────
// const generateMelon = () => {
//   const splats = [];
//   const numPoints = 16000;

//   for (let i = 0; i < numPoints; i++) {
//     const theta = Math.acos(2 * Math.random() - 1);
//     const phi = 2 * Math.PI * Math.random();

//     const r = 0.95;
//     const x = r * Math.sin(theta) * Math.cos(phi);
//     const z = r * Math.sin(theta) * Math.sin(phi);
//     const y = r * Math.cos(theta);

//     // Melon net texture (sinusoidal pattern in theta and phi)
//     const netPattern = Math.sin(theta * 24.0) * Math.sin(phi * 24.0);
//     const isNetLine = netPattern > 0.38;

//     let color;
//     if (isNetLine) {
//       color = [238, 232, 205, 255]; // Creamy net ridges
//     } else {
//       color = [76, 175, 80, 255]; // Green skin
//       if (Math.random() < 0.2) {
//         color = [56, 142, 60, 255]; // Darker green spots
//       }
//     }

//     splats.push({ pos: [x, y, z], scale: defaultScale, color, rot: defaultRot });
//   }

//   writeSplatFile('melon.splat', splats);
// };

// // ── 10. CHERRY TOMATO ───────────────────────────────────────────────────────
// const generateCherryTomato = () => {
//   const splats = [];
//   const numPoints = 10000;

//   for (let i = 0; i < numPoints; i++) {
//     const theta = Math.acos(2 * Math.random() - 1);
//     const phi = 2 * Math.PI * Math.random();

//     const r = 0.58 + (Math.random() - 0.5) * 0.008; // Small tomato sphere
//     const x = r * Math.sin(theta) * Math.cos(phi);
//     const z = r * Math.sin(theta) * Math.sin(phi);
//     const y = r * Math.cos(theta) - 0.1;

//     let color = [229, 57, 53, 255]; // Bright tomato red
//     if (Math.random() < 0.15) {
//       color = [244, 67, 54, 255]; // Highlight red
//     }

//     splats.push({ pos: [x, y, z], scale: defaultScale, color, rot: defaultRot });
//   }

//   // Star-like green calyx (stem leaves) on top
//   for (let i = 0; i < 1500; i++) {
//     const leafIdx = Math.floor(Math.random() * 5);
//     const length = 0.05 + Math.random() * 0.28;
//     const angle = (leafIdx * (2 * Math.PI / 5)) + (Math.random() - 0.5) * 0.18;

//     const x = Math.cos(angle) * length;
//     const z = Math.sin(angle) * length;
//     const y = 0.48 - (length * 0.3) + (Math.random() - 0.5) * 0.03;

//     splats.push({
//       pos: [x, y - 0.1, z],
//       scale: [0.008, 0.008, 0.008],
//       color: [46, 125, 50, 255],
//       rot: defaultRot
//     });
//   }

//   writeSplatFile('cherry_tomato.splat', splats);
// };

// // ── 11. SPINACH ─────────────────────────────────────────────────────────────
// const generateSpinach = () => {
//   const splats = [];
//   const numLeaves = 8;
//   const pointsPerLeaf = 1600;

//   for (let l = 0; l < numLeaves; l++) {
//     const leafAngle = (l * (2 * Math.PI / numLeaves)) + (Math.random() - 0.5) * 0.35;
//     const tilt = 0.25 + Math.random() * 0.35; // Angle tilting outwards

//     for (let p = 0; p < pointsPerLeaf; p++) {
//       const u = p / pointsPerLeaf; // 0 to 1 (stem to leaf tip)
//       const wFactor = Math.sin(u * Math.PI) * 0.32; // Width of leaf blade
//       const lateral = (Math.random() - 0.5) * wFactor;
      
//       const length = u * 1.1;
      
//       // Compute 3D coordinates based on leaf rotation and tilt
//       const ly = length * Math.sin(tilt);
//       const lx = length * Math.cos(tilt);
      
//       // Rotate around vertical Y axis
//       const rx = lx * Math.cos(leafAngle) - lateral * Math.sin(leafAngle);
//       const rz = lx * Math.sin(leafAngle) + lateral * Math.cos(leafAngle);
//       const ry = ly - 0.4; // Shift down
      
//       // Color: rich spinach green, lighter along the central vein
//       let color = [46, 125, 50, 255]; 
//       const isVein = Math.abs(lateral) < 0.015;
//       if (isVein) {
//         color = [139, 195, 74, 255]; // Light green central vein
//       } else if (Math.random() < 0.35) {
//         color = [27, 94, 32, 255]; // Deep dark green shade
//       }

//       splats.push({ pos: [rx, ry, rz], scale: [0.016, 0.016, 0.016], color, rot: defaultRot });
//     }
//   }

//   writeSplatFile('spinach.splat', splats);
// };

// // ── 12. SWEET CORN ──────────────────────────────────────────────────────────
// const generateSweetCorn = () => {
//   const splats = [];
  
//   // Corn Ear Kernels (cylinder of tiny spheres)
//   const numKernels = 12000;
//   for (let i = 0; i < numKernels; i++) {
//     const y = -0.7 + Math.random() * 1.3; // Height from -0.7 to 0.6
//     const t = (y + 0.7) / 1.3;
    
//     // Taper slightly at the top
//     const radius = 0.35 * (1.0 - t * t * 0.28);
//     const angle = Math.random() * 2 * Math.PI;
    
//     // Align points into rows and columns to look like corn rows
//     const numRows = 16;
//     const numCols = 32;
    
//     const rowIdx = Math.floor(t * numCols);
//     const colIdx = Math.floor((angle / (2 * Math.PI)) * numRows);
    
//     const snapAngle = (colIdx / numRows) * 2 * Math.PI;
//     const snapY = -0.7 + (rowIdx / numCols) * 1.3;
    
//     const x = radius * Math.cos(snapAngle) + (Math.random() - 0.5) * 0.02;
//     const z = radius * Math.sin(snapAngle) + (Math.random() - 0.5) * 0.02;
//     const ry = snapY + (Math.random() - 0.5) * 0.015;

//     let color = [255, 214, 0, 255]; // Deep golden yellow kernel
//     if (Math.random() < 0.35) {
//       color = [255, 235, 59, 255]; // Light sweet corn yellow
//     } else if (Math.random() < 0.05) {
//       color = [245, 245, 220, 255]; // Creamy white kernel
//     }

//     splats.push({ pos: [x, ry, z], scale: [0.012, 0.012, 0.012], color, rot: defaultRot });
//   }

//   // Green husk leaves wrapping bottom
//   const numHuskPoints = 4000;
//   for (let i = 0; i < numHuskPoints; i++) {
//     const y = -0.85 + Math.random() * 0.9;
//     const t = (y + 0.85) / 0.9;
//     const radius = 0.38 + t * 0.05;
//     const angle = Math.random() * 2 * Math.PI;
    
//     const x = radius * Math.cos(angle);
//     const z = radius * Math.sin(angle);

//     splats.push({
//       pos: [x, y, z],
//       scale: defaultScale,
//       color: [100, 180, 80, 255], // Green husk
//       rot: defaultRot
//     });
//   }

//   writeSplatFile('sweet_corn.splat', splats);
// };

// // ── 13. TUNA ────────────────────────────────────────────────────────────────
// const generateTuna = () => {
//   const splats = [];
//   const numPoints = 14000;

//   for (let i = 0; i < numPoints; i++) {
//     // Generate within a solid block (Tuna Saku block)
//     const x = (Math.random() - 0.5) * 2.2;
//     const y = (Math.random() - 0.5) * 0.6;
//     const z = (Math.random() - 0.5) * 1.0;

//     let color = [136, 14, 79, 255]; // Dark red tuna flesh
//     if (Math.random() < 0.45) {
//       color = [173, 20, 87, 255]; // Lighter rich pink-red
//     } else if (Math.random() < 0.1) {
//       color = [194, 24, 91, 255]; // Bright red muscle fibers
//     }

//     splats.push({ pos: [x, y, z], scale: defaultScale, color, rot: defaultRot });
//   }

//   writeSplatFile('tuna.splat', splats);
// };

// // ── 14. OCTOPUS ─────────────────────────────────────────────────────────────
// const generateOctopus = () => {
//   const splats = [];
  
//   // Spiral arm points (tentacle curve)
//   const numTentaclePoints = 10000;
//   for (let i = 0; i < numTentaclePoints; i++) {
//     const t = i / numTentaclePoints;
//     const angle = t * Math.PI * 1.95;
//     const rBase = 1.05 - t * 0.78;
    
//     // Core coordinate along the spiral
//     const cx = Math.cos(angle) * rBase;
//     const cy = -0.55 + t * 1.05;
//     const cz = Math.sin(angle) * rBase;
    
//     // Add radial thickness
//     const thickness = 0.22 * (1.0 - t * 0.82);
//     const rAngle = Math.random() * 2 * Math.PI;
//     const rDist = Math.pow(Math.random(), 0.7) * thickness;
    
//     const x = cx + rDist * Math.cos(rAngle);
//     const z = cz + rDist * Math.sin(rAngle);
//     const y = cy;

//     // Tentacle purplish-red gradient
//     let color = [136, 14, 79, 255]; // Deep purple-magenta
//     if (Math.random() < 0.4) {
//       color = [173, 20, 87, 255]; // Pinkish-purple
//     } else if (Math.random() < 0.1) {
//       color = [255, 128, 171, 255]; // Bright pink highlights
//     }

//     splats.push({ pos: [x, y, z], scale: defaultScale, color, rot: defaultRot });
//   }

//   // Suckers along the inner bottom side of spiral
//   const numSuckers = 25;
//   const pointsPerSucker = 200;
//   for (let s = 0; s < numSuckers; s++) {
//     const t = (s / (numSuckers - 1)) * 0.88;
//     const angle = t * Math.PI * 1.95;
//     const rBase = 1.05 - t * 0.78;
    
//     const cx = Math.cos(angle) * rBase;
//     const cy = -0.55 + t * 1.05;
//     const cz = Math.sin(angle) * rBase;
    
//     // Direction pointing inward
//     const inwardX = -Math.cos(angle);
//     const inwardZ = -Math.sin(angle);
    
//     const suckerSize = 0.12 * (1.0 - t * 0.65);
    
//     for (let p = 0; p < pointsPerSucker; p++) {
//       // Shape small hemispheres for suckers offset inward
//       const theta = Math.acos(Math.random()); // half sphere
//       const phi = 2 * Math.PI * Math.random();
      
//       const sx = suckerSize * Math.sin(theta) * Math.cos(phi);
//       const sy = suckerSize * Math.cos(theta) * 0.6;
//       const sz = suckerSize * Math.sin(theta) * Math.sin(phi);
      
//       // Position the sucker offset from tentacle core in inward direction
//       const px = cx + inwardX * 0.13 + sx;
//       const py = cy + sy;
//       const pz = cz + inwardZ * 0.13 + sz;
      
//       splats.push({
//         pos: [px, py, pz],
//         scale: [0.008, 0.008, 0.008],
//         color: [248, 187, 208, 255], // Creamy light pink
//         rot: defaultRot
//       });
//     }
//   }

//   writeSplatFile('octopus.splat', splats);
// };

// // ── GENERATE ALL ────────────────────────────────────────────────────────────
// console.log("Generating synthetic Gaussian Splatting files for Food3D...");
// generateApple();
// generateOrange();
// generateCarrot();
// generateBroccoli();
// generateSalmon();
// generateLobster();
// generateMango();
// generateStrawberry();
// generateMelon();
// generateCherryTomato();
// generateSpinach();
// generateSweetCorn();
// generateTuna();
// generateOctopus();
// console.log("All splat files generated successfully!");
