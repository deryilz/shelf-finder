import { AdminShelfMap, round } from "/scripts/shelf-map.js";
import { blankShelf, shelves } from "/scripts/shelf.js";

let canvas = document.getElementById("canvas");
let coords = document.getElementById("coords");

let map = new AdminShelfMap(canvas);
map.init(shelves);
map.onMouseMove.add((mouse) => {
    coords.textContent = `(${round(mouse.x)}, ${round(mouse.y)})`;
});
map.onClick.add((mouse) => {
    let target = map.getTarget(mouse);
    if (!target) return;

    document.getElementById("temp").textContent=
        `Clicked shelf: ${JSON.stringify(target.shelf,null,1)} at part ${target.part}`;
});

for (let prop of ["onClick", "onMouseDown", "onMouseUp"]) {
    map[prop].add(mouse => console.log(prop, mouse))
}

// remove
document.querySelector("button").onclick = () => {
    map.prepareToPlace(blankShelf());
}

window.map = map;
