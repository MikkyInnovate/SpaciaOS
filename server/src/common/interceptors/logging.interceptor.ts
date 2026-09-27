import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request, Response } from "express";
import { PiiSanitizer } from "../utils/pii-sanitizer";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<Request>();
    const res = httpContext.getResponse<Response>();

    const { method, originalUrl, ip } = req;
    const startTime = Date.now();

    // Sanitize query params containing sensitive tokens or credentials
    const sanitizedUrl = originalUrl.replace(
      /(token|secret|api_?key|password|credential|authorization)=([^&]+)/gi,
      "$1=••••••••"
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = res.statusCode;
          this.logger.log(
            `${method} ${sanitizedUrl} ${statusCode} +${duration}ms - IP: ${ip || "::1"}`
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error?.status || 500;
          const rawMessage = error?.message || "Unknown error";
          const sanitizedMessage = typeof rawMessage === "string"
            ? rawMessage.replace(/([a-zA-Z0-9_\-\.]{8,})/g, (m) => m.length > 24 ? PiiSanitizer.maskSecret(m) : m)
            : "Unknown error";
          this.logger.warn(
            `${method} ${sanitizedUrl} ${statusCode} +${duration}ms - IP: ${ip || "::1"} - Error: ${sanitizedMessage}`
          );
        },
      })
    );
  }
}
