import { HTTP_MESSAGE } from '@common/constants/enum/http-message.enum';
import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class ResponseDTO<T> {
  @ApiProperty({ type: String })
  message = HTTP_MESSAGE.OK;
  @ApiProperty()
  data?: T;
  @ApiProperty()
  processId?: string;
  @ApiProperty()
  duration?: string;
  @ApiProperty()
  statusCode = HttpStatus.OK;

  constructor(data: Partial<ResponseDTO<T>>) {
    Object.assign(this, data);
  }
}
