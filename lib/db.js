import { SCHOOLS, PASSWORDS } from "./config.js";
import { createClient } from "@supabase/supabase-js";

let supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export async function getSchoolVersions(school) {
    if (!PASSWORDS.has(school)) return null;

    let res = await supabase
        .from("school_versions")
        .select("created_at, map")
        .eq("school", school)
        .order("created_at", { ascending: true });

    if (res.error) return null;

    let rows = res.data;
    if (rows.length > 0) return rows;

    let now = new Date();
    let newVersion = { when: now, map: [] };

    await supabase
        .from("school_versions")
        .insert([{ school, created_at: now, map: newVersion.map }]);

    return [newVersion];
}

export async function getLastSchoolMap(schoolName) {
    let school = SCHOOLS.get(schoolName);
    if (!school) return null;

    let res = await supabase
        .from("school_versions")
        .select("map")
        .eq("school", school)
        .order("created_at", { ascending: false })
        .limit(1);

    if (res.error) {
        console.log("Failed to fetch map:", res.error);
        return null;
    }

    let rows = res.data;
    if (rows.length > 0) return rows[0].map;

    await supabase
        .from("school_versions")
        .insert([{ school, created_at: new Date(), map: [] }]);

    return [];
}

export async function addMap(school, map) {
    if (!PASSWORDS.has(school) || !Array.isArray(map)) {
        console.log("Type error in addMap:", map);
        return false;
    }

    let res = await supabase
        .from("school_versions")
        .insert([{ school, created_at: new Date(), map }]);

    if (res.error) {
        console.log("Somehow failed to add map:", error);
        return false;
    }

    return true;
}
