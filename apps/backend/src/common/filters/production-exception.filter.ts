import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class ProductionExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Log the full detailed stack trace on the server logs
    this.logger.error(
      `Unhandled Exception at ${request.method} ${request.url} | Status: ${status}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception)
    );

    const isProd = process.env.NODE_ENV === 'production';

    if (isHttpException) {
      // Safe HttpException, pass it to client directly
      const resContent: any = exception.getResponse();
      if (typeof resContent === 'object') {
        return response.status(status).json(resContent);
      }
      return response.status(status).json({
        statusCode: status,
        message: resContent,
      });
    }

    // Unhandled exception (like database crash, connection timeout, type error)
    // Hide details in production
    if (isProd) {
      return response.status(status).json({
        statusCode: status,
        message: 'Sunucu tarafında beklenmeyen bir hata oluştu.',
        error: 'Internal Server Error',
      });
    }

    // Development mode: return full exception details
    return response.status(status).json({
      statusCode: status,
      message: exception instanceof Error ? exception.message : 'Unknown internal error',
      error: exception instanceof Error ? exception.name : 'InternalServerError',
      stack: exception instanceof Error ? exception.stack : undefined,
    });
  }
}
