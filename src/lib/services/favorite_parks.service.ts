import {
    FavoritePark,
    FavoriteParkSchema,
} from "@/lib/validations/favorite_park";
import { db } from "../db";

/**
 * FavoriteParksService for the favorite park entity. This service is used to create, update, and get favorite parks from the database.
 *
 * @example
 * const favoritePark = await favoriteParksService.createFavoritePark({
 *     parkId: 1,
 *     userId: 1,
 * });
 * console.log(favoritePark);
 */
export class FavoriteParksService {
    /**
     * Create a new favorite park.
     * @param favoritePark - The favorite park to create.
     * @returns The created favorite park. If the favorite park already exists, returns null.
     */
    async createFavoritePark(
        favoritePark: FavoritePark,
    ): Promise<FavoritePark | null> {
        const created = await db.favoritePark.create({
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
        const deleted = await db.favoritePark.delete({
            where: { id },
        });
        if (!deleted) return null;
        return id;
    }
}

/**
 * The favorite parks service instance.
 */
export const favoriteParksService = new FavoriteParksService();
