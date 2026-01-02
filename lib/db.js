import { SCHOOLS } from "./config.js";
import postgres from "postgres";

let sql = postgres(process.env.SUPABASE_URL2);

export async function getSchoolVersions(school) {
    if (!SCHOOLS.some(s => s.id === school)) return null;

    let rows = await sql`
    SELECT created_at AS "when", map
    FROM school_versions
    WHERE school = ${school}
    ORDER BY created_at ASC
    `;

    if (rows.length > 0) return rows;

    let now = new Date();
    let newVersion = { when: now, map: [] };

    await sql`
    INSERT INTO school_versions (school, created_at, map)
    VALUES (${school}, ${now}, ${sql.json(newVersion.map)})
    `;

    return [newVersion];
}

export async function getLastSchoolMap(schoolName) {
    let school = SCHOOLS.find(s => s.name === schoolName)?.id;
    if (!school) return null;

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
    VALUES (${school}, ${new Date()}, ${sql.json([])})
    `;

    return [];
}

export async function addMap(school, map) {
    if (!SCHOOLS.some(s => s.id === school) || !Array.isArray(map)) {
        console.log("Type error in addMap:", map);
        return false;
    }

    await sql`
    INSERT INTO school_versions (school, created_at, map)
    VALUES (${school}, ${new Date()}, ${sql.json(map)})
    `;

    return true;
}
