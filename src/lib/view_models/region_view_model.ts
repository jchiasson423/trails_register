import { z } from "zod";

/**
 * RegionViewModel is a model that represents a region with its properties and
 * the number of parks and trails in the region.
 * @param id - The id of the region.
 * @param name - The name of the region.
 * @param description - The description of the region.
 * @param parks - The parks in the region.
 */
export const RegionViewModelSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
    parkCount: z.number(),
    trailCount: z.number(),
});

/**
 * RegionViewModel is a model that represents a region with its properties and
 * the number of parks and trails in the region.
 * @param id - The id of the region.
 * @param name - The name of the region.
 * @param description - The description of the region.
 * @param parks - The parks in the region.
 * @param parkCount - The number of parks in the region.
 * @param trailCount - The number of trails in the region.
 */
export type RegionViewModel = z.infer<typeof RegionViewModelSchema>;
