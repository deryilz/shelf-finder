import { ShelfMap } from "./base-map.js";

const MATCH_COLOR = "#ac4444";

export class UserShelfMap extends ShelfMap {
    constructor(canvas, shelves) {
        super(canvas, shelves);

        this.matches = [];
    }

    // override
    draw() {
        super.draw();

        for (let match of this.matches) {
            this.drawShelf(match.shelf, MATCH_COLOR, null, match.partId);
        }
    }
}
