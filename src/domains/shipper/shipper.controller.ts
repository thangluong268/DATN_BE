import { Body, Controller, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { Roles } from 'domains/auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from 'domains/auth/guards/auth-jwt-at.guard';
import { AuthRoleGuard } from 'domains/auth/guards/auth-role.guard';
import { Response } from 'express';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { parseExcelResponse } from 'shared/helpers/excel.helper';
import { ShipperActiveREQ } from './request/shipper-active.request';
import { ShipperBehaviorBillREQ } from './request/shipper-behavior-bill.request';
import { BillByStatusShipperGetREQ } from './request/shipper-bill-by-status.request';
import { ShipperChangePasswordREQ } from './request/shipper-change-password.request';
import { ShipperCreateREQ } from './request/shipper-create.request';
import { ShipperGetREQ } from './request/shipper-get.request';
import { ShipperUpdateREQ } from './request/shipper-update.request';
import { ShipperService } from './shipper.service';

@Controller('shippers')
export class ShipperController {
  constructor(private readonly shipperService: ShipperService) {}

  @Get('test')
  async gest() {
    return this.shipperService.selectShipperToDelivery();
  }

  @Roles(ROLE_NAME.MANAGER)
  @Get('excel')
  async downloadExcelShipper(@Res() response: Response) {
    const book = await this.shipperService.downloadExcelShipper();
    await parseExcelResponse(response, book, `DTEX_Shippers_${dayjs().format('YYYY-MM-DD_HH:mm:ss')}`);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get()
  getShippers(@Query() query: ShipperGetREQ) {
    return this.shipperService.getShippers(query);
  }

  @Roles(ROLE_NAME.SHIPPER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('bills')
  getBillsByStatus(@Req() req, @Query() query: BillByStatusShipperGetREQ) {
    return this.shipperService.getBillsByStatus(req.user._id.toString(), query);
  }

  @Roles(ROLE_NAME.SHIPPER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('profile')
  getMyProfile(@Req() req) {
    return this.shipperService.getMyProfile(req.user._id);
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

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Patch('bills/:billId')
  findShippersToDelivery(@Param('billId') billId: string) {
    return this.shipperService.findShippersToDelivery(billId);
  }

  @Roles(ROLE_NAME.SHIPPER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Patch('bills/:billId/behavior')
  behaviorBill(@Req() req, @Param('billId') billId: string, @Body() body: ShipperBehaviorBillREQ) {
    return this.shipperService.behaviorBill(req.user._id.toString(), billId, body);
  }

  @Roles(ROLE_NAME.SHIPPER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Patch()
  updateProfile(@Req() req, @Body() body: ShipperUpdateREQ) {
    return this.shipperService.updateProfile(req.user._id.toString(), body);
  }

  @Roles(ROLE_NAME.SHIPPER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Patch('change-password')
  changePassword(@Req() req, @Body() body: ShipperChangePasswordREQ) {
    return this.shipperService.changePassword(req.user._id.toString(), body);
  }
}
