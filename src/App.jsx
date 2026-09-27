import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Canvas,
  useFrame,
} from "@react-three/fiber";

import {
  labStore,
  useLabStore,
} from "./state/labStore";

import {
  isFiveXChallengeMet,
  selectCircuitAssembled,
  selectResistorConnected,
  selectSimulationActive,
} from "./state/selectors";

import Breadboard from "./scene/Breadboard";
import Capacitor from "./scene/Capacitor";
import CameraRig from "./scene/CameraRig";
import CurrentClamp from "./scene/CurrentClamp";

import MainDashboard from "./components/MainDashboard";
import PhasorDiagram from "./scene/PhasorDiagram";

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

import {
  CAPACITOR_CURRENT_LIMIT_A,
  CAPACITOR_RATED_VOLTAGE_V,
  STRESS_RECOVERY_OVERLOAD,
  STRESS_RECOVERY_THRESHOLD,
  STRESS_TRIP_THRESHOLD,
  STRESS_WARNING_THRESHOLD,
  getSafetyOverload,
  nextCapStress,
} from "./physics/safety";

import {
  buildLabReport,
  formatLabReportText,
} from "./physics/report";

// ------------------------------------------------------------
// REFERENCE EXPERIMENT
// ------------------------------------------------------------

const REFERENCE_SETUP = {
  voltageVrms: 5,
  frequencyHz: 1000,
  resistanceOhm: 1000,
  capacitanceUf: 0.1,
};

const REFERENCE_SNAPSHOT =
  getElectricalSnapshot(
    REFERENCE_SETUP
  );

// ------------------------------------------------------------
// SHARED INTERACTION CONSTANTS
// ------------------------------------------------------------

const SNAP_RADIUS = 1.0;

const DRAG_HEIGHT = 0.42;

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

// This component only renders the resistor.
// Dragging and circuit state are handled by App.
function Resistor({
  position,
  dragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}) {
  // MY UNDERSTANDING:
  // The resistor group owns only appearance and pointer forwarding.
  // App still owns the resistor's logical position and snap state.
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
      {/* Warm ceramic resistor body, aligned across the A/B branch. */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.18, 0.18, 0.58, 32]} />
        <meshStandardMaterial
          color={dragging ? "#D9C2A0" : "#C9B287"}
          roughness={0.48}
          metalness={0.02}
        />
      </mesh>

      {/* Metallic leads. */}
      <mesh position={[0, 0, 0.52]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.42, 16]} />
        <meshStandardMaterial
          color="#AEB5B0"
          metalness={0.82}
          roughness={0.26}
        />
      </mesh>

      <mesh position={[0, 0, -0.52]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.42, 16]} />
        <meshStandardMaterial
          color="#AEB5B0"
          metalness={0.82}
          roughness={0.26}
        />
      </mesh>

      {/* Four resistance bands give the component a recognizable
          physical-electronics appearance instead of a plain orange pill. */}
      <mesh position={[0, 0, -0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.186, 0.186, 0.045, 32]} />
        <meshStandardMaterial color="#6B4730" roughness={0.38} />
      </mesh>

      <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.188, 0.188, 0.045, 32]} />
        <meshStandardMaterial color="#A34E3A" roughness={0.36} />
      </mesh>

      <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.188, 0.188, 0.045, 32]} />
        <meshStandardMaterial color="#C58A3A" roughness={0.34} metalness={0.04} />
      </mesh>

      <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.189, 0.189, 0.045, 32]} />
        <meshStandardMaterial color="#4A3830" roughness={0.38} />
      </mesh>

      {/* Small end collars improve the manufactured feel. */}
      <mesh position={[0, 0, 0.27]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.035, 32]} />
        <meshStandardMaterial color="#A69B8B" roughness={0.48} />
      </mesh>

      <mesh position={[0, 0, -0.27]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.035, 32]} />
        <meshStandardMaterial color="#A69B8B" roughness={0.48} />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------
// VISUAL LAB ENVIRONMENT
// ------------------------------------------------------------

// Small physical knob used by the decorative bench instruments.
// These objects are visual only; they do not participate in circuit logic.
function InstrumentKnob({ position, rotation = [0, 0, 0], color = "#737A75" }) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <cylinderGeometry args={[0.11, 0.11, 0.07, 20]} />
      <meshStandardMaterial
        color={color}
        metalness={0.55}
        roughness={0.34}
      />
    </mesh>
  );
}

// Compact decorative function generator placed in the rear-right of the bench.
// It provides physical context without changing any simulation state.
// Decorative laboratory environment.
// These meshes are visual-only; they never participate in circuit state.
function BoardWorkMat() {
  return (
    <mesh position={[0, 0.018, 0]} receiveShadow>
      <boxGeometry args={[9.65, 0.035, 3.55]} />
      <meshStandardMaterial
        color="#353B37"
        roughness={0.82}
        metalness={0.03}
      />
    </mesh>
  );
}

function LabWorkbench() {
  return (
    <group>
      {/* Large matte instrument-bench surface. */}
      <mesh position={[0, -0.12, 0]} receiveShadow>
        <boxGeometry args={[15.5, 0.24, 9.2]} />
        <meshStandardMaterial
          color="#252C28"
          roughness={0.78}
          metalness={0.04}
        />
      </mesh>

      {/* Rear wall gives the scene a believable room boundary. */}
      <mesh position={[0, 2.65, -4.15]} receiveShadow>
        <boxGeometry args={[15.5, 5.5, 0.20]} />
        <meshStandardMaterial
          color="#101512"
          roughness={0.94}
        />
      </mesh>

      {/* Rear shelf / cable-management rail. */}
      <mesh position={[0, 0.18, -3.72]} receiveShadow>
        <boxGeometry args={[14.6, 0.16, 0.52]} />
        <meshStandardMaterial
          color="#18201C"
          roughness={0.84}
        />
      </mesh>

      <mesh position={[0, 0.27, -3.43]}>
        <boxGeometry args={[13.9, 0.028, 0.045]} />
        <meshStandardMaterial
          color="#59645D"
          metalness={0.35}
          roughness={0.42}
        />
      </mesh>

      <BoardWorkMat />

      {/* Component tray remains functional through the existing drag positions. */}
      <mesh position={[5.55, 0.052, -2.38]} receiveShadow>
        <boxGeometry args={[4.0, 0.10, 1.95]} />
        <meshStandardMaterial
          color="#303733"
          roughness={0.66}
          metalness={0.04}
        />
      </mesh>

      <mesh position={[5.55, 0.107, -2.38]}>
        <boxGeometry args={[3.62, 0.018, 1.56]} />
        <meshStandardMaterial
          color="#1B211E"
          roughness={0.86}
        />
      </mesh>

      {/* Small tray rail makes the staging area read as intentional. */}
      <mesh position={[5.55, 0.12, -3.14]}>
        <boxGeometry args={[3.55, 0.035, 0.045]} />
        <meshStandardMaterial
          color="#687068"
          metalness={0.18}
          roughness={0.52}
        />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------
// SIMULATION RUNTIME
// ------------------------------------------------------------

// The runtime owns time-dependent safety behavior.
// Electrical formulas remain pure.
function SimulationRuntime({
  electricalSnapshot,
}) {
  const accumulatorRef =
    useRef(0);

  useFrame((_, delta) => {
    accumulatorRef.current +=
      delta;

    if (
      accumulatorRef.current <
      0.05
    ) {
      return;
    }

    const dt =
      accumulatorRef.current;

    accumulatorRef.current = 0;

    const currentState =
      labStore.getState();

    const generatorOn =
      currentState.controls
        .generatorOn;

    const circuitAssembled =
      selectCircuitAssembled(
        currentState
      );

    const overload =
      generatorOn &&
        circuitAssembled
        ? getSafetyOverload({
          voltageVrms:
            currentState
              .controls
              .voltageVrms,

          currentA:
            electricalSnapshot.IC,
        })
        : 0;

    const currentStress =
      currentState.safety
        .capStress;

    const nextStress =
      nextCapStress(
        currentStress,
        overload,
        dt
      );

    const shouldTrip =
      generatorOn &&
      circuitAssembled &&
      !currentState.safety
        .tripped &&
      nextStress >=
      STRESS_TRIP_THRESHOLD;

    if (shouldTrip) {
      labStore.setSafety({
        capStress:
          STRESS_TRIP_THRESHOLD,
        tripped:
          true,
      });

      labStore.setControls({
        generatorOn:
          false,
      });

      if (
        !currentState.progress
          .safetyTripObserved
      ) {
        labStore.setProgress({
          safetyTripObserved:
            true,
        });
      }

      return;
    }

    if (
      Math.abs(
        nextStress -
        currentStress
      ) >=
      0.005
    ) {
      labStore.setSafety({
        capStress:
          nextStress,
      });
    }
  });

  return null;
}

// MY UNDERSTANDING:
// SimulationRuntime is the only place that advances time-dependent
// safety state. The physics engine still calculates electrical values
// from the current controls, while this runtime integrates capacitor
// stress and performs the automatic safety trip.

// ------------------------------------------------------------
// LAB SCENE
// ------------------------------------------------------------

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
  electricalSnapshot,
  simulationActive,
  capStress,
  safetyTripped,
}) {
  const candidateColumn = dragState.candidateColumn;

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
        position: [5.8, 6.2, 8.8],
        fov: 50,
        near: 0.1,
        far: 100,
      }}
      shadows
      dpr={[1, 1.5]}
    >
      <CameraRig view={cameraView} />

      <SimulationRuntime
        electricalSnapshot={electricalSnapshot}
      />

      {/* Deep green-black graphite keeps the scene premium without pure black. */}
      <color attach="background" args={["#0A0E0D"]} />

      {/* Broad ambient exposure keeps the manufactured materials readable. */}
      <ambientLight intensity={1.15} />

      {/* Cool overhead key. */}
      <directionalLight
        position={[-4.5, 10, 5.5]}
        intensity={3.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00015}
      />

      {/* Warm side fill. */}
      <directionalLight
        position={[6.0, 5.0, 1.0]}
        intensity={1.15}
        color="#C7B7A2"
      />

      {/* Cool rear separation. */}
      <pointLight
        position={[-4.5, 4.0, -1.5]}
        intensity={18}
        distance={13}
        decay={2}
        color="#7F9B98"
      />

      <pointLight
        position={[4.0, 3.0, 3.5]}
        intensity={12}
        distance={10}
        decay={2}
        color="#E6DDD0"
      />

      <LabWorkbench />

      {/* Existing interactive laboratory objects. */}
      <Breadboard
        candidateColumn={candidateColumn}
        snappedColumn={displayedSnappedColumn}
      />

      <Resistor
        position={
          dragState.component === "resistor" && dragState.position
            ? dragState.position
            : resistorPosition
        }
        dragging={dragState.component === "resistor"}
        onPointerDown={onResistorPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />

      <Capacitor
        position={
          dragState.component === "capacitor" && dragState.position
            ? dragState.position
            : capacitorPosition
        }
        dragging={dragState.component === "capacitor"}
        capStress={capStress}
        tripped={safetyTripped}
        onPointerDown={onCapacitorPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />

      <CurrentClamp
        point={clampPoint}
        resistorColumn={resistorSnappedColumn}
        capacitorColumn={capacitorSnappedColumn}
        onPointChange={onClampPointChange}
      />

      {cameraView === "analysis" && (
        <PhasorDiagram
          snapshot={electricalSnapshot}
          simulationActive={simulationActive}
          position={[
            2.15,
            2.55,
            -1.75,
          ]}
        />
      )}
    </Canvas>
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
  ] = useState(
    null
  );

  const [
    capacitorSnappedColumn,
    setCapacitorSnappedColumn,
  ] = useState(
    null
  );

  const [
    errors,
    setErrors,
  ] = useState(0);

  const [
    reportVisible,
    setReportVisible,
  ] = useState(false);

  const [
    generatedReport,
    setGeneratedReport,
  ] = useState(null);

  const [
    reflection,
    setReflection,
  ] = useState({
    observation: "",
    frequencyExplanation: "",
    safetyExplanation: "",
  });

  // --------------------------------------------------------
  // CAMERA
  // --------------------------------------------------------

  const [
    cameraView,
    setCameraView,
  ] = useState("bench");

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
  // Camera state controls only the learner's view of the 3D scene.
  // It does not modify the circuit or electrical calculations.

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

  const simulationActive =
    useLabStore(
      selectSimulationActive
    );

  const capStress =
    useLabStore(
      (state) =>
        state.safety
          .capStress
    );

  const safetyTripped =
    useLabStore(
      (state) =>
        state.safety
          .tripped
    );

  // --------------------------------------------------------
  // LIVE ELECTRICAL VALUES
  // --------------------------------------------------------

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

  const isReferenceSetup =
    voltageVrms ===
    REFERENCE_SETUP
      .voltageVrms &&
    frequencyHz ===
    REFERENCE_SETUP
      .frequencyHz &&
    resistanceOhm ===
    REFERENCE_SETUP
      .resistanceOhm &&
    capacitanceUf ===
    REFERENCE_SETUP
      .capacitanceUf;

  const fiveXChallengeMet =
    isFiveXChallengeMet(
      {
        voltageVrms,
        frequencyHz,
        resistanceOhm,
        capacitanceUf,
        simulationActive,
      },
      electricalSnapshot
    );

  const currentRatio =
    electricalSnapshot.IR >
      0
      ? electricalSnapshot.IC /
      electricalSnapshot.IR
      : 0;

  const measuredCurrentRmsA =
    getClampCurrentRms(
      clampPoint,
      electricalSnapshot,
      {
        generatorOn,
        circuitAssembled,
      }
    );

  // --------------------------------------------------------
  // SAFETY VALUES
  // --------------------------------------------------------

  const safetyOverload =
    circuitAssembled
      ? getSafetyOverload({
        voltageVrms,
        currentA:
          electricalSnapshot.IC,
      })
      : 0;

  const safetyRecoveryReady =
    safetyTripped &&
    capStress <=
    STRESS_RECOVERY_THRESHOLD &&
    safetyOverload <=
    STRESS_RECOVERY_OVERLOAD;

  const safetyWarning =
    capStress >=
    STRESS_WARNING_THRESHOLD;

  const reportReady =
    measurementLog.length >
    0 &&
    progress.currentStep >=
    8;

  // MY UNDERSTANDING:
  // The safety values are derived from the same electrical snapshot
  // used everywhere else. The stored capStress is the time-dependent
  // part, while warning/trip/recovery readiness are derived states.

  // --------------------------------------------------------
  // CLAMP DEFAULT
  // --------------------------------------------------------

  useEffect(() => {
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

    measurementTimerRef.current =
      setTimeout(
        () => {
          const currentState =
            labStore.getState();

          const lastEntry =
            currentState.log[
            currentState
              .log.length - 1
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
                generatorOn:
                  true,
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
        },
        500
      );

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
  // The notebook is updated only after the learner keeps one measurement
  // stable for 500 ms. That prevents every render frame from becoming a
  // separate measurement row.

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

    let changed =
      false;

    // Step 1.
    if (
      !completedSteps[0]
    ) {
      completedSteps[0] =
        true;

      changed =
        true;
    }

    // Step 2.
    if (
      circuitAssembled &&
      !completedSteps[1]
    ) {
      completedSteps[1] =
        true;

      changed =
        true;
    }

    // Step 3.
    if (
      isReferenceSetup &&
      !completedSteps[2]
    ) {
      completedSteps[2] =
        true;

      changed =
        true;
    }

    // Step 4.
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

      changed =
        true;
    }

    // Step 5.
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

      changed =
        true;
    }

    // Step 6.
    if (
      completedSteps[4] &&
      fiveXChallengeMet &&
      !completedSteps[5]
    ) {
      completedSteps[5] =
        true;

      changed =
        true;
    }

    // Step 7.
    if (
      completedSteps[5] &&
      progress.safetyTripObserved &&
      progress.safetyRecoveryObserved &&
      !completedSteps[6]
    ) {
      completedSteps[6] =
        true;

      changed =
        true;
    }

    // Step 8.
    if (
      measurementLog.length >
      0 &&
      progress.reportGenerated &&
      !completedSteps[7]
    ) {
      completedSteps[7] =
        true;

      changed =
        true;
    }

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

    const nextStep =
      highestCompleted >=
        7
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

        ...(completedSteps[5]
          ? {
            fiveXChallengeCompleted:
              true,
          }
          : {}),
      });
    }
  }, [
    circuitAssembled,
    isReferenceSetup,
    measurementLog,
    cameraView,
    fiveXChallengeMet,
    progress,
  ]);

  // MY UNDERSTANDING:
  // The progress system only moves forward. Each step has a concrete
  // condition, and completed steps stay completed even when controls
  // later change.

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
        const columnOccupied =
          column !==
          null &&
          column ===
          capacitorSnappedColumn;

        if (
          column !==
          null &&
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

          labStore.setWiring({
            resistor: [
              sockets.first,
              sockets.second,
            ],
          });
        } else {
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
        const columnOccupied =
          column !==
          null &&
          column ===
          resistorSnappedColumn;

        if (
          column !==
          null &&
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

          labStore.setWiring({
            capacitor: [
              sockets.first,
              sockets.second,
            ],
          });
        } else {
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
    };

  // MY UNDERSTANDING:
  // App translates the generic drag result into actual circuit wiring.
  // The drag controller decides how an object moves, while App decides
  // whether the dropped component becomes part of the experiment.

  // --------------------------------------------------------
  // DRAG CONTROLLER
  // --------------------------------------------------------

  const {
    dragState,
    startDrag,
    moveDrag,
    endDrag,
  } =
    useDragController({
      dragHeight:
        DRAG_HEIGHT,
      snapRadius:
        SNAP_RADIUS,
      onDrop:
        handleComponentDrop,
    });

  const handleResistorPointerDown =
    (event) => {
      startDrag(
        event,
        "resistor",
        resistorPosition
      );
    };

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
    // The clamp only selects which existing current is observed.
    // It does not modify the circuit physics.
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
    if (
      generatorOn
    ) {
      labStore.setControls({
        generatorOn:
          false,
      });

      return;
    }

    if (
      safetyTripped
    ) {
      if (
        !safetyRecoveryReady
      ) {
        return;
      }

      labStore.setSafety({
        capStress:
          0,
        tripped:
          false,
      });

      labStore.setProgress({
        safetyRecoveryObserved:
          true,
      });
    }

    labStore.setControls({
      generatorOn:
        true,
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

  function loadReferenceValues() {
    labStore.setControls({
      ...REFERENCE_SETUP,
    });
  }

  // --------------------------------------------------------
  // REPORT ACTIONS
  // --------------------------------------------------------

  function generateLabReport() {
    if (
      !reportReady
    ) {
      return;
    }

    const report =
      buildLabReport({
        generatedAt:
          new Date().toLocaleString(),

        // Official reference configuration.
        referenceSetup:
          REFERENCE_SETUP,

        // Expected electrical values for the reference configuration.
        referenceSnapshot:
          REFERENCE_SNAPSHOT,

        // Actual controls at the moment the report is generated.
        setup: {
          voltageVrms,
          frequencyHz,
          resistanceOhm,
          capacitanceUf,
        },

        // Same electrical snapshot already used by the simulation.
        snapshot:
          electricalSnapshot,

        measurementLog,

        safety: {
          capStress,
          tripped:
            safetyTripped,
        },

        progress,

        reflection,
      });

    setGeneratedReport(
      report
    );

    setReportVisible(
      true
    );

    labStore.setProgress({
      reportGenerated:
        true,
    });
  }

  // MY UNDERSTANDING:
  // The report captures both the official reference setup and
  // the final observed setup. Both are generated from the same
  // experiment state and physics snapshot used by the live lab.

  async function copyLabReport() {
    if (
      !generatedReport
    ) {
      return;
    }

    const reportText =
      formatLabReportText(
        generatedReport
      );

    try {
      await navigator.clipboard.writeText(
        reportText
      );
    } catch {
      // Clipboard may be unavailable in some browser contexts.
      // The report is still visible and can be copied manually.
    }
  }

  function updateReflection(
    field,
    value
  ) {
    setReflection(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    );
  }

  // MY UNDERSTANDING:
  // The report is built from the same measurements and electrical snapshot
  // already used by the simulation. The reflection text is learner input,
  // while report formatting stays separate from the physics engine.

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

    setErrors(
      0
    );

    labStore.reset();

    setCameraView(
      "bench"
    );

    document.body.style.cursor =
      "default";

    setReportVisible(
      false
    );

    setGeneratedReport(
      null
    );

    setReflection({
      observation: "",
      frequencyExplanation: "",
      safetyExplanation: "",
    });
  }

  // --------------------------------------------------------
  // UI
  // --------------------------------------------------------

  return (
    <div
      style={{
        position:
          "relative",

        width:
          "100vw",

        height:
          "100vh",

        overflow:
          "hidden",

        background:
          "#070b12",

        color:
          "#e5e7eb",

        fontFamily:
          "Inter, system-ui, sans-serif",
      }}
    >
      {/* 3D SCENE */}
      <div
        style={{
          position:
            "absolute",
          inset:
            0,
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

          electricalSnapshot={
            electricalSnapshot
          }

          simulationActive={
            simulationActive
          }

          capStress={
            capStress
          }

          safetyTripped={
            safetyTripped
          }
        />
      </div>

      {/* Main HUD / instrument overlay. */}
      <MainDashboard
        cameraView={cameraView}
        setCameraView={setCameraView}
        voltageVrms={voltageVrms}
        frequencyHz={frequencyHz}
        resistanceOhm={resistanceOhm}
        capacitanceUf={capacitanceUf}
        setVoltage={setVoltage}
        setFrequency={setFrequency}
        setResistance={setResistance}
        setCapacitance={setCapacitance}
        loadReferenceValues={loadReferenceValues}
        generatorOn={generatorOn}
        toggleGenerator={toggleGenerator}
        scopeOn={scopeOn}
        toggleScope={toggleScope}
        safetyTripped={safetyTripped}
        safetyRecoveryReady={safetyRecoveryReady}
        safetyWarning={safetyWarning}
        capStress={capStress}
        safetyOverload={safetyOverload}
        capacitorRatedVoltageV={CAPACITOR_RATED_VOLTAGE_V}
        capacitorCurrentLimitA={CAPACITOR_CURRENT_LIMIT_A}
        clampPoint={clampPoint}
        measuredCurrentRmsA={measuredCurrentRmsA}
        electricalSnapshot={electricalSnapshot}
        referenceSetup={REFERENCE_SETUP}
        referenceSnapshot={REFERENCE_SNAPSHOT}
        progress={progress}
        measurementLog={measurementLog}
        reportReady={reportReady}
        reflection={reflection}
        updateReflection={updateReflection}
        generateLabReport={generateLabReport}
        reportVisible={reportVisible}
        generatedReport={generatedReport}
        copyLabReport={copyLabReport}
        setReportVisible={setReportVisible}
        ch1VoltsPerDiv={ch1VoltsPerDiv}
        ch2MilliAmpsPerDiv={ch2MilliAmpsPerDiv}
        timePerDivMs={timePerDivMs}
        setScopeControls={setScopeControls}
        fiveXChallengeMet={fiveXChallengeMet}
        currentRatio={currentRatio}
        resetLab={resetLab}
      />
    </div>
  );
}