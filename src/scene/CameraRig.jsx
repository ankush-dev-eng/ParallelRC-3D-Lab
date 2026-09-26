import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

// Presentation-only camera presets for the physical lab scene.
// The lab geometry and interaction coordinates remain unchanged.

const CAMERA_PRESETS = {
    bench: {
        position: [6.9, 6.2, 8.6],
        target: [0.4, 0.3, -0.1],
        fov: 50,
    },

    board: {
        position: [0.4, 9.6, 6.4],
        target: [0.0, 0.1, 0.05],
        fov: 52,
    },

    analysis: {
        position: [6.1, 6.8, 10.2],
        target: [1.15, 0.95, 0.95],
        fov: 50,
    },
};

export default function CameraRig({ view = "bench" }) {
    const { camera } = useThree();

    const desiredPosition = useRef(new THREE.Vector3());
    const desiredTarget = useRef(new THREE.Vector3());

    useEffect(() => {
        const preset = CAMERA_PRESETS[view] ?? CAMERA_PRESETS.bench;

        if ("fov" in camera) {
            camera.fov = preset.fov;
            camera.updateProjectionMatrix();
        }
    }, [view, camera]);

    useFrame((_, delta) => {
        const preset = CAMERA_PRESETS[view] ?? CAMERA_PRESETS.bench;

        desiredPosition.current.set(...preset.position);
        desiredTarget.current.set(...preset.target);

        const smoothing = 1 - Math.exp(-5.5 * delta);

        camera.position.lerp(desiredPosition.current, smoothing);
        camera.lookAt(desiredTarget.current);
    });

    return null;
}

// MY UNDERSTANDING:
// CameraRig changes only the visual viewpoint.
// Bench shows the complete laboratory context.
// Board gives a higher placement-oriented view.
// Analysis keeps the circuit visible while reserving visual space for the phasor.
// None of these views alter electrical state or interaction rules.
