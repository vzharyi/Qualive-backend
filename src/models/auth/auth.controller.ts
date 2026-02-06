import { Controller, Post, UseGuards, Body, HttpStatus, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UsersService } from '../users/users.service';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
    constructor(
        private authService: AuthService,
        private usersService: UsersService,
    ) { }

    @Public()
    @UseGuards(LocalAuthGuard)
    @Post('login')
    @ApiOperation({ summary: 'Login with username and password' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successfully authenticated',
        type: AuthResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Invalid credentials',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Invalid login or password' },
                statusCode: { type: 'number', example: 401 },
            },
        },
    })
    async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
        const user = await this.usersService.findUserByLogin(loginDto.login);
        return this.authService.login(user);
    }

    @Public()
    @Get('google')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Login with Google' })
    @ApiResponse({
        status: HttpStatus.FOUND,
        description: 'Redirects to Google OAuth',
    })
    googleAuth() { }

    @Public()
    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Google OAuth callback' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successfully authenticated with Google',
        type: AuthResponseDto,
    })
    async googleAuthCallback(@Req() req): Promise<AuthResponseDto> {
        return this.authService.login(req.user);
    }

    @Public()
    @Get('github')
    @UseGuards(AuthGuard('github'))
    @ApiOperation({ summary: 'Login with GitHub' })
    @ApiResponse({
        status: HttpStatus.FOUND,
        description: 'Redirects to GitHub OAuth',
    })
    githubAuth() { }

    @Public()
    @Get('github/callback')
    @UseGuards(AuthGuard('github'))
    @ApiOperation({ summary: 'GitHub OAuth callback' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successfully authenticated with GitHub',
        type: AuthResponseDto,
    })
    async githubAuthCallback(@Req() req): Promise<AuthResponseDto> {
        return this.authService.login(req.user);
    }
}
