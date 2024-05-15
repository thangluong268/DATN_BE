import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from 'domains/auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from 'domains/auth/guards/auth-jwt-at.guard';
import { AuthRoleGuard } from 'domains/auth/guards/auth-role.guard';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { FeedbackShipperService } from './feedback-shipper.service';
import { FeedbackShipperCreateREQ } from './request/feedback-shipper-create.request';

@Controller('feedback-shipper')
export class FeedbackShipperController {
  constructor(private readonly feedbackShipperService: FeedbackShipperService) {}

  @Roles(ROLE_NAME.USER, ROLE_NAME.SHIPPER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('detail')
  getDetail(@Query('billId') billId: string) {
    return this.feedbackShipperService.getDetail(billId);
  }

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Post()
  create(@Req() req, @Body() body: FeedbackShipperCreateREQ) {
    return this.feedbackShipperService.create(req.user._id.toString(), body);
  }
}
