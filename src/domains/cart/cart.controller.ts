import { Controller, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from 'domains/auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from 'domains/auth/guards/auth-jwt-at.guard';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { CartService } from './cart.service';

@Controller('cart/user')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard)
  @Post()
  handleAddProductIntoCart(@Req() req, @Query('productId') productId: string) {
    const userId = req.user._id;
    return this.cartService.handleAddProductIntoCart(userId, productId);
  }
}
