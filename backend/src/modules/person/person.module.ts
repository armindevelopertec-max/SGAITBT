import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Person } from './entities/person.entity';
import { PersonService } from './person.service';
import { PersonController } from './person.controller';
import { AuditModule } from '@modules/audit/audit.module';
import { PersonHistoryModule } from '@modules/person-history/person-history.module';

@Module({
  imports: [TypeOrmModule.forFeature([Person]), AuditModule, forwardRef(() => PersonHistoryModule)],
  providers: [PersonService],
  controllers: [PersonController],
  exports: [PersonService, TypeOrmModule],
})
export class PersonModule {}