// all part coordinates are relative (fractions)
// whereas the shelf coordinates are in terms of map coordinates
export const SHELF_SCHEMA = new Map([
    ["single", {
        name: "Single shelf",
        width: 0.75,
        height: 2,
        parts: [{
            label: "Matches",
            x: 0,
            y: 0,
            width: 1,
            height: 1,
        }],
    }],
    ["split", {
        width: 1,
        height: 2,
        name: "Split shelf",
        parts: [{
            label: "Left matches",
            x: 0,
            y: 0,
            width: 0.5,
            height: 1,
        }, {
            label: "Right matches",
            x: 0.5,
            y: 0,
            width: 0.5,
            height: 1,
        }],
    }]
]);

export function blankShelf(type) {
    let parts = SHELF_SCHEMA.get(type).parts;
    return {
        type,
        angle: 0,
        x: 0,
        y: 0,
        matches: parts.map(() => [])
    };
}
