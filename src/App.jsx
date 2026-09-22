import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Canvas,
} from "@react-three/fiber";

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
import CurrentClamp from "./scene/CurrentClamp";

import Oscilloscope from "./components/Oscilloscope";

import {
  getColumnSocketPair,
} from "./scene/breadboardSockets";

import {
  useDragController,
} from "./interaction/DragController";

import {
  getElectricalSnapshot,
} from "./physics/rcMath";

import {
  getClampCurrentRms,
} from "./physics/measurement";

// ------------------------------------------------------------
// REFERENCE EXPERIMENT
// ------------------------------------------------------------

// These values are the fixed reference configuration specified
// for the main teaching experiment.
const REFERENCE_SETUP = {
  voltageVrms: 5,
  frequencyHz: 1000,
  resistanceOhm: 1000,
  capacitanceUf: 0.1,
};

// Calculate the reference values once from the same physics engine
// used by the live experiment.
//
// This is important because the reference panel and the live panel
// must use the same mathematical formulas.
const REFERENCE_SNAPSHOT =
  getElectricalSnapshot(
    REFERENCE_SETUP
  );

// ------------------------------------------------------------
// SHARED INTERACTION CONSTANTS
// ------------------------------------------------------------

const SNAP_RADIUS = 1.0;

const DRAG_HEIGHT = 0.42;

// Initial resistor tray location.
const TRAY_POSITION = [
  5.0,
  DRAG_HEIGHT,
  -2.5,
];

// Initial capacitor tray location.
const CAPACITOR_TRAY_POSITION = [
  6.5,
  DRAG_HEIGHT,
  -2.5,
];

// ------------------------------------------------------------
// RESISTOR
// ------------------------------------------------------------

// This component only renders the resistor.
// Dragging and circuit state are handled outside this component.
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
      onPointerDown={
        onPointerDown
      }
      onPointerMove={
        onPointerMove
      }
      onPointerUp={
        onPointerUp
      }
      onPointerOver={(
        event
      ) => {
        event.stopPropagation();

        document.body.style.cursor =
          "grab";
      }}
      onPointerOut={() => {
        if (!dragging) {
          document.body.style.cursor =
            "default";
        }
      }}
    >
      {/* Main resistor body. */}
      <mesh castShadow>
        <cylinderGeometry
          args={[
            0.18,
            0.18,
            0.55,
            20,
          ]}
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

      {/* Top resistor lead. */}
      <mesh
        position={[
          0,
          0,
          0.52,
        ]}
      >
        <cylinderGeometry
          args={[
            0.045,
            0.045,
            0.42,
            12,
          ]}
        />

        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.65}
          roughness={0.35}
        />
      </mesh>

      {/* Bottom resistor lead. */}
      <mesh
        position={[
          0,
          0,
          -0.52,
        ]}
      >
        <cylinderGeometry
          args={[
            0.045,
            0.045,
            0.42,
            12,
          ]}
        />

        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.65}
          roughness={0.35}
        />
      </mesh>

      {/* Simple visual resistor bands. */}
      <mesh
        position={[
          0,
          0.14,
          0,
        ]}
      >
        <boxGeometry
          args={[
            0.32,
            0.03,
            0.07,
          ]}
        />

        <meshBasicMaterial
          color="#111827"
        />
      </mesh>

      <mesh
        position={[
          0,
          0.14,
          -0.14,
        ]}
      >
        <boxGeometry
          args={[
            0.32,
            0.03,
            0.07,
          ]}
        />

        <meshBasicMaterial
          color="#111827"
        />
      </mesh>

      <mesh
        position={[
          0,
          0.14,
          0.14,
        ]}
      >
        <boxGeometry
          args={[
            0.32,
            0.03,
            0.07,
          ]}
        />

        <meshBasicMaterial
          color="#111827"
        />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------
// LAB SCENE
// ------------------------------------------------------------

// The scene only receives data and interaction callbacks.
// It does not own the experiment state.
function LabScene({
  cameraView,
  dragState,
  resistorPosition,
  capacitorPosition,
  resistorSnappedColumn,
  capacitorSnappedColumn,
  clampPoint,
  onResistorPointerDown,
  onCapacitorPointerDown,
  onClampPointChange,
  onPointerMove,
  onPointerUp,
}) {
  const candidateColumn =
    dragState.candidateColumn;

  // Show the snap column for whichever component is currently
  // being dragged.
  const displayedSnappedColumn =
    dragState.component ===
      "capacitor"
      ? capacitorSnappedColumn
      : resistorSnappedColumn;

  return (
    <Canvas
      style={{
        width: "100%",
        height: "100%",
      }}
      camera={{
        position: [
          0,
          8.5,
          8.5,
        ],
        fov: 45,
        near: 0.1,
        far: 100,
      }}
      shadows
    >
      {/* Smooth three-view camera controller. */}
      <CameraRig
        view={cameraView}
      />

      <color
        attach="background"
        args={[
          "#070b12",
        ]}
      />

      {/* General laboratory illumination. */}
      <ambientLight
        intensity={0.8}
      />

      {/* Main directional light. */}
      <directionalLight
        position={[
          4,
          8,
          5,
        ]}
        intensity={2.4}
        castShadow
      />

      {/* Additional fill light. */}
      <pointLight
        position={[
          0,
          5,
          1,
        ]}
        intensity={60}
        distance={14}
        decay={2}
        castShadow
      />

      {/* Procedural laboratory bench. */}
      <mesh
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
        receiveShadow
      >
        <planeGeometry
          args={[
            14,
            7,
          ]}
        />

        <meshStandardMaterial
          color="#18212b"
          roughness={0.8}
        />
      </mesh>

      {/* Reusable breadboard and socket layout. */}
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
        onPointerMove={
          onPointerMove
        }
        onPointerUp={
          onPointerUp
        }
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
        onPointerMove={
          onPointerMove
        }
        onPointerUp={
          onPointerUp
        }
      />

      {/* Virtual AC current clamp. */}
      <CurrentClamp
        point={clampPoint}
        resistorColumn={
          resistorSnappedColumn
        }
        capacitorColumn={
          capacitorSnappedColumn
        }
        onPointChange={
          onClampPointChange
        }
      />

      {/* Simple component tray. */}
      <mesh
        position={
          TRAY_POSITION
        }
      >
        <boxGeometry
          args={[
            3.4,
            0.08,
            1.8,
          ]}
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
// UI HELPERS
// ------------------------------------------------------------

// Format frequency into a readable value.
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

// Reusable slider for electrical controls.
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
        min={min}
        max={max}
        step={step}
        value={value}
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
          width: "100%",
          cursor:
            "pointer",
        }}
      />
    </div>
  );
}

// ------------------------------------------------------------
// APP
// ------------------------------------------------------------

export default function App() {
  const [
    resistorPosition,
    setResistorPosition,
  ] = useState(
    TRAY_POSITION
  );

  const [
    capacitorPosition,
    setCapacitorPosition,
  ] = useState(
    CAPACITOR_TRAY_POSITION
  );

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

  // --------------------------------------------------------
  // CAMERA
  // --------------------------------------------------------

  const [
    cameraView,
    setCameraView,
  ] = useState("bench");

  // Keyboard shortcuts:
  // 1 = Bench
  // 2 = Board
  // 3 = Analysis
  useEffect(() => {
    function handleKeyDown(
      event
    ) {
      if (
        event.key ===
        "1"
      ) {
        setCameraView(
          "bench"
        );
      }

      if (
        event.key ===
        "2"
      ) {
        setCameraView(
          "board"
        );
      }

      if (
        event.key ===
        "3"
      ) {
        setCameraView(
          "analysis"
        );
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
  // Camera state only controls what the learner is looking at.
  // It does not change the circuit or any electrical calculation.

  // --------------------------------------------------------
  // CENTRAL STORE VALUES
  // --------------------------------------------------------

  const voltageVrms =
    useLabStore(
      (state) =>
        state.controls
          .voltageVrms
    );

  const frequencyHz =
    useLabStore(
      (state) =>
        state.controls
          .frequencyHz
    );

  const resistanceOhm =
    useLabStore(
      (state) =>
        state.controls
          .resistanceOhm
    );

  const capacitanceUf =
    useLabStore(
      (state) =>
        state.controls
          .capacitanceUf
    );

  const generatorOn =
    useLabStore(
      (state) =>
        state.controls
          .generatorOn
    );

  const scopeOn =
    useLabStore(
      (state) =>
        state.controls
          .scopeOn
    );

  const ch1VoltsPerDiv =
    useLabStore(
      (state) =>
        state.controls
          .ch1VoltsPerDiv
    );

  const ch2MilliAmpsPerDiv =
    useLabStore(
      (state) =>
        state.controls
          .ch2MilliAmpsPerDiv
    );

  const timePerDivMs =
    useLabStore(
      (state) =>
        state.controls
          .timePerDivMs
    );

  const clampPoint =
    useLabStore(
      (state) =>
        state.clamp.point
    );

  const measurementLog =
    useLabStore(
      (state) =>
        state.log
    );

  const progress =
    useLabStore(
      (state) =>
        state.progress
    );

  const resistorConnected =
    useLabStore(
      selectResistorConnected
    );

  const circuitAssembled =
    useLabStore(
      selectCircuitAssembled
    );

  // --------------------------------------------------------
  // LIVE ELECTRICAL SNAPSHOT
  // --------------------------------------------------------

  // The live experiment always uses the central physics engine.
  const electricalSnapshot =
    useMemo(
      () =>
        getElectricalSnapshot({
          voltageVrms,
          frequencyHz,
          resistanceOhm,
          capacitanceUf,
        }),
      [
        voltageVrms,
        frequencyHz,
        resistanceOhm,
        capacitanceUf,
      ]
    );

  // Determine whether the controls currently match
  // the official reference setup.
  const isReferenceSetup =
    voltageVrms ===
    REFERENCE_SETUP.voltageVrms &&
    frequencyHz ===
    REFERENCE_SETUP.frequencyHz &&
    resistanceOhm ===
    REFERENCE_SETUP.resistanceOhm &&
    capacitanceUf ===
    REFERENCE_SETUP.capacitanceUf;

  // The virtual clamp simply selects one of the currents
  // already calculated by the physics engine.
  const measuredCurrentRmsA =
    getClampCurrentRms(
      clampPoint,
      electricalSnapshot,
      {
        generatorOn,
        circuitAssembled,
      }
    );

  // MY UNDERSTANDING:
  // The live values are always recalculated from the current controls.
  // The reference values remain fixed and act as the expected result
  // for the standard experiment.

  // --------------------------------------------------------
  // CLAMP DEFAULT
  // --------------------------------------------------------

  useEffect(() => {
    // When the complete circuit first exists,
    // put the clamp at the total-current point.
    if (
      circuitAssembled &&
      clampPoint === null
    ) {
      labStore.setClampPoint(
        "P_TOT"
      );
    }
  }, [
    circuitAssembled,
    clampPoint,
  ]);

  // --------------------------------------------------------
  // AUTOMATIC MEASUREMENT LOGGING
  // --------------------------------------------------------

  const measurementTimerRef =
    useRef(null);

  useEffect(() => {
    // Cancel any older pending measurement.
    if (
      measurementTimerRef.current !==
      null
    ) {
      clearTimeout(
        measurementTimerRef.current
      );

      measurementTimerRef.current =
        null;
    }

    // A valid measurement requires:
    // source ON + complete circuit + valid clamp point.
    if (
      !generatorOn ||
      !circuitAssembled ||
      clampPoint === null
    ) {
      return undefined;
    }

    const measurementKey = [
      clampPoint,
      frequencyHz,
      voltageVrms,
      resistanceOhm,
      capacitanceUf,
    ].join("|");

    // Wait until the learner keeps the same measurement
    // stable for half a second.
    measurementTimerRef.current =
      setTimeout(() => {
        const currentState =
          labStore.getState();

        const lastEntry =
          currentState.log[
          currentState
            .log
            .length - 1
          ];

        const lastKey =
          lastEntry
            ? [
              lastEntry.point,
              lastEntry.frequencyHz,
              lastEntry.voltageVrms,
              lastEntry.resistanceOhm,
              lastEntry.capacitanceUf,
            ].join("|")
            : null;

        // Prevent duplicate consecutive notebook rows.
        if (
          measurementKey ===
          lastKey
        ) {
          return;
        }

        const theoreticalCurrentRmsA =
          getClampCurrentRms(
            clampPoint,
            electricalSnapshot,
            {
              generatorOn: true,
              circuitAssembled:
                true,
            }
          );

        labStore.appendLog({
          point:
            clampPoint,
          voltageVrms,
          frequencyHz,
          resistanceOhm,
          capacitanceUf,
          measuredCurrentRmsA,
          theoreticalCurrentRmsA,
          timestamp:
            Date.now(),
        });

        measurementTimerRef.current =
          null;
      }, 500);

    return () => {
      if (
        measurementTimerRef.current !==
        null
      ) {
        clearTimeout(
          measurementTimerRef.current
        );

        measurementTimerRef.current =
          null;
      }
    };
  }, [
    generatorOn,
    circuitAssembled,
    clampPoint,
    voltageVrms,
    frequencyHz,
    resistanceOhm,
    capacitanceUf,
    measuredCurrentRmsA,
    electricalSnapshot,
  ]);

  // MY UNDERSTANDING:
  // We don't record a reading on every frame.
  // The measurement must remain stable briefly before entering the log.

  // --------------------------------------------------------
  // GUIDED PROGRESS
  // --------------------------------------------------------

  useEffect(() => {
    const currentProgress =
      labStore.getState()
        .progress;

    const completedSteps = [
      ...currentProgress
        .completedSteps,
    ];

    let changed = false;

    // Step 1: orientation/interface is active.
    if (
      !completedSteps[0]
    ) {
      completedSteps[0] =
        true;

      changed = true;
    }

    // Step 2: both R and C are connected.
    if (
      circuitAssembled &&
      !completedSteps[1]
    ) {
      completedSteps[1] =
        true;

      changed = true;
    }

    // Step 3: exact reference controls are loaded.
    if (
      isReferenceSetup &&
      !completedSteps[2]
    ) {
      completedSteps[2] =
        true;

      changed = true;
    }

    // Step 4:
    // both reference branch-current measurements must exist.
    const hasReferencePR =
      measurementLog.some(
        (entry) =>
          entry.point ===
          "P_R" &&
          entry.voltageVrms ===
          5 &&
          entry.frequencyHz ===
          1000 &&
          entry.resistanceOhm ===
          1000 &&
          entry.capacitanceUf ===
          0.1
      );

    const hasReferencePC =
      measurementLog.some(
        (entry) =>
          entry.point ===
          "P_C" &&
          entry.voltageVrms ===
          5 &&
          entry.frequencyHz ===
          1000 &&
          entry.resistanceOhm ===
          1000 &&
          entry.capacitanceUf ===
          0.1
      );

    if (
      isReferenceSetup &&
      hasReferencePR &&
      hasReferencePC &&
      !completedSteps[3]
    ) {
      completedSteps[3] =
        true;

      changed = true;
    }

    // Step 5:
    // total current measurement + Analysis view.
    const hasReferencePTot =
      measurementLog.some(
        (entry) =>
          entry.point ===
          "P_TOT" &&
          entry.voltageVrms ===
          5 &&
          entry.frequencyHz ===
          1000 &&
          entry.resistanceOhm ===
          1000 &&
          entry.capacitanceUf ===
          0.1
      );

    if (
      isReferenceSetup &&
      hasReferencePTot &&
      cameraView ===
      "analysis" &&
      !completedSteps[4]
    ) {
      completedSteps[4] =
        true;

      changed = true;
    }

    // Find the highest completed step.
    let highestCompleted =
      -1;

    completedSteps.forEach(
      (
        completed,
        index
      ) => {
        if (
          completed
        ) {
          highestCompleted =
            index;
        }
      }
    );

    // Progress is monotonic:
    // once a step is completed, it cannot go backwards.
    const nextStep =
      highestCompleted >= 7
        ? 8
        : highestCompleted +
        2;

    const safeStep =
      Math.min(
        8,
        Math.max(
          1,
          nextStep
        )
      );

    if (
      changed ||
      safeStep !==
      currentProgress.currentStep
    ) {
      labStore.setProgress({
        completedSteps,
        currentStep:
          safeStep,
      });
    }
  }, [
    circuitAssembled,
    isReferenceSetup,
    measurementLog,
    cameraView,
  ]);

  // MY UNDERSTANDING:
  // Step 4 requires the actual reference R and C measurements.
  // Step 5 requires the reference total current measurement and
  // opening Analysis view.

  // --------------------------------------------------------
  // COMPONENT DROP HANDLER
  // --------------------------------------------------------

  const handleComponentDrop =
    (result) => {
      const {
        component,
        column,
        sockets,
      } = result;

      if (
        component ===
        "resistor"
      ) {
        // R and C must occupy different A/B columns.
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
            pair.hot
              .position[0],
            DRAG_HEIGHT,
            0,
          ];

          setResistorPosition(
            snappedPosition
          );

          setResistorSnappedColumn(
            column
          );

          labStore.setWiring({
            resistor: [
              sockets.first,
              sockets.second,
            ],
          });
        } else {
          // Invalid drop returns the resistor to its tray.
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
        // R and C must occupy different A/B columns.
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
            pair.hot
              .position[0],
            DRAG_HEIGHT,
            0,
          ];

          setCapacitorPosition(
            snappedPosition
          );

          setCapacitorSnappedColumn(
            column
          );

          labStore.setWiring({
            capacitor: [
              sockets.first,
              sockets.second,
            ],
          });
        } else {
          // Invalid drop returns the capacitor to its tray.
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

          labStore.setWiring({
            capacitor: [
              null,
              null,
            ],
          });
        }
      }

      // MY UNDERSTANDING:
      // App translates a successful drop into actual circuit state.
      // The generic drag controller itself does not decide the circuit.
    };

  // --------------------------------------------------------
  // GENERIC DRAG CONTROLLER
  // --------------------------------------------------------

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

  // Start dragging resistor.
  const handleResistorPointerDown =
    (event) => {
      startDrag(
        event,
        "resistor",
        resistorPosition
      );
    };

  // Start dragging capacitor.
  const handleCapacitorPointerDown =
    (event) => {
      startDrag(
        event,
        "capacitor",
        capacitorPosition
      );
    };

  // --------------------------------------------------------
  // CLAMP
  // --------------------------------------------------------

  function handleClampPointChange(
    point
  ) {
    labStore.setClampPoint(
      point
    );

    // MY UNDERSTANDING:
    // The clamp only chooses which current to observe.
    // The physics engine calculates the current itself.
  }

  // --------------------------------------------------------
  // CONTROL HANDLERS
  // --------------------------------------------------------

  function setVoltage(
    value
  ) {
    labStore.setControls({
      voltageVrms:
        value,
    });
  }

  function setFrequency(
    value
  ) {
    labStore.setControls({
      frequencyHz:
        value,
    });
  }

  function setResistance(
    value
  ) {
    labStore.setControls({
      resistanceOhm:
        value,
    });
  }

  function setCapacitance(
    value
  ) {
    labStore.setControls({
      capacitanceUf:
        value,
    });
  }

  function toggleGenerator() {
    labStore.setControls({
      generatorOn:
        !generatorOn,
    });
  }

  function toggleScope() {
    labStore.setControls({
      scopeOn:
        !scopeOn,
    });
  }

  function setScopeControls(
    patch
  ) {
    labStore.setControls(
      patch
    );
  }

  // Load the exact standard reference setup.
  function loadReferenceValues() {
    labStore.setControls({
      ...REFERENCE_SETUP,
    });
  }

  // MY UNDERSTANDING:
  // Loading the reference simply writes the four official values
  // into the same controls used by the rest of the simulation.

  // --------------------------------------------------------
  // RESET
  // --------------------------------------------------------

  function resetLab() {
    setResistorPosition(
      TRAY_POSITION
    );

    setCapacitorPosition(
      CAPACITOR_TRAY_POSITION
    );

    setResistorSnappedColumn(
      null
    );

    setCapacitorSnappedColumn(
      null
    );

    setErrors(0);

    labStore.reset();

    setCameraView(
      "bench"
    );

    document.body.style.cursor =
      "default";
  }

  // --------------------------------------------------------
  // UI
  // --------------------------------------------------------

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background:
          "#070b12",
        color:
          "#e5e7eb",
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
          clampPoint={
            clampPoint
          }
          onResistorPointerDown={
            handleResistorPointerDown
          }
          onCapacitorPointerDown={
            handleCapacitorPointerDown
          }
          onClampPointChange={
            handleClampPointChange
          }
          onPointerMove={
            moveDrag
          }
          onPointerUp={
            endDrag
          }
        />
      </div>

      {/* ------------------------------------------------
                MAIN HUD
            ------------------------------------------------- */}

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
          Configure the AC
          source, then move
          the current clamp
          between measurement
          points.
        </div>

        {/* ------------------------------------------------
                    ELECTRICAL CONTROLS
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

        {/* Load the reference setup. */}
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

        {/* ------------------------------------------------
                    GENERATOR / SCOPE
                ------------------------------------------------- */}

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
            border: 0,
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
          {scopeOn
            ? " ON"
            : " OFF"}
        </button>

        {/* ------------------------------------------------
                    CLAMP STATUS
                ------------------------------------------------- */}

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
            Clamp point:
            {" "}
            <strong>
              {clampPoint ??
                "TRAY"}
            </strong>
          </div>

          <div
            style={{
              color:
                "#94a3b8",
            }}
          >
            Drag the clamp
            onto P_R, P_C,
            or P_TOT.
          </div>
        </div>

        {/* ------------------------------------------------
                    LIVE READINGS
                ------------------------------------------------- */}

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
              LIVE READINGS
            </strong>

            <span
              style={{
                fontSize:
                  11,
                color:
                  "#94a3b8",
              }}
            >
              Current setup
            </span>
          </div>

          <div>
            <strong>
              Xc:
            </strong>{" "}
            {Number.isFinite(
              electricalSnapshot.Xc
            )
              ? `${electricalSnapshot.Xc.toFixed(
                1
              )} Ω`
              : "∞"}
          </div>

          <div>
            <strong>
              IR:
            </strong>{" "}
            {(
              electricalSnapshot.IR *
              1000
            ).toFixed(
              2
            )}{" "}
            mA
          </div>

          <div>
            <strong>
              IC:
            </strong>{" "}
            {(
              electricalSnapshot.IC *
              1000
            ).toFixed(
              2
            )}{" "}
            mA
          </div>

          <div>
            <strong>
              IT:
            </strong>{" "}
            {(
              electricalSnapshot.IT *
              1000
            ).toFixed(
              2
            )}{" "}
            mA
          </div>

          <div>
            <strong>
              Phase:
            </strong>{" "}
            {electricalSnapshot.phiDeg.toFixed(
              1
            )}°
            {" "}
            lead
          </div>

          <div>
            <strong>
              Z:
            </strong>{" "}
            {Number.isFinite(
              electricalSnapshot.Z
            )
              ? `${electricalSnapshot.Z.toFixed(
                1
              )} Ω`
              : "∞"}
          </div>

          <div
            style={{
              marginTop:
                5,
            }}
          >
            <strong>
              Clamp reading:
            </strong>{" "}
            {(
              measuredCurrentRmsA *
              1000
            ).toFixed(
              2
            )}{" "}
            mA RMS
          </div>
        </div>

        {/* ------------------------------------------------
                    REFERENCE / THEORETICAL READINGS
                ------------------------------------------------- */}

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
              REFERENCE /
              THEORETICAL
            </strong>

            {isReferenceSetup && (
              <span
                style={{
                  color:
                    "#22c55e",
                  fontSize:
                    11,
                  fontWeight:
                    800,
                }}
              >
                ACTIVE
              </span>
            )}
          </div>

          <div
            style={{
              color:
                "#94a3b8",
              marginBottom:
                6,
            }}
          >
            5 Vrms · 1 kHz ·
            1 kΩ · 0.1 µF
          </div>

          <div>
            <strong>
              Xc:
            </strong>{" "}
            {REFERENCE_SNAPSHOT.Xc.toFixed(
              1
            )}{" "}
            Ω
          </div>

          <div>
            <strong>
              IR:
            </strong>{" "}
            {(
              REFERENCE_SNAPSHOT.IR *
              1000
            ).toFixed(
              2
            )}{" "}
            mA
          </div>

          <div>
            <strong>
              IC:
            </strong>{" "}
            {(
              REFERENCE_SNAPSHOT.IC *
              1000
            ).toFixed(
              2
            )}{" "}
            mA
          </div>

          <div>
            <strong>
              IT:
            </strong>{" "}
            {(
              REFERENCE_SNAPSHOT.IT *
              1000
            ).toFixed(
              2
            )}{" "}
            mA
          </div>

          <div>
            <strong>
              Phase:
            </strong>{" "}
            {REFERENCE_SNAPSHOT.phiDeg.toFixed(
              1
            )}°
            {" "}
            lead
          </div>

          <div>
            <strong>
              Z:
            </strong>{" "}
            {REFERENCE_SNAPSHOT.Z.toFixed(
              1
            )}{" "}
            Ω
          </div>
        </div>

        {/* ------------------------------------------------
                    CAMERA VIEWS
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
                    EXPERIMENT STATE
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
              Generator:
            </strong>{" "}
            {generatorOn
              ? "ON"
              : "OFF"}
          </div>

          <div>
            <strong>
              Clamp:
            </strong>{" "}
            {clampPoint ??
              "TRAY"}
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
              Errors:
            </strong>{" "}
            {errors}
          </div>

          <div>
            <strong>
              Frequency:
            </strong>{" "}
            {formatFrequency(
              frequencyHz
            )}
          </div>

          <div>
            <strong>
              Scope:
            </strong>{" "}
            {scopeOn
              ? "ON"
              : "OFF"}
          </div>
        </div>

        {/* ------------------------------------------------
                    GUIDED PROGRESS
                ------------------------------------------------- */}

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
              marginBottom:
                6,
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
              display:
                "grid",
              gap: 3,
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
                  {progress
                    .completedSteps[
                    index
                  ]
                    ? "✓"
                    : index +
                      1 ===
                      progress.currentStep
                      ? "→"
                      : "·"}{" "}
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

        {/* ------------------------------------------------
                    CLAMP EXPLANATION
                ------------------------------------------------- */}

        <div
          style={{
            marginTop:
              16,
            padding:
              10,
            borderRadius:
              10,
            background:
              "rgba(124, 58, 237, 0.10)",
            border:
              "1px solid rgba(139, 92, 246, 0.35)",
            fontSize:
              12,
            lineHeight:
              1.55,
            color:
              "#d8b4fe",
          }}
        >
          <strong>
            Current clamp:
          </strong>{" "}
          Move the orange
          clamp between the
          glowing measurement
          rings. P_R measures
          resistor current,
          P_C measures capacitor
          current, and P_TOT
          measures total current.
        </div>

        {/* Reset laboratory. */}
        <button
          onClick={
            resetLab
          }
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

      {/* Virtual oscilloscope. */}
      {scopeOn && (
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
      )}

      {/* Bottom hint. */}
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
        Move the current
        clamp between the
        glowing measurement
        points
      </div>
    </div>
  );
}