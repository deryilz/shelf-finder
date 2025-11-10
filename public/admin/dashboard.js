import { Map, round } from "/scripts/map.js";
import { shelves } from "./shelves-test.js";

let canvas = document.getElementById("canvas");
let coords = document.getElementById("coords");

let map = new Map(canvas, shelves, true);
map.moveListeners.push((mouse) => {
    coords.textContent = `(${round(mouse.x)}, ${round(mouse.y)})`;
});
map.clickListeners.push((target) => {
    console.log(target);
});
