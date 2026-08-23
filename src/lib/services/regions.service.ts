import { Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { Region, RegionUpdate } from "@/lib/validations/region";
import {
    RegionViewModel,
    RegionViewModelSchema,
} from "@/lib/view_models/region_view_model";

type RegionViewRow = {
    id: number;
    name: string;
    description: string;
    parkCount: number;
    trailCount: number;
};

/**
 * RegionsService for the region entity. This service is used to create, update, and get regions from the database.
 * @example
 * const region = await regionsService.createRegion({
 *     name: "Region 1",
 *     description: "Description 1",
 * });
 * console.log(region);
 */
export class RegionsService {
    /**
     * Create a new region.
     * @param region - The region to create.
     * @returns The created region.
     */
    async createRegion(region: Region): Promise<Region | null> {
        return db.region.create({
            data: region,
        });
    }

    /**
     * Update a region.
     * @param id - The id of the region to update.
     * @param region - The region to update.
     * @returns The updated region.
     */
    async updateRegion(
        id: number,
        region: RegionUpdate,
    ): Promise<Region | null> {
        return db.region.update({
            where: { id },
            data: region,
        });
    }

    /**
     * Delete a region.
     * @param id - The id of the region to delete.
     * @returns The deleted region id. If no region is found, returns null.
     */
    async deleteRegion(id: number): Promise<number | null> {
        const deleted = await db.region.delete({
            where: { id },
        });
        if (!deleted) return null;
        return id;
    }

    /**
     * Get a region by id.
     * @param id - The id of the region to get.
     * @returns The region. If no region is found, returns null.
     */
    async getRegion(id: number): Promise<Region | null> {
        return db.region.findUnique({
            where: { id },
        });
    }

    /**
     * Get all regions.
     * @param search - The search query.
     * @returns The regions.
     */
    async getRegions(search: string | undefined): Promise<Region[]> {
        return db.region.findMany({
            where: {
                name: search
                    ? {
                          contains: search,
                          mode: "insensitive",
                      }
                    : undefined,
            },
            orderBy: { name: "asc" },
        });
    }

    /**
     * Get a region view model by id (park/trail counts via a single aggregate query).
     * @param id - The id of the region to get.
     * @returns The region view model. If no region is found, returns null.
     */
    async getRegionViewModel(id: number): Promise<RegionViewModel | null> {
        const [region] = await db.$queryRaw<RegionViewRow[]>`
            SELECT
                r.id,
                r.name,
                r.description,
                COUNT(DISTINCT p.id)::int AS "parkCount",
                COUNT(t.id)::int AS "trailCount"
            FROM "Region" r
            LEFT JOIN "Park" p ON p."regionId" = r.id
            LEFT JOIN "Trail" t ON t."parkId" = p.id
            WHERE r.id = ${id}
            GROUP BY r.id
        `;
        if (!region) return null;
        return this.mapRegionViewModel(region);
    }

    /**
     * Get all regions view models (park/trail counts via a single aggregate query).
     * @param search - The search query.
     * @returns The regions view models.
     */
    async getRegionsViewModels(
        search: string | undefined,
    ): Promise<RegionViewModel[]> {
        const whereClause = search
            ? Prisma.sql`WHERE r.name ILIKE ${`%${search}%`}`
            : Prisma.empty;

        const regions = await db.$queryRaw<RegionViewRow[]>`
            SELECT
                r.id,
                r.name,
                r.description,
                COUNT(DISTINCT p.id)::int AS "parkCount",
                COUNT(t.id)::int AS "trailCount"
            FROM "Region" r
            LEFT JOIN "Park" p ON p."regionId" = r.id
            LEFT JOIN "Trail" t ON t."parkId" = p.id
            ${whereClause}
            GROUP BY r.id
            ORDER BY r.name ASC
        `;

        return regions.map((region) => this.mapRegionViewModel(region));
    }

    private mapRegionViewModel(row: RegionViewRow): RegionViewModel {
        return RegionViewModelSchema.parse({
            id: row.id,
            name: row.name,
            description: row.description,
            parkCount: Number(row.parkCount),
            trailCount: Number(row.trailCount),
        });
    }
}

/**
 * The regions service instance.
 */
export const regionsService = new RegionsService();
