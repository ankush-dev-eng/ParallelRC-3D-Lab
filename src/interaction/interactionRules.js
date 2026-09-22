import { getColumnSocketPair } from "../scene/breadboardSockets.js";
// Find the closest valid A/B column to the dragged component.
export function getClosestColumn(point, snapRadius = 1.0) {
    if (!point) {
        return null;
    }

    let closestColumn = null;
    let closestDistance = Infinity;

    for (let column = 1; column <= 6; column += 1) {
        const pair = getColumnSocketPair(column);

        if (!pair) {
            continue;
        }

        const x = pair.hot.position[0];

        // A component is snapped to the column closest to its current pointer position.
        const distance = Math.hypot(
            point.x - x,
            point.z
        );

        if (distance < closestDistance) {
            closestDistance = distance;
            closestColumn = column;
        }
    }

    if (closestDistance > snapRadius) {
        return null;
    }

    return closestColumn;
}

// Return the electrical sockets belonging to a valid component column.
export function getSnapSockets(column) {
    if (column === null) {
        return null;
    }

    const pair = getColumnSocketPair(column);

    if (!pair) {
        return null;
    }

    return {
        first: pair.hot.id,
        second: pair.return.id,
    };
}

// Check whether a column is a valid place for a two-terminal component.
export function isValidSnapColumn(column) {
    return (
        Number.isInteger(column) &&
        column >= 1 &&
        column <= 6
    );
}

// YOUR UNDERSTANDING:
// Write in your own words why these interaction rules are kept
// separate from React components and the lab store.

// YOUR UNDERSTANDING:
// Explain what getClosestColumn() is doing when the user drags
// a component near the breadboard.