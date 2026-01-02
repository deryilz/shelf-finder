import { getTokenSchool } from "../lib/auth.js";
import { getSchoolVersions } from "../lib/db.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, message: "Invalid method." });
    }

    let school = getTokenSchool(req.body.token);
    if (!school) res.json({ success: false });

    let versions = await getSchoolVersions(school);
    res.json({ success: true, versions });
}
