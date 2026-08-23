import { errorResponse, successResponse } from "@/lib/api_response";
import { authenticateAndSyncUser } from "@/lib/auth.middleware";
import { favoriteTrailsService } from "@/lib/services/favorite_trails.service";
import { User } from "@/lib/validations/user";

type Context = {
    params: Promise<{ id: string }>;
};

/**
 * /trails/[id]/favorite POST
 * Mark a trail as favorite.
 * @param request - The request.
 * @param context - The context.
 * @returns The favorite trail.
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

    const trailId = Number((await context.params).id);

    if (!trailId || isNaN(trailId) || trailId <= 0) {
        return errorResponse(Error("Invalid park ID"), 400);
    }

    const favoriteTrail = await favoriteTrailsService.createFavoriteTrail({
        userId: user.id,
        trailId: trailId,
    });

    if (!favoriteTrail) {
        return errorResponse(Error("Failed to mark trail as favorite"), 500);
    }

    return successResponse(favoriteTrail);
}

/**
 * /trails/[id]/favorite DELETE
 * Unmark a trail as favorite.
 * @param request - The request.
 * @param context - The context.
 * @returns The unmarked favorite trail.
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

    const trailId = Number((await context.params).id);

    if (!trailId || isNaN(trailId) || trailId <= 0) {
        return errorResponse(Error("Invalid favorite trail ID"), 400);
    }

    const favoriteTrail = await favoriteTrailsService.deleteFavoriteTrail(
        user.id,
        trailId,
    );

    if (!favoriteTrail) {
        return errorResponse(Error("Failed to delete favorite trail"), 500);
    }

    return successResponse(favoriteTrail);
}
