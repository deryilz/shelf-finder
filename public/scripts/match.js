import { contains, isBlank } from "./range.js";
import { closeEquals } from "./utils.js";

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
        },
        info() {
            let str = `Nonfiction books`;
            if (!isBlank(this.deweyRange)) str += ` in the range "${this.deweyRange}"`;
            return str;
        }
    }],
    ["fictionMatch", {
        name: "Fiction match",
        fields: [
            ["authorRange", "strRange", "Author range"],
            ["sublocation", "any", "Fiction sublocation (optional)"]
        ],
        matches(book) {
            return (
                book.type === "fiction" &&
                contains(this.authorRange, book.author) &&
                (!this.sublocation || closeEquals(this.sublocation, book.sublocation))
            );
        },
        info() {
            let str = `Fiction books`;
            if (!isBlank(this.authorRange)) str += `in the range (${this.authorRange})`;
            if (this.sublocation) str += ` in the category "${this.sublocation}"`;
            return str;
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
        },
        info() {
            let str = `Books starting with "${this.prefix}"`;
            if (!isBlank(this.authorRange)) str += `in the range (${this.authorRange})`;
            return str;
        }
    }],
    ["exactMatch", {
        name: "Exact match",
        fields: [
            ["callNumber", "any", "The book's call number"]
        ],
        matches(book) {
            return closeEquals(this.callNumber, book.callNumber);
        },
        info() {
            return `Books with the call number "${this.callNumber}"`;
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

export function info(match, book) {
    return MATCH_SCHEMA.get(match.type).info.call(match, book);
}
