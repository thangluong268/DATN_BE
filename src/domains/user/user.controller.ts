import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { Roles } from '../auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from '../auth/guards/auth-jwt-at.guard';
import { UserCreateREQ } from './request/user-create.request';
import { UserUpdateREQ } from './request/user-update.request';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard)
  @Get('user/:id')
  getUserById(@Param('id') id: string) {
    return this.userService.getDetail(id);
  }

  @Roles(ROLE_NAME.ADMIN)
  @Post('user')
  @UseGuards(AuthJwtATGuard)
  createUser(@Body() body: UserCreateREQ) {
    return this.userService.createUserWithoutRole(body);
  }

  @Roles(ROLE_NAME.USER, ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard)
  @Patch('user/:id')
  updateUserById(@Param('id') id: string, @Body() body: UserUpdateREQ, @Req() req) {
    const user = req.user;
    return this.userService.updateById(id, body, user);
  }
}
