import { successResponse } from "@/lib/api_response";
import { authenticateAndSyncUser } from "@/lib/auth.middleware";
import { parksService } from "@/lib/services/parks.service";
import { PointCoordinatesSchema } from "@/lib/validations/geo";
import { User } from "@/lib/validations/user";

/**
 * /parks/view-models GET
 * Get park view models.
 * @param request - The request.
 * @param context - The context.
 * @returns The park view model.
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

    const parkViewModels = await parksService.getParksViewModels(
        search ?? undefined,
        location,
        distance,
        user?.id ?? undefined,
    );

    return successResponse(parkViewModels);
}
