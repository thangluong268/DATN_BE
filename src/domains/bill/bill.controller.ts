import { Body, Controller, Get, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Roles } from 'domains/auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from 'domains/auth/guards/auth-jwt-at.guard';
import { AuthRoleGuard } from 'domains/auth/guards/auth-role.guard';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { BillService } from './bill.service';
import { BillCreateREQ } from './request/bill-create.request';
import { BillGetAllByStatusSellerREQ } from './request/bill-get-all-by-status-seller.request';
import { BillGetAllByStatusUserREQ } from './request/bill-get-all-by-status-user.request';
import { BillGetCalculateRevenueByYearREQ } from './request/bill-get-calculate-revenue-by-year.request';
import { BillGetCalculateTotalByYearREQ } from './request/bill-get-calculate-total-revenue-by-year.request';
import { BillGetCountCharityByYearREQ } from './request/bill-get-count-charity-by-year.request';
import { BillGetRevenueStoreREQ } from './request/bill-get-revenue-store.request';
import { BillGetTotalByStatusSellerREQ } from './request/bill-get-total-by-status-seller.request';

@Controller('bill')
export class BillController {
  constructor(private readonly billService: BillService) {}

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('seller/count-total-by-status')
  countTotalByStatusSeller(@Req() req, @Query() query: BillGetTotalByStatusSellerREQ) {
    return this.billService.countTotalByStatusSeller(req.user._id, Number(query.year));
  }

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('user/count-total-by-status')
  countTotalByStatusUser(@Req() req) {
    return this.billService.countTotalByStatusUser(req.user._id);
  }

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('seller/calculate-revenue-by-year')
  calculateRevenueByYear(@Req() req, @Query() query: BillGetCalculateRevenueByYearREQ) {
    return this.billService.calculateRevenueByYear(req.user._id, Number(query.year));
  }

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('seller/count-charity-by-year')
  countCharityByYear(@Req() req, @Query() query: BillGetCountCharityByYearREQ) {
    return this.billService.countCharityByYear(req.user._id, Number(query.year));
  }

  @Roles(ROLE_NAME.ADMIN)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('admin/calculate-total-revenue-by-year')
  calculateTotalRevenueByYear(@Query() query: BillGetCalculateTotalByYearREQ) {
    return this.billService.calculateTotalRevenueByYear(Number(query.year));
  }

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('user')
  getAllByStatusUser(@Req() req, @Query() query: BillGetAllByStatusUserREQ) {
    return this.billService.getAllByStatusUser(req.user._id, query);
  }

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('seller')
  getAllByStatusSeller(@Req() req, @Query() query: BillGetAllByStatusSellerREQ) {
    return this.billService.getAllByStatusSeller(req.user._id, query);
  }

  @Roles(ROLE_NAME.ADMIN)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('admin/count-total-data')
  countTotalData() {
    return this.billService.countTotalData();
  }

  @Roles(ROLE_NAME.ADMIN, ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('admin/revenue-store')
  revenueStore(@Query() query: BillGetRevenueStoreREQ) {
    return this.billService.revenueStore(query.storeId);
  }

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('user/:id')
  getMyBill(@Req() req, @Param('id') id: string) {
    // return this.billService.getMyBill(req.user._id, id);
  }

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Post('user')
  create(@Req() req, @Body() body: BillCreateREQ) {
    return this.billService.create(req.user._id, body);
  }

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Put('user/:id')
  updateStatusBillUser(@Param('id') id: string, @Query('status') status: string) {
    // return this.billService.updateStatusBillUser(id, status);
  }

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Put('seller/:id')
  updateStatusSeller(@Param('id') id: string, @Query('status') status: string) {
    return this.billService.updateStatusBillSeller(id, status);
  }
}
