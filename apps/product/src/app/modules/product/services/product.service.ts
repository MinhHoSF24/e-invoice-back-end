import { BadRequestException, Injectable } from '@nestjs/common';
import { ProductRepository } from '../repositories/product.repository';
import { CreateTcpProductRequest } from '@common/interfaces/tcp/product/product-request.interface';
import { ProductResponseDTO } from '@common/interfaces/gateway/product';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async create(params: CreateTcpProductRequest) {
    const { name, sku } = params;

    const isExist = await this.productRepository.checkSkuExists(sku, name);
    if (isExist) {
      throw new BadRequestException('Product with the same SKU or name already exists');
    }
    return this.productRepository.create(params);
  }

  getList() {
    return this.productRepository.findAll();
  }
}
