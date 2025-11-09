import { parseBook } from "./books.js";
import { contains } from "./range.js";

function closeEquals(s1, s2) {
    return s1.toUpperCase() === s2.toUpperCase();
}

export function matches(match, callNumber, sublocation) {
    let book = parseBook(callNumber);

    if (match.type === "exactMatch") {
        return closeEquals(match.callNumber, callNumber);
    }

    if (match.type === "fictionCategoryMatch") {
        return (
            book.type === "fiction" &&
            closeEquals(match.sublocation, sublocation) &&
            contains(match.alphaRange, book.author)
        );
    }

    if (match.type === "prefixMatch") {
        return (
            closeEquals(match.prefix, book.prefix) &&
            contains(match.alphaRange, book.author)
        )
    }

    if (match.type === "nonfictionMatch") {
        return (
            book.type === "nonfiction" &&
            contains(match.numRange, book.num, true)
        );
    }

    throw new Error("TODO");
}
