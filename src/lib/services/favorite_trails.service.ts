import {
    FavoriteTrail,
    FavoriteTrailSchema,
} from "@/lib/validations/favorite_trail";
import { db } from "../db";

/**
 * FavoriteTrailsService for the favorite trail entity. This service is used to create, update, and get favorite trails from the database.
 *
 * @example
 * const favoriteTrail = await favoriteTrailsService.createFavoriteTrail({
 *     trailId: 1,
 *     userId: 1,
 * });
 * console.log(favoriteTrail);
 */
export class FavoriteTrailsService {
    /**
     * Create a new favorite trail.
     * @param favoriteTrail - The favorite trail to create.
     * @returns The created favorite trail. If the favorite trail already exists, returns null.
     */
    async createFavoriteTrail(
        favoriteTrail: FavoriteTrail,
    ): Promise<FavoriteTrail | null> {
        const created = await db.favoriteTrail.create({
            data: favoriteTrail,
        });
        if (!created) return null;
        return FavoriteTrailSchema.parse(created);
    }

    /**
     * Delete a favorite trail.
     * @param userId - The user id of the favorite trail to delete.
     * @param trailId - The trail id of the favorite trail to delete.
     * @returns The deleted favorite trail. If no favorite trail is found, returns null.
     */
    async deleteFavoriteTrail(
        userId: number,
        trailId: number,
    ): Promise<number | null> {
        const deleted = await db.favoriteTrail.delete({
            where: { userId_trailId: { userId, trailId } },
        });
        if (!deleted) return null;
        return deleted.id;
    }
}

/**
 * The favorite trails service instance.
 */
export const favoriteTrailsService = new FavoriteTrailsService();
