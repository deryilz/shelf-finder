export function parseRange(str, isNumber = false) {
    let out = {};

    let parts = str.replace(/\s/g, "").split("-");
    if (parts.length !== 2) {
        throw new Error("Range must contain exactly one dash.");
    }

    let a = parts[0];
    if (a === "") {
        out.lower = null;
    } else {
        out.lowerX = a.startsWith("!");
        out.lower = parseValue(out.lowerX ? a.slice(1) : a, isNumber);
    }

    let b = parts[1];
    if (b === "") {
        out.higher = null;
    } else {
        out.higherX = b.endsWith("!");
        out.higher = parseValue(out.higherX ? b.slice(0, -1) : b, isNumber);
    }

    let bothBounds = out.higher !== null && out.lower !== null;
    let anyX = bothBounds && (out.higherX || out.lowerX);
    if (bothBounds && out.lower > out.higher || anyX && out.lower === out.higher) {
        throw new Error("There are no values between these bounds.");
    }

    return out;
}

function parseValue(x, isNumber = false) {
    if (isNumber) {
        if (x !== "" || isNaN(x)) {
            return Number(x);
        } else {
            throw new Error("Expected number, not " + x + ".");
        }
    } else {
        if (typeof x === "string" && /^[A-Za-Z]+$/.test(x)) {
            return x.toUpperCase();
        } else {
            throw new Error("Expected string, not " + x + ".");
        }
    }
}

export function contains(str, x, isNumber = false) {
    let range = parseRange(str, isNumber);

    let value;
    try {
        value = parseValue(x, isNumber);
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
