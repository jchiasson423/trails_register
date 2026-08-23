import { User, UserUpdate } from "@/lib/validations/user";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * UsersService for the user entity. This service is used to create, update, and get users from the database.
 *
 * @param db - The database client.
 *
 * @example
 * const usersService = new UsersService(db);
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
   * Constructor for the UsersService.
   * @param db - The database client.
   */
  constructor(private readonly db: PrismaClient) {}

  /**
   * Create a new user.
   * @param user - The user to create.
   * @returns The created user. If the user already exists, returns null.
   */
  async createUser(user: User): Promise<User | null> {
    return this.db.user.create({
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
    return this.db.user.update({
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
    return this.db.user.findUnique({
      where: { firebaseUid },
    });
  }
}
