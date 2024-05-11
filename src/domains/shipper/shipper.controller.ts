import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ShipperCreateREQ } from './request/shipper-create.request';
import { ShipperService } from './shipper.service';
import { Roles } from 'domains/auth/decorators/auth-role.decorator';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { AuthJwtATGuard } from 'domains/auth/guards/auth-jwt-at.guard';
import { AuthRoleGuard } from 'domains/auth/guards/auth-role.guard';
import { ShipperInActiveGetREQ } from './request/shipper-inactive-get.request';

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
}
