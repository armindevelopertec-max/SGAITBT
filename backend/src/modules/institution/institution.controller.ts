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
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums';

@ApiTags('Institutions')
@Controller('institutions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InstitutionController {
  constructor(private readonly institutionService: InstitutionService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateInstitutionDto) {
    return this.institutionService.create(dto);
  }

  @Get()
  findAll() {
    return this.institutionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.institutionService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateInstitutionDto) {
    return this.institutionService.update(id, dto);
  }

  @Patch(':id/config')
  @Roles(UserRole.ADMIN)
  updateConfig(@Param('id') id: string, @Body() dto: UpdateInstitutionConfigDto) {
    return this.institutionService.updateConfig(id, dto);
  }

  @Patch(':id/logo')
  @Roles(UserRole.ADMIN)
  setLogo(@Param('id') id: string, @Body('logoUrl') logoUrl: string) {
    return this.institutionService.setLogo(id, logoUrl);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  deactivate(@Param('id') id: string) {
    return this.institutionService.deactivate(id);
  }
}