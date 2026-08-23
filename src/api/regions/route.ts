import { errorResponse, successResponse } from "@/lib/api_response";
import { authenticateAndSyncUser } from "@/lib/auth.middleware";
import { roleMiddleware } from "@/lib/role.middleware";
import { regionsService } from "@/lib/backend_services/regions.service";
import { RegionSchema } from "@/lib/validations/region";
import { User } from "@/lib/validations/user";

/**
 * /regions GET
 * Get regions.
 * @param request - The request.
 * @returns The regions.
 */
export async function GET(request: Request) {
    const searchParams = new URLSearchParams(request.url.split("?")[1]);
    const search = searchParams.get("search");

    const regions = await regionsService.getRegions(search ?? undefined);

    return successResponse(regions);
}

/**
 * /regions POST
 * Create a region.
 * @param request - The request.
 * @returns The created region.
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

    const region = RegionSchema.parse(await request.json());

    const createdRegion = await regionsService.createRegion(region);

    if (!createdRegion) {
        return errorResponse(Error("Failed to create region"), 500);
    }

    return successResponse(createdRegion);
}
