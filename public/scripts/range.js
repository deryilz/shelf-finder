import { parseRange, parseValue } from "./parse.js";

export function isBlank(raw) {
    return /(\s)*-(\s)*/.test(raw);
}

export function contains(raw, x, subType = "str") {
    // expected not to throw
    let range = parseRange(raw, subType);

    // can throw, so we'll catch this
    let value;
    try {
        value = parseValue(x, subType);
    } catch (err) {
        return false;
    }

    if (range.lower !== null) {
        if (range.lowerX && value <= range.lower) return false;
        if (!range.lowerX && value < range.lower) return false;
    }

    if (range.higher !== null) {
        if (range.higherX && value >= range.higher) return false;
        if (!range.higherX && value > range.higher) return false;
    }

    return true;
}
