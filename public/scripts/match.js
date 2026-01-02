import { contains } from "./range.js";
import { closeEquals } from "./utils.js";

// TODO: descriptions for variants, maybe?
export const MATCH_SCHEMA = new Map([
    ["nonfictionMatch", {
        name: "Nonfiction match",
        fields: [
            ["deweyRange", "numRange", "Dewey decimal range"]
        ],
        matches(book) {
            return (
                book.type === "nonfiction" &&
                contains(this.deweyRange, book.num, "num")
            );
        }
    }],
    ["fictionMatch", {
        name: "Fiction match",
        fields: [
            ["authorRange", "strRange", "Author range"],
            ["sublocation", "any", "The fiction sublocation (can be left blank)"]
        ],
        matches(book) {
            return (
                book.type === "fiction" &&
                contains(this.authorRange, book.author) &&
                (!this.sublocation || closeEquals(this.sublocation, book.sublocation))
            );
        }
    }],
    ["prefixMatch", {
        name: "Prefix match",
        fields: [
            ["prefix", "str", "Prefix (like B)"],
            ["authorRange", "strRange", "Author range"]
        ],
        matches(book) {
            return (
                book.type === "other" &&
                closeEquals(this.prefix, book.prefix) &&
                contains(this.authorRange, book.author)
            );
        }
    }],
    ["exactMatch", {
        name: "Exact match",
        fields: [
            ["callNumber", "any", "The book's call number"]
        ],
        matches(book) {
            return closeEquals(this.callNumber, book.callNumber);
        }
    }],
]);

// returns the default match for a certain variant type
// not necessarily a fully valid match, though
export function defaultMatch(variantName) {
    let match = { type: variantName };
    let schema = MATCH_SCHEMA.get(variantName);
    for (let [name, ty, desc] of schema.fields) {
        match[name] = "";
    }
    return match;
}

// elite js wizardry
export function matches(match, book) {
    return MATCH_SCHEMA.get(match.type).matches.call(match, book);
}
