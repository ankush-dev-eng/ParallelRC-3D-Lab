// These functions derive useful information from the central laboratory state.
//
// They do not modify state and do not depend on React or Three.js.

// A component is considered connected when both of its terminals
// have been assigned valid socket IDs.
export function isComponentConnected(
    terminals
) {
    return (
        Array.isArray(
            terminals
        ) &&
        terminals.length === 2 &&
        terminals[0] !== null &&
        terminals[1] !== null
    );
}

// Check whether the resistor has both terminals connected.
export function selectResistorConnected(
    state
) {
    return isComponentConnected(
        state.wiring.resistor
    );
}

// Check whether the capacitor has both terminals connected.
export function selectCapacitorConnected(
    state
) {
    return isComponentConnected(
        state.wiring.capacitor
    );
}

// Check whether both generator leads are connected.
//
// The generator is currently represented as an ideal AC source,
// so these leads are not required for the core circuit-assembly gate.
// This selector is kept for future physical lead interaction.
export function selectSupplyConnected(
    state
) {
    return (
        state.wiring.hotLead !==
        null &&
        state.wiring.returnLead !==
        null
    );
}

// The circuit is considered assembled when both parallel branches
// are physically placed on the breadboard.
//
// IMPORTANT:
// We do not require hotLead/returnLead here yet because the current
// implementation uses the AC generator as an ideal source and those
// physical supply-lead interactions have not been built.
//
// This allows the measurement system to become active as soon as
// the resistor and capacitor form the intended parallel circuit.
export function selectCircuitAssembled(
    state
) {
    return (
        selectResistorConnected(
            state
        ) &&
        selectCapacitorConnected(
            state
        )
    );
}

// The simulation can run only when the circuit is assembled,
// the generator is powered on, and the safety system has not tripped.
export function selectSimulationActive(
    state
) {
    return (
        selectCircuitAssembled(
            state
        ) &&
        state.controls
            .generatorOn &&
        !state.safety.tripped
    );
}

// MY UNDERSTANDING:
//
// R and C are the two actual parallel branches of this experiment.
//
// Once both components have their two legs connected to valid A/B
// socket pairs, the intended parallel RC network exists, so the
// circuit can be treated as assembled.
//
// The generator is currently an ideal source rather than a separate
// manually wired pair of leads, so requiring hotLead and returnLead
// here would incorrectly block the simulation.
//
// selectSimulationActive then adds the two runtime conditions:
// the generator must be ON and the safety system must not be tripped.