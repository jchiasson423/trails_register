import { Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { Park, ParkSchema, ParkUpdate } from "@/lib/validations/park";
import { PointCoordinates, PointSchema } from "@/lib/validations/geo";
import {
    ParkViewModel,
    ParkViewModelSchema,
} from "@/lib/view_models/park_view_model";

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
        const [created] = await db.$queryRaw<
            Array<{
                id: number;
                name: string;
                description: string;
                regionId: number;
                lat: number;
                lng: number;
            }>
        >`
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
                ST_SetSRID(ST_MakePoint(${park.location.coordinates.longitude}, ${park.location.coordinates.latitude}), 4326)
            RETURNING 
                id,
                name,
                description,
                regionId,
                ST_Y(location::geometry) AS lat,
                ST_X(location::geometry) AS lng;
        `;
        return ParkSchema.parse({
            id: created.id,
            name: created.name,
            description: created.description,
            regionId: created.regionId,
            location: PointSchema.parse({
                coordinates: {
                    latitude: created.lat,
                    longitude: created.lng,
                },
            }),
        });
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

        updates.push(Prisma.sql`"regionId" = ${park.regionId}`);

        if (park.location?.coordinates) {
            const { longitude, latitude } = park.location.coordinates;
            updates.push(
                Prisma.sql`"location" = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`,
            );
        }

        if (updates.length === 0) {
            return this.getPark(id);
        }

        const query = Prisma.sql`
            UPDATE "Park"
            SET ${Prisma.join(updates, ", ")}
            WHERE "id" = ${id}
            RETURNING 
                id,
                name,
                description,
                regionId,
                ST_Y(location::geometry) AS lat,
                ST_X(location::geometry) AS lng;
        `;

        const [updated] = await db.$queryRaw<
            Array<{
                id: number;
                name: string;
                description: string;
                regionId: number;
                lat: number;
                lng: number;
            }>
        >(query);

        if (!updated) return null;

        return ParkSchema.parse({
            id: updated.id,
            name: updated.name,
            description: updated.description,
            regionId: updated.regionId,
            location: PointSchema.parse({
                coordinates: {
                    latitude: updated.lat,
                    longitude: updated.lng,
                },
            }),
        });
    }

    /**
     * Delete a park.
     * @param id - The id of the park to delete.
     * @returns The deleted park. If no park is found, returns null.
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
        const query = Prisma.sql`
            SELECT 
                id, 
                name, 
                description, 
                regionId, 
                ST_Y(location::geometry) AS lat, 
                ST_X(location::geometry) AS lng 
                FROM "Park" 
                WHERE "id" = ${id}
        `;
        const [park] = await db.$queryRaw<
            Array<{
                id: number;
                name: string;
                description: string;
                regionId: number;
                lat: number;
                lng: number;
            }>
        >(query);
        if (!park) return null;
        return ParkSchema.parse({
            id: park.id,
            name: park.name,
            description: park.description,
            regionId: park.regionId,
            location: PointSchema.parse({
                coordinates: {
                    latitude: park.lat,
                    longitude: park.lng,
                },
            }),
        });
    }

    /**
     * Get all parks.
     * @param search - The search query.
     * @param location - The location to get the parks from. If location and distance are provided, the parks will be filtered by distance.
     * @param distance - The distance to get the parks from. If location and distance are provided, the parks will be filtered by distance.
     * @returns The parks. If no parks are found, returns null.
     */
    async getParks(
        search: string | undefined,
        location: PointCoordinates | undefined,
        distance: number | undefined,
    ): Promise<Park[] | null> {
        const whereClause = this.buildSearchWhereClause(
            search,
            location,
            distance,
        );

        const distanceSelect =
            location && distance
                ? this.buildDistanceSelect(location)
                : Prisma.empty;

        const orderByClause =
            location && distance
                ? Prisma.sql`ORDER BY "distanceMeters" ASC`
                : Prisma.sql`ORDER BY "name" ASC`;

        // CORRECTION : Utiliser Prisma.sql au lieu d'une string classique
        const query = Prisma.sql`
            SELECT id, 
                name, 
                description, 
                regionId,
                ST_Y(location::geometry) AS lat,
                ST_X(location::geometry) AS lng
                ${distanceSelect}
            FROM "Park" 
            ${whereClause}
            ${orderByClause}
        `;

        const parks = await db.$queryRaw<
            Array<{
                id: number;
                name: string;
                description: string;
                regionId: number;
                lat: number;
                lng: number;
                distanceMeters: number;
            }>
        >(query); // On passe directement l'objet query généré par Prisma.sql

        return parks.map((park) => ({
            id: park.id,
            name: park.name,
            description: park.description,
            regionId: park.regionId,
            location: PointSchema.parse({
                coordinates: {
                    latitude: park.lat,
                    longitude: park.lng,
                },
            }),
        }));
    }

    /**
     * Get a park view model by id.
     * @param id - The id of the park to get.
     * @returns The park view model. If no park is found, returns null.
     */
    async getParkViewModel(
        id: number,
        userId: number | undefined | null,
    ): Promise<ParkViewModel | null> {
        const [park] = await db.$queryRaw<
            Array<{
                id: number;
                name: string;
                description: string;
                lat: number;
                lng: number;
                regionName: string;
                trailCount: number;
                isFavorite: boolean;
            }>
        >`SELECT 
            id, 
            name, 
            description, 
            ST_Y(location::geometry) AS lat,
            ST_X(location::geometry) AS lng,
            "Region"."name" AS "regionName",
            COUNT("Trail"."id") AS "trailCount",
            ${userId ? Prisma.sql`EXISTS (SELECT 1 FROM "Favorite" WHERE "Favorite"."parkId" = "Park"."id" AND "Favorite"."userId" = ${userId}) AS "isFavorite"` : Prisma.sql`NULL AS "isFavorite"`}
            FROM "Park" 
            LEFT JOIN "Region" ON "Park"."regionId" = "Region"."id"
            LEFT JOIN "Trail" ON "Park"."id" = "Trail"."parkId"
            ${userId ? Prisma.sql`LEFT JOIN "Favorite" ON "Favorite"."parkId" = "Park"."id" AND "Favorite"."userId" = ${userId}` : Prisma.empty}
            WHERE "Park"."id" = ${id}
            GROUP BY "Park"."id", "Region"."name"
            `;
        if (!park) return null;
        return ParkViewModelSchema.parse({
            id: park.id,
            name: park.name,
            description: park.description,
            regionName: park.regionName,
            location: PointSchema.parse({
                coordinates: {
                    latitude: park.lat,
                    longitude: park.lng,
                },
            }),
            trailCount: park.trailCount,
            isFavorite: park.isFavorite,
        });
    }

    /**
     * Get all parks view models.
     * @param search - The search query.
     * @param location - The location to get the parks from. If location and distance are provided, the parks will be filtered by distance.
     * @param distance - The distance to get the parks from. If location and distance are provided, the parks will be filtered by distance.
     * @returns The parks view models. If no parks are found, returns null.
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
                ? this.buildDistanceSelect(location)
                : Prisma.empty;

        const orderByClause =
            location && distance
                ? Prisma.sql`ORDER BY "distanceMeters" ASC`
                : Prisma.sql`ORDER BY "Park"."name" ASC`;

        // Utilisation directe de Prisma.sql pour combiner les fragments en sécurité
        const query = Prisma.sql`
            SELECT 
                "Park".id, 
                "Park".name, 
                "Park".description, 
                "Park"."regionId",
                ST_Y("Park".location::geometry) AS lat,
                ST_X("Park".location::geometry) AS lng,
                "Region"."name" AS "regionName",
                ${userId ? Prisma.sql`EXISTS (SELECT 1 FROM "Favorite" WHERE "Favorite"."parkId" = "Park"."id" AND "Favorite"."userId" = ${userId}) AS "isFavorite"` : Prisma.sql`NULL AS "isFavorite"`}
                ${distanceSelect}
            FROM "Park"
            LEFT JOIN "Region" ON "Park"."regionId" = "Region"."id"
            LEFT JOIN "Trail" ON "Park"."id" = "Trail"."parkId"
            ${userId ? Prisma.sql`LEFT JOIN "Favorite" ON "Favorite"."parkId" = "Park"."id" AND "Favorite"."userId" = ${userId}` : Prisma.empty}
            ${whereClause}
            GROUP BY "Park".id, "Region".name
            ${orderByClause};
        `;

        const parks = await db.$queryRaw<
            Array<{
                id: number;
                name: string;
                description: string;
                regionId: number;
                lat: number;
                lng: number;
                regionName: string;
                trailCount: number;
                isFavorite: boolean;
                distanceMeters: number;
            }>
        >(query);

        return parks.map((park) => ({
            id: park.id,
            name: park.name,
            description: park.description,
            regionId: park.regionId,
            location: PointSchema.parse({
                coordinates: {
                    latitude: park.lat,
                    longitude: park.lng,
                },
            }),
            regionName: park.regionName,
            trailCount: park.trailCount,
            isFavorite: park.isFavorite,
        }));
    }

    /**
     * Get all favorite parks.
     * @param userId - The id of the user to get the favorite parks for.
     * @returns The favorite parks. If no favorite parks are found, returns null.
     */
    async getFavoriteParks(userId: number): Promise<ParkViewModel[]> {
        const query = Prisma.sql`
            SELECT 
                "Park".id, 
                "Park".name, 
                "Park".description, 
                "Park"."regionId",
                ST_Y("Park".location::geometry) AS lat,
                ST_X("Park".location::geometry) AS lng,
                "Region"."name" AS "regionName",
                COUNT("Trail"."id") AS "trailCount",
            FROM "Park"
            LEFT JOIN "Favorite" ON "Favorite"."parkId" = "Park"."id" AND "Favorite"."userId" = ${userId}
            WHERE "Favorite"."userId" = ${userId}
            GROUP BY "Park".id, "Region".name
            ORDER BY "Park".name ASC;
        `;
        const parks = await db.$queryRaw<
            Array<{
                id: number;
                name: string;
                description: string;
                regionId: number;
                lat: number;
                lng: number;
                regionName: string;
                trailCount: number;
            }>
        >(query);
        return parks.map((park) => ({
            id: park.id,
            name: park.name,
            description: park.description,
            regionId: park.regionId,
            location: PointSchema.parse({
                coordinates: {
                    latitude: park.lat,
                    longitude: park.lng,
                },
            }),
            regionName: park.regionName,
            trailCount: park.trailCount,
            isFavorite: true,
        }));
    }

    /**
     * Build the search where clause.
     * @param search - The search query.
     * @param location - The location to build the search where clause for. If location and distance are provided, the parks will be filtered by distance.
     * @param distance - The distance to build the search where clause for. If location and distance are provided, the parks will be filtered by distance.
     * @returns The search where clause.
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
                Prisma.sql`ST_DWithin(
                    location::geography,
                    ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326)::geography,
                    ${distance}
                )`,
            );
        }

        return conditions.length > 0
            ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
            : Prisma.empty;
    }

    /**
     * Build the distance select clause.
     * @param location - The location to build the distance select clause for.
     * @returns The distance select clause.
     */
    private buildDistanceSelect(location: PointCoordinates): Prisma.Sql {
        return Prisma.sql`, ST_Distance(
        location::geography,
        ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326)::geography
      ) AS "distanceMeters"`;
    }
}

/**
 * The parks service instance.
 */
export const parksService = new ParksService();
