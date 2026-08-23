import { errorResponse, successResponse } from "@/lib/api_response";
import { authenticateAndSyncUser } from "@/lib/auth.middleware";
import { parksService } from "@/lib/services/parks.service";
import { User } from "@/lib/validations/user";

type Context = {
    params: Promise<{ id: string }>;
};

/**
 * /parks/[id]/view-model GET
 * Get a park view model by its ID.
 * @param request - The request.
 * @param context - The context.
 * @returns The park view model.
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
        return errorResponse(Error("Invalid park ID"), 400);
    }

    const parkViewModel = await parksService.getParkViewModel(
        id,
        user?.id ?? undefined,
    );

    if (!parkViewModel) {
        return errorResponse(Error("Park view model not found"), 404);
    }

    return successResponse(parkViewModel);
}
