import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Success response with the data.
 * @param data - The data to be returned.
 * @returns The response with the data.
 */
export function successResponse<T>(data: T, code: number = 200): NextResponse {
    return NextResponse.json({ data }, { status: code });
}

/**
 * Error response with the error message.
 * @param error - The error to be returned.
 * @returns The response with the error message.
 */
export function errorResponse(
    error: unknown,
    code: number = 500,
): NextResponse {
    if (error instanceof ZodError) {
        // Validation error response
        return NextResponse.json(
            {
                success: false,
                message: "Invalid data",
                errors: error.issues.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                })),
            },
            { status: code },
        );
    }

    // Internal error response
    return NextResponse.json(
        { success: false, message: "An internal error occurred" },
        { status: code },
    );
}
