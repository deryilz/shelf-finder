export const MAROON = "#ac4444";
export const RED = "#d05353";
export const ORANGE = "#e58f65";
export const BLACK = "#000000";

export function round(x) {
    return Math.round(x * 1000) / 1000;
}

export function rad(deg) {
    return Math.PI * deg / 180;
}

export function rotatePoint(point, rad = 0) {
    let sin = Math.sin(rad);
    let cos = Math.cos(rad);
    return {
        x: round(cos * point.x - sin * point.y),
        y: round(sin * point.x + cos * point.y)
    };
}

export function closeEquals(s1, s2) {
    return s1?.toUpperCase() === s2?.toUpperCase();
}

