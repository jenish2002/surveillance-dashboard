import { Hono } from "hono";
import { and, eq } from "drizzle-orm";

import { authMiddleware } from "../auth";
import { db, cameras } from "../db";
import { createCameraSchema, updateCameraSchema } from "./validator";
import type { IAppVariables } from "../types";

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
    return c.json({ message: "Camera not found" }, 404);
  }

  return c.json({
    message: "Camera deleted.",
  });
});

export { cameraRouter };
