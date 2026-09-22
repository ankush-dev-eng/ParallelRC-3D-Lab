// This file converts the shared electrical snapshot into the current
// observed by the virtual clamp. It contains no React or Three.js code.

export function getClampCurrentRms(
    clampPoint,
    electricalSnapshot,
    {
        generatorOn,
        circuitAssembled,
    } = {}
) {
    // The idealized lab only reports current when the source is powered
    // and the complete parallel circuit is assembled.
    if (
        !generatorOn ||
        !circuitAssembled
    ) {
        return 0;
    }

    if (
        clampPoint ===
        "P_R"
    ) {
        return electricalSnapshot.IR;
    }

    if (
        clampPoint ===
        "P_C"
    ) {
        return electricalSnapshot.IC;
    }

    if (
        clampPoint ===
        "P_TOT"
    ) {
        return electricalSnapshot.IT;
    }

    return 0;
}

// MY UNDERSTANDING:
// The clamp does not calculate new circuit physics. It simply selects
// which already-computed branch or total current the virtual meter shows.