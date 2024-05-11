import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthRoleGuard } from 'domains/auth/guards/auth-role.guard';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { Roles } from '../auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from '../auth/guards/auth-jwt-at.guard';
import { ProductService } from './product.service';
import { ProductCreateREQ } from './request/product-create.request';
import { ProductGetFilterREQ } from './request/product-get-filter.request';
import { ProductGetInStoreREQ } from './request/product-get-in-store.request';
import { ProductsGetLoveREQ } from './request/product-get-love.request';
import { ProductGetMostInStoreREQ } from './request/product-get-most-in-store.request';
import { ProductGetOtherInStoreREQ } from './request/product-get-orther-in-store.request';
import { ProductGetRandomREQ } from './request/product-get-random.request';
import { ProductsGetREQ } from './request/product-get.request';
import { ProductUpdateREQ } from './request/product-update.request';
import { ProductScraping } from './scraping/product.scraping';

@Controller()
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly productScraping: ProductScraping,
  ) {}

  @Get('product')
  getProducts(@Query() query: ProductsGetREQ) {
    return this.productService.getProducts(query);
  }

  @Get('product-give')
  getProductGives(@Query() query: PaginationREQ) {
    return this.productService.getProductsGive(query);
  }

  @Get('products-in-store')
  getProductsInStore(@Query() query: ProductGetInStoreREQ) {
    return this.productService.getProductsInStore(query);
  }

  @Get('products-other-in-store')
  getProductsOtherInStore(@Query() query: ProductGetOtherInStoreREQ) {
    return this.productService.getProductsOtherInStore(query);
  }

  @Get('product/listProductLasted')
  getProductsLasted(@Query('limit') limit: number) {
    return this.productService.getProductsLasted(Number(limit));
  }

  @Get('product/mostProductsInStore')
  getProductsMostInStore(@Query() query: ProductGetMostInStoreREQ) {
    return this.productService.getProductsMostInStore(Number(query.limit));
  }

  @Post('product/random')
  getProductsRandom(@Query() query: ProductGetRandomREQ, @Body() body: string[]) {
    return this.productService.getProductsRandom(query, body);
  }

  @Get('product-filter')
  getProductsFilter(@Query() query: ProductGetFilterREQ) {
    return this.productService.getProductsFilter(query);
  }

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('product/seller')
  getProductsBySeller(@Req() req, @Query() query: ProductsGetREQ) {
    return this.productService.getProductsBySeller(req.user._id, query);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('product/admin')
  getProductsByManager(@Query() query: ProductsGetREQ) {
    return this.productService.getProductsByManager(query);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('product/admin-get-all')
  getProductsWithDetailByManager() {
    return this.productService.getProductsWithDetailByManager();
  }

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('product/user-love-list')
  getProductsLoveByUser(@Req() req, @Query() query: ProductsGetLoveREQ) {
    return this.productService.getProductsLoveByUser(req.user._id, query);
  }

  @Get('products/select')
  getProductsSelect(@Query('storeId') storeId: string) {
    return this.productService.getProductsSelect(storeId);
  }

  @Get('product/:id')
  getProductById(@Param('id') id: string) {
    return this.productService.getProductById(id);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('product/admin/:id')
  getProductByManager(@Param('id') id: string) {
    return this.productService.getProductByManager(id);
  }

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Post('product/seller')
  create(@Req() req, @Body() body: ProductCreateREQ) {
    return this.productService.create(req.user._id, body);
  }

  @Roles(ROLE_NAME.SELLER, ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Patch('product/seller/:id')
  update(@Param('id') id: string, @Body() body: ProductUpdateREQ) {
    return this.productService.update(id, body);
  }

  @Roles(ROLE_NAME.SELLER, ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Delete('product/:id')
  delete(@Req() req, @Param('id') id: string) {
    return this.productService.delete(req.user._id.toString(), req.user.role, id);
  }

  /**
   * This is part of craping data from another website
   */
  @Post('product/scraping/DoGiaDung_NoiThat_CayCanh')
  scraping_DoGiaDung_NoiThat_CayCanh() {
    return this.productScraping.scraping_DoGiaDung_NoiThat_CayCanh();
  }

  @Post('product/scraping/Do_Dien_Tu')
  scraping_Do_Dien_Tu() {
    return this.productScraping.scraping_Do_Dien_Tu();
  }

  @Post('product/scraping/Me_Va_Be')
  scraping_Me_Va_Be() {
    return this.productScraping.scraping_Do_Choi_Me_Be();
  }

  @Post('product/scraping/Xe_Co')
  scraping_Xe_Co() {
    return this.productScraping.scraping_Xe_Co();
  }

  @Post('product/scraping/Dien_Lanh')
  scraping_Dien_Lanh() {
    return this.productScraping.scraping_Dien_Lanh();
  }

  @Post('product/scraping/GiaiTri_TheThao_SoThich')
  scraping_GiaiTri_TheThao_SoThich() {
    return this.productScraping.scraping_GiaiTri_TheThao_SoThich();
  }

  @Post('product/scraping/ThuCung')
  scraping_ThuCung() {
    return this.productScraping.scraping_ThuCung();
  }

  @Post('product/scraping/Give')
  scraping_Give() {
    return this.productScraping.scraping_Give();
  }

  @Post('product/scraping/Thoi_Trang_Do_Dung_Ca_Nhan')
  scraping_Thoi_Trang_Do_Dung_Ca_Nhan() {
    return this.productScraping.scraping_Thoi_Trang_Do_Dung_Ca_Nhan();
  }

  @Post('product/scraping/Do_Dung_Van_Phong')
  scraping_Do_Dung_Van_Phong() {
    return this.productScraping.scraping_Do_Dung_Van_Phong();
  }
}
