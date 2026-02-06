import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { HashingPasswordsService } from './hashing-passwords.service';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, HashingPasswordsService],
  exports: [UsersService, UsersRepository, HashingPasswordsService],
})
export class UsersModule {}
