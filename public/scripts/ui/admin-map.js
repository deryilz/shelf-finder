import { ShelfMap } from "./base-map.js";
import { round, rad, rotatePoint } from "../utils.js";

export class AdminShelfMap extends ShelfMap {
    constructor(canvas) {
        super(canvas);

        this.onChange = new Set();

        this.handlePlace();
        this.handleEdit();
    }

    // rare override: if placing, we don't want to interact with the shelves on the map
    getTarget(mouse) {
        if (this.action === "placing") {
            return null;
        } else {
            return super.getTarget(mouse);
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

        this.onMouseDown.add((mouse) => {
            let target = this.getTarget(mouse);
            if (!target) return;

            this.action = "moving";
            this.target = target;
            this.shade = true;

            startMouse = mouse;
            startShelf = { x: target.shelf.x, y: target.shelf.y };
        });

        this.onMouseMove.add((mouse) => {
            if (!this.target) return;
            if (this.action !== "moving") return;

            this.target.shelf.x = mouse.x - startMouse.x + startShelf.x;
            this.target.shelf.y = mouse.y - startMouse.y + startShelf.y;
            this.roundShelf(this.target.shelf);

            for (let listener of this.onChange) {
                listener();
            }
        });

        this.onMouseUp.add(() => {
            if (this.action !== "moving") return;

            this.clearState();
            startMouse = null;
            startShelf = null;
        });
    }

    handlePlace() {
        this.onMouseMove.add((mouse) => {
            if (this.action !== "placing") return;

            this.target.shelf.x = mouse.x;
            this.target.shelf.y = mouse.y;
            this.roundShelf(this.target.shelf);
        });

        this.onClick.add((mouse) => {
            if (this.action !== "placing") return

            this.shelves.push(this.target.shelf);
            this.clearState();

            for (let listener of this.onChange) {
                listener();
            }
        });
    }

    prepareToPlace(shelf) {
        this.action = "placing";
        this.target = { shelf, partId: null };
        this.shade = false;
    }
}
