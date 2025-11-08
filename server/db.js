// for speed and lowest cost, we store the whole database as a local object.
// the database is designed such that no meaningful data ever gets erased.

import { Redis } from "@upstash/redis";
import * as config from "./config.js";

let redis = Redis.fromEnv();
let schoolCaches = new Map();

// returns school info {currentVersion, versions}
export async function getSchoolInfo(school) {
    if (typeof school !== "string" || !config.SCHOOLS.has(school)) {
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
        currentVersion: 0,
        versions: [{ when: Date.now(), map: [] }]
    };
    await setSchoolInfo(school, newInfo);
    return newInfo;
}

async function setSchoolInfo(school, info) {
    schoolCaches.set(school, info);
    await redis.set(school, info);
}

export async function revertMap(school, version) {
    let info = await getSchoolInfo(school);
    if (!info) return false;

    if (typeof version !== "number" || version < 0 || version >= info.versions.length) {
        console.log("Type error in revertMap: " + version);
        return false;
    }

    info.currentVersion = version;

    await setSchoolInfo(school, info);
    return true;
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
    info.currentVersion = info.versions.length - 1;

    await setSchoolInfo(school, info);
    return true;
}
