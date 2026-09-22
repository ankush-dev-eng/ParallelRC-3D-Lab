// These functions contain the mathematical formulas for our ideal parallel RC circuit.
// They do not depend on React, Three.js, or the UI.

// Calculate capacitive reactance: Xc = 1 / (2πfC)
export function computeXc(frequencyHz, capacitanceUf) {
    const capacitanceF = capacitanceUf * 1e-6;

    if (frequencyHz <= 0 || capacitanceF <= 0) {
        return Infinity;
    }

    return 1 / (2 * Math.PI * frequencyHz * capacitanceF);
}

// Calculate the resistor branch current: IR = V / R
export function computeIR(voltageVrms, resistanceOhm) {
    if (voltageVrms < 0 || resistanceOhm <= 0) {
        return 0;
    }

    return voltageVrms / resistanceOhm;
}

// Calculate the capacitor branch current: IC = 2πfCV
export function computeIC(voltageVrms, frequencyHz, capacitanceUf) {
    if (voltageVrms < 0 || frequencyHz <= 0 || capacitanceUf <= 0) {
        return 0;
    }

    return (
        2 *
        Math.PI *
        frequencyHz *
        (capacitanceUf * 1e-6) *
        voltageVrms
    );
}

// Calculate total current using the perpendicular resistor and capacitor currents.
export function computeIT(IR, IC) {
    return Math.hypot(IR, IC);
}

// Calculate the phase angle between the total current and source voltage.
export function computePhi(IR, IC) {
    if (IR === 0 && IC === 0) {
        return 0;
    }

    return Math.atan2(IC, IR);
}

// Calculate the equivalent impedance: Z = V / IT
export function computeZ(voltageVrms, IT) {
    if (IT <= 0) {
        return Infinity;
    }

    return voltageVrms / IT;
}

// Calculate all important electrical values for one set of circuit parameters.
export function getElectricalSnapshot({
    voltageVrms,
    frequencyHz,
    resistanceOhm,
    capacitanceUf,
}) {
    const Xc = computeXc(frequencyHz, capacitanceUf);
    //this tells us how much the capacitor resists AC at a particular frequency.
    const IR = computeIR(voltageVrms, resistanceOhm);
    // resistor current is simply voltage divided by resistance.
    const IC = computeIC(voltageVrms, frequencyHz, capacitanceUf);
    //capacitor current becomes larger when frequency, capacitance, or voltage increases.
    const IT = computeIT(IR, IC);
    const phiRad = computePhi(IR, IC);

    return {
        Xc,
        IR,
        IC,
        IT,
        phiRad,
        phiDeg: (phiRad * 180) / Math.PI,
        Z: computeZ(voltageVrms, IT),
    };
}