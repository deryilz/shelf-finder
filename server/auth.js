import * as config from "./config.js";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

export function authLibrarian(school, pass) {
    if (!config.SCHOOLS.has(school)) {
        console.log("Invalid school in authLibrarian: " + school);
        return null;
    }

    if (config.SCHOOLS.get(school) !== pass) {
        console.log("Password didn't match in authLibrarian.");
        return null;
    }

    return jwt.sign({ librarian: true, school }, SECRET);
}

export function checkToken(token) {
    if (!token) {
        console.log("Token was null.");
        return null;
    }

    try {
        jwt.verify(token, SECRET);
        return jwt.decode(token).school;
    } catch (err) {
        console.log("Token was invalid in checkToken.");
        return null;
    }
}
