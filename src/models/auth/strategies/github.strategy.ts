import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
    constructor(private authService: AuthService) {
        super({
            clientID: process.env.GITHUB_CLIENT_ID || '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
            callbackURL: process.env.GITHUB_CALLBACK_URL || '',
            scope: ['user:email'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: any, user?: any) => void,
    ): Promise<any> {
        const { id, emails, displayName, username, photos } = profile;

        const email = emails?.[0]?.value || `${username}@github.local`;

        const nameParts = displayName?.split(' ') || [username || 'User'];
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || '';

        const user = await this.authService.validateOAuthUser({
            provider: 'github',
            providerId: id || '',
            email,
            firstName,
            lastName,
            avatarUrl: photos?.[0]?.value,
        });

        done(null, user);
    }
}
