import { PASSWORDS } from "./config.js";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

export function authLibrarian(school, pass) {
    let schoolPass = PASSWORDS.get(school);
    if (!schoolPass) {
        console.log("Invalid school in authLibrarian: " + school);
        return null;
    }

    if (schoolPass !== pass) {
        console.log("Password didn't match in authLibrarian.");
        return null;
    }

    return jwt.sign({ librarian: true, school }, SECRET);
}

export function getTokenSchool(token) {
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
