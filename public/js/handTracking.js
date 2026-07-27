// ═══════════════════════════════════════════════════
// handTracking.js — MediaPipe HandLandmarker + Webcam
// Extracts palm, palmSpan (depth proxy), and fingertips
// ═══════════════════════════════════════════════════

import { FilesetResolver, HandLandmarker } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/vision_bundle.mjs';

let handLandmarker = null;
let videoElement = null;
let lastVideoTime = -1;
let rawHandData = [];
let previousSmoothed = [];
const SMOOTHING_FACTOR = 0.5;   // Responsive smoothing

/**
 * Initialize webcam stream and MediaPipe HandLandmarker.
 */
async function initHandTracking() {
    videoElement = document.getElementById('webcam-video');
    const statusEl = document.getElementById('loading-status');

    statusEl.textContent = 'Requesting camera access...';

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        videoElement.srcObject = stream;

        await new Promise((resolve) => {
            videoElement.onloadeddata = () => resolve();
        });
    } catch (err) {
        statusEl.textContent = 'Camera access denied. Please allow camera in System Settings → Privacy & Security → Camera, then reload this page.';
        console.error('Camera access error:', err);
        throw err;
    }

    statusEl.textContent = 'Loading hand tracking model...';

    const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
    );

    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.6,
        minHandPresenceConfidence: 0.6,
        minTrackingConfidence: 0.6
    });

    statusEl.textContent = 'Astral Dust is ready.';
    console.log('Hand tracking initialized successfully.');
}

/**
 * Detect hands in the current video frame.
 */
function detectHands() {
    if (!handLandmarker || !videoElement || videoElement.readyState < 2) {
        rawHandData = [];
        return;
    }

    const currentTime = videoElement.currentTime;
    if (currentTime === lastVideoTime) return;
    lastVideoTime = currentTime;

    const results = handLandmarker.detectForVideo(videoElement, performance.now());

    if (results.landmarks && results.landmarks.length > 0) {
        rawHandData = results.landmarks;
    } else {
        rawHandData = [];
    }
}

/**
 * Get smoothed hand positions.
 * Extracts palm center, palmSpan (distance from wrist to MCP for camera depth scaling), and all 5 fingertips.
 */
function getHandPositions() {
    const handPositions = [];

    for (let h = 0; h < rawHandData.length; h++) {
        const lm = rawHandData[h];

        // Measure palm span in 2D (distance from wrist [0] to middle finger MCP [9])
        const dx = lm[0].x - lm[9].x;
        const dy = lm[0].y - lm[9].y;
        const palmSpan = Math.sqrt(dx * dx + dy * dy);

        // Palm center = midpoint of wrist(0) and middle finger MCP(9)
        const palm = {
            x: (lm[0].x + lm[9].x) / 2,
            y: (lm[0].y + lm[9].y) / 2,
            z: (lm[0].z + lm[9].z) / 2
        };

        // All 5 fingertips
        const fingertips = [
            { x: lm[4].x,  y: lm[4].y,  z: lm[4].z },   // thumb
            { x: lm[8].x,  y: lm[8].y,  z: lm[8].z },   // index
            { x: lm[12].x, y: lm[12].y, z: lm[12].z },   // middle
            { x: lm[16].x, y: lm[16].y, z: lm[16].z },   // ring
            { x: lm[20].x, y: lm[20].y, z: lm[20].z }    // pinky
        ];

        handPositions.push({ palm, palmSpan, fingertips });
    }

    // Sort hands left-to-right by screen X coordinate so Hand 0 and Hand 1 never swap randomly across frames!
    handPositions.sort((a, b) => a.palm.x - b.palm.x);

    return smoothHandPositions(handPositions);
}

/**
 * EMA smoothing for hand data.
 */
function smoothHandPositions(current) {
    if (current.length !== previousSmoothed.length) {
        previousSmoothed = current.map(h => ({
            palm: { ...h.palm },
            palmSpan: h.palmSpan,
            fingertips: h.fingertips.map(f => ({ ...f }))
        }));
        return previousSmoothed;
    }

    const alpha = SMOOTHING_FACTOR;
    const beta = 1 - alpha;

    for (let i = 0; i < current.length; i++) {
        const prev = previousSmoothed[i];
        const curr = current[i];

        prev.palm.x = alpha * curr.palm.x + beta * prev.palm.x;
        prev.palm.y = alpha * curr.palm.y + beta * prev.palm.y;
        prev.palm.z = alpha * curr.palm.z + beta * prev.palm.z;
        prev.palmSpan = alpha * curr.palmSpan + beta * (prev.palmSpan || curr.palmSpan);

        for (let f = 0; f < 5; f++) {
            prev.fingertips[f].x = alpha * curr.fingertips[f].x + beta * prev.fingertips[f].x;
            prev.fingertips[f].y = alpha * curr.fingertips[f].y + beta * prev.fingertips[f].y;
            prev.fingertips[f].z = alpha * curr.fingertips[f].z + beta * prev.fingertips[f].z;
        }
    }

    return previousSmoothed;
}

/**
 * Returns the raw hand count for debug display.
 */
function getHandCount() {
    return rawHandData.length;
}

/**
 * Returns total detected fingertips count for debug display.
 */
function getFingerCount() {
    let openFingers = 0;
    for (const hand of previousSmoothed) {
        for (let f = 0; f < 5; f++) {
            const tip = hand.fingertips[f];
            const dx = tip.x - hand.palm.x;
            const dy = tip.y - hand.palm.y;
            if (Math.sqrt(dx * dx + dy * dy) > 0.22) {
                openFingers++;
            }
        }
    }
    return openFingers;
}

export { initHandTracking, detectHands, getHandPositions, getHandCount, getFingerCount };
