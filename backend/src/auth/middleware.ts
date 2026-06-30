import { createMiddleware } from "hono/factory";
import jwt from "jsonwebtoken";

import type { IAppVariables } from "../types";

export const authMiddleware = createMiddleware<{
  Variables: IAppVariables;
}>(async (c, next) => {
  const path = c.req.path;

  if (path.startsWith("/cameras/internal")) {
    return next();
  }

  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const accessToken = authHeader.split(" ")[1];

  if (!accessToken) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  try {
    const payload = jwt.verify(accessToken, process.env.JWT_SECRET!) as {
      userId: string;
    };

    c.set("userId", payload.userId);

    await next();
  } catch {
    return c.json({ message: "Invalid token" }, 401);
  }
});
