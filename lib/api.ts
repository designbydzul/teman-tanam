/**
 * Standardized API Response Helpers
 *
 * Provides consistent response format across all API routes:
 * - Success: { success: true, data: {...} }
 * - Error: { success: false, error: "Error message" }
 */

import { NextResponse } from 'next/server';

/**
 * Standard API response types
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create a success response
 *
 * @param data - The response data
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with standardized success format
 *
 * @example
 * // Simple success
 * return successResponse({ user: { id: 1, name: 'John' } });
 *
 * // With custom status
 * return successResponse({ id: newResource.id }, 201);
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true as const, data }, { status });
}

/**
 * Create an error response
 *
 * @param error - Error message string
 * @param status - HTTP status code (default: 400)
 * @returns NextResponse with standardized error format
 *
 * @example
 * // Validation error
 * return errorResponse('Email tidak valid', 400);
 *
 * // Not found
 * return errorResponse('Plant not found', 404);
 *
 * // Server error
 * return errorResponse('Internal server error', 500);
 */
export function errorResponse(error: string, status: number = 400): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ success: false as const, error }, { status });
}

/**
 * Common HTTP status codes for reference
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
