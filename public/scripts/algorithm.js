import { libraries } from "./config.js";

function highlightShelf(book, school) {
    let matches = libraries[school].filter(shelf => shelf.contains(book));

    if (matches.length > 1) {
        console.error("Multiple shelves contain the same book.", { book, matches});
        return false;
    }

    if (matches.length === 0) {
        console.error("The book was not found.", { book });
        return false;
    }

    matches[0]; // TODO: highlight
    return true;
}
