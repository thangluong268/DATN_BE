import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from 'domains/auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from 'domains/auth/guards/auth-jwt-at.guard';
import { AuthRoleGuard } from 'domains/auth/guards/auth-role.guard';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { ProposeService } from './propose.service';
import { ProposeBillCreateREQ } from './request/propose-bill-create.request';
import { ProposeCreateREQ } from './request/propose-create.request';
import { ProposeGetProductREQ } from './request/propose-get-product.request';

@Controller('proposes')
export class ProposeController {
  constructor(private readonly proposeService: ProposeService) {}

  @Get()
  getProposes() {
    return this.proposeService.getProposes();
  }

  @Get('stores')
  getStoreProposes() {
    return this.proposeService.getStoreProposes();
  }

  @Get('products')
  getProductsPropose(@Query() query: ProposeGetProductREQ) {
    return this.proposeService.getProductsPropose(query);
  }

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('my-propose')
  getMyPropose(@Req() req) {
    return this.proposeService.getMyPropose(req.user);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Post()
  create(@Body() body: ProposeCreateREQ) {
    return this.proposeService.create(body);
  }

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Post(':id/purchase')
  purchase(@Req() req, @Param('id') id: string, @Body() body: ProposeBillCreateREQ) {
    return this.proposeService.purchase(req.user, id, body);
  }
}
