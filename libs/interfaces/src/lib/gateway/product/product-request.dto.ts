import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNotEmpty } from 'class-validator';

export class CreateProductRequestDto {
  @ApiProperty()
  @IsNotEmpty()
  @Type(() => String)
  name: string;

  @ApiProperty()
  @IsOptional()
  @Type(() => String)
  description?: string;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => String)
  sku: string;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => String)
  unit: string;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Number)
  price: number;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Number)
  vatRate: number;
}
