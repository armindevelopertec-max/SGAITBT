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
import { UserService } from './user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  ResetPasswordDto,
  UserQueryDto,
} from './dto/user.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums';
import { User } from './entities/user.entity';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Post('student/:studentId')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  createStudentUser(@Param('studentId') studentId: string) {
    return this.userService.createStudentUser(studentId);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query() query: UserQueryDto) {
    return this.userService.findAll(query);
  }

  @Get('role/:role')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  findByRole(@Param('role') role: UserRole) {
    return this.userService.findByRole(role);
  }

  @Get('counts/by-role')
  @Roles(UserRole.ADMIN)
  countByRole() {
    return this.userService.countByRole();
  }

  @Get('me')
  findMe(@CurrentUser() user: User) {
    return this.userService.findOne(user.id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SECRETARY)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Patch(':id/reset-password')
  @Roles(UserRole.ADMIN)
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.userService.resetPassword(id, dto);
  }
}