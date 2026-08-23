import { db } from "../db";
import { Region, RegionUpdate } from "@/lib/validations/region";
import {
    RegionViewModel,
    RegionViewModelSchema,
} from "@/lib/view_models/region_view_model";

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
     * @returns The created region. If the region already exists, returns null.
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
     * @returns The updated region. If no region is found, returns null.
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
     * @returns The deleted region. If no region is found, returns null.
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
     * @returns The regions. If no regions are found, returns null.
     */
    async getRegions(search: string | undefined): Promise<Region[] | null> {
        return db.region.findMany({
            where: {
                name: search
                    ? {
                          contains: search,
                          mode: "insensitive",
                      }
                    : undefined,
            },
        });
    }

    /**
     * Get a region view model by id.
     * @param id - The id of the region to get.
     * @returns The region view model. If no region is found, returns null.
     */
    async getRegionViewModel(id: number): Promise<RegionViewModel | null> {
        const region = await db.region.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                description: true,
                _count: {
                    select: {
                        parks: true,
                    },
                },
                parks: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        _count: {
                            select: {
                                trails: true,
                            },
                        },
                    },
                },
            },
        });
        if (!region) return null;
        return RegionViewModelSchema.parse({
            id: region.id,
            name: region.name,
            description: region.description,
            parkCount: region._count.parks,
            trailCount: region.parks.reduce(
                (acc, park) => acc + park._count.trails,
                0,
            ),
        });
    }

    /**
     * Get all regions view models.
     * @param search - The search query.
     * @returns The regions view models. If no regions are found, returns null.
     */
    async getRegionsViewModels(
        search: string | undefined,
    ): Promise<RegionViewModel[] | null> {
        const regions = await db.region.findMany({
            where: {
                name: search
                    ? {
                          contains: search,
                          mode: "insensitive",
                      }
                    : undefined,
            },
            select: {
                id: true,
                name: true,
                description: true,
                _count: {
                    select: {
                        parks: true,
                    },
                },
                parks: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        _count: {
                            select: {
                                trails: true,
                            },
                        },
                    },
                },
            },
        });
        return regions.map((region) =>
            RegionViewModelSchema.parse({
                id: region.id,
                name: region.name,
                description: region.description,
                parkCount: region._count.parks,
                trailCount: region.parks.reduce(
                    (acc, park) => acc + park._count.trails,
                    0,
                ),
            }),
        );
    }
}

/**
 * The regions service instance.
 */
export const regionsService = new RegionsService();
