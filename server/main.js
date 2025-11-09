import "./load-env.js";

import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import path from "path";

import * as db from "./db.js";
import * as auth from "./auth.js";
import fs from "fs";

let fastify = Fastify();

fastify.get("/api/schools/:school", async (req, res) => {
    let school = req.params.school;
    let info = await db.getSchoolInfo(school);
    if (info) {
        res.send({ success: true, info });
    } else {
        res.send({ success: false });
    }
});

// todo: update these to post
fastify.post("/api/add-map", async (req, res) => {
    let school = auth.checkToken(req.body.token);
    if (school) {
        let map = req.body.map;
        let success = await db.addMap(school, map);
        res.send({ success });
    } else {
        res.send({ success: false });
    }
});

fastify.post("/api/revert-map", async (req, res) => {
    let school = auth.checkToken(req.body.token);
    if (school) {
        let version = req.body.version;
        let success = await db.revertMap(school, version);
        res.send({ success });
    } else {
        res.send({ success: false });
    }
});

fastify.post("/api/auth", (req, res) => {
    let { school, pass } = req.body;
    let token = auth.authLibrarian(school, pass);
    if (token) {
        res.send({ success: true, school, token });
    } else {
        res.send({ success: false });
    }
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
