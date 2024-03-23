import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from 'domains/auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from 'domains/auth/guards/auth-jwt-at.guard';
import { AuthRoleGuard } from 'domains/auth/guards/auth-role.guard';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { PromotionService } from './promotion.service';
import { PromotionCreateREQ } from './request/promotion-create.request';
import { PromotionGetByManagerFilterREQ } from './request/promotion-get-by-manager-filter.request';
import { PromotionGetByStore } from './request/promotion-get-by-store.request';
import { PromotionGetUserUsesREQ } from './request/promotion-get-user-use.request';
import { PromotionUpdateREQ } from './request/promotion-update.request';

@Controller('promotions')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Roles(ROLE_NAME.SELLER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('seller')
  getMyPromotionsByStore(@Req() req, @Query() query: PromotionGetByStore) {
    return this.promotionService.getMyPromotions(req.user._id, query);
  }

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Post('user')
  getPromotionsByUser(@Req() req, @Body() body: string[]) {
    return this.promotionService.getPromotionsByUser(req.user._id, body);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('manager')
  getPromotionsByManager(@Query() query: PaginationREQ, @Query() filter?: PromotionGetByManagerFilterREQ) {
    return this.promotionService.getPromotionsByManager(query, filter);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get(':promotionId/detail')
  getPromotion(@Param('promotionId') promotionId: string) {
    return this.promotionService.getPromotion(promotionId);
  }

  @Roles(ROLE_NAME.SELLER, ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get(':promotionId/user-uses')
  getUserUsesPromotion(@Req() req, @Param('promotionId') promotionId: string, @Query() query: PromotionGetUserUsesREQ) {
    return this.promotionService.getUserUsesPromotion(req.user._id, req.user.role, promotionId, query);
  }

  @Get(':storeId')
  getPromotionsByStoreId(@Req() req, @Param('storeId') storeId: string) {
    return this.promotionService.getPromotionsByStoreId(req.user, storeId);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Post()
  create(@Req() req, @Body() body: PromotionCreateREQ) {
    return this.promotionService.create(req.user._id, body);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Patch(':promotionId')
  update(@Param('promotionId') promotionId: string, @Body() body: PromotionUpdateREQ) {
    return this.promotionService.update(promotionId, body);
  }

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Patch(':promotionId/voucher')
  handleSaveVoucher(@Req() req, @Param('promotionId') promotionId: string) {
    return this.promotionService.handleSaveVoucher(req.user._id, promotionId);
  }
}
