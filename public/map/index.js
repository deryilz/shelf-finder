import { UserShelfMap } from "/scripts/ui/user-map.js";
import { showDialog, showSpinner } from "/scripts/ui/dialog.js";

import { parseBook } from "/scripts/parse.js";
import { matches } from "/scripts/match.js";

let canvas = document.getElementById("canvas");
let tooltip = document.getElementById("tooltip");

async function loadMap() {
    let params = new URLSearchParams(location.search);

    let schoolName = params.get("schoolName");
    let callNumber = params.get("callNumber");
    let sublocation = params.get("sublocation");

    if (!schoolName || !callNumber) {
        return showDialog("Invalid query parameters");
    }

    let book = parseBook(callNumber, sublocation);
    console.log("Book:", book);

    let res = await fetch("/api/get-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolName })
    });
    let json = await res.json();
    if (!json.success) {
        return showDialog("Couldn't get map", json.message);
    }

    let highlights = [];
    for (let shelf of json.map) {
        for (let i = 0; i < shelf.matches.length; i++) {
            if (shelf.matches[i].some(m => matches(m, book))) {
                highlights.push({ shelf, partId: i });
            }
        }
    }
    console.log("Highlights: ", highlights);

    let map = new UserShelfMap(canvas, json.map, tooltip, highlights);
    map.draw();

    window.map = map;

    if (highlights.length === 0) {
        let bookString = callNumber;
        if (sublocation) bookString += " [" + sublocation + "]"
        showDialog(
            "Couldn't find any shelves",
            "No shelves were found containing the following book:",
            bookString,
            "But don't fret! It's probably just a bug with this map. Consider asking a librarian for help."
        );
    } else if (highlights.length > 1) {
        showDialog(
            "Multiple shelves were found",
            "More than one shelf was found that might contain the book you're looking for.",
            "It's probably in one of those shelves. Remember, you can always ask a librarian if you need help!"
        );
    }
}

let spinner = showSpinner();
loadMap().catch((err) => {
    console.warn(err);
    showDialog(
        "Couldn't load map",
        err.message,
        "Consider submitting a bug report!"
    );
}).finally(() => spinner.remove());
