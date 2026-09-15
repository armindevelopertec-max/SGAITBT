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
import { EnrollmentService } from './enrollment.service';
import {
  CreateEnrollmentDto,
  UpdateEnrollmentDto,
  EnrollmentQueryDto,
  EnrollStudentDto,
} from './dto/enrollment.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { PERMISSIONS } from '@common/permissions';

@ApiTags('Enrollments')
@Controller('enrollments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  @RequirePermission(PERMISSIONS.ENROLLMENTS_CREATE)
  create(@Body() dto: CreateEnrollmentDto) {
    return this.enrollmentService.create(dto);
  }

  @Post('enroll-student')
  @RequirePermission(PERMISSIONS.ENROLLMENTS_CREATE)
  enrollStudent(@Body() dto: EnrollStudentDto) {
    return this.enrollmentService.enrollStudent(dto);
  }

  @Get()
  findAll(@Query() query: EnrollmentQueryDto) {
    return this.enrollmentService.findAll(query);
  }

  @Get('counts/by-period')
  countByPeriod() {
    return this.enrollmentService.countByPeriod();
  }

  @Get('counts/total')
  countTotal() {
    return this.enrollmentService.countTotal();
  }

  @Get('by-number/:enrollmentNumber')
  findByNumber(@Param('enrollmentNumber') enrollmentNumber: string) {
    return this.enrollmentService.findByNumber(enrollmentNumber);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enrollmentService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.ENROLLMENTS_UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateEnrollmentDto) {
    return this.enrollmentService.update(id, dto);
  }

  @Patch(':id/cancel')
  @RequirePermission(PERMISSIONS.ENROLLMENTS_UPDATE)
  cancel(@Param('id') id: string) {
    return this.enrollmentService.cancel(id);
  }
}