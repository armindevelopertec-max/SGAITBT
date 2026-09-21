import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentStatusHistory } from './entities/student-status-history.entity';
import { StudentStatusHistoryService } from './student-status-history.service';
import { StudentStatusHistoryController } from './student-status-history.controller';
import { StudentModule } from '@modules/student/student.module';
import { AcademicPeriodModule } from '@modules/academic-period/academic-period.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentStatusHistory]),
    forwardRef(() => StudentModule),
    AcademicPeriodModule,
  ],
  controllers: [StudentStatusHistoryController],
  providers: [StudentStatusHistoryService],
  exports: [StudentStatusHistoryService],
})
export class StudentStatusHistoryModule {}
