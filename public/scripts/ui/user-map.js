import { ShelfMap } from "./base-map.js";

const MATCH_COLOR = "#ac4444";
const TOOLTIP_DISTANCE = 5;

export class UserShelfMap extends ShelfMap {
    constructor(canvas, shelves, tooltip) {
        super(canvas, shelves);

        this.tooltip = tooltip;
        this.matches = [];

        this.handleHover();
        this.handleMouseMove();
    }

    // override
    draw() {
        super.draw();

        for (let match of this.matches) {
            this.drawShelf(match.shelf, MATCH_COLOR, null, match.partId);
        }

        this.tooltip.classList.toggle("hidden", !this.hovered);
        if (this.hovered) {
            this.drawShelf(this.hovered.shelf, null, "black", this.hovered.partId);

            this.updateTooltipText();

            let style = this.tooltip.style;
            let { width, height } = this.tooltip.getBoundingClientRect();
            let { x, y } = this.lastMouse;

            // keep tooltip in bounds
            if (x + width + TOOLTIP_DISTANCE < innerWidth) {
                style.left = (x + TOOLTIP_DISTANCE) + "px";
                style.right = "";
            } else {
                style.left = "";
                style.right = (innerWidth - x + TOOLTIP_DISTANCE) + "px";
            }

            if (y + height + TOOLTIP_DISTANCE < innerHeight) {
                style.top = (y + TOOLTIP_DISTANCE) + "px";
                style.bottom = "";
            } else {
                style.top = "";
                style.bottom = (innerHeight - y + TOOLTIP_DISTANCE) + "px";
            }
        }
    }

    addMatch(target) {
        this.matches.push(target);
    }

    handleHover() {
        this.hovered = null;

        this.onMouseMove.add((mouse) => {
            this.hovered = this.getTarget(mouse);
        });
    }

    handleMouseMove() {
        // screen pixels
        this.lastMouse = { x: 0, y: 0 };

        window.addEventListener("mousemove", (event) => {
            this.lastMouse.x = event.clientX;
            this.lastMouse.y = event.clientY;
        });
    }

    updateTooltipText() {
        // TODO: make this better
        let matches = this.hovered.shelf.matches[this.hovered.partId];
        this.tooltip.textContent = JSON.stringify(matches);
    }
}
