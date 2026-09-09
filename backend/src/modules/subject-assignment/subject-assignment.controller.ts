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
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums';

@ApiTags('Subject Assignments')
@Controller('subject-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SubjectAssignmentController {
  constructor(private readonly assignmentService: SubjectAssignmentService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  create(@Body() dto: CreateSubjectAssignmentDto) {
    return this.assignmentService.create(dto);
  }

  @Post('auto-assign')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  autoAssign(@Body() dto: AutoAssignStudentsDto) {
    return this.assignmentService.autoAssignStudents(dto);
  }

  @Get('teacher/:teacherId')
  findByTeacher(@Param('teacherId') teacherId: string) {
    return this.assignmentService.findByTeacher(teacherId);
  }

  @Get()
  findAll(@Query() query: AssignmentQueryDto) {
    return this.assignmentService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assignmentService.findOne(id);
  }

  @Get(':id/students')
  getStudents(@Param('id') id: string) {
    return this.assignmentService.getStudents(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  update(@Param('id') id: string, @Body() dto: UpdateSubjectAssignmentDto) {
    return this.assignmentService.update(id, dto);
  }

  @Post(':id/enroll-student')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  enrollStudent(
    @Param('id') id: string,
    @Body() dto: EnrollStudentInAssignmentDto,
  ) {
    return this.assignmentService.enrollStudent(id, dto);
  }

  @Delete(':id/students/:studentId')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  removeStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.assignmentService.removeStudent(id, studentId);
  }
}