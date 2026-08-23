import { z } from "zod";

/**
 * PointCoordinatesSchema is the schema for a point coordinates.
 * @param latitude - The latitude of the point.
 * @param longitude - The longitude of the point.
 */
export const PointCoordinatesSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
});

/**
 * PointCoordinates is a pair of latitude and longitude to represent a point on the Earth.
 * @param latitude - The latitude of the point.
 * @param longitude - The longitude of the point.
 */
export type PointCoordinates = z.infer<typeof PointCoordinatesSchema>;

/**
 * PointSchema is the schema for a point with its coordinates.
 * @param coordinates - The coordinates of the point.
 */
export const PointSchema = z.object({
    coordinates: PointCoordinatesSchema,
});

/**
 * Point is a point on the Earth.
 * @param coordinates - The coordinates of the point.
 */
export type Point = z.infer<typeof PointSchema>;

/**
 * PointUpdateSchema is the schema for a point update.
 * @param coordinates - The coordinates of the point.
 */
export const PointUpdateSchema = PointSchema.partial();

/**
 * PointUpdate is a point on the Earth.
 * @param coordinates - The coordinates of the point.
 */
export type PointUpdate = z.infer<typeof PointUpdateSchema>;
