import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as argon2 from 'argon2';

@Injectable()
export class HashingPasswordsService {
  private readonly PEPPER = process.env.PASSWORD_PEPPER || 'default-pepper-change-in-production';

  async hash(plainPassword: string): Promise<string> {
    const salt = randomBytes(16);

    const passwordWithPepper = plainPassword + this.PEPPER;

    const hash = await argon2.hash(passwordWithPepper, {
      type: argon2.argon2id,
      salt,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    return hash;
  }

  async compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      const passwordWithPepper = plainPassword + this.PEPPER;

      return await argon2.verify(hashedPassword, passwordWithPepper);
    } catch (error) {
      return false;
    }
  }
}
