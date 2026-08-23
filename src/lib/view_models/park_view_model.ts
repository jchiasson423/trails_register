import { z } from "zod";
import { PointSchema } from "../validations/geo";

/**
 * ParkViewModelSchema is the schema for a park view model.
 * @param id - The id of the park.
 * @param name - The name of the park.
 * @param description - The description of the park.
 * @param regionName - The name of the region the park belongs to.
 * @param location - The location of the park.
 * @param trailCount - The number of trails in the park.
 * @param isFavorite - Whether the park is a favorite of the current user.
 */
export const ParkViewModelSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
    regionName: z.string().optional(),
    location: PointSchema,
    trailCount: z.number(),
    isFavorite: z.boolean(),
});

/**
 * ParkViewModel is the view model for a park.
 * @param id - The id of the park.
 * @param name - The name of the park.
 * @param description - The description of the park.
 * @param regionName - The name of the region the park belongs to.
 * @param location - The location of the park.
 * @param trailCount - The number of trails in the park.
 * @param isFavorite - Whether the park is a favorite of the current user.
 */
export type ParkViewModel = z.infer<typeof ParkViewModelSchema>;
