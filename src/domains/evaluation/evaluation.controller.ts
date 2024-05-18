import { Body, Controller, Get, Put, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from 'domains/auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from 'domains/auth/guards/auth-jwt-at.guard';
import { AuthRoleGuard } from 'domains/auth/guards/auth-role.guard';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { EvaluationService } from './evaluation.service';
import { EvaluationEmojiREQ } from './request/evaluation-emoji.request';

@Controller('evaluation')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Put('user')
  expressedEmoji(@Req() req, @Query('productId') productId: string, @Body() body: EvaluationEmojiREQ) {
    return this.evaluationService.expressedEmoji(req.user._id.toString(), productId, body.name);
  }

  @Get()
  getByProductId(@Req() req, @Query('productId') productId: string) {
    return this.evaluationService.getByProductId(req.user, productId);
  }
}
