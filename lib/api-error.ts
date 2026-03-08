import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }

  static badRequest(message = "Bad Request"): ApiError {
    return new ApiError(message, 400, "BAD_REQUEST");
  }

  static unauthorized(message = "Unauthorized"): ApiError {
    return new ApiError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message = "Forbidden"): ApiError {
    return new ApiError(message, 403, "FORBIDDEN");
  }

  static notFound(message = "Not Found"): ApiError {
    return new ApiError(message, 404, "NOT_FOUND");
  }

  static conflict(message = "Conflict"): ApiError {
    return new ApiError(message, 409, "CONFLICT");
  }

  static internal(message = "Internal Server Error"): ApiError {
    return new ApiError(message, 500, "INTERNAL_ERROR");
  }
}

interface ErrorResponseBody {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

/**
 * Handles errors in API route handlers.
 * Returns a proper NextResponse with status code.
 */
export function handleApiError(error: unknown): NextResponse<ErrorResponseBody> {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { message: error.message, code: error.code } },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  console.error("Unhandled API error:", error);

  return NextResponse.json(
    { error: { message: "Internal Server Error", code: "INTERNAL_ERROR" } },
    { status: 500 }
  );
}
