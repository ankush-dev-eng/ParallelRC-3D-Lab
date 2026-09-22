import React from "react";
import {
    BREADBOARD_SOCKETS,
    getColumnSocketPair,
} from "./breadboardSockets";

// Visual representation of one electrical socket.
function BreadboardSocket({ socket, active }) {
    return (
        <mesh
            position={socket.position}
            rotation={[Math.PI / 2, 0, 0]}
        >
            <cylinderGeometry args={[0.12, 0.12, 0.06, 20]} />

            <meshStandardMaterial
                color={active ? "#22c55e" : "#334155"}
                emissive={active ? "#16a34a" : "#000000"}
                emissiveIntensity={active ? 0.8 : 0}
            />
        </mesh>
    );
}

// A subtle guide behind a pair of sockets.
// This helps the user visually understand which A/B pair belongs together.
function SocketPairGuide({ column, active }) {
    const pair = getColumnSocketPair(column);

    if (!pair) {
        return null;
    }

    const x = pair.hot.position[0];

    return (
        <mesh
            position={[x, 0.12, 0]}
        >
            <boxGeometry args={[0.55, 0.025, 1.9]} />

            <meshStandardMaterial
                color={active ? "#22c55e" : "#64748b"}
                transparent
                opacity={active ? 0.28 : 0.06}
                emissive={active ? "#16a34a" : "#000000"}
                emissiveIntensity={active ? 0.7 : 0}
            />
        </mesh>
    );
}

export default function Breadboard({
    candidateColumn = null,
    snappedColumn = null,
}) {
    const activeColumn =
        candidateColumn !== null
            ? candidateColumn + 1
            : snappedColumn !== null
                ? snappedColumn + 1
                : null;

    return (
        <group>
            {/* Main breadboard body. */}
            <mesh
                position={[0, 0.09, 0]}
                receiveShadow
            >
                <boxGeometry args={[9, 0.18, 3]} />

                <meshStandardMaterial
                    color="#273240"
                    roughness={0.55}
                />
            </mesh>

            {/* Separate visual strips make the two electrical rows easier to read. */}
            <mesh position={[0, 0.195, 0.7]}>
                <boxGeometry args={[9, 0.025, 0.48]} />

                <meshStandardMaterial
                    color="#1f2937"
                    roughness={0.7}
                />
            </mesh>

            <mesh position={[0, 0.195, -0.7]}>
                <boxGeometry args={[9, 0.025, 0.48]} />

                <meshStandardMaterial
                    color="#1f2937"
                    roughness={0.7}
                />
            </mesh>

            {/* Render every socket from the canonical socket table. */}
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

            {/* One guide for each usable component column. */}
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

            {/* Centre divider helps visually separate the A and B rows. */}
            <mesh position={[0, 0.21, 0]}>
                <boxGeometry args={[8.7, 0.025, 0.08]} />

                <meshStandardMaterial
                    color="#111827"
                    roughness={0.8}
                />
            </mesh>
        </group>
    );
}

// YOUR UNDERSTANDING:
// Explain in your own words why this component gets its socket positions
// from breadboardSockets.js instead of defining its own coordinates here.