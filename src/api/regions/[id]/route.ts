import { errorResponse, successResponse } from "@/lib/api_response";
import { authenticateAndSyncUser } from "@/lib/auth.middleware";
import { roleMiddleware } from "@/lib/role.middleware";
import { regionsService } from "@/lib/services/regions.service";
import { RegionUpdateSchema } from "@/lib/validations/region";
import { User } from "@/lib/validations/user";

type Context = {
    params: Promise<{ id: string }>;
};

/**
 * /regions/[id] GET
 * Get a region by its ID.
 * @param request - The request.
 * @param context - The context.
 * @returns The region.
 */
export async function GET(request: Request, context: Context) {
    const id = Number((await context.params).id);

    if (!id || isNaN(id)) {
        return errorResponse(Error("Invalid region ID"), 400);
    }

    const region = await regionsService.getRegion(id);

    if (!region) {
        return errorResponse(Error("Region not found"), 404);
    }

    return successResponse(region);
}

/**
 * /regions/[id] PUT
 * Update a region by its ID.
 * @param request - The request.
 * @param context - The context.
 * @returns The updated region.
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
        return errorResponse(Error("Invalid region ID"), 400);
    }

    const regionUpdate = RegionUpdateSchema.parse(await request.json());

    const region = await regionsService.updateRegion(id, regionUpdate);

    if (!region) {
        return errorResponse(Error("Failed to update region"), 500);
    }

    return successResponse(region);
}

/**
 * /regions/[id] DELETE
 * Delete a region by its ID.
 * @param request - The request.
 * @param context - The context.
 * @returns The deleted region.
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
        return errorResponse(Error("Invalid region ID"), 400);
    }

    const deletedRegion = await regionsService.deleteRegion(id);

    if (!deletedRegion) {
        return errorResponse(Error("Failed to delete region"), 500);
    }

    return successResponse(deletedRegion);
}
