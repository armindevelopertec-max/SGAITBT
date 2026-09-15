import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { Student } from '@modules/student/entities/student.entity';
import { RbacModule } from '@modules/rbac/rbac.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Student]), RbacModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}