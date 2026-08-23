import { errorResponse } from "@/lib/api_response";
import { authenticateAndSyncUser } from "@/lib/auth.middleware";
import { User } from "@/lib/validations/user";

/**
 * /user GET
 * Get the current user.
 * @param request - The request.
 * @returns The current user.
 */
export async function GET(request: Request) {
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

    return user;
}
