import { errorResponse, successResponse } from "@/lib/api_response";
import { authenticateAndSyncUser } from "@/lib/auth.middleware";
import { favoriteParksService } from "@/lib/backend_services/favorite_parks.service";
import { User } from "@/lib/validations/user";

type Context = {
    params: Promise<{ id: string }>;
};

/**
 * /parks/[id]/favorite POST
 * Mark a park as favorite.
 * @param request - The request.
 * @param context - The context.
 * @returns The favorite park.
 */
export async function POST(request: Request, context: Context) {
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

    const parkId = Number((await context.params).id);

    if (!parkId || isNaN(parkId) || parkId <= 0) {
        return errorResponse(Error("Invalid park ID"), 400);
    }

    const favoritePark = await favoriteParksService.createFavoritePark({
        userId: user.id,
        parkId: parkId,
    });

    if (!favoritePark) {
        return errorResponse(Error("Failed to mark park as favorite"), 500);
    }

    return successResponse(favoritePark);
}

/**
 * /parks/[id]/favorite DELETE
 * Unmark a park as favorite.
 * @param request - The request.
 * @param context - The context.
 * @returns The unmarked favorite park.
 */
export async function DELETE(request: Request, context: Context) {
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

    const parkId = Number((await context.params).id);

    if (!parkId || isNaN(parkId) || parkId <= 0) {
        return errorResponse(Error("Invalid favorite park ID"), 400);
    }

    const favoritePark = await favoriteParksService.deleteFavoritePark(
        user.id,
        parkId,
    );

    if (!favoritePark) {
        return errorResponse(Error("Failed to delete favorite park"), 500);
    }

    return successResponse(favoritePark);
}
