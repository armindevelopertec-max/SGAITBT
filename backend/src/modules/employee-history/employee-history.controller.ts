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
  CreateEmployeeHistoryDto,
  UpdateEmployeeHistoryDto,
  EmployeeHistoryQueryDto,
} from './dto/employee-history.dto';
import { EmployeeHistoryService } from './employee-history.service';

@Controller('employee-history')
export class EmployeeHistoryController {
  constructor(private readonly service: EmployeeHistoryService) {}

  @Post()
  create(@Body() dto: CreateEmployeeHistoryDto) {
    return this.service.create(dto);
  }

  @Post('bulk')
  createBulk(@Body() dtos: CreateEmployeeHistoryDto[]) {
    return this.service.createBulk(dtos);
  }

  @Get()
  findAll(@Query() query: EmployeeHistoryQueryDto) {
    return this.service.findAll(query);
  }

  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId', ParseUUIDPipe) employeeId: string) {
    return this.service.findByEmployee(employeeId);
  }

  @Get('period/:periodId')
  findByPeriod(@Param('periodId', ParseUUIDPipe) periodId: string) {
    return this.service.findByPeriod(periodId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeHistoryDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
