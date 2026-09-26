import { useMemo } from "react";

import { generateWaveformSamples } from "../physics/waveforms";

// Build an SVG polyline from normalized waveform samples.
// The scope itself remains a visual instrument; the RC physics stays
// in the central physics layer and only supplies the measured values here.
function buildPolyline(samples, width, height, maxValue) {
    const centerY = height / 2;

    if (
        !samples ||
        samples.length === 0 ||
        maxValue <= 0
    ) {
        return "";
    }

    return samples
        .map((value, index) => {
            const x =
                samples.length <= 1
                    ? 0
                    : (index / (samples.length - 1)) * width;

            const normalized = Math.max(
                -1,
                Math.min(1, value / maxValue)
            );

            const y =
                centerY -
                normalized * (height * 0.40);

            return `${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(" ");
}

const COLORS = {
    panel: "#111714",
    panelRaised: "#171D19",
    grid: "#35403A",
    gridStrong: "#56635B",
    text: "#D8D4CA",
    muted: "#7F877F",

    copper: "#A1664A",
    copperDark: "#714A3A",

    voltage: "#B9C7C0",
    current: "#46B8AE",
    currentBright: "#6BD5CC",

    safe: "#6D8A72",
};

const selectStyle = {
    width: "100%",
    padding: "6px 8px",
    border: `1px solid ${COLORS.gridStrong}`,
    borderRadius: 2,
    background: COLORS.panelRaised,
    color: COLORS.text,
    fontFamily: "IBM Plex Mono, ui-monospace, monospace",
    fontSize: 11,
    outline: "none",
    cursor: "pointer",
    pointerEvents: "auto",
};

function ChannelBadge({ label, color, detail }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                minWidth: 0,
            }}
        >
            <span
                style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: color,
                    boxShadow: `0 0 0 1px ${color}55`,
                    flex: "0 0 auto",
                }}
            />
            <span
                style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color,
                }}
            >
                {label}
            </span>
            <span
                style={{
                    fontFamily:
                        "IBM Plex Mono, ui-monospace, monospace",
                    fontSize: 10,
                    color: COLORS.muted,
                    whiteSpace: "nowrap",
                }}
            >
                {detail}
            </span>
        </div>
    );
}

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
    analysisMode = false,
}) {
    const width = 680;
    const traceHeight = analysisMode ? 150 : 208;

    const timeWindowSeconds =
        (timePerDivMs * 10) / 1000;

    const waveforms = useMemo(
        () =>
            generateWaveformSamples({
                count: 400,
                timeWindowSeconds,
                voltageVrms,
                frequencyHz,
                currentRmsA,
                phaseRad: phiRad,
                generatorOn,
            }),
        [
            timeWindowSeconds,
            voltageVrms,
            frequencyHz,
            currentRmsA,
            generatorOn,
            phiRad,
        ]
    );

    const voltageMax =
        Math.max(
            0.1,
            ch1VoltsPerDiv * 4
        );

    const currentMax =
        Math.max(
            0.0005,
            (ch2MilliAmpsPerDiv * 4) / 1000
        );

    const voltagePolyline = buildPolyline(
        waveforms.voltage,
        width,
        traceHeight,
        voltageMax
    );

    const currentPolyline = buildPolyline(
        waveforms.current,
        width,
        traceHeight,
        currentMax
    );

    const clampLabel = clampPoint ?? "TRAY";

    // MY UNDERSTANDING:
    // The voltage and current traces come from the same RC snapshot used
    // elsewhere in the application. This keeps the oscilloscope consistent
    // with the DMM and phasor instead of inventing another calculation.

    return (
        <section
            aria-label="Oscilloscope"
            style={{
                position: "fixed",
                left: analysisMode ? 364 : "auto",
                right: analysisMode ? 24 : 28,
                bottom: analysisMode ? 18 : 28,
                width: analysisMode ? "auto" : "min(700px, 52vw)",
                minWidth: analysisMode ? 0 : 520,
                maxHeight: analysisMode ? "34vh" : "none",
                background: COLORS.panel,
                border: `1px solid ${COLORS.gridStrong}`,
                boxShadow: "0 18px 42px rgba(0,0,0,0.28)",
                zIndex: 22,
                pointerEvents: "none",
                overflow: "hidden",
            }}
        >
            {/* Thin copper instrument rail gives the scope a physical identity. */}
            <div
                style={{
                    height: 3,
                    background: COLORS.copper,
                }}
            />

            {/* Instrument header. */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 16,
                    alignItems: "center",
                    padding: analysisMode ? "7px 11px" : "10px 13px",
                    borderBottom: `1px solid ${COLORS.grid}`,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 12,
                        minWidth: 0,
                    }}
                >
                    <span
                        style={{
                            color: COLORS.text,
                            fontFamily: "IBM Plex Sans, sans-serif",
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                        }}
                    >
                        Oscilloscope
                    </span>

                    <span
                        style={{
                            color: COLORS.muted,
                            fontFamily:
                                "IBM Plex Mono, ui-monospace, monospace",
                            fontSize: 10,
                            whiteSpace: "nowrap",
                        }}
                    >
                        AC / DUAL TRACE
                    </span>
                </div>

                <div
                    style={{
                        fontFamily:
                            "IBM Plex Mono, ui-monospace, monospace",
                        fontSize: 10,
                        color: COLORS.muted,
                        whiteSpace: "nowrap",
                    }}
                >
                    {frequencyHz.toLocaleString()} Hz
                </div>
            </div>

            {/* Channel strip. */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 18,
                    padding: "8px 13px",
                    borderBottom: `1px solid ${COLORS.grid}`,
                    background: COLORS.panelRaised,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: 18,
                        minWidth: 0,
                    }}
                >
                    <ChannelBadge
                        label="CH1"
                        color={COLORS.voltage}
                        detail={`${ch1VoltsPerDiv} V/div`}
                    />

                    <ChannelBadge
                        label="CH2"
                        color={COLORS.currentBright}
                        detail={`${ch2MilliAmpsPerDiv} mA/div`}
                    />
                </div>

                <div
                    style={{
                        fontFamily:
                            "IBM Plex Mono, ui-monospace, monospace",
                        fontSize: 10,
                        color:
                            clampPoint
                                ? COLORS.currentBright
                                : COLORS.muted,
                        whiteSpace: "nowrap",
                    }}
                >
                    {clampLabel}
                </div>
            </div>

            {/* Main trace area. */}
            <div
                style={{
                    padding: analysisMode ? 8 : 12,
                }}
            >
                <svg
                    viewBox={`0 0 ${width} ${traceHeight}`}
                    width="100%"
                    height={traceHeight}
                    style={{
                        display: "block",
                        background: "#0B100E",
                        border: `1px solid ${COLORS.grid}`,
                        pointerEvents: "none",
                    }}
                >
                    {/* Fine horizontal grid. */}
                    {Array.from(
                        { length: 9 },
                        (_, index) => {
                            const fraction = index / 8;
                            const y =
                                traceHeight *
                                fraction;

                            return (
                                <line
                                    key={`h-${index}`}
                                    x1={0}
                                    x2={width}
                                    y1={y}
                                    y2={y}
                                    stroke={
                                        index === 4
                                            ? COLORS.gridStrong
                                            : COLORS.grid
                                    }
                                    strokeWidth={
                                        index === 4
                                            ? 1.2
                                            : 0.7
                                    }
                                />
                            );
                        }
                    )}

                    {/* Fine vertical grid. */}
                    {Array.from(
                        { length: 11 },
                        (_, index) => {
                            const x =
                                (index / 10) *
                                width;

                            return (
                                <line
                                    key={`v-${index}`}
                                    x1={x}
                                    x2={x}
                                    y1={0}
                                    y2={traceHeight}
                                    stroke={
                                        index === 5
                                            ? COLORS.gridStrong
                                            : COLORS.grid
                                    }
                                    strokeWidth={
                                        index === 5
                                            ? 1.2
                                            : 0.7
                                    }
                                />
                            );
                        }
                    )}

                    {/* Source voltage. */}
                    <polyline
                        points={voltagePolyline}
                        fill="none"
                        stroke={COLORS.voltage}
                        strokeWidth={2.1}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        opacity={0.94}
                    />

                    {/* Current trace uses the measurement accent. */}
                    <polyline
                        points={currentPolyline}
                        fill="none"
                        stroke={COLORS.currentBright}
                        strokeWidth={2.3}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />

                    {/* Small channel labels inside the scope. */}
                    <text
                        x={12}
                        y={19}
                        fill={COLORS.voltage}
                        fontFamily="IBM Plex Mono, monospace"
                        fontSize={11}
                        fontWeight={700}
                    >
                        CH1  V
                    </text>

                    <text
                        x={12}
                        y={36}
                        fill={COLORS.currentBright}
                        fontFamily="IBM Plex Mono, monospace"
                        fontSize={11}
                        fontWeight={700}
                    >
                        CH2  I
                    </text>

                    <text
                        x={width - 12}
                        y={19}
                        textAnchor="end"
                        fill={COLORS.muted}
                        fontFamily="IBM Plex Mono, monospace"
                        fontSize={10}
                    >
                        {clampLabel}
                    </text>
                </svg>

                {/* Instrument readout line. */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(4, minmax(0, 1fr))",
                        borderLeft: `1px solid ${COLORS.grid}`,
                        borderRight: `1px solid ${COLORS.grid}`,
                        borderBottom: `1px solid ${COLORS.grid}`,
                        background: COLORS.panelRaised,
                    }}
                >
                    {[
                        ["V RMS", `${voltageVrms.toFixed(2)} V`],
                        [
                            "I RMS",
                            `${(currentRmsA * 1000).toFixed(2)} mA`,
                        ],
                        ["PHASE", `${(phiRad * 180 / Math.PI).toFixed(1)}°`],
                        ["TIME/DIV", `${timePerDivMs} ms`],
                    ].map(([label, value], index) => (
                        <div
                            key={label}
                            style={{
                                padding: "8px 10px",
                                borderRight:
                                    index < 3
                                        ? `1px solid ${COLORS.grid}`
                                        : "none",
                            }}
                        >
                            <div
                                style={{
                                    color: COLORS.muted,
                                    fontFamily:
                                        "IBM Plex Sans, sans-serif",
                                    fontSize: 8,
                                    fontWeight: 700,
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    marginBottom: 3,
                                }}
                            >
                                {label}
                            </div>

                            <div
                                style={{
                                    color:
                                        label === "I RMS"
                                            ? COLORS.currentBright
                                            : COLORS.text,
                                    fontFamily:
                                        "IBM Plex Mono, ui-monospace, monospace",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {value}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Physical-control strip. Only this area accepts pointer input. */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(3, minmax(0, 1fr))",
                    gap: 8,
                    padding: analysisMode ? "0 10px 8px" : "0 12px 12px",
                    pointerEvents: "auto",
                }}
            >
                <select
                    aria-label="CH1 volts per division"
                    value={ch1VoltsPerDiv}
                    onChange={(event) =>
                        onControlChange({
                            ch1VoltsPerDiv:
                                Number(event.target.value),
                        })
                    }
                    style={selectStyle}
                >
                    <option value={1}>1 V/div</option>
                    <option value={2}>2 V/div</option>
                    <option value={5}>5 V/div</option>
                    <option value={10}>10 V/div</option>
                </select>

                <select
                    aria-label="CH2 milliamps per division"
                    value={ch2MilliAmpsPerDiv}
                    onChange={(event) =>
                        onControlChange({
                            ch2MilliAmpsPerDiv:
                                Number(event.target.value),
                        })
                    }
                    style={selectStyle}
                >
                    <option value={0.5}>0.5 mA/div</option>
                    <option value={1}>1 mA/div</option>
                    <option value={2}>2 mA/div</option>
                    <option value={5}>5 mA/div</option>
                    <option value={10}>10 mA/div</option>
                </select>

                <select
                    aria-label="Time per division"
                    value={timePerDivMs}
                    onChange={(event) =>
                        onControlChange({
                            timePerDivMs:
                                Number(event.target.value),
                        })
                    }
                    style={selectStyle}
                >
                    <option value={0.05}>0.05 ms/div</option>
                    <option value={0.1}>0.1 ms/div</option>
                    <option value={0.2}>0.2 ms/div</option>
                    <option value={0.5}>0.5 ms/div</option>
                    <option value={1}>1 ms/div</option>
                </select>
            </div>

            {/* MY UNDERSTANDING:
                The scope does not calculate circuit physics.
                It visualizes the authoritative voltage/current snapshot.
                CH2 uses the selected clamp current, so the graph and DMM stay
                consistent. The overlay ignores pointer events except for its
                three instrument controls, leaving the 3D lab interactive. */}
        </section>
    );
}
