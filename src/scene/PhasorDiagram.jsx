import { useMemo } from "react";
import * as THREE from "three";

const MAX_REFERENCE_CURRENT_MA = 80;
const MAX_ARROW_LENGTH = 3.15;
const HEAD_LENGTH = 0.24;
const SHAFT_RADIUS = 0.045;
const HEAD_RADIUS = 0.12;

const COLORS = {
    board: "#121916",
    boardRaised: "#1A211E",
    grid: "#34413B",
    gridStrong: "#56645C",
    frame: "#8A6551",
    copper: "#B96C49",
    copperBright: "#D18A65",
    teal: "#43BDB3",
    tealBright: "#69D9D0",
    ivory: "#E5E0D7",
    muted: "#7B867F",
};

function currentToLength(currentA) {
    return Math.min(
        MAX_ARROW_LENGTH,
        Math.max(0, (currentA * 1000 / MAX_REFERENCE_CURRENT_MA) * MAX_ARROW_LENGTH)
    );
}

function VectorArrow({ dx, dy, dz = 0, length, type }) {
    const geometry = useMemo(() => {
        const direction = new THREE.Vector3(dx, dy, dz).normalize();
        const shaftLength = Math.max(0.02, length - HEAD_LENGTH);
        const shaftPosition = direction.clone().multiplyScalar(shaftLength / 2);
        const headPosition = direction.clone().multiplyScalar(Math.max(0, length - HEAD_LENGTH / 2));
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction
        );
        return { shaftLength, shaftPosition, headPosition, quaternion };
    }, [dx, dy, dz, length]);

    const color =
        type === "IR" ? COLORS.copperBright :
            type === "IC" ? COLORS.tealBright :
                COLORS.ivory;

    return (
        <group>
            <mesh position={geometry.shaftPosition} quaternion={geometry.quaternion}>
                <cylinderGeometry args={[SHAFT_RADIUS, SHAFT_RADIUS, geometry.shaftLength, 12]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.09} roughness={0.32} metalness={0.12} />
            </mesh>
            <mesh position={geometry.headPosition} quaternion={geometry.quaternion}>
                <coneGeometry args={[HEAD_RADIUS, HEAD_LENGTH, 14]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.09} roughness={0.32} metalness={0.12} />
            </mesh>
        </group>
    );
}

function GridLine({ position, size }) {
    return (
        <mesh position={position}>
            <boxGeometry args={size} />
            <meshStandardMaterial color={COLORS.grid} roughness={0.82} />
        </mesh>
    );
}

export default function PhasorDiagram({ snapshot, simulationActive, position = [2.35, 1.45, 1.45] }) {
    if (!simulationActive || !snapshot) {
        return null;
    }

    const irLength = currentToLength(snapshot.IR);
    const icLength = currentToLength(snapshot.IC);
    const itLength = currentToLength(snapshot.IT);

    const totalDx = Math.cos(snapshot.phiRad);
    const totalDy = Math.sin(snapshot.phiRad);

    const phaseArc = Math.max(0.001, Math.min(Math.PI / 2, Math.abs(snapshot.phiRad)));

    return (
        <group position={position}>
            {/* Raised measurement console. */}
            <mesh position={[0, -0.10, -0.13]}>
                <boxGeometry args={[5.25, 4.05, 0.18]} />
                <meshStandardMaterial color={COLORS.board} roughness={0.72} metalness={0.08} />
            </mesh>

            {/* Copper frame. */}
            <mesh position={[0, -0.085, -0.23]}>
                <boxGeometry args={[5.40, 4.20, 0.07]} />
                <meshStandardMaterial color={COLORS.frame} roughness={0.35} metalness={0.38} />
            </mesh>

            <mesh position={[0, -0.02, -0.28]}>
                <boxGeometry args={[5.05, 3.82, 0.07]} />
                <meshStandardMaterial color={COLORS.boardRaised} roughness={0.78} />
            </mesh>

            {/* Reference grid. */}
            {[-2, -1, 1, 2].map((value) => (
                <GridLine key={`h-${value}`} position={[0, value * 0.72, -0.22]} size={[4.82, 0.014, 0.014]} />
            ))}
            {[-2, -1, 1, 2].map((value) => (
                <GridLine key={`v-${value}`} position={[value * 0.72, 0, -0.22]} size={[0.014, 3.58, 0.014]} />
            ))}

            {/* Main axes. */}
            <GridLine position={[0, 0, -0.20]} size={[4.85, 0.028, 0.028]} />
            <GridLine position={[0, 0, -0.20]} size={[0.028, 3.62, 0.028]} />

            {/* Phase angle arc from IR to IT. */}
            <mesh position={[0, 0, -0.15]} rotation={[0, 0, 0]}>
                <torusGeometry args={[0.72, 0.026, 10, 32, phaseArc]} />
                <meshStandardMaterial color={COLORS.copper} emissive={COLORS.copper} emissiveIntensity={0.14} roughness={0.34} />
            </mesh>

            {/* Origin. */}
            <mesh position={[0, 0, -0.12]}>
                <sphereGeometry args={[0.09, 16, 16]} />
                <meshStandardMaterial color={COLORS.ivory} emissive={COLORS.ivory} emissiveIntensity={0.12} roughness={0.4} />
            </mesh>

            <VectorArrow dx={1} dy={0} length={irLength} type="IR" />
            <VectorArrow dx={0} dy={1} length={icLength} type="IC" />
            <VectorArrow dx={totalDx} dy={totalDy} length={itLength} type="IT" />
        </group>
    );
}

// MY UNDERSTANDING:
// The phasor diagram is a visual instrument, not a second physics engine.
// IR, IC, IT, and phi are taken directly from the authoritative snapshot.
// The geometry uses a fixed visual reference so the vectors stay readable
// while the real electrical values and phase remain numerically accurate.
