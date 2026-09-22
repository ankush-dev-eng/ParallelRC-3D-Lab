import React, {
  useEffect,
  useState,
} from "react";
import { Canvas } from "@react-three/fiber";

import {
  labStore,
  useLabStore,
} from "./state/labStore";

import {
  selectCircuitAssembled,
  selectResistorConnected,
} from "./state/selectors";

import Breadboard from "./scene/Breadboard";
import Capacitor from "./scene/Capacitor";
import CameraRig from "./scene/CameraRig";
import {
  getColumnSocketPair,
} from "./scene/breadboardSockets";

import {
  useDragController,
} from "./interaction/DragController";

// Shared interaction constants.
const SNAP_RADIUS = 1.0;
const DRAG_HEIGHT = 0.42;

// Initial tray locations for the two components.
const TRAY_POSITION = [
  5.0,
  DRAG_HEIGHT,
  -2.5,
];

const CAPACITOR_TRAY_POSITION = [
  6.5,
  DRAG_HEIGHT,
  -2.5,
];

// ------------------------------------------------------------
// RESISTOR
// ------------------------------------------------------------

// This component only renders the resistor and forwards
// pointer events to the shared interaction system.
function Resistor({
  position,
  dragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}) {
  return (
    <group
      position={position}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = "grab";
      }}
      onPointerOut={() => {
        if (!dragging) {
          document.body.style.cursor =
            "default";
        }
      }}
    >
      {/* Simple resistor body for the procedural prototype. */}
      <mesh castShadow>
        <cylinderGeometry
          args={[0.18, 0.18, 0.55, 20]}
        />

        <meshStandardMaterial
          color={
            dragging
              ? "#fbbf24"
              : "#f97316"
          }
          roughness={0.5}
        />
      </mesh>

      {/* Top electrical lead. */}
      <mesh position={[0, 0, 0.52]}>
        <cylinderGeometry
          args={[0.045, 0.045, 0.42, 12]}
        />

        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.65}
          roughness={0.35}
        />
      </mesh>

      {/* Bottom electrical lead. */}
      <mesh position={[0, 0, -0.52]}>
        <cylinderGeometry
          args={[0.045, 0.045, 0.42, 12]}
        />

        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.65}
          roughness={0.35}
        />
      </mesh>

      {/* Three simple visual bands identify the resistor. */}
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry
          args={[0.32, 0.03, 0.07]}
        />
        <meshBasicMaterial color="#111827" />
      </mesh>

      <mesh position={[0, 0.14, -0.14]}>
        <boxGeometry
          args={[0.32, 0.03, 0.07]}
        />
        <meshBasicMaterial color="#111827" />
      </mesh>

      <mesh position={[0, 0.14, 0.14]}>
        <boxGeometry
          args={[0.32, 0.03, 0.07]}
        />
        <meshBasicMaterial color="#111827" />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------
// LAB SCENE
// ------------------------------------------------------------

// The scene receives state and handlers from App.
// It does not own circuit logic.
function LabScene({
  cameraView,
  dragState,
  resistorPosition,
  capacitorPosition,
  resistorSnappedColumn,
  capacitorSnappedColumn,
  onResistorPointerDown,
  onCapacitorPointerDown,
  onPointerMove,
  onPointerUp,
}) {
  const candidateColumn =
    dragState.candidateColumn;

  // Show the snapped column for the component
  // currently being interacted with.
  const displayedSnappedColumn =
    dragState.component === "capacitor"
      ? capacitorSnappedColumn
      : resistorSnappedColumn;

  return (
    <Canvas
      style={{
        width: "100%",
        height: "100%",
      }}
      camera={{
        position: [0, 8.5, 8.5],
        fov: 45,
        near: 0.1,
        far: 100,
      }}
      shadows
      onPointerMissed={() => {
        document.body.style.cursor =
          "default";
      }}
    >
      {/* Camera controller for Bench, Board, and Analysis views. */}
      <CameraRig view={cameraView} />

      <color
        attach="background"
        args={["#070b12"]}
      />

      {/* General scene illumination. */}
      <ambientLight intensity={0.8} />

      {/* Main directional lab light. */}
      <directionalLight
        position={[4, 8, 5]}
        intensity={2.4}
        castShadow
      />

      {/* Centered fill light keeps the workbench readable. */}
      <pointLight
        position={[0, 5, 1]}
        intensity={60}
        distance={14}
        decay={2}
        castShadow
      />

      {/* Temporary workbench surface. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[14, 7]} />

        <meshStandardMaterial
          color="#18212b"
          roughness={0.8}
        />
      </mesh>

      {/* Canonical breadboard and socket layout. */}
      <Breadboard
        candidateColumn={
          candidateColumn
        }
        snappedColumn={
          displayedSnappedColumn
        }
      />

      {/* Resistor. */}
      <Resistor
        position={
          dragState.component ===
            "resistor" &&
            dragState.position
            ? dragState.position
            : resistorPosition
        }
        dragging={
          dragState.component ===
          "resistor"
        }
        onPointerDown={
          onResistorPointerDown
        }
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />

      {/* Capacitor. */}
      <Capacitor
        position={
          dragState.component ===
            "capacitor" &&
            dragState.position
            ? dragState.position
            : capacitorPosition
        }
        dragging={
          dragState.component ===
          "capacitor"
        }
        onPointerDown={
          onCapacitorPointerDown
        }
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />

      {/* Component tray. */}
      <mesh
        position={TRAY_POSITION}
      >
        <boxGeometry
          args={[3.4, 0.08, 1.8]}
        />

        <meshStandardMaterial
          color="#111827"
          roughness={0.7}
        />
      </mesh>
    </Canvas>
  );
}

// ------------------------------------------------------------
// SMALL UI HELPERS
// ------------------------------------------------------------

// Format frequency so the HUD can show a readable value.
function formatFrequency(
  frequencyHz
) {
  if (frequencyHz >= 1000) {
    return `${(
      frequencyHz / 1000
    ).toFixed(1)} kHz`;
  }

  return `${frequencyHz} Hz`;
}

// Reusable slider used by the electrical controls.
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
        display: "grid",
        gap: 6,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            color: "#cbd5e1",
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
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(
            Number(
              event.target.value
            )
          )
        }
        style={{
          width: "100%",
          cursor: "pointer",
        }}
      />
    </div>
  );
}

// ------------------------------------------------------------
// APP
// ------------------------------------------------------------

export default function App() {
  // Persistent visual position of the resistor.
  const [
    resistorPosition,
    setResistorPosition,
  ] = useState(
    TRAY_POSITION
  );

  // Persistent visual position of the capacitor.
  const [
    capacitorPosition,
    setCapacitorPosition,
  ] = useState(
    CAPACITOR_TRAY_POSITION
  );

  // Remember the last column used by each component.
  const [
    resistorSnappedColumn,
    setResistorSnappedColumn,
  ] = useState(null);

  const [
    capacitorSnappedColumn,
    setCapacitorSnappedColumn,
  ] = useState(null);

  const [errors, setErrors] =
    useState(0);

  // ----------------------------------------------------------
  // CAMERA STATE
  // ----------------------------------------------------------

  const [cameraView, setCameraView] =
    useState("bench");

  // Keyboard shortcuts:
  // 1 = Bench
  // 2 = Board
  // 3 = Analysis
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "1") {
        setCameraView("bench");
      }

      if (event.key === "2") {
        setCameraView("board");
      }

      if (event.key === "3") {
        setCameraView("analysis");
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  // MY UNDERSTANDING:
  // Camera view is presentation state because changing the camera
  // changes only what the user sees, not the electrical circuit.

  // ----------------------------------------------------------
  // CENTRAL STORE
  // ----------------------------------------------------------

  const voltageVrms = useLabStore(
    (state) =>
      state.controls.voltageVrms
  );

  const frequencyHz = useLabStore(
    (state) =>
      state.controls.frequencyHz
  );

  const resistanceOhm = useLabStore(
    (state) =>
      state.controls.resistanceOhm
  );

  const capacitanceUf = useLabStore(
    (state) =>
      state.controls.capacitanceUf
  );

  const generatorOn = useLabStore(
    (state) =>
      state.controls.generatorOn
  );

  const scopeOn = useLabStore(
    (state) =>
      state.controls.scopeOn
  );

  const resistorConnected =
    useLabStore(
      selectResistorConnected
    );

  const circuitAssembled =
    useLabStore(
      selectCircuitAssembled
    );

  // MY UNDERSTANDING:
  // These control values are read from the central store so the
  // future physics engine and instruments will all see the same values.

  // ----------------------------------------------------------
  // DROP RESULT
  // ----------------------------------------------------------

  // The generic controller reports what happened.
  // App decides how the result changes the circuit state.
  const handleComponentDrop = (
    result
  ) => {
    const {
      component,
      column,
      sockets,
    } = result;

    if (
      component ===
      "resistor"
    ) {
      // R and C must use different physical A/B pairs.
      const columnOccupied =
        column !== null &&
        column ===
        capacitorSnappedColumn;

      if (
        column !== null &&
        sockets &&
        !columnOccupied
      ) {
        const pair =
          getColumnSocketPair(
            column
          );

        if (!pair) {
          return;
        }

        const snappedPosition = [
          pair.hot.position[0],
          DRAG_HEIGHT,
          0,
        ];

        setResistorPosition(
          snappedPosition
        );

        setResistorSnappedColumn(
          column
        );

        // Store the actual electrical socket IDs.
        labStore.setWiring({
          resistor: [
            sockets.first,
            sockets.second,
          ],
        });
      } else {
        // Invalid placement sends the resistor back to the tray.
        setResistorPosition(
          TRAY_POSITION
        );

        setResistorSnappedColumn(
          null
        );

        setErrors(
          (value) =>
            value + 1
        );

        // Keep visual and electrical state consistent.
        labStore.setWiring({
          resistor: [
            null,
            null,
          ],
        });
      }
    }

    if (
      component ===
      "capacitor"
    ) {
      // R and C must use different physical A/B pairs.
      const columnOccupied =
        column !== null &&
        column ===
        resistorSnappedColumn;

      if (
        column !== null &&
        sockets &&
        !columnOccupied
      ) {
        const pair =
          getColumnSocketPair(
            column
          );

        if (!pair) {
          return;
        }

        const snappedPosition = [
          pair.hot.position[0],
          DRAG_HEIGHT,
          0,
        ];

        setCapacitorPosition(
          snappedPosition
        );

        setCapacitorSnappedColumn(
          column
        );

        // Store the capacitor's electrical socket IDs.
        labStore.setWiring({
          capacitor: [
            sockets.first,
            sockets.second,
          ],
        });
      } else {
        // Invalid placement sends the capacitor back to the tray.
        setCapacitorPosition(
          CAPACITOR_TRAY_POSITION
        );

        setCapacitorSnappedColumn(
          null
        );

        setErrors(
          (value) =>
            value + 1
        );

        // Clear the capacitor's electrical connection.
        labStore.setWiring({
          capacitor: [
            null,
            null,
          ],
        });
      }
    }

    // MY UNDERSTANDING:
    // The controller only decides where the component was dropped.
    // App decides how that result changes the experiment's state.
  };

  // ----------------------------------------------------------
  // GENERIC DRAG CONTROLLER
  // ----------------------------------------------------------

  const {
    dragState,
    startDrag,
    moveDrag,
    endDrag,
  } = useDragController({
    dragHeight:
      DRAG_HEIGHT,
    snapRadius:
      SNAP_RADIUS,
    onDrop:
      handleComponentDrop,
  });

  // Start dragging the resistor.
  const handleResistorPointerDown = (
    event
  ) => {
    startDrag(
      event,
      "resistor",
      resistorPosition
    );
  };

  // Start dragging the capacitor.
  const handleCapacitorPointerDown = (
    event
  ) => {
    startDrag(
      event,
      "capacitor",
      capacitorPosition
    );
  };

  // MY UNDERSTANDING:
  // Both components can use the same startDrag function because
  // the common drag behavior is inside the generic controller.
  // App only tells it which component was clicked.

  // ----------------------------------------------------------
  // CONTROL HANDLERS
  // ----------------------------------------------------------

  function setVoltage(
    value
  ) {
    labStore.setControls({
      voltageVrms: value,
    });
  }

  function setFrequency(
    value
  ) {
    labStore.setControls({
      frequencyHz: value,
    });
  }

  function setResistance(
    value
  ) {
    labStore.setControls({
      resistanceOhm: value,
    });
  }

  function setCapacitance(
    value
  ) {
    labStore.setControls({
      capacitanceUf: value,
    });
  }

  function toggleGenerator() {
    labStore.setControls({
      generatorOn:
        !generatorOn,
    });
  }

  function loadReferenceValues() {
    labStore.setControls({
      voltageVrms: 5,
      frequencyHz: 1000,
      resistanceOhm: 1000,
      capacitanceUf: 0.1,
    });
  }

  // MY UNDERSTANDING:
  // Every control updates the central store immediately, so any future
  // physics or instrument component can react to the same live values.

  // ----------------------------------------------------------
  // RESET
  // ----------------------------------------------------------

  function resetLab() {
    // Return both components to the tray.
    setResistorPosition(
      TRAY_POSITION
    );

    setCapacitorPosition(
      CAPACITOR_TRAY_POSITION
    );

    // Forget previous snap locations.
    setResistorSnappedColumn(
      null
    );

    setCapacitorSnappedColumn(
      null
    );

    // Reset interaction errors.
    setErrors(0);

    // Reset the complete laboratory store.
    labStore.reset();

    // Return to the default camera view.
    setCameraView("bench");

    document.body.style.cursor =
      "default";
  }

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  return (
    <div
      style={{
        position:
          "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background:
          "#070b12",
        color: "#e5e7eb",
        fontFamily:
          "Inter, system-ui, sans-serif",
      }}
    >
      {/* 3D scene. */}
      <div
        style={{
          position:
            "absolute",
          inset: 0,
          width:
            "100%",
          height:
            "100%",
        }}
      >
        <LabScene
          cameraView={
            cameraView
          }
          dragState={
            dragState
          }
          resistorPosition={
            resistorPosition
          }
          capacitorPosition={
            capacitorPosition
          }
          resistorSnappedColumn={
            resistorSnappedColumn
          }
          capacitorSnappedColumn={
            capacitorSnappedColumn
          }
          onResistorPointerDown={
            handleResistorPointerDown
          }
          onCapacitorPointerDown={
            handleCapacitorPointerDown
          }
          onPointerMove={
            moveDrag
          }
          onPointerUp={
            endDrag
          }
        />
      </div>

      {/* Main HUD. */}
      <div
        style={{
          position:
            "absolute",
          top: 18,
          left: 18,
          width: 385,
          maxHeight:
            "calc(100vh - 36px)",
          overflowY:
            "auto",
          padding: 18,
          borderRadius:
            16,
          background:
            "rgba(8, 12, 20, 0.90)",
          border:
            "1px solid rgba(148, 163, 184, 0.2)",
          backdropFilter:
            "blur(8px)",
          zIndex: 10,
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
          Parallel RC — Controls
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
          Configure the AC source
          and component values in
          real time.
        </div>

        {/* ------------------------------------------------
                    EXPERIMENT CONTROLS
                ------------------------------------------------- */}

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
            gap: 14,
          }}
        >
          <ControlSlider
            label="Voltage"
            value={
              voltageVrms
            }
            min={1}
            max={10}
            step={0.1}
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
            min={1000}
            max={25000}
            step={100}
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
            min={100}
            max={5000}
            step={100}
            unit=" Ω"
            onChange={
              setResistance
            }
          />

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
              <option value={0.01}>
                0.01 µF
              </option>

              <option value={0.1}>
                0.1 µF
              </option>

              <option value={1}>
                1.0 µF
              </option>
            </select>
          </div>
        </div>

        {/* Reference experiment values. */}
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
              "#111827",
            color:
              "#e5e7eb",
            fontWeight:
              700,
            cursor:
              "pointer",
          }}
        >
          Load reference: 5 V · 1 kHz ·
          1 kΩ · 0.1 µF
        </button>

        {/* Generator control. */}
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
            border: 0,
            borderRadius:
              9,
            background:
              generatorOn
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
          AC Generator:
          {generatorOn
            ? " ON"
            : " OFF"}
        </button>

        {/* Temporary status panel. */}
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
            color:
              "#cbd5e1",
            lineHeight:
              1.6,
          }}
        >
          <div>
            Frequency:
            {" "}
            {formatFrequency(
              frequencyHz
            )}
          </div>

          <div>
            Generator:
            {" "}
            {generatorOn
              ? "ON"
              : "OFF"}
          </div>

          <div>
            Scope:
            {" "}
            {scopeOn
              ? "ON"
              : "OFF"}
          </div>
        </div>

        {/* ------------------------------------------------
                    CAMERA
                ------------------------------------------------- */}

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
            gap: 6,
            flexWrap:
              "wrap",
          }}
        >
          <button
            onClick={() =>
              setCameraView(
                "bench"
              )
            }
          >
            1 · Bench
          </button>

          <button
            onClick={() =>
              setCameraView(
                "board"
              )
            }
          >
            2 · Board
          </button>

          <button
            onClick={() =>
              setCameraView(
                "analysis"
              )
            }
          >
            3 · Analysis
          </button>
        </div>

        {/* ------------------------------------------------
                    CURRENT STATE
                ------------------------------------------------- */}

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
          Experiment state
        </div>

        <div
          style={{
            display:
              "grid",
            gap: 7,
            fontSize:
              13,
          }}
        >
          <div>
            <strong>
              Camera:
            </strong>{" "}
            {
              cameraView
            }
          </div>

          <div>
            <strong>
              Dragging:
            </strong>{" "}
            {
              dragState.component ??
              "none"
            }
          </div>

          <div>
            <strong>
              Snap candidate:
            </strong>{" "}
            {
              dragState.candidateColumn ===
                null
                ? "none"
                : `column ${dragState.candidateColumn}`
            }
          </div>

          <div>
            <strong>
              Resistor connected:
            </strong>{" "}
            {String(
              resistorConnected
            )}
          </div>

          <div>
            <strong>
              Resistor snapped:
            </strong>{" "}
            {
              resistorSnappedColumn ===
                null
                ? "no"
                : `column ${resistorSnappedColumn}`
            }
          </div>

          <div>
            <strong>
              Capacitor snapped:
            </strong>{" "}
            {
              capacitorSnappedColumn ===
                null
                ? "no"
                : `column ${capacitorSnappedColumn}`
            }
          </div>

          <div>
            <strong>
              Circuit assembled:
            </strong>{" "}
            <span
              style={{
                color:
                  circuitAssembled
                    ? "#22c55e"
                    : "#f97316",
              }}
            >
              {String(
                circuitAssembled
              )}
            </span>
          </div>

          <div>
            <strong>
              Errors:
            </strong>{" "}
            {errors}
          </div>
        </div>

        {/* Temporary testing controls from the earlier phase. */}
        <div
          style={{
            marginTop:
              16,
            display:
              "none",
          }}
        >
          <button
            onClick={() =>
              labStore.setControls(
                {
                  frequencyHz:
                    1000,
                }
              )
            }
          >
            1 kHz
          </button>

          <button
            onClick={() =>
              labStore.setControls(
                {
                  frequencyHz:
                    5000,
                }
              )
            }
          >
            5 kHz
          </button>
        </div>

        {/* Reset. */}
        <button
          onClick={resetLab}
          style={{
            marginTop:
              18,
            width:
              "100%",
            border: 0,
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

      {/* Bottom interaction hint. */}
      <div
        style={{
          position:
            "absolute",
          bottom: 18,
          left: "50%",
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
          zIndex: 10,
          whiteSpace:
            "nowrap",
        }}
      >
        1 · Bench • 2 · Board •
        3 · Analysis • Drag R and C
        onto different A/B columns
      </div>
    </div>
  );
}