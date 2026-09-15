import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { Person } from '@modules/person/entities/person.entity';
import { EmployeeService } from './employee.service';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Person])],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}