CREATE TABLE "spotify_accounts" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"spotify_user_id" text NOT NULL,
	"encrypted_refresh_token" text NOT NULL,
	"token_expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "spotify_uri" text;--> statement-breakpoint
UPDATE "tracks" SET "spotify_uri" = 'spotify:track:' || "id" WHERE "spotify_uri" IS NULL;--> statement-breakpoint
ALTER TABLE "tracks" ALTER COLUMN "spotify_uri" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "spotify_accounts" ADD CONSTRAINT "spotify_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
