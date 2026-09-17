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
import { SubjectAssignmentService } from './subject-assignment.service';
import {
  AutoAssignStudentsDto,
  CreateSubjectAssignmentDto,
  EnrollStudentInAssignmentDto,
  UpdateSubjectAssignmentDto,
  AssignmentQueryDto,
} from './dto/subject-assignment.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { PERMISSIONS } from '@common/permissions';

@ApiTags('Subject Assignments')
@Controller('subject-assignments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class SubjectAssignmentController {
  constructor(private readonly assignmentService: SubjectAssignmentService) {}

  @Post()
  @RequirePermission(PERMISSIONS.ASSIGNMENTS_CREATE)
  create(@Body() dto: CreateSubjectAssignmentDto) {
    return this.assignmentService.create(dto);
  }

  @Post('auto-assign')
  @RequirePermission(PERMISSIONS.ASSIGNMENTS_CREATE)
  autoAssign(@Body() dto: AutoAssignStudentsDto) {
    return this.assignmentService.autoAssignStudents(dto);
  }

  @Get('teacher/:employeeId')
  @RequirePermission(
    PERMISSIONS.ASSIGNMENTS_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.GRADES_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  )
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.assignmentService.findByEmployee(employeeId);
  }

  @Get()
  @RequirePermission(
    PERMISSIONS.ASSIGNMENTS_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.GRADES_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  )
  findAll(@Query() query: AssignmentQueryDto) {
    return this.assignmentService.findAll(query);
  }

  @Get(':id')
  @RequirePermission(
    PERMISSIONS.ASSIGNMENTS_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.GRADES_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  )
  findOne(@Param('id') id: string) {
    return this.assignmentService.findOne(id);
  }

  @Get(':id/students')
  @RequirePermission(
    PERMISSIONS.ASSIGNMENTS_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.GRADES_VIEW,
  )
  getStudents(@Param('id') id: string) {
    return this.assignmentService.getStudents(id);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.ASSIGNMENTS_UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateSubjectAssignmentDto) {
    return this.assignmentService.update(id, dto);
  }

  @Post(':id/enroll-student')
  @RequirePermission(PERMISSIONS.ASSIGNMENTS_UPDATE)
  enrollStudent(
    @Param('id') id: string,
    @Body() dto: EnrollStudentInAssignmentDto,
  ) {
    return this.assignmentService.enrollStudent(id, dto);
  }

  @Delete(':id/students/:studentId')
  @RequirePermission(PERMISSIONS.ASSIGNMENTS_UPDATE)
  removeStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.assignmentService.removeStudent(id, studentId);
  }
}