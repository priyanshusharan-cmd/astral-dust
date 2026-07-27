// ═══════════════════════════════════════════════════
// scene.js — Three.js Scene with TRANSPARENT background
// Particles overlay the webcam video feed
// ═══════════════════════════════════════════════════

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

let scene = null;
let camera = null;
let renderer = null;
let composer = null;

/**
 * Initialize the Three.js rendering pipeline with a TRANSPARENT background
 * so the webcam video shows through behind the particles.
 */
function initScene() {
    const canvas = document.getElementById('astral-canvas');

    // ── Scene (no background — transparent) ──
    scene = new THREE.Scene();

    // ── Camera ──
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 20);
    camera.lookAt(0, 0, 0);

    // ── Renderer — alpha: true makes background transparent ──
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: false,
        alpha: true,                             // TRANSPARENT background!
        powerPreference: 'high-performance',
        premultipliedAlpha: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);         // Clear to fully transparent
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.5;

    // ── Post-Processing ──
    composer = new EffectComposer(renderer);

    const renderPass = new RenderPass(scene, camera);
    renderPass.clearAlpha = 0;
    composer.addPass(renderPass);

    // Bloom — tuned for crisp, individual stardust dots without blinding white blowout
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.55,   // Strength — delicate stardust glow
        0.35,   // Radius — tight spread around individual dots
        0.2     // Threshold — only bright particle centers bloom
    );
    composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // ── Resize Handler ──
    window.addEventListener('resize', handleResize);
}

function handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    composer.setSize(width, height);
}

export { scene, camera, renderer, composer, initScene };
