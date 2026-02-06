import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { HashingPasswordsService } from '../users/hashing-passwords.service';
import { User } from '../users/entities/user.entity';
import { AuthResponseDto } from './dto/auth-response.dto';
import { plainToInstance } from 'class-transformer';
import { SERIALIZATION_GROUPS } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private hashingPasswordsService: HashingPasswordsService,
        private jwtService: JwtService,
    ) { }

    /** Validate user login and password */
    async validateUser(login: string, password: string): Promise<User | null> {
        try {
            const user = await this.usersService.findUserByLogin(login);

            if (!user) {
                return null;
            }

            const isPasswordValid = await this.hashingPasswordsService.compare(
                password,
                user.password,
            );

            if (!isPasswordValid) {
                return null;
            }

            return user;
        } catch (error) {
            return null;
        }
    }

    /** Generate JWT token for user */
    async login(user: User): Promise<AuthResponseDto> {
        const payload = {
            sub: user.id,
            login: user.login,
        };

        const accessToken = this.jwtService.sign(payload);

        const serializedUser = plainToInstance(User, user, {
            groups: SERIALIZATION_GROUPS.BASIC,
        });

        return {
            accessToken,
            user: serializedUser,
        };
    }

    /** Validate and process OAuth user */
    async validateOAuthUser(oauthData: {
        provider: 'google' | 'github';
        providerId: string;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string;
    }): Promise<User> {
        const existingUser = await this.usersService.findByProviderId(
            oauthData.provider,
            oauthData.providerId,
        );

        if (existingUser) {
            return existingUser;
        }

        try {
            const userByEmail = await this.usersService.findUserByEmail(oauthData.email);

            return await this.usersService.linkOAuthProvider(
                userByEmail.id,
                oauthData.provider,
                oauthData.providerId,
            );
        } catch (error) {
            // User with this email not found
        }

        return await this.usersService.createOAuthUser(oauthData);
    }
}
