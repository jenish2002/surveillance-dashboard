CREATE TYPE "public"."camera_status" AS ENUM('STOPPED', 'CONNECTING', 'LIVE', 'ERROR');--> statement-breakpoint
CREATE TABLE "cameras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"rtsp_url" varchar(500) NOT NULL,
	"location" varchar(255),
	"enabled" boolean DEFAULT true NOT NULL,
	"status" "camera_status" DEFAULT 'STOPPED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cameras" ADD CONSTRAINT "cameras_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;