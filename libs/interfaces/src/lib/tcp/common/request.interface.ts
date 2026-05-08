import { ApiProperty } from '@nestjs/swagger';

export class Request<T> {
  @ApiProperty({ type: String })
  processId?: string;
  @ApiProperty()
  data?: T;

  constructor(data: Partial<Request<T>>) {
    Object.assign(this, data);
  }
}

export type RequestType<T> = Request<T>;
