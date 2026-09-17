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
import { InstitutionService } from './institution.service';
import { CreateInstitutionDto, UpdateInstitutionDto, UpdateInstitutionConfigDto } from './dto/institution.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { PERMISSIONS } from '@common/permissions';

@ApiTags('Institutions')
@Controller('institutions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class InstitutionController {
  constructor(private readonly institutionService: InstitutionService) {}

  @Post()
  @RequirePermission(PERMISSIONS.INSTITUTION_UPDATE)
  create(@Body() dto: CreateInstitutionDto) {
    return this.institutionService.create(dto);
  }

  @Get()
  @RequirePermission(
    PERMISSIONS.INSTITUTION_VIEW,
    PERMISSIONS.ENROLLMENTS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  )
  findAll() {
    return this.institutionService.findAll();
  }

  @Get(':id')
  @RequirePermission(
    PERMISSIONS.INSTITUTION_VIEW,
    PERMISSIONS.ENROLLMENTS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  )
  findOne(@Param('id') id: string) {
    return this.institutionService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.INSTITUTION_UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateInstitutionDto) {
    return this.institutionService.update(id, dto);
  }

  @Patch(':id/config')
  @RequirePermission(PERMISSIONS.INSTITUTION_UPDATE)
  updateConfig(@Param('id') id: string, @Body() dto: UpdateInstitutionConfigDto) {
    return this.institutionService.updateConfig(id, dto);
  }

  @Patch(':id/logo')
  @RequirePermission(PERMISSIONS.INSTITUTION_UPDATE)
  setLogo(@Param('id') id: string, @Body('logoUrl') logoUrl: string) {
    return this.institutionService.setLogo(id, logoUrl);
  }

  @Patch(':id/deactivate')
  @RequirePermission(PERMISSIONS.INSTITUTION_UPDATE)
  deactivate(@Param('id') id: string) {
    return this.institutionService.deactivate(id);
  }
}