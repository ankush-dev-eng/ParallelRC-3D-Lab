import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

// These are the three planned laboratory views.
const CAMERA_PRESETS = {
    bench: {
        position: [0, 8.5, 8.5],
        target: [0, 0, 0],
        fov: 50,
    },

    board: {
        position: [0, 5.5, 5.0],
        target: [0, 0, 0],
        fov: 50,
    },

    analysis: {
        // Slightly farther back gives the analysis view
        // enough room to show the circuit and phasor diagram.
        position: [0, 7.4, 12.5],

        // Shift the framing slightly toward the right side
        // where the capacitor and analysis content are located.
        target: [0.45, 0.2, 0.4],

        // A wider field of view helps prevent the capacitor
        // from being cropped out of the analysis view.
        fov: 55,
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

    // Apply the selected camera's field of view only
    // when the active view changes.
    useEffect(() => {
        const preset =
            CAMERA_PRESETS[view] ??
            CAMERA_PRESETS.bench;

        // The project uses a perspective camera.
        // Keep this guard so the rig does not break
        // if the camera type changes later.
        if ("fov" in camera) {
            camera.fov = preset.fov;
            camera.updateProjectionMatrix();
        }
    }, [view, camera]);

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
// CameraRig controls only how the 3D laboratory is viewed.
// Each view has its own position, target, and field of view.
// The Analysis camera is slightly farther away and wider so
// the capacitor, circuit, and phasor analysis can fit together.
// Camera movement stays separate from physics and wiring because
// changing the camera must never change the electrical simulation.