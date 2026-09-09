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
import { GradeService } from './grade.service';
import {
  CreateBulkGradesDto,
  CreateGradeDto,
  GradeQueryDto,
  UpdateGradeDto,
} from './dto/grade.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums';

@ApiTags('Grades')
@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SECRETARY, UserRole.TEACHER)
  create(@Body() dto: CreateGradeDto) {
    return this.gradeService.create(dto);
  }

  @Post('bulk')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY, UserRole.TEACHER)
  createBulk(@Body() dto: CreateBulkGradesDto) {
    return this.gradeService.createBulk(dto);
  }

  @Get()
  findAll(@Query() query: GradeQueryDto) {
    return this.gradeService.findAll(query);
  }

  @Get('assignment/:assignmentId')
  findByAssignment(@Param('assignmentId') assignmentId: string) {
    return this.gradeService.findForAssignment(assignmentId);
  }

  @Get('student/:studentId')
  findByStudent(@Param('studentId') studentId: string) {
    return this.gradeService.findForStudent(studentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gradeService.findOne(id);
  }

  @Get('centralized/assignment/:assignmentId')
  centralized(@Param('assignmentId') assignmentId: string) {
    return this.gradeService.getCentralizedReport(assignmentId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY, UserRole.TEACHER)
  update(@Param('id') id: string, @Body() dto: UpdateGradeDto) {
    return this.gradeService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  remove(@Param('id') id: string) {
    return this.gradeService.delete(id);
  }
}