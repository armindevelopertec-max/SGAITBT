import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { GradeHistoryService } from './grade-history.service';
import { GradeHistoryQueryDto } from './dto/grade-history.dto';

@Controller('grade-history')
export class GradeHistoryController {
  constructor(private readonly service: GradeHistoryService) {}

  @Get()
  findAll(@Query() query: GradeHistoryQueryDto) {
    return this.service.findAll(query);
  }

  @Get('grade/:gradeId')
  findByGrade(@Param('gradeId', ParseUUIDPipe) gradeId: string) {
    return this.service.findByGrade(gradeId);
  }

  @Get('student/:studentId')
  findByStudent(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.service.findByStudent(studentId);
  }
}
