import styles from "./styles.css" with { type: "text" };

if (!window.shelfFinderYet) {
    window.shelfFinderYet = true;
    let style = document.createElement("style");
    style.textContent = styles;
    document.head.appendChild(style);
}

if (!window.shelfFinder) {
    window.shelfFinder = true;
    startShelfFinder();
}

function startShelfFinder() {
    // TODO: wrong site check

    let callNumber = getCallNumber();
    if (!callNumber) return showError("Couldn't find call number.");

    let available = getAvailability();
    if (!available) return showError("No copies of this book are currently available.");


}


function showError(message) {
    // TODO
}

function close() {
    // TODO

    window.shelfFinder = false;
}

// can be null
// returns { callNumber, sublocation, available }
function getBookInfo() {
    let doc = (
        document.getElementById("Library Manager")?.contentDocument ??
        document.getElementById("Destiny Discover")?.contentDocument ??
        document
    );

    // for the old ui
    let id = doc.getElementById("callNumber");
    if (id) {
        let summary = document.getElementById("copiesSummary");
        let match = summary?.innerText.match(/([0-9]+) of [0-9]+/);

        return {
            callNumber: id.innerText,
            sublocation: doc.getElementById("subLocation")?.innerText,
            available: !match || Number(match[1]) > 0
        };
    }

    let main = doc.querySelector(".cr-channel-main") ?? doc.querySelector(".product-title-details");
    if (!main) return null;

    let divs = Array.from(main.querySelectorAll("div"));
    let lines = divs.flatMap(e => e.innerText.split("\n"));
    let find = (prefix) => {
        let full = prefix + ": ";
        return lines.find(l => l.startsWith(full))?.substring(full.length);
    };

    let callNumber = find("Call Number");
    if (!callNumber) return null;

    let sublocation = find("Sublocation");
    let available = !main.querySelector(".out");
    return { callNumber, sublocation, available };
}

