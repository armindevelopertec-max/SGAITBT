import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ParallelService } from './parallel.service';
import { CreateParallelDto, UpdateParallelDto } from './dto/parallel.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { PERMISSIONS } from '@common/permissions';

@ApiTags('Parallels')
@Controller('parallels')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ParallelController {
  constructor(private readonly parallelService: ParallelService) {}

  @Post()
  @RequirePermission(PERMISSIONS.PARALLELS_CREATE)
  create(@Body() dto: CreateParallelDto) {
    return this.parallelService.create(dto);
  }

  @Get()
  @RequirePermission(PERMISSIONS.PARALLELS_VIEW)
  findAll(@Query('academicPeriodId') academicPeriodId?: string) {
    return this.parallelService.findAll(academicPeriodId);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.PARALLELS_VIEW)
  findOne(@Param('id') id: string) {
    return this.parallelService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.PARALLELS_UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateParallelDto) {
    return this.parallelService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.PARALLELS_DELETE)
  remove(@Param('id') id: string) {
    return this.parallelService.remove(id);
  }
}
