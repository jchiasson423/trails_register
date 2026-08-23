import { PrismaClient } from "@/generated/prisma/client";
import {
    FavoritePark,
    FavoriteParkSchema,
} from "@/lib/validations/favorite_park";

/**
 * FavoriteParksService for the favorite park entity. This service is used to create, update, and get favorite parks from the database.
 * @param db - The database client.
 *
 * @example
 * const favoriteParksService = new FavoriteParksService(db);
 * const favoritePark = await favoriteParksService.createFavoritePark({
 *     parkId: 1,
 *     userId: 1,
 * });  
 * console.log(favoritePark);
 */
export class FavoriteParksService {
    constructor(private readonly db: PrismaClient) {}

    /**
     * Create a new favorite park.
     * @param favoritePark - The favorite park to create.
     * @returns The created favorite park. If the favorite park already exists, returns null.
     */
    async createFavoritePark(
        favoritePark: FavoritePark,
    ): Promise<FavoritePark | null> {
        const created = await this.db.favoritePark.create({
            data: favoritePark,
        });
        if (!created) return null;
        return FavoriteParkSchema.parse(created);
    }

    /**
     * Delete a favorite park.
     * @param id - The id of the favorite park to delete.
     * @returns The deleted favorite park. If no favorite park is found, returns null.
     */
    async deleteFavoritePark(id: number): Promise<number | null> {
        const deleted = await this.db.favoritePark.delete({
            where: { id },
        });
        if (!deleted) return null;
        return id;
    }
}
