import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { SubjectEnrollment } from '@modules/subject-assignment/entities/subject-enrollment.entity';
import { SubjectAssignment } from '@modules/subject-assignment/entities/subject-assignment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, SubjectEnrollment, SubjectAssignment]),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}