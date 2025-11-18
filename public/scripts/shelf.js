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
    return shelf.front.length > 0 && shelf.back.length > 0;
}

// if all the matches are in a single part, returns that part
export function onlyPart(shelf) {
    let lf = shelf.front.length;
    let lb = shelf.back.length;

    if (lf > 0 && lb === 0) {
        return "front";
    } else if (lb > 0 && lf === 0) {
        return "back";
    } else {
        return null;
    }
}
