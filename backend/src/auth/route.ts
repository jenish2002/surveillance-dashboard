import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db, users } from "../db";
import { signupSchema } from "./validator";
import { signToken } from "../utils";

const authRouter = new Hono();

authRouter.post("/signup", async (c) => {
  const body = await c.req.json();

  const parsedData = signupSchema.safeParse(body);

  if (!parsedData.success) {
    return c.json({ message: "Invalid data" }, 400);
  }

  const { username, password } = parsedData.data;

  const existingUser = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (existingUser) {
    return c.json({ message: "User already exists." }, 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(users)
    .values({ username, password: hashedPassword })
    .returning();

  if (!user) {
    return c.json({ message: "Failed to create user." }, 500);
  }

  const accessToken = signToken(user.id);

  return c.json({
    accessToken,
    user: { id: user.id, username: user.username },
  });
});

authRouter.post("/login", async (c) => {
  const body = await c.req.json();

  const { username, password } = body;

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!user) {
    return c.json({ message: "Invalid credentials" }, 401);
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return c.json({ message: "Invalid credentials" }, 401);
  }

  const accessToken = signToken(user.id);

  return c.json({
    accessToken,
    user: {
      id: user.id,
      username: user.username,
    },
  });
});

export { authRouter };
