import "./load-env.js";

import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "path";

import * as db from "./db.js";
import * as auth from "./auth.js";
import fs from "fs";

let fastify = Fastify();

fastify.get("/schools/:school/get", async (req, res) => {
    let school = req.params.school;
    let info = await db.getSchoolInfo(school);
    res.send(info);
});

// todo: update these to post
fastify.post("/schools/:school/add-map", async (req, res) => {
    let school = req.params.school;
    if (!school || school !== auth.checkToken(req.body.token)) {
        return res.status(400).send();
    }

    let map = req.body.map;
    let info = await db.addMap(school, map);
    res.send(info);
});

fastify.post("/schools/:school/revert-map", async (req, res) => {
    let school = req.params.school;
    if (!school || school !== auth.checkToken(req.body.token)) {
        return res.status(400).send();
    }

    let version = req.body.version;
    let info = await db.revertMap(school, version);
    res.send(info);
});

fastify.post("/auth", (req, res) => {
    let { school, pass } = req.body;
    return auth.authLibrarian(school, pass);
});

fastify.register(fastifyStatic, {
    root: path.join(process.cwd(), "public")
});

fastify.setNotFoundHandler((req, res) => {
    let filePath = path.join(process.cwd(), 'public', '404.html');
    res.code(404).type('text/html').send(fs.readFileSync(filePath));
});

fastify.listen({ port: 3000 }, (err, address) => {
    console.log("Shelf finder server now running on " + address);
});
