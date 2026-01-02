import { getLastSchoolMap } from "../lib/db.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, message: "Invalid method." });
    }

    let { schoolName } = req.body;
    let map = await getLastSchoolMap(schoolName);
    if (map) {
        res.json({ success: true, map });
    } else {
        res.json({ success: false, message: "No school with name " + schoolName });
    }
}
