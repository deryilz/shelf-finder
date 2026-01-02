import * as db from "./db.js";
import * as auth from "./auth.js";

// TODO: return more info from these
export async function apiRoutes(fastify) {
    fastify.get("/maps/:school", async (req) => {
        let school = req.params.school;
        let map = await db.getLastSchoolMap(school);
        if (!map) return { success: false, message: "No map for school " + school };

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

        let versions = await db.getSchoolVersions(school);
        return { success: true, versions };
    });

    fastify.post("/add-map", async (req) => {
        let school = auth.getTokenSchool(req.body.token);
        if (!school) return { success: false };

        let map = req.body.map;
        let success = await db.addMap(school, map);
        return { success };
    });
}
