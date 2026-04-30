import { Module } from '@nestjs/common';
import { MosquesModule } from '../mosques/mosques.module';
import { AidRecordsController } from './aid-records.controller';
import { AidRecordsService } from './aid-records.service';

@Module({
  imports: [MosquesModule],
  controllers: [AidRecordsController],
  providers: [AidRecordsService],
})
export class AidRecordsModule {}

