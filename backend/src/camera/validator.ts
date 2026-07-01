import { z } from "zod";

export const createCameraSchema = z.object({
  name: z.string().min(1),
  rtspUrl: z.url(),
  location: z.string().optional(),
  enabled: z.boolean().optional(),
});

export const updateCameraSchema = createCameraSchema.partial();

export const updateCameraStatusSchema = z.object({
  cameraId: z.uuid(),
  status: z.enum(["CONNECTING", "LIVE", "STOPPED", "ERROR"]),
});

export const updateCameraStatsSchema = z.object({
  cameraId: z.uuid(),
  fps: z.number().nonnegative(),
  detectionsPerMinute: z.number().nonnegative(),
});
