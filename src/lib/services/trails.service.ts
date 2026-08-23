import { Difficulty, Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { PointCoordinates } from "@/lib/validations/geo";
import { Trail, TrailSchema, TrailUpdate } from "@/lib/validations/trail";
import {
    TrailViewModel,
    TrailViewModelSchema,
} from "@/lib/view_models/trail_view_model";
import {
    distanceSelectSql,
    makePointSql,
    pointFromLatLng,
    withinDistanceSql,
} from "./geo_sql";

type TrailRow = {
    id: number;
    name: string;
    description: string;
    parkId: number;
    difficulty: Difficulty;
    length: number;
    elevationChange: number;
    duration: number;
    lat: number | null;
    lng: number | null;
};

type TrailViewRow = TrailRow & {
    parkName: string | null;
    parkLat: number | null;
    parkLng: number | null;
    isFavorite: boolean;
};

/**
 * TrailsService for the trail entity. This service is used to create, update, and get trails from the database.
 * @example
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
    /**
     * Create a new trail.
     * @param trail - The trail to create.
     * @returns The created trail.
     */
    async createTrail(trail: Trail): Promise<Trail | null> {
        const trailheadSql = trail.trailhead?.coordinates
            ? makePointSql(
                  trail.trailhead.coordinates.longitude,
                  trail.trailhead.coordinates.latitude,
              )
            : Prisma.sql`NULL`;

        const [created] = await db.$queryRaw<TrailRow[]>`
            INSERT INTO "Trail" (
                "name",
                "description",
                "parkId",
                "difficulty",
                "length",
                "elevationChange",
                "duration",
                "trailhead"
            )
            VALUES (
                ${trail.name},
                ${trail.description},
                ${trail.parkId},
                ${trail.difficulty}::"Difficulty",
                ${trail.length},
                ${trail.elevationChange},
                ${trail.duration},
                ${trailheadSql}
            )
            RETURNING
                id,
                name,
                description,
                "parkId",
                difficulty,
                length,
                "elevationChange",
                duration,
                ST_Y(trailhead::geometry) AS lat,
                ST_X(trailhead::geometry) AS lng
        `;
        if (!created) return null;
        return this.mapTrail(created);
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
            updates.push(
                Prisma.sql`"difficulty" = ${trail.difficulty}::"Difficulty"`,
            );
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
        if (trail.trailhead !== undefined) {
            if (trail.trailhead?.coordinates) {
                const { longitude, latitude } = trail.trailhead.coordinates;
                updates.push(
                    Prisma.sql`"trailhead" = ${makePointSql(longitude, latitude)}`,
                );
            } else {
                updates.push(Prisma.sql`"trailhead" = NULL`);
            }
        }

        if (updates.length === 0) {
            return this.getTrail(id);
        }

        const [updated] = await db.$queryRaw<TrailRow[]>`
            UPDATE "Trail"
            SET ${Prisma.join(updates, ", ")}
            WHERE "id" = ${id}
            RETURNING
                id,
                name,
                description,
                "parkId",
                difficulty,
                length,
                "elevationChange",
                duration,
                ST_Y(trailhead::geometry) AS lat,
                ST_X(trailhead::geometry) AS lng
        `;

        if (!updated) return null;
        return this.mapTrail(updated);
    }

    /**
     * Delete a trail.
     * @param id - The id of the trail to delete.
     * @returns The deleted trail id. If no trail is found, returns null.
     */
    async deleteTrail(id: number): Promise<number | null> {
        const deleted = await db.trail.delete({
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
        const [trail] = await db.$queryRaw<TrailRow[]>`
            SELECT
                id,
                name,
                description,
                "parkId",
                difficulty,
                length,
                "elevationChange",
                duration,
                ST_Y(trailhead::geometry) AS lat,
                ST_X(trailhead::geometry) AS lng
            FROM "Trail"
            WHERE "id" = ${id}
        `;
        if (!trail) return null;
        return this.mapTrail(trail);
    }

    /**
     * Get all trails.
     * @param search - The search query.
     * @param location - The location to get the trails for.
     * @param distance - The distance to get the trails for.
     * @returns The trails.
     */
    async getTrails(
        search: string | undefined | null,
        location: PointCoordinates | undefined | null,
        distance: number | undefined,
    ): Promise<Trail[]> {
        const whereClause = this.buildSearchWhereClause(
            search,
            location,
            distance,
        );
        const distanceSelect =
            location && distance
                ? distanceSelectSql(`"Trail"."trailhead"`, location)
                : Prisma.empty;
        const orderByClause =
            location && distance
                ? Prisma.sql`ORDER BY "distanceMeters" ASC`
                : Prisma.sql`ORDER BY "name" ASC`;

        const trails = await db.$queryRaw<TrailRow[]>`
            SELECT
                id,
                name,
                description,
                "parkId",
                difficulty,
                length,
                "elevationChange",
                duration,
                ST_Y(trailhead::geometry) AS lat,
                ST_X(trailhead::geometry) AS lng
                ${distanceSelect}
            FROM "Trail"
            ${whereClause}
            ${orderByClause}
        `;

        return trails.map((trail) => this.mapTrail(trail));
    }

    /**
     * Get a trail view model by id.
     * @param id - The id of the trail to get.
     * @param userId - Optional user for favorite flag.
     * @returns The trail view model. If no trail is found, returns null.
     */
    async getTrailViewModel(
        id: number,
        userId: number | undefined | null,
    ): Promise<TrailViewModel | null> {
        const [trail] = await db.$queryRaw<TrailViewRow[]>`
            SELECT
                "Trail".id,
                "Trail".name,
                "Trail".description,
                "Trail"."parkId",
                "Trail".difficulty,
                "Trail".length,
                "Trail"."elevationChange",
                "Trail".duration,
                ST_Y("Trail".trailhead::geometry) AS lat,
                ST_X("Trail".trailhead::geometry) AS lng,
                "Park"."name" AS "parkName",
                ST_Y("Park"."location"::geometry) AS "parkLat",
                ST_X("Park"."location"::geometry) AS "parkLng",
                ${this.favoriteSelect(userId)}
            FROM "Trail"
            LEFT JOIN "Park" ON "Trail"."parkId" = "Park"."id"
            WHERE "Trail"."id" = ${id}
        `;
        if (!trail) return null;
        return this.mapTrailViewModel(trail);
    }

    /**
     * Get all trail view models.
     * @param search - The search query.
     * @param location - The location to get the trail view models for.
     * @param distance - The distance to get the trail view models for.
     * @param userId - Optional user for favorite flag.
     * @returns The trail view models.
     */
    async getTrailViewModels(
        search: string | undefined | null,
        location: PointCoordinates | undefined | null,
        distance: number | undefined | null,
        userId: number | undefined | null,
    ): Promise<TrailViewModel[]> {
        const whereClause = this.buildSearchWhereClause(
            search,
            location,
            distance,
        );
        const distanceSelect =
            location && distance
                ? distanceSelectSql(`"Trail"."trailhead"`, location)
                : Prisma.empty;
        const orderByClause =
            location && distance
                ? Prisma.sql`ORDER BY "distanceMeters" ASC`
                : Prisma.sql`ORDER BY "Trail"."name" ASC`;

        const trails = await db.$queryRaw<TrailViewRow[]>`
            SELECT
                "Trail".id,
                "Trail".name,
                "Trail".description,
                "Trail"."parkId",
                "Trail".difficulty,
                "Trail".length,
                "Trail"."elevationChange",
                "Trail".duration,
                ST_Y("Trail".trailhead::geometry) AS lat,
                ST_X("Trail".trailhead::geometry) AS lng,
                "Park"."name" AS "parkName",
                ST_Y("Park"."location"::geometry) AS "parkLat",
                ST_X("Park"."location"::geometry) AS "parkLng",
                ${this.favoriteSelect(userId)}
                ${distanceSelect}
            FROM "Trail"
            LEFT JOIN "Park" ON "Trail"."parkId" = "Park"."id"
            ${whereClause}
            ${orderByClause}
        `;

        return trails.map((trail) => this.mapTrailViewModel(trail));
    }

    /**
     * Get all favorite trails for a user.
     * @param userId - The id of the user to get the favorite trails for.
     * @returns The favorite trails.
     */
    async getFavoriteTrails(userId: number): Promise<TrailViewModel[]> {
        const trails = await db.$queryRaw<TrailViewRow[]>`
            SELECT
                "Trail".id,
                "Trail".name,
                "Trail".description,
                "Trail"."parkId",
                "Trail".difficulty,
                "Trail".length,
                "Trail"."elevationChange",
                "Trail".duration,
                ST_Y("Trail".trailhead::geometry) AS lat,
                ST_X("Trail".trailhead::geometry) AS lng,
                "Park"."name" AS "parkName",
                ST_Y("Park"."location"::geometry) AS "parkLat",
                ST_X("Park"."location"::geometry) AS "parkLng",
                true AS "isFavorite"
            FROM "Trail"
            INNER JOIN "FavoriteTrail" ON "FavoriteTrail"."trailId" = "Trail"."id"
            LEFT JOIN "Park" ON "Trail"."parkId" = "Park"."id"
            WHERE "FavoriteTrail"."userId" = ${userId}
            ORDER BY "Trail".name ASC
        `;

        return trails.map((trail) => this.mapTrailViewModel(trail));
    }

    private favoriteSelect(userId: number | undefined | null): Prisma.Sql {
        if (!userId) {
            return Prisma.sql`false AS "isFavorite"`;
        }
        return Prisma.sql`
            EXISTS (
                SELECT 1 FROM "FavoriteTrail" ft
                WHERE ft."trailId" = "Trail"."id" AND ft."userId" = ${userId}
            ) AS "isFavorite"
        `;
    }

    private mapTrail(row: TrailRow): Trail {
        return TrailSchema.parse({
            id: row.id,
            name: row.name,
            description: row.description,
            parkId: row.parkId,
            difficulty: row.difficulty,
            length: row.length,
            elevationChange: row.elevationChange,
            duration: row.duration,
            trailhead: pointFromLatLng(row.lat, row.lng),
        });
    }

    private mapTrailViewModel(row: TrailViewRow): TrailViewModel {
        return TrailViewModelSchema.parse({
            id: row.id,
            name: row.name,
            description: row.description,
            parkName: row.parkName ?? undefined,
            difficulty: row.difficulty,
            length: row.length,
            elevationChange: row.elevationChange,
            duration: row.duration,
            trailhead: pointFromLatLng(row.lat, row.lng),
            parkLocation: pointFromLatLng(row.parkLat, row.parkLng),
            isFavorite: Boolean(row.isFavorite),
        });
    }

    /**
     * Build the search where clause.
     */
    private buildSearchWhereClause(
        search: string | undefined | null,
        location: PointCoordinates | undefined | null,
        distance: number | undefined | null,
    ): Prisma.Sql {
        const conditions: Prisma.Sql[] = [];

        if (search) {
            conditions.push(Prisma.sql`"Trail".name ILIKE ${`%${search}%`}`);
        }

        if (location && distance) {
            conditions.push(
                withinDistanceSql(`"Trail"."trailhead"`, location, distance),
            );
        }

        return conditions.length > 0
            ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
            : Prisma.empty;
    }
}

/**
 * The trails service instance.
 */
export const trailsService = new TrailsService();
