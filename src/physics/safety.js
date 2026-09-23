// ------------------------------------------------------------
// CAPACITOR SAFETY MODEL
// ------------------------------------------------------------

// These limits define the educational safety profile of the capacitor.
export const CAPACITOR_RATED_VOLTAGE_V = 16;
export const CAPACITOR_CURRENT_LIMIT_A = 0.05;

// Stress is shown as a normalized value from 0 to 1.
export const STRESS_WARNING_THRESHOLD = 0.8;
export const STRESS_TRIP_THRESHOLD = 1.0;

// Recovery uses hysteresis so the learner must move clearly back
// into a safe operating region before the generator can restart.
export const STRESS_RECOVERY_THRESHOLD = 0.15;
export const STRESS_RECOVERY_OVERLOAD = 0.8;

// These rates control how quickly accumulated stress rises and falls.
// This is an educational integrator, not a thermal-materials model.
export const STRESS_INTEGRATION_RATE = 0.6;
export const STRESS_DECAY_RATE = 0.4;

// Calculate the normalized worst-case electrical load on the capacitor.
// A value of 1.0 means the rated voltage/current limit has been reached.
export function getSafetyOverload({
    voltageVrms,
    currentA,
}) {
    const safeVoltage =
        Number.isFinite(voltageVrms)
            ? Math.abs(voltageVrms)
            : 0;

    const safeCurrent =
        Number.isFinite(currentA)
            ? Math.abs(currentA)
            : 0;

    const voltageRatio =
        safeVoltage /
        CAPACITOR_RATED_VOLTAGE_V;

    const currentRatio =
        safeCurrent /
        CAPACITOR_CURRENT_LIMIT_A;

    return Math.max(
        voltageRatio,
        currentRatio
    );
}

// Advance the stored capacitor stress by dt seconds.
// Overload above 1 accumulates stress; safe operation lets it decay.
export function nextCapStress(
    previousStress,
    overload,
    dt
) {
    const currentStress =
        Number.isFinite(previousStress)
            ? previousStress
            : 0;

    const safeOverload =
        Number.isFinite(overload)
            ? Math.max(0, overload)
            : 0;

    const safeDt =
        Number.isFinite(dt)
            ? Math.max(0, dt)
            : 0;

    let nextStress =
        currentStress;

    if (
        safeOverload > 1
    ) {
        // Squared overload makes sustained large overloads accumulate
        // faster and keeps the safety event easy to demonstrate.
        nextStress +=
            (
                safeOverload *
                safeOverload -
                1
            ) *
            STRESS_INTEGRATION_RATE *
            safeDt;
    } else {
        nextStress -=
            STRESS_DECAY_RATE *
            safeDt;
    }

    return Math.min(
        STRESS_TRIP_THRESHOLD,
        Math.max(0, nextStress)
    );
}

// MY UNDERSTANDING:
// This file contains only the pure safety mathematics.
// It does not know about React, Three.js, the camera, or the UI.
// The runtime supplies the current electrical load and elapsed time,
// then stores the resulting capStress back into the laboratory state.
// The model intentionally represents capacitor stress rather than
// pretending to simulate a detailed thermal or ESR model.