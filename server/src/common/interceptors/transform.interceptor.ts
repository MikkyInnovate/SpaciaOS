import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((res) => {
        let message = "Operation completed successfully.";
        let data = res;

        // If controller returned an object with explicit `data` and (`message` or `success`)
        if (
          res &&
          typeof res === "object" &&
          "data" in res &&
          ("message" in res || "success" in res)
        ) {
          message = (res as any).message || message;
          data = (res as any).data;
        } else if (
          res &&
          typeof res === "object" &&
          "message" in res &&
          Object.keys(res).length === 1
        ) {
          message = res.message;
          data = null;
        }

        return {
          success: true,
          message,
          data,
          timestamp: new Date().toISOString(),
        };
      })
    );
  }
}
