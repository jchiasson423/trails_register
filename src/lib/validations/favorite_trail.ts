import { z } from "zod";

/**
 * FavoriteTrailSchema for the favorite trail entity.
 * @param id - The unique identifier of the favorite trail.
 * @param userId - The unique identifier of the user who marked the trail as favorite.
 * @param trailId - The unique identifier of the trail that was marked as favorite.
 */
export const FavoriteTrailSchema = z.object({
    id: z.number().optional(),
    userId: z.number(),
    trailId: z.number(),
});

/**
 * FavoriteTrail is an entry from the user to mark a trail as favorite.
 */
export type FavoriteTrail = z.infer<typeof FavoriteTrailSchema>;
