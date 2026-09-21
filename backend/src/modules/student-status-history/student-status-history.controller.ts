import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { StudentStatusHistoryService } from './student-status-history.service';
import { StudentStatusHistoryQueryDto } from './dto/student-status-history.dto';

@Controller('student-status-history')
export class StudentStatusHistoryController {
  constructor(private readonly service: StudentStatusHistoryService) {}

  @Get()
  findAll(@Query() query: StudentStatusHistoryQueryDto) {
    return this.service.findAll(query);
  }

  @Get('student/:studentId')
  findByStudent(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.service.findByStudent(studentId);
  }

  @Get('period/:periodId')
  findByPeriod(@Param('periodId', ParseUUIDPipe) periodId: string) {
    return this.service.findByPeriod(periodId);
  }

  @Get('student/:studentId/period/:periodId')
  getStatusAtPeriod(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('periodId', ParseUUIDPipe) periodId: string,
  ) {
    return this.service.getStatusAtPeriod(studentId, periodId);
  }
}
