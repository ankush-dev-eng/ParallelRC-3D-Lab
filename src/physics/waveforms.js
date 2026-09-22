// Pure time-domain waveform helpers for the virtual oscilloscope.
// The functions use the RMS electrical snapshot and return instantaneous values.

const SQRT_TWO =
    Math.SQRT2;

export function sampleSourceVoltage(
    timeSeconds,
    voltageVrms,
    frequencyHz,
    generatorOn
) {
    if (!generatorOn) {
        return 0;
    }

    return (
        SQRT_TWO *
        voltageVrms *
        Math.sin(
            2 *
            Math.PI *
            frequencyHz *
            timeSeconds
        )
    );
}

export function sampleCurrent(
    timeSeconds,
    currentRmsA,
    frequencyHz,
    phaseRad,
    generatorOn
) {
    if (
        !generatorOn ||
        currentRmsA <= 0
    ) {
        return 0;
    }

    return (
        SQRT_TWO *
        currentRmsA *
        Math.sin(
            2 *
            Math.PI *
            frequencyHz *
            timeSeconds +
            phaseRad
        )
    );
}

export function generateWaveformSamples({
    count = 320,
    timeWindowSeconds,
    voltageVrms,
    frequencyHz,
    currentRmsA,
    phaseRad,
    generatorOn,
}) {
    const voltage = [];
    const current = [];

    for (
        let index = 0;
        index < count;
        index += 1
    ) {
        const progress =
            count <= 1
                ? 0
                : index /
                (count - 1);

        const timeSeconds =
            progress *
            timeWindowSeconds;

        voltage.push(
            sampleSourceVoltage(
                timeSeconds,
                voltageVrms,
                frequencyHz,
                generatorOn
            )
        );

        current.push(
            sampleCurrent(
                timeSeconds,
                currentRmsA,
                frequencyHz,
                phaseRad,
                generatorOn
            )
        );
    }

    return {
        voltage,
        current,
    };
}

// MY UNDERSTANDING:
// The oscilloscope does not numerically simulate every circuit element.
// It samples the exact analytic AC equations already produced by the physics engine.