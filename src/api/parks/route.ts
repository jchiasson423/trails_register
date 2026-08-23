import { errorResponse, successResponse } from "@/lib/api_response";
import { authenticateAndSyncUser } from "@/lib/auth.middleware";
import { roleMiddleware } from "@/lib/role.middleware";
import { parksService } from "@/lib/services/parks.service";
import { PointCoordinatesSchema } from "@/lib/validations/geo";
import { ParkSchema } from "@/lib/validations/park";
import { User } from "@/lib/validations/user";

/**
 * /parks GET
 * Get parks.
 * @param request - The request.
 * @returns The parks.
 */
export async function GET(request: Request) {
    const searchParams = new URLSearchParams(request.url.split("?")[1]);
    const search = searchParams.get("search");
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    const distance = Number(searchParams.get("distance"));

    const location =
        lat && lng ? PointCoordinatesSchema.parse({ lat, lng }) : undefined;

    const parks = await parksService.getParks(
        search ?? undefined,
        location,
        distance ?? undefined,
    );

    return successResponse(parks);
}

/**
 * /parks POST
 * Create a park.
 * @param request - The request.
 * @returns The created park.
 */
export async function POST(request: Request) {
    let user: User | null = null;
    try {
        user = await authenticateAndSyncUser(
            request.headers.get("Authorization") ?? undefined,
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {}

    if (!user) {
        return errorResponse(Error("User not authenticated"), 401);
    }

    try {
        roleMiddleware("admin", user);
    } catch (error) {
        return errorResponse(error, 403);
    }

    const park = ParkSchema.parse(await request.json());

    const createdPark = await parksService.createPark(park);

    if (!createdPark) {
        return errorResponse(Error("Failed to create park"), 500);
    }

    return successResponse(createdPark);
}
