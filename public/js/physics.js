// ═══════════════════════════════════════════════════
// physics.js — Attraction Physics with Volumetric CLOUD vs SPHERE behaviour
// ═══════════════════════════════════════════════════

// ── Constants (Ultra-smooth premium feel) ──
const SPRING_K = 0.045;
const SPRING_K_STRONG = 0.07;
const DAMPING = 0.91;
const SCATTER_DAMPING = 0.995;
const SCATTER_FORCE = 1.7;

// Cloud has looser spring + volumetric offsets so particles swirl gracefully instead of locking into a grid
const CLOUD_SPRING_K = 0.024;
const CLOUD_DAMPING = 0.93;
const CLOUD_NOISE = 0.010;

// ── Screen Bounding Box ──
const LIMIT_X = 18.5;
const LIMIT_Y = 10.5;
const LIMIT_Z = 8.0;

/**
 * Update all particle positions for one frame.
 */
function updatePhysics(
    state, visualForm, sphereCenter, sphereScale, scatterTriggered,
    hand1Center, hand2Center, scatterTimer, mergeTargetHand,
    positions, velocities, unitOffsets, cloudOffsets,
    geometry, particleCount, baseRadius
) {
    // ─── SCATTER EXPLOSION (one-time impulse) ───
    if (scatterTriggered) {
        for (let i = 0; i < particleCount; i++) {
            const idx = i * 3;
            const isHand1 = (i % 2 === 0);

            // If only Hand 1 triggered scatter, skip Hand 2!
            if (state === 'SPLIT' && scatterTriggered === 1 && !isHand1) continue;
            // If only Hand 2 triggered scatter, skip Hand 1!
            if (state === 'SPLIT' && scatterTriggered === 2 && isHand1) continue;

            const origin = (state === 'SPLIT' && hand1Center && hand2Center) ? (isHand1 ? hand1Center : hand2Center) : sphereCenter;
            const dx = positions[idx]     - origin.x;
            const dy = positions[idx + 1] - origin.y;
            const dz = positions[idx + 2] - origin.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1;

            const force = (state === 'SPLIT' || state === 'TWO_HAND') ? (SCATTER_FORCE * 0.08) : (SCATTER_FORCE * (0.8 + Math.random() * 1.0));

            velocities[idx]     += (dx / dist) * force;
            velocities[idx + 1] += (dy / dist) * force;
            velocities[idx + 2] += (dz / dist) * force;
        }
    }

    // ─── PER-PARTICLE PHYSICS ───
    const isScatter = (state === 'SCATTER');
    const isSplit = (state === 'SPLIT' && hand1Center && hand2Center);
    const isGather = (state === 'GATHER');
    const isCloud = (visualForm === 'CLOUD' && !isScatter);
    const radius = baseRadius * sphereScale;

    // Choose spring strength based on form
    let k, damp;
    if (isScatter) {
        k = 0;
        damp = SCATTER_DAMPING;
    } else if (state === 'PINCH') {
        k = SPRING_K_STRONG;
        damp = DAMPING;
    } else if (isCloud || isGather) {
        k = CLOUD_SPRING_K;
        damp = CLOUD_DAMPING;
    } else {
        k = SPRING_K;
        damp = DAMPING;
    }

    for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;

        if (isScatter) {
            // ── Bounce inside screen ──
            if (positions[idx] > LIMIT_X)  { positions[idx] = LIMIT_X;  velocities[idx] *= -0.75; }
            if (positions[idx] < -LIMIT_X) { positions[idx] = -LIMIT_X; velocities[idx] *= -0.75; }
            if (positions[idx + 1] > LIMIT_Y)  { positions[idx + 1] = LIMIT_Y;  velocities[idx + 1] *= -0.75; }
            if (positions[idx + 1] < -LIMIT_Y) { positions[idx + 1] = -LIMIT_Y; velocities[idx + 1] *= -0.75; }
            if (positions[idx + 2] > LIMIT_Z)  { positions[idx + 2] = LIMIT_Z;  velocities[idx + 2] *= -0.75; }
            if (positions[idx + 2] < -LIMIT_Z) { positions[idx + 2] = -LIMIT_Z; velocities[idx + 2] *= -0.75; }

            velocities[idx]     *= damp;
            velocities[idx + 1] *= damp;
            velocities[idx + 2] *= damp;
        } else if (isSplit) {
            // ── SPLIT: Even→Hand1, Odd→Hand2 ──
            const isHand1 = (i % 2 === 0);
            const center = isHand1 ? hand1Center : hand2Center;
            const parts = visualForm.split('_');
            const halfForm = isHand1 ? (parts[1] || 'CLOUD') : (parts[2] || 'CLOUD');

            if (scatterTimer > 30 && halfForm === 'CLOUD') {
                if (positions[idx] > LIMIT_X)  { positions[idx] = LIMIT_X;  velocities[idx] *= -0.75; }
                if (positions[idx] < -LIMIT_X) { positions[idx] = -LIMIT_X; velocities[idx] *= -0.75; }
                if (positions[idx + 1] > LIMIT_Y)  { positions[idx + 1] = LIMIT_Y;  velocities[idx + 1] *= -0.75; }
                if (positions[idx + 1] < -LIMIT_Y) { positions[idx + 1] = -LIMIT_Y; velocities[idx + 1] *= -0.75; }
                if (positions[idx + 2] > LIMIT_Z)  { positions[idx + 2] = LIMIT_Z;  velocities[idx + 2] *= -0.75; }
                if (positions[idx + 2] < -LIMIT_Z) { positions[idx + 2] = -LIMIT_Z; velocities[idx + 2] *= -0.75; }

                velocities[idx]     *= SCATTER_DAMPING;
                velocities[idx + 1] *= SCATTER_DAMPING;
                velocities[idx + 2] *= SCATTER_DAMPING;
                positions[idx]     += velocities[idx];
                positions[idx + 1] += velocities[idx + 1];
                positions[idx + 2] += velocities[idx + 2];
                continue;
            }

            const isSphereHalf = (halfForm === 'SPHERE' || halfForm === 'PINCH');
            const offsets = isSphereHalf ? unitOffsets : cloudOffsets;
            const halfRadius = (halfForm === 'PINCH') ? (radius * 0.15) : radius;

            const targetX = center.x + offsets[idx]     * halfRadius;
            const targetY = center.y + offsets[idx + 1] * halfRadius;
            const targetZ = center.z + offsets[idx + 2] * halfRadius;

            const noise = isSphereHalf ? 0 : CLOUD_NOISE;
            const kHalf = (halfForm === 'PINCH') ? SPRING_K_STRONG : (isSphereHalf ? SPRING_K : CLOUD_SPRING_K);
            const dampHalf = isSphereHalf ? DAMPING : CLOUD_DAMPING;

            velocities[idx]     += kHalf * (targetX - positions[idx]) + (Math.random() - 0.5) * noise;
            velocities[idx + 1] += kHalf * (targetY - positions[idx + 1]) + (Math.random() - 0.5) * noise;
            velocities[idx + 2] += kHalf * (targetZ - positions[idx + 2]) + (Math.random() - 0.5) * noise;
            velocities[idx]     *= dampHalf;
            velocities[idx + 1] *= dampHalf;
            velocities[idx + 2] *= dampHalf;
        } else {
            // ── SPHERE / CLOUD / GATHER / TWO_HAND / PINCH ──
            // In CLOUD form or GATHER state, use volumetric random cloudOffsets! Otherwise use organized unitOffsets!
            const offsets = (isCloud || isGather) ? cloudOffsets : unitOffsets;
            const targetX = sphereCenter.x + offsets[idx]     * radius;
            const targetY = sphereCenter.y + offsets[idx + 1] * radius;
            const targetZ = sphereCenter.z + offsets[idx + 2] * radius;

            // Cloud adds subtle noise for organic swirling feel
            const noise = (isCloud || isGather) ? CLOUD_NOISE : 0;

            velocities[idx]     += k * (targetX - positions[idx]) + (Math.random() - 0.5) * noise;
            velocities[idx + 1] += k * (targetY - positions[idx + 1]) + (Math.random() - 0.5) * noise;
            velocities[idx + 2] += k * (targetZ - positions[idx + 2]) + (Math.random() - 0.5) * noise;
            velocities[idx]     *= damp;
            velocities[idx + 1] *= damp;
            velocities[idx + 2] *= damp;
        }

        positions[idx]     += velocities[idx];
        positions[idx + 1] += velocities[idx + 1];
        positions[idx + 2] += velocities[idx + 2];
    }

    geometry.attributes.position.needsUpdate = true;
}

export { updatePhysics };
