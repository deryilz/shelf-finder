function showBackdrop() {
    let backdrop = document.createElement("div");
    backdrop.classList.add("dialog-backdrop");
    document.body.appendChild(backdrop);
    return backdrop;
}

export function showDialog(titleText, ...texts) {
    let backdrop = showBackdrop();

    let element = document.createElement("div");
    element.classList.add("dialog");
    backdrop.appendChild(element);

    let title = document.createElement("div");
    title.classList.add("dialog-header");
    title.textContent = titleText;
    element.appendChild(title);

    for (let text of texts) {
        let div = document.createElement("div");
        div.textContent = text;
        element.appendChild(div);
    }

    let button = document.createElement("button");
    button.textContent = "Ok";
    button.addEventListener("click", () => backdrop.remove());
    element.appendChild(button);

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            button.click();
        }
    });

    return backdrop;
}

export function showSpinner() {
    let backdrop = showBackdrop();

    let spinner = document.createElement("div");
    spinner.classList.add("spinner");
    backdrop.appendChild(spinner);

    return backdrop;
}
