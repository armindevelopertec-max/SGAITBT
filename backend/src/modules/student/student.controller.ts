import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StudentService } from './student.service';
import { CreateStudentDto, UpdateStudentDto, StudentQueryDto } from './dto/student.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole, AcademicStatus } from '@common/enums';
import { User } from '@modules/user/entities/user.entity';

@ApiTags('Students')
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  create(@Body() dto: CreateStudentDto) {
    return this.studentService.create(dto);
  }

  @Get()
  findAll(@Query() query: StudentQueryDto) {
    return this.studentService.findAll(query);
  }

  @Get('by-ci/:ci')
  findByCi(@Param('ci') ci: string) {
    return this.studentService.findByCi(ci);
  }

  @Get('by-code/:code')
  findByStudentCode(@Param('code') code: string) {
    return this.studentService.findByStudentCode(code);
  }

  @Get('by-status/counts')
  countByStatus() {
    return this.studentService.countByStatus();
  }

  @Get('by-career/counts')
  countByCareer() {
    return this.studentService.countByCareer();
  }

  @Get('me')
  @Roles(UserRole.STUDENT)
  findMe(@CurrentUser() user: User) {
    if (!user.studentId) {
      throw new Error('El usuario no tiene estudiante asociado');
    }
    return this.studentService.findOne(user.studentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  updateStatus(@Param('id') id: string, @Body('status') status: AcademicStatus) {
    return this.studentService.updateStatus(id, status);
  }

  @Patch(':id/current-period/:periodId')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  assignCurrentPeriod(@Param('id') id: string, @Param('periodId') periodId: string) {
    return this.studentService.assignCurrentPeriod(id, periodId);
  }
}