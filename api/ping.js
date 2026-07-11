import { ping } from "../lib/db.js";

export default async function handler(req, res) {
    let success = await ping();
    res.json({ success });
}
