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
    return isComponentConnected(state.wiring.resistor);
}

// Check whether the capacitor has both terminals connected.
export function selectCapacitorConnected(state) {
    return isComponentConnected(state.wiring.capacitor);
}

// Check whether both generator leads are connected.
export function selectSupplyConnected(state) {
    return (
        state.wiring.hotLead !== null &&
        state.wiring.returnLead !== null
    );
}

// The circuit is assembled only when both components and
// both supply connections are correctly placed.
export function selectCircuitAssembled(state) {
    return (
        selectResistorConnected(state) &&
        selectCapacitorConnected(state) &&
        selectSupplyConnected(state)
    );
}

// The simulation can run only when the circuit is assembled,
// the generator is powered on, and the safety system has not tripped.
export function selectSimulationActive(state) {
    return (
        selectCircuitAssembled(state) &&
        state.controls.generatorOn &&
        !state.safety.tripped
    );
}

