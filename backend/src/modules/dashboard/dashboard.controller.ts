import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums';
import { User } from '@modules/user/entities/user.entity';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @Roles(UserRole.ADMIN)
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('teacher')
  @Roles(UserRole.TEACHER)
  getTeacherDashboard(@CurrentUser() user: User) {
    return this.dashboardService.getTeacherDashboard(user.id);
  }

  @Get('student')
  @Roles(UserRole.STUDENT)
  getStudentDashboard(@CurrentUser() user: User) {
    if (!user.studentId) {
      throw new Error('El usuario no tiene estudiante asociado');
    }
    return this.dashboardService.getStudentDashboard(user.studentId);
  }
}