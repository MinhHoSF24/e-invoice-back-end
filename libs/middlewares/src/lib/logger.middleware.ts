import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { getProcessId } from '@common/utils/string.util';
import { MetaDataKeys } from '@common/constants/common.constants';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    Logger.log('Request...');
    const startTime = Date.now();
    const { method, url, body } = req;

    const processId = getProcessId('request');
    const now = Date.now();

    (req as any).metaData = (req as any).metaData ?? {};
    (req as any).metaData[MetaDataKeys.PROCESS_ID] = processId;
    (req as any).metaData[MetaDataKeys.START_TIME] = startTime;

    Logger.log(
      `HTTP >> Start Process '${processId}' >> path: '${url}' >> method: '${method}' >> at ${now} body: '${JSON.stringify(body)}' `,
    );

    const originalSend = res.send.bind(res);

    res.send = (body: any) => {
      const duration = Date.now() - startTime;
      Logger.log(
        `HTTP >> End Process '${processId}' >> path: '${url}' >> method: '${method}' >> output: '${JSON.stringify(body)}' >> in ${duration}ms`,
      );
      return originalSend(body);
    };

    next();
  }
}
