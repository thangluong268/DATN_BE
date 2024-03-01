import { BadRequestException } from '@nestjs/common';

export class PaginationValidationService {
  public static validate<T>(data: T[], pageNumber: number, pageSize: number): void {
    if (!Array.isArray(data)) {
      throw new BadRequestException('Invalid data format');
    }
    const maxPageNumber = Math.ceil(data.length / pageSize);
    if (pageNumber < 1 || pageNumber > maxPageNumber) {
      throw new BadRequestException('Page number is invalid');
    }
    if (pageSize < 1) {
      throw new BadRequestException('Page size should be greater than 0');
    }
  }
}
