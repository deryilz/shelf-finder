export function round(x) {
    return Math.round(x * 1e5) / 1e5;
}

function rad(deg) {
    return Math.PI * deg / 180;
}

function rotatePoint(point, rad = 0) {
    let sin = Math.sin(rad);
    let cos = Math.cos(rad);
    return {
        x: round(cos * point.x - sin * point.y),
        y: round(sin * point.x + cos * point.y)
    };
}

function roundPoint(shelf, rad = 0) {
    let rotatedBack = rotatePoint(shelf, -rad);
    let rounded = {
        x: Math.round(rotatedBack.x),
        y: Math.round(rotatedBack.y)
    };
    let rotated = rotatePoint(rounded, rad);
    return {
        x: round(rotated.x),
        y: round(rotated.y)
    };
}

export class Map {
    constructor(canvas, shelves, draggingEnabled = false) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.shelves = shelves;

        // todo: give the user options for this
        this.x = -5;
        this.y = -5;
        this.scale = 20; // pixels per "virtual" coord

        this.clickListeners = [];
        this.moveListeners = [];

        this.zoomSpeed = 1.07;
        this.draggingEnabled = draggingEnabled;

        this.handleMouse();
        this.draw();
    }

    drawShelf(shelf, color = "#000000", border = null, part = null) {
        let x = this.scale * (shelf.x - this.x);
        let y = this.scale * (shelf.y - this.y);
        // TODO: move subtraction to debug
        let width = this.scale * (shelf.width - 0.2);
        let height = this.scale * (shelf.height - 0.2);

        let props;
        if (part === "front") {
            props = [-width / 2, 0, width / 2, height / 2];
        } else if (part === "back") {
            props = [-width / 2, -height / 2, -height / 2, width, height / 2];
        } else {
            props = [-width / 2, -height / 2, width, height];
        }

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rad(shelf.angle));

        this.ctx.fillStyle = color;
        this.ctx.fillRect(...props);
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
            this.drawShelf(shelf, "#e58f65");
        }
    }

    drawTarget(target) {
        if (!target) return;

        this.drawShelf(target.shelf, "#d05353", "#000000", target.part);
    }

    getMousePixels(event) {
        let canvasLocation = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - canvasLocation.x,
            y: event.clientY - canvasLocation.y
        };
    }

    // returns the logical location, not the pixels
    getMouseLocation(event) {
        let mousePixels = this.getMousePixels(event);
        return {
            x: mousePixels.x / this.scale + this.x,
            y: mousePixels.y / this.scale + this.y
        };
    }

    getTarget(coord) {
        for (let shelf of this.shelves) {
            let mouseTransform = rotatePoint(coord, -rad(shelf.angle));
            let shelfTransform = rotatePoint(shelf, -rad(shelf.angle));

            let dx = Math.abs(mouseTransform.x - shelfTransform.x);
            let dy = Math.abs(mouseTransform.y - shelfTransform.y);
            // TODO: part
            if (dx < shelf.width / 2 && dy < shelf.height / 2) {
                return { shelf };
            }
        }
        return null;
    }

    // TODO: change cursor
    handleMouse() {
        let target, clicking, moved, start;

        reset();
        function reset() {
            target = null;
            clicking = false;
            moved = false;
            start = {
                mousePixels: null,
                mouse: null,
                map: null,
                shelf: null,
            };
        };

        this.canvas.addEventListener("mousedown", (event) => {
            clicking = true;

            start.mousePixels = this.getMousePixels(event);
            start.mouse = this.getMouseLocation(event);
            start.map = { x: this.x, y: this.y };

            target = this.getTarget(start.mouse);
            if (target) {
                start.shelf = { x: target.shelf.x, y: target.shelf.y };
            }

            this.draw();
            this.drawTarget(target);
        });

        document.addEventListener("mousemove", (event) => {
            if (!clicking) return;

            let mouse = this.getMouseLocation(event);
            let pixels = this.getMousePixels(event);

            // just drag canvas, don't move any shelves
            if (!target) {
                this.x = start.map.x - (pixels.x - start.mousePixels.x) / this.scale;
                this.y = start.map.y - (pixels.y - start.mousePixels.y) / this.scale;
                this.draw();
                return;
            }

            if (!this.draggingEnabled) return;

            let newShelf = roundPoint({
                x: mouse.x - start.mouse.x + start.shelf.x,
                y: mouse.y - start.mouse.y + start.shelf.y
            }, rad(target.shelf.angle));

            if (newShelf.x !== target.shelf.x || newShelf.y !== target.shelf.y) {
                moved = true;
            }

            target.shelf.x = newShelf.x;
            target.shelf.y = newShelf.y;
            this.draw();
            this.drawTarget(target);
        });


        this.canvas.addEventListener("mousemove", (event) => {
            if (clicking && !target) return;

            let mouse = this.getMouseLocation(event);
            for (let listener of this.moveListeners) {
                listener(mouse);
            }
        });

        this.canvas.addEventListener("wheel", (event) => {
            event.preventDefault();

            let diff = event.deltaY;
            if (!diff) return;

            let mouse = this.getMouseLocation(event);

            if (diff < 0) {
                if (this.scale > 100) return;
                this.scale *= this.zoomSpeed;
            } else {
                if (this.scale < 5) return;
                this.scale /= this.zoomSpeed;
            }

            let newMouse = this.getMouseLocation(event);

            this.x += mouse.x - newMouse.x;
            this.y += mouse.y - newMouse.y;

            this.draw();
        }, { passive: false });

        document.addEventListener("mouseup", () => {
            clicking = false;

            if (target && !moved) {
                for (let listener of this.clickListeners) {
                    listener(target);
                }
            }

            reset();
            this.draw();
        });
    }
}
