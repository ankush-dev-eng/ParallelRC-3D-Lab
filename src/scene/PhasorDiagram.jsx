import { useMemo } from "react";
import * as THREE from "three";

// ------------------------------------------------------------
// ANALYSIS VISUAL SYSTEM
// ------------------------------------------------------------

// This is a visual scale, not a physics scale.
// A smaller reference current makes normal laboratory currents
// large enough to read comfortably in the 3D viewport.
const MAX_REFERENCE_CURRENT_MA = 8;
const MAX_ARROW_LENGTH = 2.65;
const HEAD_LENGTH = 0.20;
const SHAFT_RADIUS = 0.042;
const HEAD_RADIUS = 0.105;

const COLORS = {
    ir: "#B7C2C9",
    ic: "#928EB3",
    it: "#EEE5D8",

    phase: "#A59C91",
    origin: "#E0D7C9",

    guide: "#5D6861",
    guideStrong: "#758079",
    tick: "#7A847D",

    labelIR: "#CBD3D7",
    labelIC: "#B4B0CF",
    labelIT: "#F1EADF",
    labelPhase: "#B9B1A5",
};

// Convert the true RMS current into a readable visual vector length.
// The electrical current values themselves are never modified.
function currentToLength(currentA) {
    return Math.min(
        MAX_ARROW_LENGTH,
        Math.max(
            0,
            (currentA * 1000 / MAX_REFERENCE_CURRENT_MA) *
            0.95
        )
    );
}

function VectorArrow({ dx, dy, length, color }) {
    const geometry = useMemo(() => {
        const direction = new THREE.Vector3(
            dx,
            dy,
            0
        ).normalize();

        const shaftLength = Math.max(
            0.02,
            length - HEAD_LENGTH
        );

        const shaftPosition = direction
            .clone()
            .multiplyScalar(
                shaftLength / 2
            );

        const headPosition = direction
            .clone()
            .multiplyScalar(
                Math.max(
                    0,
                    length - HEAD_LENGTH / 2
                )
            );

        const quaternion =
            new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                direction
            );

        return {
            shaftLength,
            shaftPosition,
            headPosition,
            quaternion,
        };
    }, [dx, dy, length]);

    return (
        <group>
            <mesh
                position={geometry.shaftPosition}
                quaternion={geometry.quaternion}
            >
                <cylinderGeometry
                    args={[
                        SHAFT_RADIUS,
                        SHAFT_RADIUS,
                        geometry.shaftLength,
                        14,
                    ]}
                />

                <meshStandardMaterial
                    color={color}
                    roughness={0.36}
                    metalness={0.18}
                />
            </mesh>

            <mesh
                position={geometry.headPosition}
                quaternion={geometry.quaternion}
            >
                <coneGeometry
                    args={[
                        HEAD_RADIUS,
                        HEAD_LENGTH,
                        14,
                    ]}
                />

                <meshStandardMaterial
                    color={color}
                    roughness={0.34}
                    metalness={0.18}
                />
            </mesh>
        </group>
    );
}

// Transparent text sprite.
// Unlike the previous version, the labels do not get dark rectangular
// backgrounds, so they read as annotations rather than UI cards.
function TextTag({
    text,
    position,
    color,
    scale = 0.46,
}) {
    const texture = useMemo(() => {
        const canvas = document.createElement("canvas");

        canvas.width = 256;
        canvas.height = 96;

        const context =
            canvas.getContext("2d");

        context.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        context.textAlign = "center";
        context.textBaseline = "middle";

        context.font =
            '600 30px "IBM Plex Mono", monospace';

        // Very small shadow only for readability against the 3D bench.
        context.shadowColor =
            "rgba(0,0,0,0.75)";
        context.shadowBlur = 8;
        context.shadowOffsetY = 2;

        context.fillStyle = color;

        context.fillText(
            text,
            canvas.width / 2,
            canvas.height / 2
        );

        const texture =
            new THREE.CanvasTexture(canvas);

        texture.colorSpace =
            THREE.SRGBColorSpace;

        texture.needsUpdate = true;

        return texture;
    }, [text, color]);

    return (
        <sprite
            position={position}
            scale={[scale * 1.55, scale, 1]}
        >
            <spriteMaterial
                map={texture}
                transparent
                depthWrite={false}
            />
        </sprite>
    );
}

function GuideLine({
    position,
    size,
    opacity = 0.30,
}) {
    return (
        <mesh position={position}>
            <boxGeometry args={size} />

            <meshBasicMaterial
                color={COLORS.guide}
                transparent
                opacity={opacity}
                depthWrite={false}
            />
        </mesh>
    );
}

// A restrained calibration cross instead of the previous giant grid.
// It provides scientific context without turning the phasor into a panel.
function CalibrationField() {
    const ticks = [-1.2, -0.6, 0.6, 1.2];

    return (
        <group>
            {/* Main axes. */}
            <GuideLine
                position={[0, 0, -0.04]}
                size={[3.9, 0.018, 0.018]}
                opacity={0.46}
            />

            <GuideLine
                position={[0, 0, -0.04]}
                size={[0.018, 3.9, 0.018]}
                opacity={0.46}
            />

            {/* Four small crosshair ticks. */}
            {ticks.map((value) => (
                <group key={`tick-${value}`}>
                    <GuideLine
                        position={[
                            value,
                            0,
                            -0.035,
                        ]}
                        size={[
                            0.012,
                            0.12,
                            0.012,
                        ]}
                        opacity={0.38}
                    />

                    <GuideLine
                        position={[
                            0,
                            value,
                            -0.035,
                        ]}
                        size={[
                            0.12,
                            0.012,
                            0.012,
                        ]}
                        opacity={0.38}
                    />
                </group>
            ))}
        </group>
    );
}

function PhaseArc({ phase }) {
    const geometry = useMemo(() => {
        const radius = 0.58;

        const points = [];

        const segments = 28;

        for (
            let index = 0;
            index <= segments;
            index += 1
        ) {
            const t =
                (index / segments) * phase;

            points.push(
                new THREE.Vector3(
                    Math.cos(t) * radius,
                    Math.sin(t) * radius,
                    -0.02
                )
            );
        }

        return new THREE.BufferGeometry()
            .setFromPoints(points);
    }, [phase]);

    return (
        <line geometry={geometry}>
            <lineBasicMaterial
                color={COLORS.phase}
                transparent
                opacity={0.82}
            />
        </line>
    );
}

export default function PhasorDiagram({
    snapshot,
    simulationActive,
    position = [2.35, 1.75, 1.25],
}) {
    if (
        !simulationActive ||
        !snapshot
    ) {
        return null;
    }

    const irLength =
        currentToLength(snapshot.IR);

    const icLength =
        currentToLength(snapshot.IC);

    const itLength =
        currentToLength(snapshot.IT);

    const totalDx =
        Math.cos(snapshot.phiRad);

    const totalDy =
        Math.sin(snapshot.phiRad);

    const phaseArc =
        Math.max(
            0.001,
            Math.min(
                Math.PI / 2,
                Math.abs(
                    snapshot.phiRad
                )
            )
        );

    const diagramScale = 1.12;

    return (
        <group
            position={position}
            scale={[
                diagramScale,
                diagramScale,
                diagramScale,
            ]}
        >
            <CalibrationField />

            <PhaseArc
                phase={phaseArc}
            />

            {/* Origin. */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry
                    args={[
                        0.075,
                        16,
                        16,
                    ]}
                />

                <meshStandardMaterial
                    color={COLORS.origin}
                    roughness={0.34}
                    metalness={0.16}
                />
            </mesh>

            {/* IR — resistive branch, in phase with voltage. */}
            <VectorArrow
                dx={1}
                dy={0}
                length={irLength}
                color={COLORS.ir}
            />

            {/* IC — capacitive branch, +90°. */}
            <VectorArrow
                dx={0}
                dy={1}
                length={icLength}
                color={COLORS.ic}
            />

            {/* IT — vector sum. */}
            <VectorArrow
                dx={totalDx}
                dy={totalDy}
                length={itLength}
                color={COLORS.it}
            />

            {/* Annotation tags only. Numeric values remain in the rail. */}
            <TextTag
                text="IR"
                color={COLORS.labelIR}
                position={[
                    irLength + 0.25,
                    -0.05,
                    0.06,
                ]}
                scale={0.42}
            />

            <TextTag
                text="IC"
                color={COLORS.labelIC}
                position={[
                    -0.10,
                    icLength + 0.24,
                    0.06,
                ]}
                scale={0.42}
            />

            <TextTag
                text="IT"
                color={COLORS.labelIT}
                position={[
                    totalDx *
                    (itLength + 0.28),
                    totalDy *
                    (itLength + 0.28),
                    0.06,
                ]}
                scale={0.42}
            />

            <TextTag
                text="φ"
                color={COLORS.labelPhase}
                position={[
                    0.48,
                    0.28,
                    0.06,
                ]}
                scale={0.34}
            />
        </group>
    );
}

// MY UNDERSTANDING:
// The phasor diagram is a visual instrument, not another physics engine.
// IR, IC, IT and phi always come directly from the authoritative snapshot.
//
// The 3D viewport should show the relationship between the vectors,
// not duplicate the numerical analysis already visible in the left rail.
//
// I removed the heavy black panel and oversized guide grid because they
// made the phasor behave like a floating dashboard card. The remaining
// axes and ticks are deliberately restrained so the vectors become the
// focal point of Analysis.
//
// The visual scale is intentionally independent of the real electrical
// magnitudes. A current value is never changed; only its display length
// changes so normal RC-lab values remain readable.
