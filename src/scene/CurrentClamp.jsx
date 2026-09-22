import {
    useMemo,
    useRef,
    useState,
} from "react";

import * as THREE from "three";

import {
    getColumnSocketPair,
} from "./breadboardSockets";

// The three measurement locations used by the virtual current clamp.
export const MEASUREMENT_POINTS = {
    P_R: "P_R",
    P_C: "P_C",
    P_TOT: "P_TOT",
};

// Initial position of the clamp in the instrument tray.
export const CLAMP_TRAY_POSITION = [
    4.6,
    0.72,
    2.25,
];

const DRAG_HEIGHT = 0.72;
const SNAP_RADIUS = 1.35;

// Convert a measurement point into a world-space location.
//
// R and C follow the actual snapped component columns.
// The total-current point is placed only when both components
// are connected.
export function getMeasurementPointPosition(
    point,
    resistorColumn,
    capacitorColumn
) {
    if (
        point ===
        MEASUREMENT_POINTS.P_R
    ) {
        // P_R is only a valid measurement location when
        // the resistor has actually been placed on the board.
        if (
            resistorColumn === null
        ) {
            return null;
        }

        const pair =
            getColumnSocketPair(
                resistorColumn
            );

        if (!pair) {
            return null;
        }

        return [
            pair.hot.position[0],
            DRAG_HEIGHT,
            1.35,
        ];
    }

    if (
        point ===
        MEASUREMENT_POINTS.P_C
    ) {
        // P_C is only a valid measurement location when
        // the capacitor has actually been placed on the board.
        if (
            capacitorColumn === null
        ) {
            return null;
        }

        const pair =
            getColumnSocketPair(
                capacitorColumn
            );

        if (!pair) {
            return null;
        }

        return [
            pair.hot.position[0],
            DRAG_HEIGHT,
            -1.35,
        ];
    }

    if (
        point ===
        MEASUREMENT_POINTS.P_TOT
    ) {
        // Total current is only measurable after BOTH
        // parallel branches have been assembled.
        if (
            resistorColumn === null ||
            capacitorColumn === null
        ) {
            return null;
        }

        return [
            0,
            DRAG_HEIGHT,
            1.95,
        ];
    }

    // Unknown measurement points are treated as unavailable.
    return null;
}

// Decide whether a particular measurement point is currently
// available in the assembled laboratory.
function isMeasurementPointAvailable(
    point,
    resistorColumn,
    capacitorColumn
) {
    return (
        getMeasurementPointPosition(
            point,
            resistorColumn,
            capacitorColumn
        ) !== null
    );
}

// Find the nearest currently available measurement point.
//
// IMPORTANT:
// We only create candidates for measurement locations whose
// corresponding physical component has actually been placed.
function findNearestMeasurementPoint(
    position,
    resistorColumn,
    capacitorColumn
) {
    const candidates = [];

    // Add resistor measurement point only when R exists.
    if (
        isMeasurementPointAvailable(
            MEASUREMENT_POINTS.P_R,
            resistorColumn,
            capacitorColumn
        )
    ) {
        candidates.push({
            id:
                MEASUREMENT_POINTS.P_R,
            position:
                getMeasurementPointPosition(
                    MEASUREMENT_POINTS.P_R,
                    resistorColumn,
                    capacitorColumn
                ),
        });
    }

    // Add capacitor measurement point only when C exists.
    if (
        isMeasurementPointAvailable(
            MEASUREMENT_POINTS.P_C,
            resistorColumn,
            capacitorColumn
        )
    ) {
        candidates.push({
            id:
                MEASUREMENT_POINTS.P_C,
            position:
                getMeasurementPointPosition(
                    MEASUREMENT_POINTS.P_C,
                    resistorColumn,
                    capacitorColumn
                ),
        });
    }

    // Add total-current measurement point only when
    // both branches exist.
    if (
        isMeasurementPointAvailable(
            MEASUREMENT_POINTS.P_TOT,
            resistorColumn,
            capacitorColumn
        )
    ) {
        candidates.push({
            id:
                MEASUREMENT_POINTS.P_TOT,
            position:
                getMeasurementPointPosition(
                    MEASUREMENT_POINTS.P_TOT,
                    resistorColumn,
                    capacitorColumn
                ),
        });
    }

    let nearest = null;
    let nearestDistance =
        Infinity;

    candidates.forEach(
        (candidate) => {
            const dx =
                position[0] -
                candidate.position[0];

            const dz =
                position[2] -
                candidate.position[2];

            const distance =
                Math.sqrt(
                    dx * dx +
                    dz * dz
                );

            if (
                distance <
                nearestDistance
            ) {
                nearest =
                    candidate;

                nearestDistance =
                    distance;
            }
        }
    );

    if (
        nearest &&
        nearestDistance <=
        SNAP_RADIUS
    ) {
        return nearest.id;
    }

    return null;
}

// Render the virtual AC current clamp probe.
export default function CurrentClamp({
    point = null,
    resistorColumn = null,
    capacitorColumn = null,
    onPointChange,
}) {
    const [
        dragging,
        setDragging,
    ] = useState(false);

    const [
        dragPosition,
        setDragPosition,
    ] = useState(null);

    // Keep the latest drag position outside React state.
    //
    // This is important because pointerup can happen before React
    // has rendered the final setDragPosition() update.
    const dragPositionRef =
        useRef(null);

    // Reusable plane for pointer dragging.
    const dragPlane = useMemo(
        () =>
            new THREE.Plane(
                new THREE.Vector3(
                    0,
                    1,
                    0
                ),
                -DRAG_HEIGHT
            ),
        []
    );

    // Reusable vector prevents creating objects during pointer movement.
    const pointerPosition =
        useMemo(
            () =>
                new THREE.Vector3(),
            []
        );

    // Determine where the clamp belongs when it is not being dragged.
    //
    // If the stored measurement point is no longer valid because
    // a component was removed, fall back to the tray.
    const selectedTargetPosition =
        point
            ? getMeasurementPointPosition(
                point,
                resistorColumn,
                capacitorColumn
            )
            : null;

    const currentTargetPosition =
        selectedTargetPosition ??
        CLAMP_TRAY_POSITION;

    const renderPosition =
        dragging &&
            dragPosition
            ? dragPosition
            : currentTargetPosition;

    function handlePointerDown(
        event
    ) {
        event.stopPropagation();

        event.target.setPointerCapture?.(
            event.pointerId
        );

        const startingPosition = [
            renderPosition[0],
            DRAG_HEIGHT,
            renderPosition[2],
        ];

        // Store the starting point in both places.
        dragPositionRef.current =
            startingPosition;

        setDragPosition(
            startingPosition
        );

        setDragging(true);
    }

    function handlePointerMove(
        event
    ) {
        if (!dragging) {
            return;
        }

        event.stopPropagation();

        const hit =
            event.ray.intersectPlane(
                dragPlane,
                pointerPosition
            );

        if (!hit) {
            return;
        }

        const nextPosition = [
            hit.x,
            DRAG_HEIGHT,
            hit.z,
        ];

        // Update the ref immediately.
        // This becomes the authoritative position for pointerup.
        dragPositionRef.current =
            nextPosition;

        // State is still updated so the 3D object visually moves.
        setDragPosition(
            nextPosition
        );
    }

    function handlePointerUp(
        event
    ) {
        if (!dragging) {
            return;
        }

        event.stopPropagation();

        event.target.releasePointerCapture?.(
            event.pointerId
        );

        // IMPORTANT:
        // Use the latest ref value instead of React state.
        // React state can still contain the previous pointer position
        // during the same event cycle.
        let finalPosition =
            dragPositionRef.current ??
            renderPosition;

        // Perform one final ray → plane calculation using the actual
        // pointerup event. This handles the case where the last
        // pointermove event was skipped or happened immediately before release.
        const finalHit =
            event.ray.intersectPlane(
                dragPlane,
                pointerPosition
            );

        if (finalHit) {
            finalPosition = [
                finalHit.x,
                DRAG_HEIGHT,
                finalHit.z,
            ];
        }

        const snappedPoint =
            findNearestMeasurementPoint(
                finalPosition,
                resistorColumn,
                capacitorColumn
            );

        if (snappedPoint) {
            // Successful measurement-point snap.
            onPointChange(
                snappedPoint
            );
        } else {
            // Dropping away from every currently valid measurement
            // location returns the clamp to its tray.
            onPointChange(null);
        }

        setDragging(false);
        setDragPosition(null);

        // Clear the temporary drag position after the drop is complete.
        dragPositionRef.current =
            null;
    }

    const measurementIds = [
        MEASUREMENT_POINTS.P_R,
        MEASUREMENT_POINTS.P_C,
        MEASUREMENT_POINTS.P_TOT,
    ];

    return (
        <>
            {/* ----------------------------------------------------
                MEASUREMENT TARGETS
            ----------------------------------------------------- */}

            {measurementIds.map(
                (measurementId) => {
                    const position =
                        getMeasurementPointPosition(
                            measurementId,
                            resistorColumn,
                            capacitorColumn
                        );

                    // IMPORTANT:
                    // Do not render a measurement ring when its
                    // physical component does not exist.
                    //
                    // This fixes the original bug where P_C could
                    // still be selected while the capacitor was
                    // sitting in the tray.
                    if (!position) {
                        return null;
                    }

                    const active =
                        point ===
                        measurementId;

                    return (
                        <group
                            key={
                                measurementId
                            }
                            position={[
                                position[0],
                                0.22,
                                position[2],
                            ]}
                        >
                            {/* Ring makes the measurement location
                                visible in the 3D scene. */}
                            <mesh
                                rotation={[
                                    -Math.PI / 2,
                                    0,
                                    0,
                                ]}
                            >
                                <torusGeometry
                                    args={[
                                        active
                                            ? 0.36
                                            : 0.28,
                                        0.045,
                                        10,
                                        24,
                                    ]}
                                />

                                <meshStandardMaterial
                                    color={
                                        active
                                            ? "#22c55e"
                                            : "#8b5cf6"
                                    }
                                    emissive={
                                        active
                                            ? "#166534"
                                            : "#312e81"
                                    }
                                    emissiveIntensity={
                                        active
                                            ? 0.9
                                            : 0.35
                                    }
                                    transparent
                                    opacity={
                                        dragging
                                            ? 0.95
                                            : 0.65
                                    }
                                />
                            </mesh>
                        </group>
                    );
                }
            )}

            {/* ----------------------------------------------------
                CURRENT CLAMP
            ----------------------------------------------------- */}

            <group
                position={
                    renderPosition
                }
                onPointerDown={
                    handlePointerDown
                }
                onPointerMove={
                    handlePointerMove
                }
                onPointerUp={
                    handlePointerUp
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
                {/* Clamp jaw / loop. */}
                <mesh>
                    <torusGeometry
                        args={[
                            0.34,
                            0.09,
                            12,
                            24,
                        ]}
                    />

                    <meshStandardMaterial
                        color={
                            dragging
                                ? "#facc15"
                                : "#fb923c"
                        }
                        metalness={0.35}
                        roughness={0.42}
                        emissive={
                            dragging
                                ? "#854d0e"
                                : "#431407"
                        }
                        emissiveIntensity={
                            dragging
                                ? 0.8
                                : 0.25
                        }
                    />
                </mesh>

                {/* Probe handle. */}
                <mesh
                    position={[
                        0,
                        0.46,
                        0,
                    ]}
                    castShadow
                >
                    <boxGeometry
                        args={[
                            0.18,
                            0.82,
                            0.18,
                        ]}
                    />

                    <meshStandardMaterial
                        color="#334155"
                        metalness={0.65}
                        roughness={0.3}
                    />
                </mesh>

                {/* Small probe indicator. */}
                <mesh
                    position={[
                        0,
                        0.91,
                        0,
                    ]}
                >
                    <sphereGeometry
                        args={[
                            0.11,
                            12,
                            12,
                        ]}
                    />

                    <meshStandardMaterial
                        color="#22c55e"
                        emissive="#14532d"
                        emissiveIntensity={0.7}
                    />
                </mesh>

                {/* The probe is kept separate from the circuit physics.
                    It represents a virtual non-invasive current sensor. */}
            </group>
        </>
    );
}

// MY UNDERSTANDING:
// The clamp does not change the ideal RC circuit because it is only
// a virtual sensor selecting where current is observed.
//
// P_R represents the resistor branch current,
// P_C represents the capacitor branch current,
// and P_TOT represents the total current.
//
// A measurement point now exists only when the corresponding physical
// circuit branch exists. Therefore P_C cannot be selected while the
// capacitor is still sitting in the tray.
//
// P_TOT also waits until both R and C are connected because total
// parallel-branch current only makes sense after the two branches exist.
//
// The drag position uses a ref because the pointer can move and release
// faster than React can render every state update.