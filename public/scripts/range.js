/*
 * Range that includes all words:
 * new Range("-")
 *
 * Range that includes all numbers:
 * new Range("-", true)
 *
 * Range that includes all numbers 10+:
 * new Range("10-", true)
 *
 * Range that includes all numbers over 10:
 * new Range("!10-", true)
 *
 * Range that includes all words from ABC to XYZ
 * new Range("ABC-XYZ")
 *
 * Range that includes all words starting with R:
 * new Range("R-S!")
 */

export class Range {
    constructor(str, number = false) {
        this.number = number;
        this.originalString = str.replace(/\s/g, "");

        let parts = this.originalString.split("-");
        if (parts.length !== 2) {
            throw new Error("Range must contain exactly one dash.");
        }

        let a = parts[0];
        if (a === "") {
            this.lower = null;
        } else {
            this.lowerX = a.startsWith("!");
            this.lower = this.parse(this.lowerX ? a.slice(1) : a);
        }

        let b = parts[1];
        if (b === "") {
            this.higher = null;
        } else {
            this.higherX = b.endsWith("!");
            this.higher = this.parse(this.higherX ? b.slice(0, -1) : b);
        }

        let bothBounds = this.higher !== null && this.lower !== null;
        let anyX = bothBounds && (this.higherX || this.lowerX);
        if (bothBounds && this.lower > this.higher || anyX && this.lower === this.higher) {
            throw new Error("There are no values between the bounds " + this.originalString + ".");
        }
    }

    parse(x) {
        if (this.number) {
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

    contains(x) {
        let value = this.parse(x);

        if (this.lower !== null) {
            if (this.lowerX && value <= this.lower) return false;
            if (!this.lowerX && value < this.lower) return false;
        }

        if (this.higher !== null) {
            if (this.higherX && value >= this.higher) return false;
            if (!this.higherX && value > this.higher) return false;
        }

        return true;
    }

    toString() {
        return this.originalString;
    }
}
