import { ShelfMap } from "./base-map.js";
import { info } from "../match.js";

const HIGHLIGHT_COLOR = "#7a2634";
const TOOLTIP_DISTANCE = 5;

export class UserShelfMap extends ShelfMap {
    constructor(canvas, shelves, tooltip, highlights) {
        super(canvas, shelves);

        this.tooltip = tooltip;
        this.highlights = highlights;

        this.handleHover();
        this.handleMouseMove();
    }

    // override
    draw() {
        super.draw();

        for (let highlight of this.highlights) {
            this.drawShelf(highlight.shelf, HIGHLIGHT_COLOR, null, highlight.partId);
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
        this.tooltip.textContent = "";

        let { shelf, partId } = this.hovered;
        let matches = shelf.matches[partId];

        let lines = [];
        let warning = false;

        if (this.highlights.some(h => h.partId === partId && h.shelf === shelf)) {
            lines.push("Your book is likely in this shelf!");
            warning = true;
        }

        if (matches.length === 0) {
            lines.push("No info for this shelf.");
        } else {
            lines.push("This shelf contains the following:");
        }

        for (let match of matches) {
            lines.push("- " + info(match));
        }

        let heading = document.createElement("div");
        heading.classList.add(warning ? "warning" : "heading");
        heading.textContent = lines[0];
        this.tooltip.appendChild(heading);

        // continue only if there are more lines
        if (lines.length < 2) return;

        let rest = document.createElement("div");
        rest.classList.add("rest");
        this.tooltip.appendChild(rest);

        for (let line of lines.slice(1)) {
            let div = document.createElement("div");
            div.textContent = line;
            rest.appendChild(div);
        }
    }
}
