---
name: drizzle-migrations
description: Generate and apply Open Radio Drizzle migrations when changing the database schema.
---

# Drizzle Migrations

When changing `db/schema.ts`:

1. Update the schema source first.
2. Generate the migration with `bunx drizzle-kit generate`.
3. Inspect the generated migration, then apply it with `bun run db:migrate` when the environment is configured.

Never hand-write or edit a migration SQL file to represent a schema change. The generated migration is the database contract derived from the schema.
