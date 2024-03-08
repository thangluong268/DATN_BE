import { Body, Controller, Get, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthRoleGuard } from 'domains/auth/guards/auth-role.guard';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { Roles } from '../auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from '../auth/guards/auth-jwt-at.guard';
import { StoreCreateREQ } from './request/store-create.request';
import { GetStoresByAdminREQ } from './request/store-get-all-admin.request';
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
    const userId = req.user._id;
    return this.storeService.update(userId, body);
  }
}
