import { errorResponse, successResponse } from "@/lib/api_response";
import { regionsService } from "@/lib/services/regions.service";

type Context = {
    params: Promise<{ id: string }>;
};

/**
 * /regions/[id]/view-model GET
 * Get a region view model by its ID.
 * @param request - The request.
 * @param context - The context.
 * @returns The region view model.
 */
export async function GET(request: Request, context: Context) {
    const id = Number((await context.params).id);

    if (!id || isNaN(id)) {
        return errorResponse(Error("Invalid region ID"), 400);
    }

    const regionViewModel = await regionsService.getRegionViewModel(id);

    if (!regionViewModel) {
        return errorResponse(Error("Region view model not found"), 404);
    }

    return successResponse(regionViewModel);
}
