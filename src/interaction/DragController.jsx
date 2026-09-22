import { useRef, useState } from "react";
import * as THREE from "three";

import {
    getClosestColumn,
    getSnapSockets,
} from "./interactionRules";

const DEFAULT_DRAG_HEIGHT = 0.42;
const DEFAULT_SNAP_RADIUS = 1.0;

// This hook contains the common drag behaviour used by both
// the resistor and capacitor.
export function useDragController({
    dragHeight = DEFAULT_DRAG_HEIGHT,
    snapRadius = DEFAULT_SNAP_RADIUS,
    onDrop,
}) {
    const [dragState, setDragState] = useState({
        component: null,
        position: null,
        candidateColumn: null,
    });

    // A ref lets pointer-up read the latest drag values immediately.
    const dragRef = useRef({
        component: null,
        position: null,
        candidateColumn: null,
    });

    const dragPlane = useRef(
        new THREE.Plane(
            new THREE.Vector3(0, 1, 0),
            0
        )
    );

    function updateDragState(nextState) {
        dragRef.current = nextState;
        setDragState(nextState);
    }

    // Start dragging a component from its current position.
    function startDrag(event, component, startPosition) {
        event.stopPropagation();

        event.target.setPointerCapture?.(
            event.pointerId
        );

        updateDragState({
            component,
            position: startPosition,
            candidateColumn: null,
        });

        document.body.style.cursor = "grabbing";
    }

    // Convert the pointer position into a 3D point on the bench.
    function getBenchPoint(event) {
        return event.ray.intersectPlane(
            dragPlane.current,
            new THREE.Vector3()
        );
    }

    // Move whichever component is currently being dragged.
    function moveDrag(event) {
        if (!dragRef.current.component) {
            return;
        }

        event.stopPropagation();

        const point = getBenchPoint(event);

        if (!point) {
            return;
        }

        const nextPosition = [
            point.x,
            dragHeight,
            point.z,
        ];

        const nextCandidate = getClosestColumn(
            point,
            snapRadius
        );

        updateDragState({
            ...dragRef.current,
            position: nextPosition,
            candidateColumn: nextCandidate,
        });
    }

    // Finish the current drag and report whether it was successfully snapped.
    function endDrag(event) {
        if (!dragRef.current.component) {
            return;
        }

        event.stopPropagation();

        event.target.releasePointerCapture?.(
            event.pointerId
        );

        const {
            component,
            candidateColumn,
        } = dragRef.current;

        let result = {
            component,
            column: null,
            sockets: null,
            position: null,
        };

        if (candidateColumn !== null) {
            const sockets = getSnapSockets(
                candidateColumn
            );

            const point = getBenchPoint(event);

            // Put the component at the centre of the selected A/B socket pair.
            const snappedPosition = point
                ? [
                    point.x,
                    dragHeight,
                    0,
                ]
                : null;

            result = {
                component,
                column: candidateColumn,
                sockets,
                position: snappedPosition,
            };
        }

        // App decides what to do with the result, such as updating labStore.
        onDrop?.(result);

        updateDragState({
            component: null,
            position: null,
            candidateColumn: null,
        });

        document.body.style.cursor = "default";

        return result;
    }

    // Cancel the current drag without creating an electrical connection.
    function cancelDrag() {
        const component = dragRef.current.component;

        if (component) {
            onDrop?.({
                component,
                column: null,
                sockets: null,
                position: null,
            });
        }

        updateDragState({
            component: null,
            position: null,
            candidateColumn: null,
        });

        document.body.style.cursor = "default";
    }

    return {
        dragState,
        startDrag,
        moveDrag,
        endDrag,
        cancelDrag,
    };
}

// YOUR UNDERSTANDING:
// Explain in your own words why one generic drag controller
// is better than writing separate drag logic for the resistor
// and capacitor.

// YOUR UNDERSTANDING:
// Explain why the controller reports the drop result to App.jsx
// instead of directly changing labStore.