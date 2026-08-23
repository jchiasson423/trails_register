import { z } from "zod";

/**
 * RegionSchema for the region entity.
 * @param id - The unique identifier of the region.
 * @param name - The name of the region.
 * @param description - The description of the region.
 */
export const RegionSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1),
    description: z.string().min(1),
});

/**
 * Entity to represent a region, which is a geographical area and a regroupment of parks.
 */
export type Region = z.infer<typeof RegionSchema>;

/**
 * RegionUpdateSchema for the region entity.
 * @param id - The unique identifier of the region.
 * @param name - The name of the region.
 * @param description - The description of the region.
 */
export const RegionUpdateSchema = RegionSchema.partial();

/**
 * RegionUpdate is an entry from the user to update a region.
 * @param id - The unique identifier of the region.
 * @param name - The name of the region.
 * @param description - The description of the region.
 */
export type RegionUpdate = z.infer<typeof RegionUpdateSchema>;
