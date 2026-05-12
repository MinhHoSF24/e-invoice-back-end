import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDTO } from '../common/base-response.dto';
import { INVOICE_STATUS } from '@common/constants/enum/invoice.enum';

class ClientResponseDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  address: string;
}

class ItemResponseDto {
  @ApiProperty({ type: String })
  productId: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  vatRate: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  name: string;
}

export class InvoiceResponseDTO extends BaseResponseDTO {
  @ApiProperty({ type: ClientResponseDto })
  client: ClientResponseDto;

  @ApiProperty({ type: [ItemResponseDto] })
  item: ItemResponseDto[];

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  vatAmount: number;

  @ApiProperty({ type: String, enum: INVOICE_STATUS })
  status: INVOICE_STATUS;

  @ApiProperty({ type: String })
  supervisorId?: string;

  @ApiProperty({ type: String })
  fileUrl?: string;
}
