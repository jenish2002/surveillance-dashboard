import { Hono } from "hono";
import { cors } from "hono/cors";

import { authRouter } from "./auth";
import { cameraRouter } from "./camera";

const app = new Hono();

app.use("*", cors());

app.route("/auth", authRouter);
app.route("/cameras", cameraRouter);

app.get("/", (c) => c.text("API Running"));

export default {
  port: 3005,
  fetch: app.fetch,
};
