import { User, UserUpdate } from "@/lib/validations/user";
import { db } from "../db";

/**
 * UsersService for the user entity. This service is used to create, update, and get users from the database.
 *
 * @example
 * const user = await usersService.createUser({
 *     username: "John Doe",
 *     email: "john.doe@example.com",
 *     firebaseUid: "1234567890",
 *     role: "user",
 * });
 * console.log(user);
 */
export class UsersService {
    /**
     * Create a new user.
     * @param user - The user to create.
     * @returns The created user. If the user already exists, returns null.
     */
    async createUser(user: User): Promise<User | null> {
        return db.user.create({
            data: {
                username: user.username,
                email: user.email,
                firebaseUid: user.firebaseUid,
                role: user.role,
            },
        });
    }

    /**
     * Update a user.
     * @param id - The id of the user to update.
     * @param user - The user to update.
     * @returns The updated user. If no user is found, returns null.
     */
    async updateUser(
        id: number,
        { username, email, firebaseUid, role }: UserUpdate,
    ): Promise<User | null> {
        return db.user.update({
            where: { id },
            data: { username, email, firebaseUid, role },
        });
    }

    /**
     * Get a user from their Firebase UID.
     * @param firebaseUid - The Firebase UID of the user.
     * @returns The user. If no user is found, returns null.
     */
    async getUserFromFirebaseUid(firebaseUid: string): Promise<User | null> {
        return db.user.findUnique({
            where: { firebaseUid },
        });
    }

    /**
     * Get a user from their email.
     * @param email - The email of the user.
     * @returns The user. If no user is found, returns null.
     */
    async getUserFromEmail(email: string): Promise<User | null> {
        return db.user.findUnique({
            where: { email },
        });
    }
}

/**
 * The users service instance.
 */
export const usersService = new UsersService();
