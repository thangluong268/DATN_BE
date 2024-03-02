import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from 'domains/auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from 'domains/auth/guards/auth-jwt-at.guard';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { BillService } from './bill.service';
import { BillCreateREQ } from './request/bill-create.request';
import { BillGetTotalByStatusSellerREQ } from './request/bill-get-total-by-status-seller.request';

@Controller('bill')
export class BillController {
  constructor(private readonly billService: BillService) {}

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard)
  @Get('seller/count-total-by-status')
  countTotalByStatusSeller(@Req() req, @Query() query: BillGetTotalByStatusSellerREQ) {
    return this.billService.countTotalByStatusSeller(req.user._id, Number(query.year));
  }

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard)
  @Post('user')
  create(@Req() req, @Body() body: BillCreateREQ) {
    return this.billService.create(req.user._id, body);
  }
}
