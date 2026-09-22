import {
    useMemo,
} from "react";

import {
    generateWaveformSamples,
} from "../physics/waveforms";

// Draw one waveform using SVG so the browser can scale the scope cleanly
// without introducing another charting dependency.
function buildPolyline(
    samples,
    width,
    height,
    maxValue
) {
    const centerY =
        height / 2;

    if (
        samples.length === 0 ||
        maxValue <= 0
    ) {
        return "";
    }

    return samples
        .map(
            (
                value,
                index
            ) => {
                const x =
                    samples.length <=
                        1
                        ? 0
                        : (index /
                            (samples.length -
                                1)) *
                        width;

                const normalized =
                    Math.max(
                        -1,
                        Math.min(
                            1,
                            value /
                            maxValue
                        )
                    );

                const y =
                    centerY -
                    normalized *
                    (height *
                        0.46);

                return `${x.toFixed(
                    2
                )},${y.toFixed(
                    2
                )}`;
            }
        )
        .join(" ");
}

const selectStyle = {
    padding:
        "7px 8px",
    borderRadius: 7,
    border:
        "1px solid #334155",
    background:
        "#111827",
    color:
        "#e5e7eb",

    // The select controls must still receive mouse input
    // even though the parent scope panel ignores pointer events.
    pointerEvents:
        "auto",
};

export default function Oscilloscope({
    voltageVrms,
    frequencyHz,
    clampPoint,
    currentRmsA,
    generatorOn,
    phiRad,
    ch1VoltsPerDiv,
    ch2MilliAmpsPerDiv,
    timePerDivMs,
    onControlChange,
}) {
    const width = 620;
    const traceHeight = 190;

    const timeWindowSeconds =
        (timePerDivMs *
            10) /
        1000;

    const waveforms =
        useMemo(
            () =>
                generateWaveformSamples(
                    {
                        count: 360,
                        timeWindowSeconds,
                        voltageVrms,
                        frequencyHz,
                        currentRmsA,
                        phaseRad:
                            phiRad,
                        generatorOn,
                    }
                ),
            [
                timeWindowSeconds,
                voltageVrms,
                frequencyHz,
                currentRmsA,
                generatorOn,
                phiRad,
            ]
        );

    // Use the selected volts/div and mA/div to determine visible ranges.
    const voltageMax =
        ch1VoltsPerDiv *
        4;

    const currentMax =
        (ch2MilliAmpsPerDiv *
            4) /
        1000;

    const voltagePolyline =
        buildPolyline(
            waveforms.voltage,
            width,
            traceHeight,
            voltageMax
        );

    const currentPolyline =
        buildPolyline(
            waveforms.current,
            width,
            traceHeight,
            currentMax
        );

    const pointLabel =
        clampPoint ??
        "TRAY";

    return (
        <div
            style={{
                position:
                    "absolute",

                right: 18,
                bottom: 68,

                // Slightly narrower than the previous 660px panel.
                // This leaves more room for the 3D laboratory.
                width: 600,

                maxWidth:
                    "calc(100vw - 40px)",

                padding: 14,
                borderRadius: 14,

                background:
                    "rgba(4, 9, 16, 0.94)",

                border:
                    "1px solid rgba(71, 85, 105, 0.55)",

                boxShadow:
                    "0 16px 45px rgba(0,0,0,0.35)",

                zIndex: 11,

                // IMPORTANT:
                // The visual scope must not block the 3D laboratory.
                //
                // Without this, the HTML scope div captures mouse
                // events before Three.js can receive them. This was
                // why the clamp became impossible to grab when the
                // oscilloscope was open.
                pointerEvents:
                    "none",
            }}
        >
            <div
                style={{
                    display:
                        "flex",
                    justifyContent:
                        "space-between",
                    alignItems:
                        "center",
                    marginBottom: 10,

                    // This is just display content, so it does not
                    // need to receive pointer events.
                    pointerEvents:
                        "none",
                }}
            >
                <div>
                    <strong>
                        Virtual Oscilloscope
                    </strong>{" "}
                    <span
                        style={{
                            color:
                                "#94a3b8",
                        }}
                    >
                        CH1 Voltage ·
                        CH2 Current
                    </span>
                </div>

                <div
                    style={{
                        fontSize: 12,
                        color:
                            "#cbd5e1",
                    }}
                >
                    Clamp:{" "}
                    {
                        pointLabel
                    }
                </div>
            </div>

            <svg
                viewBox={`0 0 ${width} ${traceHeight}`}
                width="100%"
                height={
                    traceHeight
                }
                style={{
                    display:
                        "block",
                    background:
                        "#020617",
                    borderRadius: 8,
                    border:
                        "1px solid #1e293b",

                    // Explicitly keep the graph itself transparent
                    // to pointer input so 3D objects behind it remain usable.
                    pointerEvents:
                        "none",
                }}
            >
                {/* Horizontal grid. */}
                {[
                    0.125,
                    0.25,
                    0.375,
                    0.5,
                    0.625,
                    0.75,
                    0.875,
                ].map(
                    (
                        fraction
                    ) => (
                        <line
                            key={`h-${fraction}`}
                            x1={0}
                            x2={width}
                            y1={
                                traceHeight *
                                fraction
                            }
                            y2={
                                traceHeight *
                                fraction
                            }
                            stroke="#1e293b"
                            strokeWidth={
                                1
                            }
                        />
                    )
                )}

                {/* Vertical grid. */}
                {Array.from(
                    {
                        length: 11,
                    },
                    (
                        _,
                        index
                    ) => {
                        const x =
                            (index /
                                10) *
                            width;

                        return (
                            <line
                                key={`v-${index}`}
                                x1={x}
                                x2={x}
                                y1={0}
                                y2={
                                    traceHeight
                                }
                                stroke="#1e293b"
                                strokeWidth={
                                    1
                                }
                            />
                        );
                    }
                )}

                {/* Center reference line. */}
                <line
                    x1={0}
                    x2={width}
                    y1={
                        traceHeight /
                        2
                    }
                    y2={
                        traceHeight /
                        2
                    }
                    stroke="#475569"
                    strokeWidth={
                        1.2
                    }
                />

                {/* Source-voltage trace. */}
                <polyline
                    points={
                        voltagePolyline
                    }
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth={
                        2.2
                    }
                />

                {/* Current trace. */}
                <polyline
                    points={
                        currentPolyline
                    }
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth={
                        2.2
                    }
                />
            </svg>

            <div
                style={{
                    display:
                        "grid",
                    gridTemplateColumns:
                        "repeat(3, 1fr)",
                    gap: 8,
                    marginTop: 10,

                    // These are labels only.
                    pointerEvents:
                        "none",
                }}
            >
                <div>
                    <div
                        style={{
                            color:
                                "#60a5fa",
                            fontWeight:
                                700,
                        }}
                    >
                        CH1
                    </div>

                    {
                        ch1VoltsPerDiv
                    }{" "}
                    V/div
                </div>

                <div>
                    <div
                        style={{
                            color:
                                "#fbbf24",
                            fontWeight:
                                700,
                        }}
                    >
                        CH2
                    </div>

                    {
                        ch2MilliAmpsPerDiv
                    }{" "}
                    mA/div
                </div>

                <div>
                    <div
                        style={{
                            color:
                                "#94a3b8",
                            fontWeight:
                                700,
                        }}
                    >
                        Time
                    </div>

                    {
                        timePerDivMs
                    }{" "}
                    ms/div
                </div>
            </div>

            {/* Scope controls are the one part of this overlay
                that intentionally receives pointer events. */}
            <div
                style={{
                    display:
                        "grid",
                    gridTemplateColumns:
                        "repeat(3, 1fr)",
                    gap: 8,
                    marginTop: 10,

                    pointerEvents:
                        "auto",
                }}
            >
                <select
                    value={
                        ch1VoltsPerDiv
                    }
                    onChange={(
                        event
                    ) =>
                        onControlChange(
                            {
                                ch1VoltsPerDiv:
                                    Number(
                                        event
                                            .target
                                            .value
                                    ),
                            }
                        )
                    }
                    style={
                        selectStyle
                    }
                >
                    <option value={1}>
                        1 V/div
                    </option>

                    <option value={2}>
                        2 V/div
                    </option>

                    <option value={5}>
                        5 V/div
                    </option>

                    <option
                        value={
                            10
                        }
                    >
                        10 V/div
                    </option>
                </select>

                <select
                    value={
                        ch2MilliAmpsPerDiv
                    }
                    onChange={(
                        event
                    ) =>
                        onControlChange(
                            {
                                ch2MilliAmpsPerDiv:
                                    Number(
                                        event
                                            .target
                                            .value
                                    ),
                            }
                        )
                    }
                    style={
                        selectStyle
                    }
                >
                    <option value={0.5}>
                        0.5 mA/div
                    </option>

                    <option value={1}>
                        1 mA/div
                    </option>

                    <option value={2}>
                        2 mA/div
                    </option>

                    <option value={5}>
                        5 mA/div
                    </option>

                    <option value={10}>
                        10 mA/div
                    </option>
                </select>

                <select
                    value={
                        timePerDivMs
                    }
                    onChange={(
                        event
                    ) =>
                        onControlChange(
                            {
                                timePerDivMs:
                                    Number(
                                        event
                                            .target
                                            .value
                                    ),
                            }
                        )
                    }
                    style={
                        selectStyle
                    }
                >
                    <option
                        value={
                            0.05
                        }
                    >
                        0.05 ms/div
                    </option>

                    <option
                        value={
                            0.1
                        }
                    >
                        0.1 ms/div
                    </option>

                    <option
                        value={
                            0.2
                        }
                    >
                        0.2 ms/div
                    </option>

                    <option
                        value={
                            0.5
                        }
                    >
                        0.5 ms/div
                    </option>

                    <option value={1}>
                        1 ms/div
                    </option>
                </select>
            </div>

            <div
                style={{
                    marginTop: 10,
                    fontSize: 12,
                    color:
                        "#94a3b8",
                    lineHeight:
                        1.5,

                    pointerEvents:
                        "none",
                }}
            >
                CH1 is source voltage.
                CH2 follows the
                selected clamp point
                and uses the same RC
                current calculation
                as the DMM.
            </div>

            {/* MY UNDERSTANDING:
                The oscilloscope is only a visual instrument. It takes the
                already-calculated voltage, current, frequency and phase and
                turns them into two time-domain traces.

                The scope is an HTML overlay, while the clamp is a Three.js
                object underneath it. pointerEvents:none lets the 3D lab
                continue receiving mouse input through the visual scope.
                Only the scope's dropdown controls accept mouse input. */}
        </div>
    );
}