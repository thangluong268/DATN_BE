import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from 'domains/auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from 'domains/auth/guards/auth-jwt-at.guard';
import { AuthRoleGuard } from 'domains/auth/guards/auth-role.guard';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { CategoryService } from './category.service';
import { CategoryCreateREQ } from './request/category-create.request';
import { GetCategoryREQ } from './request/category-get.request';
import { CategoryUpdateREQ } from './request/category-update.request';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  getCategories(@Query() query: GetCategoryREQ) {
    return this.categoryService.getCategories(query);
  }

  @Get(':id')
  getCategoryById(@Param('id') id: string) {
    return this.categoryService.findById(id);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Post()
  create(@Body() body: CategoryCreateREQ) {
    return this.categoryService.create(body);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: CategoryUpdateREQ) {
    return this.categoryService.update(id, body);
  }
}
