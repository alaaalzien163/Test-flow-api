import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Catches every unhandled exception and normalizes the response body.
 * Internal errors never leak stack traces to the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (isHttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse) {
        const body = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };
        message = body.message ?? exception.message;
        error = body.error ?? exception.name;
      }
    }

    const serverErrorThreshold: number = HttpStatus.INTERNAL_SERVER_ERROR;

    if (!isHttpException || status >= serverErrorThreshold) {
      this.logger.error(
        `Unhandled ${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      path: request.originalUrl,
      method: request.method,
      timestamp: new Date().toISOString(),
    });
  }
}
