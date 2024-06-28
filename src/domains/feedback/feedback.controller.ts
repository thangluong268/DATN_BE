import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from 'domains/auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from 'domains/auth/guards/auth-jwt-at.guard';
import { AuthRoleGuard } from 'domains/auth/guards/auth-role.guard';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { FeedbackService } from './feedback.service';
import { FeedbackCreateREQ } from './request/feedback-create.request';
import { FeedbackGetREQ } from './request/feedback-get-request';

@Controller()
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get('feedback')
  getFeedbacks(@Req() req, @Query() query: FeedbackGetREQ) {
    return this.feedbackService.getFeedbacks(req.user, query);
  }

  @Get('feedback-count-total')
  countFeedbackByProduct(@Query('productId') productId: string) {
    return this.feedbackService.countFeedbackByProduct(productId);
  }

  @Get('feedback-star')
  getFeedbackStar(@Query('productId') productId: string) {
    return this.feedbackService.getFeedbackStar(productId);
  }

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Post('feedback/user')
  create(@Req() req, @Query('productId') productId: string, @Body() body: FeedbackCreateREQ) {
    return this.feedbackService.create(req.user._id, productId, body);
  }

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Patch('feedback/:id/consensus')
  updateConsensus(@Req() req, @Param('id') id: string) {
    return this.feedbackService.updateConsensus(req.user._id.toString(), id);
  }
}
