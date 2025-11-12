export function blankShelf(width = 1, height = 3) {
    return {
        width,
        height,
        angle: 0,
        x: 0,
        y: 0,
        frontMatches: [],
        backMatches: []
    };
}

export function isSplit(shelf) {
    return Boolean(shelf.backMatches) && shelf.backMatches.length > 0;
}

export let shelves = [
    {
        x: 5,
        y: 17,
        width: 1,
        height: 3,
        angle: 0,
    },
    {
        x: 5,
        y: 20,
        width: 1,
        height: 3,
        angle: 0,
    },
    {
        x: 0,
        y: 0,
        width: 1,
        height: 3,
        angle: 210,
        backMatches: [{}]
    },
    {
        x: 18,
        y: 3,
        width: 1,
        height: 3,
        angle: 30
    }
];
