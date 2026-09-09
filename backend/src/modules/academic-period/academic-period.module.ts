import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicPeriod } from './entities/academic-period.entity';
import { AcademicPeriodService } from './academic-period.service';
import { AcademicPeriodController } from './academic-period.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicPeriod])],
  controllers: [AcademicPeriodController],
  providers: [AcademicPeriodService],
  exports: [AcademicPeriodService],
})
export class AcademicPeriodModule {}