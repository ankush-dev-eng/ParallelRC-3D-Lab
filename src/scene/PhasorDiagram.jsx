import { useMemo } from "react";
import * as THREE from "three";

// The diagram uses a fixed visual reference instead of drawing raw
// milliamps directly. This keeps the vectors readable during the sweep.
const MAX_REFERENCE_CURRENT_MA = 80;
const MAX_ARROW_LENGTH = 4.0;

const HEAD_LENGTH = 0.28;
const SHAFT_RADIUS = 0.055;
const HEAD_RADIUS = 0.14;

// The physical circuit is closer to the analysis camera than the
// original phasor panel depth. Move the complete phasor assembly
// backward so its opaque background cannot hide the capacitor/resistor.
const ANALYSIS_DEPTH_OFFSET = -3.6;

// Convert a true current in amperes into a bounded visual length.
function currentToLength(currentA) {
    return Math.min(
        MAX_ARROW_LENGTH,
        Math.max(
            0,
            (currentA * 1000 /
                MAX_REFERENCE_CURRENT_MA) *
            MAX_ARROW_LENGTH
        )
    );
}

// Render one arrow from the origin in a supplied direction.
// This component only handles geometry and material placement.
function VectorArrow({
    dx,
    dy,
    dz = 0,
    length,
    type,
}) {
    const geometry = useMemo(() => {
        const direction =
            new THREE.Vector3(
                dx,
                dy,
                dz
            ).normalize();

        const shaftLength =
            Math.max(
                0.02,
                length - HEAD_LENGTH
            );

        const shaftPosition =
            direction
                .clone()
                .multiplyScalar(
                    shaftLength / 2
                );

        const headPosition =
            direction
                .clone()
                .multiplyScalar(
                    Math.max(
                        0,
                        length -
                        HEAD_LENGTH / 2
                    )
                );

        const quaternion =
            new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(
                    0,
                    1,
                    0
                ),
                direction
            );

        return {
            shaftLength,
            shaftPosition,
            headPosition,
            quaternion,
        };
    }, [
        dx,
        dy,
        dz,
        length,
    ]);

    const arrowColor =
        type === "IR"
            ? "#22c55e"
            : type === "IC"
                ? "#60a5fa"
                : "#c084fc";

    return (
        <group>
            <mesh
                position={
                    geometry.shaftPosition
                }
                quaternion={
                    geometry.quaternion
                }
            >
                <cylinderGeometry
                    args={[
                        SHAFT_RADIUS,
                        SHAFT_RADIUS,
                        geometry.shaftLength,
                        10,
                    ]}
                />

                <meshStandardMaterial
                    color={arrowColor}
                    roughness={0.35}
                    emissive={arrowColor}
                    emissiveIntensity={0.16}
                />
            </mesh>

            <mesh
                position={
                    geometry.headPosition
                }
                quaternion={
                    geometry.quaternion
                }
            >
                <coneGeometry
                    args={[
                        HEAD_RADIUS,
                        HEAD_LENGTH,
                        12,
                    ]}
                />

                <meshStandardMaterial
                    color={arrowColor}
                    roughness={0.35}
                    emissive={arrowColor}
                    emissiveIntensity={0.16}
                />
            </mesh>
        </group>
    );
}

export default function PhasorDiagram({
    snapshot,
    simulationActive,
    position = [3, 0.9, 1.6],
}) {
    // Do not show zero-current vectors as if they were a live measurement.
    if (
        !simulationActive ||
        !snapshot
    ) {
        return null;
    }

    const irLength =
        currentToLength(
            snapshot.IR
        );

    const icLength =
        currentToLength(
            snapshot.IC
        );

    const itLength =
        currentToLength(
            snapshot.IT
        );

    // IT is the resultant of IR and IC, so its direction is phi.
    const totalDx =
        Math.cos(
            snapshot.phiRad
        );

    const totalDy =
        Math.sin(
            snapshot.phiRad
        );

    // App still supplies the original logical analysis position.
    // Only the camera-depth placement is adjusted here so the phasor
    // assembly sits behind the physical circuit instead of occluding it.
    const renderPosition = [
        position[0],
        position[1],
        position[2] +
        ANALYSIS_DEPTH_OFFSET,
    ];

    return (
        <group
            position={renderPosition}
        >
            {/* Floating analysis board. */}
            <mesh
                position={[
                    0,
                    -0.12,
                    -0.12,
                ]}
            >
                <boxGeometry
                    args={[
                        6.0,
                        5.0,
                        0.16,
                    ]}
                />

                <meshStandardMaterial
                    color="#0f172a"
                    roughness={0.8}
                />
            </mesh>

            {/* Horizontal and vertical reference axes. */}
            <mesh
                position={[
                    0,
                    0,
                    0,
                ]}
            >
                <boxGeometry
                    args={[
                        5.4,
                        0.025,
                        0.025,
                    ]}
                />

                <meshStandardMaterial
                    color="#475569"
                />
            </mesh>

            <mesh
                position={[
                    0,
                    0,
                    0,
                ]}
            >
                <boxGeometry
                    args={[
                        0.025,
                        4.4,
                        0.025,
                    ]}
                />

                <meshStandardMaterial
                    color="#475569"
                />
            </mesh>

            {/* Origin marker. */}
            <mesh
                position={[
                    0,
                    0,
                    0.02,
                ]}
            >
                <sphereGeometry
                    args={[
                        0.11,
                        16,
                        16,
                    ]}
                />

                <meshStandardMaterial
                    color="#f8fafc"
                    emissive="#f8fafc"
                    emissiveIntensity={0.12}
                />
            </mesh>

            {/* IR is horizontal. */}
            <VectorArrow
                dx={1}
                dy={0}
                length={irLength}
                type="IR"
            />

            {/* IC leads voltage by +90°, so it is vertical. */}
            <VectorArrow
                dx={0}
                dy={1}
                length={icLength}
                type="IC"
            />

            {/* IT is the vector resultant at phi. */}
            <VectorArrow
                dx={totalDx}
                dy={totalDy}
                length={itLength}
                type="IT"
            />
        </group>
    );
}

// MY UNDERSTANDING:
// This component is only a visual renderer. It receives IR, IC, IT and phi
// from the shared electrical snapshot, uses a fixed 80 mA visual scale so
// vectors stay readable during the frequency sweep, and hides itself while
// the simulation is inactive.
//
// The important scene-layout detail is that the complete phasor assembly is
// moved backward along Z in Analysis view. The analysis panel must not sit
// in front of the real circuit because its opaque background would hide
// physical components such as the capacitor.
//
// The data-driven phi is never modified here.