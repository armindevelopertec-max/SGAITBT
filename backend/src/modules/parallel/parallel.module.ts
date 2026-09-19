import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parallel } from './entities/parallel.entity';
import { ParallelService } from './parallel.service';
import { ParallelController } from './parallel.controller';
import { SubjectAssignment } from '../subject-assignment/entities/subject-assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Parallel, SubjectAssignment])],
  controllers: [ParallelController],
  providers: [ParallelService],
  exports: [ParallelService],
})
export class ParallelModule {}
