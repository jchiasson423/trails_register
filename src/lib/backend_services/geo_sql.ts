"use server";

import { Prisma } from "@/generated/prisma/client";
import { Point, PointCoordinates, PointSchema } from "@/lib/validations/geo";

/**
 * Build a PostGIS point from lon/lat (SRID 4326).
 * Column identifiers must be trusted literals — never user input.
 */
export function makePointSql(longitude: number, latitude: number): Prisma.Sql {
    return Prisma.sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
}

/**
 * Map nullable lat/lng columns to a Point, or undefined when either is null.
 */
export function pointFromLatLng(
    lat: number | null | undefined,
    lng: number | null | undefined,
): Point | undefined {
    if (lat == null || lng == null) return undefined;
    return PointSchema.parse({
        coordinates: {
            latitude: lat,
            longitude: lng,
        },
    });
}

/**
 * SELECT fragment for distance in meters from a geography column to a point.
 * @param geoColumn - Trusted SQL identifier (e.g. `"Park"."location"`).
 */
export function distanceSelectSql(
    geoColumn: string,
    location: PointCoordinates,
): Prisma.Sql {
    return Prisma.sql`, ST_Distance(
        ${Prisma.raw(geoColumn)}::geography,
        ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326)::geography
    ) AS "distanceMeters"`;
}

/**
 * WHERE fragment: rows within `distance` meters of a point.
 * @param geoColumn - Trusted SQL identifier (e.g. `"Trail"."trailhead"`).
 */
export function withinDistanceSql(
    geoColumn: string,
    location: PointCoordinates,
    distance: number,
): Prisma.Sql {
    return Prisma.sql`ST_DWithin(
        ${Prisma.raw(geoColumn)}::geography,
        ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326)::geography,
        ${distance}
    )`;
}
