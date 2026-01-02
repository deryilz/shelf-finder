import { ShelfMap } from "/scripts/ui/base-map.js";
import { showDialog } from "/scripts/ui/dialog.js";

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

    let res = await fetch("https://api.shelf-finder.com/get-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolName })
    });
    let json = await res.json();
    if (!json.success) {
        return showDialog("Couldn't get map", json.message);
    }

    let map = new ShelfMap(canvas);
    map.setShelves(json.map);

    let selected = [];
    for (let shelf of json.map) {
        for (let i = 0; i < shelf.matches.length; i++) {
            if (shelf.matches[i].some(m => matches(m, book))) {
                console.log("Matched book!", shelf.matches[i]);
                selected.push({ shelf, partId: i });
            }
        }
    }

    if (selected.length > 0) {
        map.setSelected(selected);
        map.draw();
    } else {
        showDialog(
            "Couldn't find any shelves",
            "No shelves were found containing the following book:",
            JSON.stringify([callNumber, sublocation].filter(x => x), null, 1),
            "But don't fret! It's probably just a bug with this map. Consider asking a librarian for help."
        );
    }

    if (selected.length > 1) {
        showDialog(
            "Multiple shelves were found",
            "More than one shelf was found that might contain the book you're looking for.",
            "It's probably in one of those shelves. Remember, you can always ask a librarian if you need help!"
        );
    }
}

loadMap().catch((err) => {
    showDialog(
        "Couldn't load map",
        err.message,
        "Your school might not be supported. Consider submitting a bug report!"
    );
});
