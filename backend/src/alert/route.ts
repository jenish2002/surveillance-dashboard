import { Hono } from "hono";

import { alerts, db } from "../db";
import type { IAppVariables } from "../types";
import { createAlertSchema } from "./validator";
import { broadcast } from "../websocket";

const alertRouter = new Hono<{
  Variables: IAppVariables;
}>();

alertRouter.post("/internal", async (c) => {
  const body = await c.req.json();

  const parsedData = createAlertSchema.safeParse(body);

  if (!parsedData.success) {
    return c.json(
      {
        message: "Invalid payload.",
        errors: parsedData.error.flatten(),
      },
      400,
    );
  }

  const [alert] = await db
    .insert(alerts)
    .values({
      cameraId: parsedData.data.cameraId,
      label: parsedData.data.label,
      confidence: parsedData.data.confidence,
      timestamp: new Date(parsedData.data.timestamp),
    })
    .returning();

  broadcast({
    type: "ALERT_CREATED",
    payload: alert,
  });

  return c.json(alert, 201);
});

export { alertRouter };
