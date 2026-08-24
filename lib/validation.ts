import { z } from "zod";
export const nameSchema = z.object({ displayName: z.string().trim().min(2).max(32) });
export const voteSchema = z.object({ entryId: z.string().uuid(), direction: z.enum(["up", "down"]) });
export const enqueueSchema = z.object({ trackId: z.string().min(1) });
