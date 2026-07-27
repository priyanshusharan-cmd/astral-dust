// ═══════════════════════════════════════════════════
// coordinateMapper.js — MediaPipe 2D+Z → Three.js 3D
// Dynamically matches screen dimensions for pixel-perfect tracking
// ═══════════════════════════════════════════════════

import * as THREE from 'three';

/**
 * Compute visible 3D world dimensions at Z=0 for camera at Z=20 with FOV 60.
 * Visible height = 2 * tan(30 deg) * 20 ≈ 23.094
 */
function getVisibleBounds() {
    const aspect = window.innerWidth / window.innerHeight;
    const height = 2 * Math.tan(THREE.MathUtils.degToRad(30)) * 20;
    const width = height * aspect;
    return { width, height };
}

/**
 * Convert a single MediaPipe normalized landmark to Three.js world space.
 *
 * worldX = -(mpX - 0.5) × visibleWidth    (mirrored for selfie)
 * worldY = -(mpY - 0.5) × visibleHeight   (inverted for Three.js Y-up)
 * worldZ = -mpZ × 4.0                     (subtle depth scale to prevent erratic Z jumping)
 */
function mapToWorldSpace(point) {
    const bounds = getVisibleBounds();
    return new THREE.Vector3(
        -(point.x - 0.5) * bounds.width,
        -(point.y - 0.5) * bounds.height,
        -point.z * 4.0
    );
}

/**
 * Map all detected hand landmarks to 3D world space.
 */
function mapAllHandLandmarks(handPositions) {
    const worldPositions = [];

    for (let i = 0; i < handPositions.length; i++) {
        const hand = handPositions[i];

        // Palm center
        worldPositions.push(mapToWorldSpace(hand.palm));

        // All 5 fingertips
        for (let f = 0; f < hand.fingertips.length; f++) {
            worldPositions.push(mapToWorldSpace(hand.fingertips[f]));
        }
    }

    return worldPositions;
}

export { mapToWorldSpace, mapAllHandLandmarks, getVisibleBounds };
