import { authLibrarian } from "../lib/auth.js";

// TODO: add better messages
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, message: "Invalid method." });
    }

    let { school, pass } = req.body;
    let token = authLibrarian(school, pass);
    if (!token) res.json({ success: false });

    res.json({ success: true, school, token });
}
