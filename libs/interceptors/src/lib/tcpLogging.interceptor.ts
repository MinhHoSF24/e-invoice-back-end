import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { RpcException } from '@nestjs/microservices';
import { HTTP_MESSAGE } from '@common/constants/enum/http-message.enum';

@Injectable()
export class TcpLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> | Promise<Observable<any>> {
    const now = Date.now();
    const handler = context.getHandler();
    const handlerName = handler.name;

    const arg = context.getArgs();
    const params = arg[0];
    const processId = params.processId;

    Logger.log(
      `TCP >> Start Process '${processId}' >> handler: '${handlerName}' at ${now} >> params: '${JSON.stringify(params)}'`,
    );

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        Logger.log(
          `TCP >> End Process '${processId}' >> handler: '${handlerName}' after ${duration}ms >> params: '${JSON.stringify(params)}'`,
        );
      }),
      catchError((error: any) => {
        const duration = Date.now() - now;
        Logger.error(
          `TCP >> Error Process '${processId}' >> handler: '${handlerName}' after ${duration}ms >> params: '${JSON.stringify(params)}' >> error: '${error.message}'`,
        );
        throw new RpcException({
          code: error.status || error.code || error.error?.code || HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.response?.message || error?.message || HTTP_MESSAGE.INTERNAL_SERVER_ERROR,
        });
      }),
    );
  }
}
