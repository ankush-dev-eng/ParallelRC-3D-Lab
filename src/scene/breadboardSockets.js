// This file contains the fixed electrical socket positions used by the breadboard.
// Keeping the socket data here means the 3D board and the drag/snap system
// can both use exactly the same socket IDs and positions.

// Horizontal positions for the six usable breadboard columns.
const COLUMN_X = [-4, -2.4, -0.8, 0.8, 2.4, 4];

// Depth positions for the two electrical rows.
const ROW_Z = {
    A: 0.7,
    B: -0.7,
};

// Height of a socket above the breadboard surface.
const SOCKET_Y = 0.16;

// Build one list containing all twelve sockets: A1-A6 and B1-B6.
export const BREADBOARD_SOCKETS = [
    ...COLUMN_X.flatMap((x, index) => {
        const column = index + 1;

        return [
            {
                id: `A${column}`,
                row: "A",
                column,
                position: [x, SOCKET_Y, ROW_Z.A],
            },
            {
                id: `B${column}`,
                row: "B",
                column,
                position: [x, SOCKET_Y, ROW_Z.B],
            },
        ];
    }),
];

// A lookup table makes it quick to find the position of a socket by its ID.
export const SOCKET_BY_ID = Object.fromEntries(
    BREADBOARD_SOCKETS.map((socket) => [socket.id, socket])
);

// Return the socket belonging to a particular ID.
export function getSocketById(socketId) {
    return SOCKET_BY_ID[socketId] ?? null;
}

// Return the two sockets belonging to one vertical breadboard column.
export function getColumnSocketPair(column) {
    if (column < 1 || column > COLUMN_X.length) {
        return null;
    }

    return {
        hot: SOCKET_BY_ID[`A${column}`],
        return: SOCKET_BY_ID[`B${column}`],
    };
}

// Return all legal component positions where a two-terminal component
// can bridge one A socket and the matching B socket.
export function getComponentSocketPairs() {
    return COLUMN_X.map((_, index) => {
        const column = index + 1;

        return {
            column,
            first: `A${column}`,
            second: `B${column}`,
        };
    });
}

// YOUR UNDERSTANDING:
// Write in your own words why keeping all socket positions in one file
// is better than putting the coordinates separately inside different components.

// YOUR UNDERSTANDING:
// Explain what a socket ID such as "A3" represents in our simulation.