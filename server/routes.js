import * as db from "./db.js";
import * as auth from "./auth.js";

// TODO: return more info from these
// also there should be an authed add-map that doesn't require school
// and it should return history, while the /schools/karrer one doesn't have to (just versions[currentVersion])
// also /schools should be /maps/
export async function apiRoutes(fastify, options) {
    fastify.get("/schools/:school", async (req, res) => {
        let school = req.params.school;
        let info = await db.getSchoolInfo(school);
        if (info) {
            res.send({ success: true, info });
        } else {
            res.send({ success: false });
        }
    });

    fastify.post("/add-map", async (req, res) => {
        let school = auth.checkToken(req.body.token);
        if (school) {
            let map = req.body.map;
            let success = await db.addMap(school, map);
            res.send({ success });
        } else {
            res.send({ success: false });
        }
    });

    fastify.post("/revert-map", async (req, res) => {
        let school = auth.checkToken(req.body.token);
        if (school) {
            let version = req.body.version;
            let success = await db.revertMap(school, version);
            res.send({ success });
        } else {
            res.send({ success: false });
        }
    });

    fastify.post("/auth", (req, res) => {
        let { school, pass } = req.body;
        let token = auth.authLibrarian(school, pass);
        if (token) {
            res.send({ success: true, school, token });
        } else {
            res.send({ success: false });
        }
    });
}
