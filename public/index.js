let bookmark = document.getElementById("bookmark");
let url = import.meta.resolve("/bookmark.js");
bookmark.href = `javascript:import("${url}?" + Date.now());`;
