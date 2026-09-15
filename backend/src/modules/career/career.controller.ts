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
import { CareerService } from './career.service';
import { CreateCareerDto, UpdateCareerDto, CareerQueryDto } from './dto/career.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { PERMISSIONS } from '@common/permissions';

@ApiTags('Careers')
@Controller('careers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class CareerController {
  constructor(private readonly careerService: CareerService) {}

  @Post()
  @RequirePermission(PERMISSIONS.CAREERS_CREATE)
  create(@Body() dto: CreateCareerDto) {
    return this.careerService.create(dto);
  }

  @Get()
  findAll(@Query() query: CareerQueryDto) {
    return this.careerService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.careerService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.CAREERS_UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateCareerDto) {
    return this.careerService.update(id, dto);
  }

  @Patch(':id/toggle-state')
  @RequirePermission(PERMISSIONS.CAREERS_UPDATE)
  toggleState(@Param('id') id: string) {
    return this.careerService.toggleState(id);
  }

  @Patch(':id/deactivate')
  @RequirePermission(PERMISSIONS.CAREERS_DELETE)
  deactivate(@Param('id') id: string) {
    return this.careerService.deactivate(id);
  }
}