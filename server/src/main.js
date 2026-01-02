import "./load-env.js";

import Fastify from "fastify";
import fastifyStatic from "@fastify/static";

import path from "path";
import fs from "fs";

import { apiRoutes } from "./routes.js";

let app = Fastify();

app.register(apiRoutes, { prefix: '/api' });
app.register(fastifyStatic, {
    root: path.join(process.cwd(), "public")
});

app.setNotFoundHandler((req, res) => {
    let filePath = path.join(process.cwd(), 'public', '404.html');
    res.code(404).type('text/html').send(fs.readFileSync(filePath));
});

app.listen({ port: 3000, host: "0.0.0.0" }, (_, address) => {
    console.log("Shelf finder server now running on " + address);
});
