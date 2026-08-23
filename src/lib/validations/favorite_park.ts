import { z } from "zod";

/**
 * FavoriteParkSchema for the favorite park entity.
 * @param id - The unique identifier of the favorite park.
 * @param userId - The unique identifier of the user who marked the park as favorite.
 * @param parkId - The unique identifier of the park that was marked as favorite.
 */
export const FavoriteParkSchema = z.object({
    id: z.number().optional(),
    userId: z.number(),
    parkId: z.number(),
});

/**
 * FavoritePark is an entry from the user to mark a park as favorite.
 */
export type FavoritePark = z.infer<typeof FavoriteParkSchema>;
