import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({
        description: 'User login',
        example: 'john',
        minLength: 3,
        maxLength: 100,
    })
    @IsString()
    @MinLength(3)
    @MaxLength(100)
    login: string;

    @ApiProperty({
        description: 'User password',
        example: 'MyPassword123',
        minLength: 8,
        maxLength: 100,
    })
    @IsString()
    @MinLength(8)
    @MaxLength(100)
    password: string;
}
