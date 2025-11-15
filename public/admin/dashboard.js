import { AdminShelfMap } from "/scripts/maps/admin-map.js";

import { round } from "/scripts/utils.js";
import { blankShelf, getMatches, shelves } from "/scripts/shelf.js";

let canvas = document.getElementById("canvas");

let sidebar = document.getElementById("sidebar");
let shelfId = document.getElementById("shelf-id");
let shelfAngle = document.getElementById("shelf-angle");
let shelfSlider = document.getElementById("slider");

class AdminDashboard {
    constructor() {
        this.fixCanvas();
        this.lastClicked = null;

        this.map = new AdminShelfMap(canvas);
        this.map.setShelves(shelves);

        this.makeListeners();
    }

    makeListeners() {
        window.addEventListener("resize", () => {
            this.fixCanvas();
            this.render();
        });

        // let coords = document.getElementById("coords");
        // this.map.onMouseMove.add((mouse) => {
        //     coords.textContent = `(${round(mouse.x)}, ${round(mouse.y)})`;
        // });

        this.map.onClick.add((mouse) => {
            let target = this.map.getTarget(mouse);
            if (target) this.lastClicked = target;
            this.render();
        });

        let addShelf = document.getElementById("add-shelf");
        addShelf.addEventListener("click", () => {
            this.map.prepareToPlace(blankShelf());
        });

        shelfSlider.addEventListener("input", () => {
            let shelf = this.lastClicked.shelf;
            shelfAngle.textContent = shelfSlider.value;
            shelf.angle = Number(shelfSlider.value);
            this.map.draw();
        });

        let deleteShelf = document.getElementById("delete-shelf");
        deleteShelf.addEventListener("click", () => {
            let shelf = this.lastClicked.shelf;
            let i = this.map.shelves.findIndex(s => s === shelf);
            this.map.shelves.splice(i, 1);
            this.lastClicked = null;
            this.render();
        });

        // TODO: add field
        window.addEventListener("beforeunload", () => this.unsavedChanges);
    }

    // css scaling messes up canvas, so fix it
    fixCanvas() {
        let rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    render() {
        console.log("admin page render")

        if (this.lastClicked) {
            let { shelf, part } = this.lastClicked;
            let matches = getMatches(shelf, part);

            shelfId.textContent = 1 + this.map.shelves.findIndex(s => s === shelf);
            shelfAngle.textContent = shelf.angle;
            shelfSlider.value = shelf.angle;

            sidebar.classList.remove("hidden");
            this.map.selected = [this.lastClicked];
        } else {
            sidebar.classList.add("hidden");
            this.map.selected = [];
        }

        this.map.draw();
    }
}

(window.admin=new AdminDashboard()).render();

// TODO
function logOut() {
    localStorage.clear();
    location.replace("/admin");
}
