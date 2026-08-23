import { z } from "zod";
import { PointSchema } from "./geo";

/**
 * ParkSchema for the park entity.
 * @param id - The unique identifier of the park.
 * @param name - The name of the park.
 * @param description - The description of the park.
 * @param regionId - The unique identifier of the region the park belongs to.
 * @param location - The location of the park.
 */
export const ParkSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1),
    description: z.string().min(1),
    regionId: z.number().optional(),
    location: PointSchema,
});

/**
 * Entity to represent a park with trails and its location.
 */
export type Park = z.infer<typeof ParkSchema>;

/**
 * ParkUpdateSchema for the park entity.
 * @param id - The unique identifier of the park.
 * @param name - The name of the park.
 * @param description - The description of the park.
 * @param regionId - The unique identifier of the region the park belongs to.
 * @param location - The location of the park.
 */
export const ParkUpdateSchema = ParkSchema.partial();

/**
 * ParkUpdate is an entry from the user to update a park.
 * @param id - The unique identifier of the park.
 * @param name - The name of the park.
 * @param description - The description of the park.
 * @param regionId - The unique identifier of the region the park belongs to.
 * @param location - The location of the park.
 */
export type ParkUpdate = z.infer<typeof ParkUpdateSchema>;
