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
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums';

@ApiTags('Attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SECRETARY, UserRole.TEACHER)
  create(@Body() dto: CreateAttendanceDto) {
    return this.attendanceService.create(dto);
  }

  @Get()
  findAll(@Query() query: AttendanceQueryDto) {
    return this.attendanceService.findAll(query);
  }

  @Get('assignment/:assignmentId')
  findByAssignment(@Param('assignmentId') assignmentId: string) {
    return this.attendanceService.findForAssignment(assignmentId);
  }

  @Get('summary/assignment/:assignmentId')
  getSummary(
    @Param('assignmentId') assignmentId: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.attendanceService.getSummary(assignmentId, studentId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY, UserRole.TEACHER)
  update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    return this.attendanceService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  remove(@Param('id') id: string) {
    return this.attendanceService.delete(id);
  }
}