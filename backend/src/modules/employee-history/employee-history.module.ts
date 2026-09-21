import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeHistory } from './entities/employee-history.entity';
import { EmployeeHistoryService } from './employee-history.service';
import { EmployeeHistoryController } from './employee-history.controller';
import { EmployeeModule } from '@modules/employee/employee.module';
import { CareerModule } from '@modules/career/career.module';
import { AcademicPeriodModule } from '@modules/academic-period/academic-period.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeHistory]),
    EmployeeModule,
    CareerModule,
    AcademicPeriodModule,
  ],
  controllers: [EmployeeHistoryController],
  providers: [EmployeeHistoryService],
  exports: [EmployeeHistoryService],
})
export class EmployeeHistoryModule {}
