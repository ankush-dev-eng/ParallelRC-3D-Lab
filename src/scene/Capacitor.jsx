import React from "react";

const COLORS = {
    navy: "#275C9E",
    navyDark: "#173B66",
    blueActive: "#3E83D3",
    ivory: "#E8E2D7",
    metal: "#AEB5B0",
    copper: "#C66A3A",
    warning: "#C58A3A",
    danger: "#A64A43",
};

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
    const normalizedStress = Math.min(
        1,
        Math.max(
            0,
            Number.isFinite(capStress) ? capStress : 0
        )
    );

    const warningLevel = Math.max(
        0,
        Math.min(1, (normalizedStress - 0.8) / 0.2)
    );

    const bodyColor = tripped
        ? COLORS.danger
        : normalizedStress >= 0.8
            ? COLORS.warning
            : dragging
                ? COLORS.blueActive
                : COLORS.navy;

    const emissiveColor = tripped
        ? "#5B211D"
        : normalizedStress >= 0.8
            ? "#6E461F"
            : "#000000";

    const emissiveIntensity = tripped
        ? 0.75
        : warningLevel * 0.45;

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
            {/* Main radial capacitor package, aligned across the A/B branch. */}
            <mesh
                rotation={[Math.PI / 2, 0, 0]}
                castShadow
            >
                <cylinderGeometry args={[0.24, 0.24, 0.50, 32]} />
                <meshStandardMaterial
                    color={bodyColor}
                    roughness={0.34}
                    metalness={0.18}
                    emissive={emissiveColor}
                    emissiveIntensity={emissiveIntensity}
                />
            </mesh>

            {/* Slightly raised end caps. */}
            <mesh
                position={[0, 0, 0.255]}
                rotation={[Math.PI / 2, 0, 0]}
            >
                <cylinderGeometry args={[0.215, 0.215, 0.045, 32]} />
                <meshStandardMaterial
                    color={COLORS.ivory}
                    roughness={0.42}
                    metalness={0.05}
                />
            </mesh>

            <mesh
                position={[0, 0, -0.255]}
                rotation={[Math.PI / 2, 0, 0]}
            >
                <cylinderGeometry args={[0.215, 0.215, 0.045, 32]} />
                <meshStandardMaterial
                    color={COLORS.navyDark}
                    roughness={0.40}
                    metalness={0.06}
                />
            </mesh>

            {/* Metallic leads. */}
            <mesh position={[0, 0, 0.52]} castShadow>
                <cylinderGeometry args={[0.045, 0.045, 0.42, 16]} />
                <meshStandardMaterial
                    color={COLORS.metal}
                    metalness={0.84}
                    roughness={0.24}
                />
            </mesh>

            <mesh position={[0, 0, -0.52]} castShadow>
                <cylinderGeometry args={[0.045, 0.045, 0.42, 16]} />
                <meshStandardMaterial
                    color={COLORS.metal}
                    metalness={0.84}
                    roughness={0.24}
                />
            </mesh>

            {/* Positive identification stripe. */}
            <mesh
                position={[0, 0.18, 0]}
                rotation={[Math.PI / 2, 0, 0]}
            >
                <cylinderGeometry args={[0.245, 0.245, 0.035, 32]} />
                <meshStandardMaterial
                    color={COLORS.ivory}
                    roughness={0.50}
                />
            </mesh>

            {/* Thin copper accent ring gives the component a premium physical detail. */}
            <mesh
                position={[0, 0.22, 0]}
                rotation={[Math.PI / 2, 0, 0]}
            >
                <torusGeometry args={[0.242, 0.014, 8, 32]} />
                <meshStandardMaterial
                    color={COLORS.copper}
                    metalness={0.50}
                    roughness={0.30}
                />
            </mesh>

            {/* YOUR UNDERSTANDING:
                This component only controls the capacitor's 3D appearance
                and forwards pointer events. The electrical model remains in
                the physics/state layer. capStress is only a visual signal
                supplied by the safety runtime.
            */}
        </group>
    );
}
