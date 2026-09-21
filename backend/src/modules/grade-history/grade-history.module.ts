import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradeHistory } from './entities/grade-history.entity';
import { GradeHistoryService } from './grade-history.service';
import { GradeHistoryController } from './grade-history.controller';
import { GradeModule } from '@modules/grade/grade.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GradeHistory]),
    forwardRef(() => GradeModule),
  ],
  controllers: [GradeHistoryController],
  providers: [GradeHistoryService],
  exports: [GradeHistoryService],
})
export class GradeHistoryModule {}
