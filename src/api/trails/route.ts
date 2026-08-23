import { errorResponse, successResponse } from "@/lib/api_response";
import { authenticateAndSyncUser } from "@/lib/auth.middleware";
import { roleMiddleware } from "@/lib/role.middleware";
import { trailsService } from "@/lib/backend_services/trails.service";
import { PointCoordinatesSchema } from "@/lib/validations/geo";
import { TrailSchema } from "@/lib/validations/trail";
import { User } from "@/lib/validations/user";

/**
 * /trails GET
 * Get trails.
 * @param request - The request.
 * @returns The trails.
 */
export async function GET(request: Request) {
    const searchParams = new URLSearchParams(request.url.split("?")[1]);
    const search = searchParams.get("search");
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    const distance = Number(searchParams.get("distance"));

    const location =
        lat && lng ? PointCoordinatesSchema.parse({ lat, lng }) : undefined;

    const trails = await trailsService.getTrails(search, location, distance);

    return successResponse(trails);
}

/**
 * /trails POST
 * Create a trail.
 * @param request - The request.
 * @returns The created trail.
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

    const trail = TrailSchema.parse(await request.json());

    const createdTrail = await trailsService.createTrail(trail);

    if (!createdTrail) {
        return errorResponse(Error("Failed to create trail"), 500);
    }

    return successResponse(createdTrail);
}
