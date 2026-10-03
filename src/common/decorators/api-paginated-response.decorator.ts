import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

/**
 * Documents a paginated response of the given model for Swagger.
 */
export const ApiPaginatedResponse = <TModel extends Type<unknown>>(
  model: TModel,
) =>
  applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        allOf: [
          {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: {
                type: 'object',
                properties: {
                  total: { type: 'number', example: 42 },
                  page: { type: 'number', example: 1 },
                  limit: { type: 'number', example: 20 },
                  totalPages: { type: 'number', example: 3 },
                },
              },
            },
          },
        ],
      },
    }),
  );
