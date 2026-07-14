import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const { method, url, body } = request;

    // Redact sensitive keys recursively to prevent logging raw card or auth details
    const redactedBody = this.redactSensitiveData(body);

    const now = Date.now();
    this.logger.log(
      `Incoming Request: ${method} ${url} | Body: ${JSON.stringify(redactedBody)}`
    );

    return next.handle().pipe(
      tap(() => {
        const delay = Date.now() - now;
        this.logger.log(`Completed Request: ${method} ${url} | Time: ${delay}ms`);
      })
    );
  }

  private redactSensitiveData(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.redactSensitiveData(item));
    }

    if (typeof obj === 'object') {
      const redacted: any = {};
      const sensitiveKeys = /card_?number|cvc|cvv|password|token|secret|key/i;

      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveKeys.test(key)) {
          redacted[key] = '********'; // Mask sensitive fields
        } else if (typeof value === 'object') {
          redacted[key] = this.redactSensitiveData(value);
        } else {
          redacted[key] = value;
        }
      }
      return redacted;
    }

    return obj;
  }
}
