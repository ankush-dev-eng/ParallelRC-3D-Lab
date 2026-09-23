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

import Oscilloscope from "./components/Oscilloscope";
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
  return (
    <group
      position={
        position
      }

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
  const candidateColumn =
    dragState.candidateColumn;

  const displayedSnappedColumn =
    dragState.component ===
      "capacitor"
      ? capacitorSnappedColumn
      : resistorSnappedColumn;

  return (
    <Canvas
      style={{
        width:
          "100%",
        height:
          "100%",
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
      <CameraRig
        view={
          cameraView
        }
      />

      <SimulationRuntime
        electricalSnapshot={
          electricalSnapshot
        }
      />

      <color
        attach="background"
        args={[
          "#070b12",
        ]}
      />

      <ambientLight
        intensity={0.8}
      />

      <directionalLight
        position={[
          4,
          8,
          5,
        ]}
        intensity={2.4}
        castShadow
      />

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

      <Breadboard
        candidateColumn={
          candidateColumn
        }
        snappedColumn={
          displayedSnappedColumn
        }
      />

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

        capStress={
          capStress
        }

        tripped={
          safetyTripped
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

      <CurrentClamp
        point={
          clampPoint
        }

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

      {cameraView ===
        "analysis" && (
          <PhasorDiagram
            snapshot={
              electricalSnapshot
            }

            simulationActive={
              simulationActive
            }

            position={[
              3.0,
              0.9,
              1.6,
            ]}
          />
        )}

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
    </div>
  );
}