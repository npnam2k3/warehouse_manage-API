import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { FindOptionsWhere, Not, Repository } from 'typeorm';
import { ERROR_MESSAGE } from 'src/constants/exception.message';
import { hashPassword } from 'src/utils/handlePassword';
import { RolesService } from '../roles/roles.service';
import { plainToInstance } from 'class-transformer';
import { UserResponseDTO } from './dto/response-user.dto';
import { ENTITIES_MESSAGE } from 'src/constants/entity.message';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly roleService: RolesService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    // 1. check email and username exists
    const userExists = await this.userRepository.findOne({
      where: [
        { username: createUserDto.username },
        { email: createUserDto.email },
      ],
    });
    // if exists => throw error
    if (userExists) {
      throw new ConflictException(
        userExists.username === createUserDto.username
          ? ERROR_MESSAGE.USERNAME_EXISTS
          : ERROR_MESSAGE.EMAIL_EXISTS,
      );
    }

    // if not => create new user
    const newUser = this.userRepository.create({
      username: createUserDto.username,
      fullname: createUserDto.fullname,
      email: createUserDto.email,
      hashedPassword: await hashPassword(createUserDto.password),
    });

    // find the role by name that we want to assign to the user
    const role = await this.roleService.findRoleByName(createUserDto.role);
    // console.log(`check role:: ${JSON.stringify(role)}`);
    if (role) {
      // if the role exists => assign it to the user
      newUser.role = role;
    }
    await this.userRepository.save(newUser);
    return this.convertToDTO(newUser);
  }

  async findAll({ page, limit, search, sortBy, orderBy }) {
    // thứ tự thực hiện sql: search => order => pagination
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role');

    // 1. search
    if (search) {
      queryBuilder.where('user.fullname LIKE :search', {
        search: `%${search}%`,
      });
    }

    // 2. sort
    if (sortBy) {
      const order = orderBy.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      queryBuilder.orderBy(`user.${sortBy}`, order);
    }

    //3. pagination
    const totalRecords = await queryBuilder.getCount();
    const users = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      users,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      conditions: {
        page,
        limit,
        search,
        sortBy,
        orderBy,
      },
    };
  }

  async findOne(id: number): Promise<UserResponseDTO> {
    const userExists = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!userExists)
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.USER),
      );
    return this.convertToDTO(userExists);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      if (!updateUserDto || Object.keys(updateUserDto).length === 0)
        throw new BadRequestException(ERROR_MESSAGE.INVALID_INPUT_UPDATE);

      // check the user exists
      const userExists = await this.userRepository.findOne({
        where: {
          id,
        },
        relations: ['role'],
      });

      // if the user not exists => throw error
      if (!userExists)
        throw new NotFoundException(
          ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.USER),
        );

      // console.log(`check userExists:: ${JSON.stringify(userExists)}`);

      // if exists => check the user with value update must be different with others user (username, email)
      const { email, username, role, ...otherUpdates } = updateUserDto;
      const whereConditions: FindOptionsWhere<User>[] = [];
      if (username) whereConditions.push({ username, id: Not(id) });
      if (email) whereConditions.push({ email, id: Not(id) });
      const existingUser =
        whereConditions.length > 0
          ? await this.userRepository.findOne({ where: whereConditions })
          : null;
      if (existingUser) {
        if (existingUser.username === username) {
          throw new ConflictException(ERROR_MESSAGE.USERNAME_EXISTS);
        }
        if (existingUser.email === email) {
          throw new ConflictException(ERROR_MESSAGE.EMAIL_EXISTS);
        }
      }

      // check that the user's old data is different from the new data they want to update
      let isUpdated = false;
      const updatedFields: Partial<User> = {};
      Object.entries(updateUserDto).forEach(([key, value]) => {
        if (value && key !== 'role' && userExists[key] !== value) {
          updatedFields[key] = value;
          isUpdated = true;
        }
      });
      if (role && userExists.role?.name !== role.toUpperCase()) {
        const foundRole = await this.roleService.findRoleByName(role);
        if (foundRole) {
          updatedFields.role = foundRole;
          isUpdated = true;
        }
      }
      // console.log(`check updateFields:: ${JSON.stringify(updatedFields)}`);
      // console.log(`check isUpdated:: ${isUpdated}`);
      if (!isUpdated)
        throw new BadRequestException(ERROR_MESSAGE.NO_DATA_CHANGE);
      await this.userRepository.update(id, updatedFields);

      return this.convertToDTO({ ...userExists, ...updatedFields });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        ERROR_MESSAGE.INTERNAL_ERROR_SERVER,
      );
    }
  }

  async remove(id: number) {
    const userExists = await this.userRepository.findOne({
      where: { id },
    });
    if (!userExists) {
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.USER),
      );
    }
    await this.userRepository.softRemove(userExists);
    // return `This action removes a #${id} user`;
  }

  convertToDTO(object) {
    return plainToInstance(UserResponseDTO, object, {
      excludeExtraneousValues: true,
    });
  }
}
