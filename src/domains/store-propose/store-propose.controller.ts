import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from 'domains/auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from 'domains/auth/guards/auth-jwt-at.guard';
import { AuthRoleGuard } from 'domains/auth/guards/auth-role.guard';
import { ProposeGetProductREQ } from 'domains/propose/request/propose-get-product.request';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { StoreProposeService } from './store-propose.service';

@Controller('store-proposes')
export class StoreProposeController {
  constructor(private readonly storeProposeService: StoreProposeService) {}

  @Get('stores')
  getStoreProposes() {
    return this.storeProposeService.getStoreProposes();
  }

  @Get('products')
  getProductsPropose(@Query() query: ProposeGetProductREQ) {
    return this.storeProposeService.getProductsPropose(query);
  }

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('my-propose')
  getMyPropose(@Req() req) {
    return this.storeProposeService.getMyPropose(req.user);
  }
}
