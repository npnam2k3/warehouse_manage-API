import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { UnitService } from '../unit/unit.service';
import { CategoryService } from '../category/category.service';
import { ERROR_MESSAGE } from 'src/constants/exception.message';
import { ENTITIES_MESSAGE } from 'src/constants/entity.message';
import * as crypto from 'crypto';
import { Inventory } from './entities/inventory.entity';
import { getInfoObject } from 'src/utils/compareObject';
import { isEmpty, isEqual, omitBy } from 'lodash';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly unitService: UnitService,
    private readonly categoryService: CategoryService,
  ) {}
  async create(createProductDto: CreateProductDto, file: any) {
    const productExists = await this.productRepository.count({
      where: {
        name: createProductDto.name,
      },
    });
    if (productExists > 0)
      throw new ConflictException(
        ERROR_MESSAGE.ALREADY_EXISTS(ENTITIES_MESSAGE.PRODUCT),
      );

    const unitFound = await this.unitService.findOne(createProductDto.unitId);
    const categoryFound = await this.categoryService.findOne(
      createProductDto.categoryId,
    );
    const newProduct = this.productRepository.create({
      product_code: this.generateProductCode(),
      name: createProductDto.name,
      purchase_price: createProductDto.purchase_price,
      sell_price: createProductDto.sell_price,
      category: categoryFound,
      unit: unitFound,
    });
    if (createProductDto.description) {
      newProduct.description = createProductDto.description;
    }
    if (file) {
      const imageUrl = await this.cloudinaryService.uploadFile(file);
      newProduct.imageUrl = imageUrl;
    }
    await this.productRepository.save(newProduct);

    const newInventory = this.inventoryRepository.create({
      product: newProduct,
      warehouse: null,
    });
    await this.inventoryRepository.save(newInventory);

    const { quantity, warehouse } = newInventory;
    return { ...newProduct, quantity, warehouse };
  }

  async findAll({ pageNum, limitNum, search, category, sortBy, orderBy }) {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.unit', 'unit')
      .leftJoinAndSelect('product.inventories', 'inventories')
      .leftJoinAndSelect('inventories.warehouse', 'warehouse');

    let haveCondition = false;
    let findByCode = false;

    // tim kiem theo ten hoac ma san pham
    if (search) {
      const isProductCode = /^SP[A-Za-z0-9]+$/.test(search);

      if (isProductCode) {
        // tim theo ma san pham
        queryBuilder.where('product.product_code = :code', {
          code: search,
        });
        haveCondition = true;
        findByCode = true;
      } else {
        queryBuilder.where('product.name LIKE :name', {
          name: `%${search}%`,
        });
        haveCondition = true;
      }
    }

    // loc theo category
    if (category && !findByCode) {
      if (!haveCondition) {
        queryBuilder.where('product.categoryId = :category', { category });
      } else {
        queryBuilder.andWhere('product.categoryId = :category', { category });
      }
    }

    // sap xep
    const validSortFields = [
      'product_code',
      'name',
      'purchase_price',
      'sell_price',
    ];
    if (sortBy && validSortFields.includes(sortBy)) {
      const order = orderBy?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      queryBuilder.orderBy(`product.${sortBy}`, order);
    } else {
      queryBuilder.orderBy('product.sell_price', 'DESC'); // Mặc định
    }

    // phan trang
    // const totalRecords = await queryBuilder.getCount();
    const [products, totalRecords] = await queryBuilder
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .getManyAndCount();

    return {
      products,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum),
      conditions: {
        pageNum,
        limitNum,
        search,
        category,
        sortBy,
        orderBy,
      },
    };
  }

  async findOne(id: number) {
    const productExists = await this.productRepository.findOne({
      where: { id },
      relations: {
        suppliers: true,
        category: true,
        inventories: {
          warehouse: true,
        },
        unit: true,
      },
    });

    if (!productExists) {
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.PRODUCT),
      );
    }
    return productExists;
  }

  async update(id: number, updateProductDto: UpdateProductDto, file: any) {
    const productExists = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'unit'],
    });
    if (!productExists) {
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.PRODUCT),
      );
    }

    const existingProduct = await this.productRepository
      .createQueryBuilder('product')
      .select(['product.id', 'product.name'])
      .where('product.name = :name', { name: updateProductDto.name })
      .andWhere('product.id != :id', { id })
      .getCount();

    if (existingProduct > 0) {
      throw new ConflictException(
        ERROR_MESSAGE.ALREADY_EXISTS(ENTITIES_MESSAGE.PRODUCT),
      );
    }

    const oldData = {
      name: productExists.name,
      purchase_price: productExists.purchase_price,
      sell_price: productExists.sell_price,
      categoryId: productExists.category?.id,
      unitId: productExists.unit?.id,
      description: productExists.description,
    };
    const newData: any = getInfoObject(
      [
        'name',
        'purchase_price',
        'sell_price',
        'categoryId',
        'unitId',
        'description',
      ],
      updateProductDto,
    );
    if (updateProductDto.description === '') newData.description = null;

    // loai bo cac truong giong nhau => thu duoc object cac truong thay doi
    const changeFields = omitBy(newData, (value, key) =>
      isEqual(oldData[key], value),
    );

    if (file) {
      const imageUrl = await this.cloudinaryService.uploadFile(file);
      changeFields.imageUrl = imageUrl;
    }

    if (isEmpty(changeFields)) {
      throw new BadRequestException(ERROR_MESSAGE.NO_DATA_CHANGE);
    }
    // console.log('change data before:: ', changeFields);

    if (changeFields.categoryId) {
      const categoryFound = await this.categoryService.findOne(
        changeFields.categoryId,
      );
      changeFields.category = categoryFound;
      delete changeFields.categoryId;
    }

    if (changeFields.unitId) {
      const unitFound = await this.unitService.findOne(changeFields.unitId);
      changeFields.unit = unitFound;
      delete changeFields.unitId;
    }

    // console.log('change data after:: ', changeFields);
    await this.productRepository.update(id, changeFields);
  }

  async remove(id: number) {
    // 1. Tìm product kèm theo quan hệ với inventories
    const productExists = await this.productRepository.findOne({
      where: { id },
      relations: ['inventories'],
    });

    // 2. Nếu không tồn tại thì báo lỗi
    if (!productExists)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.PRODUCT),
      );

    // 3. Kiểm tra có inventory nào quantity > 0 không
    const hasQuantity = productExists.inventories.some(
      (inv) => inv.quantity > 0,
    );
    if (hasQuantity)
      throw new BadRequestException(
        ERROR_MESSAGE.CANNOT_DELETE_PRODUCT(
          productExists.name.toLocaleLowerCase(),
        ),
      );

    // 4. Xóa các inventory liên quan (nếu có)
    if (productExists.inventories.length > 0) {
      await this.inventoryRepository.remove(productExists.inventories);
    }

    // 5. Soft delete product
    await this.productRepository.softRemove(productExists);
  }

  async getAll() {
    const products = await this.productRepository.find({
      select: ['id', 'product_code', 'name'],
    });
    return products;
  }

  async getAllProductsHaveQuantityInWarehouse() {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.inventories', 'inventory')
      .leftJoinAndSelect('inventory.warehouse', 'warehouse')
      .where('warehouse.id IS NOT NULL')
      .getMany();

    return products;
  }

  generateProductCode(): string {
    const prefix = 'SP';
    const timestamp = Date.now().toString(36).slice(-4).toUpperCase(); // Lấy 4 ký tự cuối của timestamp base36
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomStr = '';
    const bytes = crypto.randomBytes(4); // 4 ký tự ngẫu nhiên

    for (let i = 0; i < 4; i++) {
      randomStr += characters[bytes[i] % characters.length];
    }

    return `${prefix}${timestamp}${randomStr}`; // SP (2) + timestamp (4) + random (4) = 10 ký tự
  }
}
