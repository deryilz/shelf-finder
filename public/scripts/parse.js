// parseable strings fit one of the following patterns:
// "any", "str", "num", "strRange", "numRange"

export function parseValue(x, type) {
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

export function parseRange(str, subType = "str") {
    let out = {};

    let parts = str.replace(/\s/g, "").split("-");
    if (parts.length !== 2) {
        throw new Error("Range must contain exactly one dash.");
    }

    // parse lower bound
    let a = parts[0];
    if (a === "") {
        out.lower = null;
    } else {
        out.lowerX = a.startsWith("!");
        out.lower = parseValue(out.lowerX ? a.slice(1) : a, subType);
    }

    // parse higher bound
    let b = parts[1];
    if (b === "") {
        out.higher = null;
    } else {
        out.higherX = b.endsWith("!");
        out.higher = parseValue(out.higherX ? b.slice(0, -1) : b, subType);
    }

    // do basic bounds checking
    let bothBounds = out.higher !== null && out.lower !== null;
    let anyX = bothBounds && (out.higherX || out.lowerX);
    if (bothBounds && out.lower > out.higher || anyX && out.lower === out.higher) {
        throw new Error("There are no values between these bounds.");
    }

    return out;
}

export function parseBook(callNumber, sublocation = null) {
    let props = parseCallNumber(callNumber.toUpperCase());
    return { callNumber, sublocation, ...props };
}

function parseCallNumber(callNumber) {
    let parts = callNumber.split(" ");

    if (parts.length !== 2) {
        return {
            type: "unknown"
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

    // TODO: add more?
    return {
        type: "other",
        prefix: parts[0],
        author: parts[1]
    };
}
