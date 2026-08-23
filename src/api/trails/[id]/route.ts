import { errorResponse, successResponse } from "@/lib/api_response";
import { authenticateAndSyncUser } from "@/lib/auth.middleware";
import { roleMiddleware } from "@/lib/role.middleware";
import { trailsService } from "@/lib/services/trails.service";
import { TrailUpdateSchema } from "@/lib/validations/trail";
import { User } from "@/lib/validations/user";

type Context = {
    params: Promise<{ id: string }>; // Utilise Promise<{ id: string }> si tu es sur Next.js 15+
};

/**
 * /trails/[id] GET
 * Get a trail by its ID.
 * @param request - The request.
 * @param context - The context.
 * @returns The trail.
 */
export async function GET(request: Request, context: Context) {
    const id = Number((await context.params).id);

    if (!id || isNaN(id)) {
        return errorResponse(Error("Invalid trail ID"), 400);
    }

    const trail = await trailsService.getTrail(id);

    if (!trail) {
        return errorResponse(Error("Trail not found"), 404);
    }

    return successResponse(trail);
}

/**
 * /trails/[id] PUT
 * Update a trail by its ID.
 * @param request - The request.
 * @param context - The context.
 * @returns The updated trail.
 */
export async function PUT(request: Request, context: Context) {
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

    const id = Number((await context.params).id);

    if (!id || isNaN(id)) {
        return errorResponse(Error("Invalid trail ID"), 400);
    }

    const trailUpdate = TrailUpdateSchema.parse(await request.json());

    const trail = await trailsService.updateTrail(id, trailUpdate);

    if (!trail) {
        return errorResponse(Error("Failed to update trail"), 500);
    }

    return successResponse(trail);
}

/**
 * /trails/[id] DELETE
 * Delete a trail by its ID.
 * @param request - The request.
 * @param context - The context.
 * @returns The deleted trail.
 */
export async function DELETE(request: Request, context: Context) {
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

    const id = Number((await context.params).id);

    if (!id || isNaN(id)) {
        return errorResponse(Error("Invalid trail ID"), 400);
    }

    const deletedTrail = await trailsService.deleteTrail(id);

    if (!deletedTrail) {
        return errorResponse(Error("Failed to delete trail"), 500);
    }

    return successResponse(deletedTrail);
}
