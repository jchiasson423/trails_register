import { Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { Park, ParkSchema, ParkUpdate } from "@/lib/validations/park";
import { PointCoordinates } from "@/lib/validations/geo";
import {
    ParkViewModel,
    ParkViewModelSchema,
} from "@/lib/view_models/park_view_model";
import {
    distanceSelectSql,
    makePointSql,
    pointFromLatLng,
    withinDistanceSql,
} from "./geo_sql";

type ParkRow = {
    id: number;
    name: string;
    description: string;
    regionId: number;
    lat: number;
    lng: number;
};

type ParkViewRow = {
    id: number;
    name: string;
    description: string;
    lat: number;
    lng: number;
    regionName: string | null;
    trailCount: number;
    isFavorite: boolean;
    hasFavoriteTrail: boolean;
};

/**
 * ParksService for the park entity. This service is used to create, update, and get parks from the database.
 * @example
 * const park = await parksService.createPark({
 *     name: "Park 1",
 *     description: "Description 1",
 *     regionId: 1,
 *     location: { coordinates: { latitude: 45.5, longitude: -73.5 } },
 * });
 * console.log(park);
 */
export class ParksService {
    /**
     * Create a new park.
     * @param park - The park to create.
     * @returns The created park. If the park already exists, returns null.
     */
    async createPark(park: Park): Promise<Park | null> {
        const [created] = await db.$queryRaw<ParkRow[]>`
            INSERT INTO "Park" (
                "name",
                "description",
                "regionId",
                "location"
            )
            VALUES (
                ${park.name},
                ${park.description},
                ${park.regionId},
                ${makePointSql(
                    park.location.coordinates.longitude,
                    park.location.coordinates.latitude,
                )}
            )
            RETURNING
                id,
                name,
                description,
                "regionId",
                ST_Y(location::geometry) AS lat,
                ST_X(location::geometry) AS lng
        `;
        if (!created) return null;
        return this.mapPark(created);
    }

    /**
     * Update a park.
     * @param id - The id of the park to update.
     * @param park - The park to update.
     * @returns The updated park. If no park is found, returns null.
     */
    async updatePark(id: number, park: ParkUpdate): Promise<Park | null> {
        const updates: Prisma.Sql[] = [];

        if (park.name !== undefined) {
            updates.push(Prisma.sql`"name" = ${park.name}`);
        }
        if (park.description !== undefined) {
            updates.push(Prisma.sql`"description" = ${park.description}`);
        }
        if (park.regionId !== undefined) {
            updates.push(Prisma.sql`"regionId" = ${park.regionId}`);
        }
        if (park.location?.coordinates) {
            const { longitude, latitude } = park.location.coordinates;
            updates.push(
                Prisma.sql`"location" = ${makePointSql(longitude, latitude)}`,
            );
        }

        if (updates.length === 0) {
            return this.getPark(id);
        }

        const [updated] = await db.$queryRaw<ParkRow[]>`
            UPDATE "Park"
            SET ${Prisma.join(updates, ", ")}
            WHERE "id" = ${id}
            RETURNING
                id,
                name,
                description,
                "regionId",
                ST_Y(location::geometry) AS lat,
                ST_X(location::geometry) AS lng
        `;

        if (!updated) return null;
        return this.mapPark(updated);
    }

    /**
     * Delete a park.
     * @param id - The id of the park to delete.
     * @returns The deleted park id. If no park is found, returns null.
     */
    async deletePark(id: number): Promise<number | null> {
        const deleted = await db.park.delete({
            where: { id },
        });
        if (!deleted) return null;
        return id;
    }

    /**
     * Get a park by id.
     * @param id - The id of the park to get.
     * @returns The park. If no park is found, returns null.
     */
    async getPark(id: number): Promise<Park | null> {
        const [park] = await db.$queryRaw<ParkRow[]>`
            SELECT
                id,
                name,
                description,
                "regionId",
                ST_Y(location::geometry) AS lat,
                ST_X(location::geometry) AS lng
            FROM "Park"
            WHERE "id" = ${id}
        `;
        if (!park) return null;
        return this.mapPark(park);
    }

    /**
     * Get all parks.
     * @param search - The search query.
     * @param location - The location to get the parks from. If location and distance are provided, the parks will be filtered by distance.
     * @param distance - The distance to get the parks from. If location and distance are provided, the parks will be filtered by distance.
     * @returns The parks.
     */
    async getParks(
        search: string | undefined,
        location: PointCoordinates | undefined,
        distance: number | undefined,
    ): Promise<Park[]> {
        const whereClause = this.buildSearchWhereClause(
            search,
            location,
            distance,
        );
        const distanceSelect =
            location && distance
                ? distanceSelectSql(`"Park"."location"`, location)
                : Prisma.empty;
        const orderByClause =
            location && distance
                ? Prisma.sql`ORDER BY "distanceMeters" ASC`
                : Prisma.sql`ORDER BY "name" ASC`;

        const parks = await db.$queryRaw<ParkRow[]>`
            SELECT
                id,
                name,
                description,
                "regionId",
                ST_Y(location::geometry) AS lat,
                ST_X(location::geometry) AS lng
                ${distanceSelect}
            FROM "Park"
            ${whereClause}
            ${orderByClause}
        `;

        return parks.map((park) => this.mapPark(park));
    }

    /**
     * Get a park view model by id.
     * @param id - The id of the park to get.
     * @param userId - Optional user for favorite flags.
     * @returns The park view model. If no park is found, returns null.
     */
    async getParkViewModel(
        id: number,
        userId: number | undefined | null,
    ): Promise<ParkViewModel | null> {
        const [park] = await db.$queryRaw<ParkViewRow[]>`
            SELECT
                "Park".id,
                "Park".name,
                "Park".description,
                ST_Y("Park".location::geometry) AS lat,
                ST_X("Park".location::geometry) AS lng,
                "Region"."name" AS "regionName",
                (SELECT COUNT(*)::int FROM "Trail" WHERE "Trail"."parkId" = "Park"."id") AS "trailCount",
                ${this.favoriteSelect(userId)}
            FROM "Park"
            LEFT JOIN "Region" ON "Park"."regionId" = "Region"."id"
            WHERE "Park"."id" = ${id}
        `;
        if (!park) return null;
        return this.mapParkViewModel(park);
    }

    /**
     * Get all parks view models.
     * @param search - The search query.
     * @param location - The location to get the parks from. If location and distance are provided, the parks will be filtered by distance.
     * @param distance - The distance to get the parks from. If location and distance are provided, the parks will be filtered by distance.
     * @param userId - Optional user for favorite flags.
     * @returns The parks view models.
     */
    async getParksViewModels(
        search: string | undefined,
        location: PointCoordinates | undefined,
        distance: number | undefined,
        userId: number | undefined | null,
    ): Promise<ParkViewModel[]> {
        const whereClause = this.buildSearchWhereClause(
            search,
            location,
            distance,
        );
        const distanceSelect =
            location && distance
                ? distanceSelectSql(`"Park"."location"`, location)
                : Prisma.empty;
        const orderByClause =
            location && distance
                ? Prisma.sql`ORDER BY "distanceMeters" ASC`
                : Prisma.sql`ORDER BY "Park"."name" ASC`;

        const parks = await db.$queryRaw<ParkViewRow[]>`
            SELECT
                "Park".id,
                "Park".name,
                "Park".description,
                ST_Y("Park".location::geometry) AS lat,
                ST_X("Park".location::geometry) AS lng,
                "Region"."name" AS "regionName",
                (SELECT COUNT(*)::int FROM "Trail" WHERE "Trail"."parkId" = "Park"."id") AS "trailCount",
                ${this.favoriteSelect(userId)}
                ${distanceSelect}
            FROM "Park"
            LEFT JOIN "Region" ON "Park"."regionId" = "Region"."id"
            ${whereClause}
            ${orderByClause}
        `;

        return parks.map((park) => this.mapParkViewModel(park));
    }

    /**
     * Get all favorite parks for a user.
     * @param userId - The id of the user to get the favorite parks for.
     * @returns The favorite parks.
     */
    async getFavoriteParks(userId: number): Promise<ParkViewModel[]> {
        const parks = await db.$queryRaw<ParkViewRow[]>`
            SELECT
                "Park".id,
                "Park".name,
                "Park".description,
                ST_Y("Park".location::geometry) AS lat,
                ST_X("Park".location::geometry) AS lng,
                "Region"."name" AS "regionName",
                (SELECT COUNT(*)::int FROM "Trail" WHERE "Trail"."parkId" = "Park"."id") AS "trailCount",
                true AS "isFavorite",
                EXISTS (
                    SELECT 1
                    FROM "FavoriteTrail" ft
                    INNER JOIN "Trail" t ON ft."trailId" = t."id"
                    WHERE t."parkId" = "Park"."id" AND ft."userId" = ${userId}
                ) AS "hasFavoriteTrail"
            FROM "Park"
            INNER JOIN "FavoritePark" ON "FavoritePark"."parkId" = "Park"."id"
            LEFT JOIN "Region" ON "Park"."regionId" = "Region"."id"
            WHERE "FavoritePark"."userId" = ${userId}
            ORDER BY "Park".name ASC
        `;

        return parks.map((park) => this.mapParkViewModel(park));
    }

    private favoriteSelect(userId: number | undefined | null): Prisma.Sql {
        if (!userId) {
            return Prisma.sql`false AS "isFavorite", false AS "hasFavoriteTrail"`;
        }
        return Prisma.sql`
            EXISTS (
                SELECT 1 FROM "FavoritePark" fp
                WHERE fp."parkId" = "Park"."id" AND fp."userId" = ${userId}
            ) AS "isFavorite",
            EXISTS (
                SELECT 1
                FROM "FavoriteTrail" ft
                INNER JOIN "Trail" t ON ft."trailId" = t."id"
                WHERE t."parkId" = "Park"."id" AND ft."userId" = ${userId}
            ) AS "hasFavoriteTrail"
        `;
    }

    private mapPark(row: ParkRow): Park {
        return ParkSchema.parse({
            id: row.id,
            name: row.name,
            description: row.description,
            regionId: row.regionId,
            location: pointFromLatLng(row.lat, row.lng),
        });
    }

    private mapParkViewModel(row: ParkViewRow): ParkViewModel {
        return ParkViewModelSchema.parse({
            id: row.id,
            name: row.name,
            description: row.description,
            regionName: row.regionName ?? undefined,
            location: pointFromLatLng(row.lat, row.lng),
            trailCount: Number(row.trailCount),
            isFavorite: Boolean(row.isFavorite),
            hasFavoriteTrail: Boolean(row.hasFavoriteTrail),
        });
    }

    /**
     * Build the search where clause.
     */
    private buildSearchWhereClause(
        search: string | undefined,
        location: PointCoordinates | undefined,
        distance: number | undefined,
    ): Prisma.Sql {
        const conditions: Prisma.Sql[] = [];

        if (search) {
            conditions.push(Prisma.sql`"Park".name ILIKE ${`%${search}%`}`);
        }

        if (location && distance) {
            conditions.push(
                withinDistanceSql(`"Park"."location"`, location, distance),
            );
        }

        return conditions.length > 0
            ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
            : Prisma.empty;
    }
}

/**
 * The parks service instance.
 */
export const parksService = new ParksService();
