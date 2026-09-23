// These functions derive useful information from the central laboratory state.
// They do not modify state and do not depend on React or Three.js.

// A component is considered connected when both of its terminals
// have been assigned valid socket IDs.
export function isComponentConnected(terminals) {
    return (
        Array.isArray(terminals) &&
        terminals.length === 2 &&
        terminals[0] !== null &&
        terminals[1] !== null
    );
}

// Check whether the resistor has both terminals connected.
export function selectResistorConnected(state) {
    return isComponentConnected(
        state.wiring.resistor
    );
}

// Check whether the capacitor has both terminals connected.
export function selectCapacitorConnected(state) {
    return isComponentConnected(
        state.wiring.capacitor
    );
}

// Check whether both generator leads are connected.
//
// The generator is currently represented as an ideal AC source,
// so these leads are not required for the core circuit-assembly gate.
export function selectSupplyConnected(state) {
    return (
        state.wiring.hotLead !== null &&
        state.wiring.returnLead !== null
    );
}

// The circuit is assembled when both parallel branches
// are physically placed on the breadboard.
export function selectCircuitAssembled(state) {
    return (
        selectResistorConnected(state) &&
        selectCapacitorConnected(state)
    );
}

// The simulation can run only when the circuit is assembled,
// the generator is powered on, and safety has not tripped.
export function selectSimulationActive(state) {
    return (
        selectCircuitAssembled(state) &&
        state.controls.generatorOn &&
        !state.safety.tripped
    );
}

// Step 6 challenge helper.
//
// This function is intentionally kept outside the 3D scene.
// The already-computed electrical snapshot is passed in so the
// challenge uses the same physics result as the phasor and scope.
export function isFiveXChallengeMet(
    {
        voltageVrms,
        frequencyHz,
        resistanceOhm,
        capacitanceUf,
        simulationActive,
    },
    electricalSnapshot
) {
    if (
        !simulationActive ||
        !electricalSnapshot ||
        voltageVrms !== 5 ||
        resistanceOhm !== 1000 ||
        capacitanceUf !== 0.1 ||
        frequencyHz < 7600 ||
        frequencyHz > 8300 ||
        electricalSnapshot.IR <= 0
    ) {
        return false;
    }

    const ratio =
        electricalSnapshot.IC /
        electricalSnapshot.IR;

    // The ratio is deterministic, so no debounce is needed.
    // A ±0.25 teaching window surrounds the 5× target.
    return Math.abs(ratio - 5) <= 0.25;
}

// MY UNDERSTANDING:
// R and C are the two actual parallel branches of this experiment.
//
// Once both components have their two legs connected to valid A/B
// socket pairs, the intended parallel RC network exists.
//
// The generator is currently an ideal source rather than a manually
// wired pair of leads, so hotLead/returnLead do not block assembly.
//
// selectSimulationActive adds the runtime conditions that the generator
// is ON and the safety system has not tripped.
//
// The Step 6 helper receives the shared electrical snapshot and keeps
// the frequency challenge logic out of the 3D renderer.