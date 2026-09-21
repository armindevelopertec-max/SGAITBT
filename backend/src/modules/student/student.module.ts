import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { Career } from '@modules/career/entities/career.entity';
import { AcademicPeriod } from '@modules/academic-period/entities/academic-period.entity';
import { UserModule } from '@modules/user/user.module';
import { PersonModule } from '@modules/person/person.module';
import { StudentStatusHistoryModule } from '@modules/student-status-history/student-status-history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Career, AcademicPeriod]),
    UserModule,
    PersonModule,
    forwardRef(() => StudentStatusHistoryModule),
  ],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}