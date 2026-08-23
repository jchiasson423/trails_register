import { z } from "zod";
import { PointSchema } from "../validations/geo";

/**
 * TrailViewModelSchema is the schema for a trail view model.
 * @param id - The id of the trail.
 * @param name - The name of the trail.
 * @param description - The description of the trail.
 * @param parkName - The name of the park the trail belongs to.
 * @param difficulty - The difficulty of the trail.
 * @param length - The length of the trail.
 * @param elevationChange - The elevation change of the trail.
 * @param duration - The duration of the trail.
 * @param trailHead - The trailhead of the trail.
 * @param parkLocation - The location of the park the trail belongs to.
 * @param isFavorite - Whether the trail is a favorite of the current user.
 */
export const TrailViewModelSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string(),
    parkName: z.string().optional(),
    difficulty: z.enum(["easy", "medium", "hard", "expert"]),
    length: z.number(),
    elevationChange: z.number(),
    duration: z.number(),
    trailhead: PointSchema.optional(),
    parkLocation: PointSchema.optional(),
    isFavorite: z.boolean(),
});

/**
 * TrailViewModel is the view model for a trail.
 * @param id - The id of the trail.
 * @param name - The name of the trail.
 * @param description - The description of the trail.
 * @param parkName - The name of the park the trail belongs to.
 * @param difficulty - The difficulty of the trail.
 * @param length - The length of the trail.
 * @param elevationChange - The elevation change of the trail.
 * @param duration - The duration of the trail.
 * @param trailhead - The trailhead of the trail.
 * @param parkLocation - The location of the park the trail belongs to.
 * @param isFavorite - Whether the trail is a favorite of the current user.
 */
export type TrailViewModel = z.infer<typeof TrailViewModelSchema>;
