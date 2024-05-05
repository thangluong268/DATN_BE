import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req, UseGuards, Res } from '@nestjs/common';
import { AuthRoleGuard } from 'domains/auth/guards/auth-role.guard';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { Roles } from '../auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from '../auth/guards/auth-jwt-at.guard';
import { StoreCreateREQ } from './request/store-create.request';
import { GetStoresByAdminREQ } from './request/store-get-all-admin.request';
import { StoreGetHaveMostProductREQ } from './request/store-get-have-most-product.request';
import { StoreUpdateREQ } from './request/store-update.request';
import { StoreService } from './store.service';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { Response } from 'express';
import { parseExcelResponse } from 'shared/helpers/excel.helper';
import * as dayjs from 'dayjs';

@Controller()
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Roles(ROLE_NAME.MANAGER)
  @Get('stores/excel/banned')
  async downloadExcelStoresBanned(@Res() response: Response) {
    const book = await this.storeService.downloadExcelStoresBanned();
    await parseExcelResponse(response, book, `DTEX_Stores_Banned_${dayjs().format('YYYY-MM-DD_HH:mm:ss')}`);
  }

  @Roles(ROLE_NAME.MANAGER)
  @Get('stores/excel/being-reported')
  async downloadExcelStoresBeingReported(@Res() response: Response) {
    const book = await this.storeService.downloadExcelStoresBeingReported();
    await parseExcelResponse(response, book, `DTEX_Stores_Being_Warned_${dayjs().format('YYYY-MM-DD_HH:mm:ss')}`);
  }

  @Roles(ROLE_NAME.MANAGER)
  @Get('stores/excel')
  async downloadExcelStores(@Res() response: Response) {
    const book = await this.storeService.downloadExcelStores();
    await parseExcelResponse(response, book, `DTEX_Stores_${dayjs().format('YYYY-MM-DD_HH:mm:ss')}`);
  }

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

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('store/banned')
  getStoreBanned(@Query() query: PaginationREQ) {
    return this.storeService.getStoresBanned(query);
  }

  @Get('stores/select')
  getStoresSelect() {
    return this.storeService.getStoresSelect();
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

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Patch('store/un-ban/:id')
  unBanStore(@Param('id') id: string) {
    return this.storeService.unBanStore(id);
  }

  /**
   * This is part of scraping data
   */
  @Post('store/scraping')
  scrapingData() {
    return this.storeService.scrapingData();
  }
}
