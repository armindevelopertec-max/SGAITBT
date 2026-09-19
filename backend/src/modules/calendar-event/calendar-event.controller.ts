import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CalendarEventService } from './calendar-event.service';
import {
  CalendarEventQueryDto,
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
} from './dto/calendar-event.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { PERMISSIONS } from '@common/permissions';

@ApiTags('Calendar Events')
@Controller('calendar-events')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class CalendarEventController {
  constructor(private readonly eventService: CalendarEventService) {}

  @Post()
  @RequirePermission(PERMISSIONS.CALENDAR_CREATE)
  create(@Body() dto: CreateCalendarEventDto) {
    return this.eventService.create(dto);
  }

  @Get()
  @RequirePermission(PERMISSIONS.CALENDAR_VIEW, PERMISSIONS.PERIODS_VIEW)
  findAll(@Query() query: CalendarEventQueryDto) {
    return this.eventService.findAll(query);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.CALENDAR_VIEW, PERMISSIONS.PERIODS_VIEW)
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.CALENDAR_UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateCalendarEventDto) {
    return this.eventService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.CALENDAR_DELETE)
  remove(@Param('id') id: string) {
    return this.eventService.remove(id);
  }
}
