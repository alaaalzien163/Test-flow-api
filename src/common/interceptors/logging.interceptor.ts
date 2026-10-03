import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Logs one line per request with method, path, status and duration.
 * Request bodies are intentionally not logged to avoid leaking secrets.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, originalUrl } = request;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = context.switchToHttp().getResponse<Response>();
          this.logger.log(
            `${method} ${originalUrl} ${statusCode} ${Date.now() - startedAt}ms`,
          );
        },
        error: (error: unknown) => {
          const status =
            error instanceof HttpException ? error.getStatus() : 500;
          this.logger.warn(
            `${method} ${originalUrl} ${status} ${Date.now() - startedAt}ms`,
          );
        },
      }),
    );
  }
}
