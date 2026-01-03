import { AdminShelfMap } from "/scripts/ui/admin-map.js";
import { showDialog, showSpinner } from "/scripts/ui/dialog.js";

import { MATCH_SCHEMA, defaultMatch } from "/scripts/match.js";
import { SHELF_SCHEMA, blankShelf } from "/scripts/shelf.js";
import { parseValue } from "/scripts/parse.js";

let canvas = document.getElementById("canvas");
let sidebar = document.getElementById("sidebar");
let saveButton = document.getElementById("save");

class AdminDashboard {
    constructor() {
        this.lastAngle = 0;
        this.lastMatchType = null;

        if (!localStorage.token) return this.logOut();

        let spinner = showSpinner();
        this.getShelves().then((shelves) => {
            console.log("Got shelves", shelves);
            this.lastSave = JSON.stringify(shelves);
            this.map = new AdminShelfMap(canvas, shelves);
            this.makeListeners();
            this.render();
        }).catch((err) => {
            showDialog("Error while getting map", err.message);
        }).finally(() => spinner.remove());
    }

    // TODO: update both functions of course
    async getShelves() {
        let res = await fetch("/api/map-versions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: localStorage.token,
            }),
        });
        let json = await res.json();
        if (json.success) {
            return json.versions[json.versions.length - 1].map;
        } else {
            throw new Error("Unknown server error.");
        }
    }

    async saveShelves() {
        let res = await fetch("/api/add-map", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: localStorage.token,
                map: this.map.shelves
            }),
        });
        let json = await res.json();
        if (!json.success) {
            throw new Error("Unknown server error.");
        }
    }

    makeListeners() {
        // TODO: change to use server
        saveButton.addEventListener("click", (event) => {
            if (this.map.hasError()) {
                return showDialog(
                    "Failed!",
                    "There are errors in your selected shelf. Please fix them before saving."
                );
            }

            let spinner = showSpinner();
            this.saveShelves().then(() => {
                this.lastSave = JSON.stringify(this.map.shelves);
                this.render(false);

                showDialog("Saved!", "Your map has been saved.");
            }).catch((err) => {
                showDialog("Failed!", "Failed to save map: " + err.message);
            }).finally(() => spinner.remove());
        });

        window.addEventListener("beforeunload", (event) => {
            if (this.hasUnsavedChanges()) {
                event.preventDefault();
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
            this.map.select(null);
        });

        let addShelf = document.getElementById("add-shelf");
        addShelf.addEventListener("click", () => place("single"));

        let addShelf2 = document.getElementById("add-shelf-2");
        addShelf2.addEventListener("click", () => place("split"));

        this.map.onEdit.add(() => {
            this.render(false);
        });

        this.map.onSelect.add(() => {
            this.render();
        });

        this.map.onInvalid.add(() => {
            showDialog(
                "Hold on!",
                "There are errors in your currently selected shelf. Please fix them first.",
            );
        });
    }

    hasUnsavedChanges() {
        if (!this.lastSave) return false;
        return JSON.stringify(this.map.shelves) !== this.lastSave;
    }

    render(updateSidebar = true) {
        // toggle save button
        saveButton.classList.toggle("hidden", !this.hasUnsavedChanges());

        this.map.draw();

        let selected = this.map.selected;
        if (!selected) return sidebar.classList.add("hidden");

        if (updateSidebar) this.renderSidebar(selected.shelf);
        sidebar.classList.remove("hidden");

        // highlight correct part
        let containers = this.containers();
        for (let i = 0; i < containers.length; i++) {
            containers[i].classList.toggle("active", i === selected.partId);
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
            this.createContainer(shelf, i);
            for (let match of shelf.matches[i]) {
                this.addMatchElement(match, shelf, i);
            }
        }

        let deleteShelf = document.getElementById("delete-shelf");
        deleteShelf.onclick = () => {
            let i = this.map.shelves.findIndex(s => s === shelf);
            this.map.shelves.splice(i, 1);
            this.map.select(null);
            this.render();
        };
    }

    containers() {
        return sidebar.querySelectorAll(".matches");
    }

    createContainer(shelf, partId) {
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
            this.map.selected.partId = partId;
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
            };

            label.textContent = desc;
            input.value = match[name];

            showError();
            input.oninput = () => {
                match[name] = input.value;
                showError();
                this.render(false);
            };
            input.onfocus = () => {
                this.map.selected.partId = partId;
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

window.addEventListener("error", (event) => {
    showDialog(
        "Super unexpected error",
        event.error.message,
        "Please file a bug report!"
    );
}, true);

window.admin = new AdminDashboard();
