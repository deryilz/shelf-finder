// TODO: strip unnecessary
import { rad, rotatePoint } from "../utils.js";
import { isSplit } from "../shelf.js";

const SHELF_MARGIN = 0.2; // logical pixels
const ZOOM_FACTOR = 1.07;

const SHELF_COLOR = "#e58f65";
const SELECTED_COLOR = "#ac4444";

export class ShelfMap {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.onMouseMove = new Set();
        this.onMouseDown = new Set();
        this.onMouseUp = new Set();
        this.onClick = new Set();

        this.setShelves([]);

        this.handleMouse();
        this.handleHover();
    }

    setSelected(selected) {
        this.selected = selected;
    }

    // TODO: center
    setShelves(shelves, center = false) {
        this.setSelected([]);

        this.clearState();
        this.shelves = shelves;

        this.x = -5;
        this.y = -5;
        this.scale = 20;

        this.draw();
    }

    clearState() {
        this.action = null;
        this.target = null;
        this.shade = false;
    }

    // if part is null, the whole shelf will be drawn
    drawShelf(shelf, color, border = null, part = null) {
        let x = this.scale * (shelf.x - this.x);
        let y = this.scale * (shelf.y - this.y);

        let width = this.scale * (shelf.width - SHELF_MARGIN);
        let height = this.scale * (shelf.height - SHELF_MARGIN);

        let props;
        if (!part || !isSplit(shelf)) {
            props = [-width / 2, -height / 2, width, height];
        } else if (part === "front") {
            props = [0, -height / 2, width / 2, height];
        } else if (part === "back") {
            props = [-width / 2, -height / 2, width / 2, height];
        }

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rad(shelf.angle));

        if (color) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(...props);
        }

        if (border) {
            this.ctx.lineWidth = this.scale / 20;
            this.ctx.strokeStyle = border;
            this.ctx.strokeRect(...props);
        }

        this.ctx.restore();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let shelf of this.shelves) {
            this.drawShelf(shelf, SHELF_COLOR);
        }

        for (let shelf of this.selected) {
            this.drawShelf(shelf.shelf, SELECTED_COLOR, null, shelf.part);
        }

        if (this.target) {
            let color = this.shade ? "rgba(0, 0, 0, 0.1)" : null;
            this.drawShelf(this.target.shelf, color, "#000000", this.target.part);
        }
    }

    getMousePixels(event) {
        let rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.x,
            y: event.clientY - rect.y
        };
    }

    // returns the logical location, not the pixel location
    getMouse(event) {
        let mousePixels = this.getMousePixels(event);
        return {
            x: mousePixels.x / this.scale + this.x,
            y: mousePixels.y / this.scale + this.y
        };
    }

    getTarget(coord) {
        // reverse, so that recently placed shelves appear above other ones
        for (let shelf of this.shelves.toReversed()) {
            let coordTransform = rotatePoint(coord, -rad(shelf.angle));
            let shelfTransform = rotatePoint(shelf, -rad(shelf.angle));

            let dx = coordTransform.x - shelfTransform.x;
            let dy = coordTransform.y - shelfTransform.y;

            if (Math.abs(dy) > shelf.height / 2) continue;

            if (isSplit(shelf)) {
                if (dx < 0 && dx >= -shelf.width / 2) {
                    return { shelf, part: "back" };
                } else if (dx >= 0 && dx <= shelf.width / 2) {
                    return { shelf, part: "front" };
                }
            } else {
                if (Math.abs(dx) <= shelf.width / 2) {
                    return { shelf, part: "front" };
                }
            }
        }

        return null;
    }

    // this function essentially sets up all the listeners, like onClick
    // it also handles panning and zooming
    handleMouse() {
        let hovering = true;

        let panning = false;
        let startMap = null;
        let startPixels = null;
        let validClick = false;

        this.canvas.addEventListener('mouseenter', () => {
            hovering = true;
        });

        this.canvas.addEventListener('mouseleave', () => {
            hovering = false;
        });

        this.canvas.addEventListener("mousedown", (event) => {
            let mouse = this.getMouse(event);

            if (!this.getTarget(mouse)) {
                panning = true;
                startMap = { x: this.x, y: this.y };
            }

            for (let listener of this.onMouseDown) {
                listener(mouse);
            }

            startPixels = this.getMousePixels(event);
            validClick = true;

            this.draw();
        });

        this.canvas.addEventListener("mousemove", (event) => {
            if (panning) return;

            let mouse = this.getMouse(event);
            for (let listener of this.onMouseMove) {
                listener(mouse);
            }

            this.draw();
        });

        document.addEventListener("mousemove", (event) => {
            let pixels = this.getMousePixels(event);
            if (startPixels && (pixels.x !== startPixels.x || pixels.y !== startPixels.y)) {
                validClick = false;
            }

            if (panning) {
                this.x = startMap.x - (pixels.x - startPixels.x) / this.scale;
                this.y = startMap.y - (pixels.y - startPixels.y) / this.scale;

                this.draw();
            }
        });

        document.addEventListener("mouseup", (event) => {
            let mouse = this.getMouse(event);

            for (let listener of this.onMouseUp) {
                listener(mouse);
            }

            if (validClick) {
                for (let listener of this.onClick) {
                    listener(mouse);
                }
            }

            // trigger a mouseMove too, if the mouse was in bounds
            if (hovering) {
                for (let listener of this.onMouseMove) {
                    listener(mouse);
                }
            }

            panning = false;
            validClick = false;
            startPixels = null;
            startMap = null;

            this.draw();
        });

        // scroll to zoom
        this.canvas.addEventListener("wheel", (event) => {
            event.preventDefault();

            let diff = event.deltaY;
            if (!diff) return;

            let mouse = this.getMouse(event);

            if (diff < 0) {
                if (this.scale > 100) return;
                this.scale *= ZOOM_FACTOR;
            } else {
                if (this.scale < 5) return;
                this.scale /= ZOOM_FACTOR;
            }

            let newMouse = this.getMouse(event);

            this.x += mouse.x - newMouse.x;
            this.y += mouse.y - newMouse.y;

            this.draw();
        }, { passive: false });
    }

    handleHover() {
        this.onMouseMove.add((mouse) => {
            let target = this.getTarget(mouse);
            if (!this.action && target) {
                this.action = "hovering";
                this.target = target;
                this.shade = false;
            } else if (this.action === "hovering" && this.target !== target) {
                this.target = target;
            } else if (this.action === "hovering" && !target) {
                this.clearState();
            }
        });
    }
}
