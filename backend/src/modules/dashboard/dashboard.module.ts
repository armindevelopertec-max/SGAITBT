import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Student } from '@modules/student/entities/student.entity';
import { Enrollment } from '@modules/enrollment/entities/enrollment.entity';
import { Deposit } from '@modules/deposit/entities/deposit.entity';
import { User } from '@modules/user/entities/user.entity';
import { Subject } from '@modules/subject/entities/subject.entity';
import { Career } from '@modules/career/entities/career.entity';
import { AcademicHistory } from '@modules/academic-history/entities/academic-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Enrollment,
      Deposit,
      User,
      Subject,
      Career,
      AcademicHistory,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}