import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsString, validateSync } from 'class-validator';
import { Logger } from '@nestjs/common';

export class BaseConfiguration {
  @IsString()
  @Type(() => String)
  NODE_ENV: string;
  @IsBoolean()
  @Type(() => Boolean)
  IS_DEV: boolean;
  @IsString()
  @Type(() => String)
  @IsNotEmpty()
  GLOBAL_PREFIX: string;

  constructor() {
    this.NODE_ENV = process.env['NODE_ENV'] || 'development';
    this.IS_DEV = this.NODE_ENV === 'development';
    this.GLOBAL_PREFIX = process.env['GLOBAL_PREFIX'] || '';
  }

  async validate() {
    const errors = await validateSync(this);
    if (errors.length > 0) {
      const _errors = errors.map((error) => {
        return error.children;
      });

      Logger.error('Configuration validation failed: ' + JSON.stringify(_errors));
      throw new Error('Configuration validation failed');
    }
  }
}
