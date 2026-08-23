import { successResponse } from "@/lib/api_response";
import { regionsService } from "@/lib/services/regions.service";

/**
 * /regions/view-models GET
 * Get region view models.
 * @param request - The request.
 * @returns The region view models.
 */
export async function GET(request: Request) {
    const searchParams = new URLSearchParams(request.url.split("?")[1]);
    const search = searchParams.get("search");

    const regionViewModels = await regionsService.getRegionsViewModels(
        search ?? undefined,
    );

    return successResponse(regionViewModels);
}
