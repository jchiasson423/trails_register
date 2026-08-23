import { z } from "zod";

/**
 * UserSchema for the user entity.
 * @param id - The unique identifier of the user.
 * @param username - The username of the user.
 * @param email - The email of the user.
 * @param firebaseUid - The Firebase UID of the user.
 * @param role - The role of the user.
 */
export const UserSchema = z.object({
    id: z.number().optional(),
    username: z.string().min(1),
    email: z.string().email(),
    firebaseUid: z.string().min(1),
    role: z.enum(["admin", "user"]),
});

/**
 * Entity to represent a user with its properties.
 */
export type User = z.infer<typeof UserSchema>;

/**
 * UserUpdateSchema for the user entity.
 * @param id - The unique identifier of the user.
 * @param username - The username of the user.
 * @param email - The email of the user.
 * @param firebaseUid - The Firebase UID of the user.
 * @param role - The role of the user.
 */
export const UserUpdateSchema = UserSchema.partial();

/**
 * UserUpdate is an entry from the user to update a user.
 * @param id - The unique identifier of the user.
 * @param username - The username of the user.
 * @param email - The email of the user.
 * @param firebaseUid - The Firebase UID of the user.
 * @param role - The role of the user.
 */
export type UserUpdate = z.infer<typeof UserUpdateSchema>;