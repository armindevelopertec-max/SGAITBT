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
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums';

@ApiTags('Academic Periods')
@Controller('academic-periods')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AcademicPeriodController {
  constructor(private readonly periodService: AcademicPeriodService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  create(@Body() dto: CreateAcademicPeriodDto) {
    return this.periodService.create(dto);
  }

  @Get()
  findAll(@Query() query: AcademicPeriodQueryDto) {
    return this.periodService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.periodService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  update(@Param('id') id: string, @Body() dto: UpdateAcademicPeriodDto) {
    return this.periodService.update(id, dto);
  }

  @Patch(':id/close')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  close(@Param('id') id: string) {
    return this.periodService.closePeriod(id);
  }

  @Patch(':id/open')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  open(@Param('id') id: string) {
    return this.periodService.openPeriod(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.periodService.remove(id);
  }
}