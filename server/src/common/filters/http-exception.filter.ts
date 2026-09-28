import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { PiiSanitizer } from "../utils/pii-sanitizer";

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "INTERNAL_SERVER_ERROR";
    let message = "An unexpected error occurred.";
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Derive code from HttpStatus name
      code = HttpStatus[status] || "HTTP_ERROR";

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === "object" &&
        exceptionResponse !== null
      ) {
        const resObj = exceptionResponse as Record<string, unknown>;
        message = (resObj.message as string) || exception.message;

        if (typeof resObj.code === "string") {
          code = resObj.code;
        } else if (resObj.error && typeof resObj.error === "string") {
          code = resObj.error.toUpperCase().replace(/\s+/g, "_");
        }

        // Validation errors from class-validator appear as array in `message`
        if (Array.isArray(resObj.message)) {
          code = "VALIDATION_ERROR";
          message = "Input validation failed.";
          details = resObj.message;
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack
      );
      message = "An internal server error occurred.";
    }

    // Production error sanitization & tracking
    const traceId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sanitizedDetails = details ? PiiSanitizer.sanitizePayload(details) : undefined;

    const payload: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
        ...(sanitizedDetails ? { details: sanitizedDetails } : {}),
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // If 5xx internal server error, log trace ID for Sentry / operator review
    if (status >= 500) {
      this.logger.warn(`[Production Alert] 5xx error on ${request.method} ${request.url} [Trace: ${traceId}]`);
    }

    response.status(status).json(payload);
  }
}
