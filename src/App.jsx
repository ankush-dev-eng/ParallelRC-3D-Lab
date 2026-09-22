import React, { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import { labStore, useLabStore } from "./state/labStore";
import Breadboard from "./scene/Breadboard";
import { getColumnSocketPair } from "./scene/breadboardSockets";

const SNAP_RADIUS = 1.0;
const DRAG_HEIGHT = 0.42;
const TRAY_POSITION = [5.0, DRAG_HEIGHT, -2.5];

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
      {/* The resistor body is kept simple for the interaction prototype. */}
      <mesh castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.55, 20]} />
        <meshStandardMaterial
          color={dragging ? "#fbbf24" : "#f97316"}
          roughness={0.5}
        />
      </mesh>

      <mesh position={[0, 0, 0.52]}>
        <cylinderGeometry args={[0.045, 0.045, 0.42, 12]} />
        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.65}
          roughness={0.35}
        />
      </mesh>

      <mesh position={[0, 0, -0.52]}>
        <cylinderGeometry args={[0.045, 0.045, 0.42, 12]} />
        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.65}
          roughness={0.35}
        />
      </mesh>

      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.32, 0.03, 0.07]} />
        <meshBasicMaterial color="#111827" />
      </mesh>

      <mesh position={[0, 0.14, -0.14]}>
        <boxGeometry args={[0.32, 0.03, 0.07]} />
        <meshBasicMaterial color="#111827" />
      </mesh>

      <mesh position={[0, 0.14, 0.14]}>
        <boxGeometry args={[0.32, 0.03, 0.07]} />
        <meshBasicMaterial color="#111827" />
      </mesh>
    </group>
  );
}

function LabScene({
  resistorPosition,
  dragging,
  candidateColumn,
  snappedColumn,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}) {
  return (
    <Canvas
      camera={{
        position: [0, 8.5, 8.5],
        fov: 45,
      }}
      shadows
      onPointerMissed={() => {
        if (!dragging) {
          document.body.style.cursor = "default";
        }
      }}
    >
      <color attach="background" args={["#070b12"]} />

      <ambientLight intensity={0.8} />

      <directionalLight
        position={[4, 8, 5]}
        intensity={2.4}
        castShadow
      />

      <pointLight
        position={[0, 5, 1]}
        intensity={60}
        distance={14}
        decay={2}
        castShadow
      />

      {/* Temporary workbench surface for the procedural prototype. */}
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

      {/* The reusable breadboard now owns the canonical socket visuals. */}
      <Breadboard
        candidateColumn={candidateColumn}
        snappedColumn={snappedColumn}
      />

      <Resistor
        position={resistorPosition}
        dragging={dragging}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />

      {/* Component tray for a failed drop or the initial resistor position. */}
      <mesh
        position={TRAY_POSITION}
      >
        <boxGeometry args={[1.4, 0.08, 1.4]} />
        <meshStandardMaterial
          color="#111827"
          roughness={0.7}
        />
      </mesh>
    </Canvas>
  );
}

export default function App() {
  const [resistorPosition, setResistorPosition] =
    useState(TRAY_POSITION);

  const [dragging, setDragging] = useState(false);
  const [candidateColumn, setCandidateColumn] = useState(null);
  const [snappedColumn, setSnappedColumn] = useState(null);
  const [errors, setErrors] = useState(0);

  const frequencyHz = useLabStore(
    (state) => state.controls.frequencyHz
  );

  // The drag plane converts the pointer ray into a predictable position on the bench.
  const dragPlane = useMemo(
    () =>
      new THREE.Plane(
        new THREE.Vector3(0, 1, 0),
        0
      ),
    []
  );

  function getBenchPoint(event) {
    return event.ray.intersectPlane(
      dragPlane,
      new THREE.Vector3()
    );
  }

  function getClosestColumn(point) {
    let bestColumn = null;
    let bestDistance = Infinity;

    for (let column = 1; column <= 6; column += 1) {
      const pair = getColumnSocketPair(column);

      if (!pair) {
        continue;
      }

      const x = pair.hot.position[0];

      // The resistor is placed halfway between the matching A and B sockets.
      const distance = Math.hypot(
        point.x - x,
        point.z
      );

      if (distance < bestDistance) {
        bestDistance = distance;
        bestColumn = column;
      }
    }

    return bestDistance <= SNAP_RADIUS
      ? bestColumn
      : null;
  }

  function handlePointerDown(event) {
    event.stopPropagation();

    event.target.setPointerCapture?.(
      event.pointerId
    );

    setDragging(true);
    setSnappedColumn(null);
    document.body.style.cursor = "grabbing";
  }

  function handlePointerMove(event) {
    if (!dragging) {
      return;
    }

    event.stopPropagation();

    const point = getBenchPoint(event);

    if (!point) {
      return;
    }

    const nextPosition = [
      point.x,
      DRAG_HEIGHT,
      point.z,
    ];

    const nextCandidate =
      getClosestColumn(point);

    setResistorPosition(nextPosition);
    setCandidateColumn(nextCandidate);
  }

  function handlePointerUp(event) {
    if (!dragging) {
      return;
    }

    event.stopPropagation();

    event.target.releasePointerCapture?.(
      event.pointerId
    );

    const candidate = candidateColumn;

    if (candidate !== null) {
      const pair =
        getColumnSocketPair(candidate);

      // Successful snap: place the resistor at the centre of the selected A/B pair.
      setResistorPosition([
        pair.hot.position[0],
        DRAG_HEIGHT,
        0,
      ]);

      setSnappedColumn(candidate);
    } else {
      // Failed drop: return the resistor to the tray.
      setResistorPosition(TRAY_POSITION);
      setErrors((value) => value + 1);
      setSnappedColumn(null);
    }

    setCandidateColumn(null);
    setDragging(false);
    document.body.style.cursor = "default";
  }

  function resetSpike() {
    setResistorPosition(TRAY_POSITION);
    setDragging(false);
    setCandidateColumn(null);
    setSnappedColumn(null);
    setErrors(0);

    // Reset the temporary store test as well.
    labStore.setControls({
      frequencyHz: 1000,
    });

    document.body.style.cursor = "default";
  }

  // Temporary spike condition. Later this will come from the real wiring selectors.
  const circuitAssembled =
    snappedColumn !== null;

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
      <div
        style={{
          position: "absolute",
          inset: 0,
        }}
      >
        <LabScene
          resistorPosition={resistorPosition}
          dragging={dragging}
          candidateColumn={candidateColumn}
          snappedColumn={snappedColumn}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: 18,
          left: 18,
          width: 330,
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
          Parallel RC — Drag & Snap Spike
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#94a3b8",
            lineHeight: 1.5,
          }}
        >
          Test only: drag the resistor from
          the tray and place it across one
          A/B socket pair.
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
            <strong>Drag:</strong>{" "}
            {dragging ? "yes" : "no"}
          </div>

          <div>
            <strong>Snap candidate:</strong>{" "}
            {candidateColumn === null
              ? "none"
              : `column ${candidateColumn}`}
          </div>

          <div>
            <strong>Snapped:</strong>{" "}
            {snappedColumn === null
              ? "no"
              : `column ${snappedColumn}`}
          </div>

          <div>
            <strong>circuitAssembled:</strong>{" "}
            <span
              style={{
                color: circuitAssembled
                  ? "#22c55e"
                  : "#f97316",
              }}
            >
              {String(circuitAssembled)}
            </span>
          </div>

          <div>
            <strong>Procedural errors:</strong>{" "}
            {errors}
          </div>

          <div>
            <strong>Store frequency:</strong>{" "}
            {frequencyHz} Hz
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 10,
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
          onClick={resetSpike}
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
          Reset Spike
        </button>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 18,
          left: "50%",
          transform: "translateX(-50%)",
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
        A/B sockets = legal targets •
        Release near a column to snap •
        Drop elsewhere to return to tray
      </div>
    </div>
  );
}