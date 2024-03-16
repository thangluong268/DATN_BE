import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from 'domains/auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from 'domains/auth/guards/auth-jwt-at.guard';
import { AuthRoleGuard } from 'domains/auth/guards/auth-role.guard';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { PromotionService } from './promotion.service';
import { PromotionCreateREQ } from './request/promotion-create.request';
import { PromotionGetByStore } from './request/promotion-get-by-store.request';
import { PromotionUpdateREQ } from './request/promotion-update.request';

@Controller('promotions')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get()
  getMyPromotionsByStore(@Req() req, @Query() query: PromotionGetByStore) {
    return this.promotionService.getMyPromotions(req.user._id, query);
  }

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get(':promotionId/detail')
  getPromotion(@Req() req, @Param('promotionId') promotionId: string) {
    return this.promotionService.getPromotion(req.user._id, promotionId);
  }

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get(':storeId')
  getPromotionsByStoreId(@Param('storeId') storeId: string) {
    return this.promotionService.getPromotionsByStoreId(storeId);
  }

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Post()
  create(@Req() req, @Body() body: PromotionCreateREQ) {
    return this.promotionService.create(req.user._id, body);
  }

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Put(':promotionId')
  update(@Req() req, @Param('promotionId') promotionId: string, @Body() body: PromotionUpdateREQ) {
    return this.promotionService.create(req.user._id, body);
  }
}
