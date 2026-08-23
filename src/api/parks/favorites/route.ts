import { errorResponse, successResponse } from "@/lib/api_response";
import { authenticateAndSyncUser } from "@/lib/auth.middleware";
import { parksService } from "@/lib/services/parks.service";
import { User } from "@/lib/validations/user";

/**
 * /trails/favorites GET
 * Get favorite parks.
 * @param request - The request.
 * @returns The favorite parks.
 */
export async function GET(request: Request) {
    let user: User | null = null;
    try {
        user = await authenticateAndSyncUser(
            request.headers.get("Authorization") ?? undefined,
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {}

    if (!user?.id) {
        return errorResponse(Error("User not authenticated"), 401);
    }

    const favorites = await parksService.getFavoriteParks(user.id);

    return successResponse(favorites);
}
