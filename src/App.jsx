import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";

import { labStore, useLabStore } from "./state/labStore";

import {
  selectCircuitAssembled,
  selectResistorConnected,
} from "./state/selectors";

import Breadboard from "./scene/Breadboard";
import Capacitor from "./scene/Capacitor";
import { getColumnSocketPair } from "./scene/breadboardSockets";

import { useDragController } from "./interaction/DragController";

// Shared interaction constants.
const SNAP_RADIUS = 1.0;
const DRAG_HEIGHT = 0.42;

// Initial tray locations for the two components.
const TRAY_POSITION = [5.0, DRAG_HEIGHT, -2.5];

const CAPACITOR_TRAY_POSITION = [
  6.5,
  DRAG_HEIGHT,
  -2.5,
];

// ------------------------------------------------------------
// RESISTOR
// ------------------------------------------------------------
// This component is only responsible for rendering the resistor
// and forwarding pointer events to the interaction system.
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
          document.body.style.cursor = "default";
        }
      }}
    >
      {/* Simple resistor body for the current procedural prototype. */}
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
// This component contains the 3D scene and receives state/handlers
// from App instead of owning electrical logic itself.
function LabScene({
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

  // Show the last snapped column for the component
  // that is currently relevant to the interaction.
  const displayedSnappedColumn =
    dragState.component === "capacitor"
      ? capacitorSnappedColumn
      : resistorSnappedColumn;

  return (
    <Canvas
      camera={{
        position: [0, 8.5, 8.5],
        fov: 45,
      }}
      shadows
      onPointerMissed={() => {
        document.body.style.cursor = "default";
      }}
    >
      <color
        attach="background"
        args={["#070b12"]}
      />

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
        candidateColumn={candidateColumn}
        snappedColumn={displayedSnappedColumn}
      />

      {/* Resistor. */}
      <Resistor
        position={
          dragState.component === "resistor" &&
            dragState.position
            ? dragState.position
            : resistorPosition
        }
        dragging={
          dragState.component === "resistor"
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
          dragState.component === "capacitor" &&
            dragState.position
            ? dragState.position
            : capacitorPosition
        }
        dragging={
          dragState.component === "capacitor"
        }
        onPointerDown={
          onCapacitorPointerDown
        }
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />

      {/* Tray for components before placement. */}
      <mesh position={TRAY_POSITION}>
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
// APP
// ------------------------------------------------------------
export default function App() {
  // Persistent visual positions are kept in React state because
  // they describe where the components should remain after a drop.
  const [
    resistorPosition,
    setResistorPosition,
  ] = useState(TRAY_POSITION);

  const [
    capacitorPosition,
    setCapacitorPosition,
  ] = useState(
    CAPACITOR_TRAY_POSITION
  );

  // These values describe where each component was last snapped.
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
  // READ FROM CENTRAL STORE
  // ----------------------------------------------------------

  const frequencyHz = useLabStore(
    (state) => state.controls.frequencyHz
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
  // Write in your own words how these selectors read information
  // from the central lab store instead of keeping duplicate values in App.

  // ----------------------------------------------------------
  // DROP RESULT
  // ----------------------------------------------------------
  // The generic drag controller tells App what happened.
  // App then decides which component should update the lab state.
  const handleComponentDrop = (
    result
  ) => {
    const {
      component,
      column,
      sockets,
    } = result;

    if (component === "resistor") {
      // Reject a resistor placement if the capacitor already
      // occupies the same physical A/B column.
      const columnOccupied =
        column !== null &&
        column === capacitorSnappedColumn;

      if (
        column !== null &&
        sockets &&
        !columnOccupied
      ) {
        const pair =
          getColumnSocketPair(column);

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

        // Store the actual electrical socket IDs,
        // not screen coordinates.
        labStore.setWiring({
          resistor: [
            sockets.first,
            sockets.second,
          ],
        });
      } else {
        // Invalid placement returns the resistor to the tray.
        setResistorPosition(
          TRAY_POSITION
        );

        setResistorSnappedColumn(
          null
        );

        setErrors(
          (value) => value + 1
        );

        // Clear the electrical connection as well.
        labStore.setWiring({
          resistor: [null, null],
        });
      }
    }

    if (component === "capacitor") {
      // Reject a capacitor placement if the resistor already
      // occupies the same physical A/B column.
      const columnOccupied =
        column !== null &&
        column === resistorSnappedColumn;

      if (
        column !== null &&
        sockets &&
        !columnOccupied
      ) {
        const pair =
          getColumnSocketPair(column);

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

        // Store the capacitor's two actual socket IDs.
        labStore.setWiring({
          capacitor: [
            sockets.first,
            sockets.second,
          ],
        });
      } else {
        // Invalid capacitor placement returns it to the tray.
        setCapacitorPosition(
          CAPACITOR_TRAY_POSITION
        );

        setCapacitorSnappedColumn(
          null
        );

        setErrors(
          (value) => value + 1
        );

        // Remove its electrical connection.
        labStore.setWiring({
          capacitor: [null, null],
        });
      }
    }

    // MY UNDERSTANDING:
    // Write in your own words why the generic controller reports
    // the drop result to App, and App decides how to update the store.
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
    dragHeight: DRAG_HEIGHT,
    snapRadius: SNAP_RADIUS,
    onDrop: handleComponentDrop,
  });

  // Start a resistor drag.
  const handleResistorPointerDown = (
    event
  ) => {
    startDrag(
      event,
      "resistor",
      resistorPosition
    );
  };

  // Start a capacitor drag.
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
  // Both components call the same startDrag function because
  // the controller handles the common drag behaviour.
  // App only identifies which component was clicked.

  // ----------------------------------------------------------
  // RESET
  // ----------------------------------------------------------
  function resetLab() {
    // Reset both visual component positions.
    setResistorPosition(
      TRAY_POSITION
    );

    setCapacitorPosition(
      CAPACITOR_TRAY_POSITION
    );

    // Forget both component placements.
    setResistorSnappedColumn(
      null
    );

    setCapacitorSnappedColumn(
      null
    );

    // Reset the temporary interaction error counter.
    setErrors(0);

    // Reset the complete central laboratory state.
    labStore.reset();

    document.body.style.cursor =
      "default";
  }

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#070b12",
        color: "#e5e7eb",
        fontFamily:
          "Inter, system-ui, sans-serif",
      }}
    >
      {/* 3D scene. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
        }}
      >
        <LabScene
          dragState={dragState}
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
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
        />
      </div>

      {/* Main HUD. */}
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 18,
          width: 350,
          padding: 18,
          borderRadius: 16,
          background:
            "rgba(8, 12, 20, 0.88)",
          border:
            "1px solid rgba(148, 163, 184, 0.2)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            marginBottom: 6,
          }}
        >
          Parallel RC — Interaction
          Test
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#94a3b8",
            lineHeight: 1.5,
          }}
        >
          Drag the resistor and
          capacitor onto different
          A/B socket pairs.
        </div>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gap: 8,
            fontSize: 13,
          }}
        >
          <div>
            <strong>
              Dragging:
            </strong>{" "}
            {dragState.component ??
              "none"}
          </div>

          <div>
            <strong>
              Snap candidate:
            </strong>{" "}
            {dragState.candidateColumn ===
              null
              ? "none"
              : `column ${dragState.candidateColumn}`}
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
            {resistorSnappedColumn ===
              null
              ? "no"
              : `column ${resistorSnappedColumn}`}
          </div>

          <div>
            <strong>
              Capacitor snapped:
            </strong>{" "}
            {capacitorSnappedColumn ===
              null
              ? "no"
              : `column ${capacitorSnappedColumn}`}
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
              Procedural errors:
            </strong>{" "}
            {errors}
          </div>

          <div>
            <strong>
              Store frequency:
            </strong>{" "}
            {frequencyHz} Hz
          </div>
        </div>

        {/* Temporary store test buttons. */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 12,
          }}
        >
          <button
            onClick={() =>
              labStore.setControls({
                frequencyHz: 1000,
              })
            }
          >
            1 kHz
          </button>

          <button
            onClick={() =>
              labStore.setControls({
                frequencyHz: 5000,
              })
            }
          >
            5 kHz
          </button>
        </div>

        <button
          onClick={resetLab}
          style={{
            marginTop: 16,
            width: "100%",
            border: 0,
            borderRadius: 10,
            padding: "10px 12px",
            background: "#7c3aed",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Reset Lab
        </button>
      </div>

      {/* Small interaction hint. */}
      <div
        style={{
          position: "absolute",
          bottom: 18,
          left: "50%",
          transform:
            "translateX(-50%)",
          padding: "10px 16px",
          borderRadius: 999,
          background:
            "rgba(8, 12, 20, 0.9)",
          border:
            "1px solid rgba(148, 163, 184, 0.2)",
          fontSize: 13,
          color: "#cbd5e1",
        }}
      >
        Different A/B columns are
        required for R and C • Drop
        elsewhere to return to the tray
      </div>
    </div>
  );
}