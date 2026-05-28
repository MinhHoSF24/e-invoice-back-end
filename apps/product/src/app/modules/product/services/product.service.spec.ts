import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { ProductRepository } from '../repositories/product.repository';
import { CreateTcpProductRequest } from '@common/interfaces/tcp/product/product-request.interface';
import { BadRequestException } from '@nestjs/common';

describe('ProductService', () => {
  let productService: ProductService;
  let productRepository: ProductRepository;

  const mockProductRepository = {
    checkSkuExists: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductService, { provide: ProductRepository, useValue: mockProductRepository }],
    }).compile();

    productService = module.get<ProductService>(ProductService);
    productRepository = module.get<ProductRepository>(ProductRepository);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(productService).toBeDefined();
  });

  describe('create', () => {
    const createProductDto: CreateTcpProductRequest = {
      sku: 'TESTSKU',
      name: 'Test Product',
      description: 'A product for testing',
      price: 100,
      unit: 'pcs',
      vatRate: 20,
    }; // Replace with actual DTO

    it('should create a product successfully when it does not exist', async () => {
      mockProductRepository.checkSkuExists.mockResolvedValue(false);
      mockProductRepository.create.mockResolvedValue({
        id: 1,
        ...createProductDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await productService.create(createProductDto);

      expect(mockProductRepository.checkSkuExists).toHaveBeenCalledWith(createProductDto.sku, createProductDto.name);
      expect(mockProductRepository.create).toHaveBeenCalledWith(createProductDto);
      expect(result).toEqual({
        id: 1,
        ...createProductDto,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should throw BadRequestException when product existed', async () => {
      mockProductRepository.checkSkuExists.mockResolvedValue(true);

      await expect(productService.create(createProductDto)).rejects.toThrow(BadRequestException);
      expect(mockProductRepository.checkSkuExists).toHaveBeenCalledWith(createProductDto.sku, createProductDto.name);
      expect(mockProductRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getList', () => {
    it('should return an array of products', async () => {
      const mockProducts = [
        {
          id: 1,
          sku: 'SKU-1',
          name: 'P1',
          price: 100,
          unit: 'pcs',
          vatRate: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          sku: 'SKU-2',
          name: 'P2',
          price: 200,
          unit: 'box',
          vatRate: 8,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockProductRepository.findAll.mockResolvedValue(mockProducts);

      const result = await productService.getList();

      expect(productRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockProducts);
    });
  });
});
