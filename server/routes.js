import * as db from "./db.js";
import * as auth from "./auth.js";

// TODO: return more info from these
// also there should be an authed add-map that doesn't require school
export async function apiRoutes(fastify, options) {
    fastify.get("/maps/:school", async (req) => {
        let school = req.params.school;
        let info = await db.getSchoolInfo(school);
        if (!info) return { success: false };

        let map = info.versions[info.versions.length - 1];
        return { success: true, map };
    });

    fastify.post("/auth", (req) => {
        let { school, pass } = req.body;
        let token = auth.authLibrarian(school, pass);
        if (!token) return { success: false };

        return { success: true, school, token };
    });

    fastify.post("/map-versions", async (req) => {
        let school = auth.getTokenSchool(req.body.token);
        if (!school) return { success: false };

        let info = await db.getSchoolInfo(school);
        return { success: true, versions: info.versions };
    });

    fastify.post("/add-map", async (req) => {
        let school = auth.getTokenSchool(req.body.token);
        if (!school) return { success: false };

        let map = req.body.map;
        let success = await db.addMap(school, map);
        return { success };
    });
}
