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
import { Repository } from 'typeorm';
import { ERROR_MESSAGE } from 'src/constants/exception.message';
import { hashPassword } from 'src/utils/handlePassword';
import { RolesService } from '../roles/roles.service';
import { plainToInstance } from 'class-transformer';
import { UserResponseDTO } from './dto/response-user.dto';
import { ENTITIES_MESSAGE } from 'src/constants/entity.message';
import { getInfoObject } from 'src/utils/compareObject';
import { isEmpty, isEqual, omitBy } from 'lodash';

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
        userExists.username.toLowerCase() ===
        createUserDto.username.toLowerCase()
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

  async findAll({ pageNum, limitNum, search, sortBy, orderBy }) {
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
      .skip((pageNum - 1) * limitNum)
      .take(limitNum)
      .select([
        'user.id',
        'user.email',
        'user.username',
        'user.fullname',
        'user.createdAt',
        'user.role',
        'user.isBlock',
      ])
      .getMany();

    return {
      users,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum),
      conditions: {
        pageNum,
        limitNum,
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

      // if exists => check the user with value update must be different with others user (username, email)
      const existingUser = await this.userRepository
        .createQueryBuilder('user')
        .select(['user.id', 'user.email', 'user.username'])
        .where('(user.email = :email OR user.username = :username)', {
          email: updateUserDto.email,
          username: updateUserDto.username,
        })
        .andWhere('user.id != :id', { id })
        .getOne();
      if (existingUser) {
        if (
          existingUser.username.toLowerCase() ===
            updateUserDto.username?.toLowerCase() &&
          existingUser.email.toLowerCase() ===
            updateUserDto.email?.toLowerCase()
        ) {
          throw new ConflictException(ERROR_MESSAGE.USERNAME_EMAIL_EXISTS);
        } else if (
          existingUser.username.toLowerCase() ===
          updateUserDto.username?.toLowerCase()
        ) {
          throw new ConflictException(ERROR_MESSAGE.USERNAME_EXISTS);
        } else if (
          existingUser.email.toLowerCase() ===
          updateUserDto.email?.toLowerCase()
        ) {
          throw new ConflictException(ERROR_MESSAGE.EMAIL_EXISTS);
        }
      }

      // check that the user's old data is different from the new data they want to update
      const oldData = {
        username: userExists.username,
        email: userExists.email,
        fullname: userExists.fullname,
        role: userExists.role.name.toLowerCase(),
      };
      const newData = getInfoObject(
        ['username', 'email', 'fullname', 'role'],
        updateUserDto,
      );

      // loai bo cac truong giong nhau => thu duoc object cac truong thay doi
      const changeFields = omitBy(newData, (value, key) =>
        isEqual(oldData[key], value),
      );
      if (isEmpty(changeFields)) {
        throw new BadRequestException(ERROR_MESSAGE.NO_DATA_CHANGE);
      }
      if (changeFields?.role) {
        const foundRole = await this.roleService.findRoleByName(
          changeFields.role,
        );
        changeFields.role = foundRole;
      }
      await this.userRepository.update(id, changeFields);
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
  }
  async block(id: number) {
    const userExists = await this.userRepository.findOne({
      where: { id },
    });
    if (!userExists) {
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.USER),
      );
    }
    await this.userRepository.update(id, {
      isBlock: true,
    });
  }
  async unblock(id: number) {
    const userExists = await this.userRepository.findOne({
      where: { id },
    });
    if (!userExists) {
      throw new NotFoundException(
        ERROR_MESSAGE.NOT_FOUND(ENTITIES_MESSAGE.USER),
      );
    }
    await this.userRepository.update(id, {
      isBlock: false,
    });
  }

  convertToDTO(object) {
    return plainToInstance(UserResponseDTO, object, {
      excludeExtraneousValues: true,
    });
  }
}
