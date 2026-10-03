import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryProjectsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by project name' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;
}
