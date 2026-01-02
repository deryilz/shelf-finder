import { getTokenSchool } from "../lib/auth.js";
import { addMap } from "../lib/db.js";

// TODO: add better messages
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, message: "Invalid method." });
    }

    let school = getTokenSchool(req.body.token);
    if (!school) res.json({ success: false });

    let map = req.body.map;
    let success = await addMap(school, map);
    res.json({ success });
}
