import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthRoleGuard } from 'domains/auth/guards/auth-role.guard';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { PaginationREQ } from 'shared/generics/pagination.request';
import { Roles } from '../auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from '../auth/guards/auth-jwt-at.guard';
import { UserCreateREQ } from './request/user-create.request';
import { UserGetFollowStoreREQ } from './request/user-get-follow-store.request';
import { UserGetPagingREQ } from './request/user-get-paging.resquest';
import { UsersHaveStoreREQ } from './request/user-have-store.request';
import { UserUpdateREQ } from './request/user-update.request';
import { UserService } from './user.service';
import { UserBannedGetREQ } from './request/user-banned-get.request';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('banned')
  getUsersBanned(@Query() query: UserBannedGetREQ) {
    return this.userService.getUsersBanned(query);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('admin/users-most-bills')
  getUsersHaveMostBill(@Query('limit') limit: number) {
    return this.userService.getUsersHaveMostBill(limit);
  }

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('user-follow-stores')
  getUsersFollowStore(@Req() req, @Query() query: UserGetFollowStoreREQ) {
    return this.userService.getUsersFollowStore(req.user._id, query);
  }

  @Roles(ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('admin/get-all')
  getUsersNoPaging(@Query('limit') limit: number) {
    return this.userService.getUsersNoPaging(limit);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('admin')
  getUsersPaging(@Query() query: UserGetPagingREQ) {
    return this.userService.getUsersPaging(query);
  }

  @Roles(ROLE_NAME.USER, ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('user/:id')
  getProfile(@Param('id') id: string) {
    return this.userService.getDetail(id);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('has-store')
  getUsersHasStore(@Query() query: UsersHaveStoreREQ) {
    return this.userService.getUsersHasStore(query);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('has-been-warning')
  getUsersHasBeenWarning(@Query() query: PaginationREQ) {
    return this.userService.getUsersHasBeenWarning(query);
  }

  @Roles(ROLE_NAME.ADMIN)
  @Post('user')
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  createUser(@Body() body: UserCreateREQ) {
    return this.userService.createUserWithoutRole(body);
  }

  @Roles(ROLE_NAME.USER, ROLE_NAME.MANAGER)
  @Put('user-follow-store')
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  followStore(@Req() req, @Query('storeId') storeId: string) {
    return this.userService.followStore(req.user._id, storeId);
  }

  @Roles(ROLE_NAME.USER, ROLE_NAME.MANAGER)
  @Put('user-add-friend')
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  addFriend(@Req() req, @Query('userIdReceive') userIdReceive: string) {
    return this.userService.addFriend(req.user._id, userIdReceive);
  }

  @Roles(ROLE_NAME.USER, ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Patch('user/:id')
  updateUserById(@Param('id') id: string, @Body() body: UserUpdateREQ, @Req() req) {
    const user = req.user;
    return this.userService.updateById(id, body, user);
  }

  /**
   * This is part of scraping data
   */
  @Post('scraping')
  seedData() {
    return this.userService.seedData();
  }

  @Patch('avatar')
  updateAvatar() {
    return this.userService.updateAvatar();
  }
}
