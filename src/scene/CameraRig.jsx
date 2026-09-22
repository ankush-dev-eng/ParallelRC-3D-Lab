import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

// These are the three planned laboratory views.
const CAMERA_PRESETS = {
    bench: {
        position: [0, 8.5, 8.5],
        target: [0, 0, 0],
    },

    board: {
        position: [0, 5.5, 5.0],
        target: [0, 0, 0],
    },

    analysis: {
        position: [0, 7.0, 10.5],
        target: [0, 0.2, 0],
    },
};

// Smooth camera controller for the three laboratory views.
export default function CameraRig({
    view = "bench",
}) {
    const { camera } = useThree();

    // Reusable vectors prevent creating new Three.js objects every frame.
    const desiredPosition = useRef(
        new THREE.Vector3()
    );

    const desiredTarget = useRef(
        new THREE.Vector3()
    );

    // Move the camera toward the selected preset.
    useFrame((_, delta) => {
        const preset =
            CAMERA_PRESETS[view] ??
            CAMERA_PRESETS.bench;

        desiredPosition.current.set(
            preset.position[0],
            preset.position[1],
            preset.position[2]
        );

        desiredTarget.current.set(
            preset.target[0],
            preset.target[1],
            preset.target[2]
        );

        // Frame-rate-independent smoothing.
        const smoothing =
            1 - Math.exp(-6 * delta);

        camera.position.lerp(
            desiredPosition.current,
            smoothing
        );

        // Directly point the active camera at the selected target.
        camera.lookAt(
            desiredTarget.current
        );
    });

    return null;
}

// MY UNDERSTANDING:
// Write in your own words what CameraRig controls and why camera
// movement should stay separate from the circuit's physics and wiring.