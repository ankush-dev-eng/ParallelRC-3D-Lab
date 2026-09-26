import React, { useState } from "react";
import Oscilloscope from "./Oscilloscope";

// ------------------------------------------------------------
// VISUAL TOKENS
// Working Instrument visual system. These values control presentation only.
// Simulation logic and electrical behavior remain owned by App / physics.
// MY UNDERSTANDING: copper marks user-driven interaction, while the teal
// measurement accent is reserved for values produced by the instrument.
// ------------------------------------------------------------

const COLORS = {
  environment: "#0B0F0D",
  app: "#0B0F0D",
  surface: "#D4CEC3",
  surfaceBright: "#DED8CD",
  recessed: "#C5BEB2",
  text: "#191D1A",
  muted: "#666A63",
  border: "#AEA79B",
  steel: "#6D756F",
  copper: "#9F5B3A",
  copperPressed: "#744331",
  measurement: "#2F6C66",
  success: "#56705D",
  warning: "#9B7847",
  danger: "#994A43",
  disabled: "#98958D",
  viewport: "#0B0F0D",
  viewportText: "#DDD8CF",
  vectorIR: "#2F6C66",
  vectorIC: "#557E75",
  vectorIT: "#E7E1D7",
  phaseArc: "#74877F",
};

const FONT_BRAND = '"Fraunces", Georgia, serif';
const FONT_SANS = '"IBM Plex Sans", Inter, system-ui, sans-serif';
const FONT_CONDENSED = '"IBM Plex Sans Condensed", "IBM Plex Sans", sans-serif';
const FONT_MONO = '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

function formatFrequency(frequencyHz) {
  if (frequencyHz >= 1000) {
    return `${(frequencyHz / 1000).toFixed(1)} kHz`;
  }

  return `${frequencyHz} Hz`;
}

// ------------------------------------------------------------
// SMALL PRESENTATION HELPERS
// ------------------------------------------------------------

function ModeTabs({ activeTab, onChange }) {
  const tabs = [
    ["experiment", "EXPERIMENT"],
    ["analysis", "ANALYSIS"],
    ["progress", "PROGRESS"],
  ];

  return (
    <nav
      style={{
        height: 44,
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        alignItems: "stretch",
        borderBottom: `1px solid ${COLORS.border}`,
        background: COLORS.surface,
      }}
      aria-label="Lab workspace mode"
    >
      {tabs.map(([value, label]) => {
        const active = activeTab === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            style={{
              position: "relative",
              border: 0,
              margin: 0,
              padding: 0,
              background: "transparent",
              color: active ? COLORS.text : COLORS.muted,
              fontFamily: FONT_CONDENSED,
              fontSize: 10,
              lineHeight: "14px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {label}
            {active && (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 2,
                  background: COLORS.copper,
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function RailSection({ eyebrow, title, children, divider = true, variant = "plain" }) {
  return (
    <section
      style={{
        padding: variant === "plain" ? "0 0 22px" : "13px 13px 14px",
        marginBottom: variant === "plain" ? 22 : 16,
        background:
          variant === "readout"
            ? "linear-gradient(180deg, #C8C1B6 0%, #BEB7AC 100%)"
            : variant === "recessed"
              ? "linear-gradient(180deg, #CEC7BB 0%, #C6BFB3 100%)"
              : "transparent",
        border: variant === "plain" ? "none" : `1px solid ${COLORS.border}`,
        boxShadow:
          variant === "plain"
            ? "none"
            : "inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(80,70,58,0.07)",
      }}
    >
      {eyebrow && (
        <div
          style={{
            fontFamily: FONT_CONDENSED,
            fontSize: 10,
            lineHeight: "13px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: COLORS.muted,
            marginBottom: title ? 6 : 0,
          }}
        >
          {eyebrow}
        </div>
      )}

      {title && (
        <div
          style={{
            fontFamily: FONT_SANS,
            fontSize: 15,
            lineHeight: "20px",
            fontWeight: 500,
            color: COLORS.text,
            marginBottom: 12,
          }}
        >
          {title}
        </div>
      )}

      {children}

      {divider && (
        <div
          aria-hidden="true"
          style={{
            height: 1,
            marginTop: 22,
            background: COLORS.border,
          }}
        />
      )}
    </section>
  );
}

function Header({ currentStep }) {
  return (
    <header
      style={{
        height: 88,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 22px",
        background: COLORS.surfaceBright,
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: FONT_BRAND,
            fontSize: 28,
            lineHeight: "30px",
            fontWeight: 500,
            letterSpacing: "-0.01em",
            color: COLORS.text,
          }}
        >
          Parallel RC Lab
        </div>

        <div
          style={{
            marginTop: 4,
            fontFamily: FONT_CONDENSED,
            fontSize: 10,
            lineHeight: "13px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: COLORS.muted,
          }}
        >
          YCCE / ELECTRIC CIRCUITS LABORATORY
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 2,
        }}
      >
        <div
          style={{
            fontFamily: FONT_CONDENSED,
            fontSize: 10,
            lineHeight: "13px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: COLORS.muted,
          }}
        >
          Guided task
        </div>

        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 16,
            lineHeight: "20px",
            fontWeight: 500,
            color: COLORS.text,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {String(currentStep).padStart(2, "0")} / 08
        </div>
      </div>
    </header>
  );
}

function ViewSwitcher({ cameraView, setCameraView }) {
  const views = [
    ["bench", "BENCH"],
    ["board", "BOARD"],
    ["analysis", "ANALYSIS"],
  ];

  const activeIndex = Math.max(
    0,
    views.findIndex(([value]) => value === cameraView),
  );

  return (
    <div
      style={{
        position: "absolute",
        right: 24,
        top: 22,
        zIndex: 31,
        display: "grid",
        gap: 7,
        justifyItems: "end",
        fontFamily: FONT_CONDENSED,
        userSelect: "none",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          fontSize: 10,
          lineHeight: "13px",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#A6A094",
        }}
      >
        Camera view
      </div>

      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "repeat(3, 86px)",
          padding: 3,
          gap: 2,
          border: "1px solid rgba(222,216,205,0.22)",
          background: "#151A17",
          borderRadius: 6,
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.28), 0 8px 24px rgba(0,0,0,0.22)",
        }}
        aria-label="Camera view selector"
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 3,
            left: 3,
            width: 86,
            height: 32,
            border: `1px solid ${COLORS.copper}`,
            borderRadius: 3,
            background: "#D4CEC3",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.40), 0 1px 0 rgba(0,0,0,0.22)",
            transform: `translateX(${activeIndex * 88}px)`,
            transition: "transform 150ms ease-out",
            pointerEvents: "none",
          }}
        />

        {views.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setCameraView(value)}
            className="working-instrument-view-button"
            style={{
              position: "relative",
              zIndex: 2,
              width: 86,
              height: 32,
              padding: 0,
              border: 0,
              background: "transparent",
              color: cameraView === value ? COLORS.text : "#A8ADA6",
              fontFamily: FONT_CONDENSED,
              fontSize: 10,
              lineHeight: "12px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              cursor: "pointer",
              transition: "color 120ms ease, transform 90ms ease",
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RangeControl({ label, value, min, max, step, displayValue, onChange }) {
  const fillPercent =
    max === min
      ? 0
      : Math.min(
        100,
        Math.max(0, ((value - min) / (max - min)) * 100),
      );

  return (
    <label
      style={{
        display: "grid",
        gap: 8,
        fontFamily: FONT_SANS,
      }}
    >
      <span
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
          color: COLORS.text,
          fontSize: 13,
          lineHeight: "18px",
          fontWeight: 500,
        }}
      >
        <span>{label}</span>

        <strong
          style={{
            fontFamily: FONT_MONO,
            fontSize: 14,
            fontWeight: 500,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {displayValue}
        </strong>
      </span>

      <input
        className="parallel-rc-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
        style={{ "--range-fill": `${fillPercent}%` }}
      />
    </label>
  );
}

function DiscreteSelect({ label, value, onChange, options }) {
  return (
    <label style={{ display: "grid", gap: 4, fontFamily: FONT_SANS }}>
      <span
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
          fontSize: 13,
          lineHeight: "20px",
          fontWeight: 500,
          color: COLORS.text,
        }}
      >
        <span>{label}</span>
        <strong style={{ fontWeight: 500 }}>{value} µF</strong>
      </span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "2px 0 6px",
          border: 0,
          borderBottom: `1px solid ${COLORS.border}`,
          borderRadius: 0,
          outline: "none",
          background: COLORS.surface,
          color: COLORS.text,
          fontFamily: FONT_SANS,
          fontSize: 13,
          lineHeight: "20px",
          cursor: "pointer",
        }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option} µF
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAction({ children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="working-instrument-text-action"
      style={{
        border: 0,
        padding: "4px 0",
        background: "transparent",
        color: disabled ? "#9A948A" : COLORS.muted,
        fontFamily: FONT_SANS,
        fontSize: 12,
        lineHeight: "18px",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        textDecoration: disabled ? "none" : "underline",
        textUnderlineOffset: 3,
      }}
    >
      {children}
    </button>
  );
}

function PrimaryAction({ children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="working-instrument-primary"
      style={{
        width: "100%",
        minHeight: 38,
        padding: "8px 13px",
        border: `1px solid ${disabled ? COLORS.border : COLORS.copper}`,
        borderRadius: 2,
        background: disabled ? COLORS.recessed : "#1C211E",
        color: disabled ? COLORS.muted : "#ECE7DE",
        fontFamily: FONT_SANS,
        fontSize: 12,
        lineHeight: "18px",
        fontWeight: 500,
        letterSpacing: "0.01em",
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: "none",
        transition: "transform 90ms ease, background 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
      }}
    >
      {children}
    </button>
  );
}

function MeasurementRow({ label, value, reference, accent = COLORS.text }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        minHeight: 24,
      }}
    >
      <span
        style={{
          width: 80,
          flexShrink: 0,
          fontFamily: FONT_SANS,
          fontSize: 13,
          lineHeight: "20px",
          color: COLORS.muted,
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <span
        style={{
          minWidth: 125,
          fontFamily: FONT_MONO,
          fontSize: 17,
          lineHeight: "22px",
          fontWeight: 500,
          color: accent,
        }}
      >
        {value}
      </span>
      {reference && (
        <span
          style={{
            fontFamily: FONT_SANS,
            fontSize: 11,
            lineHeight: "18px",
            color: COLORS.muted,
          }}
        >
          {reference}
        </span>
      )}
    </div>
  );
}

function LiveValue({ label, value, accent = COLORS.measurement }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontFamily: FONT_CONDENSED,
          fontSize: 10,
          lineHeight: "13px",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: COLORS.muted,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 3,
          fontFamily: FONT_MONO,
          fontSize: 20,
          lineHeight: "24px",
          fontWeight: 500,
          color: accent,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span
          key={`${label}-${value}`}
          className="instrument-value-morph"
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function SafetyStrip({ tone, label }) {
  const color =
    tone === "danger"
      ? COLORS.danger
      : tone === "warning"
        ? COLORS.warning
        : COLORS.success;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        minHeight: 30,
        padding: "0 9px",
        border: `1px solid ${COLORS.border}`,
        background: COLORS.recessed,
        borderRadius: 2,
        fontFamily: FONT_CONDENSED,
        fontSize: 10,
        lineHeight: "14px",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 3,
          height: 16,
          background: color,
          flexShrink: 0,
        }}
      />

      <span style={{ color: COLORS.muted }}>Capacitor protection</span>

      <strong
        style={{
          color,
          fontWeight: 600,
        }}
      >
        {label}
      </strong>
    </div>
  );
}

function ProcedureRow({ number, label, completed, active }) {
  const color = completed || active ? COLORS.text : COLORS.muted;
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 10,
        minHeight: 34,
        padding: "4px 8px 4px 10px",
        borderLeft: `3px solid ${active ? COLORS.copper : "transparent"}`,
        background: active ? "#C6C0B5" : "transparent",
        fontFamily: FONT_SANS,
        fontSize: 12,
        lineHeight: "17px",
        color,
        boxSizing: "border-box",
      }}
    >
      <span
        style={{
          width: 22,
          flexShrink: 0,
          fontFamily: FONT_MONO,
          fontSize: 11,
          fontWeight: 500,
          color: active ? COLORS.copper : COLORS.muted,
        }}
      >
        {String(number).padStart(2, "0")}
      </span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontWeight: active ? 700 : 500,
        }}
      >
        {label}
        {completed ? "  ✓" : ""}
      </span>
    </div>
  );
}

// MY UNDERSTANDING:
// MainDashboard is only the presentation layer. It receives values already
// derived by App and calls callbacks for user actions; it does not run the
// electrical physics or safety engine.

// ------------------------------------------------------------
// MAIN DASHBOARD
// ------------------------------------------------------------

export default function MainDashboard({
  cameraView,
  setCameraView,
  voltageVrms,
  frequencyHz,
  resistanceOhm,
  capacitanceUf,
  setVoltage,
  setFrequency,
  setResistance,
  setCapacitance,
  loadReferenceValues,
  generatorOn,
  toggleGenerator,
  scopeOn,
  toggleScope,
  safetyTripped,
  safetyRecoveryReady,
  safetyWarning,
  capStress,
  safetyOverload,
  capacitorRatedVoltageV,
  capacitorCurrentLimitA,
  clampPoint,
  measuredCurrentRmsA,
  electricalSnapshot,
  referenceSetup,
  referenceSnapshot,
  progress,
  measurementLog,
  reportReady,
  reflection,
  updateReflection,
  generateLabReport,
  reportVisible,
  generatedReport,
  copyLabReport,
  setReportVisible,
  ch1VoltsPerDiv,
  ch2MilliAmpsPerDiv,
  timePerDivMs,
  setScopeControls,
  fiveXChallengeMet,
  currentRatio,
  resetLab,
}) {
  const [activeTab, setActiveTab] = useState("experiment");

  // Keep each workspace tied to a deliberate camera composition instead of
  // letting the previous workspace leak its camera state into the next one.
  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab);

    if (nextTab === "analysis") {
      setCameraView("analysis");
      return;
    }

    if (nextTab === "progress") {
      setCameraView("bench");
      return;
    }

    setCameraView("bench");
  };

  const handleCameraViewChange = (nextView) => {
    if (activeTab === "progress") {
      setCameraView("bench");
      return;
    }

    setCameraView(nextView);
  };

  const safetyState = safetyTripped
    ? safetyRecoveryReady
      ? "READY"
      : "TRIPPED"
    : safetyWarning
      ? "WARNING"
      : "NORMAL";

  const safetyTone = safetyTripped
    ? "danger"
    : safetyWarning
      ? "warning"
      : "success";

  const challengeComplete = Boolean(
    progress.fiveXChallengeCompleted || fiveXChallengeMet,
  );

  const procedureSteps = [
    "Orient the laboratory workspace",
    "Build the parallel branches",
    "Load the reference setup",
    "Measure the branch currents",
    "Measure total current + analysis",
    "Reach the 5× frequency condition",
    "Trigger and recover from safety trip",
    "Complete reflection / generate report",
  ];

  const stepDescriptions = {
    1: {
      title: "Orient the laboratory workspace",
      body: "Understand the bench, component tray, and current measurement points before wiring.",
    },
    2: {
      title: "Build the parallel branches",
      body: "Place the resistor and capacitor across two separate breadboard rails. Components snap only to valid sockets.",
    },
    3: {
      title: "Load the reference setup",
      body: "Use the reference controls before beginning the measurement workflow.",
    },
    4: {
      title: "Measure the branch currents",
      body: "Move the current clamp to the resistor and capacitor measurement points and log both readings.",
    },
    5: {
      title: "Measure total current + analysis",
      body: "Measure total current, then inspect the phasor relationship and oscilloscope traces.",
    },
    6: {
      title: "Reach the 5× frequency condition",
      body: "Sweep frequency until the capacitive branch current is approximately five times the resistive branch current.",
    },
    7: {
      title: "Trigger and recover from safety trip",
      body: "Increase stress until protection trips, reduce the operating point, then restart safely.",
    },
    8: {
      title: "Complete reflection / generate report",
      body: "Write the three lab-notebook reflections and generate the final report.",
    },
  };

  const currentStep = stepDescriptions[progress.currentStep] ?? stepDescriptions[2];

  const renderSourceControls = ({ compact = false } = {}) => (
    <RailSection eyebrow="AC source" title="Generator settings" variant="recessed">
      <div style={{ display: "grid", gap: compact ? 10 : 13 }}>
        <RangeControl
          label="Voltage"
          value={voltageVrms}
          min={1}
          max={10}
          step={0.1}
          displayValue={`${voltageVrms.toFixed(1)} Vrms`}
          onChange={setVoltage}
        />
        <RangeControl
          label="Frequency"
          value={frequencyHz}
          min={1000}
          max={25000}
          step={100}
          displayValue={formatFrequency(frequencyHz)}
          onChange={setFrequency}
        />
        <RangeControl
          label="Resistance"
          value={resistanceOhm}
          min={100}
          max={5000}
          step={100}
          displayValue={`${resistanceOhm} Ω`}
          onChange={setResistance}
        />
        <DiscreteSelect
          label="Capacitance"
          value={capacitanceUf}
          onChange={setCapacitance}
          options={[0.01, 0.1, 1]}
        />
      </div>
    </RailSection>
  );

  const renderExperiment = () => (
    <>
      <RailSection eyebrow="Current step" title={currentStep.title} variant="recessed">
        <div
          style={{
            fontFamily: FONT_SANS,
            fontSize: 12,
            lineHeight: "18px",
            color: COLORS.muted,
            maxWidth: 420,
          }}
        >
          {currentStep.body}
        </div>
      </RailSection>

      {renderSourceControls()}

      <RailSection>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <TextAction onClick={loadReferenceValues}>Load 5 V reference</TextAction>
          <div style={{ width: 200 }}>
            <PrimaryAction onClick={toggleGenerator}>
              {safetyTripped
                ? safetyRecoveryReady
                  ? "Restart generator"
                  : "Safety locked"
                : generatorOn
                  ? "Generator ON"
                  : "Start generator"}
            </PrimaryAction>
          </div>
        </div>
      </RailSection>

      <RailSection eyebrow="Current measurement" title="What the circuit is measuring">
        <div
          style={{
            display: "grid",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontFamily: FONT_SANS, fontSize: 11, color: COLORS.muted }}>
                Clamp
              </div>
              <div
                style={{
                  marginTop: 2,
                  fontFamily: FONT_SANS,
                  fontSize: 16,
                  lineHeight: "22px",
                  fontWeight: 600,
                  color: clampPoint ? COLORS.text : COLORS.muted,
                }}
              >
                {clampPoint ?? "TRAY"}
              </div>
            </div>
            <LiveValue
              label="Clamp RMS"
              value={`${(measuredCurrentRmsA * 1000).toFixed(2)} mA`}
              accent={COLORS.text}
            />
          </div>
          <div
            style={{
              fontFamily: FONT_SANS,
              fontSize: 11,
              lineHeight: "16px",
              color: COLORS.muted,
            }}
          >
            Drag the 3D current clamp to P_R, P_C, or P_TOT.
          </div>
        </div>
      </RailSection>

      <RailSection>
        <SafetyStrip tone={safetyTone} label={safetyState} />
      </RailSection>

      <RailSection eyebrow="Readings" title="Live electrical values" variant="readout">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 16,
          }}
        >
          <LiveValue
            label="IR"
            value={`${(electricalSnapshot.IR * 1000).toFixed(2)} mA`}
          />
          <LiveValue
            label="IC"
            value={`${(electricalSnapshot.IC * 1000).toFixed(2)} mA`}
            accent={COLORS.measurement}
          />
          <LiveValue
            label="IT"
            value={`${(electricalSnapshot.IT * 1000).toFixed(2)} mA`}
            accent={COLORS.measurement}
          />
          <LiveValue
            label="Phase"
            value={`${electricalSnapshot.phiDeg.toFixed(1)}° lead`}
            accent={COLORS.measurement}
          />
          <LiveValue
            label="Xc"
            value={Number.isFinite(electricalSnapshot.Xc) ? `${electricalSnapshot.Xc.toFixed(1)} Ω` : "∞"}
          />
          <LiveValue
            label="Impedance"
            value={Number.isFinite(electricalSnapshot.Z) ? `${electricalSnapshot.Z.toFixed(1)} Ω` : "∞"}
          />
        </div>
      </RailSection>

      <RailSection>
        <button
          type="button"
          onClick={toggleScope}
          style={{
            border: 0,
            padding: 0,
            background: "transparent",
            color: scopeOn ? COLORS.copper : COLORS.muted,
            fontFamily: FONT_SANS,
            fontSize: 13,
            lineHeight: "20px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          OSCILLOSCOPE {scopeOn ? "ON" : "OFF"}
        </button>
      </RailSection>
    </>
  );

  const renderAnalysis = () => (
    <>
      <RailSection eyebrow="Analysis cockpit" title="Live parallel-RC response" variant="readout">
        <div style={{ display: "grid", gap: 13 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12 }}>
            <div>
              <div style={{ fontFamily: FONT_CONDENSED, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.muted }}>
                Frequency
              </div>
              <div style={{ marginTop: 2, fontFamily: FONT_MONO, fontSize: 24, lineHeight: "28px", color: COLORS.text }}>
                {formatFrequency(frequencyHz)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: FONT_CONDENSED, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.muted }}>
                Ratio IC / IR
              </div>
              <div style={{ marginTop: 2, fontFamily: FONT_MONO, fontSize: 18, color: COLORS.measurement }}>
                {currentRatio.toFixed(2)}×
              </div>
            </div>
          </div>
          <div style={{ height: 1, background: COLORS.border }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <LiveValue label="IR" value={`${(electricalSnapshot.IR * 1000).toFixed(2)} mA`} />
            <LiveValue label="IC" value={`${(electricalSnapshot.IC * 1000).toFixed(2)} mA`} accent={COLORS.measurement} />
            <LiveValue label="IT" value={`${(electricalSnapshot.IT * 1000).toFixed(2)} mA`} accent={COLORS.measurement} />
            <LiveValue label="Phase" value={`${electricalSnapshot.phiDeg.toFixed(1)}° lead`} accent={COLORS.copper} />
          </div>
        </div>
      </RailSection>

      <RailSection eyebrow="Current analysis" title="Calculated impedance" divider>
        <div style={{ display: "grid", gap: 6 }}>
          <MeasurementRow
            label="Xc"
            value={Number.isFinite(electricalSnapshot.Xc) ? `${electricalSnapshot.Xc.toFixed(1)} Ω` : "∞"}
          />
          <MeasurementRow
            label="Z"
            value={Number.isFinite(electricalSnapshot.Z) ? `${electricalSnapshot.Z.toFixed(1)} Ω` : "∞"}
          />
        </div>
      </RailSection>

      <RailSection eyebrow="5× challenge" title={challengeComplete ? "Threshold reached" : "Not yet at 5× threshold"}>
        <div
          style={{
            fontFamily: FONT_SANS,
            fontSize: 12,
            lineHeight: "18px",
            color: challengeComplete ? COLORS.success : COLORS.muted,
          }}
        >
          {challengeComplete
            ? "The frequency challenge is latched."
            : `Current ratio ${currentRatio.toFixed(2)}× · sweep frequency until IC ≈ 5 × IR.`}
        </div>
      </RailSection>

      {renderSourceControls({ compact: true })}

      <RailSection eyebrow="Scope" title="Oscilloscope controls">
        <button
          type="button"
          onClick={toggleScope}
          style={{
            border: 0,
            padding: 0,
            background: "transparent",
            color: scopeOn ? COLORS.copper : COLORS.text,
            fontFamily: FONT_SANS,
            fontSize: 13,
            lineHeight: "20px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {scopeOn ? "Hide oscilloscope" : "Show oscilloscope"}
        </button>
      </RailSection>
    </>
  );

  const renderReflection = () => {
    const canEdit = progress.currentStep >= 8;
    const fields = [
      ["OBSERVATION", "observation", "Describe what changed as frequency increased."],
      ["CURRENT / VOLTAGE", "frequencyExplanation", "Explain why capacitor current leads voltage."],
      ["SAFETY", "safetyExplanation", "Explain why the capacitor protection trip occurred."],
    ];

    return (
      <RailSection eyebrow="Reflection" title="Lab notebook notes">
        <div style={{ display: "grid", gap: 14 }}>
          {fields.map(([label, key, placeholder]) => (
            <label key={key} style={{ display: "grid", gap: 4 }}>
              <span
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 11,
                  lineHeight: "16px",
                  fontWeight: 600,
                  letterSpacing: "0.7px",
                  color: COLORS.muted,
                }}
              >
                {label}
              </span>
              <textarea
                value={reflection[key]}
                onChange={(event) => updateReflection(key, event.target.value)}
                disabled={!canEdit}
                placeholder={canEdit ? placeholder : "Available at Step 8."}
                rows={2}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  minHeight: 40,
                  padding: "3px 0 7px",
                  border: 0,
                  borderBottom: `1px solid ${COLORS.border}`,
                  borderRadius: 0,
                  outline: "none",
                  resize: "vertical",
                  background: "transparent",
                  color: canEdit ? COLORS.text : "#9AA09B",
                  fontFamily: FONT_SANS,
                  fontSize: 12,
                  lineHeight: "18px",
                  opacity: canEdit ? 1 : 0.78,
                  cursor: canEdit ? "text" : "not-allowed",
                }}
              />
            </label>
          ))}
        </div>
      </RailSection>
    );
  };

  const renderProgress = () => (
    <>
      <RailSection eyebrow="Procedure" title="Experiment procedure" divider>
        <div style={{ display: "grid", gap: 4 }}>
          {procedureSteps.map((label, index) => (
            <ProcedureRow
              key={label}
              number={index + 1}
              label={label}
              completed={Boolean(progress.completedSteps[index])}
              active={index + 1 === progress.currentStep}
            />
          ))}
        </div>
      </RailSection>

      <RailSection eyebrow="Status" title="">
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ color: COLORS.muted, fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500 }}>
              MEASUREMENTS LOGGED
            </span>
            <span style={{ color: COLORS.text, fontFamily: FONT_MONO, fontSize: 17, fontWeight: 500 }}>
              {measurementLog.length}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ color: COLORS.muted, fontFamily: FONT_SANS, fontSize: 13, fontWeight: 500 }}>
              REPORT STATUS
            </span>
            <span
              style={{
                color: reportReady ? COLORS.copper : COLORS.muted,
                fontFamily: FONT_SANS,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {reportReady ? "Ready to generate" : "Not ready"}
            </span>
          </div>
        </div>
      </RailSection>

      {renderReflection()}

      <RailSection divider={false}>
        <div style={{ display: "grid", gap: 10 }}>
          <PrimaryAction onClick={generateLabReport} disabled={!reportReady}>
            {progress.reportGenerated ? "Regenerate lab report" : "Generate lab report"}
          </PrimaryAction>
          <TextAction onClick={resetLab}>Reset lab</TextAction>
        </div>
      </RailSection>
    </>
  );

  return (
    <>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Sans+Condensed:wght@500;600&display=swap");

        html, body, #root {
          margin: 0 !important;
          width: 100%;
          min-width: 100%;
          height: 100%;
          background: ${COLORS.environment};
        }

        *, *::before, *::after {
          box-sizing: border-box;
        }

        button, input, select, textarea {
          font: inherit;
        }

        .working-instrument-primary:hover:not(:disabled) {
          background: #2A2E2B !important;
          border-color: rgba(181,101,46,0.45) !important;
        }
        .working-instrument-primary:active:not(:disabled) {
          background: #141816 !important;
          transform: translateY(1px);
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
        }
        .working-instrument-primary:focus-visible,
        .working-instrument-text-action:focus-visible,
        .working-instrument-view-button:focus-visible {
          outline: 2px solid ${COLORS.copper};
          outline-offset: 2px;
        }
        .working-instrument-view-button:hover {
          color: #F0EBE2 !important;
          background: #242A27 !important;
        }
        .working-instrument-view-button:active {
          transform: translateY(1px);
        }
        .working-instrument-text-action:hover:not(:disabled) {
          color: ${COLORS.copper};
        }
        .instrument-value-morph {
          display: inline-block;
          animation: instrumentValueMorph 300ms ease-out;
        }
        @keyframes instrumentValueMorph {
          from { opacity: 0.35; transform: translateY(4px); filter: blur(0.4px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .parallel-rc-range {

          width: 100%;
          height: 16px;
          margin: 0;
          padding: 0;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }
        .parallel-rc-range::-webkit-slider-runnable-track {
          height: 2px;
          background: linear-gradient(to right, #7B817B 0%, #7B817B var(--range-fill, 18%), ${COLORS.steel} var(--range-fill, 18%), ${COLORS.steel} 100%);
        }
        .parallel-rc-range::-moz-range-track {
          height: 2px;
          background: ${COLORS.border};
        }
        .parallel-rc-range::-moz-range-progress {
          height: 2px;
          background: #7B817B;
        }
        .parallel-rc-range::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          margin-top: -6px;
          border: 2px solid ${COLORS.copper};
          border-radius: 50%;
          background: #D4CEC3;
        }
        .parallel-rc-range::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border: 2px solid #EDE7DB;
          border-radius: 50%;
          background: ${COLORS.copper};
        }
        .parallel-rc-range:focus-visible {
          outline: 1px solid ${COLORS.copper};
          outline-offset: 3px;
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 30,
          display: "flex",
          pointerEvents: "none",
          fontFamily: FONT_SANS,
        }}
      >
        <aside
          style={{
            width: 340,
            minWidth: 340,
            maxWidth: 340,
            height: "100vh",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            background: "linear-gradient(180deg, #D9D2C7 0%, #CEC6B9 100%)",
            borderRight: `1px solid ${COLORS.border}`,
            boxShadow: "5px 0 18px rgba(18,16,13,0.10)",
            color: COLORS.text,
            pointerEvents: "auto",
          }}
        >
          <Header currentStep={progress.currentStep} />
          <ModeTabs activeTab={activeTab} onChange={handleTabChange} />

          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              padding: "18px 22px",
              boxSizing: "border-box",
              background: "linear-gradient(180deg, #D5CEC2 0%, #CBC3B7 100%)",
            }}
          >
            {activeTab === "experiment" && renderExperiment()}
            {activeTab === "analysis" && renderAnalysis()}
            {activeTab === "progress" && renderProgress()}
          </div>
        </aside>

        <ViewSwitcher cameraView={cameraView} setCameraView={handleCameraViewChange} />
      </div>

      {scopeOn && activeTab !== "progress" && (
        <Oscilloscope
          voltageVrms={voltageVrms}
          frequencyHz={frequencyHz}
          clampPoint={clampPoint}
          currentRmsA={measuredCurrentRmsA}
          generatorOn={generatorOn}
          phiRad={electricalSnapshot.phiRad}
          ch1VoltsPerDiv={ch1VoltsPerDiv}
          ch2MilliAmpsPerDiv={ch2MilliAmpsPerDiv}
          timePerDivMs={timePerDivMs}
          onControlChange={setScopeControls}
          analysisMode={activeTab === "analysis"}
        />
      )}

      {reportVisible && generatedReport && (
        <>
          <style>
            {`
              @page { margin: 12mm; }

              @media print {
                html,
                body,
                #root {
                  width: auto !important;
                  height: auto !important;
                  min-height: 0 !important;
                  overflow: visible !important;
                  background: white !important;
                }

                #root > div {
                  width: auto !important;
                  height: auto !important;
                  min-height: 0 !important;
                  overflow: visible !important;
                }

                body * { visibility: hidden !important; }

                .lab-report-print,
                .lab-report-print * {
                  visibility: visible !important;
                }

                .lab-report-print {
                  position: relative !important;
                  inset: auto !important;
                  width: 100% !important;
                  min-height: 0 !important;
                  height: auto !important;
                  max-height: none !important;
                  margin: 0 !important;
                  padding: 8mm !important;
                  overflow: visible !important;
                  box-sizing: border-box !important;
                  border-radius: 0 !important;
                  box-shadow: none !important;
                  background: white !important;
                  color: black !important;
                }

                .lab-report-actions { display: none !important; }

                .lab-report-print section {
                  break-inside: avoid;
                  page-break-inside: avoid;
                }

                .lab-report-print h1,
                .lab-report-print h2,
                .lab-report-print p,
                .lab-report-print div,
                .lab-report-print td,
                .lab-report-print th {
                  color: black !important;
                }
              }
            `}
          </style>

          <div
            className="lab-report-print"
            style={{
              position: "absolute",
              inset: 18,
              zIndex: 60,
              overflowY: "auto",
              padding: 24,
              borderRadius: 18,
              background: "#FBFAF7",
              color: COLORS.text,
              boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 24,
                  }}
                >
                  {generatedReport.title}
                </h1>
                <div
                  style={{
                    marginTop: 5,
                    color: COLORS.muted,
                    fontSize: 12,
                  }}
                >
                  Generated {generatedReport.generatedAt}
                </div>
              </div>

              <div
                className="lab-report-actions"
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={copyLabReport}
                  style={{
                    padding: "9px 12px",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 9,
                    background: "white",
                    color: COLORS.text,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Copy
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: "9px 12px",
                    border: 0,
                    borderRadius: 9,
                    background: COLORS.copper,
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Print / Save PDF
                </button>

                <button
                  type="button"
                  onClick={() => setReportVisible(false)}
                  style={{
                    padding: "9px 12px",
                    border: 0,
                    borderRadius: 9,
                    background: COLORS.text,
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            <div
              style={{
                marginTop: 20,
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <section
                style={{
                  padding: 12,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 10,
                }}
              >
                <h2>Reference setup</h2>
                <p>
                  {generatedReport.referenceSetup.voltageVrms} Vrms · {generatedReport.referenceSetup.frequencyHz} Hz · {generatedReport.referenceSetup.resistanceOhm} Ω · {generatedReport.referenceSetup.capacitanceUf} µF
                </p>
                <div style={{ color: COLORS.muted, fontSize: 12, lineHeight: 1.6 }}>
                  Expected: IR {(generatedReport.referenceSnapshot.IR * 1000).toFixed(2)} mA · IC {(generatedReport.referenceSnapshot.IC * 1000).toFixed(2)} mA · IT {(generatedReport.referenceSnapshot.IT * 1000).toFixed(2)} mA · φ {generatedReport.referenceSnapshot.phiDeg.toFixed(1)}° · Z {generatedReport.referenceSnapshot.Z.toFixed(1)} Ω
                </div>
              </section>

              <section
                style={{
                  padding: 12,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 10,
                }}
              >
                <h2>Final observed setup</h2>
                <p>
                  {generatedReport.setup.voltageVrms} Vrms · {generatedReport.setup.frequencyHz} Hz · {generatedReport.setup.resistanceOhm} Ω · {generatedReport.setup.capacitanceUf} µF
                </p>
              </section>
            </div>

            <section style={{ marginTop: 14 }}>
              <h2>Snapshot at report generation</h2>
              <p>
                IR {(generatedReport.liveSnapshot.IR * 1000).toFixed(2)} mA · IC {(generatedReport.liveSnapshot.IC * 1000).toFixed(2)} mA · IT {(generatedReport.liveSnapshot.IT * 1000).toFixed(2)} mA · φ {generatedReport.liveSnapshot.phiDeg.toFixed(1)}° · Z {generatedReport.liveSnapshot.Z.toFixed(1)} Ω
              </p>
            </section>

            <section style={{ marginTop: 14 }}>
              <h2>Measurement log</h2>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 12,
                  }}
                >
                  <thead>
                    <tr>
                      {["Point", "Frequency", "Measured", "Theoretical", "Error"].map((heading) => (
                        <th
                          key={heading}
                          style={{
                            textAlign: "left",
                            padding: 8,
                            borderBottom: `1px solid ${COLORS.border}`,
                          }}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {generatedReport.measurements.map((row, index) => (
                      <tr key={`${row.point}-${row.timestamp}-${index}`}>
                        <td style={{ padding: 8 }}>{row.point}</td>
                        <td style={{ padding: 8 }}>{row.frequencyHz} Hz</td>
                        <td style={{ padding: 8 }}>{(row.measuredCurrentRmsA * 1000).toFixed(2)} mA</td>
                        <td style={{ padding: 8 }}>{(row.theoreticalCurrentRmsA * 1000).toFixed(2)} mA</td>
                        <td style={{ padding: 8 }}>
                          {row.percentError === null ? "n/a" : `${row.percentError.toFixed(2)}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ color: COLORS.muted }}>
                {generatedReport.measurementSummary.count} measurements logged · {generatedReport.measurementSummary.averageError === null ? "Average error unavailable" : `Average error ${generatedReport.measurementSummary.averageError.toFixed(2)}%`}
              </p>
            </section>

            <section style={{ marginTop: 14 }}>
              <h2>Safety verification</h2>
              <p>
                Trip observed: {generatedReport.safety.tripObserved ? "Yes" : "No"} · Recovery observed: {generatedReport.safety.recoveryObserved ? "Yes" : "No"}
              </p>
            </section>

            <section style={{ marginTop: 14 }}>
              <h2>Reflection</h2>
              <p>
                <strong>Observation:</strong> {generatedReport.reflection.observation || "Not entered."}
              </p>
              <p>
                <strong>Frequency/current relationship:</strong> {generatedReport.reflection.frequencyExplanation || "Not entered."}
              </p>
              <p>
                <strong>Safety explanation:</strong> {generatedReport.reflection.safetyExplanation || "Not entered."}
              </p>
            </section>
          </div>
        </>
      )}


    </>
  );
}
