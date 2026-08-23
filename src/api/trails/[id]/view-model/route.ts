import { errorResponse, successResponse } from "@/lib/api_response";
import { authenticateAndSyncUser } from "@/lib/auth.middleware";
import { trailsService } from "@/lib/backend_services/trails.service";
import { User } from "@/lib/validations/user";

type Context = {
    params: Promise<{ id: string }>;
};

/**
 * /trails/[id]/view-model GET
 * Get a trail view model by its ID.
 * @param request - The request.
 * @param context - The context.
 * @returns The trail view model.
 */
export async function GET(request: Request, context: Context) {
    let user: User | null = null;
    try {
        user = await authenticateAndSyncUser(
            request.headers.get("Authorization") ?? undefined,
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {}

    const id = Number((await context.params).id);

    if (!id || isNaN(id)) {
        return errorResponse(Error("Invalid trail ID"), 400);
    }

    const trailViewModel = await trailsService.getTrailViewModel(
        id,
        user?.id ?? undefined,
    );

    if (!trailViewModel) {
        return errorResponse(Error("Trail view model not found"), 404);
    }

    return successResponse(trailViewModel);
}
