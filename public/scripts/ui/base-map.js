// TODO: strip unnecessary
import { rad, rotatePoint } from "../utils.js";
import { SHELF_SCHEMA } from "../shelf.js";

const SHELF_MARGIN = 0.2; // logical pixels
const ZOOM_FACTOR = 1.07;
const MIN_SCALE = 5;
const MAX_SCALE = 100;
const MIN_PADDING = 3; // logical pixels

const SHELF_COLOR = "#e58f65";
const SELECTED_COLOR = "#ac4444";

export class ShelfMap {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        // fix resize bug
        this.handleResize();

        this.onMouseMove = new Set();
        this.onMouseDown = new Set();
        this.onMouseUp = new Set();
        this.onClick = new Set();
        this.onChange = new Set();

        this.setShelves([]);

        this.handleMouse();
        this.handleHover();
    }

    setSelected(selected) {
        this.selected = selected;
    }

    setShelves(shelves) {
        this.setSelected([]);

        this.clearState();
        this.shelves = shelves;

        // center the shelves in the map so that they're all visible
        if (shelves.length > 0) {
            let xMin = Math.min(...shelves.map(s => s.x));
            let xMax = Math.max(...shelves.map(s => s.x));
            let yMin = Math.min(...shelves.map(s => s.y));
            let yMax = Math.max(...shelves.map(s => s.y));

            let { width, height } = this.canvas;

            // a lot of algebra was done for this
            this.scale = Math.min(
                width / (xMax - xMin + 2 * MIN_PADDING),
                height / (yMax - yMin + 2 * MIN_PADDING),
                MAX_SCALE
            );

            this.x = (xMax + xMin - width / this.scale) / 2;
            this.y = (yMax + yMin - height / this.scale) / 2;
        }

        this.draw();
    }

    clearState() {
        this.action = null;
        this.target = null;
        this.shade = false;
    }

    drawShelf(shelf, color, border = null, partId = null) {
        let x = this.scale * (shelf.x - this.x);
        let y = this.scale * (shelf.y - this.y);

        let schema = SHELF_SCHEMA.get(shelf.type);
        let width = this.scale * (schema.width - SHELF_MARGIN);
        let height = this.scale * (schema.height - SHELF_MARGIN);

        let part = { x: 0, y: 0, width: 1, height: 1 };
        if (partId !== null) part = schema.parts[partId];

        let props = [
            -width / 2 + part.x * width,
            -height / 2 + part.y * height,
            part.width * width,
            part.height * height
        ];

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

        for (let selected of this.selected) {
            this.drawShelf(selected.shelf, SELECTED_COLOR, null, selected.partId);
        }

        if (this.target) {
            let color = this.shade ? "rgba(0, 0, 0, 0.1)" : null;
            this.drawShelf(this.target.shelf, color, "#000000", this.target.partId);
        }
    }

    // make sure css scaling doesn't mess up canvas
    handleResize() {
        let fixCanvas = () => {
            let rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        };
        window.addEventListener("resize", () => {
            fixCanvas();
            this.draw();
        });
        fixCanvas();
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

            let schema = SHELF_SCHEMA.get(shelf.type);

            // coordinates relative to the shelf (as fractions from 0 to 1)
            // we ceil the schema height and width to avoid unexpected null targets
            let x = (coordTransform.x - shelfTransform.x) / Math.ceil(schema.width) + 0.5;
            let y = (coordTransform.y - shelfTransform.y) / Math.ceil(schema.height) + 0.5;

            for (let i = 0; i < schema.parts.length; i++) {
                let part = schema.parts[i];
                if (
                    part.x <= x && x <= part.x + part.width &&
                    part.y <= y && y <= part.y + part.height
                ) {
                    return { shelf, partId: i };
                }
            }
        }

        return null;
    }

    // this function essentially sets up all the listeners, like onClick
    // it also handles panning and zooming
    handleMouse() {
        let panning = false;
        let startMap = null;
        let startPixels = null;
        let validClick = false;

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
            if (event.target === this.canvas) {
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
                if (this.scale > MAX_SCALE) return;
                this.scale *= ZOOM_FACTOR;
            } else {
                if (this.scale < MIN_SCALE) return;
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
