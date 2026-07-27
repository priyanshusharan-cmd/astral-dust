// ═══════════════════════════════════════════════════
// gestures.js — Complete State Machine
//
// VISUAL FORMS:
//   SPHERE  = organized fibonacci ball (structured)
//   CLOUD   = loose scattered particles in one place (unstructured)
//
// STATE FLOW:
//   IDLE(SPHERE@center)
//     → 1 palm → FOLLOW(SPHERE follows palm)
//     → 2 palms → TWO_HAND(SPHERE scales with palm distance)
//     → pinch → PINCH(tiny compressed ball)
//         → release pinch → SCATTER(big bang over screen)
//             → 1 palm → GATHER(CLOUD at that palm)
//                 → fist → FOLLOW(SPHERE at fist) [cloud→sphere transition!]
//             → 2 palms → SPLIT(2 CLOUDs at each palm)
//                 → clap → PINCH_TINY(tiny compressed ball between hands)
//                     → spread → TWO_HAND(SPHERE scales)
// ═══════════════════════════════════════════════════

import * as THREE from 'three';
import { mapToWorldSpace } from './coordinateMapper.js';

// ── Thresholds ──
const PINCH_THRESHOLD = 0.115;
const CLAP_THRESHOLD = 0.19;
const REF_PALM_SPAN = 0.14;
const SCALE_BASE_DISTANCE = 0.28;

// ── Smoothing (Ultra-smooth premium feel) ──
const CENTER_LERP = 0.12;
const SCALE_LERP = 0.08;

// ── State Variables ──
let state = 'IDLE';
let visualForm = 'SPHERE';           // 'SPHERE' or 'CLOUD'
let sphereCenter = new THREE.Vector3(0, 0, 0);
let targetCenter = new THREE.Vector3(0, 0, 0);
let sphereScale = 1.0;
let targetScale = 1.0;
let scatterTriggered = false;
let wasPinching = false;
let wasPinching1 = false;
let wasPinching2 = false;
let pinchHoldCount = 0;
let pinchHoldCount1 = 0;
let pinchHoldCount2 = 0;
let recentPinch1 = 0;                // 15-frame tolerance for simultaneous two-hand release
let recentPinch2 = 0;
let mergeTargetHand = 0;             // 0=normal split, 1=merge all to hand 1, 2=merge all to hand 2
let isSphereHalf1 = false;           // Tracks if hand 1 is locked as a sphere
let isSphereHalf2 = false;           // Tracks if hand 2 is locked as a sphere
let scatterTimer = 0;
let fistCooldown = 0;                // Suppresses pinches while opening fist
let fistCooldown1 = 0;
let fistCooldown2 = 0;
const SCATTER_DURATION = 140;        // ~2.3s at 60fps for majestic floating

let hand1Center = new THREE.Vector3();
let hand2Center = new THREE.Vector3();

// ── Helper Functions ──

/**
 * Distance between thumb tip and index tip (for pinch detection).
 */
function getPinchDistance(hand) {
    const thumb = hand.fingertips[0];
    const index = hand.fingertips[1];
    const dx = thumb.x - index.x;
    const dy = thumb.y - index.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Distance from a single fingertip to the palm center.
 */
function fingerToPalmDist(hand, fingerIdx) {
    const tip = hand.fingertips[fingerIdx];
    const palm = hand.palm;
    const dx = tip.x - palm.x;
    const dy = tip.y - palm.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * FIST = ALL four non-thumb fingers (index, middle, ring, pinky) are curled
 * close to the palm. Thumb doesn't matter (it often sticks out in a natural fist).
 */
function isFist(hand) {
    const CURL_THRESHOLD = 0.26;
    let curledCount = 0;
    // Check index(1), middle(2), ring(3), pinky(4)
    for (let f = 1; f < 5; f++) {
        if (fingerToPalmDist(hand, f) < CURL_THRESHOLD) {
            curledCount++;
        }
    }
    // At least 3 of 4 fingers curled reliably detects fists across all camera distances!
    return curledCount >= 3;
}

/**
 * PINCH = thumb+index touching, but at least 2 of the remaining 3 fingers
 * (middle, ring, pinky) are OPEN/EXTENDED — NOT curled into the palm.
 * This prevents a closed fist from being detected as a pinch!
 */
function isPinchGesture(hand) {
    const pinchDist = getPinchDistance(hand);
    if (pinchDist >= PINCH_THRESHOLD) return false;

    // Check that other fingers are open (not a closed fist!)
    // We use 0.11 so holding a squeeze pinch doesn't fail when sitting back or when tendons curve remaining fingers!
    const OPEN_THRESHOLD = 0.11;
    let openCount = 0;
    // middle(2), ring(3), pinky(4)
    for (let f = 2; f < 5; f++) {
        if (fingerToPalmDist(hand, f) >= OPEN_THRESHOLD) {
            openCount++;
        }
    }
    // At least 2 of middle/ring/pinky must be open for a true pinch
    return openCount >= 2;
}

function getPinchMidpoint3D(hand) {
    const thumb = hand.fingertips[0];
    const index = hand.fingertips[1];
    return mapToWorldSpace({
        x: (thumb.x + index.x) / 2,
        y: (thumb.y + index.y) / 2,
        z: (thumb.z + index.z) / 2
    });
}

function getPalmDistance(h1, h2) {
    const dx = h1.palm.x - h2.palm.x;
    const dy = h1.palm.y - h2.palm.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function getTwoHandCenter3D(h1, h2) {
    return mapToWorldSpace({
        x: (h1.palm.x + h1.fingertips[2].x + h2.palm.x + h2.fingertips[2].x) / 4,
        y: (h1.palm.y + h1.fingertips[2].y + h2.palm.y + h2.fingertips[2].y) / 4,
        z: (h1.palm.z + h1.fingertips[2].z + h2.palm.z + h2.fingertips[2].z) / 4
    });
}

function getDepthMult(hand) {
    return Math.max(0.4, Math.min((hand.palmSpan || REF_PALM_SPAN) / REF_PALM_SPAN, 2.5));
}

function getAvgDepthMult(h1, h2) {
    const avgSpan = ((h1.palmSpan || REF_PALM_SPAN) + (h2.palmSpan || REF_PALM_SPAN)) / 2;
    return Math.max(0.4, Math.min(avgSpan / REF_PALM_SPAN, 2.5));
}

// ═══════════════════════════════════════════════════
// MAIN GESTURE UPDATE
// ═══════════════════════════════════════════════════

function updateGestures(handData) {
    scatterTriggered = false;
    const handCount = handData.length;

    // ═══════════════════════════════════════════
    // NO HANDS
    // ═══════════════════════════════════════════
    if (handCount === 0) {
        const hasSphere = visualForm === 'SPHERE' || visualForm.includes('SPHERE');
        if (hasSphere && state !== 'SCATTER' && scatterTimer === 0) {
            // If any sphere existed (sphere+cloud, two spheres, or one sphere), combine into center sphere!
            state = 'IDLE';
            visualForm = 'SPHERE';
            targetCenter.set(0, 0, 0);
            targetScale = 1.0;
        } else if (state !== 'PINCH') {
            // If NO sphere existed (only clouds or actively scattering), scatter across the screen!
            if (state !== 'SCATTER') {
                scatterTriggered = true;
            }
            state = 'SCATTER';
            visualForm = 'CLOUD';
            if (scatterTimer > 0) scatterTimer--;
            wasPinching = false;
        }
        return finish();
    }

    // ═══════════════════════════════════════════
    // ONE HAND
    // ═══════════════════════════════════════════
    if (handCount === 1) {
        const hand = handData[0];
        const palm3D = mapToWorldSpace(hand.palm);

        // ── CHECK FIST FIRST! (before pinch — prevents confusion) ──
        const fist = isFist(hand);
        if (fist) fistCooldown = 15;
        if (fistCooldown > 0) fistCooldown--;
        const rawPinch = !fist && (fistCooldown === 0) && isPinchGesture(hand);
        if (rawPinch) pinchHoldCount++; else pinchHoldCount = 0;
        const pinch = rawPinch;
        const pinchDist = getPinchDistance(hand);

        // ── 1. Just released pinch → BIG BANG scatter! ──
        if (wasPinching && !pinch) {
            state = 'SCATTER';
            visualForm = 'CLOUD';   // After scatter, it's all clouds!
            isSphereHalf1 = false;
            isSphereHalf2 = false;
            scatterTriggered = true;
            scatterTimer = SCATTER_DURATION;
            wasPinching = false;
            return finish();
        }

        // ── 2. If scattered across screen: pinching must NOT gather or compress! Must show open palm first! ──
        if (state === 'SCATTER' && pinch) {
            // Ignore pinch while scattered! Stay scattered!
            if (scatterTimer > 0) scatterTimer--;
            return finish();
        }

        // ── 3. Scatter timer still running (and showing open palm or no gesture) ──
        if (scatterTimer > 0) {
            if (!pinch && !fist && scatterTimer <= 30) {
                // Showing an open palm after initial explosion (grace period finished): gather cloud to palm!
                scatterTimer = 0;
            } else {
                state = 'SCATTER';
                scatterTimer--;
                return finish();
            }
        }

        // ── 4. Fist detected: condense cloud into sphere ──
        if (fist && !wasPinching) {
            scatterTimer = 0;
            state = 'FOLLOW';
            visualForm = 'SPHERE';
            isSphereHalf1 = true;
            isSphereHalf2 = true;
            targetCenter.copy(palm3D);
            targetScale = 0.65;
            return finish();
        }

        // ── 5. Pinch (while holding sphere or gathered cloud): compress into tiny ball ──
        if (pinch) {
            state = 'PINCH';
            targetCenter.copy(getPinchMidpoint3D(hand));
            targetScale = Math.max(0.06, (pinchDist / PINCH_THRESHOLD) * 0.3);
            if (pinchHoldCount >= 2) wasPinching = true;
            scatterTimer = 0;
            return finish();
        }

        // ── 6. Post-scatter CLOUD (or remaining from SPLIT): open palm gathers particles ──
        if (visualForm === 'CLOUD' || visualForm.startsWith('SPLIT')) {
            const wasSplitSphere = visualForm.startsWith('SPLIT') && visualForm.includes('SPHERE');
            if (wasSplitSphere) {
                state = 'FOLLOW';
                visualForm = 'SPHERE';
                isSphereHalf1 = true;
                isSphereHalf2 = true;
                targetCenter.copy(palm3D);
                targetScale = 0.65;
            } else {
                state = 'GATHER';
                visualForm = 'CLOUD';
                isSphereHalf1 = false;
                isSphereHalf2 = false;
                targetCenter.copy(palm3D);
                targetScale = 0.45;
            }
            return finish();
        }

        // ── 7. Normal SPHERE mode: follows open palm ──
        state = 'FOLLOW';
        targetCenter.copy(palm3D);
        targetScale = 1.0;
        return finish();
    }

    // ═══════════════════════════════════════════
    // TWO HANDS
    // ═══════════════════════════════════════════
    if (handCount >= 2) {
        const h1 = handData[0];
        const h2 = handData[1];
        const palmDist = getPalmDistance(h1, h2);
        const p1 = mapToWorldSpace(h1.palm);
        const p2 = mapToWorldSpace(h2.palm);
        const dist3D = p1.distanceTo(p2);

        const fist1 = isFist(h1);
        const fist2 = isFist(h2);
        if (fist1) fistCooldown1 = 15;
        if (fist2) fistCooldown2 = 15;
        if (fistCooldown1 > 0) fistCooldown1--;
        if (fistCooldown2 > 0) fistCooldown2--;
        const rawPinch1 = !fist1 && (fistCooldown1 === 0) && isPinchGesture(h1);
        const rawPinch2 = !fist2 && (fistCooldown2 === 0) && isPinchGesture(h2);
        if (rawPinch1) pinchHoldCount1++; else pinchHoldCount1 = 0;
        if (rawPinch2) pinchHoldCount2++; else pinchHoldCount2 = 0;
        const pinch1 = rawPinch1;
        const pinch2 = rawPinch2;

        if (pinch1 || wasPinching1) recentPinch1 = 15; else if (recentPinch1 > 0) recentPinch1--;
        if (pinch2 || wasPinching2) recentPinch2 = 15; else if (recentPinch2 > 0) recentPinch2--;

        // ── 1. If clapping/merging palms together → unified compressed sphere! ──
        if (palmDist < CLAP_THRESHOLD) {
            wasPinching1 = false;
            wasPinching2 = false;
            state = 'TWO_HAND';
            visualForm = 'SPHERE';
            isSphereHalf1 = true;
            isSphereHalf2 = true;
            targetCenter.copy(getTwoHandCenter3D(h1, h2));
            targetScale = palmDist < 0.12 ? 0.06 : Math.max(0.06, Math.min(dist3D / 8.5, 4.0));
            return finish();
        }

        // ── 2. Both hands just released pinches simultaneously (within 250ms window) → BIG BANG scatter! ──
        if (palmDist >= 0.28 && recentPinch1 > 0 && !pinch1 && recentPinch2 > 0 && !pinch2) {
            state = 'SCATTER';
            visualForm = 'CLOUD';
            isSphereHalf1 = false;
            isSphereHalf2 = false;
            scatterTriggered = 3;
            scatterTimer = SCATTER_DURATION;
            wasPinching1 = false;
            wasPinching2 = false;
            recentPinch1 = 0;
            recentPinch2 = 0;
            return finish();
        }

        // ── 3. One hand just released a pinch → scatter into a cloud on that hand! ──
        // (In unified TWO_HAND sphere mode, if ONLY ONE hand pinched and released, ignore it so nothing happens!)
        const ignoreSingle1 = (state === 'TWO_HAND' && recentPinch2 === 0);
        const ignoreSingle2 = (state === 'TWO_HAND' && recentPinch1 === 0);

        if (!ignoreSingle1 && palmDist >= 0.28 && wasPinching1 && !pinch1) {
            scatterTriggered = 1;
            wasPinching1 = false;
            isSphereHalf1 = false; // Bursts out Hand 1 back to cloud!
        } else if (!ignoreSingle2 && palmDist >= 0.28 && wasPinching2 && !pinch2) {
            scatterTriggered = 2;
            wasPinching2 = false;
            isSphereHalf2 = false; // Bursts out Hand 2 back to cloud!
        }

        // Update pinch history (require holding for >= 2 frames to avoid transient 1-frame glitches!)
        if (pinchHoldCount1 >= 2) wasPinching1 = true; else if (!pinch1) wasPinching1 = false;
        if (pinchHoldCount2 >= 2) wasPinching2 = true; else if (!pinch2) wasPinching2 = false;

        if (scatterTimer > 0) {
            scatterTimer--;
        }

        // ── 4. If currently a CLOUD (or already SPLIT) + 2 palms apart → SPLIT into two halves! ──
        if ((visualForm === 'CLOUD' || visualForm.startsWith('SPLIT')) && palmDist >= CLAP_THRESHOLD) {
            if (visualForm === 'CLOUD') {
                isSphereHalf1 = false;
                isSphereHalf2 = false;
            }
            const targetP1 = pinch1 ? getPinchMidpoint3D(h1) : p1;
            const targetP2 = pinch2 ? getPinchMidpoint3D(h2) : p2;
            if (state !== 'SPLIT') {
                hand1Center.copy(targetP1);
                hand2Center.copy(targetP2);
            } else {
                hand1Center.lerp(targetP1, CENTER_LERP);
                hand2Center.lerp(targetP2, CENTER_LERP);
            }
            state = 'SPLIT';
            targetCenter.copy(getTwoHandCenter3D(h1, h2));
            targetScale = (pinch1 || pinch2) ? 0.35 : 0.45;

            // Once a half becomes a sphere (by making a fist), it STAYS a sphere unless burst out by pinch out!
            if (fist1) isSphereHalf1 = true;
            if (fist2) isSphereHalf2 = true;

            const form1 = pinch1 ? 'PINCH' : (isSphereHalf1 ? 'SPHERE' : 'CLOUD');
            const form2 = pinch2 ? 'PINCH' : (isSphereHalf2 ? 'SPHERE' : 'CLOUD');

            visualForm = `SPLIT_${form1}_${form2}`;
            return finish();
        }

        // ── 5. SPHERE mode + 2 palms apart → enlarge and deflate unified sphere! ──
        state = 'TWO_HAND';
        visualForm = 'SPHERE';
        targetCenter.copy(getTwoHandCenter3D(h1, h2));
        targetScale = Math.max(0.06, Math.min(dist3D / 8.5, 4.0));
        return finish();
    }

    finish();
}

function finish() {
    const centerSpeed = (state === 'PINCH') ? 0.45 : CENTER_LERP;
    sphereCenter.lerp(targetCenter, centerSpeed);
    sphereScale += (targetScale - sphereScale) * SCALE_LERP;
}

// ── Public Getters ──
function getState() { return state; }
function getVisualForm() { return visualForm; }
function getSphereCenter() { return sphereCenter; }
function getSphereScale() { return sphereScale; }
function wasScatterTriggered() { return scatterTriggered; }
function getHand1Center() { return (state === 'SPLIT') ? hand1Center : null; }
function getHand2Center() { return (state === 'SPLIT') ? hand2Center : null; }
function getScatterTimer() { return scatterTimer; }
function getMergeTargetHand() { return mergeTargetHand; }

export {
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
};
