export function blankShelf(width = 1, height = 3) {
    return {
        width,
        height,
        angle: 0,
        x: 0,
        y: 0,
        matches: [],
        backMatches: []
    };
}

export function isSplit(shelf) {
    return Boolean(shelf.backMatches) && shelf.backMatches.length > 0;
}

export function getMatches(shelf, part = null) {
    if (part === "back") {
        return shelf.backMatches;
    } else {
        return shelf.matches;
    }
}

// TODO: will this be used?
export function parts(shelf) {
    if (isSplit(shelf)) {
        return ["front", "back"];
    } else {
        return [null];
    }
}

// TODO: remove these of course
export let shelves = [
    {
        x: 5,
        y: 17,
        width: 1,
        height: 3,
        angle: 0,
        matches: []
    },
    {
        x: 5,
        y: 20,
        width: 1,
        height: 3,
        angle: 0,
        matches: []
    },
    {
        x: 0,
        y: 0,
        width: 1,
        height: 3,
        angle: 210,
        matches: [],
        backMatches: [{}]
    },
    {
        x: 18,
        y: 3,
        width: 1,
        height: 3,
        angle: 30,
        matches: []
    }
];
