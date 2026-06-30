import { z } from "zod";

export const createAlertSchema = z.object({
  cameraId: z.uuid(),
  label: z.string().min(1),
  confidence: z.number().min(0).max(1),
  timestamp: z.iso.datetime({ offset: true }),
});
