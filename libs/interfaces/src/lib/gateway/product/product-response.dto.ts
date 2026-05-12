import { ApiProperty } from '@nestjs/swagger';
import { BaseEntityResponseDTO } from '../common/base-entity-response.dto';

export class ProductResponseDTO extends BaseEntityResponseDTO {
  @ApiProperty()
  name: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  unit: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  vatRate: number;
}
