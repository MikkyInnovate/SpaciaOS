export class ApiError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = "Authentication required or session expired.") {
    super(message, 401);
    this.name = "AuthenticationError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "You do not have permission to access this resource.") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends ApiError {
  constructor(resource = "Resource") {
    super(`${resource} not found.`, 404);
    this.name = "NotFoundError";
  }
}

export class NetworkError extends ApiError {
  constructor(message = "Network connection failed. Please verify your internet connection.") {
    super(message, 0);
    this.name = "NetworkError";
  }
}
