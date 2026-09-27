import React from "react";
import {
    BREADBOARD_SOCKETS,
    getColumnSocketPair,
} from "./breadboardSockets";

// ------------------------------------------------------------
// VISUAL TOKENS
// ------------------------------------------------------------

const COLORS = {
    body: "#D8D3C8",
    bodyEdge: "#B9B3A8",
    insert: "#C7C1B7",
    channel: "#424844",
    hole: "#27302C",

    positive: "#C84B43",
    negative: "#3D76B8",

    active: "#2F9C95",
    activeDark: "#1C5E5A",
    metal: "#AEB5B0",
};

// ------------------------------------------------------------
// SMALL VISUAL HELPERS
// ------------------------------------------------------------

// Render one real interaction socket. The position comes from the
// existing canonical socket table, so the interaction coordinates
// remain unchanged by this visual upgrade.
function BreadboardSocket({ socket, active }) {
    return (
        <group position={socket.position}>
            {/* Dark recessed contact hole. */}
            <mesh position={[0, 0.012, 0]}>
                <cylinderGeometry args={[0.082, 0.082, 0.025, 16]} />
                <meshStandardMaterial
                    color={active ? COLORS.activeDark : COLORS.hole}
                    roughness={0.72}
                    metalness={0.05}
                />
            </mesh>

            {/* Small teal marker only when this column is active. */}
            {active && (
                <mesh position={[0, 0.027, 0]}>
                    <torusGeometry args={[0.105, 0.018, 8, 20]} />
                    <meshStandardMaterial
                        color={COLORS.active}
                        emissive={COLORS.active}
                        emissiveIntensity={0.45}
                        roughness={0.4}
                    />
                </mesh>
            )}
        </group>
    );
}

// This creates a visually plausible 2.54 mm-style hole field without
// changing the actual electrical socket positions used by the lab.
function HoleField({ z }) {
    const xPositions = [
        -4.0,
        -3.2,
        -2.4,
        -1.6,
        -0.8,
        0,
        0.8,
        1.6,
        2.4,
        3.2,
        4.0,
    ];

    const zOffsets = [-0.15, 0.15];

    return (
        <group>
            {xPositions.flatMap((x) =>
                zOffsets.map((offset, index) => (
                    <mesh
                        key={`${x}-${z}-${index}`}
                        position={[x, 0.213, z + offset]}
                    >
                        <cylinderGeometry
                            args={[0.045, 0.045, 0.018, 12]}
                        />
                        <meshStandardMaterial
                            color={COLORS.hole}
                            roughness={0.78}
                        />
                    </mesh>
                ))
            )}
        </group>
    );
}

// A colored power rail is visual only. The actual electrical socket
// model remains the canonical A/B socket table used by the simulator.
function PowerRail({ z, color }) {
    return (
        <group position={[0, 0.217, z]}>
            <mesh>
                <boxGeometry args={[8.35, 0.018, 0.035]} />
                <meshStandardMaterial
                    color={color}
                    roughness={0.42}
                    metalness={0.12}
                />
            </mesh>

            <mesh position={[-4.1, 0, 0]}>
                <boxGeometry args={[0.05, 0.024, 0.09]} />
                <meshStandardMaterial
                    color={COLORS.metal}
                    metalness={0.45}
                    roughness={0.38}
                />
            </mesh>

            <mesh position={[4.1, 0, 0]}>
                <boxGeometry args={[0.05, 0.024, 0.09]} />
                <meshStandardMaterial
                    color={COLORS.metal}
                    metalness={0.45}
                    roughness={0.38}
                />
            </mesh>
        </group>
    );
}

// Add a subtle raised lip around the plastic board.
// It gives the asset a manufactured enclosure instead of a plain box.
function EdgeLip() {
    return (
        <group>
            <mesh position={[0, 0.198, 1.43]}>
                <boxGeometry args={[8.8, 0.045, 0.08]} />
                <meshStandardMaterial
                    color={COLORS.bodyEdge}
                    roughness={0.58}
                />
            </mesh>

            <mesh position={[0, 0.198, -1.43]}>
                <boxGeometry args={[8.8, 0.045, 0.08]} />
                <meshStandardMaterial
                    color={COLORS.bodyEdge}
                    roughness={0.58}
                />
            </mesh>

            <mesh position={[-4.43, 0.198, 0]}>
                <boxGeometry args={[0.08, 0.045, 2.8]} />
                <meshStandardMaterial
                    color={COLORS.bodyEdge}
                    roughness={0.58}
                />
            </mesh>

            <mesh position={[4.43, 0.198, 0]}>
                <boxGeometry args={[0.08, 0.045, 2.8]} />
                <meshStandardMaterial
                    color={COLORS.bodyEdge}
                    roughness={0.58}
                />
            </mesh>
        </group>
    );
}

// A recessed center channel gives the two working areas a real
// physical separation while keeping the original A/B coordinates.
function CenterChannel() {
    return (
        <mesh position={[0, 0.205, 0]}>
            <boxGeometry args={[8.45, 0.035, 0.18]} />
            <meshStandardMaterial
                color={COLORS.channel}
                roughness={0.78}
                metalness={0.08}
            />
        </mesh>
    );
}

function SocketPairGuide({ column, active }) {
    const pair = getColumnSocketPair(column);

    if (!pair) {
        return null;
    }

    const x = pair.hot.position[0];

    return (
        <mesh position={[x, 0.221, 0]}>
            <boxGeometry args={[0.055, 0.012, 1.85]} />
            <meshStandardMaterial
                color={active ? COLORS.active : "#8D948E"}
                emissive={active ? COLORS.activeDark : "#000000"}
                emissiveIntensity={active ? 0.35 : 0}
                transparent
                opacity={active ? 0.7 : 0.08}
                roughness={0.55}
            />
        </mesh>
    );
}

// ------------------------------------------------------------
// BREADBOARD
// ------------------------------------------------------------

export default function Breadboard({
    candidateColumn = null,
    snappedColumn = null,
}) {
    const activeColumn =
        candidateColumn !== null
            ? candidateColumn
            : snappedColumn;

    // MY UNDERSTANDING:
    // The electrical socket positions stay in breadboardSockets.js
    // because that file is the single source of truth for snapping.
    // This component can make the board look more realistic without
    // changing where the simulator thinks A1-A6 and B1-B6 are.

    return (
        <group>
            {/* Main molded plastic body. */}
            <mesh
                position={[0, 0.09, 0]}
                receiveShadow
                castShadow
            >
                <boxGeometry args={[9, 0.18, 3]} />
                <meshStandardMaterial
                    color={COLORS.body}
                    roughness={0.48}
                    metalness={0.02}
                />
            </mesh>

            {/* Slightly recessed top insert. */}
            <mesh position={[0, 0.195, 0]}>
                <boxGeometry args={[8.7, 0.025, 2.78]} />
                <meshStandardMaterial
                    color={COLORS.insert}
                    roughness={0.62}
                />
            </mesh>

            <EdgeLip />

            {/* Realistic electrical color coding. */}
            <PowerRail z={1.17} color={COLORS.positive} />
            <PowerRail z={-1.17} color={COLORS.negative} />

            {/* Contact-hole fields. */}
            <HoleField z={0.7} />
            <HoleField z={-0.7} />

            <CenterChannel />

            {/* Existing canonical interaction sockets. */}
            {BREADBOARD_SOCKETS.map((socket) => {
                const active = socket.column === activeColumn;

                return (
                    <BreadboardSocket
                        key={socket.id}
                        socket={socket}
                        active={active}
                    />
                );
            })}

            {/* Subtle visual guides for the six valid component columns. */}
            {Array.from({ length: 6 }, (_, index) => {
                const column = index + 1;

                return (
                    <SocketPairGuide
                        key={column}
                        column={column}
                        active={column === activeColumn}
                    />
                );
            })}
        </group>
    );
}
