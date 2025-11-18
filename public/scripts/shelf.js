export function blankShelf(width = 1, height = 3) {
    return {
        width,
        height,
        angle: 0,
        x: 0,
        y: 0,
        front: [],
        back: []
    };
}

export function isSplit(shelf) {
    return shelf.back.length > 0;
}

export function getMatches(shelf, part) {
    return shelf[part];
}
