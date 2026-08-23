import { errorResponse, successResponse } from "@/lib/api_response";
import { authenticateAndSyncUser } from "@/lib/auth.middleware";
import { roleMiddleware } from "@/lib/role.middleware";
import { parksService } from "@/lib/services/parks.service";
import { ParkUpdateSchema } from "@/lib/validations/park";
import { User } from "@/lib/validations/user";

type Context = {
    params: Promise<{ id: string }>; // Utilise Promise<{ id: string }> si tu es sur Next.js 15+
};

/**
 * /parks/[id] GET
 * Get a park by its ID.
 * @param request - The request.
 * @param context - The context.
 * @returns The park.
 */
export async function GET(request: Request, context: Context) {
    const id = Number((await context.params).id);

    if (!id || isNaN(id)) {
        return errorResponse(Error("Invalid park ID"), 400);
    }

    const park = await parksService.getPark(id);

    if (!park) {
        return errorResponse(Error("Park not found"), 404);
    }

    return successResponse(park);
}

/**
 * /parks/[id] PUT
 * Update a park by its ID.
 * @param request - The request.
 * @param context - The context.
 * @returns The updated park.
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
        return errorResponse(Error("Invalid park ID"), 400);
    }

    const parkUpdate = ParkUpdateSchema.parse(await request.json());

    const park = await parksService.updatePark(id, parkUpdate);

    if (!park) {
        return errorResponse(Error("Failed to update park"), 500);
    }

    return successResponse(park);
}

/**
 * /parks/[id] DELETE
 * Delete a park by its ID.
 * @param request - The request.
 * @param context - The context.
 * @returns The deleted park.
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
        return errorResponse(Error("Invalid park ID"), 400);
    }

    const deletedPark = await parksService.deletePark(id);

    if (!deletedPark) {
        return errorResponse(Error("Failed to delete park"), 500);
    }

    return successResponse(deletedPark);
}
