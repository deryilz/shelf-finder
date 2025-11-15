let username = document.getElementById("username");
let password = document.getElementById("password");
let button = document.getElementById("button");

function openDashboard() {
    location.replace("/admin/dashboard.html");
}

if (localStorage.school && localStorage.token) {
    openDashboard();
}

username.addEventListener("keydown", (event) => {
    if (event.key === "Enter") password.focus();
});

password.addEventListener("keydown", (event) => {
    if (event.key === "Enter") button.click();
});

button.addEventListener("click", auth);

async function auth() {
    let res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            school: username.value,
            pass: password.value
        }),
    });
    let json = await res.json();

    if (json.success) {
        localStorage.school = json.school;
        localStorage.token = json.token;
        openDashboard();
    } else {
        alert("Invalid username or password.");
    }
}
