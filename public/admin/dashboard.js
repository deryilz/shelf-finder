import { AdminShelfMap } from "/scripts/maps/admin-map.js";

import { MATCH_SCHEMA, defaultMatch } from "/scripts/match.js";
import { round } from "/scripts/utils.js";
import { SHELF_SCHEMA, blankShelf } from "/scripts/shelf.js";
import { parseValue } from "/scripts/parse.js";

let canvas = document.getElementById("canvas");
let sidebar = document.getElementById("sidebar");

class AdminDashboard {
    constructor() {
        this.fixCanvas();
        this.lastTarget = null;

        // TODO: change
        let shelves = JSON.parse(localStorage.shelves || "[]");

        this.map = new AdminShelfMap(canvas);
        this.map.setShelves(shelves);

        this.makeListeners();
    }

    makeListeners() {
        // TODO: temp
        onkeydown = (event) => {
            if (event.code === "KeyS" && event.ctrlKey) {
                event.preventDefault();
                localStorage.shelves = JSON.stringify(this.map.shelves);
                alert("Saved!");
            }
        }

        window.addEventListener("resize", () => {
            this.fixCanvas();
            this.map.draw();
        });

        this.map.onClick.add((mouse) => {
            let target = this.map.getTarget(mouse);
            if (target) this.render(target);
        });

        // TODO: autogen?
        let addShelf = document.getElementById("add-shelf");
        addShelf.addEventListener("click", () => {
            this.map.prepareToPlace(blankShelf("single"));
        });

        let addShelf2 = document.getElementById("add-shelf-2");
        addShelf2.addEventListener("click", () => {
            this.map.prepareToPlace(blankShelf("split"));
        });

        // TODO: add field
        window.addEventListener("beforeunload", () => this.unsavedChanges);
    }

    highlightPart(partId = null) {
        let containers = this.containers();
        for (let i = 0; i < containers.length; i++) {
            if (i === partId) {
                containers[i].classList.add("active");
            } else {
                containers[i].classList.remove("active");
            }
        }

        this.lastTarget.partId = partId;
        this.map.draw();
    }

    render(target) {
        this.lastTarget = target;

        if (target) {
            this.map.setSelected([target]);
            sidebar.classList.remove("hidden");
            this.renderSidebar(target.shelf);
            this.highlightPart(target.partId);
        } else {
            this.map.setSelected([]);
            sidebar.classList.add("hidden");
        }

        this.map.draw();
    }

    // css scaling messes up canvas, so fix it
    fixCanvas() {
        let rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    renderSidebar(shelf) {
        let shelfId = document.getElementById("shelf-id");
        shelfId.textContent = "#";
        shelfId.textContent += 1 + this.map.shelves.findIndex(s => s === shelf);

        let shelfAngle = document.getElementById("shelf-angle");
        shelfAngle.textContent = shelf.angle;

        let shelfSlider = document.getElementById("slider");
        shelfSlider.value = shelf.angle;
        shelfSlider.oninput = () => {
            shelfAngle.textContent = shelfSlider.value;
            shelf.angle = Number(shelfSlider.value);
            this.map.draw();
        };

        for (let container of this.containers()) {
            container.remove();
        }

        for (let i = 0; i < shelf.matches.length; i++) {
            this.addContainer(shelf, i);
            for (let match of shelf.matches[i]) {
                this.addMatchElement(match, shelf, i);
            }
        }

        let deleteShelf = document.getElementById("delete-shelf");
        deleteShelf.onclick = () => {
            let i = this.map.shelves.findIndex(s => s === shelf);
            this.map.shelves.splice(i, 1);
            this.render(null);
        };
    }

    containers() {
        return sidebar.querySelectorAll(".matches");
    }

    addContainer(shelf, partId) {
        let element = document.createElement("div");
        element.classList.add("matches");

        let schema = SHELF_SCHEMA.get(shelf.type);
        let header = document.createElement("div");
        header.classList.add("matches-header");
        header.textContent = schema.parts[partId].label;
        element.appendChild(header);

        let addContainer = document.createElement("div");
        addContainer.classList.add("add-match");

        let select = document.createElement("select");
        let addButton = document.createElement("button");
        addButton.classList.add("add-button");
        addButton.textContent = "+";

        for (let [key, val] of MATCH_SCHEMA) {
            let option = document.createElement("option");
            option.textContent = val.name;
            option.value = key;
            select.appendChild(option);
        }

        addButton.onclick = () => {
            let match = defaultMatch(select.value);
            shelf.matches[partId].push(match);
            this.addMatchElement(match, shelf, partId);
            this.highlightPart(partId);
        };

        addContainer.appendChild(select);
        addContainer.appendChild(addButton);
        element.appendChild(addContainer);

        let deleteShelf = document.getElementById("delete-shelf");
        sidebar.insertBefore(element, deleteShelf);
    }

    // adds match element, and set up listeners to modify the match
    addMatchElement(match, shelf, partId) {
        let schema = MATCH_SCHEMA.get(match.type);
        let matchList = shelf.parts[partId];

        let element = document.createElement("div");
        element.classList.add("match");

        let type = document.createElement("div");
        type.classList.add("match-type");
        type.textContent = schema.name;
        element.appendChild(type);

        let x = document.createElement("div");
        x.classList.add("x");
        x.textContent = "x";
        x.onclick = () => {
            let i = matchList.findIndex(m => m === match);
            matchList.splice(i, 1);
            element.remove();
        };
        element.appendChild(x);

        for (let [name, ty, desc] of schema.fields) {
            let label = document.createElement("div");
            let input = document.createElement("input");
            let error = document.createElement("div");
            error.classList.add("error");

            let showError = () => {
                try {
                    parseValue(input.value, ty);
                    input.classList.remove("error");
                    error.classList.add("hidden");
                } catch (e) {
                    input.classList.add("error");
                    error.classList.remove("hidden");
                    error.textContent = "ERROR: " + e.message;
                }
            }

            label.textContent = desc;
            input.value = match[name];

            showError();
            input.oninput = () => {
                match[name] = input.value;
                showError();
            };
            input.onfocus = () => {
                this.highlightPart(partId);
            };

            element.appendChild(label);
            element.appendChild(input);
            element.appendChild(error);
        }

        let container = this.containers()[partId];
        let addMatch = container.querySelector(".add-match");
        container.insertBefore(element, addMatch);
    }

    // whether any sidebar stuff has an error, which would prevent saving
    // could also be tracked via some property on this but i'm lazy
    hasError() {
        if (sidebar.classList.contains("hidden")) {
            return false;
        } else {
            return Boolean(sidebar.querySelector("input.error"));
        }
    }
}

window.admin = new AdminDashboard();

// TODO
function logOut() {
    localStorage.clear();
    location.replace("/admin");
}
