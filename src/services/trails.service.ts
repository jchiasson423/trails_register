import { Difficulty, Prisma, PrismaClient } from "@/generated/prisma/client";
import { PointCoordinates, PointSchema } from "@/lib/validations/geo";
import { Trail, TrailSchema, TrailUpdate } from "@/lib/validations/trail";
import {
    TrailViewModel,
    TrailViewModelSchema,
} from "@/lib/view_models/trail_view_model";

/**
 * TrailsService for the trail entity. This service is used to create, update, and get trails from the database.
 * @param db - The database client.
 *
 * @example
 * const trailsService = new TrailsService(db);
 * const trail = await trailsService.createTrail({
 *     name: "Trail 1",
 *     description: "Description 1",
 *     parkId: 1,
 *     difficulty: "easy",
 *     length: 1000,
 *     elevationChange: 100,
 *     duration: 100,
 *     trailhead: { coordinates: { latitude: 45.5, longitude: -73.5 } },
 * });
 * console.log(trail);
 */
export class TrailsService {
    constructor(private readonly db: PrismaClient) {}

    /**
     * Create a new trail.
     * @param trail - The trail to create.
     * @returns The created trail. If the trail already exists, returns null.
     */
    async createTrail(trail: Trail): Promise<Trail | null> {
        const [created] = await this.db.$queryRaw<
            Array<{
                id: number;
                name: string;
                description: string;
                parkId: number;
                difficulty: Difficulty;
                length: number;
                elevationChange: number;
                duration: number;
                lat: number;
                lng: number;
            }>
        >`
            INSERT INTO "Trail" (
                "name", 
                "description", 
                "parkId", 
                "difficulty", 
                "length", 
                "elevationChange", 
                "duration",
                "trailhead",
                )
            VALUES (
                ${trail.name}, 
                ${trail.description}, 
                ${trail.parkId}, 
                ${trail.difficulty}, 
                ${trail.length}, 
                ${trail.elevationChange}, 
                ${trail.duration},
                ST_SetSRID(ST_MakePoint(${trail.trailhead?.coordinates.longitude}, ${trail.trailhead?.coordinates.latitude}), 4326)
            RETURNING 
                id,
                name,
                description,
                parkId,
                difficulty,
                length,
                elevationChange,
                duration,
                ST_Y(trailhead::geometry) AS lat,
                ST_X(trailhead::geometry) AS lng;
        `;
        return TrailSchema.parse({
            id: created.id,
            name: created.name,
            description: created.description,
            parkId: created.parkId,
            difficulty: created.difficulty,
            length: created.length,
            elevationChange: created.elevationChange,
            duration: created.duration,
            trailhead: PointSchema.parse({
                coordinates: {
                    latitude: created.lat,
                    longitude: created.lng,
                },
            }),
        });
    }

    /**
     * Update a trail.
     * @param id - The id of the trail to update.
     * @param trail - The trail to update.
     * @returns The updated trail. If no trail is found, returns null.
     */
    async updateTrail(id: number, trail: TrailUpdate): Promise<Trail | null> {
        const updates: Prisma.Sql[] = [];

        if (trail.name !== undefined) {
            updates.push(Prisma.sql`"name" = ${trail.name}`);
        }
        if (trail.description !== undefined) {
            updates.push(Prisma.sql`"description" = ${trail.description}`);
        }
        if (trail.parkId !== undefined) {
            updates.push(Prisma.sql`"parkId" = ${trail.parkId}`);
        }
        if (trail.difficulty !== undefined) {
            updates.push(Prisma.sql`"difficulty" = ${trail.difficulty}`);
        }
        if (trail.length !== undefined) {
            updates.push(Prisma.sql`"length" = ${trail.length}`);
        }
        if (trail.elevationChange !== undefined) {
            updates.push(
                Prisma.sql`"elevationChange" = ${trail.elevationChange}`,
            );
        }
        if (trail.duration !== undefined) {
            updates.push(Prisma.sql`"duration" = ${trail.duration}`);
        }
        if (trail.trailhead?.coordinates) {
            const { longitude, latitude } = trail.trailhead.coordinates;
            updates.push(
                Prisma.sql`"trailhead" = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`,
            );
        } else {
            updates.push(Prisma.sql`"trailhead" = NULL`);
        }

        if (updates.length === 0) {
            return this.getTrail(id);
        }

        const query = Prisma.sql`
            UPDATE "Trail"
            SET ${Prisma.join(updates, ", ")}
            WHERE "id" = ${id}
            RETURNING 
                id,
                name,
                description,
                parkId,
                difficulty,
                length,
                elevationChange,
                duration,
                ST_Y(trailhead::geometry) AS lat,
                ST_X(trailhead::geometry) AS lng;
        `;

        const [updated] = await this.db.$queryRaw<
            Array<{
                id: number;
                name: string;
                description: string;
                parkId: number;
                difficulty: Difficulty;
                length: number;
                elevationChange: number;
                duration: number;
                lat: number;
                lng: number;
            }>
        >(query);

        if (!updated) return null;

        return TrailSchema.parse({
            id: updated.id,
            name: updated.name,
            description: updated.description,
            parkId: updated.parkId,
            difficulty: updated.difficulty,
            length: updated.length,
            elevationChange: updated.elevationChange,
            duration: updated.duration,
            trailhead: PointSchema.parse({
                coordinates: {
                    latitude: updated.lat,
                    longitude: updated.lng,
                },
            }),
        });
    }

    /**
     * Delete a trail.
     * @param id - The id of the trail to delete.
     * @returns The deleted trail. If no trail is found, returns null.
     */
    async deleteTrail(id: number): Promise<number | null> {
        const deleted = await this.db.trail.delete({
            where: { id },
        });
        if (!deleted) return null;
        return id;
    }

    /**
     * Get a trail by id.
     * @param id - The id of the trail to get.
     * @returns The trail. If no trail is found, returns null.
     */
    async getTrail(id: number): Promise<Trail | null> {
        const query = Prisma.sql`
            SELECT 
                id, 
                name, 
                description, 
                parkId, 
                difficulty, 
                length, 
                elevationChange, 
                duration, 
                ST_Y(trailhead::geometry) AS lat, 
                ST_X(trailhead::geometry) AS lng 
                FROM "Trail" 
                WHERE "id" = ${id}
        `;
        const [trail] = await this.db.$queryRaw<
            Array<{
                id: number;
                name: string;
                description: string;
                parkId: number;
                difficulty: Difficulty;
                length: number;
                elevationChange: number;
                duration: number;
                lat: number;
                lng: number;
            }>
        >(query);
        if (!trail) return null;
        return TrailSchema.parse({
            id: trail.id,
            name: trail.name,
            description: trail.description,
            parkId: trail.parkId,
            difficulty: trail.difficulty,
            length: trail.length,
            elevationChange: trail.elevationChange,
            duration: trail.duration,
            trailhead: PointSchema.parse({
                coordinates: {
                    latitude: trail.lat,
                    longitude: trail.lng,
                },
            }),
        });
    }

    /**
     * Get all trails.
     * @param search - The search query.
     * @param location - The location to get the trails for.
     * @param distance - The distance to get the trails for.
     * @returns The trails.
     */
    async getTrails(
        search: string | undefined,
        location: PointCoordinates | undefined,
        distance: number | undefined,
    ): Promise<Trail[] | null> {
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
        const query = Prisma.sql`
            SELECT 
                id, 
                name, 
                description, 
                parkId, 
                difficulty, 
                length, 
                elevationChange, 
                duration, 
                ST_Y(trailhead::geometry) AS lat, 
                ST_X(trailhead::geometry) AS lng 
                ${distanceSelect}
                FROM "Trail" 
                ${whereClause}
                ${orderByClause}
        `;
        const trails = await this.db.$queryRaw<
            Array<{
                id: number;
                name: string;
                description: string;
                parkId: number;
                difficulty: Difficulty;
                length: number;
                elevationChange: number;
                duration: number;
                lat: number;
                lng: number;
            }>
        >(query);
        return trails.map((trail) =>
            TrailSchema.parse({
                id: trail.id,
                name: trail.name,
                description: trail.description,
                parkId: trail.parkId,
                difficulty: trail.difficulty,
                length: trail.length,
                elevationChange: trail.elevationChange,
                duration: trail.duration,
                trailhead: PointSchema.parse({
                    coordinates: {
                        latitude: trail.lat,
                        longitude: trail.lng,
                    },
                }),
            }),
        );
    }

    /**
     * Get a trail view model by id.
     * @param id - The id of the trail to get.
     * @returns The trail view model. If no trail is found, returns null.
     */
    async getTrailViewModel(
        id: number,
        userId: number,
    ): Promise<TrailViewModel | null> {
        const query = Prisma.sql`
            SELECT 
                id, 
                name, 
                description, 
                parkId, 
                difficulty, 
                length, 
                elevationChange, 
                duration, 
                ST_Y(trailhead::geometry) AS lat, 
                ST_X(trailhead::geometry) AS lng,
                "Park"."name" AS "parkName",
                ST_Y("Park"."location"::geometry) AS "parkLat",
                ST_X("Park"."location"::geometry) AS "parkLng",
                EXISTS (SELECT 1 FROM "Favorite" WHERE "Favorite"."trailId" = "Trail"."id" AND "Favorite"."userId" = ${userId}) AS "isFavorite"
                FROM "Trail" 
                LEFT JOIN "Park" ON "Trail"."parkId" = "Park"."id"
                LEFT JOIN "Favorite" ON "Favorite"."trailId" = "Trail"."id" AND "Favorite"."userId" = ${userId}
                WHERE "id" = ${id}
        `;
        const [trail] = await this.db.$queryRaw<
            Array<{
                id: number;
                name: string;
                description: string;
                parkId: number;
                difficulty: Difficulty;
                length: number;
                elevationChange: number;
                duration: number;
                lat: number;
                lng: number;
                parkName: string;
                parkLat: number;
                parkLng: number;
                isFavorite: boolean;
            }>
        >(query);
        if (!trail) return null;
        return TrailViewModelSchema.parse({
            id: trail.id,
            name: trail.name,
            description: trail.description,
            parkName: trail.parkName,
            difficulty: trail.difficulty,
            length: trail.length,
            elevationChange: trail.elevationChange,
            duration: trail.duration,
            trailhead: PointSchema.parse({
                coordinates: {
                    latitude: trail.lat,
                    longitude: trail.lng,
                },
            }),
            parkLocation: PointSchema.parse({
                coordinates: {
                    latitude: trail.parkLat,
                    longitude: trail.parkLng,
                },
            }),
            isFavorite: trail.isFavorite,
        });
    }

    /**
     * Get all trail view models.
     * @param search - The search query.
     * @param location - The location to get the trail view models for.
     * @param distance - The distance to get the trail view models for.
     * @returns The trail view models.
     */
    async getTrailViewModels(
        search: string | undefined,
        location: PointCoordinates | undefined,
        distance: number | undefined,
        userId: number,
    ): Promise<TrailViewModel[] | null> {
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
        const query = Prisma.sql`
            SELECT 
                id, 
                name, 
                description, 
                parkId, 
                difficulty, 
                length, 
                elevationChange, 
                duration, 
                ST_Y(trailhead::geometry) AS lat, 
                ST_X(trailhead::geometry) AS lng,
                "Park"."name" AS "parkName",
                ST_Y("Park"."location"::geometry) AS "parkLat",
                ST_X("Park"."location"::geometry) AS "parkLng",
                EXISTS (SELECT 1 FROM "Favorite" WHERE "Favorite"."trailId" = "Trail"."id" AND "Favorite"."userId" = ${userId}) AS "isFavorite"
                ${distanceSelect}
                FROM "Trail" 
                LEFT JOIN "Park" ON "Trail"."parkId" = "Park"."id"
                LEFT JOIN "Favorite" ON "Favorite"."trailId" = "Trail"."id" AND "Favorite"."userId" = ${userId}
                ${whereClause}
                ${orderByClause}
        `;
        const trails = await this.db.$queryRaw<
            Array<{
                id: number;
                name: string;
                description: string;
                parkId: number;
                difficulty: Difficulty;
                length: number;
                elevationChange: number;
                duration: number;
                lat: number;
                lng: number;
                parkName: string;
                parkLat: number;
                parkLng: number;
                isFavorite: boolean;
            }>
        >(query);
        return trails.map((trail) =>
            TrailViewModelSchema.parse({
                id: trail.id,
                name: trail.name,
                description: trail.description,
                parkName: trail.parkName,
                difficulty: trail.difficulty,
                length: trail.length,
                elevationChange: trail.elevationChange,
                duration: trail.duration,
                trailhead: PointSchema.parse({
                    coordinates: {
                        latitude: trail.lat,
                        longitude: trail.lng,
                    },
                }),
                parkLocation: PointSchema.parse({
                    coordinates: {
                        latitude: trail.parkLat,
                        longitude: trail.parkLng,
                    },
                }),
                isFavorite: trail.isFavorite,
            }),
        );
    }

    /**
     * Get all favorite trails.
     * @param userId - The id of the user to get the favorite trails for.
     * @returns The favorite trails. If no favorite trails are found, returns null.
     */
    async getFavoriteTrails(userId: number): Promise<TrailViewModel[]> {
        const query = Prisma.sql`
            SELECT 
                "Trail".id, 
                "Trail".name, 
                "Trail".description, 
                "Trail".parkId, 
                "Trail".difficulty, 
                "Trail".length, 
                "Trail".elevationChange, 
                "Trail".duration, 
                ST_Y("Trail".trailhead::geometry) AS "lat",
                ST_X("Trail".trailhead::geometry) AS "lng",
                "Park"."name" AS "parkName",
                ST_Y("Park"."location"::geometry) AS "parkLat",
                ST_X("Park"."location"::geometry) AS "parkLng",
                FROM "Trail" 
                LEFT JOIN "Park" ON "Trail"."parkId" = "Park"."id"
                LEFT JOIN "Favorite" ON "Favorite"."trailId" = "Trail"."id" AND "Favorite"."userId" = ${userId}
                WHERE "Favorite"."userId" = ${userId}
                ORDER BY "Trail".name ASC;
        `;
        const trails = await this.db.$queryRaw<
            Array<{
                id: number;
                name: string;
                description: string;
                parkId: number;
                difficulty: Difficulty;
                length: number;
                elevationChange: number;
                duration: number;
                lat: number;
                lng: number;
                parkName: string;
                parkLat: number;
                parkLng: number;
                isFavorite: boolean;
            }>
        >(query);
        return trails.map((trail) =>
            TrailViewModelSchema.parse({
                id: trail.id,
                name: trail.name,
                description: trail.description,
                parkName: trail.parkName,
                difficulty: trail.difficulty,
                length: trail.length,
                elevationChange: trail.elevationChange,
                duration: trail.duration,
                trailhead: PointSchema.parse({
                    coordinates: {
                        latitude: trail.lat,
                        longitude: trail.lng,
                    },
                }),
                parkLocation: PointSchema.parse({
                    coordinates: {
                        latitude: trail.parkLat,
                        longitude: trail.parkLng,
                    },
                }),
                isFavorite: true,
            }),
        );
    }

    /**
     * Build the search where clause.
     * @param search - The search query.
     * @param location - The location to build the search where clause for. If location and distance are provided, the trails will be filtered by distance.
     * @param distance - The distance to build the search where clause for. If location and distance are provided, the trails will be filtered by distance.
     * @returns The search where clause.
     */
    private buildSearchWhereClause(
        search: string | undefined,
        location: PointCoordinates | undefined,
        distance: number | undefined,
    ): Prisma.Sql {
        const conditions: Prisma.Sql[] = [];

        if (search) {
            conditions.push(Prisma.sql`"Trail".name ILIKE ${`%${search}%`}`);
        }

        if (location && distance) {
            conditions.push(
                Prisma.sql`ST_DWithin(
                    trailhead::geography,
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
        trailhead::geography,
        ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326)::geography
      ) AS "distanceMeters"`;
    }
}
