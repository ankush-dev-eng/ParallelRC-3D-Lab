import {
    useCallback,
    useSyncExternalStore,
} from "react";

// This is the starting state for one laboratory session.
// All major parts of the simulation will eventually read/write through this state.
const initialState = {
    wiring: {
        resistor: [null, null],
        capacitor: [null, null],
        hotLead: null,
        returnLead: null,
    },

    controls: {
        // Main electrical controls used by the experiment.
        voltageVrms: 3,
        frequencyHz: 1000,
        resistanceOhm: 1000,
        capacitanceUf: 0.1,

        // Instrument/power controls.
        generatorOn: false,
        scopeOn: false,

        // Oscilloscope display controls.
        ch1VoltsPerDiv: 2,
        ch2MilliAmpsPerDiv: 2,
        timePerDivMs: 0.2,
    },

    clamp: {
        point: null,
    },

    progress: {
        currentStep: 1,
        completedSteps: Array(8).fill(false),
        fiveXChallengeCompleted: false,
        safetyTripObserved: false,
        safetyRecoveryObserved: false,
        reportGenerated: false,
    },

    log: [],
    errors: [],

    safety: {
        capStress: 0,
        tripped: false,
    },

    cameraView: "bench",

    sessionSeed: 12345,
};

// The store keeps the current experiment state outside individual React components.
let state = structuredClone(initialState);

// React components that subscribe to the store are kept here.
const listeners = new Set();

// Notify every subscriber that the state has changed.
function emit() {
    listeners.forEach((listener) => listener());
}

// Update the state and then notify React about the change.
function updateState(updater) {
    const nextState =
        typeof updater === "function"
            ? updater(state)
            : updater;

    if (nextState === state) {
        return;
    }

    state = nextState;
    emit();
}

// My understanding:
// I keep the experiment data in one central place so the circuit,
// instruments, controls, progress system, and report can all use
// the same experiment state.

export const labStore = {
    // Return the complete current laboratory state.
    getState() {
        return state;
    },

    // Add a React subscriber to the store.
    subscribe(listener) {
        listeners.add(listener);

        // React calls this cleanup function when the subscriber is removed.
        return () => {
            listeners.delete(listener);
        };
    },

    // Update one or more electrical/control values.
    setControls(patch) {
        updateState((current) => ({
            ...current,
            controls: {
                ...current.controls,
                ...patch,
            },
        }));
    },

    // Move the virtual current clamp to a measurement point.
    setClampPoint(point) {
        updateState((current) => ({
            ...current,
            clamp: {
                point,
            },
        }));
    },

    // Update the circuit wiring information.
    setWiring(patch) {
        updateState((current) => ({
            ...current,
            wiring: {
                ...current.wiring,
                ...patch,
            },
        }));
    },

    // Change which laboratory camera view is active.
    setCameraView(cameraView) {
        updateState((current) => ({
            ...current,
            cameraView,
        }));
    },

    // Update safety information such as capacitor stress or a safety trip.
    setSafety(patch) {
        updateState((current) => ({
            ...current,
            safety: {
                ...current.safety,
                ...patch,
            },
        }));
    },

    // Update the user's progress through the guided experiment.
    setProgress(patch) {
        updateState((current) => ({
            ...current,
            progress: {
                ...current.progress,
                ...patch,
            },
        }));
    },

    // Add a measurement entry to the experiment notebook.
    appendLog(entry) {
        updateState((current) => ({
            ...current,
            log: [...current.log, entry],
        }));
    },

    // Return the laboratory to its initial state.
    reset() {
        state = structuredClone(initialState);
        emit();
    },
};

// Connect React to our external store.
// The selector lets a component subscribe to only the value it needs.
export function useLabStore(selector) {
    // This subscription function stays stable between React renders.
    const subscribe = useCallback(
        (listener) => labStore.subscribe(listener),
        []
    );

    // React asks for the selected value whenever it needs a fresh snapshot.
    const getSnapshot = useCallback(
        () => selector(labStore.getState()),
        [selector]
    );

    return useSyncExternalStore(
        subscribe,
        getSnapshot,
        getSnapshot
    );
}

// My understanding:
// This hook connects React to the central store while allowing
// each component to subscribe only to the piece of state it needs.