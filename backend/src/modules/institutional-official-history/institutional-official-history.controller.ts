import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  CreateInstitutionalOfficialHistoryDto,
  UpdateInstitutionalOfficialHistoryDto,
  InstitutionalOfficialHistoryQueryDto,
} from './dto/institutional-official-history.dto';
import { InstitutionalOfficialHistoryService } from './institutional-official-history.service';
import { OfficialType } from '@common/enums';

@Controller('institutional-official-history')
export class InstitutionalOfficialHistoryController {
  constructor(
    private readonly service: InstitutionalOfficialHistoryService,
  ) {}

  @Post()
  create(@Body() dto: CreateInstitutionalOfficialHistoryDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: InstitutionalOfficialHistoryQueryDto) {
    return this.service.findAll(query);
  }

  @Get('current/:type')
  findCurrentByType(
    @Param('type') type: OfficialType,
    @Query('careerId') careerId?: string,
  ) {
    return this.service.findCurrentByType(type, careerId);
  }

  @Get('period/:type/:gestion')
  findByPeriod(
    @Param('type') type: OfficialType,
    @Param('gestion') gestion: string,
    @Query('careerId') careerId?: string,
  ) {
    return this.service.findByPeriod(type, gestion, careerId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInstitutionalOfficialHistoryDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/end-tenure')
  endTenure(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.endTenure(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
