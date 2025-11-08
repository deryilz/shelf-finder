import { Range } from "./range.js";

export class Shelf {}

export class NonfictionShelf extends Shelf {
    constructor(numRange, alphaRange = "-") {
        this.numRange = new Range(numRange);
        this.alphaRange = new Range(alphaRange);
    }

    contains(book) {
        return (
            book.type === "nonfiction"
            && this.numRange.contains(book.num)
            && this.alphaRange.contains(book.alpha)
        );
    }
}

