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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PersonService } from './person.service';
import { CreatePersonDto, PersonQueryDto, UpdatePersonDto } from './dto/person.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { RequirePermission } from '@common/decorators/require-permission.decorator';
import { Audit } from '@common/decorators/audit.decorator';
import { PERMISSIONS } from '@common/permissions';

@ApiTags('Persons')
@Controller('persons')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Post()
  @RequirePermission(PERMISSIONS.PERSONS_CREATE)
  @Audit({ module: 'persons', action: 'CREATE', entityType: 'Person' })
  create(@Body() dto: CreatePersonDto) {
    return this.personService.create(dto);
  }

  @Get()
  @RequirePermission(PERMISSIONS.PERSONS_VIEW)
  findAll(@Query() query: PersonQueryDto) {
    return this.personService.findAll(query);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.PERSONS_VIEW)
  findOne(@Param('id') id: string) {
    return this.personService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.PERSONS_UPDATE)
  @Audit({ module: 'persons', action: 'UPDATE', entityType: 'Person', entityIdFrom: 'params' })
  update(@Param('id') id: string, @Body() dto: UpdatePersonDto) {
    return this.personService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.PERSONS_DELETE)
  @Audit({ module: 'persons', action: 'DELETE', entityType: 'Person', entityIdFrom: 'params' })
  deactivate(@Param('id') id: string) {
    return this.personService.deactivate(id);
  }
}