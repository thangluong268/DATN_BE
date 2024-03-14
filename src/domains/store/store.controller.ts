import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthRoleGuard } from 'domains/auth/guards/auth-role.guard';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { Roles } from '../auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from '../auth/guards/auth-jwt-at.guard';
import { StoreCreateREQ } from './request/store-create.request';
import { GetStoresByAdminREQ } from './request/store-get-all-admin.request';
import { StoreGetHaveMostProductREQ } from './request/store-get-have-most-product.request';
import { StoreUpdateREQ } from './request/store-update.request';
import { StoreService } from './store.service';

@Controller()
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('store/seller')
  getMyStore(@Req() req) {
    return this.storeService.getMyStore(req.user._id);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('store/admin')
  getStores(@Query() query: GetStoresByAdminREQ) {
    return this.storeService.getStores(query);
  }

  @Get('store-reputation')
  getStoreReputation(@Req() req, @Query('storeId') storeId: string) {
    return this.storeService.getStoreReputation(req.user, storeId);
  }

  @Roles(ROLE_NAME.ADMIN)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('store/admin/stores-most-products')
  getStoresHaveMostProduct(@Query() query: StoreGetHaveMostProductREQ) {
    return this.storeService.getStoresHaveMostProduct(query);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('store/admin-get-all')
  getStoresByManager() {
    return this.storeService.getStoresByManager();
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('store/admin/:id')
  getStoreByManager(@Param('id') id: string) {
    return this.storeService.getStoreByManager(id);
  }

  @Get('store/:id')
  getStoreById(@Param('id') id: string) {
    return this.storeService.getStoreById(id);
  }

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Post('store/user')
  createStore(@Req() req, @Body() body: StoreCreateREQ) {
    return this.storeService.create(req.user._id, body);
  }

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Put('store/seller')
  updateStore(@Req() req, @Body() body: StoreUpdateREQ) {
    return this.storeService.update(req.user._id, body);
  }

  /**
   * This is part of scraping data
   */
  @Post('store/scraping')
  scrapingData() {
    return this.storeService.scrapingData();
  }
}
