import { successResponse } from "@/lib/api_response";
import { authenticateAndSyncUser } from "@/lib/auth.middleware";
import { trailsService } from "@/lib/backend_services/trails.service";
import { PointCoordinatesSchema } from "@/lib/validations/geo";
import { User } from "@/lib/validations/user";

/**
 * /trails/view-models GET
 * Get trail view models.
 * @param request - The request.
 * @returns The trail view models.
 */
export async function GET(request: Request) {
    let user: User | null = null;
    try {
        user = await authenticateAndSyncUser(
            request.headers.get("Authorization") ?? undefined,
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {}

    const searchParams = new URLSearchParams(request.url.split("?")[1]);
    const search = searchParams.get("search");
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    const distance = Number(searchParams.get("distance")) ?? undefined;

    const location =
        lat && lng ? PointCoordinatesSchema.parse({ lat, lng }) : undefined;

    const trailViewModels = await trailsService.getTrailViewModels(
        search,
        location,
        distance,
        user?.id ?? undefined,
    );

    return successResponse(trailViewModels);
}
