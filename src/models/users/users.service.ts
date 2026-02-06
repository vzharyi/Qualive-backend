import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SERIALIZATION_GROUPS, User } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { HashingPasswordsService } from './hashing-passwords.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: HashingPasswordsService,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findByLoginOrEmail(
      createUserDto.login,
      createUserDto.email,
    );

    if (existing) {
      throw new ConflictException('User with same login or email already exists');
    }

    const hashedPassword = await this.passwordService.hash(createUserDto.password);

    const user = await this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return plainToInstance(User, user, {
      groups: SERIALIZATION_GROUPS.CONFIDENTIAL,
    });
  }

  async findAll(): Promise<User[]> {
    const users = await this.usersRepository.findAll();
    return users.map((user) =>
      plainToInstance(User, user, {
        groups: SERIALIZATION_GROUPS.BASIC,
      }),
    );
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return plainToInstance(User, user, {
      groups: SERIALIZATION_GROUPS.BASIC,
    });
  }

  async findUserById(
    id: number,
    serializationGroup: string[] = SERIALIZATION_GROUPS.PRIVATE,
  ): Promise<User> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return plainToInstance(User, user, {
      groups: serializationGroup,
    });
  }

  async findUserByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User with this email not found');
    }

    return plainToInstance(User, user, {
      groups: SERIALIZATION_GROUPS.PRIVATE,
    });
  }

  async findUserByLogin(login: string): Promise<User> {
    const user = await this.usersRepository.findByLogin(login);

    if (!user) {
      throw new NotFoundException('User with this login not found');
    }

    return plainToInstance(User, user, {
      groups: SERIALIZATION_GROUPS.PRIVATE,
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.usersRepository.update(id, updateUserDto);

    return plainToInstance(User, updatedUser, {
      groups: SERIALIZATION_GROUPS.CONFIDENTIAL,
    });
  }

  async remove(id: number): Promise<void> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.delete(id);
  }

  /** Find user by OAuth provider ID */
  async findByProviderId(
    provider: 'google' | 'github',
    providerId: string,
  ): Promise<User | null> {
    const field = provider === 'google' ? 'googleId' : 'githubId';
    const user = await this.usersRepository.findByField(field, providerId);

    if (!user) {
      return null;
    }

    return plainToInstance(User, user, {
      groups: SERIALIZATION_GROUPS.PRIVATE,
    });
  }

  /** Link OAuth provider to existing user */
  async linkOAuthProvider(
    userId: number,
    provider: 'google' | 'github',
    providerId: string,
  ): Promise<User> {
    const updateData = provider === 'google'
      ? { googleId: providerId }
      : { githubId: providerId };

    const updatedUser = await this.usersRepository.update(userId, updateData as any);

    return plainToInstance(User, updatedUser, {
      groups: SERIALIZATION_GROUPS.PRIVATE,
    });
  }

  /** Create new user via OAuth */
  async createOAuthUser(oauthData: {
    provider: 'google' | 'github';
    providerId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  }): Promise<User> {
    const crypto = require('crypto');
    const randomPassword = await this.passwordService.hash(
      crypto.randomBytes(32).toString('hex'),
    );

    const baseLogin = oauthData.email.split('@')[0];
    const login = `${baseLogin}_${Date.now()}`;

    const user = await this.usersRepository.create({
      login,
      email: oauthData.email,
      password: randomPassword,
      firstName: oauthData.firstName,
      lastName: oauthData.lastName,
      avatarUrl: oauthData.avatarUrl || null,
      googleId: oauthData.provider === 'google' ? oauthData.providerId : null,
      githubId: oauthData.provider === 'github' ? oauthData.providerId : null,
    });

    return plainToInstance(User, user, {
      groups: SERIALIZATION_GROUPS.PRIVATE,
    });
  }
}
