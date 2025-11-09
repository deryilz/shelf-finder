export function parseBook(callNumber) {
    let parts = callNumber.split(" ");

    if (parts.length !== 2) {
        return {
            type: "other"
        };
    }

    if (parts[0] === "FIC" || parts[0] === "F") {
        return {
            type: "fiction",
            author: parts[1],
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
        type: "nonfiction",
        prefix: parts[0],
        author: parts[1]
    };

    // TODO: add more?
}
