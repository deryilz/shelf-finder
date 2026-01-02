import "./load-env.js";

import Fastify from "fastify";
import { apiRoutes } from "./routes.js";

let app = Fastify();
app.register(apiRoutes);
app.setNotFoundHandler((req, res) => {
    res.code(404).send({ success: false, error: 'Not found' });
});
app.listen({ port: 3000, host: "0.0.0.0" }, (err, address) => {
    console.log("Shelf finder server now running on " + address);
});
