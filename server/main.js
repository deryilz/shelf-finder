import "./load-env.js";

import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import cors from '@fastify/cors';

import path from "path";
import fs from "fs";

import { apiRoutes } from "./routes.js";

let fastify = Fastify();

fastify.register(apiRoutes, { prefix: '/api' });
fastify.register(fastifyStatic, {
    root: path.join(process.cwd(), "public")
});
fastify.register(cors, { origin: "*" });

fastify.setNotFoundHandler((req, res) => {
    let filePath = path.join(process.cwd(), 'public', '404.html');
    res.code(404).type('text/html').send(fs.readFileSync(filePath));
});

fastify.listen({ port: 3000, host: "0.0.0.0" }, (err, address) => {
    console.log("Shelf finder server now running on " + address);
});
