import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubjectAssignment } from './entities/subject-assignment.entity';
import { SubjectEnrollment } from './entities/subject-enrollment.entity';
import { SubjectAssignmentService } from './subject-assignment.service';
import { SubjectAssignmentController } from './subject-assignment.controller';
import { Subject } from '@modules/subject/entities/subject.entity';
import { AcademicPeriod } from '@modules/academic-period/entities/academic-period.entity';
import { Enrollment } from '@modules/enrollment/entities/enrollment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubjectAssignment,
      SubjectEnrollment,
      Subject,
      AcademicPeriod,
      Enrollment,
    ]),
  ],
  controllers: [SubjectAssignmentController],
  providers: [SubjectAssignmentService],
  exports: [SubjectAssignmentService],
})
export class SubjectAssignmentModule {}