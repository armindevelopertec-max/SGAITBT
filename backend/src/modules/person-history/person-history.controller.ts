import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { PersonHistoryService } from './person-history.service';
import { PersonHistoryQueryDto } from './dto/person-history.dto';

@Controller('person-history')
export class PersonHistoryController {
  constructor(private readonly service: PersonHistoryService) {}

  @Get()
  findAll(@Query() query: PersonHistoryQueryDto) {
    return this.service.findAll(query);
  }

  @Get('person/:personId')
  findByPerson(@Param('personId', ParseUUIDPipe) personId: string) {
    return this.service.findByPerson(personId);
  }

  @Get('person/:personId/field/:fieldChanged')
  findByField(
    @Param('personId', ParseUUIDPipe) personId: string,
    @Param('fieldChanged') fieldChanged: string,
  ) {
    return this.service.findByField(personId, fieldChanged);
  }

  @Get('person/:personId/field/:fieldChanged/history')
  getFieldHistory(
    @Param('personId', ParseUUIDPipe) personId: string,
    @Param('fieldChanged') fieldChanged: string,
  ) {
    return this.service.getFieldHistory(personId, fieldChanged);
  }
}
