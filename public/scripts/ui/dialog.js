export function showDialog(titleText, text, clickAction = () => {}) {
    // shouldn't be able to add multiple dialogs at once
    if (document.querySelector("div.dialog-backdrop")) {
        return false;
    }

    let backdrop = document.createElement("div");
    backdrop.classList.add("dialog-backdrop");
    document.body.appendChild(backdrop);

    let element = document.createElement("div");
    element.classList.add("dialog");
    backdrop.appendChild(element);

    let title = document.createElement("div");
    title.classList.add("dialog-heading");
    title.textContent = titleText;
    element.appendChild(title);

    let body = document.createElement("div");
    body.textContent = text;
    element.appendChild(body);

    let button = document.createElement("button");
    button.textContent = "Ok";
    button.addEventListener("click", () => backdrop.remove());
    button.addEventListener("click", clickAction);
    element.appendChild(button);

    return true;
}
