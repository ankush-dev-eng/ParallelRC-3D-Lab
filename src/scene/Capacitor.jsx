import React from "react";

export default function Capacitor({
    position,
    dragging = false,
    capStress = 0,
    tripped = false,
    onPointerDown,
    onPointerMove,
    onPointerUp,
}) {
    // Clamp the incoming stress value so visual behavior stays predictable.
    const normalizedStress =
        Math.min(
            1,
            Math.max(
                0,
                Number.isFinite(capStress)
                    ? capStress
                    : 0
            )
        );

    const warningLevel =
        Math.max(
            0,
            Math.min(
                1,
                (
                    normalizedStress -
                    0.8
                ) /
                0.2
            )
        );

    // Normal = blue, elevated stress = amber, tripped = red.
    const bodyColor =
        tripped
            ? "#ef4444"
            : normalizedStress >= 0.8
                ? "#f59e0b"
                : dragging
                    ? "#60a5fa"
                    : "#2563eb";

    const emissiveColor =
        tripped
            ? "#7f1d1d"
            : "#b45309";

    const emissiveIntensity =
        tripped
            ? 1.1
            : warningLevel *
            0.9;

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
            {/* The main cylindrical body represents the capacitor package. */}
            <mesh castShadow>
                <cylinderGeometry
                    args={[
                        0.24,
                        0.24,
                        0.5,
                        24,
                    ]}
                />

                <meshStandardMaterial
                    color={bodyColor}
                    roughness={0.45}
                    metalness={0.15}
                    emissive={
                        normalizedStress >= 0.8 ||
                            tripped
                            ? emissiveColor
                            : "#000000"
                    }
                    emissiveIntensity={
                        emissiveIntensity
                    }
                />
            </mesh>

            {/* The two metallic leads connect the capacitor
                to the A/B socket pair. */}
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

            {/* A small stripe helps visually distinguish
                the capacitor from the resistor. */}
            <mesh
                position={[
                    0,
                    0.14,
                    0,
                ]}
            >
                <boxGeometry
                    args={[
                        0.38,
                        0.03,
                        0.08,
                    ]}
                />

                <meshBasicMaterial
                    color="#dbeafe"
                />
            </mesh>

            {/* YOUR UNDERSTANDING:
                This component is responsible only for the capacitor's
                3D appearance and pointer interactions.
                It does not calculate capacitance, current, phase,
                or any other electrical value.
                The parent/state system decides where the capacitor is
                placed, while the physics system handles its electrical behavior.

                The capStress prop is only a visual state supplied by the
                safety runtime. It changes the package from normal blue to
                amber during elevated stress and red after a safety trip.
            */}
        </group>
    );
}
