// for speed and lowest cost, we store the whole database as a local object.
// the database is designed such that no meaningful data ever gets erased.

import { SCHOOLS } from "./config.js";
import { Redis } from "@upstash/redis";

let redis = Redis.fromEnv();
let schoolCaches = new Map();

// returns school info {currentVersion, versions}
export async function getSchoolInfo(school) {
    if (typeof school !== "string" || !SCHOOLS.has(school)) {
        console.log("Invalid school in getSchoolInfo: " + school);
        return null;
    }

    if (schoolCaches.has(school)) {
        return schoolCaches.get(school);
    }

    let info = await redis.get(school);
    if (info) {
        schoolCaches.set(school, info);
        return info;
    }

    let newInfo = {
        versions: [{ when: Date.now(), map: [] }]
    };
    await setSchoolInfo(school, newInfo);
    return newInfo;
}

async function setSchoolInfo(school, info) {
    schoolCaches.set(school, info);
    await redis.set(school, info);
}

export async function addMap(school, map) {
    let info = await getSchoolInfo(school);
    if (!info) return false;

    // checking every shelf is too much work
    if (!Array.isArray(map)) {
        console.log("Type error in addMap: " + map);
        return false;
    }

    info.versions.push({ when: Date.now(), map });

    await setSchoolInfo(school, info);
    return true;
}
