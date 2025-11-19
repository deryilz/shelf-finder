import { AdminShelfMap } from "/scripts/maps/admin-map.js";

import { MATCH_SCHEMA, defaultMatch } from "/scripts/match.js";
import { round } from "/scripts/utils.js";
import { blankShelf, isSplit, onlyPart } from "/scripts/shelf.js";
import { parseValue } from "/scripts/parse.js";

let canvas = document.getElementById("canvas");
let sidebar = document.getElementById("sidebar");

class AdminDashboard {
    constructor() {
        this.fixCanvas();
        this.lastTarget = null;

        // TODO: change
        let shelves = JSON.parse(localStorage.shelves ?? "[]");

        this.map = new AdminShelfMap(canvas);
        this.map.setShelves(shelves);

        this.makeListeners();
        this.initOptions();
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

        let addShelf = document.getElementById("add-shelf");
        addShelf.addEventListener("click", () => {
            this.map.prepareToPlace(blankShelf());
        });

        // TODO: add field
        window.addEventListener("beforeunload", () => this.unsavedChanges);
    }

    highlightPart(part = null) {
        // figure out part if there's only one option
        if (!isSplit(this.lastTarget.shelf)) {
            part = onlyPart(this.lastTarget.shelf);
        }

        for (let container of sidebar.querySelectorAll(".matches")) {
            container.classList.remove("active");
        }
        if (part) this.getContainer(part).classList.add("active");

        this.lastTarget.part = part;
        this.map.draw();
    }

    render(target) {
        this.lastTarget = target;

        if (target) {
            this.map.setSelected([target]);
            sidebar.classList.remove("hidden");
            this.renderSidebar(target.shelf);
            this.highlightPart(target.part);
        } else {
            this.map.setSelected([]);
            sidebar.classList.add("hidden");
        }

        this.map.draw();
    }

    initOptions() {
        for (let select of document.querySelectorAll("select")) {
            for (let [key, val] of MATCH_SCHEMA) {
                let option = document.createElement("option");
                option.textContent = val.name;
                option.value = key;
                select.appendChild(option);
            }
        }
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

        for (let part of ["front", "back"]) {
            let container = this.getContainer(part);

            for (let match of container.querySelectorAll(".match")) {
                match.remove();
            }

            let matchList = shelf[part];
            for (let match of matchList) {
                this.addMatchElement(part, match, matchList);
            }

            container.querySelector(".add-button").onclick = () => {
                let type = container.querySelector("select").value;
                let match = defaultMatch(type);
                matchList.push(match);
                this.addMatchElement(part, match, matchList);
                this.highlightPart(part);
            };
        }

        let deleteShelf = document.getElementById("delete-shelf");
        deleteShelf.onclick = () => {
            let i = this.map.shelves.findIndex(s => s === shelf);
            this.map.shelves.splice(i, 1);
            this.render(null);
        };
    }

    getContainer(part) {
        return document.getElementById(part + "-matches");
    }

    // adds match element to the container (front-matches or back-matches)
    // listeners are set up to modify the match and matchList
    addMatchElement(part, match, matchList) {
        let schema = MATCH_SCHEMA.get(match.type);

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
            this.highlightPart(part);
        };
        element.appendChild(x);

        for (let [name, ty, desc] of schema.fields) {
            let label = document.createElement("div");
            let input = document.createElement("input");
            let error = document.createElement("div");
            error.classList.add("error");

            // TODO: update this?
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
                this.highlightPart(part);
            };

            element.appendChild(label);
            element.appendChild(input);
            element.appendChild(error);
        }

        // insert element at the end (before the "add match" section)
        let container = this.getContainer(part);
        let addMatch = container.querySelector(".add-match");
        container.insertBefore(element, addMatch);
    }

    // whether any sidebar stuff has an error, which would prevent saving
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
