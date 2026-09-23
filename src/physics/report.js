// ------------------------------------------------------------
// LAB REPORT BUILDER
// ------------------------------------------------------------

// Calculate percentage error between a measured and theoretical value.
// A missing or zero theoretical value is reported as unavailable.
export function getPercentError(
    measuredValue,
    theoreticalValue
) {
    if (
        !Number.isFinite(measuredValue) ||
        !Number.isFinite(theoreticalValue) ||
        theoreticalValue === 0
    ) {
        return null;
    }

    return (
        Math.abs(
            measuredValue -
            theoreticalValue
        ) /
        Math.abs(theoreticalValue)
    ) *
        100;
}

// Convert one raw notebook entry into report-friendly data.
export function buildMeasurementReportRow(
    entry
) {
    const percentError =
        getPercentError(
            entry.measuredCurrentRmsA,
            entry.theoreticalCurrentRmsA
        );

    return {
        point:
            entry.point,

        voltageVrms:
            entry.voltageVrms,

        frequencyHz:
            entry.frequencyHz,

        resistanceOhm:
            entry.resistanceOhm,

        capacitanceUf:
            entry.capacitanceUf,

        measuredCurrentRmsA:
            entry.measuredCurrentRmsA,

        theoreticalCurrentRmsA:
            entry.theoreticalCurrentRmsA,

        percentError,

        timestamp:
            entry.timestamp,
    };
}

// Build the complete laboratory report from the central experiment state.
// This function is pure and does not modify React or the laboratory store.
export function buildLabReport({
    generatedAt,
    referenceSetup,
    referenceSnapshot,
    setup,
    snapshot,
    measurementLog,
    safety,
    progress,
    reflection,
}) {
    const measurements =
        measurementLog.map(
            buildMeasurementReportRow
        );

    const errorValues =
        measurements
            .map(
                (row) =>
                    row.percentError
            )
            .filter(
                (value) =>
                    Number.isFinite(
                        value
                    )
            );

    const averageError =
        errorValues.length > 0
            ? errorValues.reduce(
                (
                    sum,
                    value
                ) =>
                    sum + value,
                0
            ) /
            errorValues.length
            : null;

    return {
        title:
            "Parallel RC — Engineering Lab Report",

        generatedAt,

        // Official reference configuration.
        referenceSetup: {
            voltageVrms:
                referenceSetup
                    .voltageVrms,

            frequencyHz:
                referenceSetup
                    .frequencyHz,

            resistanceOhm:
                referenceSetup
                    .resistanceOhm,

            capacitanceUf:
                referenceSetup
                    .capacitanceUf,
        },

        // Expected values for the official reference configuration.
        referenceSnapshot: {
            Xc:
                referenceSnapshot.Xc,

            IR:
                referenceSnapshot.IR,

            IC:
                referenceSnapshot.IC,

            IT:
                referenceSnapshot.IT,

            phiDeg:
                referenceSnapshot.phiDeg,

            Z:
                referenceSnapshot.Z,
        },

        // Actual controls when the report was generated.
        setup: {
            voltageVrms:
                setup.voltageVrms,

            frequencyHz:
                setup.frequencyHz,

            resistanceOhm:
                setup.resistanceOhm,

            capacitanceUf:
                setup.capacitanceUf,
        },

        // Actual electrical snapshot for that final setup.
        liveSnapshot: {
            Xc:
                snapshot.Xc,

            IR:
                snapshot.IR,

            IC:
                snapshot.IC,

            IT:
                snapshot.IT,

            phiDeg:
                snapshot.phiDeg,

            Z:
                snapshot.Z,
        },

        measurements,

        measurementSummary: {
            count:
                measurements.length,

            averageError,
        },

        safety: {
            capStress:
                safety.capStress,

            tripped:
                safety.tripped,

            tripObserved:
                progress
                    .safetyTripObserved,

            recoveryObserved:
                progress
                    .safetyRecoveryObserved,
        },

        completion: {
            stepsCompleted:
                progress.completedSteps.filter(
                    Boolean
                ).length,

            totalSteps:
                progress.completedSteps
                    .length,
        },

        reflection: {
            observation:
                reflection
                    .observation
                    .trim(),

            frequencyExplanation:
                reflection
                    .frequencyExplanation
                    .trim(),

            safetyExplanation:
                reflection
                    .safetyExplanation
                    .trim(),
        },
    };
}

// Format the structured report into plain text.
// This is used by the Copy button.
export function formatLabReportText(
    report
) {
    const lines = [
        report.title,

        "=".repeat(
            report.title.length
        ),

        `Generated: ${report.generatedAt}`,

        "",

        "REFERENCE SETUP",

        `Voltage: ${report.referenceSetup.voltageVrms} Vrms`,

        `Frequency: ${report.referenceSetup.frequencyHz} Hz`,

        `Resistance: ${report.referenceSetup.resistanceOhm} Ω`,

        `Capacitance: ${report.referenceSetup.capacitanceUf} µF`,

        `Expected IR: ${(report.referenceSnapshot.IR * 1000).toFixed(2)} mA`,

        `Expected IC: ${(report.referenceSnapshot.IC * 1000).toFixed(2)} mA`,

        `Expected IT: ${(report.referenceSnapshot.IT * 1000).toFixed(2)} mA`,

        `Expected Phase: ${report.referenceSnapshot.phiDeg.toFixed(1)}° lead`,

        `Expected Z: ${report.referenceSnapshot.Z.toFixed(1)} Ω`,

        "",

        "FINAL OBSERVED SETUP",

        `Voltage: ${report.setup.voltageVrms} Vrms`,

        `Frequency: ${report.setup.frequencyHz} Hz`,

        `Resistance: ${report.setup.resistanceOhm} Ω`,

        `Capacitance: ${report.setup.capacitanceUf} µF`,

        "",

        "LIVE ELECTRICAL SNAPSHOT",

        `Xc: ${report.liveSnapshot.Xc.toFixed(1)} Ω`,

        `IR: ${(report.liveSnapshot.IR * 1000).toFixed(2)} mA`,

        `IC: ${(report.liveSnapshot.IC * 1000).toFixed(2)} mA`,

        `IT: ${(report.liveSnapshot.IT * 1000).toFixed(2)} mA`,

        `Phase: ${report.liveSnapshot.phiDeg.toFixed(1)}° lead`,

        `Z: ${report.liveSnapshot.Z.toFixed(1)} Ω`,

        "",

        "MEASUREMENT LOG",
    ];

    report.measurements.forEach(
        (
            row,
            index
        ) => {
            const errorText =
                row.percentError ===
                    null
                    ? "n/a"
                    : `${row.percentError.toFixed(
                        2
                    )}%`;

            lines.push(
                `${index + 1}. ${row.point} | ${row.frequencyHz} Hz | ` +
                `Measured ${(row.measuredCurrentRmsA * 1000).toFixed(2)} mA | ` +
                `Theoretical ${(row.theoreticalCurrentRmsA * 1000).toFixed(2)} mA | ` +
                `Error ${errorText}`
            );
        }
    );

    lines.push(
        "",

        `Measurements logged: ${report.measurementSummary.count}`,

        report.measurementSummary
            .averageError ===
            null
            ? "Average error: n/a"
            : `Average error: ${report.measurementSummary.averageError.toFixed(
                2
            )}%`,

        "",

        "SAFETY",

        `Safety trip observed: ${report.safety.tripObserved
            ? "Yes"
            : "No"
        }`,

        `Safety recovery observed: ${report.safety.recoveryObserved
            ? "Yes"
            : "No"
        }`,

        "",

        "REFLECTION",

        `Observation: ${report.reflection
            .observation ||
        "Not entered."
        }`,

        `Frequency/current relationship: ${report.reflection
            .frequencyExplanation ||
        "Not entered."
        }`,

        `Safety explanation: ${report.reflection
            .safetyExplanation ||
        "Not entered."
        }`
    );

    return lines.join(
        "\n"
    );
}

// MY UNDERSTANDING:
// This file turns the experiment's existing measurements and
// electrical values into a final report. It does not run the
// simulation again. The reference setup is kept separate from
// the final observed setup so the report clearly shows what the
// learner started with and what state was present at the end.