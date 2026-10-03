import { ApiProperty } from '@nestjs/swagger';

/**
 * Consistent error payload returned by {@link AllExceptionsFilter}.
 */
export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({
    oneOf: [
      { type: 'string', example: 'Email already registered' },
      { type: 'array', items: { type: 'string' } },
    ],
    example: 'Email already registered',
  })
  message: string | string[];

  @ApiProperty({ example: 'Conflict' })
  error: string;

  @ApiProperty({ example: '/api/v1/auth/register' })
  path: string;

  @ApiProperty({ example: 'POST' })
  method: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  timestamp: string;
}
