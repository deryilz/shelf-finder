import { ping } from "../lib/db";

export default async function handler(req, res) {
    let success = await ping();
    res.json({ success });
}
