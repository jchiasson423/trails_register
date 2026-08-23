"use server";

import { User } from "./validations/user";

/**
 * Role middleware to check if the user has the required role.
 * @param role - The required role.
 * @param user - The user to check.
 * @throws {Error} If the user is not authenticated or not authorized.
 */
export function roleMiddleware(role: string, user: User | null | undefined) {
    if (!user) {
        throw new Error("User not authenticated");
    }
    if (user.role !== role) {
        throw new Error("User not authorized");
    }
}
