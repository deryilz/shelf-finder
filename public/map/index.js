import { UserShelfMap } from "/scripts/ui/user-map.js";
import { showDialog, showSpinner } from "/scripts/ui/dialog.js";

import { parseBook } from "/scripts/parse.js";
import { matches } from "/scripts/match.js";

let canvas = document.getElementById("canvas");

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

    let map = new UserShelfMap(canvas, json.map);
    window.map = map;

    for (let shelf of map.shelves) {
        for (let i = 0; i < shelf.matches.length; i++) {
            console.log({ shelf, partId: i });
            if (shelf.matches[i].some(m => matches(m, book))) {
                console.log("Matched book!", shelf.matches[i]);
                map.matches.push({ shelf, partId: i });
            }
        }
    }

    map.draw();

    if (map.matches.length === 0) {
        showDialog(
            "Couldn't find any shelves",
            "No shelves were found containing the following book:",
            JSON.stringify([callNumber, sublocation].filter(x => x), null, 1),
            "But don't fret! It's probably just a bug with this map. Consider asking a librarian for help."
        );
    } else if (map.matches.length > 1) {
        showDialog(
            "Multiple shelves were found",
            "More than one shelf was found that might contain the book you're looking for.",
            "It's probably in one of those shelves. Remember, you can always ask a librarian if you need help!"
        );
    }
}

window.addEventListener("error", (event) => {
    showDialog(
        "Super unexpected error",
        event.error.message,
        "Please file a bug report!"
    );
}, true);

let spinner = showSpinner();
loadMap().catch((err) => {
    showDialog(
        "Couldn't load map",
        err.message,
        "Your school might not be supported. Consider submitting a bug report!"
    );
}).finally(() => spinner.remove());
