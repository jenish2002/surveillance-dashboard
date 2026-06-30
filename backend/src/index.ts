import { Hono } from "hono";
import { cors } from "hono/cors";
import { upgradeWebSocket, websocket } from "hono/bun";

import { authRouter } from "./auth";
import { cameraRouter } from "./camera";
import { alertRouter } from "./alert";
import { addClient, removeClient } from "./websocket";

const app = new Hono();


app.use("*", cors());

app.route("/auth", authRouter);
app.route("/cameras", cameraRouter);
app.route("/alerts", alertRouter);

app.get("/", (c) => c.text("API Running"));

app.get(
  "/ws",
  upgradeWebSocket(() => ({
    onOpen(_, ws) {
      addClient(ws.raw);

      console.log("[WS] Client is connected.");
    },

    onClose(_, ws) {
      removeClient(ws.raw);

      console.log("[WS] Client is disconnected.");
    },
  })),
);

export default {
  port: 3005,
  fetch: app.fetch,
  websocket,
};
