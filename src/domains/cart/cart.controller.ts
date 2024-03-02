import { Controller, Delete, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from 'domains/auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from 'domains/auth/guards/auth-jwt-at.guard';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { CartService } from './cart.service';
import { CartGetPagingByUserREQ } from './request/cart-get-paging-by-user.request';

@Controller('cart/user')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard)
  @Get()
  getPagingByUserId(@Req() req, @Query() query: CartGetPagingByUserREQ) {
    const userId = req.user._id;
    return this.cartService.getPagingByUserId(userId, query);
  }

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard)
  @Get('get-all')
  getWithoutPagingByUserId(@Req() req) {
    const userId = req.user._id;
    return this.cartService.getWithoutPagingByUserId(userId);
  }

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard)
  @Get('get-new')
  getNewCartByUserId(@Req() req) {
    const userId = req.user._id;
    return this.cartService.getNewCartByUserId(userId);
  }

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard)
  @Post()
  handleAddProductIntoCart(@Req() req, @Query('productId') productId: string) {
    const userId = req.user._id;
    return this.cartService.handleAddProductIntoCart(userId, productId);
  }

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard)
  @Delete()
  removeProductFromCart(@Req() req, @Query('productId') productId: string) {
    const userId = req.user._id;
    return this.cartService.removeProductFromCart(userId, productId);
  }
}
