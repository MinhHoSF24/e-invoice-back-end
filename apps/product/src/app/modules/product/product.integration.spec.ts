import { ProductController } from './controllers/product.controller';
import { ProductRepository } from './repositories/product.repository';
import { ProductService } from './services/product.service';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '@common/entities/product.entity';
import { CreateTcpProductRequest } from '@common/interfaces/tcp/product/product-request.interface';
import { HttpStatus } from '@nestjs/common';

describe('Product Integration Tests', () => {
  let productController: ProductController;
  let productRepository: ProductRepository;
  let postgresContainer: StartedPostgreSqlContainer;

  beforeAll(async () => {
    // Start PostgreSQL container
    postgresContainer = await new PostgreSqlContainer('postgres:16-alpine').start();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: postgresContainer.getHost(),
          port: postgresContainer.getPort(),
          username: postgresContainer.getUsername(),
          password: postgresContainer.getPassword(),
          database: postgresContainer.getDatabase(),
          entities: [Product],
          synchronize: true, // Use with caution in production
        }),
        TypeOrmModule.forFeature([Product]),
      ],
      controllers: [ProductController],
      providers: [ProductRepository, ProductService],
    }).compile();

    productController = module.get<ProductController>(ProductController);
    productRepository = module.get<ProductRepository>(ProductRepository);
  }, 60000); // Increase timeout for container startup

  afterAll(async () => {
    await postgresContainer.stop();
  });

  afterEach(async () => {
    const allProducts = await productRepository.findAll();
    for (const product of allProducts) {
      await productRepository.delete(product.id);
    }
  });

  it('should be defined', () => {
    expect(productController).toBeDefined();
    expect(productRepository).toBeDefined();
  });

  it('should create a product', async () => {
    const createDto: CreateTcpProductRequest = {
      name: 'Test Product',
      sku: 'TEST-SKU',
      description: 'Test Description',
      price: 100,
      unit: 'pcs',
      vatRate: 10,
    };

    const response = await productController.create(createDto);

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.data).toBeDefined();
    expect(response.data?.name).toBe(createDto.name);
    expect(response.data?.sku).toBe(createDto.sku);

    // Check DB
    if (response.data?.id) {
      const savedProduct = await productRepository.findById(response.data.id);
      expect(savedProduct).toBeDefined();
      expect(savedProduct?.name).toBe(createDto.name);
    }
  });

  it('should get list of products', async () => {
    await productRepository.create({
      name: 'Product 1',
      sku: 'SKU-1',
      price: 10,
      unit: 'pcs',
      vatRate: 10,
    });
    await productRepository.create({
      name: 'Product 2',
      sku: 'SKU-2',
      price: 20,
      unit: 'box',
      vatRate: 8,
    });

    const response = await productController.getList();

    console.log('response', response);

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.statusCode).toBe(200);
    expect(response.data).toBeDefined();
    expect(response.data).toHaveLength(2);
    expect(response.data?.find((p) => p.sku === 'SKU-1')).toBeDefined();
    expect(response.data?.find((p) => p.sku === 'SKU-2')).toBeDefined();
  });
});
