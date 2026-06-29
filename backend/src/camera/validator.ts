import { z } from "zod";

export const createCameraSchema = z.object({
  name: z.string().min(1),
  rtspUrl: z.url(),
  location: z.string().optional(),
  enabled: z.boolean().optional(),
});

export const updateCameraSchema = createCameraSchema.partial();
