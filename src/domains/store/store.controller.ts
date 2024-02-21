import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ROLE_NAME } from 'src/shared/enums/role-name.enum';
import { Roles } from '../auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from '../auth/guards/auth-jwt-at.guard';
import { StoreCreateREQ } from './request/store-create.request';
import { GetStoresByAdminREQ } from './request/store-get-all-admin.request';
import { StoreService } from './store.service';
import { StoreUpdateREQ } from './request/store-update.request';

@Controller()
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard)
  @Post('store/user')
  createStore(@Req() req, @Body() body: StoreCreateREQ) {
    const userId = req.user._id;
    return this.storeService.create(userId, body);
  }

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard)
  @Get('store/seller')
  getMyStore(@Req() req) {
    const userId = req.user._id;
    return this.storeService.getMyStore(userId);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard)
  @Get('store/admin')
  getStores(@Query() query: GetStoresByAdminREQ) {
    return this.storeService.getStores(query);
  }

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard)
  @Put('store/seller')
  updateStore(@Req() req, @Body() body: StoreUpdateREQ) {
    const userId = req.user._id;
    return this.storeService.update(userId, body);
  }
}
