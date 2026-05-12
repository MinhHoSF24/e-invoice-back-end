import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDTO {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
