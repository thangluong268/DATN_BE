import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from 'domains/auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from 'domains/auth/guards/auth-jwt-at.guard';
import { AuthRoleGuard } from 'domains/auth/guards/auth-role.guard';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { StoreWalletService } from './store-wallet.service';

@Controller('store-wallet')
export class StoreWalletController {
  constructor(private readonly storeWalletService: StoreWalletService) {}

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get()
  getWallet(@Req() req) {
    return this.storeWalletService.getWallet(req.user);
  }

  @Post()
  createWallet() {
    return this.storeWalletService.createWallet();
  }
}
