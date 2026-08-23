"use server";

import { adminAuth } from "@/lib/firebase_admin";
import { DecodedIdToken } from "firebase-admin/auth";

/**
 * FirebaseAuthService for the Firebase authentication service.
 * This service is used to verify ID tokens and get or create users.
 */
export class FirebaseAuthService {
    /**
     * Verifies the authentication ID token sent by the client.
     * @param idToken - The Firebase JWT provided by the front end.
     * @returns The decoded token data, or null if invalid.
     */
    async verifyIdToken(idToken: string): Promise<DecodedIdToken | null> {
        try {
            const decodedToken = await adminAuth.verifyIdToken(idToken);
            return decodedToken;
        } catch (error) {
            console.error("Error verifying Firebase ID token:", error);
            return null;
        }
    }
}

/**
 * The Firebase auth service instance.
 */
export const firebaseAuthService = new FirebaseAuthService();
