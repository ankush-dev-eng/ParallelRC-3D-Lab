import React from "react";

import Oscilloscope from "./Oscilloscope";

// ------------------------------------------------------------
// UI HELPERS
// ------------------------------------------------------------

function formatFrequency(
  frequencyHz
) {
  if (
    frequencyHz >=
    1000
  ) {
    return `${(
      frequencyHz /
      1000
    ).toFixed(1)} kHz`;
  }

  return `${frequencyHz} Hz`;
}

function ControlSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}) {
  return (
    <div
      style={{
        display:
          "grid",
        gap: 6,
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
        }}
      >
        <span
          style={{
            color:
              "#cbd5e1",
          }}
        >
          {label}
        </span>

        <strong>
          {value}
          {unit}
        </strong>
      </div>

      <input
        type="range"
        min={
          min
        }
        max={
          max
        }
        step={
          step
        }
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            Number(
              event
                .target
                .value
            )
          )
        }
        style={{
          width:
            "100%",
          cursor:
            "pointer",
        }}
      />
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
  // These values are supplied by App from the authoritative domain constants.
  // Keeping the original UI names makes this extraction behavior-neutral.
  const CAPACITOR_RATED_VOLTAGE_V =
    capacitorRatedVoltageV;
  const CAPACITOR_CURRENT_LIMIT_A =
    capacitorCurrentLimitA;
  const REFERENCE_SETUP =
    referenceSetup;
  const REFERENCE_SNAPSHOT =
    referenceSnapshot;

  return (
    <>
      {/* ------------------------------------------------
                        MAIN HUD
                    ------------------------------------------------ */}

      <div
        style={{
          position:
            "absolute",
          top:
            18,
          left:
            18,
          width:
            385,
          maxHeight:
            "calc(100vh - 36px)",
          overflowY:
            "auto",
          padding:
            18,
          borderRadius:
            16,
          background:
            "rgba(8, 12, 20, 0.90)",
          border:
            "1px solid rgba(148, 163, 184, 0.2)",
          backdropFilter:
            "blur(8px)",
          zIndex:
            10,
        }}
      >
        <div
          style={{
            fontSize:
              20,
            fontWeight:
              800,
            marginBottom:
              6,
          }}
        >
          Parallel RC —
          Current Measurement
        </div>

        <div
          style={{
            fontSize:
              13,
            color:
              "#94a3b8",
            lineHeight:
              1.5,
          }}
        >
          Configure the AC source,
          then move the current
          clamp between measurement
          points.
        </div>

        {/* ELECTRICAL CONTROLS */}
        <div
          style={{
            marginTop:
              16,
            marginBottom:
              8,
            fontSize:
              12,
            color:
              "#94a3b8",
            fontWeight:
              700,
            textTransform:
              "uppercase",
            letterSpacing:
              "0.08em",
          }}
        >
          Electrical controls
        </div>

        <div
          style={{
            display:
              "grid",
            gap:
              14,
          }}
        >
          <ControlSlider
            label="Voltage"
            value={
              voltageVrms
            }
            min={
              1
            }
            max={
              10
            }
            step={
              0.1
            }
            unit=" Vrms"
            onChange={
              setVoltage
            }
          />

          <ControlSlider
            label="Frequency"
            value={
              frequencyHz
            }
            min={
              1000
            }
            max={
              25000
            }
            step={
              100
            }
            unit=" Hz"
            onChange={
              setFrequency
            }
          />

          <ControlSlider
            label="Resistance"
            value={
              resistanceOhm
            }
            min={
              100
            }
            max={
              5000
            }
            step={
              100
            }
            unit=" Ω"
            onChange={
              setResistance
            }
          />

          <div
            style={{
              display:
                "grid",
              gap:
                6,
            }}
          >
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
              }}
            >
              <span>
                Capacitance
              </span>

              <strong>
                {
                  capacitanceUf
                } µF
              </strong>
            </div>

            <select
              value={
                capacitanceUf
              }
              onChange={(
                event
              ) =>
                setCapacitance(
                  Number(
                    event
                      .target
                      .value
                  )
                )
              }
              style={{
                padding:
                  "8px 10px",
                borderRadius:
                  8,
                border:
                  "1px solid #334155",
                background:
                  "#111827",
                color:
                  "#e5e7eb",
              }}
            >
              <option
                value={
                  0.01
                }
              >
                0.01 µF
              </option>

              <option
                value={
                  0.1
                }
              >
                0.1 µF
              </option>

              <option
                value={
                  1
                }
              >
                1.0 µF
              </option>
            </select>
          </div>
        </div>

        <button
          onClick={
            loadReferenceValues
          }
          style={{
            width:
              "100%",
            marginTop:
              14,
            padding:
              "9px 12px",
            borderRadius:
              9,
            border:
              "1px solid #475569",
            background:
              isReferenceSetup
                ? "#16251b"
                : "#111827",
            color:
              "#e5e7eb",
            fontWeight:
              700,
            cursor:
              "pointer",
          }}
        >
          Load reference:
          {" "}
          5 V · 1 kHz ·
          1 kΩ · 0.1 µF
        </button>

        {/* GENERATOR */}
        <button
          onClick={
            toggleGenerator
          }
          style={{
            width:
              "100%",
            marginTop:
              10,
            padding:
              "10px 12px",
            border:
              0,
            borderRadius:
              9,
            background:
              safetyTripped
                ? "#991b1b"
                : generatorOn
                  ? "#16a34a"
                  : "#374151",
            color:
              "#ffffff",
            fontWeight:
              800,
            cursor:
              "pointer",
          }}
        >
          {
            safetyTripped
              ? safetyRecoveryReady
                ? "Restart after safety trip"
                : "Safety trip — reduce stress"
              : "AC Generator:"
          }

          {!safetyTripped &&
            (
              generatorOn
                ? " ON"
                : " OFF"
            )}
        </button>

        <button
          onClick={
            toggleScope
          }
          style={{
            width:
              "100%",
            marginTop:
              10,
            padding:
              "10px 12px",
            border:
              0,
            borderRadius:
              9,
            background:
              scopeOn
                ? "#2563eb"
                : "#374151",
            color:
              "#ffffff",
            fontWeight:
              800,
            cursor:
              "pointer",
          }}
        >
          Oscilloscope:
          {
            scopeOn
              ? " ON"
              : " OFF"
          }
        </button>

        {/* CAPACITOR SAFETY */}
        <div
          style={{
            marginTop:
              12,
            padding:
              10,
            borderRadius:
              10,
            background:
              safetyTripped
                ? "rgba(127, 29, 29, 0.18)"
                : safetyWarning
                  ? "rgba(146, 64, 14, 0.18)"
                  : "rgba(15, 23, 42, 0.8)",
            border:
              safetyTripped
                ? "1px solid rgba(239, 68, 68, 0.55)"
                : safetyWarning
                  ? "1px solid rgba(245, 158, 11, 0.55)"
                  : "1px solid rgba(71, 85, 105, 0.45)",
            fontSize:
              12,
            lineHeight:
              1.6,
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
              marginBottom:
                6,
            }}
          >
            <strong>
              CAPACITOR SAFETY
            </strong>

            <strong
              style={{
                color:
                  safetyTripped
                    ? "#f87171"
                    : safetyWarning
                      ? "#fbbf24"
                      : "#22c55e",
              }}
            >
              {
                safetyTripped
                  ? safetyRecoveryReady
                    ? "READY TO RESTART"
                    : "TRIPPED"
                  : safetyWarning
                    ? "WARNING"
                    : "NORMAL"
              }
            </strong>
          </div>

          <div
            style={{
              color:
                "#94a3b8",
              marginBottom:
                6,
            }}
          >
            Rating:{" "}
            {
              CAPACITOR_RATED_VOLTAGE_V
            } V · Current limit:{" "}
            {
              (
                CAPACITOR_CURRENT_LIMIT_A *
                1000
              ).toFixed(0)
            } mA
          </div>

          <div>
            <strong>
              Stress:
            </strong>{" "}
            {
              (
                capStress *
                100
              ).toFixed(0)
            }%
          </div>

          <div>
            <strong>
              Load:
            </strong>{" "}
            {
              safetyOverload.toFixed(
                2
              )
            }× limit
          </div>

          <div
            style={{
              height:
                7,
              marginTop:
                7,
              borderRadius:
                999,
              background:
                "#1e293b",
              overflow:
                "hidden",
            }}
          >
            <div
              style={{
                width:
                  `${Math.min(
                    100,
                    Math.max(
                      0,
                      capStress *
                      100
                    )
                  )}%`,
                height:
                  "100%",
                background:
                  safetyTripped
                    ? "#ef4444"
                    : safetyWarning
                      ? "#f59e0b"
                      : "#22c55e",
              }}
            />
          </div>

          <div
            style={{
              marginTop:
                7,
              color:
                safetyTripped
                  ? "#fca5a5"
                  : safetyWarning
                    ? "#fcd34d"
                    : "#94a3b8",
            }}
          >
            {
              safetyTripped
                ? safetyRecoveryReady
                  ? "Stress is low enough. Restart the generator to complete recovery."
                  : "Reduce frequency or voltage, then wait for the stored stress to fall before restarting."
                : safetyWarning
                  ? "Capacitor stress is elevated. Reduce the operating point before the trip threshold is reached."
                  : "Normal operating range."
            }
          </div>
        </div>

        {/* CLAMP */}
        <div
          style={{
            marginTop:
              12,
            padding:
              10,
            borderRadius:
              10,
            background:
              "rgba(15, 23, 42, 0.8)",
            border:
              "1px solid rgba(71, 85, 105, 0.45)",
            fontSize:
              12,
            lineHeight:
              1.6,
          }}
        >
          <div>
            Clamp point:{" "}
            <strong>
              {
                clampPoint ??
                "TRAY"
              }
            </strong>
          </div>

          <div
            style={{
              color:
                "#94a3b8",
            }}
          >
            Drag the clamp onto
            P_R, P_C, or P_TOT.
          </div>
        </div>

        {/* LIVE READINGS */}
        <div
          style={{
            marginTop:
              12,
            padding:
              10,
            borderRadius:
              10,
            background:
              "rgba(15, 23, 42, 0.8)",
            border:
              "1px solid rgba(71, 85, 105, 0.45)",
            fontSize:
              12,
            lineHeight:
              1.6,
          }}
        >
          <strong>
            LIVE READINGS
          </strong>

          <div>
            Xc:{" "}
            {
              Number.isFinite(
                electricalSnapshot.Xc
              )
                ? `${electricalSnapshot.Xc.toFixed(1)} Ω`
                : "∞"
            }
          </div>

          <div>
            IR:{" "}
            {
              (
                electricalSnapshot.IR *
                1000
              ).toFixed(2)
            } mA
          </div>

          <div>
            IC:{" "}
            {
              (
                electricalSnapshot.IC *
                1000
              ).toFixed(2)
            } mA
          </div>

          <div>
            IT:{" "}
            {
              (
                electricalSnapshot.IT *
                1000
              ).toFixed(2)
            } mA
          </div>

          <div>
            Phase:{" "}
            {
              electricalSnapshot.phiDeg.toFixed(
                1
              )
            }° lead
          </div>

          <div>
            Z:{" "}
            {
              Number.isFinite(
                electricalSnapshot.Z
              )
                ? `${electricalSnapshot.Z.toFixed(1)} Ω`
                : "∞"
            }
          </div>

          <div
            style={{
              marginTop:
                5,
            }}
          >
            Clamp reading:{" "}
            {
              (
                measuredCurrentRmsA *
                1000
              ).toFixed(2)
            } mA RMS
          </div>
        </div>

        {/* REFERENCE */}
        <div
          style={{
            marginTop:
              12,
            padding:
              10,
            borderRadius:
              10,
            background:
              isReferenceSetup
                ? "rgba(22, 101, 52, 0.16)"
                : "rgba(15, 23, 42, 0.8)",
            border:
              isReferenceSetup
                ? "1px solid rgba(34, 197, 94, 0.45)"
                : "1px solid rgba(71, 85, 105, 0.45)",
            fontSize:
              12,
            lineHeight:
              1.6,
          }}
        >
          <strong>
            REFERENCE / THEORETICAL
          </strong>

          <div
            style={{
              color:
                "#94a3b8",
              marginTop:
                5,
            }}
          >
            5 Vrms · 1 kHz ·
            1 kΩ · 0.1 µF
          </div>

          <div>
            Xc:{" "}
            {
              REFERENCE_SNAPSHOT.Xc.toFixed(
                1
              )
            } Ω
          </div>

          <div>
            IR:{" "}
            {
              (
                REFERENCE_SNAPSHOT.IR *
                1000
              ).toFixed(2)
            } mA
          </div>

          <div>
            IC:{" "}
            {
              (
                REFERENCE_SNAPSHOT.IC *
                1000
              ).toFixed(2)
            } mA
          </div>

          <div>
            IT:{" "}
            {
              (
                REFERENCE_SNAPSHOT.IT *
                1000
              ).toFixed(2)
            } mA
          </div>

          <div>
            Phase:{" "}
            {
              REFERENCE_SNAPSHOT.phiDeg.toFixed(
                1
              )
            }° lead
          </div>

          <div>
            Z:{" "}
            {
              REFERENCE_SNAPSHOT.Z.toFixed(
                1
              )
            } Ω
          </div>
        </div>

        {/* CAMERA VIEWS */}
        <div
          style={{
            marginTop:
              16,
            marginBottom:
              6,
            fontSize:
              12,
            color:
              "#94a3b8",
            fontWeight:
              700,
            textTransform:
              "uppercase",
            letterSpacing:
              "0.08em",
          }}
        >
          Camera views
        </div>

        <div
          style={{
            display:
              "flex",
            gap:
              6,
            flexWrap:
              "wrap",
          }}
        >
          {[
            [
              "1 · Bench",
              "bench",
            ],
            [
              "2 · Board",
              "board",
            ],
            [
              "3 · Analysis",
              "analysis",
            ],
          ].map(
            ([
              label,
              view,
            ]) => (
              <button
                key={
                  view
                }
                onClick={() =>
                  setCameraView(
                    view
                  )
                }
                style={{
                  padding:
                    "8px 10px",
                  borderRadius:
                    8,
                  border:
                    "1px solid #334155",
                  background:
                    cameraView ===
                      view
                      ? "#1e293b"
                      : "#111827",
                  color:
                    "#e5e7eb",
                  cursor:
                    "pointer",
                }}
              >
                {
                  label
                }
              </button>
            )
          )}
        </div>

        {/* GUIDED PROGRESS */}
        <div
          style={{
            marginTop:
              16,
            padding:
              10,
            borderRadius:
              10,
            background:
              "rgba(15, 23, 42, 0.8)",
            border:
              "1px solid rgba(71, 85, 105, 0.45)",
            fontSize:
              12,
            lineHeight:
              1.6,
          }}
        >
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
            }}
          >
            <strong>
              Guided progress
            </strong>

            <strong>
              Step{" "}
              {
                progress.currentStep
              }
              /8
            </strong>
          </div>

          <div
            style={{
              marginTop:
                6,
              display:
                "grid",
              gap:
                3,
            }}
          >
            {[
              "Orientation",
              "Assemble circuit",
              "Load reference",
              "Measure branches",
              "Measure total + Analysis",
              "Frequency challenge",
              "Safety challenge",
              "Reflection / report",
            ].map(
              (
                label,
                index
              ) => (
                <div
                  key={
                    label
                  }
                  style={{
                    color:
                      progress
                        .completedSteps[
                        index
                      ]
                        ? "#22c55e"
                        : index +
                          1 ===
                          progress.currentStep
                          ? "#e5e7eb"
                          : "#64748b",
                  }}
                >
                  {
                    progress
                      .completedSteps[
                      index
                    ]
                      ? "✓"
                      : index +
                        1 ===
                        progress.currentStep
                        ? "→"
                        : "·"
                  }{" "}
                  {index +
                    1}.{" "}
                  {
                    label
                  }
                </div>
              )
            )}
          </div>

          <div
            style={{
              marginTop:
                6,
              color:
                "#94a3b8",
            }}
          >
            Logged measurements:{" "}
            {
              measurementLog.length
            }
          </div>
        </div>

        {/* STEP 8 REPORT FORM */}
        {
          progress.currentStep >=
          8 && (
            <div
              style={{
                marginTop:
                  16,
                padding:
                  10,
                borderRadius:
                  10,
                background:
                  "rgba(34, 197, 94, 0.08)",
                border:
                  "1px solid rgba(34, 197, 94, 0.3)",
              }}
            >
              <strong>
                REFLECTION / REPORT
              </strong>

              <div
                style={{
                  marginTop:
                    6,
                  color:
                    "#94a3b8",
                  fontSize:
                    12,
                  lineHeight:
                    1.5,
                }}
              >
                Add your observations,
                then generate the
                final laboratory
                report.
              </div>

              <textarea
                value={
                  reflection
                    .observation
                }
                onChange={(
                  event
                ) =>
                  updateReflection(
                    "observation",
                    event.target.value
                  )
                }
                placeholder="What changed as frequency increased?"
                rows={
                  3
                }
                style={{
                  width:
                    "100%",
                  marginTop:
                    8,
                  boxSizing:
                    "border-box",
                  padding:
                    8,
                  borderRadius:
                    8,
                  border:
                    "1px solid #334155",
                  background:
                    "#111827",
                  color:
                    "#e5e7eb",
                  resize:
                    "vertical",
                }}
              />

              <textarea
                value={
                  reflection
                    .frequencyExplanation
                }
                onChange={(
                  event
                ) =>
                  updateReflection(
                    "frequencyExplanation",
                    event.target.value
                  )
                }
                placeholder="Why does IC increase with frequency?"
                rows={
                  3
                }
                style={{
                  width:
                    "100%",
                  marginTop:
                    8,
                  boxSizing:
                    "border-box",
                  padding:
                    8,
                  borderRadius:
                    8,
                  border:
                    "1px solid #334155",
                  background:
                    "#111827",
                  color:
                    "#e5e7eb",
                  resize:
                    "vertical",
                }}
              />

              <textarea
                value={
                  reflection
                    .safetyExplanation
                }
                onChange={(
                  event
                ) =>
                  updateReflection(
                    "safetyExplanation",
                    event.target.value
                  )
                }
                placeholder="What caused the safety trip and how did recovery work?"
                rows={
                  3
                }
                style={{
                  width:
                    "100%",
                  marginTop:
                    8,
                  boxSizing:
                    "border-box",
                  padding:
                    8,
                  borderRadius:
                    8,
                  border:
                    "1px solid #334155",
                  background:
                    "#111827",
                  color:
                    "#e5e7eb",
                  resize:
                    "vertical",
                }}
              />

              <button
                onClick={
                  generateLabReport
                }
                disabled={
                  !reportReady
                }
                style={{
                  width:
                    "100%",
                  marginTop:
                    10,
                  padding:
                    "10px 12px",
                  border:
                    0,
                  borderRadius:
                    9,
                  background:
                    reportReady
                      ? "#16a34a"
                      : "#374151",
                  color:
                    "#fff",
                  fontWeight:
                    800,
                  cursor:
                    reportReady
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                {
                  progress.reportGenerated
                    ? "Regenerate Lab Report"
                    : "Generate Final Lab Report"
                }
              </button>
            </div>
          )
        }

        {/* RESET */}
        <button
          onClick={
            resetLab
          }
          style={{
            marginTop:
              18,
            width:
              "100%",
            border:
              0,
            borderRadius:
              10,
            padding:
              "10px 12px",
            background:
              "#7c3aed",
            color:
              "#fff",
            fontWeight:
              800,
            cursor:
              "pointer",
          }}
        >
          Reset Lab
        </button>
      </div>

      {/* PHASOR HUD */}
      {
        cameraView ===
        "analysis" && (
          <div
            style={{
              position:
                "absolute",
              top:
                18,
              right:
                18,
              width:
                300,
              padding:
                14,
              borderRadius:
                14,
              background:
                "rgba(8, 12, 20, 0.93)",
              border:
                "1px solid rgba(139, 92, 246, 0.45)",
              boxShadow:
                "0 12px 30px rgba(0,0,0,0.25)",
              zIndex:
                10,
              fontSize:
                12,
              lineHeight:
                1.6,
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
                marginBottom:
                  6,
              }}
            >
              <strong>
                PHASOR ANALYSIS
              </strong>

              <strong
                style={{
                  color:
                    progress
                      .fiveXChallengeCompleted ||
                      fiveXChallengeMet
                      ? "#22c55e"
                      : "#94a3b8",
                }}
              >
                {
                  progress
                    .fiveXChallengeCompleted
                    ? "5× COMPLETE"
                    : fiveXChallengeMet
                      ? "5× REACHED"
                      : "STEP 6"
                }
              </strong>
            </div>

            <div
              style={{
                color:
                  "#94a3b8",
                marginBottom:
                  8,
              }}
            >
              Vector lengths use a
              fixed 80 mA visual
              reference. Labels
              show true RMS values.
            </div>

            <div>
              <strong>
                IR:
              </strong>{" "}
              {
                (
                  electricalSnapshot.IR *
                  1000
                ).toFixed(
                  2
                )
              } mA
            </div>

            <div>
              <strong>
                IC:
              </strong>{" "}
              {
                (
                  electricalSnapshot.IC *
                  1000
                ).toFixed(
                  2
                )
              } mA
            </div>

            <div>
              <strong>
                IT:
              </strong>{" "}
              {
                (
                  electricalSnapshot.IT *
                  1000
                ).toFixed(
                  2
                )
              } mA
            </div>

            <div>
              <strong>
                φ:
              </strong>{" "}
              {
                electricalSnapshot.phiDeg.toFixed(
                  1
                )
              }° lead
            </div>

            <div
              style={{
                marginTop:
                  5,
              }}
            >
              <strong>
                IC / IR:
              </strong>{" "}
              {
                currentRatio.toFixed(
                  2
                )
              }×
            </div>

            <div
              style={{
                marginTop:
                  8,
                color:
                  "#d8b4fe",
              }}
            >
              {
                progress
                  .fiveXChallengeCompleted
                  ? "Frequency challenge complete. The gate is latched."
                  : fiveXChallengeMet
                    ? "Target reached. Step 6 will now latch."
                    : "Sweep frequency until IC is approximately five times IR."
              }
            </div>
          </div>
        )
      }

      {/* OSCILLOSCOPE */}
      {
        scopeOn && (
          <Oscilloscope
            voltageVrms={
              voltageVrms
            }

            frequencyHz={
              frequencyHz
            }

            clampPoint={
              clampPoint
            }

            currentRmsA={
              measuredCurrentRmsA
            }

            generatorOn={
              generatorOn
            }

            phiRad={
              electricalSnapshot.phiRad
            }

            ch1VoltsPerDiv={
              ch1VoltsPerDiv
            }

            ch2MilliAmpsPerDiv={
              ch2MilliAmpsPerDiv
            }

            timePerDivMs={
              timePerDivMs
            }

            onControlChange={
              setScopeControls
            }
          />
        )
      }

      {/* ------------------------------------------------
                  GENERATED REPORT
              ------------------------------------------------ */}

      {
        reportVisible &&
        generatedReport && (
          <>
            <style>
              {`
                                @page {
                                    margin: 12mm;
                                }

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

                                    body * {
                                        visibility: hidden !important;
                                    }

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

                                    .lab-report-actions {
                                        display: none !important;
                                    }

                                    .lab-report-print section {
                                        break-inside: avoid;
                                        page-break-inside: avoid;
                                    }

                                    .lab-report-print h1,
                                    .lab-report-print h2 {
                                        color: black !important;
                                    }

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
                position:
                  "absolute",
                inset:
                  24,
                zIndex:
                  30,
                overflowY:
                  "auto",
                padding:
                  24,
                borderRadius:
                  16,
                background:
                  "#f8fafc",
                color:
                  "#0f172a",
                boxShadow:
                  "0 24px 70px rgba(0,0,0,0.45)",
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
                  gap:
                    12,
                  flexWrap:
                    "wrap",
                }}
              >
                <div>
                  <h1
                    style={{
                      margin:
                        0,
                      fontSize:
                        24,
                    }}
                  >
                    {
                      generatedReport.title
                    }
                  </h1>

                  <div
                    style={{
                      marginTop:
                        5,
                      color:
                        "#64748b",
                      fontSize:
                        12,
                    }}
                  >
                    Generated{" "}
                    {
                      generatedReport.generatedAt
                    }
                  </div>
                </div>

                <div
                  className="lab-report-actions"
                  style={{
                    display:
                      "flex",
                    gap:
                      8,
                    flexWrap:
                      "wrap",
                  }}
                >
                  <button
                    onClick={
                      copyLabReport
                    }
                    style={{
                      padding:
                        "9px 12px",
                      border:
                        "1px solid #cbd5e1",
                      borderRadius:
                        8,
                      background:
                        "white",
                      color:
                        "#0f172a",
                      fontWeight:
                        700,
                      cursor:
                        "pointer",
                    }}
                  >
                    Copy
                  </button>

                  <button
                    onClick={() =>
                      window.print()
                    }
                    style={{
                      padding:
                        "9px 12px",
                      border:
                        0,
                      borderRadius:
                        8,
                      background:
                        "#2563eb",
                      color:
                        "white",
                      fontWeight:
                        700,
                      cursor:
                        "pointer",
                    }}
                  >
                    Print / Save PDF
                  </button>

                  <button
                    onClick={() =>
                      setReportVisible(
                        false
                      )
                    }
                    style={{
                      padding:
                        "9px 12px",
                      border:
                        0,
                      borderRadius:
                        8,
                      background:
                        "#0f172a",
                      color:
                        "white",
                      fontWeight:
                        700,
                      cursor:
                        "pointer",
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>

              <div
                style={{
                  marginTop:
                    20,
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap:
                    12,
                }}
              >
                {/* Official reference configuration. */}
                <section
                  style={{
                    padding:
                      12,
                    border:
                      "1px solid #cbd5e1",
                    borderRadius:
                      10,
                  }}
                >
                  <h2>
                    Reference setup
                  </h2>

                  <p>
                    {
                      generatedReport
                        .referenceSetup
                        .voltageVrms
                    }{" "}
                    Vrms ·{" "}
                    {
                      generatedReport
                        .referenceSetup
                        .frequencyHz
                    }{" "}
                    Hz ·{" "}
                    {
                      generatedReport
                        .referenceSetup
                        .resistanceOhm
                    }{" "}
                    Ω ·{" "}
                    {
                      generatedReport
                        .referenceSetup
                        .capacitanceUf
                    }{" "}
                    µF
                  </p>

                  <div
                    style={{
                      color:
                        "#475569",
                      fontSize:
                        12,
                      lineHeight:
                        1.6,
                    }}
                  >
                    Expected: IR{" "}
                    {(
                      generatedReport
                        .referenceSnapshot
                        .IR *
                      1000
                    ).toFixed(
                      2
                    )}{" "}
                    mA · IC{" "}
                    {(
                      generatedReport
                        .referenceSnapshot
                        .IC *
                      1000
                    ).toFixed(
                      2
                    )}{" "}
                    mA · IT{" "}
                    {(
                      generatedReport
                        .referenceSnapshot
                        .IT *
                      1000
                    ).toFixed(
                      2
                    )}{" "}
                    mA · φ{" "}
                    {
                      generatedReport
                        .referenceSnapshot
                        .phiDeg.toFixed(
                          1
                        )
                    }° · Z{" "}
                    {
                      generatedReport
                        .referenceSnapshot
                        .Z.toFixed(
                          1
                        )
                    } Ω
                  </div>
                </section>

                {/* Actual setup at report generation time. */}
                <section
                  style={{
                    padding:
                      12,
                    border:
                      "1px solid #cbd5e1",
                    borderRadius:
                      10,
                  }}
                >
                  <h2>
                    Final observed setup
                  </h2>

                  <p>
                    {
                      generatedReport
                        .setup
                        .voltageVrms
                    }{" "}
                    Vrms ·{" "}
                    {
                      generatedReport
                        .setup
                        .frequencyHz
                    }{" "}
                    Hz ·{" "}
                    {
                      generatedReport
                        .setup
                        .resistanceOhm
                    }{" "}
                    Ω ·{" "}
                    {
                      generatedReport
                        .setup
                        .capacitanceUf
                    }{" "}
                    µF
                  </p>
                </section>
              </div>

              <section
                style={{
                  marginTop:
                    14,
                }}
              >
                <h2>
                  Snapshot at report generation
                </h2>

                <p>
                  IR{" "}
                  {(
                    generatedReport
                      .liveSnapshot
                      .IR *
                    1000
                  ).toFixed(
                    2
                  )}{" "}
                  mA · IC{" "}
                  {(
                    generatedReport
                      .liveSnapshot
                      .IC *
                    1000
                  ).toFixed(
                    2
                  )}{" "}
                  mA · IT{" "}
                  {(
                    generatedReport
                      .liveSnapshot
                      .IT *
                    1000
                  ).toFixed(
                    2
                  )}{" "}
                  mA · φ{" "}
                  {
                    generatedReport
                      .liveSnapshot
                      .phiDeg.toFixed(
                        1
                      )
                  }° · Z{" "}
                  {
                    generatedReport
                      .liveSnapshot
                      .Z.toFixed(
                        1
                      )
                  } Ω
                </p>
              </section>

              <section
                style={{
                  marginTop:
                    14,
                }}
              >
                <h2>
                  Measurement log
                </h2>

                <div
                  style={{
                    overflowX:
                      "auto",
                  }}
                >
                  <table
                    style={{
                      width:
                        "100%",
                      borderCollapse:
                        "collapse",
                      fontSize:
                        12,
                    }}
                  >
                    <thead>
                      <tr>
                        {[
                          "Point",
                          "Frequency",
                          "Measured",
                          "Theoretical",
                          "Error",
                        ].map(
                          (
                            heading
                          ) => (
                            <th
                              key={
                                heading
                              }
                              style={{
                                textAlign:
                                  "left",
                                padding:
                                  8,
                                borderBottom:
                                  "1px solid #cbd5e1",
                              }}
                            >
                              {
                                heading
                              }
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {
                        generatedReport
                          .measurements
                          .map(
                            (
                              row,
                              index
                            ) => (
                              <tr
                                key={`${row.point}-${row.timestamp}-${index}`}
                              >
                                <td
                                  style={{
                                    padding:
                                      8,
                                  }}
                                >
                                  {
                                    row.point
                                  }
                                </td>

                                <td
                                  style={{
                                    padding:
                                      8,
                                  }}
                                >
                                  {
                                    row.frequencyHz
                                  }{" "}
                                  Hz
                                </td>

                                <td
                                  style={{
                                    padding:
                                      8,
                                  }}
                                >
                                  {
                                    (
                                      row.measuredCurrentRmsA *
                                      1000
                                    ).toFixed(
                                      2
                                    )
                                  }{" "}
                                  mA
                                </td>

                                <td
                                  style={{
                                    padding:
                                      8,
                                  }}
                                >
                                  {
                                    (
                                      row.theoreticalCurrentRmsA *
                                      1000
                                    ).toFixed(
                                      2
                                    )
                                  }{" "}
                                  mA
                                </td>

                                <td
                                  style={{
                                    padding:
                                      8,
                                  }}
                                >
                                  {
                                    row.percentError ===
                                      null
                                      ? "n/a"
                                      : `${row.percentError.toFixed(2)}%`
                                  }
                                </td>
                              </tr>
                            )
                          )
                      }
                    </tbody>
                  </table>
                </div>

                <p
                  style={{
                    color:
                      "#475569",
                  }}
                >
                  {
                    generatedReport
                      .measurementSummary
                      .count
                  }{" "}
                  measurements logged ·{" "}
                  {
                    generatedReport
                      .measurementSummary
                      .averageError ===
                      null
                      ? "Average error unavailable"
                      : `Average error ${generatedReport.measurementSummary.averageError.toFixed(2)}%`
                  }
                </p>
              </section>

              <section
                style={{
                  marginTop:
                    14,
                }}
              >
                <h2>
                  Safety verification
                </h2>

                <p>
                  Trip observed:{" "}
                  {
                    generatedReport
                      .safety
                      .tripObserved
                      ? "Yes"
                      : "No"
                  }{" "}
                  · Recovery observed:{" "}
                  {
                    generatedReport
                      .safety
                      .recoveryObserved
                      ? "Yes"
                      : "No"
                  }
                </p>
              </section>

              <section
                style={{
                  marginTop:
                    14,
                }}
              >
                <h2>
                  Reflection
                </h2>

                <p>
                  <strong>
                    Observation:
                  </strong>{" "}
                  {
                    generatedReport
                      .reflection
                      .observation ||
                    "Not entered."
                  }
                </p>

                <p>
                  <strong>
                    Frequency/current relationship:
                  </strong>{" "}
                  {
                    generatedReport
                      .reflection
                      .frequencyExplanation ||
                    "Not entered."
                  }
                </p>

                <p>
                  <strong>
                    Safety explanation:
                  </strong>{" "}
                  {
                    generatedReport
                      .reflection
                      .safetyExplanation ||
                    "Not entered."
                  }
                </p>
              </section>
            </div>
          </>
        )
      }

      {/* BOTTOM HINT */}
      <div
        style={{
          position:
            "absolute",
          bottom:
            18,
          left:
            "50%",
          transform:
            "translateX(-50%)",
          padding:
            "10px 16px",
          borderRadius:
            999,
          background:
            "rgba(8, 12, 20, 0.9)",
          border:
            "1px solid rgba(148, 163, 184, 0.2)",
          fontSize:
            13,
          color:
            "#cbd5e1",
          zIndex:
            10,
          whiteSpace:
            "nowrap",
        }}
      >
        {
          progress.currentStep ===
            7
            ? "Step 7 · Trigger the safety trip, reduce stress, then restart"
            : progress.currentStep ===
              6
              ? "Step 6 · Sweep frequency until IC ≈ 5 × IR"
              : progress.currentStep >=
                8
                ? "Step 8 · Complete your reflection and generate the final report"
                : "Move the current clamp between the glowing measurement points"
        }
      </div>

    </>
  );
}
