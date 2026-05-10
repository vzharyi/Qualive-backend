import { User as PrismaUser } from '@prisma/client';
import { Expose } from 'class-transformer';

export const SERIALIZATION_GROUPS = {
  BASIC: ['basic'],
  CONFIDENTIAL: ['basic', 'confidential'],
  PRIVATE: ['basic', 'confidential', 'private'],
  PROJECT: ['basic', 'project'],
};

export class User implements PrismaUser {
  @Expose({ groups: ['basic'] })
  id: number;

  @Expose({ groups: ['basic'] })
  login: string;

  @Expose({ groups: ['confidential', 'project'] })
  email: string;

  @Expose({ groups: ['private'] })
  password: string;

  @Expose({ groups: ['basic'] })
  firstName: string;

  @Expose({ groups: ['basic'] })
  lastName: string;

  @Expose({ groups: ['basic'] })
  avatarUrl: string | null;

  @Expose({ groups: ['confidential'] })
  githubId: string | null;

  @Expose({ groups: ['confidential'] })
  googleId: string | null;

  @Expose({ groups: ['basic'] })
  createdAt: Date;

  @Expose({ groups: ['private'] })
  updatedAt: Date;
}
