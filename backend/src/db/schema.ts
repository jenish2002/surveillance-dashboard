import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";

export const cameraStatusEnum = pgEnum("camera_status", [
  "STOPPED",
  "CONNECTING",
  "LIVE",
  "ERROR",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cameras = pgTable("cameras", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  name: varchar("name", { length: 255 }).notNull(),

  rtspUrl: varchar("rtsp_url", {
    length: 500,
  }).notNull(),

  location: varchar("location", {
    length: 255,
  }),

  enabled: boolean("enabled").notNull().default(true),
  status: cameraStatusEnum("status").notNull().default("STOPPED"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
