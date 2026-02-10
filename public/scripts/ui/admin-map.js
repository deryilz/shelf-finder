import { ShelfMap } from "./base-map.js";
import { round, rad, rotatePoint } from "../utils.js";

import { MATCH_SCHEMA } from "../match.js";
import { parseValue } from "../parse.js";

const SHADE_COLOR = "rgba(0, 0, 0, 0.1)";
const SELECTED_COLOR = "#7a2634";

export class AdminShelfMap extends ShelfMap {
    constructor(canvas, shelves) {
        super(canvas, shelves);

        this.onEdit = new Set();
        this.onSelect = new Set();
        this.onInvalid = new Set();

        this.handleEdit();
        this.handleHover();
        this.handlePlace();
        this.handleClick();
    }

    select(target) {
        if (this.hasError()) {
            for (let listener of this.onInvalid) {
                listener();
            }
        } else {
            this.selected = target;
            for (let listener of this.onSelect) {
                listener(target);
            }
        }
    }

    canPan(mouse) {
        return !this.getTarget(mouse);
    }

    // override: if placing, don't interact with shelves
    getTarget(mouse) {
        return this.placingShelf ? null : super.getTarget(mouse);
    }

    // override
    draw() {
        super.draw();

        if (this.selected) {
            this.drawShelf(this.selected.shelf, SELECTED_COLOR, null, this.selected.partId);
        }

        if (this.clicked) {
            this.drawShelf(this.hovered.shelf, SHADE_COLOR, null, this.clicked.partId);
        }

        if (this.placingShelf) {
            this.drawShelf(this.placingShelf, null, "black");
        } else if (this.hovered) {
            this.drawShelf(this.hovered.shelf, null, "black", this.hovered.partId);
        }
    }

    // round a shelf to the nearest "whole" coordinate based on the angle
    roundShelf(shelf) {
        let angle = rad(shelf.angle);
        let rotatedBack = rotatePoint(shelf, -angle);
        let rounded = {
            x: Math.round(rotatedBack.x),
            y: Math.round(rotatedBack.y)
        };
        let rotated = rotatePoint(rounded, angle);
        shelf.x = round(rotated.x);
        shelf.y = round(rotated.y);
    }

    handleEdit() {
        let startMouse = null;
        let startShelf = null;
        this.clicked = null;

        this.onMouseDown.add((mouse) => {
            let target = this.getTarget(mouse);
            if (!target) return;

            startMouse = mouse;
            startShelf = { x: target.shelf.x, y: target.shelf.y };
            this.clicked = target;
        });

        this.onMouseMove.add((mouse) => {
            if (!this.clicked) return;

            this.clicked.shelf.x = mouse.x - startMouse.x + startShelf.x;
            this.clicked.shelf.y = mouse.y - startMouse.y + startShelf.y;
            this.roundShelf(this.clicked.shelf);

            for (let listener of this.onEdit) {
                listener();
            }
        });

        this.onMouseUp.add(() => {
            if (!this.clicked) return;

            startMouse = null;
            startShelf = null;
            this.clicked = null;
        });
    }

    handleHover() {
        this.hovered = null;

        this.onMouseMove.add((mouse) => {
            this.hovered = this.clicked ?? this.getTarget(mouse);
        });
    }

    handlePlace() {
        this.placingShelf = null;

        this.onMouseMove.add((mouse) => {
            if (!this.placingShelf) return;

            this.placingShelf.x = mouse.x;
            this.placingShelf.y = mouse.y;
            this.roundShelf(this.placingShelf);
        });

        this.onClick.add(() => {
            if (!this.placingShelf) return;

            this.shelves.push(this.placingShelf);
            this.placingShelf = null;
        });

        window.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && this.placingShelf) {
                this.placingShelf = null;
                this.draw();
            }
        });
    }

    prepareToPlace(shelf) {
        this.placingShelf = shelf;
    }

    handleClick() {
        this.selected = null;

        this.onClick.add((mouse) => {
            let target = this.getTarget(mouse);
            if (target && (
                target.partId !== this.selected?.partId ||
                target.shelf !== this.selected?.shelf
            )) {
                this.select(target);
            }
        });
    }

    // whether the selected shelf has an error
    hasError() {
        if (!this.selected) return false;

        let shelf = this.selected.shelf;
        if (!this.shelves.includes(shelf)) return false;

        for (let match of shelf.matches.flat()) {
            let schema = MATCH_SCHEMA.get(match.type);
            for (let [name, ty, _] of schema.fields) {
                try {
                    parseValue(match[name], ty);
                } catch {
                    return true;
                }
            }
        }

        return false;
    }
}
