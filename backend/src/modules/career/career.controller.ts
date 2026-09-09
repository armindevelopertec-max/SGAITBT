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
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums';

@ApiTags('Careers')
@Controller('careers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CareerController {
  constructor(private readonly careerService: CareerService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
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
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  update(@Param('id') id: string, @Body() dto: UpdateCareerDto) {
    return this.careerService.update(id, dto);
  }

  @Patch(':id/toggle-state')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  toggleState(@Param('id') id: string) {
    return this.careerService.toggleState(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  deactivate(@Param('id') id: string) {
    return this.careerService.deactivate(id);
  }
}