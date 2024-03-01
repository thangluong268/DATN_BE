import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { Roles } from '../auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from '../auth/guards/auth-jwt-at.guard';
import { ProductService } from './product.service';
import { ProductCreateREQ } from './request/product-create.request';
import { GetProductsREQ } from './request/product-get-public.request';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard)
  @Post('product/seller')
  create(@Req() req, @Body() body: ProductCreateREQ) {
    return this.productService.create(req.user._id, body);
  }

  @Get('product-give')
  getProductGives(@Query() query: PaginationREQ) {
    return this.productService.getProductGives(query);
  }

  @Get('product')
  getProducts(@Query() query: GetProductsREQ) {
    return this.productService.getProducts(query, { status: true });
  }
}
