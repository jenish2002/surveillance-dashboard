import { createMiddleware } from "hono/factory";

export const internalAuthMiddleware =
  createMiddleware(async (c, next) => {
    const secret = c.req.header(
      "X-Internal-Secret",
    );

    if (
      secret !== process.env.INTERNAL_API_SECRET
    ) {
      return c.json(
        { message: "Unauthorized" },
        401,
      );
    }

    await next();
  });