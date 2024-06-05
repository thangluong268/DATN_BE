import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from 'domains/auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from 'domains/auth/guards/auth-jwt-at.guard';
import { AuthRoleGuard } from 'domains/auth/guards/auth-role.guard';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { PolicyService } from './policy.service';
import { PolicyCreateREQ } from './request/policy-create.request';
import { PolicyFindAllByObjectREQ } from './request/policy-find-all-by-object.request';
import { PolicyUpdateREQ } from './request/policy-update.request';

@Controller('policies')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Get()
  findAllByObject(@Query() query: PolicyFindAllByObjectREQ) {
    return this.policyService.findAllByObject(query);
  }

  @Roles(ROLE_NAME.ADMIN)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Post()
  create(@Body() body: PolicyCreateREQ) {
    return this.policyService.create(body);
  }

  @Roles(ROLE_NAME.ADMIN)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: PolicyUpdateREQ) {
    return this.policyService.update(id, body);
  }

  @Roles(ROLE_NAME.ADMIN)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.policyService.delete(id);
  }
}
