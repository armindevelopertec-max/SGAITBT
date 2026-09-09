import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deposit } from './entities/deposit.entity';
import { DepositService } from './deposit.service';
import { DepositController } from './deposit.controller';
import { Student } from '@modules/student/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Deposit, Student])],
  controllers: [DepositController],
  providers: [DepositService],
  exports: [DepositService],
})
export class DepositModule {}