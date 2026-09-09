import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicHistory } from './entities/academic-history.entity';
import { AcademicHistoryService } from './academic-history.service';
import { AcademicHistoryController } from './academic-history.controller';
import { Student } from '@modules/student/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicHistory, Student])],
  controllers: [AcademicHistoryController],
  providers: [AcademicHistoryService],
  exports: [AcademicHistoryService],
})
export class AcademicHistoryModule {}