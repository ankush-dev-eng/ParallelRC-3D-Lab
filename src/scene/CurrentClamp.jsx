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

// Rich lab-instrument palette.
// Copper = physical clamp hardware.
// Teal = live measurement / instrument feedback.
// Steel = passive metal.
// Graphite = handle / body.
const COLORS = {
    copper: "#B96843",
    copperDark: "#6D3E2F",
    copperHighlight: "#D28A62",

    graphite: "#18201D",
    graphiteDark: "#0E1412",

    steel: "#AEB7B2",
    steelDark: "#65706B",

    teal: "#2F9C95",
    tealBright: "#57C5BC",
    tealDark: "#174F4B",

    targetIdle: "#78857F",
    targetAvailable: "#3D8B83",
};

// Convert a measurement point into a world-space location.
export function getMeasurementPointPosition(
    point,
    resistorColumn,
    capacitorColumn
) {
    if (point === MEASUREMENT_POINTS.P_R) {
        if (resistorColumn === null) {
            return null;
        }

        const pair = getColumnSocketPair(resistorColumn);

        if (!pair) {
            return null;
        }

        return [
            pair.hot.position[0],
            DRAG_HEIGHT,
            1.35,
        ];
    }

    if (point === MEASUREMENT_POINTS.P_C) {
        if (capacitorColumn === null) {
            return null;
        }

        const pair = getColumnSocketPair(capacitorColumn);

        if (!pair) {
            return null;
        }

        return [
            pair.hot.position[0],
            DRAG_HEIGHT,
            -1.35,
        ];
    }

    if (point === MEASUREMENT_POINTS.P_TOT) {
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

    return null;
}

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

function findNearestMeasurementPoint(
    position,
    resistorColumn,
    capacitorColumn
) {
    const candidates = [];

    if (
        isMeasurementPointAvailable(
            MEASUREMENT_POINTS.P_R,
            resistorColumn,
            capacitorColumn
        )
    ) {
        candidates.push({
            id: MEASUREMENT_POINTS.P_R,
            position: getMeasurementPointPosition(
                MEASUREMENT_POINTS.P_R,
                resistorColumn,
                capacitorColumn
            ),
        });
    }

    if (
        isMeasurementPointAvailable(
            MEASUREMENT_POINTS.P_C,
            resistorColumn,
            capacitorColumn
        )
    ) {
        candidates.push({
            id: MEASUREMENT_POINTS.P_C,
            position: getMeasurementPointPosition(
                MEASUREMENT_POINTS.P_C,
                resistorColumn,
                capacitorColumn
            ),
        });
    }

    if (
        isMeasurementPointAvailable(
            MEASUREMENT_POINTS.P_TOT,
            resistorColumn,
            capacitorColumn
        )
    ) {
        candidates.push({
            id: MEASUREMENT_POINTS.P_TOT,
            position: getMeasurementPointPosition(
                MEASUREMENT_POINTS.P_TOT,
                resistorColumn,
                capacitorColumn
            ),
        });
    }

    let nearest = null;
    let nearestDistance = Infinity;

    candidates.forEach((candidate) => {
        const dx =
            position[0] -
            candidate.position[0];

        const dz =
            position[2] -
            candidate.position[2];

        const distance = Math.sqrt(
            dx * dx + dz * dz
        );

        if (distance < nearestDistance) {
            nearest = candidate;
            nearestDistance = distance;
        }
    });

    if (
        nearest &&
        nearestDistance <= SNAP_RADIUS
    ) {
        return nearest.id;
    }

    return null;
}

// Render the current clamp instrument.
export default function CurrentClamp({
    point = null,
    resistorColumn = null,
    capacitorColumn = null,
    onPointChange,
}) {
    const [dragging, setDragging] = useState(false);
    const [dragPosition, setDragPosition] = useState(null);

    const dragPositionRef = useRef(null);

    const dragPlane = useMemo(
        () =>
            new THREE.Plane(
                new THREE.Vector3(0, 1, 0),
                -DRAG_HEIGHT
            ),
        []
    );

    const pointerPosition = useMemo(
        () => new THREE.Vector3(),
        []
    );

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
        dragging && dragPosition
            ? dragPosition
            : currentTargetPosition;

    function handlePointerDown(event) {
        event.stopPropagation();

        event.target.setPointerCapture?.(
            event.pointerId
        );

        const startingPosition = [
            renderPosition[0],
            DRAG_HEIGHT,
            renderPosition[2],
        ];

        dragPositionRef.current =
            startingPosition;

        setDragPosition(startingPosition);
        setDragging(true);
    }

    function handlePointerMove(event) {
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

        dragPositionRef.current =
            nextPosition;

        setDragPosition(nextPosition);
    }

    function handlePointerUp(event) {
        if (!dragging) {
            return;
        }

        event.stopPropagation();

        event.target.releasePointerCapture?.(
            event.pointerId
        );

        let finalPosition =
            dragPositionRef.current ??
            renderPosition;

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

        onPointChange(
            snappedPoint ?? null
        );

        setDragging(false);
        setDragPosition(null);

        dragPositionRef.current = null;
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

            {measurementIds.map((measurementId) => {
                const position =
                    getMeasurementPointPosition(
                        measurementId,
                        resistorColumn,
                        capacitorColumn
                    );

                if (!position) {
                    return null;
                }

                const active =
                    point === measurementId;

                return (
                    <group
                        key={measurementId}
                        position={[
                            position[0],
                            0.225,
                            position[2],
                        ]}
                    >
                        {/* Broad low-opacity placement guide. */}
                        <mesh
                            rotation={[
                                -Math.PI / 2,
                                0,
                                0,
                            ]}
                        >
                            <ringGeometry
                                args={[
                                    active
                                        ? 0.31
                                        : 0.24,
                                    active
                                        ? 0.37
                                        : 0.29,
                                    32,
                                ]}
                            />

                            <meshBasicMaterial
                                color={
                                    active
                                        ? COLORS.tealBright
                                        : COLORS.targetIdle
                                }
                                transparent
                                opacity={
                                    active
                                        ? 0.18
                                        : 0.10
                                }
                                depthWrite={false}
                            />
                        </mesh>

                        {/* Main precision target ring. */}
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
                                        ? 0.31
                                        : 0.26,
                                    0.035,
                                    12,
                                    32,
                                ]}
                            />

                            <meshStandardMaterial
                                color={
                                    active
                                        ? COLORS.tealBright
                                        : COLORS.targetAvailable
                                }
                                emissive={
                                    active
                                        ? COLORS.tealDark
                                        : "#000000"
                                }
                                emissiveIntensity={
                                    active
                                        ? 0.8
                                        : 0.05
                                }
                                metalness={0.25}
                                roughness={0.35}
                            />
                        </mesh>

                        {/* Small center marker gives the target a
                            calibrated-instrument feel. */}
                        <mesh position={[0, 0.012, 0]}>
                            <sphereGeometry
                                args={[
                                    active
                                        ? 0.055
                                        : 0.04,
                                    10,
                                    10,
                                ]}
                            />

                            <meshStandardMaterial
                                color={
                                    active
                                        ? COLORS.tealBright
                                        : COLORS.steel
                                }
                                emissive={
                                    active
                                        ? COLORS.tealDark
                                        : "#000000"
                                }
                                emissiveIntensity={
                                    active
                                        ? 0.55
                                        : 0
                                }
                                metalness={0.3}
                                roughness={0.4}
                            />
                        </mesh>
                    </group>
                );
            })}

            {/* ----------------------------------------------------
                CURRENT CLAMP
            ----------------------------------------------------- */}

            <group
                position={renderPosition}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerOver={(event) => {
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
                {/* Lower copper clamp jaw. */}
                <mesh rotation={[0, 0, Math.PI / 2]}>
                    <torusGeometry
                        args={[
                            0.30,
                            0.075,
                            14,
                            32,
                        ]}
                    />

                    <meshStandardMaterial
                        color={
                            dragging
                                ? COLORS.copperHighlight
                                : COLORS.copper
                        }
                        metalness={0.62}
                        roughness={0.28}
                        emissive={
                            dragging
                                ? COLORS.copperDark
                                : "#000000"
                        }
                        emissiveIntensity={
                            dragging
                                ? 0.35
                                : 0
                        }
                    />
                </mesh>

                {/* Dark insulating bridge inside the jaw. */}
                <mesh
                    position={[
                        0,
                        0,
                        0,
                    ]}
                >
                    <boxGeometry
                        args={[
                            0.16,
                            0.10,
                            0.16,
                        ]}
                    />

                    <meshStandardMaterial
                        color={COLORS.graphiteDark}
                        roughness={0.62}
                    />
                </mesh>

                {/* Vertical rubberized handle. */}
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
                        color={COLORS.graphite}
                        roughness={0.72}
                        metalness={0.05}
                    />
                </mesh>

                {/* Small steel shoulder between jaw and grip. */}
                <mesh
                    position={[
                        0,
                        0.16,
                        0,
                    ]}
                >
                    <boxGeometry
                        args={[
                            0.25,
                            0.10,
                            0.25,
                        ]}
                    />

                    <meshStandardMaterial
                        color={COLORS.steelDark}
                        metalness={0.55}
                        roughness={0.3}
                    />
                </mesh>

                {/* Teal instrument status tip. */}
                <mesh
                    position={[
                        0,
                        0.91,
                        0,
                    ]}
                >
                    <sphereGeometry
                        args={[
                            0.10,
                            16,
                            16,
                        ]}
                    />

                    <meshStandardMaterial
                        color={
                            dragging
                                ? COLORS.tealBright
                                : COLORS.teal
                        }
                        emissive={COLORS.tealDark}
                        emissiveIntensity={
                            dragging
                                ? 0.9
                                : 0.45
                        }
                        metalness={0.12}
                        roughness={0.28}
                    />
                </mesh>

                {/* Small copper pivot detail. */}
                <mesh
                    position={[
                        0,
                        0.22,
                        0.14,
                    ]}
                >
                    <cylinderGeometry
                        args={[
                            0.045,
                            0.045,
                            0.04,
                            20,
                        ]}
                    />

                    <meshStandardMaterial
                        color={COLORS.copperHighlight}
                        metalness={0.7}
                        roughness={0.25}
                    />
                </mesh>
            </group>
        </>
    );
}

// MY UNDERSTANDING:
// The clamp is a virtual measurement instrument, not part of the
// electrical circuit itself. It only selects which current is observed.
//
// P_R = resistor-branch current.
// P_C = capacitor-branch current.
// P_TOT = total current.
//
// The three measurement targets appear only when their corresponding
// circuit branch exists. This prevents invalid measurement states.
//
// Teal is reserved for live measurement feedback, while copper is
// reserved for the physical clamp hardware. This keeps the visual
// language consistent with the lab's new colour system.
