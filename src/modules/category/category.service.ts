import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Not, Repository } from 'typeorm';
import { ERROR_MESSAGE } from 'src/constants/exception.message';
import { ENTITIES_MESSAGE } from 'src/constants/entity.message';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}
  async create(createCategoryDto: CreateCategoryDto) {
    const categoryExists = await this.categoryRepository.findOne({
      where: {
        name: createCategoryDto.name,
      },
    });
    if (categoryExists)
      throw new ConflictException(
        ERROR_MESSAGE.ALREADY_EXISTS(ENTITIES_MESSAGE.CATEGORY),
      );
    const category = this.categoryRepository.create({
      name: createCategoryDto.name,
    });
    if (createCategoryDto.description)
      category.description = createCategoryDto.description;

    return await this.categoryRepository.save(category);
  }

  async findAll() {
    const categories = await this.categoryRepository.find();
    return categories;
  }

  async findOne(id: number) {
    const categoryExists = await this.categoryRepository.findOne({
      where: { id },
    });
    if (!categoryExists)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.CATEGORY),
      );

    return categoryExists;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    // check category exists
    const categoryExists = await this.categoryRepository.findOne({
      where: { id },
    });
    if (!categoryExists)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.CATEGORY),
      );

    // check the new category's name must be different with others category
    const existingCategory = await this.categoryRepository
      .createQueryBuilder('category')
      .where('LOWER(category.name) = LOWER(:name)', {
        name: updateCategoryDto.name,
      })
      .andWhere('category.id != :id', { id })
      .getOne();
    if (existingCategory)
      throw new ConflictException(
        ERROR_MESSAGE.ALREADY_EXISTS(ENTITIES_MESSAGE.CATEGORY),
      );

    // new data must be different old data
    let isUpdated = false;
    Object.entries(updateCategoryDto).forEach(([key, value]) => {
      if (value && categoryExists[key] !== value) {
        categoryExists[key] = value;
        isUpdated = true;
      }
    });
    if (!isUpdated) throw new BadRequestException(ERROR_MESSAGE.NO_DATA_CHANGE);
    await this.categoryRepository.update(id, categoryExists);
    return categoryExists;
  }

  async remove(id: number) {
    const categoryExists = await this.categoryRepository.findOne({
      where: { id },
    });
    if (!categoryExists)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.CATEGORY),
      );
    await this.categoryRepository.softRemove(categoryExists);
  }
}
