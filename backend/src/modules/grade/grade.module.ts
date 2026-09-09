import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grade } from './entities/grade.entity';
import { GradeService } from './grade.service';
import { GradeController } from './grade.controller';
import { SubjectAssignment } from '@modules/subject-assignment/entities/subject-assignment.entity';
import { SubjectEnrollment } from '@modules/subject-assignment/entities/subject-enrollment.entity';
import { AcademicHistory } from '@modules/academic-history/entities/academic-history.entity';
import { Student } from '@modules/student/entities/student.entity';
import { Career } from '@modules/career/entities/career.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Grade,
      SubjectAssignment,
      SubjectEnrollment,
      AcademicHistory,
      Student,
      Career,
    ]),
  ],
  controllers: [GradeController],
  providers: [GradeService],
  exports: [GradeService],
})
export class GradeModule {}