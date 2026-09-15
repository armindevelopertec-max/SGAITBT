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
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { PERMISSIONS } from '@common/permissions';

@ApiTags('Grades')
@Controller('grades')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

  @Post()
  @RequirePermission(PERMISSIONS.GRADES_CREATE, PERMISSIONS.GRADES_UPDATE, PERMISSIONS.GRADES_VERIFY)
  create(@Body() dto: CreateGradeDto) {
    return this.gradeService.create(dto);
  }

  @Post('bulk')
  @RequirePermission(PERMISSIONS.GRADES_CREATE, PERMISSIONS.GRADES_UPDATE, PERMISSIONS.GRADES_VERIFY)
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
  @RequirePermission(PERMISSIONS.GRADES_CREATE, PERMISSIONS.GRADES_UPDATE, PERMISSIONS.GRADES_VERIFY)
  update(@Param('id') id: string, @Body() dto: UpdateGradeDto) {
    return this.gradeService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.GRADES_DELETE)
  remove(@Param('id') id: string) {
    return this.gradeService.delete(id);
  }
}