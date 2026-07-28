// ═══════════════════════════════════════════════════
// particles.js — Fibonacci Sphere & Volumetric Cloud Buffers
// ═══════════════════════════════════════════════════

import * as THREE from 'three';

const PARTICLE_COUNT = 3200;        // Balanced density for distinct, sparkling fairy-dust stars
const SPHERE_RADIUS = 5.5;          // Base radius of the sphere
const GOLDEN_ANGLE = Math.PI * (3.0 - Math.sqrt(5.0));

let unitOffsets = null;     // Float32Array — fibonacci positions on hollow UNIT sphere
let cloudOffsets = null;    // Float32Array — volumetric random positions for CLOUD OF DUST
let positions = null;       // Float32Array — current rendering positions
let velocities = null;      // Float32Array — velocity per particle per axis
let colors = null;          // Float32Array — per-particle RGB color
let geometry = null;
let pointsMesh = null;

/**
 * Generate a soft, glowing radial star texture using HTML5 Canvas.
 * Prevents overlapping particles from merging into a harsh white square blob!
 */
function createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.2, 'rgba(255, 240, 200, 0.9)');
    grad.addColorStop(0.5, 'rgba(255, 180, 100, 0.35)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

/**
 * Generate Fibonacci sphere unit offsets, volumetric cloud offsets, and initial positions.
 */
function initParticles(scene) {
    unitOffsets = new Float32Array(PARTICLE_COUNT * 3);
    cloudOffsets = new Float32Array(PARTICLE_COUNT * 3);
    positions = new Float32Array(PARTICLE_COUNT * 3);
    velocities = new Float32Array(PARTICLE_COUNT * 3);
    colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        // 1. Organized Fibonacci Sphere Surface (unitOffsets)
        const y = 1 - (2 * i) / (PARTICLE_COUNT - 1);
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = GOLDEN_ANGLE * i;
        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;

        const idx = i * 3;

        unitOffsets[idx]     = x;
        unitOffsets[idx + 1] = y;
        unitOffsets[idx + 2] = z;

        // 2. Unorganized Volumetric Cloud of Dust (cloudOffsets)
        // Uniform 3D distribution inside a sphere volume with irregular radius
        const u = Math.random();
        const v = Math.random();
        const w = Math.random();
        const thetaCloud = u * 2.0 * Math.PI;
        const phiCloud = Math.acos(2.0 * v - 1.0);
        const rCloud = Math.cbrt(w) * (0.6 + Math.random() * 0.6); // diffuse cloud volume
        cloudOffsets[idx]     = rCloud * Math.sin(phiCloud) * Math.cos(thetaCloud);
        cloudOffsets[idx + 1] = rCloud * Math.sin(phiCloud) * Math.sin(thetaCloud);
        cloudOffsets[idx + 2] = rCloud * Math.cos(phiCloud);

        // Initial positions start as the organized sphere
        positions[idx]     = x * SPHERE_RADIUS;
        positions[idx + 1] = y * SPHERE_RADIUS;
        positions[idx + 2] = z * SPHERE_RADIUS;

        // Warm golden fairy-dust palette with organic variation
        const t = (y + 1) / 2;
        const noise = Math.random() * 0.2;
        colors[idx]     = 1.0;
        colors[idx + 1] = 0.70 + t * 0.15 + noise;
        colors[idx + 2] = 0.40 + t * 0.30 + noise;
    }

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.22,
        sizeAttenuation: true,
        map: createStarTexture(),
        alphaTest: 0.01,
        vertexColors: true,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    pointsMesh = new THREE.Points(geometry, material);
    scene.add(pointsMesh);
}

export {
    initParticles,
    unitOffsets,
    cloudOffsets,
    positions,
    velocities,
    colors,
    geometry,
    pointsMesh,
    PARTICLE_COUNT,
    SPHERE_RADIUS
};
