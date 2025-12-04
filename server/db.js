// for speed and lowest cost, we store the whole database as a local object.
// the database is designed such that no meaningful data ever gets erased.

import { SCHOOLS } from "./config.js";
import { Redis } from "@upstash/redis";

let redis = Redis.fromEnv();

export async function getSchoolVersions(school) {
    if (!SCHOOLS.has(school)) return null;

    let versions = await redis.lrange(school, 0, -1);
    if (versions) return versions;

    let newVersion = { when: Date.now(), map: [] };
    await redis.rpush(school, newVersion);
    return [newVersion];
}

export async function getLastSchoolMap(school) {
    if (!SCHOOLS.has(school)) return null;

    let last = await redis.lindex(school, -1);
    if (last) return last.map;

    let newVersion = { when: Date.now(), map: [] };
    await redis.rpush(school, newVersion);
    return [];
}

export async function addMap(school, map) {
    // checking every shelf is too much work
    if (!SCHOOLS.has(school) || !Array.isArray(map)) {
        console.log("Type error in addMap: " + map);
        return false;
    }

    await redis.rpush(school, { when: Date.now(), map });
    return true;
}
