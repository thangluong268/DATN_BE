import { Controller, Get, Query } from '@nestjs/common';
import { CategoryService } from './category.service';
import { GetCategoriesREQ } from './request/categories-get.request';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  getCategories(@Query() query: GetCategoriesREQ) {
    return this.categoryService.getCategories(query);
  }
}
