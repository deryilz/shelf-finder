import { SCHOOLS, PASSWORDS } from "./config.js";
import { neon } from "@neondatabase/serverless";

let sql = neon(process.env.DATABASE_URL);

export async function getSchoolVersions(school) {
    if (!PASSWORDS.has(school)) return null;

    try {
        let rows = await sql`
        SELECT created_at, map
        FROM school_versions
        WHERE school = ${school}
        ORDER BY created_at ASC
        `;

        if (rows.length > 0) return rows;

        let now = new Date();
        let newVersion = { when: now, map: [] };

        await sql`
        INSERT INTO school_versions (school, created_at, map)
        VALUES (${school}, ${now}, ${JSON.stringify(newVersion.map)}::jsonb)
        `;

        return [newVersion];
    } catch (error) {
        console.error("Failed to fetch/insert versions:", error);
        return null;
    }
}
export async function getLastSchoolMap(schoolName) {
    let school = SCHOOLS.get(schoolName);
    if (!school) return null;

    try {
        let rows = await sql`
        SELECT map
        FROM school_versions
        WHERE school = ${school}
        ORDER BY created_at DESC
        LIMIT 1
        `;

        if (rows.length > 0) return rows[0].map;

        await sql`
        INSERT INTO school_versions (school, created_at, map)
        VALUES (${school}, ${new Date()}, '[]'::jsonb)
        `;

        return [];
    } catch (error) {
        console.log("Failed to fetch map:", error);
        return null;
    }
}

export async function addMap(school, map) {
    if (!PASSWORDS.has(school) || !Array.isArray(map)) {
        console.log("Type error in addMap:", map);
        return false;
    }

    try {
        await sql`
        INSERT INTO school_versions (school, created_at, map)
        VALUES (${school}, ${new Date()}, ${JSON.stringify(map)}::jsonb)
        `;
        return true;
    } catch (error) {
        console.log("Somehow failed to add map:", error);
        return false;
    }
}
