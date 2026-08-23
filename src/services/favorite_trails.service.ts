import { PrismaClient } from "@/generated/prisma/client";
import {
    FavoriteTrail,
    FavoriteTrailSchema,
} from "@/lib/validations/favorite_trail";

/**
 * FavoriteTrailsService for the favorite trail entity. This service is used to create, update, and get favorite trails from the database.
 * @param db - The database client.
 *
 * @example
 * const favoriteTrailsService = new FavoriteTrailsService(db);
 * const favoriteTrail = await favoriteTrailsService.createFavoriteTrail({
 *     trailId: 1,
 *     userId: 1,
 * });  
 * console.log(favoriteTrail);
 */
export class FavoriteTrailsService {
    constructor(private readonly db: PrismaClient) {}

    /**
     * Create a new favorite trail.
     * @param favoriteTrail - The favorite trail to create.
     * @returns The created favorite trail. If the favorite trail already exists, returns null.
     */
    async createFavoriteTrail(
        favoriteTrail: FavoriteTrail,
    ): Promise<FavoriteTrail | null> {
        const created = await this.db.favoriteTrail.create({
            data: favoriteTrail,
        });
        if (!created) return null;
        return FavoriteTrailSchema.parse(created);
    }

    /**
     * Delete a favorite trail.
     * @param id - The id of the favorite trail to delete.
     * @returns The deleted favorite trail. If no favorite trail is found, returns null.
     */
    async deleteFavoriteTrail(id: number): Promise<number | null> {
        const deleted = await this.db.favoriteTrail.delete({
            where: { id },
        });
        if (!deleted) return null;
        return id;
    }
}
