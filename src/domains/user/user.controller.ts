import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ROLE_NAME } from 'src/shared/enums/role-name.enum';
import { Roles } from '../auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from '../auth/guards/auth-jwt-at.guard';
import { UserService } from './user.service';
import { UserUpdateREQ } from './request/user-update.request';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard)
  @Get('user/:id')
  getUserById(@Param('id') id: string) {
    return this.userService.getDetail(id);
  }

  @Roles(ROLE_NAME.USER, ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard)
  @Patch('user/:id')
  updateUserById(
    @Param('id') id: string,
    @Body() body: UserUpdateREQ,
    @Req() req,
  ) {
    const user = req.user;
    return this.userService.updateById(id, body, user);
  }
}
