import styles from "./styles.css" with { type: "text" };
import { libraries } from "./config.js"

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

export function startShelfFinder() {
    // TODO: wrong site check

    let callNumber = getCallNumber();
    if (!callNumber) return showError("Couldn't find call number.");

    let available = getAvailability();
    if (!available) return showError("No copies of this book are currently available.");


}


export function showError(message) {
    // TODO
}

function close() {
    // TODO

    window.shelfFinder = false;
}

// TODO
function getCallNumber() {
    return "FIC KOR";
}

// TODO
function getAvailability() {
    return true;
}

