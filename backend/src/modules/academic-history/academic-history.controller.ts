import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AcademicHistoryService } from './academic-history.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums';

@ApiTags('Academic History')
@Controller('academic-history')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AcademicHistoryController {
  constructor(private readonly historyService: AcademicHistoryService) {}

  @Get('student/:studentId')
  findForStudent(@Param('studentId') studentId: string) {
    return this.historyService.findForStudent(studentId);
  }

  @Get('student/:studentId/summary')
  studentSummary(@Param('studentId') studentId: string) {
    return this.historyService.getStudentSummary(studentId);
  }

  @Get('career/:careerId')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  findForCareer(@Param('careerId') careerId: string) {
    return this.historyService.findForCareer(careerId);
  }

  @Get('period/:academicPeriodId')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  findForPeriod(@Param('academicPeriodId') academicPeriodId: string) {
    return this.historyService.findForPeriod(academicPeriodId);
  }

  @Get('stats/overall')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  overallStats() {
    return this.historyService.getOverallStats();
  }
}