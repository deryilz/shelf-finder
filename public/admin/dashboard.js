import { shelves } from "./shelves-test.js";

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

let coords = document.getElementById("coords");

// the coordinates in this system are described virtually and scaled later.
let view = {
    x: -5,
    y: -5,
    scale: 20 // pixels per "virtual" coord
};

function rad(deg) {
    return Math.PI * deg / 180;
}

function round(x) {
    return Math.round(x * 1e5) / 1e5;
}

function rotatePoint(point, rad = 0) {
    let sin = Math.sin(rad);
    let cos = Math.cos(rad);
    return {
        x: round(cos * point.x - sin * point.y),
        y: round(sin * point.x + cos * point.y)
    };
}

function roundPoint(point, rad = 0) {
    let rotatedBack = rotatePoint(point, -rad);
    let rounded = {
        x: Math.round(rotatedBack.x),
        y: Math.round(rotatedBack.y)
    };
    return rotatePoint(rounded, rad);
}

function drawShelf(shelf) {
    // TODO: move these to debug
    let realWidth = shelf.width - 0.2;
    let realHeight = shelf.height - 0.2;

    let x = view.scale * (shelf.x - view.x);
    let y = view.scale * (shelf.y - view.y);
    let width = view.scale * realWidth;
    let height = view.scale * realHeight;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rad(shelf.angle));
    ctx.fillRect(-width / 2, -height / 2, width, height);
    ctx.restore();
}

function draw(previewShelf) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#e58f65";
    for (let shelf of shelves) {
        if (shelf !== previewShelf) {
            drawShelf(shelf);
        }
    }

    if (previewShelf) {
        ctx.fillStyle = "#565656";
        drawShelf(previewShelf);
    }
}

// from pixel coord to logical coord
function getLogicalCoord(mouse) {
    return {
        x: mouse.x / view.scale + view.x,
        y: mouse.y / view.scale + view.y
    }
}

// get the shelf that is being hovered over, or null
function getTarget(mouse) {
    let logical = getLogicalCoord(mouse);
    for (let shelf of shelves) {
        let mouseTransform = rotatePoint(logical, -rad(shelf.angle));
        let shelfTransform = rotatePoint(shelf, -rad(shelf.angle));

        let dx = Math.abs(mouseTransform.x - shelfTransform.x);
        let dy = Math.abs(mouseTransform.y - shelfTransform.y);
        if (dx < shelf.width / 2 && dy < shelf.height / 2) {
            return shelf;
        }
    }
    return null;
}

// todo: change cursor
function handleMouse() {
    let zoomSpeed = 1.05;

    let clicking = false;
    let start = {};
    let startView = {};
    let target = null;
    let targetOffset = {};

    canvas.addEventListener("mousedown", (event) => {
        clicking = true;
        start = { x: event.offsetX, y: event.offsetY };
        startView = { x: view.x, y: view.y };
        target = getTarget(start);

        if (target) {
            let logical = getLogicalCoord(start);
            targetOffset = {
                x: logical.x - target.x,
                y: logical.y - target.y
            };
            draw(target);
        }
    });

    document.addEventListener("mousemove", (event) => {
        if (!clicking) return;

        let canvasLocation = canvas.getBoundingClientRect();
        let mouse = {
            x: event.clientX - canvasLocation.left,
            y: event.clientY - canvasLocation.top
        };
        let logical = getLogicalCoord(mouse);

        if (target) {
            let newLocation = {
                x: logical.x - targetOffset.x,
                y: logical.y - targetOffset.y
            };
            let rounded = roundPoint(newLocation, rad(target.angle));
            target.x = rounded.x;
            target.y = rounded.y;
            draw(target);
        } else {
            let dx = (mouse.x - start.x) / view.scale;
            let dy = (mouse.y - start.y) / view.scale;
            view.x = startView.x - dx;
            view.y = startView.y - dy;
            draw();
        }
    });

    canvas.addEventListener("mousemove", (event) => {
        if (clicking && !target) return;

        let mouse = { x: event.offsetX, y: event.offsetY };
        let logical = getLogicalCoord(mouse);
        coords.textContent = `(${round(logical.x)}, ${round(logical.y)})`;
    });

    canvas.addEventListener("wheel", (event) => {
        event.preventDefault();

        let diff = event.deltaY;
        if (!diff) return;

        let mouse = { x: event.offsetX, y: event.offsetY };
        let logical = getLogicalCoord(mouse);

        if (diff < 0) {
            if (view.scale > 100) return;
            view.scale *= zoomSpeed;
        } else {
            if (view.scale < 5) return;
            view.scale /= zoomSpeed;
        }

        view.x = logical.x - (mouse.x / view.scale);
        view.y = logical.y - (mouse.y / view.scale);

        draw();
    }, { passive: false });

    document.addEventListener("mouseup", () => {
        clicking = false;
        target = null;
        draw();
    });
}

handleMouse();
draw();

window.draw = draw;
window.ctx = ctx;
