import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Institution } from './entities/institution.entity';
import { InstitutionService } from './institution.service';
import { InstitutionController } from './institution.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Institution])],
  controllers: [InstitutionController],
  providers: [InstitutionService],
  exports: [InstitutionService],
})
export class InstitutionModule {}