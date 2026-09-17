import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { Person } from '@modules/person/entities/person.entity';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { AuditModule } from '@modules/audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Person]), AuditModule],
  providers: [EmployeeService],
  controllers: [EmployeeController],
  exports: [EmployeeService],
})
export class EmployeeModule {}