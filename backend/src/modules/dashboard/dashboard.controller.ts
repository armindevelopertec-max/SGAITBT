import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { PERMISSIONS } from '@common/permissions';
import { User } from '@modules/user/entities/user.entity';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @RequirePermission(PERMISSIONS.DASHBOARD_VIEW)
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('teacher')
  @RequirePermission(PERMISSIONS.DASHBOARD_VIEW)
  getTeacherDashboard(@CurrentUser() user: User) {
    return this.dashboardService.getTeacherDashboard(user.id);
  }

  @Get('student')
  @RequirePermission(PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.HISTORY_VIEW)
  getStudentDashboard(@CurrentUser() user: User) {
    if (!user.studentId) {
      throw new Error('El usuario no tiene estudiante asociado');
    }
    return this.dashboardService.getStudentDashboard(user.studentId);
  }
}