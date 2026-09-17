import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import {
  CreateEmployeeDto,
  EmployeeQueryDto,
  UpdateEmployeeDto,
} from './dto/employee.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { Audit } from '@common/decorators/audit.decorator';
import { PERMISSIONS } from '@common/permissions';

@ApiTags('Employees')
@Controller('employees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @RequirePermission(PERMISSIONS.EMPLOYEES_CREATE)
  @Audit({ module: 'employees', action: 'CREATE', entityType: 'Employee' })
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeeService.createEmployee(dto);
  }

  @Get()
  @RequirePermission(PERMISSIONS.EMPLOYEES_VIEW, PERMISSIONS.ASSIGNMENTS_VIEW)
  findAll(@Query() query: EmployeeQueryDto) {
    return this.employeeService.findAll(query);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.EMPLOYEES_VIEW, PERMISSIONS.ASSIGNMENTS_VIEW)
  findOne(@Param('id') id: string) {
    return this.employeeService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.EMPLOYEES_UPDATE)
  @Audit({ module: 'employees', action: 'UPDATE', entityType: 'Employee', entityIdFrom: 'params' })
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeeService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.EMPLOYEES_DELETE)
  @Audit({ module: 'employees', action: 'DELETE', entityType: 'Employee', entityIdFrom: 'params' })
  deactivate(@Param('id') id: string) {
    return this.employeeService.deactivate(id);
  }
}