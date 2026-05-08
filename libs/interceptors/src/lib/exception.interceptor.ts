import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, map, Observable } from 'rxjs';
import { MetaDataKeys } from '@common/constants/common.constants';
import { ResponseDTO } from '@common/interfaces/gateway/response.interface';
import { HTTP_MESSAGE } from '@common/constants/enum/http-message.enum';
import { Request } from 'express';

@Injectable()
export class ExceptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ExceptionInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    const ctx = context.switchToHttp();

    const request: Request & { [MetaDataKeys.PROCESS_ID]: string; [MetaDataKeys.START_TIME]: number } =
      ctx.getRequest();

    const processId = request[MetaDataKeys.PROCESS_ID] || '';
    const startTime = request[MetaDataKeys.START_TIME] || 0;

    return next.handle().pipe(
      map((data: ResponseDTO<unknown>) => {
        const duration = Date.now() - Number(startTime);
        data.processId = processId as string;
        data.duration = `${duration}ms`;
        return data;
      }),
      catchError((error) => {
        const duration = Date.now() - Number(startTime);
        const message = error?.response?.data?.message || error?.message || HTTP_MESSAGE.INTERNAL_SERVER_ERROR;
        const rawCode = error?.response?.data?.code || error?.status;
        const code =
          Number.isInteger(rawCode) && rawCode >= 100 && rawCode <= 599 ? rawCode : HttpStatus.INTERNAL_SERVER_ERROR;
        this.logger.error(
          `HTTP >> End Process '${processId}' >> path: '${request.url}' >> method: '${request.method}' >> error: '${message}' >> code: '${code}' >> in ${duration}ms`,
        );
        throw new HttpException(
          new ResponseDTO<unknown>({
            statusCode: code,
            message: message,
            data: error.response?.data || null,
            processId: processId as string,
            duration: `${duration}ms`,
          }),
          code,
        );
      }),
    );
  }
}
