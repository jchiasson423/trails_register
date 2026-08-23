import { z } from "zod";
import { PointSchema } from "./geo";

/**
 * TrailSchema for the trail entity.
 * @param id - The unique identifier of the trail.
 * @param name - The name of the trail.
 * @param description - The description of the trail.
 * @param parkId - The unique identifier of the park the trail belongs to.
 * @param difficulty - The difficulty of the trail.
 * @param length - The length of the trail.
 * @param elevationChange - The elevation change of the trail.
 * @param duration - The duration of the trail.
 * @param trailhead - The trailhead of the trail.
 */
export const TrailSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1),
    description: z.string().min(1),
    parkId: z.number().optional(),
    difficulty: z.enum(["easy", "medium", "hard", "expert"]),
    length: z.number().positive(),
    elevationChange: z.number().positive(),
    duration: z.number().positive(),
    trailhead: PointSchema.optional(),
});

/**
 * Entity to represent a trail with its properties and its trailhead location.
 */
export type Trail = z.infer<typeof TrailSchema>;

/**
 * TrailUpdateSchema for the trail entity.
 * @param id - The unique identifier of the trail.
 * @param name - The name of the trail.
 * @param description - The description of the trail.
 * @param parkId - The unique identifier of the park the trail belongs to.
 * @param difficulty - The difficulty of the trail.
 * @param length - The length of the trail.
 * @param elevationChange - The elevation change of the trail.
 * @param duration - The duration of the trail.
 * @param trailhead - The trailhead of the trail.
 */
export const TrailUpdateSchema = TrailSchema.partial();

/**
 * TrailUpdate is an entry from the user to update a trail.
 * @param id - The unique identifier of the trail.
 * @param name - The name of the trail.
 * @param description - The description of the trail.
 * @param parkId - The unique identifier of the park the trail belongs to.
 * @param difficulty - The difficulty of the trail.
 * @param length - The length of the trail.
 * @param elevationChange - The elevation change of the trail.
 * @param duration  The duration of the trail.
 * @param trailhead - The trailhead of the trail.
 */
export type TrailUpdate = z.infer<typeof TrailUpdateSchema>;
