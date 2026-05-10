import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeRawCodeDto {
  @ApiProperty({
    description: 'The source code to analyze',
    example: 'const x = 1; eval("alert(x)");',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Optional filename to help ESLint identify the language/rules',
    example: 'test-file.ts',
    required: false,
  })
  @IsString()
  @IsOptional()
  fileName?: string;
}
