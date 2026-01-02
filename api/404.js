export default function handler(req, res) {
    res.status(404).json({ success: false, message: "Invalid route." });
}
