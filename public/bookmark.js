let styleText = `
.shelf-finder {
    z-index: 1000000;
    box-sizing: border-box;
    font-family: monospace;
}

.shelf-finder.border {
    border: 5px solid black;
    border-radius: 15px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.shelf-finder.backdrop {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(34, 34, 34, 0.4);
}

.shelf-finder.ui {
    position: fixed;
    left: 50px;
    top: 50px;
    right: 50px;
    bottom: 50px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    color: black;
}

.shelf-finder.bar {
    display: flex;
    gap: 20px;
    flex: 0 0 auto;
    color: black;
    font-weight: normal;
}

.shelf-finder.frame {
    background-color: #f9e784;
    flex: 1;
}

.shelf-finder.header {
    background-color: #f9e784;
    padding: 15px 20px;
    text-align: center;
    font-size: 25px;
    flex: 1;
}

.shelf-finder.x {
    background-color: #e58f65;
    font-weight: bold;
    padding: 15px 25px;
    cursor: pointer;
    font-size: 25px;
    flex: 0 0 auto;
}

.shelf-finder.x:hover {
    filter: brightness(0.9);
}
`.replace(/;/g, " !important;");

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
        return show("Make sure you're on the Destiny Discover website.");
    }

    let info = getBookInfo();
    if (!info) {
        return show("Please select a book, then try again.");
    }

    let schoolName = getSchoolName();
    if (!schoolName) {
        return show("Couldn't find school name on page.");
    }

    if (!info.available) {
        let message = format("No copies of {} are currently available.", info.name);
        return show(message);
    }

    let params = new URLSearchParams();
    params.append("schoolName", schoolName);
    params.append("callNumber", info.callNumber);
    if (info.sublocation) params.append("sublocation", info.sublocation);

    let rawMessage = "{} is labeled " + info.callNumber;
    if (info.sublocation) rawMessage += " [" + info.sublocation + "]";
    let message = format(rawMessage, info.name);

    let url = import.meta.resolve("/map") + "?" + params.toString();
    console.log("Framing Shelf Finder URL:", url);
    show(message, url);
}

// expects str to have a single {} within it
function format(str, name) {
    if (!name) {
        let uppercase = str.startsWith("{}");
        return str.replace("{}", uppercase ? "Your book" : "your book");
    }

    let nameSize = 70 - str.length; // max size 70
    if (name.length > nameSize) {
        let shortName = name
            .substring(0, nameSize - 3)
            .replace(/[^A-Za-z0-9]+$/, "");
        return str.replace("{}", `"${shortName}..."`);
    } else {
        return str.replace("{}", `"${name}"`);
    }
}

// easy element creation
function make(type, classes, parent = document.body) {
    let element = document.createElement(type);
    element.classList.add("shelf-finder", ...classes);
    parent.appendChild(element);
    return element;
}

function show(message, frameUrl = null) {
    let backdrop = make("div", ["backdrop"]);
    let ui = make("div", ["ui"], backdrop);

    let bar = make("div", ["bar"], ui);
    if (frameUrl) {
        make("iframe", ["frame", "border"], ui).src = frameUrl;
    }

    make("div", ["header", "border"], bar).textContent = message;

    let x = make("div", ["x", "border"], bar);
    x.textContent = "x";

    let listener = window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") x.click();
    });

    x.addEventListener("click", () => {
        backdrop.remove();
        window.shelfFinder = false;
        window.removeEventListener("keydown", listener);
    });
}

// can be null
// returns { callNumber, sublocation, name, available }
function getBookInfo() {
    let manager = document.getElementById("Library Manager");
    if (manager && !manager.hidden) {
        let doc = manager.contentDocument;

        let id = doc.getElementById("callNumber");
        if (!id) return null;

        let rawName = doc.querySelector("#titleDetail .TableHeading")?.innerText;

        let summary = doc.getElementById("copiesSummary");
        let match = summary?.innerText.match(/([0-9]+) of [0-9]+/);

        return {
            callNumber: id.innerText,
            sublocation: doc.getElementById("subLocation")?.innerText,
            name: rawName?.replace(/[\t\n]/g, ""),
            available: !match || Number(match[1]) > 0
        };
    }

    // otherwise, we're on the new ui
    let discover = document.getElementById("Destiny Discover");
    let doc = discover && !discover.hidden ? discover.contentDocument : document;

    let main = doc.querySelector(".cr-channel-main") ?? doc.querySelector(".product-title-details");
    if (!main) return null;

    let divs = Array.from(main.querySelectorAll("div"));
    let lines = divs.flatMap(e => e.innerText.split("\n"));

    let find = (prefix) => lines
        .find(l => l.startsWith(prefix + ": "))
        ?.substring(prefix.length + 2);

    let callNumber = find("Call Number");
    if (!callNumber) return null;

    let sublocation = find("Sublocation");
    let name = main.querySelector(".clickable-book-name, .title-clamp")?.innerText;
    let available = !main.querySelector(".out");
    return { callNumber, sublocation, name, available };
}

// can be null, of course
function getSchoolName() {
    return document.getElementById("current-site-name")?.textContent?.trim();
}
