import { Hono } from "hono";

import { db } from "../db";
import { alerts } from "../db/schema";
import type { IAppVariables } from "../types";
import { createAlertSchema } from "./validator";

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

  return c.json(alert, 201);
});

export { alertRouter };
