"use server";

import { firebaseAuthService } from "./backend_services/firebase_auth.service";
import { usersService } from "./backend_services/users.service";
import { User } from "./validations/user";

/**
 * Authenticate and sync a user from a Firebase token.
 * @param authHeader - The authentication header.
 * @returns The user if authenticated and synced, null if not authenticated.
 */
export async function authenticateAndSyncUser(
    authHeader?: string,
): Promise<User | null> {
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
        return null;
    }

    // 1. Valider le token via le service Firebase
    const firebaseUser = await firebaseAuthService.verifyIdToken(token);

    if (!firebaseUser) {
        return null;
    }

    if (!firebaseUser?.email) {
        return null;
    }

    const { uid, email } = firebaseUser;

    // 2. Vérifier si le user existe en DB via le UserService
    const localUser = await usersService.getUserFromFirebaseUid(uid);
    if (localUser) {
        return localUser;
    }

    // 3. Anti-collision par email
    const userByEmail = await usersService.getUserFromEmail(email);
    if (userByEmail) {
        return null;
    }

    // 4. Créer le user via le UserService s'il n'existe pas
    const createdUser = await usersService.createUser({
        firebaseUid: uid,
        email,
        username: email.split("@")[0],
        role: "user",
    });

    if (!createdUser) {
        return null;
    }

    return createdUser;
}
