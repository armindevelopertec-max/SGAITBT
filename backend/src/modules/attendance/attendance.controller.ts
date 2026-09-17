import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import {
  AttendanceQueryDto,
  CreateAttendanceDto,
  UpdateAttendanceDto,
} from './dto/attendance.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { PERMISSIONS } from '@common/permissions';

@ApiTags('Attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @RequirePermission(PERMISSIONS.ATTENDANCE_CREATE)
  create(@Body() dto: CreateAttendanceDto) {
    return this.attendanceService.create(dto);
  }

  @Get()
  @RequirePermission(PERMISSIONS.ATTENDANCE_VIEW)
  findAll(@Query() query: AttendanceQueryDto) {
    return this.attendanceService.findAll(query);
  }

  @Get('assignment/:assignmentId')
  @RequirePermission(PERMISSIONS.ATTENDANCE_VIEW)
  findByAssignment(@Param('assignmentId') assignmentId: string) {
    return this.attendanceService.findForAssignment(assignmentId);
  }

  @Get('summary/assignment/:assignmentId')
  @RequirePermission(PERMISSIONS.ATTENDANCE_VIEW)
  getSummary(
    @Param('assignmentId') assignmentId: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.attendanceService.getSummary(assignmentId, studentId);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.ATTENDANCE_UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    return this.attendanceService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.ATTENDANCE_DELETE)
  remove(@Param('id') id: string) {
    return this.attendanceService.delete(id);
  }
}