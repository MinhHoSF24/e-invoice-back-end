import { ApiProperty } from '@nestjs/swagger';
import { HTTP_MESSAGE } from '@common/constants/enum/http-message.enum';
import { HttpStatus } from '@nestjs/common';

export class Response<T> {
  @ApiProperty({ type: String })
  message = HTTP_MESSAGE.OK;
  @ApiProperty()
  data?: T;
  @ApiProperty()
  error?: string;
  @ApiProperty()
  @ApiProperty({ type: Number })
  statusCode = HttpStatus.OK;

  constructor(data: Partial<Response<T>>) {
    Object.assign(this, data);
  }

  static success<T>(data: T): Response<T> {
    return new Response<T>({
      data,
      statusCode: HttpStatus.OK,
      message: HTTP_MESSAGE.OK,
    });
  }
}

export type ResponseType<T> = Response<T>;
