import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { Roles } from 'domains/auth/decorators/auth-role.decorator';
import { AuthJwtATGuard } from 'domains/auth/guards/auth-jwt-at.guard';
import { AuthRoleGuard } from 'domains/auth/guards/auth-role.guard';
import { Response } from 'express';
import { ROLE_NAME } from 'shared/enums/role-name.enum';
import { parseExcelResponse } from 'shared/helpers/excel.helper';
import { ReportService } from './report.service';
import { ReportCreateREQ } from './request/report-create.request';
import { ReportGetREQ } from './request/report-get.request';

@Controller()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Roles(ROLE_NAME.MANAGER)
  @Get('reports/excel')
  async downloadExcelReportsApproval(@Res() response: Response) {
    const book = await this.reportService.downloadExcelReportsApproval();
    await parseExcelResponse(response, book, `DTEX_Reports_Approval_${dayjs().format('YYYY-MM-DD_HH:mm:ss')}`);
  }

  @Roles(ROLE_NAME.MANAGER, ROLE_NAME.USER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('reports')
  getReportsByUserId(@Req() req, @Query('userId') userId: string) {
    return this.reportService.getReportsByUserId(req.user, userId);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('report/admin')
  getReports(@Query() query: ReportGetREQ) {
    return this.reportService.getReports(query);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Get('report/admin/:id')
  getReportById(@Param('id') id: string) {
    return this.reportService.getReportById(id);
  }

  @Roles(ROLE_NAME.USER, ROLE_NAME.SELLER, ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Post('report/user')
  create(@Req() req, @Body() body: ReportCreateREQ) {
    return this.reportService.create(req.user._id, body);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Patch('report/admin/:id')
  approval(@Param('id') id: string) {
    return this.reportService.approval(id);
  }

  @Roles(ROLE_NAME.MANAGER)
  @UseGuards(AuthJwtATGuard, AuthRoleGuard)
  @Delete('report/admin/:id')
  delete(@Param('id') id: string) {
    return this.reportService.delete(id);
  }
}
