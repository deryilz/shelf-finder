let styleText = `
.shelf-finder {
    z-index: 100 !important;
    box-sizing: border-box !important;
    font-family: monospace !important;
}

.shelf-finder.backdrop {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(34, 34, 34, 0.4);
}

.shelf-finder.shadow {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.shelf-finder.bar {
    position: fixed;
    left: 50%;
    top: 50px;
    width: 90%;
    transform: translateX(-50%);
    display: flex;
    gap: 20px;
}

.shelf-finder.bar > * {
    border: 5px solid black;
    border-radius: 15px;
    font-size: 25px;
}

.shelf-finder.header {
    background-color: #f9e784;
    padding: 15px 20px;
    text-align: center;
    flex: 1;
}

.shelf-finder.x {
    background-color: #e58f65;
    font-weight: bold;
    padding: 15px 25px;
    cursor: pointer;
    flex: 0 0 auto;
}

.shelf-finder.x:hover {
    filter: brightness(0.9);
}
`;

if (!window.shelfFinderYet) {
    window.shelfFinderYet = true;
    let style = document.createElement("style");
    style.textContent = styleText;
    document.head.appendChild(style);
}

if (!window.shelfFinder) {
    window.shelfFinder = true;
    startShelfFinder();
}

function startShelfFinder() {
    // super loose check but i don't want to do anything stricter
    if (!location.hostname.includes("destiny")) {
        return show("Make sure you're on the Destiny website.");
    }

    let info = getBookInfo();
    if (!info) {
        return show("Please select a book, then try again.");
    }

    let schoolName = getSchoolName();
    if (!schoolName) return show("Couldn't find school name on page.");

    if (!info.available) {
        return show("No copies of this book are currently available.");
    }

    let params = new URLSearchParams();
    params.append("schoolName", schoolName);
    params.append("callNumber", info.callNumber);
    if (info.sublocation) params.append("sublocation", info.sublocation);

    let url = import.meta.resolve("./map") + "?" + params.toString();
    show("Your book's call number is " + info.callNumber, url);
}

// easy element creation
function make(type, classes, parent = document.body) {
    let element = document.createElement(type);
    element.classList.add("shelf-finder", ...classes);
    parent.appendChild(element);
    return element;
}

function show(message, frameUrl = null) {
    // TODO
    console.log({ message, frameUrl });

    let backdrop = make("div", ["backdrop"]);
    let bar = make("div", ["bar"], backdrop);

    let header = make("div", ["header", "shadow"], bar);
    header.textContent = message;

    let x = make("div", ["x", "shadow"], bar);
    x.textContent = "x";
    x.onclick = () => {
        backdrop.remove();
        window.shelfFinder = false;

        // TODO: remove
        window.shelfFinderYet = false;
    };
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

// can be null, of course
function getSchoolName() {
    return document.getElementById("current-site-name")?.textContent.trim();
}

