import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

/** Service for encrypting/decrypting sensitive data (tokens) using AES-256-CBC */
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;
  private readonly ivLength = 16;

  constructor() {
    const secret = process.env.ENCRYPTION_SECRET || 'default-secret-key-change-me-32';
    this.key = crypto.scryptSync(secret, 'salt', 32);
  }

  /** Encrypt text using AES-256-CBC. Returns format: iv:encryptedData */
  encrypt(text: string): string {
    if (!text) {
      return '';
    }

    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  /** Decrypt text encrypted by encrypt() method. Expects format: iv:encryptedData */
  decrypt(encryptedText: string): string {
    if (!encryptedText) {
      return '';
    }

    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted text format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }
}
