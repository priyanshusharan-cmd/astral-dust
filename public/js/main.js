// ═══════════════════════════════════════════════════
// main.js — Orchestrator with Gesture-Driven Interaction
// + Adaptive color sampling from webcam feed
// ═══════════════════════════════════════════════════

import { initScene, scene, composer } from './scene.js';
import * as particles from './particles.js';
import { updatePhysics } from './physics.js';
import { initHandTracking, detectHands, getHandPositions, getHandCount, getFingerCount } from './handTracking.js';
import {
    updateGestures,
    getState,
    getVisualForm,
    getSphereCenter,
    getSphereScale,
    wasScatterTriggered,
    getHand1Center,
    getHand2Center,
    getScatterTimer,
    getMergeTargetHand
} from './gestures.js';

let isRunning = false;
let autoRotationAngle = 0;
const AUTO_ROTATION_SPEED = 0.0004; // Slow, hypnotic idle rotation

// Debug UI elements
let debugHands, debugFingers, debugState, debugCamera;

// ── Adaptive Color System ──
let samplingCanvas = null;
let samplingCtx = null;
let videoElement = null;
let avgBrightness = 128;
let colorSampleFrame = 0;

// Current particle hue (lerped smoothly)
let currentHue = 30;       // Start warm golden
let targetHue = 30;

/**
 * Bootstrap the application.
 */
async function init() {
    debugHands = document.getElementById('debug-hands');
    debugFingers = document.getElementById('debug-fingers');
    debugState = document.getElementById('debug-state');
    debugCamera = document.getElementById('debug-camera');

    // Step 1: Initialize Three.js
    initScene();
    console.log('✦ Scene initialized.');

    // Step 2: Generate Fibonacci sphere & cloud buffers
    particles.initParticles(scene);
    console.log(`✦ ${particles.PARTICLE_COUNT} particles generated.`);

    // Step 3: Initialize webcam + MediaPipe
    try {
        await initHandTracking();
        console.log('✦ Hand tracking ready.');
        if (debugCamera) debugCamera.textContent = 'on';
    } catch (err) {
        console.error('✦ Hand tracking failed:', err);
        if (debugCamera) debugCamera.textContent = 'error';
        return;
    }

    // Step 4: Setup color sampling canvas
    videoElement = document.getElementById('webcam-video');
    samplingCanvas = document.createElement('canvas');
    samplingCanvas.width = 32;
    samplingCanvas.height = 32;
    samplingCtx = samplingCanvas.getContext('2d', { willReadFrequently: true });

    // Step 5: Hide loading, show UI
    const overlay = document.getElementById('loading-overlay');
    const uiOverlay = document.getElementById('ui-overlay');
    if (overlay) overlay.classList.add('hidden');
    if (uiOverlay) setTimeout(() => uiOverlay.classList.add('visible'), 400);

    // Step 6: Start animation loop
    isRunning = true;
    animate();
}

/**
 * Sample average brightness + dominant hue from the webcam feed.
 * Continuously runs every 15 frames (~4x/sec) for real-time adaptation.
 */
function sampleWebcamColors() {
    colorSampleFrame++;
    if (colorSampleFrame % 15 !== 0) return;
    if (!videoElement || videoElement.readyState < 2) return;

    // When the camera feed is manually toggled off by the user, smoothly revert to the warm Golden color
    if (videoElement.style.opacity === '0') {
        targetHue = 35;
        avgBrightness = 50; // Forces darker room (warm/gold) saturation/lightness settings
        return;
    }

    try {
        samplingCtx.drawImage(videoElement, 0, 0, 32, 32);
        const imgData = samplingCtx.getImageData(0, 0, 32, 32).data;

        let totalR = 0, totalG = 0, totalB = 0;
        const pixelCount = 32 * 32;

        for (let i = 0; i < imgData.length; i += 4) {
            totalR += imgData[i];
            totalG += imgData[i + 1];
            totalB += imgData[i + 2];
        }

        const avgR = totalR / pixelCount;
        const avgG = totalG / pixelCount;
        const avgB = totalB / pixelCount;
        avgBrightness = (avgR + avgG + avgB) / 3;

        // Choose contrasting particle color based on background brightness
        if (avgBrightness > 115) {
            // BRIGHT room / white walls / daylight → Electric Cyan / Neon Blue
            targetHue = 190;
        } else if (avgBrightness > 75) {
            // MEDIUM room / indoor lighting → Vibrant Electric Magenta / Neon Purple
            targetHue = 305;
        } else {
            // DARK room → Warm Celestial Gold / Amber
            targetHue = 35;
        }
    } catch (e) {
        // Security error if cross-origin — just use default
    }
}

/**
 * Update particle colors based on sampled webcam hue.
 */
function updateParticleColors() {
    // Smoothly lerp current hue toward target (ultra-smooth cinematic transition)
    currentHue += (targetHue - currentHue) * 0.008;

    if (!particles.colors || !particles.geometry) return;

    const colors = particles.colors;
    const count = particles.PARTICLE_COUNT;

    for (let i = 0; i < count; i++) {
        const idx = i * 3;
        const t = i / count;
        const noise = Math.sin(i * 0.1) * 0.08;

        // Convert HSL to RGB (high saturation and punchy contrast for screen blend mode)
        const h = (currentHue + t * 20 + noise * 30) % 360;
        const s = avgBrightness > 75 ? 0.95 : 0.80;
        const l = (avgBrightness > 115 ? 0.52 : 0.65) + noise;

        const rgb = hslToRgb(h / 360, s, l);
        colors[idx]     = rgb[0];
        colors[idx + 1] = rgb[1];
        colors[idx + 2] = rgb[2];
    }

    particles.geometry.attributes.color.needsUpdate = true;
}

/**
 * HSL to RGB conversion (returns [r, g, b] in 0-1 range).
 */
function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [r, g, b];
}

/**
 * Update UI colors (handled permanently by dark frosted glass HUD cards).
 */
function updateUIColors() {
    // No-op: Dark frosted glass HUD cards provide permanent high contrast on all backgrounds!
}

/**
 * Main animation loop.
 */
function animate() {
    if (!isRunning) return;
    requestAnimationFrame(animate);

    // 1. Detect hands in current video frame
    detectHands();

    // 2. Get smoothed hand data (normalized coords)
    const handData = getHandPositions();

    // 3. Update gesture state machine (computes sphere center, scale, state)
    updateGestures(handData);

    // 4. Get current gesture state
    const state = getState();
    const visualForm = getVisualForm();
    const sphereCenter = getSphereCenter();
    const sphereScale = getSphereScale();
    const scatterTriggered = wasScatterTriggered();
    const hand1 = getHand1Center();
    const hand2 = getHand2Center();
    const scatterTimer = getScatterTimer();
    const mergeTargetHand = getMergeTargetHand();

    // 5. Update particle physics (now passes cloudOffsets, scatterTimer, and mergeTargetHand!)
    updatePhysics(
        state,
        visualForm,
        sphereCenter,
        sphereScale,
        scatterTriggered,
        hand1,
        hand2,
        scatterTimer,
        mergeTargetHand,
        particles.positions,
        particles.velocities,
        particles.unitOffsets,
        particles.cloudOffsets,
        particles.geometry,
        particles.PARTICLE_COUNT,
        particles.SPHERE_RADIUS
    );

    // 6. Auto-rotate when idle (no hands)
    if (state === 'IDLE' && particles.pointsMesh) {
        autoRotationAngle += AUTO_ROTATION_SPEED;
        particles.pointsMesh.rotation.y = autoRotationAngle;
    } else if (particles.pointsMesh) {
        // Smoothly stop rotation when hands appear
        particles.pointsMesh.rotation.y *= 0.98;
        autoRotationAngle = particles.pointsMesh.rotation.y;
    }

    // 7. Adaptive colors — sample webcam & update particles + UI
    sampleWebcamColors();
    updateParticleColors();
    updateUIColors();

    // 8. Update debug UI
    updateDebugUI(state, visualForm);

    // 9. Render with bloom
    composer.render();
}

/**
 * Update debug panel.
 */
function updateDebugUI(state, visualForm) {
    if (!debugHands) return;

    debugHands.textContent = getHandCount();
    debugFingers.textContent = getFingerCount();

    // Clean up state text so TWO_HAND becomes "two hands", etc.
    const cleanState = state.toLowerCase().replaceAll('_', ' ').replace('two hand', 'two hands');
    
    // Clean up form text so split states appear cleanly without tech symbols
    const cleanForm = visualForm.replace(/^SPLIT_/, '').replaceAll('_', ', ').toLowerCase().replace('two hand', 'two hands');
    debugState.textContent = `${cleanState} \u00a0|\u00a0 ${cleanForm}`;

    // Color-code the state with crisp, vibrant neon colors that pop on dark glass HUD cards
    const stateColors = {
        'IDLE': '#ffddaa',
        'FOLLOW': '#00ff88',
        'PINCH': '#ffcc00',
        'SCATTER': '#ff4444',
        'TWO_HAND': '#00e5ff',
        'SPLIT': '#d8b4fe',
        'GATHER': '#ffaa00'
    };
    debugState.style.color = stateColors[state] || '#ffffff';
}

// Camera Toggle Logic
function initCameraToggle() {
    const row = document.getElementById('camera-toggle-row');
    const toggleSwitch = document.getElementById('camera-toggle-switch');
    const video = document.getElementById('webcam-video');
    
    function toggleCamera() {
        if (video.style.opacity === '0') {
            video.style.opacity = '1';
            if (toggleSwitch) toggleSwitch.classList.add('active');
        } else {
            video.style.opacity = '0';
            if (toggleSwitch) toggleSwitch.classList.remove('active');
        }
    }

    if (row) row.addEventListener('click', toggleCamera);
    if (toggleSwitch) toggleSwitch.addEventListener('click', (e) => {
        // Prevent double trigger if they click exactly on the switch vs the row
        e.stopPropagation();
        toggleCamera();
    });
    
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'c') {
            toggleCamera();
        }
    });
}

// Start
initCameraToggle();
init();
