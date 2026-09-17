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
import { AcademicPeriodService } from './academic-period.service';
import {
  CreateAcademicPeriodDto,
  UpdateAcademicPeriodDto,
  AcademicPeriodQueryDto,
} from './dto/academic-period.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { PERMISSIONS } from '@common/permissions';

@ApiTags('Academic Periods')
@Controller('academic-periods')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AcademicPeriodController {
  constructor(private readonly periodService: AcademicPeriodService) {}

  @Post()
  @RequirePermission(PERMISSIONS.PERIODS_CREATE)
  create(@Body() dto: CreateAcademicPeriodDto) {
    return this.periodService.create(dto);
  }

  @Get()
  @RequirePermission(
    PERMISSIONS.PERIODS_VIEW,
    PERMISSIONS.ASSIGNMENTS_VIEW,
    PERMISSIONS.ENROLLMENTS_VIEW,
  )
  findAll(@Query() query: AcademicPeriodQueryDto) {
    return this.periodService.findAll(query);
  }

  @Get(':id')
  @RequirePermission(
    PERMISSIONS.PERIODS_VIEW,
    PERMISSIONS.ASSIGNMENTS_VIEW,
    PERMISSIONS.ENROLLMENTS_VIEW,
  )
  findOne(@Param('id') id: string) {
    return this.periodService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.PERIODS_UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateAcademicPeriodDto) {
    return this.periodService.update(id, dto);
  }

  @Patch(':id/close')
  @RequirePermission(PERMISSIONS.PERIODS_UPDATE)
  close(@Param('id') id: string) {
    return this.periodService.closePeriod(id);
  }

  @Patch(':id/open')
  @RequirePermission(PERMISSIONS.PERIODS_UPDATE)
  open(@Param('id') id: string) {
    return this.periodService.openPeriod(id);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.PERIODS_DELETE)
  remove(@Param('id') id: string) {
    return this.periodService.remove(id);
  }
}