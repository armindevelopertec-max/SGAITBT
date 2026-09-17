import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AcademicHistoryService } from './academic-history.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { PERMISSIONS } from '@common/permissions';

@ApiTags('Academic History')
@Controller('academic-history')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AcademicHistoryController {
  constructor(private readonly historyService: AcademicHistoryService) {}

  @Get('student/:studentId')
  @RequirePermission(PERMISSIONS.HISTORY_VIEW, PERMISSIONS.REPORTS_VIEW)
  findForStudent(@Param('studentId') studentId: string) {
    return this.historyService.findForStudent(studentId);
  }

  @Get('student/:studentId/summary')
  @RequirePermission(PERMISSIONS.HISTORY_VIEW, PERMISSIONS.REPORTS_VIEW)
  studentSummary(@Param('studentId') studentId: string) {
    return this.historyService.getStudentSummary(studentId);
  }

  @Get('career/:careerId')
  @RequirePermission(PERMISSIONS.HISTORY_VIEW, PERMISSIONS.REPORTS_VIEW)
  findForCareer(@Param('careerId') careerId: string) {
    return this.historyService.findForCareer(careerId);
  }

  @Get('period/:academicPeriodId')
  @RequirePermission(PERMISSIONS.HISTORY_VIEW, PERMISSIONS.REPORTS_VIEW)
  findForPeriod(@Param('academicPeriodId') academicPeriodId: string) {
    return this.historyService.findForPeriod(academicPeriodId);
  }

  @Get('stats/overall')
  @RequirePermission(PERMISSIONS.HISTORY_VIEW, PERMISSIONS.DASHBOARD_VIEW)
  overallStats() {
    return this.historyService.getOverallStats();
  }
}