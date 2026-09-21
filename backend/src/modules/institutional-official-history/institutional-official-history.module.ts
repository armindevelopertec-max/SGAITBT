import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstitutionalOfficialHistory } from './entities/institutional-official-history.entity';
import { InstitutionalOfficialHistoryService } from './institutional-official-history.service';
import { InstitutionalOfficialHistoryController } from './institutional-official-history.controller';
import { PersonModule } from '@modules/person/person.module';
import { EmployeeModule } from '@modules/employee/employee.module';
import { CareerModule } from '@modules/career/career.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InstitutionalOfficialHistory]),
    PersonModule,
    EmployeeModule,
    CareerModule,
  ],
  controllers: [InstitutionalOfficialHistoryController],
  providers: [InstitutionalOfficialHistoryService],
  exports: [InstitutionalOfficialHistoryService],
})
export class InstitutionalOfficialHistoryModule {}
