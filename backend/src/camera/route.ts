import { Hono } from "hono";
import { and, eq } from "drizzle-orm";

import { authMiddleware } from "../auth";
import { db, cameras } from "../db";
import type { IAppVariables } from "../types";
import { worker } from "../worker";

import {
  createCameraSchema,
  updateCameraSchema,
  updateCameraStatusSchema,
} from "./validator";

import { broadcast } from "../websocket";
import { internalAuthMiddleware } from "../middlewares";

const cameraRouter = new Hono<{
  Variables: IAppVariables;
}>();

cameraRouter.use("*", authMiddleware);

cameraRouter.post("/", async (c) => {
  const body = await c.req.json();

  const parsedData = createCameraSchema.safeParse(body);

  if (!parsedData.success) {
    return c.json({ message: "Invalid input." }, 400);
  }

  const userId = c.get("userId");

  const [camera] = await db
    .insert(cameras)
    .values({
      ...parsedData.data,
      userId,
    })
    .returning();

  return c.json(camera, 201);
});

cameraRouter.get("/", async (c) => {
  const userId = c.get("userId");

  const allCameras = await db.query.cameras.findMany({
    where: eq(cameras.userId, userId),
    orderBy: (camera, { desc }) => [desc(camera.createdAt)],
  });

  return c.json(allCameras);
});

cameraRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");

  const camera = await db.query.cameras.findFirst({
    where: and(eq(cameras.id, id), eq(cameras.userId, userId)),
  });

  if (!camera) {
    return c.json({ message: "Camera not found." }, 404);
  }

  return c.json(camera);
});

cameraRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");

  const body = await c.req.json();

  const parsedData = updateCameraSchema.safeParse(body);

  if (!parsedData.success) {
    return c.json({ message: "Invalid input." }, 400);
  }

  const [camera] = await db
    .update(cameras)
    .set({
      ...parsedData.data,
      updatedAt: new Date(),
    })
    .where(and(eq(cameras.id, id), eq(cameras.userId, userId)))
    .returning();

  if (!camera) {
    return c.json({ message: "Camera not found." }, 404);
  }

  return c.json(camera);
});

cameraRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");

  const [camera] = await db
    .delete(cameras)
    .where(and(eq(cameras.id, id), eq(cameras.userId, userId)))
    .returning();

  if (!camera) {
    return c.json({ message: "Camera not found." }, 404);
  }

  return c.json({
    message: "Camera deleted.",
  });
});

cameraRouter.post("/:id/start", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");

  const camera = await db.query.cameras.findFirst({
    where: and(eq(cameras.id, id), eq(cameras.userId, userId)),
  });

  if (!camera) {
    return c.json({ message: "Camera not found." }, 404);
  }

  const response = await worker.post("/start", {
    cameraId: id,
    rtspUrl: camera.rtspUrl,
  });

  if (!!response.data.success) {
    await db
      .update(cameras)
      .set({
        status: "CONNECTING",
      })
      .where(eq(cameras.id, id));
  }

  return c.json({
    message: response.data.message,
  });
});

cameraRouter.post("/:id/stop", async (c) => {
  const id = c.req.param("id");
  const userId = c.get("userId");

  const camera = await db.query.cameras.findFirst({
    where: and(eq(cameras.id, id), eq(cameras.userId, userId)),
  });

  if (!camera) {
    return c.json({ message: "Camera not found." }, 404);
  }

  const response = await worker.post("/stop", {
    cameraId: id,
  });

  if (!!response.data.success) {
    await db
      .update(cameras)
      .set({
        status: "STOPPED",
      })
      .where(eq(cameras.id, id));
  }

  return c.json({
    message: response.data.message,
  });
});

cameraRouter.post("/internal/status", internalAuthMiddleware, async (c) => {
  const body = await c.req.json();

  const parsedData = updateCameraStatusSchema.safeParse(body);

  if (!parsedData.success) {
    return c.json({ message: "Invalid payload." }, 400);
  }

  const [camera] = await db
    .update(cameras)
    .set({
      status: parsedData.data.status,
      updatedAt: new Date(),
    })
    .where(eq(cameras.id, parsedData.data.cameraId))
    .returning();

  if (!camera) {
    return c.json({ message: "Camera not found." }, 404);
  }

  broadcast({
    type: "CAMERA_STATUS_UPDATED",
    payload: {
      cameraId: camera.id,
      status: camera.status,
    },
  });

  return c.json(camera);
});

export { cameraRouter };
