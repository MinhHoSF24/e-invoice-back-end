import { ApiProperty } from '@nestjs/swagger';

export class BaseEntityResponseDTO {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
