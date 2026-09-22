import React from "react";

export default function Capacitor({
    position,
    dragging = false,
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
            {/* The main cylindrical body represents the capacitor package. */}
            <mesh castShadow>
                <cylinderGeometry args={[0.24, 0.24, 0.5, 24]} />
                <meshStandardMaterial
                    color={dragging ? "#60a5fa" : "#2563eb"}
                    roughness={0.45}
                    metalness={0.15}
                />
            </mesh>

            {/* The two metallic leads connect the capacitor to the A/B socket pair. */}
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

            {/* A small stripe helps visually distinguish the component from the resistor. */}
            <mesh position={[0, 0.14, 0]}>
                <boxGeometry args={[0.38, 0.03, 0.08]} />
                <meshBasicMaterial color="#dbeafe" />
            </mesh>

            {/* YOUR UNDERSTANDING:
          Explain in your own words why this component only handles
          the capacitor's 3D appearance and pointer events. */}
        </group>
    );
}