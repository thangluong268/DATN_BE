import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from 'domains/auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from 'domains/auth/guards/auth-jwt-at.guard';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { BillService } from './bill.service';
import { BillCreateREQ } from './request/bill-create.request';

@Controller('bill')
export class BillController {
  constructor(private readonly billService: BillService) {}

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard)
  @Post('user')
  create(@Req() req, @Body() body: BillCreateREQ) {
    const userId = req.user._id;
    return this.billService.create(userId, body);
  }
}
