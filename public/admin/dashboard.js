import { AdminShelfMap } from "/scripts/ui/admin-map.js";
import { showDialog } from "/scripts/ui/dialog.js";

import { MATCH_SCHEMA, defaultMatch } from "/scripts/match.js";
import { SHELF_SCHEMA, blankShelf } from "/scripts/shelf.js";
import { parseValue } from "/scripts/parse.js";

let canvas = document.getElementById("canvas");
let sidebar = document.getElementById("sidebar");
let saveButton = document.getElementById("save");

class AdminDashboard {
    constructor() {
        this.selected = null;

        this.lastAngle = 0;
        this.lastMatchType = null;

        if (!localStorage.token) {
            this.logOut();
        }

        this.map = new AdminShelfMap(canvas);

        this.getShelves().then((shelves) => {
            this.lastSave = JSON.stringify(shelves);
            this.map.setShelves(shelves);
            this.makeListeners();
        }).catch((err) => {
            showDialog("Error in getting map", err.message);
        });
    }

    // TODO: update both functions of course
    async getShelves() {
        return JSON.parse(localStorage.shelves || "[]");
    }

    async saveShelves() {
        localStorage.shelves = JSON.stringify(this.map.shelves);
    }

    makeListeners() {
        // TODO: change to use server
        saveButton.addEventListener("click", (event) => {
            if (this.hasError()) {
                showDialog("Failed!", "There are errors in your selected shelf. Fix them before saving.");
                return;
            }

            this.saveShelves().then(() => {
                this.lastSave = JSON.stringify(this.map.shelves);
                this.render(false);

                showDialog("Saved!", "Your map has been saved.");
            }).catch((err) => {
                showDialog("Failed!", "Failed to save map: " + err.message);
            })
        });

        window.addEventListener("beforeunload", (event) => {
            if (this.hasUnsavedChanges()) {
                event.preventDefault();
            }
        });

        this.map.onClick.add((mouse) => {
            let target = this.map.getTarget(mouse);

            // user clicking on a non-shelf shouldn't close the sidebar
            if (target && this.trySelecting(target)) {
                this.render();
            }
        });

        let place = (type) => {
            this.map.prepareToPlace({
                ...blankShelf(type),
                angle: this.lastAngle,
            });
        };

        let closeSidebar = document.getElementById("close-sidebar");
        closeSidebar.addEventListener("click", () => {
            if (this.trySelecting(null)) this.render();
        });

        // TODO: autogen?
        let addShelf = document.getElementById("add-shelf");
        addShelf.addEventListener("click", () => place("single"));

        let addShelf2 = document.getElementById("add-shelf-2");
        addShelf2.addEventListener("click", () => place("split"));

        this.map.onChange.add(() => {
            this.render(false);
        });
    }

    hasUnsavedChanges() {
        if (!this.lastSave) return false;
        return JSON.stringify(this.map.shelves) !== this.lastSave;
    }

    hasError() {
        if (!this.selected) return false;

        for (let match of this.selected.shelf.matches.flat()) {
            let schema = MATCH_SCHEMA.get(match.type);
            for (let [name, ty, _] of schema.fields) {
                try {
                    parseValue(match[name], ty);
                } catch {
                    return true;
                }
            }
        }

        return false;
    }

    trySelecting(selected) {
        if (this.hasError()) {
            showDialog("Warning", "There are errors in your previously selected shelf that must be fixed.");
            return false;
        } else {
            this.selected = selected;
            return true;
        }
    }

    render(renderSidebar = true) {
        // toggle save button
        saveButton.classList.toggle("hidden", !this.hasUnsavedChanges());

        if (!this.selected) {
            this.map.setSelected([]);
            this.map.draw();
            sidebar.classList.add("hidden");
            return;
        }

        this.map.setSelected([this.selected]);
        if (renderSidebar) {
            this.renderSidebar(this.selected.shelf);
        }
        sidebar.classList.remove("hidden");

        // highlight correct part
        let containers = this.containers();
        for (let i = 0; i < containers.length; i++) {
            containers[i].classList.toggle("active", i === this.selected.partId);
        }

        this.map.draw();
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
            this.lastAngle = shelf.angle;
            this.render(false);
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
            if (this.trySelecting(null)) this.render();
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

        if (this.lastMatchType) {
            select.value = this.lastMatchType;
        }

        select.oninput = () => {
            this.lastMatchType = select.value;
        };

        addButton.onclick = () => {
            let match = defaultMatch(select.value);
            shelf.matches[partId].push(match);
            this.addMatchElement(match, shelf, partId);
            this.selected.partId = partId;
            this.render(false);
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
            let matches = shelf.matches[partId];
            let i = matches.findIndex(m => m === match);
            matches.splice(i, 1);
            element.remove();
            this.render(false);
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
                this.selected.partId = partId;
                this.render(false);
            };

            element.appendChild(label);
            element.appendChild(input);
            element.appendChild(error);
        }

        let container = this.containers()[partId];
        let addMatch = container.querySelector(".add-match");
        container.insertBefore(element, addMatch);
    }

    logOut() {
        localStorage.clear();
        location.replace("/admin");
    }
}

window.admin = new AdminDashboard();
