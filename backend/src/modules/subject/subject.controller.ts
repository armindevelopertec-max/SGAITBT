import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SubjectService } from './subject.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { PERMISSIONS } from '@common/permissions';

@ApiTags('Subjects')
@Controller('subjects')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  @RequirePermission(PERMISSIONS.SUBJECTS_CREATE)
  create(@Body() dto: CreateSubjectDto) {
    return this.subjectService.create(dto);
  }

  @Get()
  findAll() {
    return this.subjectService.findAll();
  }

  @Get('career/:careerId')
  findByCareer(@Param('careerId') careerId: string) {
    return this.subjectService.findByCareer(careerId);
  }

  @Get('career/:careerId/semester/:semester')
  findBySemester(@Param('careerId') careerId: string, @Param('semester') semester: number) {
    return this.subjectService.findBySemester(careerId, semester);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subjectService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.SUBJECTS_UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.subjectService.update(id, dto);
  }

  @Patch(':id/toggle-state')
  @RequirePermission(PERMISSIONS.SUBJECTS_UPDATE)
  toggleState(@Param('id') id: string) {
    return this.subjectService.toggleState(id);
  }
}