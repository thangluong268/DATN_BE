import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from 'domains/auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from 'domains/auth/guards/auth-jwt-at.guard';
import { AuthRoleGuard } from 'domains/auth/guards/auth-role.guard';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { ShipperActiveREQ } from './request/shipper-active.request';
import { ShipperCreateREQ } from './request/shipper-create.request';
import { ShipperInActiveGetREQ } from './request/shipper-inactive-get.request';
import { ShipperService } from './shipper.service';

@Controller('shippers')
export class ShipperController {
  constructor(private readonly shipperService: ShipperService) {}

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('in-active')
  getShippersInActive(@Query() query: ShipperInActiveGetREQ) {
    return this.shipperService.getShippersInActive(query);
  }

  @Post()
  create(@Body() body: ShipperCreateREQ) {
    return this.shipperService.create(body);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Post(':id/active')
  activeAccount(@Param('id') id: string, @Body() body: ShipperActiveREQ) {
    return this.shipperService.activeAccount(id, body);
  }
}
