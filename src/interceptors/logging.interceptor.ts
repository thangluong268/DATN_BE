import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import * as chalk from 'chalk';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

/**
 * Logger Interceptor.
 * Creates informative loggs to all requests, showing the path and
 * the method name.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const parentType = chalk.hex('#87e8de').bold(`${context.getArgs()[0].route.path}`);
    const fieldName = chalk.hex('#87e8de').bold(`${context.getArgs()[0].route.stack[0].method}`);
    const status = chalk.hex('#e5ff00').bold(`${context.switchToHttp().getResponse().statusCode}`);
    return next.handle().pipe(
      tap(() => {
        Logger.debug(`${status}: ${parentType} » ${fieldName}`, 'RESTful');
      }),
      catchError((error) => {
        Logger.error(`${parentType} » ${fieldName}`, 'RESTful');
        Logger.error(`${error.status}: ${error.message}`, 'Error');
        throw error;
      }),
    );
  }
}
