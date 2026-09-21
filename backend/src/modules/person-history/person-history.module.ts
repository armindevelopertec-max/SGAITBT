import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonHistory } from './entities/person-history.entity';
import { PersonHistoryService } from './person-history.service';
import { PersonHistoryController } from './person-history.controller';
import { PersonModule } from '@modules/person/person.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PersonHistory]),
    forwardRef(() => PersonModule),
  ],
  controllers: [PersonHistoryController],
  providers: [PersonHistoryService],
  exports: [PersonHistoryService],
})
export class PersonHistoryModule {}
