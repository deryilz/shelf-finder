// parseable strings fit one of the following patterns:
// "any", "str", "num", "strRange", "numRange"
// TODO: add "word"?

export function parseValue(x, type) {
    if (x.length > 100) {
        throw new Error("Input too long!");
    }

    if (type === "any") {
        return x;
    }

    if (type === "str") {
        if (typeof x === "string" && /^[A-Za-z ]+$/.test(x)) {
            return x.toUpperCase();
        } else {
            throw new Error("Expected alphabetic characters, not \"" + x + "\".");
        }
    }

    if (type === "num") {
        if (x !== "" && !isNaN(x)) {
            return Number(x);
        } else {
            throw new Error("Expected number, not \"" + x + "\".");
        }
    }

    if (type === "strRange") {
        return parseRange(x, "str");
    }

    if (type === "numRange") {
        return parseRange(x, "num");
    }

    throw new Error("Unknown type " + type + ".");
}

export function parseRange(raw, subType = "str") {
    let range = {};

    let parts = raw.replace(/\s/g, "").split("-");
    if (parts.length !== 2) {
        throw new Error("Range must contain exactly one dash.");
    }

    // parse lower bound
    let a = parts[0];
    if (a === "") {
        range.lower = null;
    } else {
        range.lowerX = a.startsWith("!");
        range.lower = parseValue(range.lowerX ? a.slice(1) : a, subType);
    }

    // parse higher bound
    let b = parts[1];
    if (b === "") {
        range.higher = null;
    } else {
        range.higherX = b.endsWith("!");
        range.higher = parseValue(range.higherX ? b.slice(0, -1) : b, subType);
    }

    // do basic bounds checking
    let bothBounds = range.higher !== null && range.lower !== null;
    let anyX = bothBounds && (range.higherX || range.lowerX);
    if (bothBounds && range.lower > range.higher || anyX && range.lower === range.higher) {
        throw new Error("There are no values between these bounds.");
    }

    return range;
}

export function parseBook(callNumber, sublocation = null) {
    let props = parseCallNumber(callNumber.toUpperCase());
    return { callNumber, sublocation, ...props };
}

function parseCallNumber(callNumber) {
    let parts = callNumber.split(" ");

    if (parts.length < 2 || parts.length > 3) {
        return {
            type: "unknown"
        };
    }

    // TODO: is this detailed enough?
    if (parts.length === 3) {
        return {
            type: "other",
            prefix: parts[0],
            author: parts[2]
        };
    }

    if (parts[0] === "FIC" || parts[0] === "F") {
        return {
            type: "fiction",
            author: parts[1]
        };
    }

    let num = Number(callNumber.split(" ")[0]);
    if (!isNaN(num)) {
        return {
            type: "nonfiction",
            author: parts[1],
            num
        };
    }

    return {
        type: "other",
        prefix: parts[0],
        author: parts[1]
    };
}
