import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DepositService } from './deposit.service';
import { CreateDepositDto, UpdateDepositDto, VerifyDepositDto, DepositQueryDto } from './dto/deposit.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums';
import { User } from '@modules/user/entities/user.entity';

@ApiTags('Deposits')
@Controller('deposits')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DepositController {
  constructor(private readonly depositService: DepositService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  create(@Body() dto: CreateDepositDto) {
    return this.depositService.create(dto);
  }

  @Get()
  findAll(@Query() query: DepositQueryDto) {
    return this.depositService.findAll(query);
  }

  @Get('counts/by-status')
  countByStatus() {
    return this.depositService.countByStatus();
  }

  @Get('total')
  totalDeposits() {
    return this.depositService.totalDeposits();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.depositService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  update(@Param('id') id: string, @Body() dto: UpdateDepositDto) {
    return this.depositService.update(id, dto);
  }

  @Patch(':id/verify')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  verify(
    @Param('id') id: string,
    @Body() dto: VerifyDepositDto,
    @CurrentUser() user: User,
  ) {
    return this.depositService.verify(id, dto, user.fullName);
  }
}